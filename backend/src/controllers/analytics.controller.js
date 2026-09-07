import User from "../model/user.js";
import MockTestResult from "../model/mockTestResult.js";
import PracticeSubmission from "../model/practiceSubmission.js";
import VisitorLog from "../model/visitorLog.js";
import admin from "../lib/firebase.config.js";
import { cache } from "../utils/cache.js";
import { resolveLocation, parseUserAgent, getCountryName } from "../utils/geoLookup.js";

// Helper: Estimate Band based on percentage
const estimateBand = (percentage) => {
  if (percentage >= 90) return 8.5;
  if (percentage >= 80) return 7.5;
  if (percentage >= 70) return 6.5;
  if (percentage >= 60) return 6.0;
  if (percentage >= 50) return 5.5;
  return 5.0;
};

// Helper: Calculate Streak
const getStudyStreak = (dates = []) => {
  if (!dates.length) return 0;
  const sorted = [...new Set(dates.map(d => new Date(d).toDateString()))]
    .map(d => new Date(d))
    .sort((a, b) => b - a);

  let streak = 0;
  let today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if they studied today or yesterday to continue streak
  const lastStudy = sorted[0];
  const diffToToday = Math.floor((today - lastStudy) / (1000 * 60 * 60 * 24));
  
  if (diffToToday > 1) return 0;

  streak = 1;
  for (let i = 0; i < sorted.length - 1; i++) {
    const diff = Math.floor((sorted[i] - sorted[i+1]) / (1000 * 60 * 60 * 24));
    if (diff === 1) streak++;
    else break;
  }
  return streak;
};

export const getAnalyticsSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch all completed mock tests for this user
    const results = await MockTestResult.find({ 
      userId, 
      status: 'completed' 
    }).sort({ createdAt: -1 });

    // Fetch all separate practice submissions for this user
    const practices = await PracticeSubmission.find({ userId }).sort({ createdAt: -1 });

    const totalTests = results.length;
    const totalPractices = practices.length;
    
    // Calculate Accuracy from Reading/Listening sections of mock tests
    let totalCorrect = 0;
    let totalQuestions = 0;
    const allAttempts = [];

    results.forEach(result => {
        let testScore = 0;
        let testQuestions = 0;

        result.sectionResults.forEach(section => {
            if (['reading', 'listening'].includes(section.sectionType) && section.isGraded) {
                totalCorrect += section.score || 0;
                const questionCount = section.answers?.length || 0;
                totalQuestions += questionCount; 

                testScore += section.score || 0;
                testQuestions += questionCount;
            }
        });

        allAttempts.push({
            date: result.createdAt,
            testName: "Mock Test",
            accuracy: testQuestions > 0 ? Math.round((testScore / testQuestions) * 100) : null,
            band: estimateBand(testQuestions > 0 ? (testScore / testQuestions) * 100 : 0)
        });
    });

    // Include reviewed practices in attempts
    practices.forEach(practice => {
        if (practice.status === 'reviewed' && practice.bandScore) {
            const band = parseFloat(practice.bandScore);
            if (!isNaN(band)) {
                allAttempts.push({
                    date: practice.createdAt,
                    testName: `Practice: ${practice.testType.charAt(0).toUpperCase() + practice.testType.slice(1)}`,
                    accuracy: null, // Subjective tests do not have a question-based accuracy percentage
                    band: band
                });
            }
        }
    });

    // Sort all attempts by date descending and take top 5
    allAttempts.sort((a, b) => new Date(b.date) - new Date(a.date));
    const recentAttempts = allAttempts.slice(0, 5);

    const averageAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    // Gather all practice & mock test dates to calculate a unified study streak
    const allPracticeDates = [
      ...results.map(r => r.createdAt),
      ...practices.map(p => p.createdAt)
    ];

    // 1. Gather Reading scores
    let readingScoresSum = 0;
    let readingCount = 0;
    
    // 2. Gather Listening scores
    let listeningScoresSum = 0;
    let listeningCount = 0;
    
    // 3. Gather Writing band scores
    let writingBandsSum = 0;
    let writingCount = 0;
    
    // 4. Gather Speaking band scores
    let speakingBandsSum = 0;
    let speakingCount = 0;

    results.forEach(result => {
        result.sectionResults.forEach(section => {
            if (section.isGraded && section.score !== undefined && section.score !== null) {
                if (section.sectionType === 'reading') {
                    readingScoresSum += section.score;
                    readingCount++;
                } else if (section.sectionType === 'listening') {
                    listeningScoresSum += section.score;
                    listeningCount++;
                } else if (section.sectionType === 'writing') {
                    writingBandsSum += section.score; // subjective sections store band score in score
                    writingCount++;
                } else if (section.sectionType === 'speaking') {
                    speakingBandsSum += section.score; // subjective sections store band score in score
                    speakingCount++;
                }
            }
        });
    });

    practices.forEach(practice => {
        if (practice.status === 'reviewed' && practice.bandScore) {
            const band = parseFloat(practice.bandScore);
            if (!isNaN(band)) {
                if (practice.testType === 'writing') {
                    writingBandsSum += band;
                    writingCount++;
                } else if (practice.testType === 'speaking') {
                    speakingBandsSum += band;
                    speakingCount++;
                }
            }
        }
    });

    // Calculate performance percentages (defaulting to friendly realistic baselines if no data is available yet)
    const listeningPct = listeningCount > 0 ? Math.round((listeningScoresSum / (listeningCount * 40)) * 100) : 60;
    const readingPct = readingCount > 0 ? Math.round((readingScoresSum / (readingCount * 40)) * 100) : 65;
    const writingPct = writingCount > 0 ? Math.round((writingBandsSum / (writingCount * 9)) * 100) : 58;
    const speakingPct = speakingCount > 0 ? Math.round((speakingBandsSum / (speakingCount * 9)) * 100) : 62;

    const weakAreas = [
        { title: "Listening Skills", percentage: listeningPct },
        { title: "Reading Analysis", percentage: readingPct },
        { title: "Writing Cohesion", percentage: writingPct },
        { title: "Speaking Fluency", percentage: speakingPct }
    ];

    // Sort weakAreas ascending so the weakest ones appear first
    weakAreas.sort((a, b) => a.percentage - b.percentage);

    // Select the absolute weakest skill
    const weakest = weakAreas[0];
    let smartTip = "Welcome to MOCKEA! Start taking full mock tests or standalone section practices to build your IELTS insights.";
    
    if (results.length > 0 || practices.length > 0) {
        if (weakest.title === "Listening Skills") {
            smartTip = `Your Listening accuracy is currently at ${weakest.percentage}%. Focus on active listening by predicting the answer type (noun, number, date) before the audio plays.`;
        } else if (weakest.title === "Reading Analysis") {
            smartTip = `Reading is your primary growth zone (${weakest.percentage}%). Try skimming the passage first to capture general meaning, then scan specific paragraphs for key vocabulary.`;
        } else if (weakest.title === "Writing Cohesion") {
            smartTip = `Your Writing scores average around ${weakest.percentage}%. Try practicing task-response structure and using a wide variety of linking words to improve coherence.`;
        } else {
            smartTip = `To boost your Speaking score (currently ${weakest.percentage}%), record yourself doing 2-minute mock speaking sessions daily to improve natural flow and reduce pauses.`;
        }
    }

    return res.status(200).json({
      success: true,
      summary: {
        averageAccuracy,
        estimatedBand: estimateBand(averageAccuracy),
        testsCompleted: totalTests,
        practicesCompleted: totalPractices,
        studyStreak: getStudyStreak(allPracticeDates),
        recentAttempts,
        weakAreas,
        smartTip
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching analytics",
      error: error.message,
    });
  }
};

export const getAdminAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalResults = await MockTestResult.countDocuments({ status: 'completed' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usersToday = await User.countDocuments({ createdAt: { $gte: today } });
    const testsToday = await MockTestResult.countDocuments({ createdAt: { $gte: today }, status: 'completed' });

    // Top Students by test count
    const topStudents = await MockTestResult.aggregate([
        { $match: { status: 'completed' } },
        { $group: { 
            _id: "$userId", 
            testCount: { $sum: 1 },
            lastAttempt: { $max: "$createdAt" }
        }},
        { $sort: { testCount: -1 } },
        { $limit: 5 },
        { $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user"
        }},
        { $unwind: "$user" },
        { $project: {
            name: "$user.name",
            email: "$user.email",
            testCount: 1,
            lastAttempt: 1
        }}
    ]);

    return res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalTests: totalResults,
          usersToday,
          testsToday,
        },
        studentStats: topStudents,
        recentActivity: await MockTestResult.find()
            .populate('userId', 'name')
            .sort({ createdAt: -1 })
            .limit(10)
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching admin analytics",
      error: error.message,
    });
  }
};

export const getInstructorAnalytics = async (req, res) => {
  try {
    const instructorEmail = req.decoded_email;
    const instructor = await User.findOne({ email: instructorEmail });

    if (!instructor) {
        return res.status(404).json({ success: false, message: "Instructor not found" });
    }

    // 1. Total Reviews Done (Practice Submissions)
    const totalPracticeReviews = await PracticeSubmission.countDocuments({ 
        reviewedBy: instructor._id,
        status: 'reviewed'
    });

    // 2. Total Reviews Done (Mock Tests - sections)
    const mockTestsWithInstructorGrades = await MockTestResult.find({
        'sectionResults.reviewedBy': instructor._id
    });

    let totalMockSectionsReviews = 0;
    mockTestsWithInstructorGrades.forEach(test => {
        test.sectionResults.forEach(section => {
            if (section.reviewedBy && section.reviewedBy.toString() === instructor._id.toString()) {
                totalMockSectionsReviews++;
            }
        });
    });

    // 3. Pending Reviews (Global)
    const pendingPractice = await PracticeSubmission.countDocuments({ status: 'pending' });
    const pendingMock = await MockTestResult.countDocuments({ 
        status: 'completed',
        'sectionResults': { $elemMatch: { isGraded: false } }
    });

    // 4. Recent Activity
    const recentPractice = await PracticeSubmission.find({ 
        reviewedBy: instructor._id,
        status: 'reviewed'
    }).sort({ reviewedAt: -1 }).limit(5);

    return res.status(200).json({
      success: true,
      analytics: {
        totalReviews: totalPracticeReviews + totalMockSectionsReviews,
        practiceReviews: totalPracticeReviews,
        mockReviews: totalMockSectionsReviews,
        globalPending: pendingPractice + pendingMock,
        recentActivity: recentPractice.map(p => ({
            type: 'practice',
            studentName: p.userName,
            testType: p.testType,
            date: p.reviewedAt
        }))
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching instructor analytics",
      error: error.message,
    });
  }
};

export const getInstructorPerformance = async (req, res) => {
  try {
    const instructors = await User.find({ role: 'instructor' });
    const performanceData = [];

    for (const inst of instructors) {
      // Practice submissions graded
      const practices = await PracticeSubmission.find({
        reviewedBy: inst._id,
        status: 'reviewed'
      });

      // Mock test results where they graded at least one section
      const mockResults = await MockTestResult.find({
        'sectionResults.reviewedBy': inst._id
      });

      let practiceCount = practices.length;
      let mockCount = 0;
      let totalTatMs = 0;
      let totalScoreSum = 0;
      let scoreCount = 0;

      // Practice calculations
      practices.forEach(p => {
        if (p.reviewedAt && p.createdAt) {
          totalTatMs += (new Date(p.reviewedAt) - new Date(p.createdAt));
        }
        if (p.bandScore) {
          const band = parseFloat(p.bandScore);
          if (!isNaN(band)) {
            totalScoreSum += band;
            scoreCount++;
          }
        }
      });

      // Mock test calculations
      mockResults.forEach(r => {
        r.sectionResults.forEach(sec => {
          if (sec.reviewedBy && sec.reviewedBy.toString() === inst._id.toString() && sec.isGraded) {
            mockCount++;
            
            // Turnaround time: from student completion to tutor grading
            const completed = sec.completedAt || r.createdAt;
            const reviewed = sec.reviewedAt || r.updatedAt;
            if (completed && reviewed) {
              totalTatMs += (new Date(reviewed) - new Date(completed));
            }

            if (sec.score) {
              const scoreVal = parseFloat(sec.score);
              if (!isNaN(scoreVal)) {
                totalScoreSum += scoreVal;
                scoreCount++;
              }
            }
          }
        });
      });

      const totalReviews = practiceCount + mockCount;
      const avgTatHours = totalReviews > 0 ? (totalTatMs / totalReviews) / (1000 * 60 * 60) : 0;
      const avgBandScore = scoreCount > 0 ? totalScoreSum / scoreCount : 0;

      // Currently locked items by this instructor
      const lockedPractice = await PracticeSubmission.countDocuments({
        lockedBy: inst._id,
        lockExpiresAt: { $gt: new Date() }
      });
      const lockedMock = await MockTestResult.countDocuments({
        lockedBy: inst._id,
        lockExpiresAt: { $gt: new Date() }
      });

      performanceData.push({
        _id: inst._id,
        name: inst.name,
        email: inst.email,
        practiceCount,
        mockCount,
        totalReviews,
        avgTatHours: Math.round(avgTatHours * 10) / 10, // Round to 1 decimal place
        avgBandScore: Math.round(avgBandScore * 10) / 10,
        lockedCount: lockedPractice + lockedMock
      });
    }

    return res.status(200).json({
      success: true,
      data: performanceData
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching instructor performance data",
      error: error.message
    });
  }
};

export const trackVisitor = async (req, res) => {
  try {
    const { path, referrer, sessionId, clientCountry, clientTimezone } = req.body || {};
    if (!path) {
      return res.status(200).json({ success: true, message: "Ignored: No path provided" });
    }

    const { ip, country, countryCode, city, region } = resolveLocation(req);
    const { device, browser, os } = parseUserAgent(req.headers["user-agent"]);

    // Effective country: prioritize resolved country, then client country hint if local/unknown
    let finalCountry = country;
    let finalCountryCode = countryCode;
    if ((finalCountryCode === "LOCAL" || finalCountryCode === "UN") && clientCountry) {
      finalCountryCode = clientCountry.toUpperCase();
      finalCountry = getCountryName(finalCountryCode);
    }

    // Debounce check: Prevent duplicate hits from same session & path within 30s
    const debounceKey = `vis:${sessionId || ip}:${path}`;
    const alreadyLogged = await cache.get(debounceKey);
    if (alreadyLogged) {
      return res.status(200).json({ success: true, message: "Visit already recorded recently" });
    }
    // Set 30s debounce TTL in cache
    await cache.set(debounceKey, true, 30);

    // Optional user token identification (soft token decode)
    let userId = null;
    let userEmail = null;
    let userName = null;
    let userRole = "guest";

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = await admin.auth().verifyIdToken(token);
        if (decoded?.email) {
          const user = await User.findOne({ email: decoded.email.toLowerCase().trim() });
          if (user) {
            userId = user._id;
            userEmail = user.email;
            userName = user.name;
            userRole = user.role || "student";

            // Update user's last login country and IP if valid
            if (finalCountryCode !== "UN" && finalCountryCode !== "LOCAL") {
              user.lastLoginCountry = finalCountry;
              user.lastLoginIp = ip;
              if (!user.country) {
                user.country = finalCountry;
                user.countryCode = finalCountryCode;
              }
              await user.save();
            }
          }
        }
      } catch (err) {
        // Soft fail: continue as guest if token expired or invalid
      }
    }

    const log = new VisitorLog({
      ip,
      country: finalCountry,
      countryCode: finalCountryCode,
      city,
      region,
      userId,
      userEmail,
      userName,
      userRole,
      path: path.slice(0, 200),
      referrer: (referrer || "").slice(0, 300),
      device,
      browser,
      os,
      sessionId: sessionId || null,
    });

    await log.save();
    return res.status(201).json({ success: true });
  } catch (error) {
    console.error("Error logging visitor:", error);
    return res.status(200).json({ success: false, message: error.message });
  }
};


