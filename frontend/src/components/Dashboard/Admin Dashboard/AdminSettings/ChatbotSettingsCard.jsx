import { motion } from "framer-motion";

const ChatbotSettingsCard = ({
    chatbotForm,
    setChatbotForm,
    chatbotLoading,
    handleChatbotSubmit,
    isPending
}) => {
    return (
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
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">AI Study Buddy &amp; Chatbot Settings</h2>
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
                <form onSubmit={handleChatbotSubmit} className="space-y-6">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Greeting message */}
                        <div className="md:col-span-2 flex flex-col space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Welcome Message</label>
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
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Guest Daily Message Limit</label>
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
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Free Tier Daily Message Limit</label>
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
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Standard Tier Daily Message Limit</label>
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
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Premium Tier Daily Message Limit</label>
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
                            disabled={isPending}
                            className="btn btn-primary rounded-xl px-6 font-bold"
                        >
                            {isPending ? 'Saving...' : 'Save Chatbot Settings'}
                        </button>
                    </div>
                </form>
            )}
        </motion.section>
    );
};

export default ChatbotSettingsCard;
