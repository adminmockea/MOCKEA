import { PiChartBar, PiGear } from "react-icons/pi";

const MetricsTab = ({
  metrics,
  config,
  updating,
  handleToggleMaintenance,
  handleToggleFlag,
  handleUpdateNotice,
  activeSubTab = "metrics",
}) => {
  if (activeSubTab === "metrics" && metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-base-100 border border-base-300 p-6 rounded-3xl shadow-sm">
          <h3 className="text-sm font-semibold text-slate-500 mb-4 flex items-center gap-2">
            <PiChartBar className="w-5 h-5 text-green-500" /> Database Health
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500 text-sm">Status:</span>
              <span className="font-bold text-green-600">{metrics.database?.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 text-sm">Collections:</span>
              <span className="font-bold">{metrics.database?.collectionsCount}</span>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 border border-base-300 p-6 rounded-3xl shadow-sm">
          <h3 className="text-sm font-semibold text-slate-500 mb-4 flex items-center gap-2">
            <PiGear className="w-5 h-5 text-blue-500" /> Server Performance
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500 text-sm">Node CPU / Heap:</span>
              <span className="font-bold text-blue-600">{metrics.server?.memory?.heapUsed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 text-sm">Uptime:</span>
              <span className="font-bold">{Math.round(metrics.server?.uptime / 60)} mins</span>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 border border-base-300 p-6 rounded-3xl shadow-sm">
          <h3 className="text-sm font-semibold text-slate-500 mb-4 flex items-center gap-2">
            <PiChartBar className="w-5 h-5 text-orange-500" /> Site Metrics
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500 text-sm">Total Active Users:</span>
              <span className="font-bold">{metrics.counts?.users}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 text-sm">Total Audit Logs:</span>
              <span className="font-bold">{metrics.counts?.auditLogs}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeSubTab === "flags" && config) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Flags card */}
        <div className="card bg-base-100 border border-base-300 p-6 md:p-8 rounded-[2rem] shadow-sm">
          <h2 className="text-xl font-bold mb-4">Module Controls (Feature Flags)</h2>
          <p className="text-xs text-slate-400 mb-6">Toggling flags is instant and applies to all active sessions immediately.</p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-base-200 pb-3">
              <div>
                <h4 className="font-bold text-sm">AI evaluation engine</h4>
                <p className="text-xs text-slate-500">Grading of IELTS essays using OpenAI models.</p>
              </div>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={config.featureFlags?.aiGrading}
                onChange={() => handleToggleFlag("aiGrading")}
                disabled={updating}
              />
            </div>

            <div className="flex items-center justify-between border-b border-base-200 pb-3">
              <div>
                <h4 className="font-bold text-sm">Anti-Cheat tab switch monitoring</h4>
                <p className="text-xs text-slate-500">Submits test automatically when tab changes.</p>
              </div>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={config.featureFlags?.antiCheatTabSwitch}
                onChange={() => handleToggleFlag("antiCheatTabSwitch")}
                disabled={updating}
              />
            </div>

            <div className="flex items-center justify-between border-b border-base-200 pb-3">
              <div>
                <h4 className="font-bold text-sm">IELTS Speaking Beta module</h4>
                <p className="text-xs text-slate-500">Enable voice processing laboratories.</p>
              </div>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={config.featureFlags?.speakingPracticeBeta}
                onChange={() => handleToggleFlag("speakingPracticeBeta")}
                disabled={updating}
              />
            </div>
          </div>
        </div>

        {/* Announcement Notices Form */}
        <div className="card bg-base-100 border border-base-300 p-6 md:p-8 rounded-[2rem] shadow-sm">
          <h2 className="text-xl font-bold mb-4">Broadcast System Notice</h2>
          
          <form onSubmit={handleUpdateNotice} className="space-y-4">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Notice Status</span>
              </label>
              <select name="noticeActive" defaultValue={config.systemNotice?.active?.toString()} className="select select-bordered rounded-2xl w-full">
                <option value="true">Active (Visible Sitewide)</option>
                <option value="false">Inactive (Hidden)</option>
              </select>
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Notice Style</span>
              </label>
              <select name="noticeType" defaultValue={config.systemNotice?.type || "info"} className="select select-bordered rounded-2xl w-full">
                <option value="info">Information (Blue)</option>
                <option value="warning">Warning (Orange)</option>
                <option value="error">Critical (Red)</option>
              </select>
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Broadcast Message</span>
              </label>
              <textarea
                name="noticeMessage"
                defaultValue={config.systemNotice?.message || ""}
                placeholder="Enter announcement text..."
                className="textarea textarea-bordered rounded-2xl w-full h-24 focus:outline-none"
                required
              ></textarea>
            </div>

            <button type="submit" disabled={updating} className="btn btn-primary rounded-2xl w-full font-bold">
              {updating ? "Saving Changes..." : "Publish Broadcast"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return null;
};

export default MetricsTab;
