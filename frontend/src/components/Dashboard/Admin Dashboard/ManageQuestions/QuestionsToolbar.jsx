import { useMemo } from "react";
import { Link } from "react-router";
import { PiMagnifyingGlass, PiFunnel, PiSquaresFour, PiList, PiPlus, PiTimer } from "react-icons/pi";
import PageHeader from "../../../Common/PageHeader";
import { getSetCategory } from "../../../../utils/questionCategoryUtils";

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
    filterSubCategory = "all",
    setFilterSubCategory,
    uniqueSubCategories = [],
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
    handleBulkAction,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    filteredQuestions = []
}) => {
    const subtitleText = activeTab === "ALL" 
        ? "Manage all IELTS and PTE Academic questions across different sections." 
        : `Manage all ${activeTab === "PTE" ? "PTE Academic" : "IELTS"} questions across different sections.`;

    const hasActiveFiltersOrSort = filterType !== "all" || filterSubCategory !== "all" || filterPlan !== "all" || filterStatus !== "all" || filterMockStatus !== "all" || Boolean(sortField);

    const activeCategoryLabel = useMemo(() => {
        if (!filteredQuestions || filteredQuestions.length === 0) return null;
        const cats = [...new Set(filteredQuestions.map((q) => q.category || q.testType).filter(Boolean))];
        if (cats.length === 0) return null;
        return cats.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(", ");
    }, [filteredQuestions]);

    const activeSubCategoryLabel = useMemo(() => {
        if (filterSubCategory && filterSubCategory !== "all") return filterSubCategory;
        if (!filteredQuestions || filteredQuestions.length === 0) return null;
        const subCats = [...new Set(filteredQuestions.map((q) => q.subCategory || getSetCategory(q)).filter(Boolean))];
        if (subCats.length === 0) return null;
        if (subCats.length === 1) return subCats[0];
        if (subCats.length <= 2) return subCats.join(", ");
        return `${subCats[0]} (+${subCats.length - 1} more)`;
    }, [filteredQuestions, filterSubCategory]);

    return (
        <div className="space-y-4">
            <PageHeader
                title="Question Bank"
                subtitle={subtitleText}
                action={
                    <Link to="/dashboard/admin/add-questions" className="btn btn-primary rounded-2xl gap-2 font-bold shadow-md hover:shadow-lg transition-all">
                        <PiPlus className="text-base" /> Add Questions
                    </Link>
                }
            />

            {/* Filter & Action Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
                    {/* Search */}
                    <div className="relative min-w-[200px] max-w-xs flex-1">
                        <input
                            type="text"
                            placeholder="Search questions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-700 hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm w-full"
                        />
                        <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
                    </div>

                    {/* Filter & Sort Modal Button */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`btn btn-sm rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 h-auto py-2 min-h-0 ${
                                hasActiveFiltersOrSort 
                                    ? "bg-primary text-white border-primary hover:bg-primary/90" 
                                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                        >
                            <PiFunnel className="text-sm" />
                            <span>Filter & Sort</span>
                            {hasActiveFiltersOrSort && (
                                <span className="w-2 h-2 rounded-full bg-amber-400" />
                            )}
                        </button>

                        {isFilterOpen && (
                            <>
                                <div 
                                    className="fixed inset-0 z-10" 
                                    onClick={() => setIsFilterOpen(false)} 
                                />
                                <div className="absolute left-0 sm:right-0 sm:left-auto z-20 p-4 shadow-xl bg-white border border-slate-100 rounded-2xl w-72 mt-2 space-y-3.5">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Category (Section)</label>
                                        <select
                                            value={filterType}
                                            onChange={(e) => setFilterType(e.target.value)}
                                            className="select select-bordered select-sm rounded-xl w-full text-xs font-bold text-slate-700 bg-white"
                                        >
                                            {uniqueTypes.map((type) => (
                                                <option key={type} value={type}>
                                                    {type === "all" ? "All Categories" : type.charAt(0).toUpperCase() + type.slice(1)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Sub Category</label>
                                        <select
                                            value={filterSubCategory}
                                            onChange={(e) => setFilterSubCategory && setFilterSubCategory(e.target.value)}
                                            className="select select-bordered select-sm rounded-xl w-full text-xs font-bold text-slate-700 bg-white truncate"
                                        >
                                            {uniqueSubCategories.map((sc) => (
                                                <option key={sc} value={sc}>
                                                    {sc === "all" ? "All Sub Categories" : sc}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Sort Order</label>
                                        <select
                                            value={sortField ? `${sortField}-${sortDirection}` : "default"}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === "default") {
                                                    setSortField && setSortField(null);
                                                } else {
                                                    const [field, dir] = val.split("-");
                                                    setSortField && setSortField(field);
                                                    setSortDirection && setSortDirection(dir);
                                                }
                                            }}
                                            className="select select-bordered select-sm rounded-xl w-full text-xs font-bold text-slate-700 bg-white"
                                        >
                                            <option value="default">Default Order</option>
                                            <option value="category-asc">Category (A - Z)</option>
                                            <option value="category-desc">Category (Z - A)</option>
                                            <option value="subCategory-asc">Sub Category (A - Z)</option>
                                            <option value="subCategory-desc">Sub Category (Z - A)</option>
                                            <option value="title-asc">Title (A - Z)</option>
                                            <option value="title-desc">Title (Z - A)</option>
                                            <option value="createdAt-desc">Newest First</option>
                                            <option value="createdAt-asc">Oldest First</option>
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Plan Tier</label>
                                        <select
                                            value={filterPlan}
                                            onChange={(e) => setFilterPlan(e.target.value)}
                                            className="select select-bordered select-sm rounded-xl w-full text-xs font-bold text-slate-700 bg-white"
                                        >
                                            <option value="all">All Plans</option>
                                            <option value="free">Free</option>
                                            <option value="premium">Premium</option>
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Status</label>
                                        <select
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                            className="select select-bordered select-sm rounded-xl w-full text-xs font-bold text-slate-700 bg-white"
                                        >
                                            <option value="all">All Statuses</option>
                                            <option value="active">Active Only</option>
                                            <option value="disabled">Disabled Only</option>
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Mock Test Assignment</label>
                                        <select
                                            value={filterMockStatus}
                                            onChange={(e) => setFilterMockStatus(e.target.value)}
                                            className="select select-bordered select-sm rounded-xl w-full text-xs font-bold text-slate-700 bg-white"
                                        >
                                            <option value="all">All Questions</option>
                                            <option value="in_mock">Assigned to Mock Test</option>
                                            <option value="standalone">Standalone (Unassigned)</option>
                                        </select>
                                    </div>

                                    <div className="border-t border-slate-100 pt-2.5 flex justify-between items-center">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFilterType("all");
                                                setFilterSubCategory && setFilterSubCategory("all");
                                                setFilterPlan("all");
                                                setFilterStatus("all");
                                                setFilterMockStatus("all");
                                                setSortField && setSortField(null);
                                            }}
                                            className="text-[11px] text-red-500 font-extrabold hover:underline"
                                        >
                                            Reset Filters
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsFilterOpen(false)}
                                            className="btn btn-xs btn-primary rounded-lg font-bold px-3"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* View Mode Toggle */}
                <div className="join bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/80 flex-shrink-0">
                    <button 
                        onClick={() => setViewMode("grid")}
                        className={`btn btn-xs join-item rounded-lg gap-1 ${viewMode === "grid" ? "bg-white text-primary shadow-sm border border-slate-200/60 font-bold" : "btn-ghost text-slate-600 font-semibold"}`}
                    >
                        <PiSquaresFour className="text-sm" /> Grid
                    </button>
                    <button 
                        onClick={() => setViewMode("table")}
                        className={`btn btn-xs join-item rounded-lg gap-1 ${viewMode === "table" ? "bg-white text-primary shadow-sm border border-slate-200/60 font-bold" : "btn-ghost text-slate-600 font-semibold"}`}
                    >
                        <PiList className="text-sm" /> Table
                    </button>
                </div>
            </div>

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

            {/* Active Filters Pill Bar */}
            {hasActiveFiltersOrSort && (
                <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-slate-100/80 rounded-xl border border-slate-200/80 text-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Showing only:</span>
                    {filterType !== "all" && (
                        <span className="badge badge-sm gap-1 bg-primary/10 text-primary border-primary/20 font-bold">
                            Category: <span className="font-black capitalize">{filterType}</span>
                            <button type="button" onClick={() => setFilterType("all")} className="hover:text-red-500 font-extrabold ml-1 text-xs">✕</button>
                        </span>
                    )}
                    {filterSubCategory !== "all" && (
                        <span className="badge badge-sm gap-1 bg-indigo-50 text-indigo-700 border-indigo-200 font-bold">
                            Sub Category: <span className="font-black text-indigo-900">{filterSubCategory}</span>
                            <button type="button" onClick={() => setFilterSubCategory && setFilterSubCategory("all")} className="hover:text-red-500 font-extrabold ml-1 text-xs">✕</button>
                        </span>
                    )}
                    {filterPlan !== "all" && (
                        <span className="badge badge-sm gap-1 bg-white text-slate-700 border-slate-200 font-bold capitalize">
                            Plan: {filterPlan}
                            <button type="button" onClick={() => setFilterPlan("all")} className="hover:text-red-500 font-extrabold ml-0.5">✕</button>
                        </span>
                    )}
                    {filterStatus !== "all" && (
                        <span className="badge badge-sm gap-1 bg-white text-slate-700 border-slate-200 font-bold capitalize">
                            Status: {filterStatus}
                            <button type="button" onClick={() => setFilterStatus("all")} className="hover:text-red-500 font-extrabold ml-0.5">✕</button>
                        </span>
                    )}
                    {sortField && (
                        <span className="badge badge-sm gap-1.5 bg-amber-100 text-amber-950 border-amber-300 font-bold py-1 px-3">
                            <span>
                                {sortField === "subCategory" ? (
                                    <>
                                        Sub Category: <span className="font-black text-amber-950">{activeSubCategoryLabel || "Sub Category"}</span>
                                    </>
                                ) : sortField === "category" ? (
                                    <>
                                        Category: <span className="font-black text-amber-950">{activeCategoryLabel || "Category"}</span>
                                    </>
                                ) : (
                                    <>
                                        Sorted by {
                                            sortField === "title" ? "Title" :
                                            sortField === "exam" ? "Exam" :
                                            sortField === "questionsCount" ? "Questions Count" :
                                            sortField === "createdAt" ? "Created Date" :
                                            sortField
                                        }
                                    </>
                                )}
                                <span className="opacity-80 font-semibold ml-1">({sortDirection === "asc" ? "A-Z" : "Z-A"})</span>
                            </span>
                            <button type="button" onClick={() => setSortField && setSortField(null)} className="hover:text-red-600 font-extrabold ml-1 text-xs" title="Clear sort">✕</button>
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={() => {
                            setFilterType("all");
                            setFilterSubCategory && setFilterSubCategory("all");
                            setFilterPlan("all");
                            setFilterStatus("all");
                            setFilterMockStatus("all");
                            setSortField && setSortField(null);
                        }}
                        className="text-[11px] text-red-500 font-extrabold hover:underline ml-auto"
                    >
                        Reset All
                    </button>
                </div>
            )}

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
                            onClick={() => handleBulkAction("update-timer")}
                            className="btn btn-xs bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-lg font-bold flex items-center gap-1"
                        >
                            <PiTimer className="text-xs" /> Set Timer
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
