import { useState, useEffect } from "react";
import useAxiosSecure from "../../../../hooks/useAxiosSecure";
import { toast } from "react-toastify";
import { alerts } from "../../../../utils/alerts";
import {
  PiGlobeHemisphereWestBold,
  PiUsersThreeBold,
  PiExamBold,
  PiClockCountdownBold,
  PiCpuBold,
  PiArrowsClockwiseBold,
  PiDownloadSimpleBold,
  PiShieldWarningBold,
  PiMonitorBold,
  PiDeviceMobileBold,
  PiBugBold,
  PiRobotBold,
  PiDatabaseBold,
  PiArrowSquareOutBold,
  PiProhibitBold,
} from "react-icons/pi";
import {
  TimeSeriesChart,
  DonutBreakdown,
  CountryRankingTable,
} from "./analytics/AnalyticsCharts";

const SystemAnalyticsTab = () => {
  const axiosSecure = useAxiosSecure();

  const [range, setRange] = useState("7d");
  const [activeSection, setActiveSection] = useState("visitors"); // 'visitors' | 'academic' | 'antiCheat' | 'infrastructure'
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Live visitor feed state
  const [liveFeed, setLiveFeed] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);

  // Fetch full system analytics
  const fetchAnalytics = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await axiosSecure.get(
        `/superadmin/system-analytics?range=${range}${isRefresh ? "&refresh=true" : ""}`
      );
      if (res.data?.success) {
        setAnalytics(res.data.data);
      }
    } catch (error) {
      console.error("Failed to load system analytics:", error);
      toast.error("Failed to load system analytics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch live visitor activity feed
  const fetchLiveFeed = async () => {
    try {
      setLoadingFeed(true);
      const res = await axiosSecure.get("/superadmin/system-analytics/live-visitors?limit=30");
      if (res.data?.success) {
        setLiveFeed(res.data.logs || []);
      }
    } catch (error) {
      console.error("Failed to load live visitor feed:", error);
    } finally {
      setLoadingFeed(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  useEffect(() => {
    if (activeSection === "visitors") {
      fetchLiveFeed();
    }
  }, [activeSection]);

  // Export Analytics Report
  const handleExport = async (format = "json") => {
    try {
      setExporting(true);
      toast.info(`Generating ${format.toUpperCase()} analytics report...`);
      const res = await axiosSecure.get(
        `/superadmin/system-analytics/export?format=${format}`,
        { responseType: format === "csv" ? "blob" : "json" }
      );

      if (format === "csv") {
        const blob = new Blob([res.data], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `mockea_analytics_report_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([JSON.stringify(res.data?.report || res.data, null, 2)], {
          type: "application/json",
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `mockea_analytics_report_${Date.now()}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
      toast.success("Analytics report downloaded successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export analytics report.");
    } finally {
      setExporting(false);
    }
  };

  // Quick action: Blacklist an IP directly from visitor feed
  const handleBlacklistIp = async (ip) => {
    if (!ip || ip === "127.0.0.1") {
      return toast.warning("Local or internal IP cannot be blacklisted.");
    }

    const result = await alerts.confirmAction({
      title: `Blacklist IP: ${ip}?`,
      text: "This IP address will be blocked immediately by the sitewide firewall.",
      confirmText: "Yes, Blacklist IP",
      danger: true,
    });
    if (!result.isConfirmed) return;

    try {
      const res = await axiosSecure.post("/superadmin/security/blacklist", {
        ip,
        reason: "Flagged directly from SAC visitor analytics feed for suspicious traffic pattern.",
      });
      if (res.data?.success) {
        toast.success(`IP ${ip} has been added to the blacklist!`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to blacklist IP.");
    }
  };

  if (loading && !analytics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-sm font-bold text-slate-400">Aggregating platform & visitor telemetry...</p>
      </div>
    );
  }

  const {
    overview = {},
    visitors = {},
    timeseries = [],
    users = {},
    academic = {},
    antiCheat = {},
    infrastructure = {},
    _meta = {},
  } = analytics || {};

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Header Toolbar & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-base-100 p-5 rounded-3xl border border-base-300 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2.5">
            <PiGlobeHemisphereWestBold className="text-primary w-7 h-7" />
            System & User Analytics Hub
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time visitor logs, geographical distribution, exam telemetry, and system health.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Timeframe Selector */}
          <div className="join bg-base-200 p-1 rounded-2xl">
            {[
              { key: "24h", label: "24h" },
              { key: "7d", label: "7 Days" },
              { key: "30d", label: "30 Days" },
              { key: "all", label: "All Time" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setRange(t.key)}
                className={`join-item btn btn-xs font-bold rounded-xl transition-all ${
                  range === t.key
                    ? "btn-primary text-white shadow-sm"
                    : "btn-ghost text-slate-500 hover:text-slate-800"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Force Refresh */}
          <button
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            className="btn btn-outline btn-sm rounded-2xl gap-1.5 font-bold border-base-300 hover:border-primary"
            title="Bypass 60s cache and run live MongoDB aggregations"
          >
            <PiArrowsClockwiseBold className={`w-4 h-4 ${refreshing ? "animate-spin text-primary" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          {/* Export Dropdown */}
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-sm btn-primary rounded-2xl gap-1.5 font-bold text-white shadow-sm"
            >
              <PiDownloadSimpleBold className="w-4 h-4" />
              Export
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content menu p-2 shadow-xl bg-base-100 rounded-2xl w-44 z-[50] border border-base-200 mt-2 text-xs font-bold"
            >
              <li>
                <button onClick={() => handleExport("json")} disabled={exporting}>
                  Download JSON
                </button>
              </li>
              <li>
                <button onClick={() => handleExport("csv")} disabled={exporting}>
                  Download CSV
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 2. Executive Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* KPI 1: Unique Visitors */}
        <div className="card bg-base-100 border border-base-300 p-4 rounded-3xl shadow-sm hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Unique Visitors</span>
            <PiGlobeHemisphereWestBold className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-white">
            {overview.totalUniqueVisitors || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Pageviews:</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {overview.totalPageviews || 0}
            </span>
          </div>
        </div>

        {/* KPI 2: Total Users */}
        <div className="card bg-base-100 border border-base-300 p-4 rounded-3xl shadow-sm hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Users</span>
            <PiUsersThreeBold className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-white">
            {overview.totalUsers || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Active Today:</span>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
              {overview.activeUsersToday || 0}
            </span>
          </div>
        </div>

        {/* KPI 3: Tests Completed */}
        <div className="card bg-base-100 border border-base-300 p-4 rounded-3xl shadow-sm hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Mock Tests</span>
            <PiExamBold className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-white">
            {overview.totalMockTests || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Taken Today:</span>
            <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
              {overview.mockTestsToday || 0}
            </span>
          </div>
        </div>

        {/* KPI 4: Grading Backlog */}
        <div className="card bg-base-100 border border-base-300 p-4 rounded-3xl shadow-sm hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Review Backlog</span>
            <PiClockCountdownBold className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-white">
            {overview.totalPendingBacklog || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Total Practices:</span>
            <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
              {overview.totalPractices || 0}
            </span>
          </div>
        </div>

        {/* KPI 5: Top Country */}
        <div className="card bg-base-100 border border-base-300 p-4 rounded-3xl shadow-sm hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Top Country</span>
            <span className="text-xl">{overview.topCountryFlag || "🌐"}</span>
          </div>
          <div className="text-lg font-black text-slate-800 dark:text-white truncate">
            {overview.topCountry || "None"}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            <span>Primary student audience</span>
          </div>
        </div>

        {/* KPI 6: System Health */}
        <div className="card bg-base-100 border border-base-300 p-4 rounded-3xl shadow-sm hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Database</span>
            <PiCpuBold className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {infrastructure.dbStatus || "OK"}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Heap:</span>
            <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
              {infrastructure.serverMemory?.heapUsed || "0 MB"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Sub-Navigation Tabs */}
      <div className="tabs tabs-box bg-base-100 p-1.5 rounded-2xl border border-base-300 shadow-sm flex flex-wrap gap-1">
        <button
          onClick={() => setActiveSection("visitors")}
          className={`tab gap-2 rounded-xl text-xs font-bold transition-all ${
            activeSection === "visitors" ? "tab-active bg-primary text-white shadow-sm" : ""
          }`}
        >
          <PiGlobeHemisphereWestBold className="w-4 h-4" />
          User & Visitor Analytics
        </button>

        <button
          onClick={() => setActiveSection("academic")}
          className={`tab gap-2 rounded-xl text-xs font-bold transition-all ${
            activeSection === "academic" ? "tab-active bg-primary text-white shadow-sm" : ""
          }`}
        >
          <PiExamBold className="w-4 h-4" />
          Academic & Test Telemetry
        </button>

        <button
          onClick={() => setActiveSection("antiCheat")}
          className={`tab gap-2 rounded-xl text-xs font-bold transition-all ${
            activeSection === "antiCheat" ? "tab-active bg-primary text-white shadow-sm" : ""
          }`}
        >
          <PiShieldWarningBold className="w-4 h-4" />
          Anti-Cheat Violations
        </button>

        <button
          onClick={() => setActiveSection("infrastructure")}
          className={`tab gap-2 rounded-xl text-xs font-bold transition-all ${
            activeSection === "infrastructure" ? "tab-active bg-primary text-white shadow-sm" : ""
          }`}
        >
          <PiCpuBold className="w-4 h-4" />
          Infrastructure & Health
        </button>
      </div>

      {/* 4. Sub-Section: User & Visitor Analytics (Flagship) */}
      {activeSection === "visitors" && (
        <div className="space-y-6">
          {/* Row 1: Top Countries & Traffic Curve */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Top Countries Ranking */}
            <div className="lg:col-span-5 card bg-base-100 border border-base-300 p-6 rounded-[2rem] shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <PiGlobeHemisphereWestBold className="text-primary" />
                    Country Visitor Distribution
                  </h3>
                  <p className="text-xs text-slate-400">
                    Geographical traffic origin resolved via Edge headers and GeoIP
                  </p>
                </div>
              </div>
              <CountryRankingTable countries={visitors.topCountries || []} />
            </div>

            {/* Traffic & Visitor Growth Timeseries Curve */}
            <div className="lg:col-span-7 card bg-base-100 border border-base-300 p-6 rounded-[2rem] shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <PiMonitorBold className="text-blue-500" />
                    Traffic & Visitor Velocity
                  </h3>
                  <p className="text-xs text-slate-400">
                    Daily breakdown of Pageviews vs Unique Visitor sessions
                  </p>
                </div>
              </div>
              <TimeSeriesChart
                data={timeseries}
                series={[
                  { key: "pageviews", label: "Pageviews", color: "#3b82f6" },
                  { key: "uniqueVisitors", label: "Unique Visitors", color: "#10b981" },
                ]}
                height={230}
              />
            </div>
          </div>

          {/* Row 2: Device Share & Plan Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Devices Donut */}
            <div className="card bg-base-100 border border-base-300 p-6 rounded-[2rem] shadow-sm">
              <DonutBreakdown
                title="Device Breakdown"
                totalLabel="Hits"
                data={(visitors.devices || []).map((d) => ({
                  label: d.name.charAt(0).toUpperCase() + d.name.slice(1),
                  value: d.count,
                  color: d.name === "mobile" ? "#ec4899" : d.name === "tablet" ? "#8b5cf6" : "#3b82f6",
                }))}
              />
            </div>

            {/* Browser Share List */}
            <div className="card bg-base-100 border border-base-300 p-6 rounded-[2rem] shadow-sm">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">
                Browser Market Share
              </h4>
              <div className="space-y-3">
                {(visitors.browsers || []).map((b, idx) => {
                  const total = visitors.browsers.reduce((acc, curr) => acc + curr.count, 0) || 1;
                  const pct = Math.round((b.count / total) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-600 dark:text-slate-300">{b.name}</span>
                        <span className="font-mono text-slate-500">
                          {b.count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-base-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Subscription Tier Donut */}
            <div className="card bg-base-100 border border-base-300 p-6 rounded-[2rem] shadow-sm">
              <DonutBreakdown
                title="Subscription Tiers"
                totalLabel="Users"
                data={[
                  { label: "Free Tier", value: users.plans?.free || 0, color: "#94a3b8" },
                  { label: "Standard Tier", value: users.plans?.standard || 0, color: "#3b82f6" },
                  { label: "Premium Tier", value: users.plans?.premium || 0, color: "#8b5cf6" },
                ]}
              />
            </div>
          </div>

          {/* Row 3: Live Real-Time Visitor Activity Feed with 1-Click IP Blacklist */}
          <div className="card bg-base-100 border border-base-300 p-6 md:p-8 rounded-[2rem] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Real-Time Visitor Feed
                </h3>
                <p className="text-xs text-slate-400">
                  Streaming incoming visitor requests with location, user metadata, and one-click security controls.
                </p>
              </div>
              <button
                onClick={fetchLiveFeed}
                disabled={loadingFeed}
                className="btn btn-ghost btn-xs font-bold gap-1 text-primary hover:bg-primary/10"
              >
                <PiArrowsClockwiseBold className={`w-3.5 h-3.5 ${loadingFeed ? "animate-spin" : ""}`} />
                Refresh Feed
              </button>
            </div>

            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="table w-full text-xs">
                <thead className="sticky top-0 bg-base-100 z-10 border-b border-base-200 text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 pl-3">Location</th>
                    <th className="py-2.5">User Identity</th>
                    <th className="py-2.5">Route Visited</th>
                    <th className="py-2.5">Device / OS</th>
                    <th className="py-2.5">Time</th>
                    <th className="py-2.5 pr-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-200">
                  {liveFeed.length > 0 ? (
                    liveFeed.map((log) => (
                      <tr key={log._id} className="hover:bg-base-200/30 transition-colors">
                        {/* Location */}
                        <td className="py-3 pl-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg shrink-0">{log.flag || "🌐"}</span>
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200">
                                {log.country || "Unknown"}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {log.city && log.city !== "Unknown" ? `${log.city} • ` : ""}
                                {log.ip}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* User Identity */}
                        <td className="py-3">
                          <div>
                            <div className="font-bold text-slate-700 dark:text-slate-300">
                              {log.userName || "Guest Visitor"}
                            </div>
                            <div className="text-[10px]">
                              <span
                                className={`badge badge-xs font-bold uppercase tracking-wider ${
                                  log.userRole === "superadmin"
                                    ? "badge-error text-white"
                                    : log.userRole === "admin"
                                    ? "badge-warning text-white"
                                    : log.userRole === "instructor"
                                    ? "badge-info text-white"
                                    : log.userRole === "student"
                                    ? "badge-primary text-white"
                                    : "badge-ghost text-slate-400"
                                }`}
                              >
                                {log.userRole || "guest"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Route */}
                        <td className="py-3">
                          <span className="badge badge-outline badge-sm font-mono text-[11px] max-w-[200px] truncate">
                            {log.path}
                          </span>
                        </td>

                        {/* Device / OS */}
                        <td className="py-3 font-medium text-slate-500 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            {log.device === "mobile" ? (
                              <PiDeviceMobileBold className="text-pink-500" />
                            ) : (
                              <PiMonitorBold className="text-blue-500" />
                            )}
                            <span>{log.browser}</span>
                            <span className="text-[10px] text-slate-400">({log.os})</span>
                          </div>
                        </td>

                        {/* Time */}
                        <td className="py-3 font-mono text-[11px] text-slate-400">
                          {new Date(log.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>

                        {/* Quick Action: Blacklist */}
                        <td className="py-3 pr-3 text-right">
                          <button
                            onClick={() => handleBlacklistIp(log.ip)}
                            className="btn btn-ghost btn-xs text-error hover:bg-error/10 gap-1 font-bold"
                            title={`Add ${log.ip} to blacklist firewall`}
                          >
                            <PiProhibitBold className="w-3.5 h-3.5" />
                            Block IP
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        No visitor logs captured yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. Sub-Section: Academic & Test Telemetry */}
      {activeSection === "academic" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Reading Avg */}
            <div className="card bg-base-100 border border-base-300 p-6 rounded-3xl shadow-sm text-center">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Reading Band Avg
              </div>
              <div className="text-4xl font-black text-primary">
                {academic.sectionAverages?.reading ?? "6.5"}
              </div>
              <div className="text-xs text-slate-400 mt-2">Objective Passage Scoring</div>
            </div>

            {/* Listening Avg */}
            <div className="card bg-base-100 border border-base-300 p-6 rounded-3xl shadow-sm text-center">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Listening Band Avg
              </div>
              <div className="text-4xl font-black text-info">
                {academic.sectionAverages?.listening ?? "6.5"}
              </div>
              <div className="text-xs text-slate-400 mt-2">Audio Comprehension</div>
            </div>

            {/* Writing Avg */}
            <div className="card bg-base-100 border border-base-300 p-6 rounded-3xl shadow-sm text-center">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Writing Band Avg
              </div>
              <div className="text-4xl font-black text-warning">
                {academic.sectionAverages?.writing ?? "6.0"}
              </div>
              <div className="text-xs text-slate-400 mt-2">AI & Human Essay Grading</div>
            </div>

            {/* Speaking Avg */}
            <div className="card bg-base-100 border border-base-300 p-6 rounded-3xl shadow-sm text-center">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Speaking Band Avg
              </div>
              <div className="text-4xl font-black text-success">
                {academic.sectionAverages?.speaking ?? "6.0"}
              </div>
              <div className="text-xs text-slate-400 mt-2">Voice & Fluency Evaluation</div>
            </div>
          </div>

          {/* Test Volume Charts & Target Exam Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card bg-base-100 border border-base-300 p-6 rounded-[2rem] shadow-sm">
              <DonutBreakdown
                title="Target Exam Preference"
                totalLabel="Students"
                data={[
                  { label: "IELTS Exam", value: users.targetExams?.IELTS || 0, color: "#ef4444" },
                  { label: "PTE Academic", value: users.targetExams?.PTE || 0, color: "#3b82f6" },
                  { label: "Both Exams", value: users.targetExams?.BOTH || 0, color: "#10b981" },
                ]}
              />
            </div>

            <div className="card bg-base-100 border border-base-300 p-6 rounded-[2rem] shadow-sm">
              <DonutBreakdown
                title="Mock Test Attempt Statuses"
                totalLabel="Tests"
                data={[
                  { label: "Completed", value: academic.mockStatuses?.completed || 0, color: "#10b981" },
                  { label: "Ongoing", value: academic.mockStatuses?.ongoing || 0, color: "#3b82f6" },
                  { label: "Auto-Submitted", value: academic.mockStatuses?.["auto-submitted"] || 0, color: "#f59e0b" },
                  { label: "Terminated", value: academic.mockStatuses?.terminated || 0, color: "#ef4444" },
                ]}
              />
            </div>
          </div>
        </div>
      )}

      {/* 6. Sub-Section: Anti-Cheat Violations */}
      {activeSection === "antiCheat" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card bg-base-100 border border-base-300 p-6 rounded-3xl shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Tab-Switch Incidents
              </h4>
              <div className="text-3xl font-black text-amber-500">
                {antiCheat.totalTabSwitches || 0}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Occurrences where test-takers changed active browser tab.
              </p>
            </div>

            <div className="card bg-base-100 border border-base-300 p-6 rounded-3xl shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Fullscreen Exits
              </h4>
              <div className="text-3xl font-black text-orange-500">
                {antiCheat.totalFullscreenExits || 0}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Instances where candidate exited mandatory exam lock.
              </p>
            </div>

            <div className="card bg-base-100 border border-base-300 p-6 rounded-3xl shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Auto-Submitted for Cheating
              </h4>
              <div className="text-3xl font-black text-error">
                {antiCheat.autoSubmittedCount || 0}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Tests instantly submitted due to exceeding violation thresholds.
              </p>
            </div>
          </div>

          {/* Flagged Attempts Table */}
          <div className="card bg-base-100 border border-base-300 p-6 rounded-[2rem] shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <PiShieldWarningBold className="text-error" />
              Highest Flagged Test Sessions
            </h3>
            <div className="overflow-x-auto">
              <table className="table w-full text-xs">
                <thead>
                  <tr className="border-b border-base-200 text-slate-400 text-[10px] uppercase">
                    <th>Student</th>
                    <th>Email</th>
                    <th>Tab Switches</th>
                    <th>Fullscreen Exits</th>
                    <th>Status</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-200">
                  {(antiCheat.flaggedAttempts || []).map((test) => (
                    <tr key={test._id} className="hover:bg-base-200/30">
                      <td className="font-bold">{test.userId?.name || "Anonymous"}</td>
                      <td className="font-mono text-slate-500">{test.userId?.email || "N/A"}</td>
                      <td className="font-bold text-amber-500">{test.tabSwitchCount || 0}</td>
                      <td className="font-bold text-orange-500">{test.fullscreenExits || 0}</td>
                      <td>
                        <span
                          className={`badge badge-xs font-bold uppercase ${
                            test.status === "auto-submitted" ? "badge-error text-white" : "badge-ghost"
                          }`}
                        >
                          {test.status}
                        </span>
                      </td>
                      <td className="font-mono text-slate-400">
                        {new Date(test.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. Sub-Section: Infrastructure & Health */}
      {activeSection === "infrastructure" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* MongoDB Health */}
            <div className="card bg-base-100 border border-base-300 p-6 rounded-3xl shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold">
                <PiDatabaseBold className="w-5 h-5" /> MongoDB Database
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Connection State:</span>
                <span className="font-bold text-emerald-600">{infrastructure.dbStatus}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Active Collections:</span>
                <span className="font-bold font-mono">{infrastructure.collectionsCount}</span>
              </div>
            </div>

            {/* Server Performance */}
            <div className="card bg-base-100 border border-base-300 p-6 rounded-3xl shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-blue-500 font-bold">
                <PiCpuBold className="w-5 h-5" /> Node Engine Memory
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Heap Used / Total:</span>
                <span className="font-bold font-mono text-blue-600">
                  {infrastructure.serverMemory?.heapUsed} / {infrastructure.serverMemory?.heapTotal}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Server Uptime:</span>
                <span className="font-bold font-mono">
                  {infrastructure.serverMemory?.uptimeMinutes} mins
                </span>
              </div>
            </div>

            {/* Cache Engine */}
            <div className="card bg-base-100 border border-base-300 p-6 rounded-3xl shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-purple-500 font-bold">
                <PiArrowsClockwiseBold className="w-5 h-5" /> Dual-Engine Cache
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Active Engine:</span>
                <span className="badge badge-sm font-bold uppercase">
                  {infrastructure.cacheStats?.type || "Memory"}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Cached Entities:</span>
                <span className="font-bold font-mono">
                  {infrastructure.cacheStats?.keysCount || 0} keys
                </span>
              </div>
            </div>
          </div>

          {/* AI & Chatbot Usage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card bg-base-100 border border-base-300 p-6 rounded-3xl shadow-sm">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-2">
                <PiRobotBold className="text-indigo-500 w-5 h-5" />
                AI Tutor (Study Buddy) Queries Today
              </h4>
              <div className="text-3xl font-black text-indigo-600">
                {infrastructure.chatbotQueriesToday || 0} messages
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Powered by Google Gemini 2.5 Flash API with token rate limiting.
              </p>
            </div>

            <div className="card bg-base-100 border border-base-300 p-6 rounded-3xl shadow-sm">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-2">
                <PiBugBold className="text-error w-5 h-5" />
                Error Exceptions (Last 24h)
              </h4>
              <div className="text-3xl font-black text-error">
                {infrastructure.recentErrorsCount || 0}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Unhandled exceptions logged to MongoDB TTL collection.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemAnalyticsTab;
