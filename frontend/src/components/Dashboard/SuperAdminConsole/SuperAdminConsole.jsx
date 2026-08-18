import { useState, useEffect } from "react";
import useAxiosSecure from "../../../hooks/useAxiosSecure";
import ImpersonationTool from "./ImpersonationTool";
import { toast } from "react-toastify";
import { alerts } from "../../../utils/alerts";
import { useQueryClient } from "@tanstack/react-query";
import {
  PiChartBar,
  PiShieldWarning,
  PiGear,
  PiUsersThree,
  PiBug,
  PiDatabase,
  PiEnvelopeSimple,
  PiRobot,
} from "react-icons/pi";

import MetricsTab from "./tabs/MetricsTab";
import AuditLogsTab from "./tabs/AuditLogsTab";
import ErrorAnalyticsTab from "./tabs/ErrorAnalyticsTab";
import DatabaseManagerTab from "./tabs/DatabaseManagerTab";
import EmailBroadcastTab from "./tabs/EmailBroadcastTab";
import CacheManagerTab from "./tabs/CacheManagerTab";
import AiTutorConfigTab from "./tabs/AiTutorConfigTab";
import SecurityBlacklistTab from "./tabs/SecurityBlacklistTab";

const SuperAdminConsole = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("metrics");
  const [metrics, setMetrics] = useState(null);
  const [config, setConfig] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLogsPage, setAuditLogsPage] = useState(1);
  const [auditLogsTotalPages, setAuditLogsTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Error analytics states
  const [errorClusters, setErrorClusters] = useState([]);
  const [errorSortBy, setErrorSortBy] = useState("count"); // 'count' | 'countLastHour' | 'countLast24Hours'
  const [expandedErrorSig, setExpandedErrorSig] = useState(null);
  const [loadingErrors, setLoadingErrors] = useState(false);
  const [clearingErrors, setClearingErrors] = useState(false);

  // Database tab states
  const [collectionCounts, setCollectionCounts] = useState(null);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Email broadcast tab states
  const [broadcasts, setBroadcasts] = useState([]);
  const [loadingBroadcasts, setLoadingBroadcasts] = useState(false);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState(null);
  const [emailCohort, setEmailCohort] = useState("all");
  const [emailSubject, setEmailSubject] = useState("🚀 Platform Update: Premium Features and Maintenance Schedule");
  const [emailContent, setEmailContent] = useState(`# Important System Announcement\n\nDear Students,\n\nWe have completed a series of improvements to the IELTS evaluation systems. Here is a summary of the updates:\n- **AI IELTS Essay Scoring**: Essay evaluations are now faster and provide more detailed band descriptions.\n- **PTE Academic Integration**: The PTE exam practice modules have left Beta and are now fully available.\n\n## Scheduled Maintenance\n\nWe will be running database optimization procedures this Sunday between **02:00 AM and 04:00 AM UTC**. During this short window, you may experience brief access interruptions.\n\nThank you for preparing with MOCKEA!`);
  const [editingBroadcast, setEditingBroadcast] = useState(null);
  const [editSubject, setEditSubject] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCohort, setEditCohort] = useState("all");
  const [isUpdatingBroadcast, setIsUpdatingBroadcast] = useState(false);

  // Cache manager tab states
  const [cacheStats, setCacheStats] = useState(null);
  const [loadingCache, setLoadingCache] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheKeySearch, setCacheKeySearch] = useState("");
  const [resetCycleEmail, setResetCycleEmail] = useState("");
  const [resettingCycle, setResettingCycle] = useState(false);

  // AI Tutor Configurator tab states
  const [chatbotSettings, setChatbotSettings] = useState(null);
  const [loadingChatbot, setLoadingChatbot] = useState(false);
  const [savingChatbot, setSavingChatbot] = useState(false);

  // Security IP Blacklist states
  const [blacklistedIps, setBlacklistedIps] = useState([]);
  const [loadingBlacklist, setLoadingBlacklist] = useState(false);
  const [savingBlacklist, setSavingBlacklist] = useState(false);
  const [newIpAddress, setNewIpAddress] = useState("");
  const [newIpReason, setNewIpReason] = useState("");
  const [savingRateLimits, setSavingRateLimits] = useState(false);

  const axiosSecure = useAxiosSecure();

  const fetchMetricsAndConfig = async () => {
    try {
      setLoading(true);
      const [metricsRes, configRes] = await Promise.all([
        axiosSecure.get("/superadmin/metrics"),
        axiosSecure.get("/superadmin/config"),
      ]);
      setMetrics(metricsRes.data?.metrics || null);
      setConfig(configRes.data?.config || null);
    } catch (error) {
      console.error(error);
      toast.error("Error loading console diagnostics.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async (page = 1) => {
    try {
      const res = await axiosSecure.get(`/superadmin/logs?page=${page}&limit=10`);
      setAuditLogs(res.data?.logs || []);
      setAuditLogsTotalPages(res.data?.totalPages || 1);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load administrative audit logs.");
    }
  };

  useEffect(() => {
    fetchMetricsAndConfig();
  }, []);

  useEffect(() => {
    if (activeTab === "audit") {
      fetchAuditLogs(auditLogsPage);
    }
  }, [activeTab, auditLogsPage]);

  const fetchErrorAnalytics = async () => {
    try {
      setLoadingErrors(true);
      const res = await axiosSecure.get("/superadmin/error-analytics");
      setErrorClusters(res.data?.errorClusters || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load backend error aggregation diagnostics.");
    } finally {
      setLoadingErrors(false);
    }
  };

  const handleClearErrorLogs = async () => {
    const result = await alerts.confirmAction({
      title: "Are you sure?",
      text: "Are you sure you want to permanently clear all backend error logs? This cannot be undone.",
      confirmText: "Yes, flush them!",
      danger: true,
    });
    if (!result.isConfirmed) return;

    try {
      setClearingErrors(true);
      await axiosSecure.delete("/settings/logs");
      toast.success("All backend error logs have been flushed.");
      setErrorClusters([]);
    } catch (error) {
      console.error(error);
      toast.error("Failed to clear backend error logs.");
    } finally {
      setClearingErrors(false);
    }
  };

  useEffect(() => {
    if (activeTab === "errors") {
      fetchErrorAnalytics();
    }
  }, [activeTab]);

  const fetchCollectionsCounts = async () => {
    try {
      setLoadingCollections(true);
      const res = await axiosSecure.get("/superadmin/collections");
      setCollectionCounts(res.data?.counts || null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load database collections information.");
    } finally {
      setLoadingCollections(false);
    }
  };

  const handleExport = async (collection, format) => {
    try {
      toast.info(`Generating ${format.toUpperCase()} export for ${collection}...`);
      const res = await axiosSecure.get(`/superadmin/export/${collection}?format=${format}`, {
        responseType: "blob",
      });
      const mimeType = format === "xlsx" 
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
        : (format === "csv" ? "text/csv" : "application/json");

      const blob = new Blob([res.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${collection}_export_${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Download started.");
    } catch (error) {
      console.error(error);
      toast.error("Export failed.");
    }
  };

  const handleRunSeeder = async () => {
    const result = await alerts.confirmAction({
      title: "Are you sure?",
      text: "This will seed sample IELTS questions and structured mock tests into the database.",
      confirmText: "Yes, seed mock tests!",
    });
    if (!result.isConfirmed) return;

    try {
      setSeeding(true);
      const res = await axiosSecure.post("/superadmin/seed");
      if (res.data?.success) {
        toast.success(res.data.message || "Database seeded successfully!");
        fetchCollectionsCounts();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to run seeder.");
    } finally {
      setSeeding(false);
    }
  };

  const fetchBroadcastHistory = async () => {
    try {
      setLoadingBroadcasts(true);
      const res = await axiosSecure.get("/superadmin/notification-broadcasts");
      setBroadcasts(res.data?.broadcasts || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch past notification broadcasts.");
    } finally {
      setLoadingBroadcasts(false);
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!emailSubject.trim() || !emailContent.trim()) {
      return toast.warning("Subject and content are required.");
    }

    const result = await alerts.confirmAction({
      title: "Confirm Notification Broadcast?",
      text: `Send announcement notification broadcast to the '${emailCohort.toUpperCase()}' cohort?`,
      confirmText: "Yes, broadcast!",
    });
    if (!result.isConfirmed) return;

    try {
      setSendingBroadcast(true);
      const res = await axiosSecure.post("/superadmin/notification-broadcast", {
        subject: emailSubject,
        content: emailContent,
        cohort: emailCohort,
      });
      if (res.data?.success) {
        toast.success(res.data.message || "Notification broadcast sent successfully!");
        setEmailSubject("");
        setEmailContent("");
        fetchBroadcastHistory();
        if (activeTab === "database") {
          fetchCollectionsCounts();
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to send notification broadcast.");
    } finally {
      setSendingBroadcast(false);
    }
  };

  const handleStartEditBroadcast = (b) => {
    setEditingBroadcast(b);
    setEditSubject(b.subject);
    setEditContent(b.content);
    setEditCohort(b.cohort);
  };

  const handleUpdateBroadcast = async (e) => {
    e.preventDefault();
    if (!editSubject.trim() || !editContent.trim()) {
      return toast.warning("Subject and content are required.");
    }

    try {
      setIsUpdatingBroadcast(true);
      const res = await axiosSecure.put(`/superadmin/notification-broadcast/${editingBroadcast._id}`, {
        subject: editSubject,
        content: editContent,
        cohort: editCohort,
      });
      if (res.data?.success) {
        toast.success(res.data.message || "Broadcast updated successfully!");
        setEditingBroadcast(null);
        fetchBroadcastHistory();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update broadcast.");
    } finally {
      setIsUpdatingBroadcast(false);
    }
  };

  const handleDeleteBroadcast = async (id) => {
    const result = await alerts.confirmAction({
      title: "Delete Notification Broadcast?",
      text: "Are you sure you want to delete this broadcast? It will also remove the notification from users' inboxes.",
      confirmText: "Yes, delete!",
      danger: true,
    });
    if (!result.isConfirmed) return;

    try {
      const res = await axiosSecure.delete(`/superadmin/notification-broadcast/${id}`);
      if (res.data?.success) {
        toast.success(res.data.message || "Broadcast deleted successfully!");
        fetchBroadcastHistory();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to delete broadcast.");
    }
  };

  const fetchCacheStats = async () => {
    try {
      setLoadingCache(true);
      const res = await axiosSecure.get("/superadmin/cache/stats");
      setCacheStats(res.data?.stats || null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load cache diagnostics.");
    } finally {
      setLoadingCache(false);
    }
  };

  const handleClearCache = async (pattern = null) => {
    const actionText = pattern 
      ? `delete cache keys matching '${pattern}'`
      : "permanently flush the ENTIRE cache database";
      
    const result = await alerts.confirmAction({
      title: "Confirm Cache Action",
      text: `Are you sure you want to ${actionText}? This might temporarily increase database load.`,
      confirmText: "Yes, clear!",
      danger: !pattern,
    });
    if (!result.isConfirmed) return;

    try {
      setClearingCache(true);
      const res = await axiosSecure.post("/superadmin/cache/clear", { pattern });
      toast.success(res.data?.message || "Cache cleared successfully.");
      fetchCacheStats();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to clear cache.");
    } finally {
      setClearingCache(false);
    }
  };

  const handleResetDailyQuestionsCycle = async (email = null) => {
    const isGlobal = !email;
    const actionText = isGlobal 
      ? "reset the daily questions cycle for ALL users"
      : `reset the daily questions cycle for user '${email}'`;
      
    const result = await alerts.confirmAction({
      title: "Confirm Daily Cycle Reset",
      text: `Are you sure you want to ${actionText}?`,
      confirmText: "Yes, reset!",
      danger: isGlobal,
    });
    if (!result.isConfirmed) return;

    try {
      setResettingCycle(true);
      const res = await axiosSecure.post("/superadmin/questions/reset-daily-cycle", { email: email ? email.trim() : null });
      toast.success(res.data?.message || "Daily questions cycle reset successfully.");
      if (!isGlobal) {
        setResetCycleEmail("");
      }
      fetchCacheStats();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to reset daily questions cycle.");
    } finally {
      setResettingCycle(false);
    }
  };

  const fetchChatbotSettings = async () => {
    try {
      setLoadingChatbot(true);
      const res = await axiosSecure.get("/chatbot/settings");
      setChatbotSettings(res.data?.settings || null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load AI chatbot configurator settings.");
    } finally {
      setLoadingChatbot(false);
    }
  };

  const handleUpdateChatbotSettings = async (e) => {
    e.preventDefault();
    if (!chatbotSettings) return;

    try {
      setSavingChatbot(true);
      const res = await axiosSecure.put("/chatbot/settings", chatbotSettings);
      if (res.data?.success) {
        setChatbotSettings(res.data.settings);
        toast.success("AI tutor settings updated successfully.");
        queryClient.invalidateQueries({ queryKey: ["chatbot-settings"] });
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to save AI tutor settings.");
    } finally {
      setSavingChatbot(false);
    }
  };

  const fetchBlacklist = async () => {
    try {
      setLoadingBlacklist(true);
      const res = await axiosSecure.get("/superadmin/security/blacklist");
      setBlacklistedIps(res.data?.list || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load security IP blacklist.");
    } finally {
      setLoadingBlacklist(false);
    }
  };

  const handleBlacklistIp = async (e) => {
    e.preventDefault();
    if (!newIpAddress.trim()) {
      return toast.warning("IP address is required.");
    }

    try {
      setSavingBlacklist(true);
      const res = await axiosSecure.post("/superadmin/security/blacklist", {
        ip: newIpAddress,
        reason: newIpReason || "Unspecified security reason"
      });
      if (res.data?.success) {
        toast.success(res.data.message || "IP blacklisted successfully.");
        setNewIpAddress("");
        setNewIpReason("");
        fetchBlacklist();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to block IP.");
    } finally {
      setSavingBlacklist(false);
    }
  };

  const handleRemoveBlacklistedIp = async (ipId) => {
    const result = await alerts.confirmAction({
      title: "Remove Blacklist Block?",
      text: "Are you sure you want to unban this IP address?",
      confirmText: "Yes, unban!",
      danger: true
    });
    if (!result.isConfirmed) return;

    try {
      const res = await axiosSecure.delete(`/superadmin/security/blacklist/${ipId}`);
      if (res.data?.success) {
        toast.success(res.data.message || "IP unbanned successfully.");
        fetchBlacklist();
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to remove IP from blacklist.");
    }
  };

  const handleSaveRateLimits = async (e) => {
    e.preventDefault();
    if (!config) return;
    const formData = new FormData(e.target);
    const globalLimit = parseInt(formData.get("globalLimit")) || 60;
    const authLimit = parseInt(formData.get("authLimit")) || 10;
    const submitLimit = parseInt(formData.get("submitLimit")) || 5;

    try {
      setSavingRateLimits(true);
      const res = await axiosSecure.put("/superadmin/config", {
        rateLimits: { globalLimit, authLimit, submitLimit }
      });
      if (res.data?.success) {
        setConfig(res.data.config);
        toast.success("Security rate limit configurations saved.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update rate limit configurations.");
    } finally {
      setSavingRateLimits(false);
    }
  };

  useEffect(() => {
    if (activeTab === "database") {
      fetchCollectionsCounts();
    }
    if (activeTab === "email") {
      fetchBroadcastHistory();
    }
    if (activeTab === "cache") {
      fetchCacheStats();
    }
    if (activeTab === "chatbot") {
      fetchChatbotSettings();
    }
    if (activeTab === "security") {
      fetchBlacklist();
    }
  }, [activeTab]);

  const handleToggleMaintenance = async () => {
    if (!config) return;
    try {
      setUpdating(true);
      const res = await axiosSecure.put("/superadmin/config", {
        maintenanceMode: !config.maintenanceMode,
      });
      if (res.data?.success) {
        setConfig(res.data.config);
        toast.success(`Maintenance mode toggled to ${!config.maintenanceMode ? "ON" : "OFF"}`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update maintenance settings.");
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleFlag = async (flagName) => {
    if (!config) return;
    const updatedFlags = {
      ...config.featureFlags,
      [flagName]: !config.featureFlags[flagName],
    };

    try {
      setUpdating(true);
      const res = await axiosSecure.put("/superadmin/config", {
        featureFlags: updatedFlags,
      });
      if (res.data?.success) {
        setConfig(res.data.config);
        toast.success(`Feature flag '${flagName}' toggled successfully.`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update feature flag.");
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateNotice = async (e) => {
    e.preventDefault();
    if (!config) return;
    const formData = new FormData(e.target);
    const active = formData.get("noticeActive") === "true";
    const message = formData.get("noticeMessage");
    const type = formData.get("noticeType");

    try {
      setUpdating(true);
      const res = await axiosSecure.put("/superadmin/config", {
        systemNotice: { active, message, type },
      });
      if (res.data?.success) {
        setConfig(res.data.config);
        toast.success("System announcement notice updated.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update announcement notice.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            Super Admin Console
          </h1>
          <p className="text-sm text-slate-500">Sitewide global controls, health audits, and integration flags.</p>
        </div>

        {/* Global Maintenance Toggle */}
        <div className="flex items-center gap-3 bg-base-100 p-4 rounded-2xl border border-base-300 shadow-sm">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Maintenance Mode</span>
          <input
            type="checkbox"
            className="toggle toggle-error"
            checked={config?.maintenanceMode || false}
            disabled={updating}
            onChange={handleToggleMaintenance}
          />
        </div>
      </div>

      {/* Tabs Nav */}
      <div className="tabs tabs-boxed bg-base-100 p-1 rounded-2xl border border-base-300 flex overflow-x-auto shrink-0">
        <button
          onClick={() => setActiveTab("metrics")}
          className={`tab gap-2 rounded-xl transition-all duration-200 ${
            activeTab === "metrics" ? "tab-active bg-primary text-white" : ""
          }`}
        >
          <PiChartBar className="w-5 h-5" />
          Metrics & Health
        </button>
        <button
          onClick={() => setActiveTab("flags")}
          className={`tab gap-2 rounded-xl transition-all duration-200 ${
            activeTab === "flags" ? "tab-active bg-primary text-white" : ""
          }`}
        >
          <PiGear className="w-5 h-5" />
          Feature Flags
        </button>
        <button
          onClick={() => setActiveTab("impersonate")}
          className={`tab gap-2 rounded-xl transition-all duration-200 ${
            activeTab === "impersonate" ? "tab-active bg-primary text-white" : ""
          }`}
        >
          <PiUsersThree className="w-5 h-5" />
          Impersonation
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`tab gap-2 rounded-xl transition-all duration-200 ${
            activeTab === "audit" ? "tab-active bg-primary text-white" : ""
          }`}
        >
          <PiShieldWarning className="w-5 h-5" />
          Audit Trail Logs
        </button>
        <button
          onClick={() => setActiveTab("errors")}
          className={`tab gap-2 rounded-xl transition-all duration-200 ${
            activeTab === "errors" ? "tab-active bg-primary text-white" : ""
          }`}
        >
          <PiBug className="w-5 h-5" />
          System Errors
        </button>
        <button
          onClick={() => setActiveTab("database")}
          className={`tab gap-2 rounded-xl transition-all duration-200 ${
            activeTab === "database" ? "tab-active bg-primary text-white" : ""
          }`}
        >
          <PiDatabase className="w-5 h-5" />
          Database Engine
        </button>
        <button
          onClick={() => setActiveTab("cache")}
          className={`tab gap-2 rounded-xl transition-all duration-200 ${
            activeTab === "cache" ? "tab-active bg-primary text-white" : ""
          }`}
        >
          <PiDatabase className="w-5 h-5" />
          Cache Manager
        </button>
        <button
          onClick={() => setActiveTab("chatbot")}
          className={`tab gap-2 rounded-xl transition-all duration-200 ${
            activeTab === "chatbot" ? "tab-active bg-primary text-white" : ""
          }`}
        >
          <PiRobot className="w-5 h-5" />
          AI Tutor Configurator
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`tab gap-2 rounded-xl transition-all duration-200 ${
            activeTab === "security" ? "tab-active bg-primary text-white" : ""
          }`}
        >
          <PiShieldWarning className="w-5 h-5" />
          Security Control
        </button>
        <button
          onClick={() => setActiveTab("email")}
          className={`tab gap-2 rounded-xl transition-all duration-200 ${
            activeTab === "email" ? "tab-active bg-primary text-white" : ""
          }`}
        >
          <PiEnvelopeSimple className="w-5 h-5" />
          Notification Broadcast
        </button>
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        {(activeTab === "metrics" || activeTab === "flags") && (
          <MetricsTab
            metrics={metrics}
            config={config}
            updating={updating}
            handleToggleMaintenance={handleToggleMaintenance}
            handleToggleFlag={handleToggleFlag}
            handleUpdateNotice={handleUpdateNotice}
            activeSubTab={activeTab}
          />
        )}

        {activeTab === "impersonate" && (
          <div className="max-w-xl mx-auto">
            <ImpersonationTool />
          </div>
        )}

        {activeTab === "audit" && (
          <AuditLogsTab
            auditLogs={auditLogs}
            auditLogsPage={auditLogsPage}
            auditLogsTotalPages={auditLogsTotalPages}
            setAuditLogsPage={setAuditLogsPage}
          />
        )}

        {activeTab === "errors" && (
          <ErrorAnalyticsTab
            errorClusters={errorClusters}
            errorSortBy={errorSortBy}
            setErrorSortBy={setErrorSortBy}
            expandedErrorSig={expandedErrorSig}
            setExpandedErrorSig={setExpandedErrorSig}
            loadingErrors={loadingErrors}
            clearingErrors={clearingErrors}
            fetchErrorAnalytics={fetchErrorAnalytics}
            handleClearErrorLogs={handleClearErrorLogs}
          />
        )}

        {activeTab === "database" && (
          <DatabaseManagerTab
            collectionCounts={collectionCounts}
            loadingCollections={loadingCollections}
            seeding={seeding}
            handleExport={handleExport}
            handleRunSeeder={handleRunSeeder}
          />
        )}

        {activeTab === "cache" && (
          <CacheManagerTab
            cacheStats={cacheStats}
            loadingCache={loadingCache}
            clearingCache={clearingCache}
            cacheKeySearch={cacheKeySearch}
            setCacheKeySearch={setCacheKeySearch}
            resetCycleEmail={resetCycleEmail}
            setResetCycleEmail={setResetCycleEmail}
            resettingCycle={resettingCycle}
            fetchCacheStats={fetchCacheStats}
            handleClearCache={handleClearCache}
            handleResetDailyQuestionsCycle={handleResetDailyQuestionsCycle}
          />
        )}

        {activeTab === "chatbot" && (
          <AiTutorConfigTab
            chatbotSettings={chatbotSettings}
            setChatbotSettings={setChatbotSettings}
            loadingChatbot={loadingChatbot}
            savingChatbot={savingChatbot}
            fetchChatbotSettings={fetchChatbotSettings}
            handleUpdateChatbotSettings={handleUpdateChatbotSettings}
          />
        )}

        {activeTab === "security" && (
          <SecurityBlacklistTab
            config={config}
            blacklistedIps={blacklistedIps}
            loadingBlacklist={loadingBlacklist}
            savingBlacklist={savingBlacklist}
            newIpAddress={newIpAddress}
            setNewIpAddress={setNewIpAddress}
            newIpReason={newIpReason}
            setNewIpReason={setNewIpReason}
            savingRateLimits={savingRateLimits}
            fetchBlacklist={fetchBlacklist}
            handleBlacklistIp={handleBlacklistIp}
            handleRemoveBlacklistedIp={handleRemoveBlacklistedIp}
            handleSaveRateLimits={handleSaveRateLimits}
          />
        )}

        {activeTab === "email" && (
          <EmailBroadcastTab
            broadcasts={broadcasts}
            loadingBroadcasts={loadingBroadcasts}
            sendingBroadcast={sendingBroadcast}
            selectedBroadcast={selectedBroadcast}
            setSelectedBroadcast={setSelectedBroadcast}
            emailCohort={emailCohort}
            setEmailCohort={setEmailCohort}
            emailSubject={emailSubject}
            setEmailSubject={setEmailSubject}
            emailContent={emailContent}
            setEmailContent={setEmailContent}
            editingBroadcast={editingBroadcast}
            setEditingBroadcast={setEditingBroadcast}
            editSubject={editSubject}
            setEditSubject={setEditSubject}
            editContent={editContent}
            setEditContent={setEditContent}
            editCohort={editCohort}
            setEditCohort={setEditCohort}
            isUpdatingBroadcast={isUpdatingBroadcast}
            handleSendBroadcast={handleSendBroadcast}
            handleStartEditBroadcast={handleStartEditBroadcast}
            handleUpdateBroadcast={handleUpdateBroadcast}
            handleDeleteBroadcast={handleDeleteBroadcast}
          />
        )}
      </div>
    </div>
  );
};

export default SuperAdminConsole;
