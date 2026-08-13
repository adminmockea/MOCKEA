import React, { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { 
    PiPlus,
    PiFiles,
    PiClock,
    PiTrophy,
    PiMagnifyingGlass,
    PiSquaresFour,
    PiListBullets,
    PiCopy,
    PiEye,
    PiTrash,
    PiPencilSimple,
    PiUsers,
    PiCheckSquare,
    PiSquare,
    PiTrashSimple,
    PiFunnel,
    PiSortAscending,
    PiCheckCircle,
    PiSparkle,
    PiX,
    PiBookOpen,
    PiHeadphones,
    PiPencil,
    PiMicrophone
} from "react-icons/pi";
import { Link, useNavigate } from "react-router";
import useAdminQuery from "../../../hooks/useAdminQuery";
import useAxiosSecure from "../../../hooks/useAxiosSecure";
import { DEFAULT_MOCK_TEST_DURATION_MINUTES } from "../../../constants";
import PageHeader from "../../Common/PageHeader";
import TableShell from "../../Common/TableShell";
import alerts from "../../../utils/alerts";
import MockTestPreviewModal from "./MockTestPreviewModal";

const ManageMockTests = () => {
    const axiosSecure = useAxiosSecure();
    const navigate = useNavigate();

    // Filters and Display States
    const [searchTerm, setSearchTerm] = useState("");
    const [planFilter, setPlanFilter] = useState("all");
    const [examFilter, setExamFilter] = useState("all");
    const [visibilityFilter, setVisibilityFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");
    const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"
    const [selectedIds, setSelectedIds] = useState([]);
    const [previewTest, setPreviewTest] = useState(null);

    const { data: tests = [], isLoading, isError, refetch } = useAdminQuery(
        ["admin-mock-tests"],
        "/mock-tests",
        "tests"
    );

    // KPI Metrics calculation
    const metrics = useMemo(() => {
        const total = tests.length;
        const published = tests.filter(t => t.isPublic).length;
        const draft = total - published;
        const totalAttempts = tests.reduce((sum, t) => sum + (t.attemptsCount || 0), 0);

        return { total, published, draft, totalAttempts };
    }, [tests]);

    // Mutations
    const deleteMutation = useMutation({
        mutationFn: (id) => axiosSecure.delete(`/mock-tests/${id}`),
        onSuccess: () => {
            alerts.success("Deleted!", "The mock test has been removed.");
            refetch();
        }
    });

    const togglePublicMutation = useMutation({
        mutationFn: (id) => axiosSecure.patch(`/mock-tests/${id}/toggle-public`),
        onSuccess: (data) => {
            alerts.success("Status Updated", data.data?.message || "Mock test status updated.");
            refetch();
        }
    });

    const cloneMutation = useMutation({
        mutationFn: (id) => axiosSecure.post(`/mock-tests/${id}/clone`),
        onSuccess: () => {
            alerts.success("Cloned!", "A copy of the mock test was created successfully.");
            refetch();
        }
    });

    const bulkMutation = useMutation({
        mutationFn: ({ action, ids }) => axiosSecure.post(`/mock-tests/bulk`, { action, ids }),
        onSuccess: (data) => {
            alerts.success("Bulk Operation Done", data.data?.message || "Updated selected mock tests.");
            setSelectedIds([]);
            refetch();
        }
    });

    const handleDelete = async (id) => {
        const result = await alerts.confirmAction({
            title: "Are you sure?",
            text: "This action cannot be undone. All results associated with this test might be affected.",
            confirmText: "Yes, delete it!",
            danger: true
        });

        if (result.isConfirmed) {
            deleteMutation.mutate(id);
        }
    };

    const handleTogglePublic = (id) => {
        togglePublicMutation.mutate(id);
    };

    const handleClone = (id) => {
        cloneMutation.mutate(id);
    };

    const handleBulkAction = async (action) => {
        if (selectedIds.length === 0) return;
        const actionLabels = {
            delete: "delete",
            publish: "publish",
            unpublish: "set to draft"
        };
        const result = await alerts.confirmAction({
            title: `Bulk ${action.toUpperCase()}?`,
            text: `Are you sure you want to ${actionLabels[action]} ${selectedIds.length} selected mock test(s)?`,
            confirmText: `Yes, ${action}`,
            danger: action === "delete"
        });

        if (result.isConfirmed) {
            bulkMutation.mutate({ action, ids: selectedIds });
        }
    };

    // Filtered & Sorted tests calculation
    const filteredTests = useMemo(() => {
        return tests
            .filter((test) => {
                const matchesSearch = test.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    test.description?.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesPlan = planFilter === "all" || test.planType === planFilter;
                const matchesExam = examFilter === "all" || (test.examType || "IELTS") === examFilter;
                const matchesVisibility = visibilityFilter === "all" || 
                    (visibilityFilter === "published" && test.isPublic) ||
                    (visibilityFilter === "draft" && !test.isPublic);

                return matchesSearch && matchesPlan && matchesExam && matchesVisibility;
            })
            .sort((a, b) => {
                if (sortBy === "newest") {
                    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                } else if (sortBy === "oldest") {
                    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
                } else if (sortBy === "most-attempted") {
                    return (b.attemptsCount || 0) - (a.attemptsCount || 0);
                } else if (sortBy === "title-asc") {
                    return (a.title || "").localeCompare(b.title || "");
                }
                return 0;
            });
    }, [tests, searchTerm, planFilter, examFilter, visibilityFilter, sortBy]);

    const hasActiveFilters = searchTerm !== "" || planFilter !== "all" || examFilter !== "all" || visibilityFilter !== "all";

    const resetFilters = () => {
        setSearchTerm("");
        setPlanFilter("all");
        setExamFilter("all");
        setVisibilityFilter("all");
        setSortBy("newest");
    };

    // Checkbox helper functions for Table View selection
    const isAllSelected = filteredTests.length > 0 && selectedIds.length === filteredTests.length;
    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredTests.map((t) => t._id));
        }
    };

    const toggleSelectRow = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Page Header */}
            <PageHeader
                title="Manage Mock Tests"
                subtitle="View, create, edit, filter, and monitor student metrics for all full-length IELTS and PTE mock tests."
                action={
                    <Link to="/dashboard/admin/create-mock-test" className="btn btn-primary rounded-2xl gap-2 font-bold shadow-md hover:shadow-lg transition-all">
                        <PiPlus className="text-lg" /> Create Mock Test
                    </Link>
                }
            />

            {/* Executive KPI Metrics Summary Header */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-base-200 shadow-xs flex items-center gap-4">
                    <div className="p-3.5 rounded-2xl bg-primary/10 text-primary text-2xl">
                        <PiFiles />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-base-content/40">Total Mock Tests</p>
                        <h4 className="text-2xl font-black text-base-content mt-0.5">{metrics.total}</h4>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-base-200 shadow-xs flex items-center gap-4">
                    <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600 text-2xl">
                        <PiCheckCircle />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-base-content/40">Published Tests</p>
                        <h4 className="text-2xl font-black text-emerald-600 mt-0.5">{metrics.published}</h4>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-base-200 shadow-xs flex items-center gap-4">
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-600 text-2xl">
                        <PiSparkle />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-base-content/40">Active Drafts</p>
                        <h4 className="text-2xl font-black text-amber-600 mt-0.5">{metrics.draft}</h4>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-base-200 shadow-xs flex items-center gap-4">
                    <div className="p-3.5 rounded-2xl bg-purple-500/10 text-purple-600 text-2xl">
                        <PiUsers />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-base-content/40">Student Attempts</p>
                        <h4 className="text-2xl font-black text-purple-600 mt-0.5">{metrics.totalAttempts}</h4>
                    </div>
                </div>
            </div>

            {/* Sleek Integrated Filter Toolbar */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-base-200 shadow-xs space-y-3">
                <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[280px]">
                        <PiMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40 text-lg" />
                        <input
                            type="text"
                            placeholder="Search tests by title or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input input-bordered w-full pl-11 pr-9 rounded-2xl bg-base-100 focus:bg-white text-sm"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                            >
                                <PiX className="text-base" />
                            </button>
                        )}
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Plan Select */}
                        <div className="flex items-center bg-base-100 border border-base-200 rounded-2xl px-3 py-1.5 gap-2">
                            <span className="text-xs font-bold text-base-content/50 uppercase">Plan:</span>
                            <select
                                value={planFilter}
                                onChange={(e) => setPlanFilter(e.target.value)}
                                className="bg-transparent text-xs font-bold text-base-content focus:outline-hidden cursor-pointer"
                            >
                                <option value="all">All</option>
                                <option value="free">Free</option>
                                <option value="standard">Standard</option>
                                <option value="premium">Premium</option>
                            </select>
                        </div>

                        {/* Exam Select */}
                        <div className="flex items-center bg-base-100 border border-base-200 rounded-2xl px-3 py-1.5 gap-2">
                            <span className="text-xs font-bold text-base-content/50 uppercase">Exam:</span>
                            <select
                                value={examFilter}
                                onChange={(e) => setExamFilter(e.target.value)}
                                className="bg-transparent text-xs font-bold text-base-content focus:outline-hidden cursor-pointer"
                            >
                                <option value="all">All</option>
                                <option value="IELTS">IELTS</option>
                                <option value="PTE">PTE</option>
                            </select>
                        </div>

                        {/* Status Select */}
                        <div className="flex items-center bg-base-100 border border-base-200 rounded-2xl px-3 py-1.5 gap-2">
                            <span className="text-xs font-bold text-base-content/50 uppercase">Status:</span>
                            <select
                                value={visibilityFilter}
                                onChange={(e) => setVisibilityFilter(e.target.value)}
                                className="bg-transparent text-xs font-bold text-base-content focus:outline-hidden cursor-pointer"
                            >
                                <option value="all">All</option>
                                <option value="published">Published</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>

                        {/* Sort Order */}
                        <div className="flex items-center bg-base-100 border border-base-200 rounded-2xl px-3 py-1.5 gap-2">
                            <PiSortAscending className="text-primary text-base" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="bg-transparent text-xs font-bold text-base-content focus:outline-hidden cursor-pointer"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="most-attempted">Most Attempted</option>
                                <option value="title-asc">Title A-Z</option>
                            </select>
                        </div>

                        {/* Reset Filters Pill */}
                        {hasActiveFilters && (
                            <button
                                onClick={resetFilters}
                                className="btn btn-ghost btn-xs text-error gap-1 rounded-xl font-bold"
                            >
                                <PiX /> Clear
                            </button>
                        )}

                        {/* View Switcher Toggle */}
                        <div className="join border border-base-200 rounded-2xl bg-base-100 p-1 ml-auto">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`join-item btn btn-xs border-0 rounded-xl gap-1.5 ${
                                    viewMode === "grid" ? "btn-primary text-white shadow-xs" : "btn-ghost"
                                }`}
                                title="Grid View"
                            >
                                <PiSquaresFour className="text-base" /> Grid
                            </button>
                            <button
                                onClick={() => setViewMode("table")}
                                className={`join-item btn btn-xs border-0 rounded-xl gap-1.5 ${
                                    viewMode === "table" ? "btn-primary text-white shadow-xs" : "btn-ghost"
                                }`}
                                title="Table View"
                            >
                                <PiListBullets className="text-base" /> Table
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bulk Action Bar */}
                {selectedIds.length > 0 && (
                    <div className="flex items-center justify-between bg-primary/10 border border-primary/20 p-3 rounded-2xl animate-fade-in mt-2">
                        <span className="text-xs font-bold text-primary pl-2">
                            {selectedIds.length} mock test(s) selected
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleBulkAction("publish")}
                                className="btn btn-success btn-xs text-white rounded-xl font-bold shadow-xs"
                            >
                                Publish Selected
                            </button>
                            <button
                                onClick={() => handleBulkAction("unpublish")}
                                className="btn btn-warning btn-xs text-white rounded-xl font-bold shadow-xs"
                            >
                                Set to Draft
                            </button>
                            <button
                                onClick={() => handleBulkAction("delete")}
                                className="btn btn-error btn-xs text-white rounded-xl font-bold gap-1 shadow-xs"
                            >
                                <PiTrashSimple /> Delete Selected
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Content Table/Grid Shell */}
            <TableShell
                isLoading={isLoading}
                isError={isError}
                errorText="Failed to load mock tests"
                onRetry={refetch}
                empty={filteredTests.length === 0}
                emptyTitle={tests.length === 0 ? "No Mock Tests Available" : "No Matching Mock Tests"}
                emptyText={
                    tests.length === 0
                        ? "Create your first full-length IELTS or PTE mock test."
                        : "No test matches your search filters. Try clearing your filters."
                }
                emptyIcon={<PiFiles />}
                transparent={true}
                loadingText="Loading mock tests list..."
            >
                {viewMode === "grid" ? (
                    /* REDESIGNED GRID CARDS */
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredTests.map((test) => (
                            <div
                                key={test._id}
                                className="bg-white border border-base-200 shadow-xs hover:shadow-md transition-all rounded-3xl p-6 relative overflow-hidden group flex flex-col justify-between"
                            >
                                {/* Decorative Icon */}
                                <div className="absolute -top-6 -right-6 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                                    <PiTrophy className="w-48 h-48 text-primary" />
                                </div>

                                <div>
                                    {/* Card Top Row */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl flex-shrink-0">
                                                <PiFiles />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-base-content group-hover:text-primary transition-colors line-clamp-1" title={test.title}>
                                                    {test.title}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <span className="flex items-center gap-1 text-[11px] font-bold text-base-content/50">
                                                        <PiClock className="text-primary" /> {test.totalDuration || DEFAULT_MOCK_TEST_DURATION_MINUTES} Mins
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                                        test.planType === 'premium' 
                                                            ? 'bg-amber-100 text-amber-700' 
                                                            : test.planType === 'standard' 
                                                            ? 'bg-sky-100 text-sky-700' 
                                                            : 'bg-base-200 text-base-content/60'
                                                    }`}>
                                                        {test.planType || 'Free'}
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200/50">
                                                        {test.examType || 'IELTS'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Toggle Switch */}
                                        <button
                                            onClick={() => handleTogglePublic(test._id)}
                                            className={`px-3.5 py-1.5 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all shadow-xs gap-1.5 flex items-center cursor-pointer ${
                                                test.isPublic 
                                                    ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                                                    : 'bg-amber-400 text-slate-950 hover:bg-amber-500'
                                            }`}
                                            title="Click to toggle status"
                                        >
                                            <span className={`w-2 h-2 rounded-full ${test.isPublic ? 'bg-white animate-pulse' : 'bg-slate-900'}`} />
                                            {test.isPublic ? "Published" : "Draft"}
                                        </button>
                                    </div>

                                    {/* Module Breakdowns */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
                                        <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-blue-50/60 border border-blue-100">
                                            <PiBookOpen className="text-blue-600 text-base flex-shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold text-blue-900/60 uppercase">Reading</p>
                                                <p className="text-xs font-black text-blue-950">
                                                    {test.sections?.reading?.length || 0} Q
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-purple-50/60 border border-purple-100">
                                            <PiHeadphones className="text-purple-600 text-base flex-shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold text-purple-900/60 uppercase">Listening</p>
                                                <p className="text-xs font-black text-purple-950">
                                                    {test.sections?.listening?.length || 0} Q
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-amber-50/60 border border-amber-100">
                                            <PiPencil className="text-amber-600 text-base flex-shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold text-amber-900/60 uppercase">Writing</p>
                                                <p className="text-xs font-black text-amber-950">
                                                    {test.sections?.writing?.length || 0} Q
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                                            <PiMicrophone className="text-emerald-600 text-base flex-shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold text-emerald-900/60 uppercase">Speaking</p>
                                                <p className="text-xs font-black text-emerald-950">
                                                    {test.sections?.speaking?.length || 0} Q
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Footer Toolbar */}
                                <div className="mt-6 pt-4 border-t border-base-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-1.5 bg-base-100 px-3 py-1.5 rounded-xl border border-base-200 text-xs font-bold text-base-content/60 w-fit">
                                        <PiUsers className="text-primary text-sm" />
                                        <span>{test.attemptsCount || 0} Attempts</span>
                                    </div>

                                    {/* Prominent Text-Labeled Action Buttons */}
                                    <div className="grid grid-cols-4 gap-1.5 sm:flex sm:items-center">
                                        <button
                                            onClick={() => setPreviewTest(test)}
                                            className="btn btn-xs rounded-xl font-bold bg-primary/10 text-primary hover:bg-primary hover:text-white border-0 gap-1 transition-all"
                                            title="Quick Preview"
                                        >
                                            <PiEye className="text-xs" /> Preview
                                        </button>
                                        <button
                                            onClick={() => handleClone(test._id)}
                                            className="btn btn-xs rounded-xl font-bold bg-amber-500/10 text-amber-700 hover:bg-amber-500 hover:text-white border-0 gap-1 transition-all"
                                            title="Clone Test"
                                        >
                                            <PiCopy className="text-xs" /> Clone
                                        </button>
                                        <button
                                            onClick={() => navigate(`/dashboard/admin/edit-mock-test/${test._id}`)}
                                            className="btn btn-xs rounded-xl font-bold bg-sky-500/10 text-sky-700 hover:bg-sky-500 hover:text-white border-0 gap-1 transition-all"
                                            title="Edit Test"
                                        >
                                            <PiPencilSimple className="text-xs" /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(test._id)}
                                            className="btn btn-xs rounded-xl font-bold bg-rose-500/10 text-rose-700 hover:bg-rose-500 hover:text-white border-0 gap-1 transition-all"
                                            title="Delete Test"
                                        >
                                            <PiTrash className="text-xs" /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* POLISHED DENSE TABLE VIEW */
                    <div className="bg-white rounded-3xl border border-base-200 shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="table w-full">
                                <thead>
                                    <tr className="bg-base-100/80 text-[11px] font-extrabold uppercase text-base-content/50 border-b border-base-200">
                                        <th className="w-12 text-center">
                                            <button onClick={toggleSelectAll} className="btn btn-ghost btn-xs">
                                                {isAllSelected ? (
                                                    <PiCheckSquare className="text-primary text-base" />
                                                ) : (
                                                    <PiSquare className="text-base-content/40 text-base" />
                                                )}
                                            </button>
                                        </th>
                                        <th>Mock Test Title</th>
                                        <th>Exam / Plan</th>
                                        <th>Duration</th>
                                        <th>Module Sets</th>
                                        <th>Attempts</th>
                                        <th>Status</th>
                                        <th className="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-base-100">
                                    {filteredTests.map((test) => {
                                        const isSelected = selectedIds.includes(test._id);
                                        const totalQ = (test.sections?.reading?.length || 0) +
                                            (test.sections?.listening?.length || 0) +
                                            (test.sections?.writing?.length || 0) +
                                            (test.sections?.speaking?.length || 0);

                                        return (
                                            <tr key={test._id} className={`hover:bg-base-50/60 transition-colors ${isSelected ? "bg-primary/5" : ""}`}>
                                                <td className="text-center">
                                                    <button onClick={() => toggleSelectRow(test._id)} className="btn btn-ghost btn-xs">
                                                        {isSelected ? (
                                                            <PiCheckSquare className="text-primary text-base" />
                                                        ) : (
                                                            <PiSquare className="text-base-content/40 text-base" />
                                                        )}
                                                    </button>
                                                </td>
                                                <td>
                                                    <div className="font-bold text-sm text-base-content" title={test.title}>{test.title}</div>
                                                    <div className="text-[10px] text-base-content/40">
                                                        Updated: {new Date(test.updatedAt || test.createdAt).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200/50">
                                                            {test.examType || "IELTS"}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                                            test.planType === "premium" ? "bg-amber-100 text-amber-700" : test.planType === "standard" ? "bg-sky-100 text-sky-700" : "bg-base-200 text-base-content/60"
                                                        }`}>
                                                            {test.planType || "Free"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="font-medium text-xs">
                                                    {test.totalDuration || DEFAULT_MOCK_TEST_DURATION_MINUTES} mins
                                                </td>
                                                <td className="font-bold text-xs text-primary">
                                                    {totalQ} Question Sets
                                                </td>
                                                <td className="font-semibold text-xs text-base-content/70">
                                                    {test.attemptsCount || 0} students
                                                </td>
                                                <td>
                                                    <button
                                                        onClick={() => handleTogglePublic(test._id)}
                                                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide transition-all ${
                                                            test.isPublic ? "bg-emerald-500 text-white" : "bg-amber-400 text-slate-900"
                                                        }`}
                                                    >
                                                        {test.isPublic ? "Published" : "Draft"}
                                                    </button>
                                                </td>
                                                <td className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => setPreviewTest(test)}
                                                            className="btn btn-ghost btn-xs btn-circle text-base-content/70 hover:text-primary"
                                                            title="Preview"
                                                        >
                                                            <PiEye className="text-base" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleClone(test._id)}
                                                            className="btn btn-ghost btn-xs btn-circle text-base-content/70 hover:text-amber-600"
                                                            title="Clone"
                                                        >
                                                            <PiCopy className="text-base" />
                                                        </button>
                                                        <button
                                                            onClick={() => navigate(`/dashboard/admin/edit-mock-test/${test._id}`)}
                                                            className="btn btn-ghost btn-xs btn-circle text-base-content/70 hover:text-sky-600"
                                                            title="Edit"
                                                        >
                                                            <PiPencilSimple className="text-base" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(test._id)}
                                                            className="btn btn-ghost btn-xs btn-circle text-base-content/70 hover:text-rose-600"
                                                            title="Delete"
                                                        >
                                                            <PiTrash className="text-base" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </TableShell>

            {/* Quick Preview Modal */}
            {previewTest && (
                <MockTestPreviewModal
                    test={previewTest}
                    onClose={() => setPreviewTest(null)}
                />
            )}
        </div>
    );
};

export default ManageMockTests;
