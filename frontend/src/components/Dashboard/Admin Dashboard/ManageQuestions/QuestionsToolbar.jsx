import { Link } from "react-router";
import { PiMagnifyingGlass, PiFunnel, PiSquaresFour, PiList, PiPlus } from "react-icons/pi";
import PageHeader from "../../../Common/PageHeader";

const QuestionsToolbar = ({
    activeTab = "IELTS",
    setActiveTab,
    counts,
    searchQuery,
    setSearchQuery,
    isFilterOpen,
    setIsFilterOpen,
    filterType,
    setFilterType,
    filterPlan,
    setFilterPlan,
    filterStatus,
    setFilterStatus,
    filterMockStatus,
    setFilterMockStatus,
    uniqueTypes,
    viewMode,
    setViewMode,
    selectedIds,
    handleBulkAction
}) => {
    const subtitleText = activeTab === "ALL" 
        ? "Manage all IELTS and PTE Academic questions across different sections." 
        : `Manage all ${activeTab === "PTE" ? "PTE Academic" : "IELTS"} questions across different sections.`;

    return (
        <div className="space-y-4">
            <PageHeader
                title="Question Bank"
                subtitle={subtitleText}
                action={
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search questions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-700 hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm w-40 sm:w-56"
                            />
                            <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
                        </div>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className="btn btn-outline border-slate-200 hover:bg-slate-50 hover:text-slate-800 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 shadow-sm flex items-center gap-2 bg-white h-auto min-h-0"
                            >
                                <PiFunnel className="text-sm" />
                                <span>Filter</span>
                                {(filterType !== "all" || filterPlan !== "all" || filterStatus !== "all" || filterMockStatus !== "all") && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                )}
                            </button>
                            {isFilterOpen && (
                                <>
                                    <div 
                                        className="fixed inset-0 z-10" 
                                        onClick={() => setIsFilterOpen(false)} 
                                    />
                                    <div className="absolute right-0 z-20 p-4 shadow-xl bg-white border border-slate-100 rounded-2xl w-60 mt-2 space-y-3.5">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Module Type</label>
                                            <select
                                                value={filterType}
                                                onChange={(e) => setFilterType(e.target.value)}
                                                className="select select-bordered select-sm rounded-xl w-full text-xs font-bold text-slate-700 bg-white"
                                            >
                                                {uniqueTypes.map((type) => (
                                                    <option key={type} value={type}>
                                                        {type === "all" ? "All Types" : type}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Plan Tier</label>
                                            <select
                                                value={filterPlan}
                                                onChange={(e) => setFilterPlan(e.target.value)}
                                                className="select select-bordered select-sm rounded-xl w-full text-xs font-bold text-slate-700 bg-white"
                                            >
                                                <option value="all">All Plans</option>
                                                <option value="free">Free</option>
                                                <option value="standard">Standard</option>
                                                <option value="premium">Premium</option>
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Active Status</label>
                                            <select
                                                value={filterStatus}
                                                onChange={(e) => setFilterStatus(e.target.value)}
                                                className="select select-bordered select-sm rounded-xl w-full text-xs font-bold text-slate-700 bg-white"
                                            >
                                                <option value="all">All Status</option>
                                                <option value="active">Active Only</option>
                                                <option value="disabled">Disabled Only</option>
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Mock Test Assignment</label>
                                            <select
                                                value={filterMockStatus}
                                                onChange={(e) => setFilterMockStatus(e.target.value)}
                                                className="select select-bordered select-sm rounded-xl w-full text-xs font-bold text-slate-700 bg-white"
                                            >
                                                <option value="all">All Questions</option>
                                                <option value="in_mock">📌 In Mock Test</option>
                                                <option value="not_in_mock">Standalone (Not in Mock)</option>
                                            </select>
                                        </div>
                                        {(filterType !== "all" || filterPlan !== "all" || filterStatus !== "all" || filterMockStatus !== "all") && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFilterType("all");
                                                    setFilterPlan("all");
                                                    setFilterStatus("all");
                                                    setFilterMockStatus("all");
                                                }}
                                                className="btn btn-xs btn-ghost text-red-500 hover:bg-red-50 rounded-lg w-full font-bold mt-1"
                                            >
                                                Clear Filters
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="join bg-base-100 border border-base-300 rounded-2xl p-0.5 shadow-sm">
                            <button 
                                onClick={() => setViewMode("grid")}
                                className={`btn btn-sm btn-ghost join-item rounded-xl gap-1.5 ${viewMode === "grid" ? "bg-primary text-white hover:bg-primary/95" : "text-base-content/70"}`}
                            >
                                <PiSquaresFour className="text-lg" /> Grid
                            </button>
                            <button 
                                onClick={() => setViewMode("table")}
                                className={`btn btn-sm btn-ghost join-item rounded-xl gap-1.5 ${viewMode === "table" ? "bg-primary text-white hover:bg-primary/95" : "text-base-content/70"}`}
                            >
                                <PiList className="text-lg" /> Table
                            </button>
                        </div>
                        <Link to="/dashboard/admin/add-questions" className="btn btn-primary rounded-2xl gap-2 font-bold">
                            <PiPlus /> Add Questions
                        </Link>
                    </div>
                }
            />

            {/* Exam Switcher Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 p-1.5 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    <button
                        type="button"
                        onClick={() => setActiveTab && setActiveTab("IELTS")}
                        className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
                            activeTab === "IELTS"
                                ? "bg-white text-primary shadow-sm border border-slate-200/60"
                                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                        }`}
                    >
                        <span>🎓 IELTS Questions</span>
                        {counts?.ielts !== undefined && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                activeTab === "IELTS" ? "bg-primary/10 text-primary" : "bg-slate-200 text-slate-600"
                            }`}>
                                {counts.ielts}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab && setActiveTab("PTE")}
                        className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
                            activeTab === "PTE"
                                ? "bg-white text-emerald-600 shadow-sm border border-slate-200/60"
                                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                        }`}
                    >
                        <span>📘 PTE Academic</span>
                        {counts?.pte !== undefined && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                activeTab === "PTE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                            }`}>
                                {counts.pte}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab && setActiveTab("ALL")}
                        className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
                            activeTab === "ALL"
                                ? "bg-white text-slate-800 shadow-sm border border-slate-200/60"
                                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                        }`}
                    >
                        <span>🌐 All Exams</span>
                        {counts?.all !== undefined && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                activeTab === "ALL" ? "bg-slate-200 text-slate-800" : "bg-slate-200 text-slate-600"
                            }`}>
                                {counts.all}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {selectedIds.length > 0 && (
                <div className="bg-primary/5 border border-primary/20 p-3 rounded-2xl flex items-center justify-between">
                    <span className="text-xs font-bold text-primary pl-2">
                        {selectedIds.length} question set(s) selected
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleBulkAction("setActive", true)}
                            className="btn btn-xs bg-emerald-500 text-white border-none rounded-lg font-bold"
                        >
                            Enable Selected
                        </button>
                        <button
                            onClick={() => handleBulkAction("setActive", false)}
                            className="btn btn-xs bg-amber-500 text-white border-none rounded-lg font-bold"
                        >
                            Disable Selected
                        </button>
                        <button
                            onClick={() => handleBulkAction("delete")}
                            className="btn btn-xs bg-rose-500 text-white border-none rounded-lg font-bold"
                        >
                            Delete Selected
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuestionsToolbar;
