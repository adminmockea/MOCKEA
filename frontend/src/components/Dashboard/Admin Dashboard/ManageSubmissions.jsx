import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import {
  PiFileText,
  PiMagnifyingGlass,
  PiTrash,
  PiClock,
  PiCheckCircle,
  PiNotePencil,
  PiMicrophoneStage,
  PiArrowClockwise,
  PiWarning,
  PiBookOpen,
  PiCheckSquareOffset,
} from "react-icons/pi";
import useAxiosSecure from "../../../hooks/useAxiosSecure";

const SKILL_ICONS = {
  writing: <PiNotePencil className="w-4 h-4 text-orange-500" />,
  speaking: <PiMicrophoneStage className="w-4 h-4 text-green-500" />,
};

const STATUS_BADGES = {
  pending: "badge-warning text-warning-content",
  reviewed: "badge-success text-success-content",
};

const MOCK_STATUS_BADGES = {
  ongoing: "badge-info text-info-content",
  completed: "badge-success text-success-content",
  "auto-submitted": "badge-warning text-warning-content",
  terminated: "badge-error text-error-content",
};

const ManageSubmissions = () => {
  const axiosSecure = useAxiosSecure();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("standalone"); // 'standalone' | 'mock'
  const [searchTerm, setSearchTerm] = useState("");
  const [skillFilter, setSkillFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mockStatusFilter, setMockStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);

  // Auto-clear selection state when tab or filters change
  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab, searchTerm, skillFilter, statusFilter, mockStatusFilter]);

  // 1. Fetch standalone submissions
  const {
    data: submissions = [],
    isLoading: isLoadingStandalone,
    isError: isErrorStandalone,
    refetch: refetchStandalone,
    isRefetching: isRefetchingStandalone,
  } = useQuery({
    queryKey: ["admin-submissions"],
    queryFn: async () => {
      const res = await axiosSecure.get("/submissions");
      return res.data.submissions ?? [];
    },
    enabled: activeTab === "standalone",
  });

  // 2. Fetch mock test results
  const {
    data: mockResults = [],
    isLoading: isLoadingMocks,
    isError: isErrorMocks,
    refetch: refetchMocks,
    isRefetching: isRefetchingMocks,
  } = useQuery({
    queryKey: ["admin-mock-results"],
    queryFn: async () => {
      const res = await axiosSecure.get("/mock-tests/results/all");
      return res.data.results ?? [];
    },
    enabled: activeTab === "mock",
  });

  // 3. Standalone delete mutation
  const deleteStandaloneMutation = useMutation({
    mutationFn: async (id) => {
      const res = await axiosSecure.delete(`/submissions/${id}`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-submissions"] });
      setSelectedIds((prev) => prev.filter((item) => item !== data.id));
      toast.success(data.message || "Submission deleted successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete submission");
    },
  });

  // 4. Mock test result delete mutation
  const deleteMockMutation = useMutation({
    mutationFn: async (id) => {
      const res = await axiosSecure.delete(`/mock-tests/results/${id}`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-mock-results"] });
      setSelectedIds((prev) => prev.filter((item) => item !== data.id));
      toast.success(data.message || "Mock test result deleted successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete mock test result");
    },
  });

  // 5. Standalone bulk delete mutation
  const bulkDeleteStandaloneMutation = useMutation({
    mutationFn: async (ids) => {
      const res = await axiosSecure.post("/submissions/bulk-delete", { ids });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-submissions"] });
      setSelectedIds([]);
      toast.success(data.message || "Submissions deleted successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete submissions");
    },
  });

  // 6. Mock result bulk delete mutation
  const bulkDeleteMockMutation = useMutation({
    mutationFn: async (ids) => {
      const res = await axiosSecure.post("/mock-tests/results/bulk-delete", { ids });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-mock-results"] });
      setSelectedIds([]);
      toast.success(data.message || "Mock test results deleted successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete mock test results");
    },
  });

  const handleDeleteStandalone = (id, studentName, title) => {
    Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete the standalone submission for "${title}" by ${studentName}. This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Yes, delete it!",
      customClass: {
        popup: "rounded-[2.5rem] p-8",
        confirmButton: "rounded-xl px-6 py-3 font-bold btn btn-error text-white border-none mx-2",
        cancelButton: "rounded-xl px-6 py-3 font-bold btn btn-ghost border border-slate-200 text-slate-500 hover:bg-slate-50 mx-2"
      }
    }).then((result) => {
      if (result.isConfirmed) {
        deleteStandaloneMutation.mutate(id);
      }
    });
  };

  const handleDeleteMock = (id, studentName, title) => {
    Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete the mock test result for "${title}" by ${studentName}. This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Yes, delete it!",
      customClass: {
        popup: "rounded-[2.5rem] p-8",
        confirmButton: "rounded-xl px-6 py-3 font-bold btn btn-error text-white border-none mx-2",
        cancelButton: "rounded-xl px-6 py-3 font-bold btn btn-ghost border border-slate-200 text-slate-500 hover:bg-slate-50 mx-2"
      }
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMockMutation.mutate(id);
      }
    });
  };

  // Filtered standalone submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const matchesSearch =
        sub.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSkill = skillFilter === "all" || sub.testType === skillFilter;
      const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
      return matchesSearch && matchesSkill && matchesStatus;
    });
  }, [submissions, searchTerm, skillFilter, statusFilter]);

  // Filtered mock test results
  const filteredMockResults = useMemo(() => {
    return mockResults.filter((res) => {
      const studentName = res.userId?.name || "";
      const studentEmail = res.userId?.email || "";
      const testTitle = res.testId?.title || "";

      const matchesSearch =
        studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        testTitle.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = mockStatusFilter === "all" || res.status === mockStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [mockResults, searchTerm, mockStatusFilter]);

  // Selection helpers
  const currentFilteredItems = activeTab === "standalone" ? filteredSubmissions : filteredMockResults;

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(currentFilteredItems.map((item) => item._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    const count = selectedIds.length;
    const typeLabel = activeTab === "standalone" ? "standalone submission(s)" : "mock test result(s)";
    Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete ${count} selected ${typeLabel}. This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#6B7280",
      confirmButtonText: `Yes, delete ${count} item${count > 1 ? "s" : ""}`,
      customClass: {
        popup: "rounded-[2.5rem] p-8",
        confirmButton: "rounded-xl px-6 py-3 font-bold btn btn-error text-white border-none mx-2",
        cancelButton: "rounded-xl px-6 py-3 font-bold btn btn-ghost border border-slate-200 text-slate-500 hover:bg-slate-50 mx-2"
      }
    }).then((result) => {
      if (result.isConfirmed) {
        if (activeTab === "standalone") {
          bulkDeleteStandaloneMutation.mutate(selectedIds);
        } else {
          bulkDeleteMockMutation.mutate(selectedIds);
        }
      }
    });
  };

  const handleRefresh = () => {
    setSelectedIds([]);
    if (activeTab === "standalone") {
      refetchStandalone();
    } else {
      refetchMocks();
    }
  };

  const isTabLoading = activeTab === "standalone" ? isLoadingStandalone : isLoadingMocks;
  const isTabError = activeTab === "standalone" ? isErrorStandalone : isErrorMocks;
  const isTabRefetching = activeTab === "standalone" ? isRefetchingStandalone : isRefetchingMocks;

  return (
    <div className="space-y-8 p-4 md:p-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-800 dark:text-white flex items-center gap-3">
            <PiFileText className="text-primary w-9 h-9" />
            Manage Submissions &amp; Results
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium italic">
            "Review and delete student test submissions and mock exam results."
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isTabLoading || isTabRefetching}
          className="btn btn-outline btn-primary rounded-2xl px-5 h-12 font-black self-start sm:self-auto flex items-center gap-2"
        >
          <PiArrowClockwise className={`w-4 h-4 ${isTabRefetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex justify-start border-b border-gray-200 dark:border-gray-700 pb-2">
        <div className="tabs tabs-boxed gap-2 p-1 bg-gray-100/80 dark:bg-gray-800 rounded-2xl" role="tablist" aria-label="Submission type">
          <button
            role="tab"
            aria-selected={activeTab === "standalone"}
            aria-controls="panel-standalone"
            id="tab-standalone"
            onClick={() => {
              setActiveTab("standalone");
              setSearchTerm("");
            }}
            className={`tab rounded-xl px-6 h-10 font-black text-xs uppercase tracking-widest transition-all ${
              activeTab === "standalone"
                ? "tab-active bg-white text-primary shadow-xs"
                : "text-gray-500 hover:text-gray-800 dark:hover:text-white"
            }`}
          >
            Standalone Labs
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "mock"}
            aria-controls="panel-mock"
            id="tab-mock"
            onClick={() => {
              setActiveTab("mock");
              setSearchTerm("");
            }}
            className={`tab rounded-xl px-6 h-10 font-black text-xs uppercase tracking-widest transition-all ${
              activeTab === "mock"
                ? "tab-active bg-white text-primary shadow-xs"
                : "text-gray-500 hover:text-gray-800 dark:hover:text-white"
            }`}
          >
            Mock Test Results
          </button>
        </div>
      </div>

      {/* Filters & Search bar */}
      <div className="flex flex-col lg:flex-row gap-4 bg-white dark:bg-gray-850 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <PiMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={
              activeTab === "standalone"
                ? "Search by student name, email, or task..."
                : "Search by student name, email, or mock test..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-bordered w-full pl-12 rounded-2xl h-12 focus:ring-0 font-medium text-sm border-gray-200 dark:border-gray-700 bg-gray-50/50 focus:bg-white focus:border-primary"
          />
        </div>

        {/* Conditional Filters depending on tab */}
        {activeTab === "standalone" ? (
          <div className="flex gap-4">
            {/* Skill Filter */}
            <div className="relative">
              <select
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                className="select select-bordered rounded-2xl h-12 font-black text-xs uppercase tracking-widest px-6 pr-10 border-gray-200 dark:border-gray-700 bg-gray-50/50 appearance-none min-w-[150px]"
              >
                <option value="all">All Skills</option>
                <option value="writing">Writing</option>
                <option value="speaking">Speaking</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="select select-bordered rounded-2xl h-12 font-black text-xs uppercase tracking-widest px-6 pr-10 border-gray-200 dark:border-gray-700 bg-gray-50/50 appearance-none min-w-[170px]"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending Review</option>
                <option value="reviewed">Reviewed</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="flex gap-4">
            {/* Mock Test Status Filter */}
            <div className="relative">
              <select
                value={mockStatusFilter}
                onChange={(e) => setMockStatusFilter(e.target.value)}
                className="select select-bordered rounded-2xl h-12 font-black text-xs uppercase tracking-widest px-6 pr-10 border-gray-200 dark:border-gray-700 bg-gray-50/50 appearance-none min-w-[190px]"
              >
                <option value="all">All Statuses</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="auto-submitted">Auto-Submitted</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center bg-primary/10 dark:bg-primary/20 border border-primary/20 p-4 px-6 rounded-2xl gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <PiCheckSquareOffset className="w-6 h-6 text-primary" />
            <span className="text-sm font-black text-gray-800 dark:text-white">
              {selectedIds.length} item{selectedIds.length > 1 ? "s" : ""} selected
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedIds([])}
              className="btn btn-ghost btn-xs font-bold text-gray-600 dark:text-gray-300 rounded-xl px-3"
            >
              Deselect All
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleteStandaloneMutation.isPending || bulkDeleteMockMutation.isPending}
              className="btn btn-error btn-sm font-bold text-white rounded-xl flex items-center gap-1.5 px-4 shadow-xs"
            >
              <PiTrash className="w-4 h-4" />
              Delete Selected ({selectedIds.length})
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === "standalone" ? (
            /* STANDALONE LABS TABLE */
            <div role="tabpanel" id="panel-standalone" aria-labelledby="tab-standalone">
            <table className="table w-full text-left">
              <thead>
                <tr className="bg-gray-50/70 dark:bg-gray-900/40 text-gray-550 border-b border-gray-100 dark:border-gray-700">
                  <th className="pl-8 pr-3 py-5 w-12 text-center">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-xs checkbox-primary cursor-pointer"
                      checked={filteredSubmissions.length > 0 && filteredSubmissions.every((sub) => selectedIds.includes(sub._id))}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Student</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Skill</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Task Title</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Submitted At</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Status</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Graded By</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {isTabLoading ? (
                  <tr>
                    <td colSpan="8" className="py-20 text-center">
                      <span className="loading loading-spinner loading-lg text-primary" />
                    </td>
                  </tr>
                ) : isTabError ? (
                  <tr>
                    <td colSpan="8" className="py-20 text-center text-error font-extrabold">
                      Failed to load standalone submissions.
                    </td>
                  </tr>
                ) : filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-20 text-center text-gray-400 italic font-semibold">
                      No standalone submissions found.
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((sub) => {
                    const submitDate = new Date(sub.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                    const submitTime = new Date(sub.createdAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const isSelected = selectedIds.includes(sub._id);

                    return (
                      <tr
                        key={sub._id}
                        className={`group transition-colors ${
                          isSelected
                            ? "bg-primary/5 dark:bg-primary/10 hover:bg-primary/10"
                            : "hover:bg-gray-50/50 dark:hover:bg-gray-755/30"
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="pl-8 pr-3 py-5 text-center">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-xs checkbox-primary cursor-pointer"
                            checked={isSelected}
                            onChange={() => handleSelectRow(sub._id)}
                          />
                        </td>

                        {/* Student */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary font-black uppercase text-base">
                              {sub.userName?.charAt(0) || "?"}
                            </div>
                            <div>
                              <div className="text-sm font-black text-gray-800 dark:text-white leading-tight">
                                {sub.userName}
                              </div>
                              <div className="text-xs text-gray-400 font-medium mt-0.5">
                                {sub.userEmail}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Skill */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <span className="p-2 bg-gray-100 dark:bg-gray-700 rounded-xl">
                              {SKILL_ICONS[sub.testType] ?? <PiFileText className="w-4 h-4 text-gray-500" />}
                            </span>
                            <span className="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">
                              {sub.testType}
                            </span>
                          </div>
                        </td>

                        {/* Task Title */}
                        <td className="px-6 py-5 max-w-[200px]">
                          <div className="text-sm font-extrabold text-gray-800 dark:text-white truncate" title={sub.title}>
                            {sub.title}
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-5">
                          <div>
                            <div className="text-sm font-bold text-gray-700 dark:text-gray-300">
                              {submitDate}
                            </div>
                            <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">
                              {submitTime}
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-5">
                          <span
                            className={`badge badge-sm font-black text-[9px] uppercase tracking-widest px-2.5 py-2.5 rounded-lg border-none ${
                              STATUS_BADGES[sub.status] ?? "badge-ghost"
                            }`}
                          >
                            {sub.status === "pending" ? (
                              <span className="flex items-center gap-1">
                                <PiClock className="w-3.5 h-3.5" /> Pending
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <PiCheckCircle className="w-3.5 h-3.5" /> Reviewed
                              </span>
                            )}
                          </span>
                        </td>

                        {/* Graded By */}
                        <td className="px-6 py-5">
                          {sub.status === "reviewed" ? (
                            <div>
                              <div className="text-sm font-extrabold text-slate-800 dark:text-white leading-tight">
                                {sub.reviewedByName || "Instructor"}
                              </div>
                              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">
                                {sub.reviewedByEmail}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-300 dark:text-gray-650 font-extrabold uppercase tracking-widest">
                              —
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="px-8 py-5 text-center">
                          <button
                            onClick={() => handleDeleteStandalone(sub._id, sub.userName, sub.title)}
                            disabled={deleteStandaloneMutation.isPending}
                            className="btn btn-ghost btn-circle text-error hover:bg-error/10"
                            title="Delete submission"
                          >
                            <PiTrash className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            </div>
          ) : (
            /* MOCK TEST RESULTS TABLE */
            <div role="tabpanel" id="panel-mock" aria-labelledby="tab-mock">
            <table className="table w-full text-left">
              <thead>
                <tr className="bg-gray-50/70 dark:bg-gray-900/40 text-gray-550 border-b border-gray-100 dark:border-gray-700">
                  <th className="pl-8 pr-3 py-5 w-12 text-center">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-xs checkbox-primary cursor-pointer"
                      checked={filteredMockResults.length > 0 && filteredMockResults.every((res) => selectedIds.includes(res._id))}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Student</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Type</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Mock Test Title</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Attempt Date</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Status</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Evaluators</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {isTabLoading ? (
                  <tr>
                    <td colSpan="8" className="py-20 text-center">
                      <span className="loading loading-spinner loading-lg text-primary" />
                    </td>
                  </tr>
                ) : isTabError ? (
                  <tr>
                    <td colSpan="8" className="py-20 text-center text-error font-extrabold">
                      Failed to load mock test results.
                    </td>
                  </tr>
                ) : filteredMockResults.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-20 text-center text-gray-400 italic font-semibold">
                      No mock test results found.
                    </td>
                  </tr>
                ) : (
                  filteredMockResults.map((res) => {
                    const studentName = res.userId?.name || "Unknown Student";
                    const studentEmail = res.userId?.email || "Unknown Email";
                    const testTitle = res.testId?.title || "Mock Test (Deleted template)";
                    const dateStr = new Date(res.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                    const timeStr = new Date(res.createdAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const isSelected = selectedIds.includes(res._id);

                    // Collect evaluated by names from the section results
                    const graders = res.sectionResults
                      ?.filter((s) => s.isGraded && s.reviewedByName)
                      ?.map((s) => s.reviewedByName);
                    const uniqueGraders = graders ? Array.from(new Set(graders)) : [];
                    const graderText = uniqueGraders.length > 0 ? uniqueGraders.join(", ") : "AI / Auto";

                    return (
                      <tr
                        key={res._id}
                        className={`group transition-colors ${
                          isSelected
                            ? "bg-primary/5 dark:bg-primary/10 hover:bg-primary/10"
                            : "hover:bg-gray-50/50 dark:hover:bg-gray-755/30"
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="pl-8 pr-3 py-5 text-center">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-xs checkbox-primary cursor-pointer"
                            checked={isSelected}
                            onChange={() => handleSelectRow(res._id)}
                          />
                        </td>

                        {/* Student */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-secondary/10 dark:bg-secondary/20 flex items-center justify-center text-secondary font-black uppercase text-base">
                              {studentName.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-black text-gray-800 dark:text-white leading-tight">
                                {studentName}
                              </div>
                              <div className="text-xs text-gray-400 font-medium mt-0.5">
                                {studentEmail}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Skill Badge (Full Mock) */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <span className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded-xl">
                              <PiBookOpen className="w-4 h-4 text-purple-500" />
                            </span>
                            <span className="text-xs font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">
                              Full Mock
                            </span>
                          </div>
                        </td>

                        {/* Test Title */}
                        <td className="px-6 py-5 max-w-[200px]">
                          <div className="text-sm font-extrabold text-gray-800 dark:text-white truncate" title={testTitle}>
                            {testTitle}
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-5">
                          <div>
                            <div className="text-sm font-bold text-gray-700 dark:text-gray-300">
                              {dateStr}
                            </div>
                            <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">
                              {timeStr}
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-5">
                          <span
                            className={`badge badge-sm font-black text-[9px] uppercase tracking-widest px-2.5 py-2.5 rounded-lg border-none ${
                              MOCK_STATUS_BADGES[res.status] ?? "badge-ghost"
                            }`}
                          >
                            {res.status}
                          </span>
                        </td>

                        {/* Evaluators */}
                        <td className="px-6 py-5">
                          <div className="text-sm font-extrabold text-slate-800 dark:text-white leading-tight">
                            {graderText}
                          </div>
                          {res.tabSwitchCount > 0 && (
                            <div className="text-[9px] text-error font-black uppercase tracking-widest mt-0.5 flex items-center gap-1">
                              <PiWarning className="w-3.5 h-3.5" /> {res.tabSwitchCount} tab switches
                            </div>
                          )}
                        </td>

                        {/* Action */}
                        <td className="px-8 py-5 text-center">
                          <button
                            onClick={() => handleDeleteMock(res._id, studentName, testTitle)}
                            disabled={deleteMockMutation.isPending}
                            className="btn btn-ghost btn-circle text-error hover:bg-error/10"
                            title="Delete result"
                          >
                            <PiTrash className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageSubmissions;
