import { PiBug, PiTrash, PiCaretUp, PiCaretDown, PiCopy } from "react-icons/pi";
import { toast } from "react-toastify";

const ErrorAnalyticsTab = ({
  errorClusters,
  errorSortBy,
  setErrorSortBy,
  expandedErrorSig,
  setExpandedErrorSig,
  loadingErrors,
  clearingErrors,
  fetchErrorAnalytics,
  handleClearErrorLogs,
}) => {
  return (
    <div className="card bg-base-100 border border-base-300 rounded-[2rem] shadow-sm p-6 md:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-base-200 pb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <PiBug className="text-red-500 w-6 h-6" /> Detailed Backend Error Aggregation
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Clusters backend error stack traces automatically, calculated from the latest 5,000 occurrences.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sort control */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Sort by:</span>
            <select
              value={errorSortBy}
              onChange={(e) => setErrorSortBy(e.target.value)}
              className="select select-sm select-bordered rounded-xl text-xs font-medium focus:outline-none"
            >
              <option value="count">Total Count</option>
              <option value="countLastHour">Last 1 Hour</option>
              <option value="countLast24Hours">Last 24 Hours</option>
            </select>
          </div>

          {/* Action buttons */}
          <button
            onClick={fetchErrorAnalytics}
            disabled={loadingErrors}
            className="btn btn-sm btn-outline rounded-xl font-semibold"
          >
            {loadingErrors ? "Loading..." : "Refresh"}
          </button>

          <button
            onClick={handleClearErrorLogs}
            disabled={clearingErrors}
            className="btn btn-sm btn-error btn-outline rounded-xl font-semibold gap-1"
          >
            <PiTrash className="w-4 h-4" />
            Flush Error Logs
          </button>
        </div>
      </div>

      {loadingErrors ? (
        <div className="flex justify-center items-center py-12">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : errorClusters.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <PiBug className="w-12 h-12 mx-auto mb-3 opacity-30" />
          No aggregated backend error logs found.
        </div>
      ) : (
        <div className="space-y-4">
          {[...errorClusters]
            .sort((a, b) => b[errorSortBy] - a[errorSortBy])
            .map((cluster) => {
              const isExpanded = expandedErrorSig === cluster.signature;
              return (
                <div
                  key={cluster.signature}
                  className="border border-base-200 rounded-2xl overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition"
                >
                  {/* Summary Header Row */}
                  <div
                    onClick={() => setExpandedErrorSig(isExpanded ? null : cluster.signature)}
                    className="bg-base-50/50 p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer select-none"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Representative Status code badges */}
                        {Object.keys(cluster.statuses).map((status) => (
                          <span
                            key={status}
                            className={`badge badge-sm font-mono font-bold ${
                              status.startsWith("5")
                                ? "badge-error text-white"
                                : "badge-warning"
                            }`}
                          >
                            {status}
                          </span>
                        ))}
                        {/* Paths / routes */}
                        <span className="font-semibold font-mono text-xs text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded">
                          {Object.keys(cluster.paths)[0] || "Client / Background"}
                        </span>
                        {Object.keys(cluster.paths).length > 1 && (
                          <span className="text-[10px] text-slate-400 font-semibold bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 px-1 rounded">
                            +{Object.keys(cluster.paths).length - 1} more routes
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-slate-800 dark:text-white truncate">
                        {cluster.message}
                      </h3>
                    </div>

                    {/* Stats Badges */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-center">
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Total</span>
                        <span className="badge badge-neutral font-mono font-semibold">{cluster.count}</span>
                      </div>
                      {cluster.countLast24Hours > 0 && (
                        <div className="text-center">
                          <span className="block text-[10px] uppercase font-bold text-orange-400">24h</span>
                          <span className="badge badge-warning font-mono font-semibold text-white">{cluster.countLast24Hours}</span>
                        </div>
                      )}
                      {cluster.countLastHour > 0 && (
                        <div className="text-center">
                          <span className="block text-[10px] uppercase font-bold text-red-500">1h</span>
                          <span className="badge badge-error font-mono font-semibold text-white">{cluster.countLastHour}</span>
                        </div>
                      )}
                      <div className="pl-2">
                        {isExpanded ? <PiCaretUp className="w-5 h-5" /> : <PiCaretDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Collapsible Details Body */}
                  {isExpanded && (
                    <div className="p-4 border-t border-base-200 bg-base-100 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {/* Metadata breakdown */}
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-bold text-slate-400 uppercase text-[10px]">Impact & Timing</h4>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              <div className="bg-base-50 p-2 rounded-xl border border-base-200">
                                <span className="text-[10px] text-slate-500 block">First Seen</span>
                                <span className="font-medium">{new Date(cluster.firstSeen).toLocaleString()}</span>
                              </div>
                              <div className="bg-base-50 p-2 rounded-xl border border-base-200">
                                <span className="text-[10px] text-slate-500 block">Last Seen</span>
                                <span className="font-medium">{new Date(cluster.lastSeen).toLocaleString()}</span>
                              </div>
                              <div className="bg-base-50 p-2 rounded-xl border border-base-200 col-span-2">
                                <span className="text-[10px] text-slate-500 block">Affected Users ({cluster.uniqueUsersCount} total)</span>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {cluster.users.length === 0 ? (
                                    <span className="text-slate-400 font-medium italic">Anonymous / Client logs</span>
                                  ) : (
                                    cluster.users.map((email) => (
                                      <span key={email} className="badge badge-ghost font-mono text-[10px]">{email}</span>
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <h4 className="font-bold text-slate-400 uppercase text-[10px]">Affected API Endpoints</h4>
                            <div className="mt-1 space-y-1 max-h-32 overflow-y-auto pr-1">
                              {Object.entries(cluster.paths).map(([path, cnt]) => (
                                <div key={path} className="flex justify-between bg-base-50 px-2.5 py-1.5 rounded-lg border border-base-200 font-mono text-[11px]">
                                  <span className="text-slate-700 dark:text-slate-300 truncate">{path}</span>
                                  <span className="font-bold text-slate-500">{cnt}x</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stack Trace display */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-slate-400 uppercase text-[10px]">Stack Trace & Signature</h4>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(cluster.stack || cluster.signature);
                              toast.success("Stack trace copied to clipboard.");
                            }}
                            className="btn btn-xs btn-outline rounded-lg flex items-center gap-1 font-semibold text-[10px] py-1 px-2"
                          >
                            <PiCopy className="w-3 h-3" />
                            Copy Trace
                          </button>
                        </div>
                        <pre className="mockup-code bg-slate-900 text-slate-200 p-4 rounded-xl text-[11px] font-mono overflow-x-auto select-text max-h-[300px] border border-slate-800">
                          <code>{cluster.stack || cluster.signature}</code>
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default ErrorAnalyticsTab;
