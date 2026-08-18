import {
  PiDatabase,
  PiUsersThree,
  PiNotebook,
  PiQuestion,
  PiFileText,
  PiShieldWarning,
  PiBug,
  PiDownloadSimple,
  PiPlay,
} from "react-icons/pi";

const DatabaseManagerTab = ({
  collectionCounts,
  loadingCollections,
  seeding,
  handleExport,
  handleRunSeeder,
}) => {
  return (
    <div className="card bg-base-100 border border-base-300 rounded-[2rem] shadow-sm p-6 md:p-8 space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <PiDatabase className="text-primary w-6 h-6" /> Database Seed & Export Engine
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Export database collections to CSV or JSON, download specific student information spreadsheets, or trigger database seeders to populate mock tests.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collection list and export controls */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Available Collections</h3>
          {loadingCollections ? (
            <div className="flex justify-center items-center py-8">
              <span className="loading loading-spinner loading-md text-primary"></span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "users", label: "Users Collection", api: "users", icon: PiUsersThree, color: "text-cyan-500 bg-cyan-50 dark:bg-cyan-950/20" },
                { key: "mockTests", label: "Mock Tests", api: "mocktests", icon: PiNotebook, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20" },
                { key: "questions", label: "Questions", api: "questions", icon: PiQuestion, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" },
                { key: "submissions", label: "Submissions", api: "submissions", icon: PiFileText, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20" },
                { key: "auditLogs", label: "Platform Audit", api: "auditlogs", icon: PiShieldWarning, color: "text-purple-500 bg-purple-50 dark:bg-purple-950/20" },
                { key: "errorLogs", label: "System Errors", api: "errorlogs", icon: PiBug, color: "text-rose-500 bg-rose-50 dark:bg-rose-950/20" },
              ].map((col) => {
                const IconComponent = col.icon;
                return (
                  <div key={col.key} className="bg-base-100 hover:bg-base-200/40 transition duration-300 p-5 rounded-3xl border border-base-300 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex gap-3 items-center min-w-0">
                        <div className={`p-2.5 rounded-2xl shrink-0 ${col.color}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 dark:text-white text-sm block truncate">{col.label}</span>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block truncate">/api/superadmin/export/{col.api}</span>
                        </div>
                      </div>
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full text-xs font-mono font-bold flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                        {collectionCounts ? collectionCounts[col.key] || 0 : "0"} docs
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleExport(col.api, "csv")}
                        className="btn btn-xs btn-outline hover:btn-primary rounded-xl flex-1 font-bold flex items-center justify-center gap-1 py-1.5 h-auto min-h-0 cursor-pointer text-[10px]"
                      >
                        <PiDownloadSimple className="w-3 h-3" /> CSV
                      </button>
                      <button
                        onClick={() => handleExport(col.api, "xlsx")}
                        className="btn btn-xs btn-outline hover:btn-primary rounded-xl flex-1 font-bold flex items-center justify-center gap-1 py-1.5 h-auto min-h-0 cursor-pointer text-[10px]"
                      >
                        <PiDownloadSimple className="w-3 h-3" /> Excel
                      </button>
                      <button
                        onClick={() => handleExport(col.api, "json")}
                        className="btn btn-xs btn-outline hover:btn-primary rounded-xl flex-1 font-bold flex items-center justify-center gap-1 py-1.5 h-auto min-h-0 cursor-pointer text-[10px]"
                      >
                        <PiDownloadSimple className="w-3 h-3" /> JSON
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Special actions card */}
        <div className="space-y-6">
          {/* Download student info */}
          <div className="card bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-100 dark:border-indigo-900/50 p-6 rounded-3xl shadow-sm space-y-4">
            <h4 className="font-bold text-indigo-900 dark:text-indigo-200 text-sm flex items-center gap-2">
              <PiDownloadSimple className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Student Analytics Export
            </h4>
            <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
              Instantly download the complete list of students including their registration email, plan subscription tier (Free/Standard/Premium), last active timestamp, exam type, gender, and status.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => handleExport("students-info", "csv")}
                className="btn btn-sm btn-primary rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer w-full"
              >
                <PiDownloadSimple className="w-4 h-4" /> Download Students CSV
              </button>
              <button
                onClick={() => handleExport("students-info", "xlsx")}
                className="btn btn-sm btn-outline rounded-xl font-bold flex items-center justify-center gap-2 border border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 bg-transparent hover:bg-indigo-600 hover:text-white transition duration-200 cursor-pointer w-full"
              >
                <PiDownloadSimple className="w-4 h-4" /> Download Students Excel
              </button>
              <button
                onClick={() => handleExport("students-info", "json")}
                className="btn btn-sm btn-outline rounded-xl font-bold flex items-center justify-center gap-2 border border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 bg-transparent hover:bg-indigo-600 hover:text-white transition duration-200 cursor-pointer w-full"
              >
                <PiDownloadSimple className="w-4 h-4" /> Download Students JSON
              </button>
            </div>
          </div>

          {/* DB Seeder */}
          <div className="card bg-base-200/30 border border-base-300 p-6 rounded-3xl shadow-sm space-y-4">
            <h4 className="font-bold text-sm flex items-center gap-2">
              <PiPlay className="w-5 h-5 text-emerald-500" /> Database Seeder Engine
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Need to populate mock tests during a server spin-up or testing cycles? Spin up default IELTS mock test sets, reading passages, speaking files, and questions in one-click.
            </p>
            <div className="pt-2">
              <button
                onClick={handleRunSeeder}
                disabled={seeding}
                className="btn btn-sm rounded-xl font-bold w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 transition duration-300 shadow-sm hover:shadow-md cursor-pointer h-10"
              >
                {seeding ? "Running Seeders..." : "Run Database Seeder"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseManagerTab;
