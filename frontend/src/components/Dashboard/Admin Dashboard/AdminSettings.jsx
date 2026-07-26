import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import { toast } from 'react-toastify';
import { FiTrash2, FiAlertCircle, FiX, FiTerminal, FiPlay, FiExternalLink, FiRefreshCw, FiLink } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';

const AdminSettings = () => {
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

            {/* AI Chatbot Configuration Section */}
            <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden p-6 space-y-6"
            >
                <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-800 pb-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">AI Study Buddy & Chatbot Settings</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Configure global limits, greetings, and active status for the AI bot.</p>
                        </div>
                    </div>
                    
                    {chatbotForm && (
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                                {chatbotForm.isActive ? 'Active' : 'Offline'}
                            </span>
                            <input 
                                type="checkbox" 
                                className="toggle toggle-primary toggle-md" 
                                checked={chatbotForm.isActive}
                                onChange={(e) => setChatbotForm({ ...chatbotForm, isActive: e.target.checked })}
                            />
                        </div>
                    )}
                </div>

                {chatbotLoading || !chatbotForm ? (
                    <div className="flex justify-center items-center py-10">
                        <span className="loading loading-spinner text-primary"></span>
                    </div>
                ) : (
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        updateChatbotMutation.mutate(chatbotForm);
                    }} className="space-y-6">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Greeting message */}
                            <div className="md:col-span-2 flex flex-col space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 font-semibold">Welcome Message</label>
                                <textarea 
                                    className="textarea textarea-bordered w-full focus:textarea-primary rounded-xl"
                                    rows={3}
                                    value={chatbotForm.welcomeMessage}
                                    onChange={(e) => setChatbotForm({ ...chatbotForm, welcomeMessage: e.target.value })}
                                    placeholder="Type the welcome greeting for students..."
                                    required
                                />
                            </div>

                            {/* Limits */}
                            <div className="flex flex-col space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 font-semibold">Guest Daily Message Limit</label>
                                <input 
                                    type="number" 
                                    className="input input-bordered w-full focus:input-primary rounded-xl"
                                    min={0}
                                    value={chatbotForm.guestLimit}
                                    onChange={(e) => setChatbotForm({ ...chatbotForm, guestLimit: parseInt(e.target.value) || 0 })}
                                    required
                                />
                            </div>

                            <div className="flex flex-col space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 font-semibold">Free Tier Daily Message Limit</label>
                                <input 
                                    type="number" 
                                    className="input input-bordered w-full focus:input-primary rounded-xl"
                                    min={0}
                                    value={chatbotForm.freeLimit}
                                    onChange={(e) => setChatbotForm({ ...chatbotForm, freeLimit: parseInt(e.target.value) || 0 })}
                                    required
                                />
                            </div>

                            <div className="flex flex-col space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 font-semibold">Standard Tier Daily Message Limit</label>
                                <input 
                                    type="number" 
                                    className="input input-bordered w-full focus:input-primary rounded-xl"
                                    min={0}
                                    value={chatbotForm.standardLimit}
                                    onChange={(e) => setChatbotForm({ ...chatbotForm, standardLimit: parseInt(e.target.value) || 0 })}
                                    required
                                />
                            </div>

                            <div className="flex flex-col space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 font-semibold">Premium Tier Daily Message Limit</label>
                                <input 
                                    type="number" 
                                    className="input input-bordered w-full focus:input-primary rounded-xl"
                                    min={0}
                                    value={chatbotForm.premiumLimit}
                                    onChange={(e) => setChatbotForm({ ...chatbotForm, premiumLimit: parseInt(e.target.value) || 0 })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-800">
                            <button 
                                type="submit" 
                                disabled={updateChatbotMutation.isPending}
                                className="btn btn-primary rounded-xl px-6 font-bold"
                            >
                                {updateChatbotMutation.isPending ? 'Saving...' : 'Save Chatbot Settings'}
                            </button>
                        </div>
                    </form>
                )}
            </motion.section>

            {/* Watch Demo Link & Action Settings Section */}
            <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden p-6 space-y-6"
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4 gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl">
                            <FiPlay className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Watch Demo Button Link Settings</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Configure destination URL for the 'Watch Demo' hero button. Supports Google Drive, YouTube, Loom, or any link.</p>
                        </div>
                    </div>
                    
                    {watchDemoForm && (
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                                {watchDemoForm.watchDemoEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                            <input 
                                type="checkbox" 
                                className="toggle toggle-secondary toggle-md" 
                                checked={watchDemoForm.watchDemoEnabled}
                                onChange={(e) => setWatchDemoForm({ ...watchDemoForm, watchDemoEnabled: e.target.checked })}
                            />
                        </div>
                    )}
                </div>

                {watchDemoLoading || !watchDemoForm ? (
                    <div className="flex justify-center items-center py-8">
                        <span className="loading loading-spinner text-primary"></span>
                    </div>
                ) : (
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        updateWatchDemoMutation.mutate(watchDemoForm);
                    }} className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex flex-col space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                    Destination URL (Google Drive, YouTube, Loom, External Site)
                                </label>
                                <div className="relative flex items-center">
                                    <FiLink className="absolute left-4 text-gray-400 text-lg" />
                                    <input 
                                        type="text" 
                                        className="input input-bordered w-full pl-11 pr-4 focus:input-primary rounded-xl"
                                        placeholder="e.g. https://drive.google.com/file/d/... or https://youtube.com/watch?v=..."
                                        value={watchDemoForm.watchDemoUrl}
                                        onChange={(e) => setWatchDemoForm({ ...watchDemoForm, watchDemoUrl: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Quick Presets / Help Chips */}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                <span className="text-xs font-semibold text-gray-500">Preset Samples:</span>
                                <button 
                                    type="button"
                                    onClick={() => setWatchDemoForm({ ...watchDemoForm, watchDemoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" })}
                                    className="px-3 py-1 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
                                >
                                    YouTube Demo
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setWatchDemoForm({ ...watchDemoForm, watchDemoUrl: "https://drive.google.com/file/d/1234567890/view" })}
                                    className="px-3 py-1 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                                >
                                    Google Drive Link
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setWatchDemoForm({ ...watchDemoForm, watchDemoUrl: "https://www.loom.com/share/demo" })}
                                    className="px-3 py-1 bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300 rounded-lg text-xs font-medium hover:bg-purple-100 transition-colors"
                                >
                                    Loom Video
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                            <div className="flex items-center gap-2">
                                <button 
                                    type="button"
                                    onClick={() => {
                                        if (!watchDemoForm.watchDemoUrl) {
                                            toast.warn('Please enter a URL to test');
                                            return;
                                        }
                                        let testUrl = watchDemoForm.watchDemoUrl.trim();
                                        if (!/^https?:\/\//i.test(testUrl) && !testUrl.startsWith('/')) {
                                            testUrl = `https://${testUrl}`;
                                        }
                                        window.open(testUrl, '_blank', 'noopener,noreferrer');
                                    }}
                                    className="btn btn-outline btn-sm rounded-xl font-bold gap-1.5"
                                >
                                    <FiExternalLink /> Test Link
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setWatchDemoForm({ watchDemoUrl: '', watchDemoEnabled: false })}
                                    className="btn btn-ghost btn-sm text-red-500 rounded-xl font-medium"
                                >
                                    Clear / Disable
                                </button>
                            </div>

                            <button 
                                type="submit" 
                                disabled={updateWatchDemoMutation.isPending}
                                className="btn btn-primary rounded-xl px-6 font-bold"
                            >
                                {updateWatchDemoMutation.isPending ? 'Saving...' : 'Save Watch Demo Settings'}
                            </button>
                        </div>
                    </form>
                )}
            </motion.section>

            {/* Error Logs Section */}
            <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden"
            >
                <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                    <div className="flex items-center space-x-2">
                        <FiAlertCircle className="text-red-500 text-xl" />
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white"> Error Logs</h2>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button 
                            onClick={async () => {
                                try {
                                    await axiosSecure.get('/settings/logs/test-error');
                                } catch (error) {
                                    toast.success('Test error triggered!');
                                    queryClient.invalidateQueries({ queryKey: ['error-logs'] });
                                }
                            }}
                            className="btn btn-sm bg-blue-50 hover:bg-blue-100 text-blue-600 border-none dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400 transition-colors"
                        >
                            Trigger Test Error
                        </button>
                        <button 
                            onClick={handleClearLogs}
                            disabled={clearLogsMutation.isPending || logsData?.length === 0}
                            className="btn btn-sm bg-red-50 hover:bg-red-100 text-red-600 border-none dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 transition-colors"
                        >
                            <FiTrash2 className="mr-1" />
                            {clearLogsMutation.isPending ? 'Clearing...' : 'Clear All'}
                        </button>
                    </div>
                </div>

                <div className="p-0 bg-gray-950 font-mono text-sm overflow-x-auto min-h-[300px]">
                    {logsData?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                            <FiTerminal className="text-4xl mb-2 opacity-20" />
                            <p>No recent errors found.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-800 text-gray-400">
                                    <th className="py-3 px-4 w-48 whitespace-nowrap">Timestamp</th>
                                    <th className="py-3 px-4 w-24">Method</th>
                                    <th className="py-3 px-4 w-64">Path</th>
                                    <th className="py-3 px-4 w-24">Status</th>
                                    <th className="py-3 px-4">Message</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logsData?.map((log) => (
                                    <tr 
                                        key={log._id} 
                                        onClick={() => setSelectedLog(log)}
                                        className={`border-b border-gray-800/50 cursor-pointer transition-colors text-gray-300 ${
                                            log.method?.startsWith('CLIENT') 
                                                ? 'hover:bg-purple-950/30 bg-purple-950/10' 
                                                : 'hover:bg-gray-800/50'
                                        }`}
                                    >
                                        <td className="py-3 px-4 text-xs text-gray-500">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                log.method === 'GET' ? 'bg-blue-900/50 text-blue-400' :
                                                log.method === 'POST' ? 'bg-green-900/50 text-green-400' :
                                                log.method === 'DELETE' ? 'bg-red-900/50 text-red-400' :
                                                log.method === 'CLIENT' ? 'bg-purple-950/60 text-purple-300 border border-purple-500/20 font-semibold' :
                                                log.method === 'CLIENT_GLOBAL' ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-500/20 font-semibold' :
                                                log.method === 'CLIENT_PROMISE' ? 'bg-fuchsia-950/60 text-fuchsia-300 border border-fuchsia-500/20 font-semibold' :
                                                log.method === 'CLIENT_RENDER' ? 'bg-rose-950/60 text-rose-300 border border-rose-500/20 font-bold animate-pulse' :
                                                log.method?.startsWith('CLIENT_') ? 'bg-purple-950/60 text-purple-300 border border-purple-500/20 font-semibold' :
                                                'bg-gray-800 text-gray-400'
                                            }`}>
                                                {log.method || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 truncate max-w-[200px] text-gray-400">
                                            {log.path || '-'}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`${
                                                log.status >= 500 ? 'text-red-400' : 'text-yellow-400'
                                            }`}>
                                                {log.status || 500}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 truncate max-w-xs text-red-300">
                                            {log.message}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </motion.section>

            {/* Stack Trace Modal */}
            <AnimatePresence>
                {selectedLog && (
                    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col border border-gray-700"
                        >
                            <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-950">
                                <h3 className="text-lg font-bold text-red-400 font-mono">
                                    Error Details
                                </h3>
                                <button 
                                    onClick={() => setSelectedLog(null)}
                                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <FiX className="text-xl" />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto font-mono text-sm">
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-gray-950 p-3 rounded-lg border border-gray-800">
                                        <div className="text-gray-500 text-xs mb-1">Time</div>
                                        <div className="text-gray-300">{new Date(selectedLog.createdAt).toLocaleString()}</div>
                                    </div>
                                    <div className="bg-gray-950 p-3 rounded-lg border border-gray-800">
                                        <div className="text-gray-500 text-xs mb-1">Source / Location</div>
                                        <div className="text-gray-300 flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                selectedLog.method === 'GET' ? 'bg-blue-900/50 text-blue-400' :
                                                selectedLog.method === 'POST' ? 'bg-green-900/50 text-green-400' :
                                                selectedLog.method === 'DELETE' ? 'bg-red-900/50 text-red-400' :
                                                selectedLog.method?.startsWith('CLIENT') ? 'bg-purple-900/50 text-purple-300 border border-purple-500/20' :
                                                'bg-gray-800 text-gray-400'
                                            }`}>
                                                {selectedLog.method}
                                            </span>
                                            <span className="truncate max-w-[280px]" title={selectedLog.path}>
                                                {selectedLog.path}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-gray-950 p-3 rounded-lg border border-gray-800">
                                        <div className="text-gray-500 text-xs mb-1">Status Code</div>
                                        <div className="text-yellow-400">{selectedLog.status || '500'}</div>
                                    </div>
                                    <div className="bg-gray-950 p-3 rounded-lg border border-gray-800">
                                        <div className="text-gray-500 text-xs mb-1">User Email</div>
                                        <div className="text-gray-300">{selectedLog.userEmail || 'Anonymous / Not Available'}</div>
                                    </div>
                                </div>
                                
                                <div className="mb-4">
                                    <div className="text-gray-500 text-xs mb-2 uppercase tracking-wider">Message</div>
                                    <div className="bg-red-950/30 text-red-400 p-4 rounded-lg border border-red-900/50">
                                        {selectedLog.message}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-gray-500 text-xs mb-2 uppercase tracking-wider">Stack Trace</div>
                                    <pre className="bg-gray-950 text-gray-400 p-4 rounded-lg border border-gray-800 whitespace-pre-wrap break-all overflow-x-auto text-xs leading-relaxed">
                                        {selectedLog.stack || 'No stack trace available.'}
                                    </pre>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminSettings;
