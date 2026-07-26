import { motion, AnimatePresence } from "framer-motion";
import { FiAlertCircle, FiTrash2, FiTerminal, FiX } from "react-icons/fi";
import { toast } from "react-toastify";

const ErrorLogsTable = ({
    logsData,
    selectedLog,
    setSelectedLog,
    handleClearLogs,
    clearLogsMutation,
    axiosSecure,
    queryClient
}) => {
    return (
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
        </motion.section>
    );
};

export default ErrorLogsTable;
