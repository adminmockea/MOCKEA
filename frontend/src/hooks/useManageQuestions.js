import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useAdminQuery from "./useAdminQuery";
import useAxiosSecure from "./useAxiosSecure";
import alerts from "../utils/alerts";

export const useManageQuestions = () => {
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();

    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [viewMode, setViewMode] = useState("grid"); // "grid" or "table"
    const [filterType, setFilterType] = useState("all");
    const [filterPlan, setFilterPlan] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");

    const { data: questions = [], isLoading, isError, refetch } = useAdminQuery(
        ["admin-questions"],
        "/questions",
        "questions"
    );

    const uniqueTypes = useMemo(() => {
        const types = [...new Set(questions.map((q) => q.testType).filter(Boolean))];
        return ["all", ...types];
    }, [questions]);

    const filteredQuestions = useMemo(() => {
        return questions.filter((q) => {
            const matchesType = filterType === "all" || q.testType === filterType;
            const matchesPlan = filterPlan === "all" || q.forPlanType === filterPlan;
            const matchesStatus = filterStatus === "all" ||
                (filterStatus === "active" ? q.isActive !== false : q.isActive === false);
            let matchesSearch = true;
            if (searchQuery) {
                try {
                    const regex = new RegExp(searchQuery, "i");
                    matchesSearch = regex.test(q.title || "");
                } catch (e) {
                    matchesSearch = q.title?.toLowerCase().includes(searchQuery.toLowerCase());
                }
            }
            return matchesType && matchesPlan && matchesStatus && matchesSearch;
        });
    }, [questions, filterType, filterPlan, filterStatus, searchQuery]);

    const toggleStatusMutation = useMutation({
        mutationFn: ({ id, isActive }) => axiosSecure.put(`/questions/${id}`, { isActive }),
        onSuccess: () => {
            alerts.success("Status Updated", "The question set status has been updated.");
            queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
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
            queryClient.invalidateQueries({ queryKey: ["admin-questions-for-bundle"] });
            refetch();
        },
        onError: (err) => {
            alerts.error("Bulk Operation Failed", err.response?.data?.message || "Failed to execute bulk update.");
        }
    });

    const handleBulkAction = async (action, value) => {
        if (action === "delete") {
            const result = await alerts.confirmDelete("selected question sets");
            if (!result.isConfirmed) return;
        }
        bulkMutation.mutate({ ids: selectedIds, action, value });
    };

    return {
        questions,
        filteredQuestions,
        uniqueTypes,
        isLoading,
        isError,
        refetch,
        selectedQuestion,
        setSelectedQuestion,
        viewMode,
        setViewMode,
        filterType,
        setFilterType,
        filterPlan,
        setFilterPlan,
        filterStatus,
        setFilterStatus,
        isFilterOpen,
        setIsFilterOpen,
        selectedIds,
        setSelectedIds,
        searchQuery,
        setSearchQuery,
        handleToggleStatus,
        handleDelete,
        handleSelectRow,
        handleSelectAll,
        handleBulkAction
    };
};

export default useManageQuestions;
