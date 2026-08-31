import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useAdminQuery from "./useAdminQuery";
import useAxiosSecure from "./useAxiosSecure";
import alerts from "../utils/alerts";
import { getSetCategory } from "../utils/questionCategoryUtils";

export const useManageQuestions = () => {
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState("IELTS"); // "IELTS", "PTE", or "ALL"
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [viewMode, setViewMode] = useState("grid"); // "grid" or "table"
    const [filterType, setFilterType] = useState("all");
    const [filterSubCategory, setFilterSubCategory] = useState("all");
    const [filterPlan, setFilterPlan] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterMockStatus, setFilterMockStatus] = useState("all");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortField, setSortField] = useState(null);
    const [sortDirection, setSortDirection] = useState("asc");

    // Primary question query filtered by activeTab parameter
    const { data: questions = [], isLoading, isError, refetch } = useAdminQuery(
        ["admin-questions", activeTab],
        `/questions?examType=${activeTab}`,
        "questions"
    );

    // All questions query to maintain counts across tabs
    const { data: allQuestions = [] } = useAdminQuery(
        ["admin-questions-all"],
        "/questions?examType=ALL",
        "questions"
    );

    const counts = useMemo(() => {
        const pool = allQuestions.length > 0 ? allQuestions : questions;
        const ielts = pool.filter((q) => !q.examType || q.examType === "IELTS" || q.examType === "BOTH").length;
        const pte = pool.filter((q) => q.examType === "PTE" || q.examType === "BOTH").length;
        const all = pool.length;
        return { ielts, pte, all };
    }, [allQuestions, questions]);

    const uniqueTypes = useMemo(() => {
        const types = [...new Set(questions.map((q) => q.category || q.testType).filter(Boolean))];
        const formatted = types.map((t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
        const unique = [...new Set(formatted)].sort();
        return ["all", ...unique];
    }, [questions]);

    const uniqueSubCategories = useMemo(() => {
        const list = questions.map((q) => q.subCategory || getSetCategory(q)).filter(Boolean);
        const unique = [...new Set(list)].sort((a, b) => a.localeCompare(b));
        return ["all", ...unique];
    }, [questions]);

    const filteredQuestions = useMemo(() => {
        const result = questions.filter((q) => {
            const matchesExamTab = activeTab === "ALL" ||
                (activeTab === "IELTS" ? (!q.examType || q.examType === "IELTS" || q.examType === "BOTH") :
                (activeTab === "PTE" ? (q.examType === "PTE" || q.examType === "BOTH") : true));

            const catVal = (q.category || q.testType || "").toLowerCase();
            const matchesType = filterType === "all" || catVal === filterType.toLowerCase();

            const subCatVal = (q.subCategory || getSetCategory(q) || "").toLowerCase();
            const matchesSubCategory = filterSubCategory === "all" || subCatVal === filterSubCategory.toLowerCase();

            const matchesPlan = filterPlan === "all" || q.forPlanType === filterPlan;
            const matchesStatus = filterStatus === "all" ||
                (filterStatus === "active" ? q.isActive !== false : q.isActive === false);
            const matchesMockStatus = filterMockStatus === "all" ||
                (filterMockStatus === "in_mock" ? (q.usedInMockTests && q.usedInMockTests.length > 0) : (!q.usedInMockTests || q.usedInMockTests.length === 0));

            let matchesSearch = true;
            if (searchQuery) {
                try {
                    const regex = new RegExp(searchQuery, "i");
                    matchesSearch = regex.test(q.title || "");
                } catch (e) {
                    matchesSearch = q.title?.toLowerCase().includes(searchQuery.toLowerCase());
                }
            }
            return matchesExamTab && matchesType && matchesSubCategory && matchesPlan && matchesStatus && matchesMockStatus && matchesSearch;
        });

        if (!sortField) return result;

        return [...result].sort((a, b) => {
            let aVal = "";
            let bVal = "";

            if (sortField === "category") {
                aVal = (a.category || a.testType || "").toLowerCase();
                bVal = (b.category || b.testType || "").toLowerCase();
            } else if (sortField === "subCategory") {
                aVal = (a.subCategory || getSetCategory(a) || "").toLowerCase();
                bVal = (b.subCategory || getSetCategory(b) || "").toLowerCase();
            } else if (sortField === "title") {
                aVal = (a.title || "").toLowerCase();
                bVal = (b.title || "").toLowerCase();
            } else if (sortField === "exam") {
                aVal = (a.examType || "").toLowerCase();
                bVal = (b.examType || "").toLowerCase();
            } else if (sortField === "questionsCount") {
                const countA = a.questions?.length || 0;
                const countB = b.questions?.length || 0;
                return sortDirection === "asc" ? countA - countB : countB - countA;
            } else if (sortField === "createdAt") {
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();
                return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
            }

            const cmp = aVal.localeCompare(bVal);
            return sortDirection === "asc" ? cmp : -cmp;
        });
    }, [questions, activeTab, filterType, filterSubCategory, filterPlan, filterStatus, filterMockStatus, searchQuery, sortField, sortDirection]);

    const handleSort = (field) => {
        if (sortField === field) {
            if (sortDirection === "asc") {
                setSortDirection("desc");
            } else {
                setSortField(null);
                setSortDirection("asc");
            }
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const toggleStatusMutation = useMutation({
        mutationFn: ({ id, isActive }) => axiosSecure.put(`/questions/${id}`, { isActive }),
        onSuccess: () => {
            alerts.success("Status Updated", "The question set status has been updated.");
            queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
            queryClient.invalidateQueries({ queryKey: ["admin-questions-all"] });
            queryClient.invalidateQueries({ queryKey: ["admin-questions-for-bundle"] });
            refetch();
        },
        onError: (err) => {
            alerts.error("Error", err.response?.data?.message || "Failed to update status.");
        }
    });

    const handleToggleStatus = (id, currentStatus) => {
        toggleStatusMutation.mutate({ id, isActive: !currentStatus });
    };

    const deleteMutation = useMutation({
        mutationFn: (id) => axiosSecure.delete(`/questions/${id}`),
        onSuccess: () => {
            alerts.success("Deleted!", "The question has been removed from the bank.");
            queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
            queryClient.invalidateQueries({ queryKey: ["admin-questions-all"] });
            queryClient.invalidateQueries({ queryKey: ["admin-questions-for-bundle"] });
            refetch();
        }
    });

    const handleDelete = async (id) => {
        const result = await alerts.confirmDelete("question");

        if (result.isConfirmed) {
            deleteMutation.mutate(id);
        }
    };

    const handleSelectRow = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            const allVisibleIds = filteredQuestions.map((q) => q._id);
            setSelectedIds(allVisibleIds);
        } else {
            setSelectedIds([]);
        }
    };

    const bulkMutation = useMutation({
        mutationFn: (payload) => axiosSecure.post("/questions/bulk-update", payload),
        onSuccess: (res) => {
            alerts.success("Success", res.data.message || "Bulk operation completed.");
            setSelectedIds([]);
            queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
            queryClient.invalidateQueries({ queryKey: ["admin-questions-all"] });
            queryClient.invalidateQueries({ queryKey: ["admin-questions-for-bundle"] });
            refetch();
        },
        onError: (err) => {
            alerts.error("Bulk Operation Failed", err.response?.data?.message || "Failed to execute bulk update.");
        }
    });

    const handleBulkAction = async (action, value) => {
        let finalAction = action;
        if (action === "setActive") {
            finalAction = "update-status";
        }

        if (finalAction === "delete") {
            const result = await alerts.confirmDelete("selected question sets");
            if (!result.isConfirmed) return;
        }

        if (finalAction === "update-timer") {
            const result = await alerts.promptTimer(selectedIds.length);
            if (!result.isConfirmed) return;
            value = result.value;
        }

        bulkMutation.mutate({ ids: selectedIds, action: finalAction, value });
    };

    return {
        activeTab,
        setActiveTab,
        counts,
        questions,
        filteredQuestions,
        uniqueTypes,
        uniqueSubCategories,
        isLoading,
        isError,
        refetch,
        selectedQuestion,
        setSelectedQuestion,
        viewMode,
        setViewMode,
        filterType,
        setFilterType,
        filterSubCategory,
        setFilterSubCategory,
        filterPlan,
        setFilterPlan,
        filterStatus,
        setFilterStatus,
        filterMockStatus,
        setFilterMockStatus,
        isFilterOpen,
        setIsFilterOpen,
        selectedIds,
        setSelectedIds,
        searchQuery,
        setSearchQuery,
        sortField,
        setSortField,
        sortDirection,
        setSortDirection,
        handleSort,
        handleToggleStatus,
        handleDelete,
        handleSelectRow,
        handleSelectAll,
        handleBulkAction
    };
};

export default useManageQuestions;
