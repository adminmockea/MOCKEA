import { motion } from "framer-motion";
import { FiPlay, FiLink, FiExternalLink } from "react-icons/fi";
import { toast } from "react-toastify";

const WatchDemoSettingsCard = ({
    watchDemoForm,
    setWatchDemoForm,
    watchDemoLoading,
    handleWatchDemoSubmit,
    isPending
}) => {
    return (
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
                <form onSubmit={handleWatchDemoSubmit} className="space-y-6">
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
                            disabled={isPending}
                            className="btn btn-primary rounded-xl px-6 font-bold"
                        >
                            {isPending ? 'Saving...' : 'Save Watch Demo Settings'}
                        </button>
                    </div>
                </form>
            )}
        </motion.section>
    );
};

export default WatchDemoSettingsCard;
