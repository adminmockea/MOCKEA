import { PiShieldWarning, PiArrowsClockwise, PiSliders, PiTrash } from "react-icons/pi";

const SecurityBlacklistTab = ({
  config,
  blacklistedIps,
  loadingBlacklist,
  savingBlacklist,
  newIpAddress,
  setNewIpAddress,
  newIpReason,
  setNewIpReason,
  savingRateLimits,
  fetchBlacklist,
  handleBlacklistIp,
  handleRemoveBlacklistedIp,
  handleSaveRateLimits,
}) => {
  return (
    <div className="card bg-base-100 border border-base-300 p-6 md:p-8 rounded-[2rem] shadow-sm space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-base-200 pb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <PiShieldWarning className="text-error w-7 h-7" /> Security & Access Controls
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage IP address blacklisting and dynamically configure API rate limit thresholds to prevent abuse.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchBlacklist}
          disabled={loadingBlacklist}
          className="btn btn-outline btn-sm rounded-xl gap-2 font-bold px-4 hover:bg-primary hover:text-white"
        >
          <PiArrowsClockwise className={`w-4 h-4 ${loadingBlacklist ? "animate-spin" : ""}`} />
          Refresh Logs
        </button>
      </div>

      {/* Part 1: Dynamic Rate Limiting Limits */}
      {config && (
        <form onSubmit={handleSaveRateLimits} className="card border border-base-300 p-6 rounded-2xl shadow-sm space-y-6">
          <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <PiSliders className="text-primary w-5 h-5" /> Dynamic API Rate Limits
          </h3>
          <p className="text-xs text-slate-400">
            Define requests-per-minute rate ceilings for active NAT gateways and client users. Modifying takes effect within 15 seconds.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Global API Limit (req/min)</span>
              <input
                type="number"
                name="globalLimit"
                className="input input-bordered rounded-xl w-full focus:input-primary font-semibold text-sm"
                defaultValue={config.rateLimits?.globalLimit ?? 60}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Auth Register Limit (req/min)</span>
              <input
                type="number"
                name="authLimit"
                className="input input-bordered rounded-xl w-full focus:input-primary font-semibold text-sm"
                defaultValue={config.rateLimits?.authLimit ?? 10}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Practice Submission Limit (req/min)</span>
              <input
                type="number"
                name="submitLimit"
                className="input input-bordered rounded-xl w-full focus:input-primary font-semibold text-sm"
                defaultValue={config.rateLimits?.submitLimit ?? 5}
              />
            </div>
          </div>
          <div className="flex justify-end border-t border-base-200 pt-4">
            <button
              type="submit"
              disabled={savingRateLimits}
              className="btn btn-primary rounded-xl font-bold px-6 btn-sm text-white"
            >
              {savingRateLimits ? "Updating..." : "Save Rate Limits"}
            </button>
          </div>
        </form>
      )}

      {/* Part 2: Blacklist IP Form */}
      <form onSubmit={handleBlacklistIp} className="card border border-base-300 p-6 rounded-2xl shadow-sm space-y-6">
        <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <PiTrash className="text-error w-5 h-5" /> Ban Abusive IP Address
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-1.5 md:col-span-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Target IP Address</span>
            <input
              type="text"
              className="input input-bordered rounded-xl w-full focus:input-primary text-sm font-semibold"
              placeholder="e.g. 198.51.100.42"
              value={newIpAddress}
              onChange={(e) => setNewIpAddress(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ban Reason / Notes</span>
            <input
              type="text"
              className="input input-bordered rounded-xl w-full focus:input-primary text-sm font-medium"
              placeholder="e.g. DDOS flood / Spamming essay submission endpoint"
              value={newIpReason}
              onChange={(e) => setNewIpReason(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end border-t border-base-200 pt-4">
          <button
            type="submit"
            disabled={savingBlacklist}
            className="btn btn-error rounded-xl font-bold px-6 btn-sm text-white"
          >
            {savingBlacklist ? "Banning..." : "Blacklist IP Address"}
          </button>
        </div>
      </form>

      {/* Part 3: IP Blacklist Table */}
      <div className="space-y-4">
        <h3 className="font-black text-sm text-slate-700 dark:text-slate-300">Currently Blacklisted IPs</h3>
        
        {loadingBlacklist ? (
          <div className="flex justify-center items-center py-12">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : blacklistedIps.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm border border-dashed border-base-300 rounded-2xl">
            No IP addresses are currently blacklisted.
          </div>
        ) : (
          <div className="overflow-x-auto border border-base-300 rounded-2xl shadow-sm">
            <table className="table w-full text-xs">
              <thead>
                <tr className="bg-base-200">
                  <th>IP Address</th>
                  <th>Reason</th>
                  <th>Blocked By</th>
                  <th>Blocked Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blacklistedIps.map((block) => (
                  <tr key={block._id} className="hover:bg-base-200/50">
                    <td className="font-mono font-bold text-slate-700 dark:text-slate-300 text-sm">{block.ip}</td>
                    <td className="text-slate-500 font-medium">{block.reason}</td>
                    <td className="font-semibold text-primary">{block.blockedBy}</td>
                    <td>{new Date(block.createdAt).toLocaleString()}</td>
                    <td className="text-right">
                      <button
                        onClick={() => handleRemoveBlacklistedIp(block._id)}
                        className="btn btn-ghost btn-xs text-error rounded-lg"
                        title="Unban IP"
                      >
                        Unban
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

export default SecurityBlacklistTab;
