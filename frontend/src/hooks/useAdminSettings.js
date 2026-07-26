import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useAxiosSecure from "./useAxiosSecure";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

export const useAdminSettings = () => {
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();

    const [selectedLog, setSelectedLog] = useState(null);
    const [chatbotForm, setChatbotForm] = useState(null);
    const [watchDemoForm, setWatchDemoForm] = useState(null);

    const { data: logsData, isLoading, isError } = useQuery({
        queryKey: ['error-logs'],
        queryFn: async () => {
            const res = await axiosSecure.get('/settings/logs');
            return res.data.logs;
        }
    });

    const { data: chatbotData, isLoading: chatbotLoading } = useQuery({
        queryKey: ['chatbot-settings'],
        queryFn: async () => {
            const res = await axiosSecure.get('/chatbot/settings');
            return res.data.settings;
        }
    });

    const { data: watchDemoData, isLoading: watchDemoLoading } = useQuery({
        queryKey: ['watch-demo-settings'],
        queryFn: async () => {
            const res = await axiosSecure.get('/settings/watch-demo');
            return res.data;
        }
    });

    const updateChatbotMutation = useMutation({
        mutationFn: async (updatedSettings) => {
            const res = await axiosSecure.put('/chatbot/settings', updatedSettings);
            return res.data.settings;
        },
        onSuccess: () => {
            toast.success('Chatbot settings updated successfully');
            queryClient.invalidateQueries({ queryKey: ['chatbot-settings'] });
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update chatbot settings');
        }
    });

    const updateWatchDemoMutation = useMutation({
        mutationFn: async (updatedData) => {
            const res = await axiosSecure.put('/settings/watch-demo', updatedData);
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(data.message || 'Watch Demo settings updated successfully');
            queryClient.invalidateQueries({ queryKey: ['watch-demo-settings'] });
            queryClient.invalidateQueries({ queryKey: ['public-settings'] });
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update Watch Demo settings');
        }
    });

    useEffect(() => {
        if (chatbotData && !chatbotForm) {
            setChatbotForm({
                isActive: chatbotData.isActive,
                welcomeMessage: chatbotData.welcomeMessage,
                guestLimit: chatbotData.guestLimit,
                freeLimit: chatbotData.freeLimit,
                standardLimit: chatbotData.standardLimit,
                premiumLimit: chatbotData.premiumLimit,
            });
        }
    }, [chatbotData, chatbotForm]);

    useEffect(() => {
        if (watchDemoData && !watchDemoForm) {
            setWatchDemoForm({
                watchDemoUrl: watchDemoData.watchDemoUrl || '',
                watchDemoEnabled: watchDemoData.watchDemoEnabled !== false,
            });
        }
    }, [watchDemoData, watchDemoForm]);

    const clearLogsMutation = useMutation({
        mutationFn: async () => {
            await axiosSecure.delete('/settings/logs');
        },
        onSuccess: () => {
            toast.success('Error logs cleared successfully');
            queryClient.invalidateQueries({ queryKey: ['error-logs'] });
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to clear logs');
        }
    });

    const handleClearLogs = async () => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: "Are you sure you want to clear all error logs? This cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#EF4444",
            cancelButtonColor: "#6B7280",
            confirmButtonText: "Yes, clear them!",
            background: "#ffffff",
            customClass: {
                popup: "rounded-[2rem]",
                confirmButton: "rounded-xl px-6 py-2.5 font-bold",
                cancelButton: "rounded-xl px-6 py-2.5 font-bold"
            }
        });

        if (result.isConfirmed) {
            clearLogsMutation.mutate();
        }
    };

    const handleChatbotSubmit = (e) => {
        e.preventDefault();
        if (!chatbotForm) return;
        updateChatbotMutation.mutate(chatbotForm);
    };

    const handleWatchDemoSubmit = (e) => {
        e.preventDefault();
        if (!watchDemoForm) return;
        updateWatchDemoMutation.mutate(watchDemoForm);
    };

    return {
        logsData,
        isLoading,
        isError,
        chatbotData,
        chatbotLoading,
        chatbotForm,
        setChatbotForm,
        watchDemoData,
        watchDemoLoading,
        watchDemoForm,
        setWatchDemoForm,
        selectedLog,
        setSelectedLog,
        handleClearLogs,
        handleChatbotSubmit,
        handleWatchDemoSubmit,
        updateChatbotMutation,
        updateWatchDemoMutation,
        clearLogsMutation
    };
};

export default useAdminSettings;
