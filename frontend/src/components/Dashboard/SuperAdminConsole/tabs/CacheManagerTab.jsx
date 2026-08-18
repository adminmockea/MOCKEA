import { PiDatabase, PiArrowsClockwise, PiTrash } from "react-icons/pi";

const CacheManagerTab = ({
  cacheStats,
  loadingCache,
  clearingCache,
  cacheKeySearch,
  setCacheKeySearch,
  resetCycleEmail,
  setResetCycleEmail,
  resettingCycle,
  fetchCacheStats,
  handleClearCache,
  handleResetDailyQuestionsCycle,
}) => {
  return (
    <div className="card bg-base-100 border border-base-300 p-6 md:p-8 rounded-[2rem] shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <PiDatabase className="text-primary w-6 h-6" /> Memory & Redis Cache Engine
          </h2>
          <p className="text-xs text-slate-400">
            Inspect connection status, key counts, and selectively clear mock tests or practice lab cached questions.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchCacheStats}
            disabled={loadingCache}
            className="btn btn-outline btn-sm rounded-xl gap-2 font-bold"
          >
            <PiArrowsClockwise className={`w-4 h-4 ${loadingCache ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => handleClearCache(null)}
            disabled={clearingCache || loadingCache}
            className="btn btn-error btn-sm rounded-xl gap-2 font-bold text-white"
          >
            <PiTrash className="w-4 h-4" />
            Flush Entire Cache
          </button>
        </div>
      </div>

      {/* Cache Stats Grid */}
      {cacheStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card bg-base-200 border border-base-300 p-6 rounded-2xl shadow-inner flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Connection Status</h4>
              <div className="flex items-center gap-2">
                <span className={`w-3.5 h-3.5 rounded-full ${cacheStats.connected ? "bg-green-500 animate-pulse" : "bg-red-500 animate-pulse"}`} />
                <span className="font-black text-lg text-slate-800 dark:text-white">
                  {cacheStats.connected ? "Online & Ready" : "Offline / Local"}
                </span>
              </div>
            </div>
            <span className="text-[10px] text-slate-400 mt-4">Redis backend client health status.</span>
          </div>

          <div className="card bg-base-200 border border-base-300 p-6 rounded-2xl shadow-inner flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Cache Storage Type</h4>
              <span className="font-black text-lg text-slate-800 dark:text-white capitalize">
                {cacheStats.type === "redis" ? "Redis Cluster Caching" : "In-Memory Fallback Map"}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-4">Local Map fallback active if REDIS_URL is unconfigured.</span>
          </div>

          <div className="card bg-base-200 border border-base-300 p-6 rounded-2xl shadow-inner flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Active Keys</h4>
              <span className="font-mono font-black text-2xl text-primary">
                {cacheStats.keysCount} <span className="text-xs font-normal text-slate-500">entries</span>
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-4">Total number of records currently cached in memory or Redis.</span>
          </div>
        </div>
      )}

      {/* Quick-Clear Module Cache */}
      <div className="border border-base-200 bg-base-200/30 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Quick-Evict Modules</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleClearCache("mocktest:*")}
            disabled={clearingCache}
            className="btn btn-sm btn-secondary rounded-xl font-bold"
          >
            Clear Mock Test Cache (`mocktest:*`)
          </button>
          <button
            onClick={() => handleClearCache("question:*")}
            disabled={clearingCache}
            className="btn btn-sm btn-secondary rounded-xl font-bold"
          >
            Clear Practice Labs Cache (`question:*`)
          </button>
        </div>
      </div>

      {/* Daily Questions Cycle Manager */}
      <div className="border border-base-200 bg-base-200/30 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Free Tier Daily Questions Cycle Manager</h3>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          Force reset the daily selected questions and seen questions history for a student or reset the cycle globally for all free tier users.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Target Student Email</label>
            <input
              type="email"
              placeholder="student@example.com"
              className="input input-bordered rounded-xl w-full h-10 text-xs font-semibold bg-white"
              value={resetCycleEmail}
              onChange={(e) => setResetCycleEmail(e.target.value)}
            />
          </div>
          <button
            onClick={() => handleResetDailyQuestionsCycle(resetCycleEmail)}
            disabled={resettingCycle || !resetCycleEmail}
            className="btn btn-sm btn-primary rounded-xl font-bold h-10"
          >
            Reset User Daily Questions Cycle
          </button>
          <button
            onClick={() => handleResetDailyQuestionsCycle(null)}
            disabled={resettingCycle}
            className="btn btn-sm btn-error text-white rounded-xl font-bold h-10"
          >
            Reset Cycle Globally (All Users)
          </button>
        </div>
      </div>

      {/* Cache Keys Table */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">Cached Keys Index</h3>
          <input
            type="text"
            placeholder="Filter cache keys..."
            className="input input-sm input-bordered rounded-xl max-w-xs w-full"
            value={cacheKeySearch}
            onChange={(e) => setCacheKeySearch(e.target.value)}
          />
        </div>

        {loadingCache ? (
          <div className="flex justify-center items-center py-12">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : !cacheStats || cacheStats.keys.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm border border-dashed border-base-300 rounded-2xl">
            No active keys found in the cache database.
          </div>
        ) : (
          <div className="overflow-x-auto border border-base-300 rounded-2xl">
            <table className="table w-full text-xs">
              <thead>
                <tr className="bg-base-200">
                  <th>Key Name</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cacheStats.keys
                  .filter((key) => key.toLowerCase().includes(cacheKeySearch.toLowerCase()))
                  .map((key) => (
                    <tr key={key} className="hover:bg-base-200/50">
                      <td className="font-mono font-bold text-slate-700 dark:text-slate-300">{key}</td>
                      <td className="text-right">
                        <button
                          onClick={() => handleClearCache(key)}
                          disabled={clearingCache}
                          className="btn btn-ghost btn-xs text-error rounded-lg"
                          title="Evict Key"
                        >
                          <PiTrash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CacheManagerTab;
