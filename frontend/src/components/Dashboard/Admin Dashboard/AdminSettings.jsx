import { FiTerminal } from "react-icons/fi";
import useAxiosSecure from "../../../hooks/useAxiosSecure";
import { useQueryClient } from "@tanstack/react-query";
import useAdminSettings from "../../../hooks/useAdminSettings";
import ChatbotSettingsCard from "./AdminSettings/ChatbotSettingsCard";
import WatchDemoSettingsCard from "./AdminSettings/WatchDemoSettingsCard";
import ErrorLogsTable from "./AdminSettings/ErrorLogsTable";

const AdminSettings = () => {
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();

    const {
        logsData,
        isLoading,
        isError,
        chatbotLoading,
        chatbotForm,
        setChatbotForm,
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
    } = useAdminSettings();

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="text-center p-10 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">
                <p className="text-red-500 font-medium">Failed to load error logs. Please check your connection.</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-8 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center">
                    <FiTerminal className="mr-3 text-gray-500" />
                    System Settings
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage platform configuration and view backend activity.</p>
            </div>

            <ChatbotSettingsCard 
                chatbotForm={chatbotForm}
                setChatbotForm={setChatbotForm}
                chatbotLoading={chatbotLoading}
                handleChatbotSubmit={handleChatbotSubmit}
                isPending={updateChatbotMutation.isPending}
            />

            <WatchDemoSettingsCard 
                watchDemoForm={watchDemoForm}
                setWatchDemoForm={setWatchDemoForm}
                watchDemoLoading={watchDemoLoading}
                handleWatchDemoSubmit={handleWatchDemoSubmit}
                isPending={updateWatchDemoMutation.isPending}
            />

            <ErrorLogsTable 
                logsData={logsData}
                selectedLog={selectedLog}
                setSelectedLog={setSelectedLog}
                handleClearLogs={handleClearLogs}
                clearLogsMutation={clearLogsMutation}
                axiosSecure={axiosSecure}
                queryClient={queryClient}
            />
        </div>
    );
};

export default AdminSettings;
