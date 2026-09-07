import User from "../model/user.js";
import MockTestResult from "../model/mockTestResult.js";
import PracticeSubmission from "../model/practiceSubmission.js";
import VisitorLog from "../model/visitorLog.js";
import ErrorLog from "../model/errorLog.js";
import UserChatbotUsage from "../model/userChatbotUsage.js";
import { cache } from "../utils/cache.js";
import { getCountryFlag, getCountryName } from "../utils/geoLookup.js";
import mongoose from "mongoose";

/**
 * Helper to generate empty date buckets for continuous time-series graphs
 */
const generateDateSeries = (days = 7) => {
  const dates = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split("T")[0];
    dates.push(dateStr);
  }
  return dates;
};

/**
 * 1. Comprehensive System & User Analytics Aggregator
 */
export const getSystemAnalytics = async (req, res) => {
  try {
    const range = (req.query.range || "7d").toLowerCase(); // '24h' | '7d' | '30d' | 'all'
    const forceRefresh = req.query.refresh === "true";

    const cacheKey = `sys_analytics:${range}`;

    // Return cached payload if available and forceRefresh is false (60s TTL)
    if (!forceRefresh) {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return res.status(200).json({
          success: true,
          data: cached,
          cached: true,
          cachedAt: cached._meta?.generatedAt || null,
        });
      }
    }

    // Determine time boundary
    const now = new Date();
    let since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    let daysCount = 7;

    if (range === "24h") {
      since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      daysCount = 1;
    } else if (range === "30d") {
      since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      daysCount = 30;
    } else if (range === "all") {
      since = new Date(0); // All time
      daysCount = 60; // Chart last 60 days
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayStr = todayStart.toISOString().split("T")[0];

    // Run parallel multi-collection aggregations
    const [
      totalUsers,
      activeUsersToday,
      newUsersRange,
      roleDistribution,
      planDistribution,
      targetExamDistribution,
      totalMockTests,
      mockTestStatusBreakdown,
      mockTestsToday,
      totalPractices,
      practicesPending,
      antiCheatViolations,
      flaggedAttempts,
      visitorStats,
      topCountriesAgg,
      topCitiesAgg,
      deviceShareAgg,
      browserShareAgg,
      dailyVisitorsAgg,
      dailySignupsAgg,
      dailyTestsAgg,
      sectionScoresAgg,
      chatbotUsageToday,
      recentErrorsCount,
      cacheStats,
    ] = await Promise.all([
      // 1. Total users
      User.countDocuments(),

      // 2. Active users today
      User.countDocuments({ lastActive: { $gte: todayStart } }),

      // 3. New users in range
      User.countDocuments({ createdAt: { $gte: since } }),

      // 4. Role distribution
      User.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } }
      ]),

      // 5. Plan distribution
      User.aggregate([
        { $group: { _id: "$plan", count: { $sum: 1 } } }
      ]),

      // 6. Target exam distribution
      User.aggregate([
        { $group: { _id: "$targetExam", count: { $sum: 1 } } }
      ]),

      // 7. Total mock tests
      MockTestResult.countDocuments(),

      // 8. Mock test status breakdown
      MockTestResult.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),

      // 9. Mock tests completed today
      MockTestResult.countDocuments({ createdAt: { $gte: todayStart }, status: "completed" }),

      // 10. Total practices
      PracticeSubmission.countDocuments(),

      // 11. Practices pending
      PracticeSubmission.countDocuments({ status: "pending" }),

      // 12. Anti-cheat aggregate (tab switches, exits, auto-submits)
      MockTestResult.aggregate([
        {
          $group: {
            _id: null,
            totalTabSwitches: { $sum: "$tabSwitchCount" },
            totalFullscreenExits: { $sum: "$fullscreenExits" },
            autoSubmittedCount: {
              $sum: { $cond: [{ $eq: ["$status", "auto-submitted"] }, 1, 0] },
            },
          },
        },
      ]),

      // 13. Top flagged test attempts
      MockTestResult.find({
        $or: [{ tabSwitchCount: { $gt: 0 } }, { status: "auto-submitted" }],
      })
        .populate("userId", "name email")
        .sort({ tabSwitchCount: -1, createdAt: -1 })
        .limit(6)
        .select("userId tabSwitchCount fullscreenExits status createdAt"),

      // 14. Visitor stats in range (Pageviews & Unique Sessions)
      VisitorLog.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: null,
            totalPageviews: { $sum: 1 },
            uniqueSessions: { $addToSet: "$sessionId" },
            uniqueIps: { $addToSet: "$ip" },
            registeredVisits: {
              $sum: { $cond: [{ $ne: ["$userId", null] }, 1, 0] },
            },
          },
        },
      ]),

      // 15. Top Countries by visits
      VisitorLog.aggregate([
        {
          $match: {
            createdAt: { $gte: since },
            countryCode: { $nin: ["UN", "UNKNOWN"] },
          },
        },
        {
          $group: {
            _id: "$countryCode",
            country: { $first: "$country" },
            visits: { $sum: 1 },
            uniqueSessions: { $addToSet: "$sessionId" },
          },
        },
        {
          $project: {
            countryCode: "$_id",
            country: 1,
            visits: 1,
            uniqueVisitors: { $size: "$uniqueSessions" },
          },
        },
        { $sort: { visits: -1 } },
        { $limit: 10 },
      ]),

      // 16. Top Cities by visits
      VisitorLog.aggregate([
        {
          $match: {
            createdAt: { $gte: since },
            city: { $nin: ["Unknown", "Development", ""] },
          },
        },
        {
          $group: {
            _id: { city: "$city", country: "$country", code: "$countryCode" },
            visits: { $sum: 1 },
          },
        },
        { $sort: { visits: -1 } },
        { $limit: 6 },
      ]),

      // 17. Device share
      VisitorLog.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: "$device", count: { $sum: 1 } } },
      ]),

      // 18. Browser share
      VisitorLog.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: "$browser", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),

      // 19. Daily visitors timeseries
      VisitorLog.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            pageviews: { $sum: 1 },
            sessions: { $addToSet: "$sessionId" },
          },
        },
        {
          $project: {
            date: "$_id",
            pageviews: 1,
            uniqueVisitors: { $size: "$sessions" },
          },
        },
        { $sort: { date: 1 } },
      ]),

      // 20. Daily signups timeseries
      User.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 21. Daily tests completed timeseries
      MockTestResult.aggregate([
        { $match: { createdAt: { $gte: since }, status: "completed" } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 22. Average section band scores
      MockTestResult.aggregate([
        { $match: { status: "completed" } },
        { $unwind: "$sectionResults" },
        { $match: { "sectionResults.score": { $exists: true, $ne: null } } },
        {
          $group: {
            _id: "$sectionResults.sectionType",
            avgScore: { $avg: "$sectionResults.score" },
            totalGraded: { $sum: 1 },
          },
        },
      ]),

      // 23. Chatbot queries today
      UserChatbotUsage.aggregate([
        { $match: { lastUsedDate: todayStr } },
        { $group: { _id: null, totalMessages: { $sum: "$messageCount" } } },
      ]),

      // 24. Recent error count (last 24h)
      ErrorLog.countDocuments({
        createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      }),

      // 25. Cache stats
      cache.getStats(),
    ]);

    // Format timeseries for continuous visual chart curves
    const dateList = generateDateSeries(daysCount);
    const trafficMap = {};
    dailyVisitorsAgg.forEach((d) => {
      trafficMap[d.date] = d;
    });
    const signupsMap = {};
    dailySignupsAgg.forEach((s) => {
      signupsMap[s._id] = s.count;
    });
    const testsMap = {};
    dailyTestsAgg.forEach((t) => {
      testsMap[t._id] = t.count;
    });

    const timeseries = dateList.map((date) => {
      return {
        date: date.slice(5), // MM-DD
        fullDate: date,
        pageviews: trafficMap[date]?.pageviews || 0,
        uniqueVisitors: trafficMap[date]?.uniqueVisitors || 0,
        signups: signupsMap[date] || 0,
        tests: testsMap[date] || 0,
      };
    });

    // Compute total pageviews and unique visitors
    const totalPageviews = visitorStats[0]?.totalPageviews || 0;
    const totalUniqueVisitors = visitorStats[0]?.uniqueSessions?.length || 0;
    const registeredVisits = visitorStats[0]?.registeredVisits || 0;

    // Format top countries with flags and percentages
    const totalCountryVisits = topCountriesAgg.reduce((acc, curr) => acc + curr.visits, 0) || 1;
    const topCountries = topCountriesAgg.map((c) => ({
      countryCode: c.countryCode,
      country: c.country || getCountryName(c.countryCode),
      flag: getCountryFlag(c.countryCode),
      visits: c.visits,
      uniqueVisitors: c.uniqueVisitors,
      percentage: Math.round((c.visits / totalCountryVisits) * 100),
    }));

    // Format top cities
    const topCities = topCitiesAgg.map((c) => ({
      city: c._id.city,
      country: c._id.country,
      flag: getCountryFlag(c._id.code),
      visits: c.visits,
    }));

    // Format role and plan breakdown maps
    const roles = { student: 0, instructor: 0, admin: 0, superadmin: 0 };
    roleDistribution.forEach((r) => {
      if (r._id) roles[r._id] = r.count;
    });

    const plans = { free: 0, standard: 0, premium: 0 };
    planDistribution.forEach((p) => {
      if (p._id) plans[p._id] = p.count;
    });

    const targetExams = { IELTS: 0, PTE: 0, BOTH: 0 };
    targetExamDistribution.forEach((e) => {
      if (e._id) targetExams[e._id] = e.count;
    });

    // Format mock test status
    const mockStatuses = { completed: 0, ongoing: 0, "auto-submitted": 0, terminated: 0 };
    mockTestStatusBreakdown.forEach((s) => {
      if (s._id) mockStatuses[s._id] = s.count;
    });

    // Format section averages (0-9 band scale)
    const sectionAverages = { reading: 6.5, listening: 6.5, writing: 6.0, speaking: 6.0 };
    sectionScoresAgg.forEach((sec) => {
      if (sec._id && sec.avgScore !== undefined) {
        // Round to 1 decimal place
        sectionAverages[sec._id] = Math.round(sec.avgScore * 10) / 10;
      }
    });

    // Server runtime memory
    const mem = process.memoryUsage();
    const serverMemory = {
      rss: `${Math.round(mem.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)} MB`,
      heapPercentage: Math.round((mem.heapUsed / mem.heapTotal) * 100),
      uptimeMinutes: Math.round(process.uptime() / 60),
    };

    const dbStateNames = ["Disconnected", "Connected", "Connecting", "Disconnecting"];
    const dbStatus = dbStateNames[mongoose.connection.readyState] || "Unknown";

    const payload = {
      overview: {
        totalUsers,
        activeUsersToday,
        newUsersRange,
        totalMockTests,
        mockTestsToday,
        totalPractices,
        totalPendingBacklog: practicesPending,
        totalPageviews,
        totalUniqueVisitors,
        registeredVisits,
        topCountry: topCountries[0]?.country || "None yet",
        topCountryFlag: topCountries[0]?.flag || "🌐",
      },
      visitors: {
        topCountries,
        topCities,
        devices: deviceShareAgg.map((d) => ({ name: d._id || "desktop", count: d.count })),
        browsers: browserShareAgg.map((b) => ({ name: b._id || "Other", count: b.count })),
        totalPageviews,
        totalUniqueVisitors,
      },
      timeseries,
      users: {
        roles,
        plans,
        targetExams,
      },
      academic: {
        mockStatuses,
        sectionAverages,
        totalPractices,
        practicesPending,
      },
      antiCheat: {
        totalTabSwitches: antiCheatViolations[0]?.totalTabSwitches || 0,
        totalFullscreenExits: antiCheatViolations[0]?.totalFullscreenExits || 0,
        autoSubmittedCount: antiCheatViolations[0]?.autoSubmittedCount || 0,
        flaggedAttempts,
      },
      infrastructure: {
        dbStatus,
        collectionsCount: Object.keys(mongoose.connection.collections).length,
        serverMemory,
        cacheStats,
        chatbotQueriesToday: chatbotUsageToday[0]?.totalMessages || 0,
        recentErrorsCount,
      },
      _meta: {
        range,
        generatedAt: new Date().toISOString(),
      },
    };

    // Cache computed response in Redis / in-memory for 60 seconds
    await cache.set(cacheKey, payload, 60);

    return res.status(200).json({
      success: true,
      data: payload,
      cached: false,
      cachedAt: payload._meta.generatedAt,
    });
  } catch (error) {
    console.error("Error generating system analytics:", error);
    return res.status(500).json({
      success: false,
      message: "Error generating system analytics",
      error: error.message,
    });
  }
};

/**
 * 2. Real-Time Live Visitor Feed (Latest 30-50 visits)
 */
export const getLiveVisitorFeed = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 30, 50);

    const logs = await VisitorLog.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("ip country countryCode city region path referrer device browser os userRole userName userEmail createdAt");

    const formatted = logs.map((log) => ({
      _id: log._id,
      ip: log.ip,
      country: log.country,
      countryCode: log.countryCode,
      flag: getCountryFlag(log.countryCode),
      city: log.city,
      path: log.path,
      device: log.device,
      browser: log.browser,
      os: log.os,
      userRole: log.userRole,
      userName: log.userName || (log.userRole === "guest" ? "Guest Visitor" : "Student"),
      userEmail: log.userEmail,
      createdAt: log.createdAt,
    }));

    return res.status(200).json({
      success: true,
      logs: formatted,
    });
  } catch (error) {
    console.error("Error fetching live visitor feed:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching live visitor feed",
      error: error.message,
    });
  }
};

/**
 * 3. Export System Analytics Report (JSON or CSV format)
 */
export const exportSystemAnalytics = async (req, res) => {
  try {
    const format = (req.query.format || "json").toLowerCase();

    // Fetch fresh 30-day analytics snapshot
    const [userCount, testCount, practiceCount, visitorCount, topCountries] = await Promise.all([
      User.countDocuments(),
      MockTestResult.countDocuments({ status: "completed" }),
      PracticeSubmission.countDocuments(),
      VisitorLog.countDocuments(),
      VisitorLog.aggregate([
        { $match: { countryCode: { $nin: ["UN", "UNKNOWN"] } } },
        { $group: { _id: "$countryCode", country: { $first: "$country" }, visits: { $sum: 1 } } },
        { $sort: { visits: -1 } },
        { $limit: 15 },
      ]),
    ]);

    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalUsers: userCount,
        completedMockTests: testCount,
        totalPracticeSubmissions: practiceCount,
        totalVisitorLogs: visitorCount,
      },
      topCountries: topCountries.map((c) => ({
        countryCode: c._id,
        countryName: c.country,
        visits: c.visits,
      })),
    };

    if (format === "csv") {
      let csv = "Metric,Value\n";
      csv += `Report Generated At,${report.generatedAt}\n`;
      csv += `Total Registered Users,${report.summary.totalUsers}\n`;
      csv += `Completed Mock Tests,${report.summary.completedMockTests}\n`;
      csv += `Practice Submissions,${report.summary.totalPracticeSubmissions}\n`;
      csv += `Total Visitor Hits,${report.summary.totalVisitorLogs}\n\n`;
      csv += "Country Code,Country Name,Visits\n";
      report.topCountries.forEach((c) => {
        csv += `"${c.countryCode}","${c.countryName}",${c.visits}\n`;
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="mockea_system_analytics_${Date.now()}.csv"`);
      return res.status(200).send(csv);
    }

    return res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("Error exporting system analytics:", error);
    return res.status(500).json({
      success: false,
      message: "Error exporting system analytics",
      error: error.message,
    });
  }
};
