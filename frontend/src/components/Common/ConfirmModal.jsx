import React from "react";
import { FiAlertTriangle } from "react-icons/fi";

export default function ConfirmModal({
    isOpen,
    title = "Confirm Action",
    message = "Are you sure you want to proceed? This action cannot be undone.",
    confirmText = "Confirm",
    cancelText = "Cancel",
    isDanger = false,
    loading = false,
    onConfirm,
    onClose
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-gray-700">
                <div className="flex items-center space-x-4 mb-4">
                    <div className={`p-3 rounded-2xl ${isDanger ? "bg-red-50 text-red-500 dark:bg-red-950/40" : "bg-blue-50 text-blue-500 dark:bg-blue-950/40"}`}>
                        <FiAlertTriangle className="text-2xl" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white">
                        {title}
                    </h3>
                </div>

                <p className="text-slate-600 dark:text-gray-300 text-sm mb-6 leading-relaxed">
                    {message}
                </p>

                <div className="flex items-center justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider text-white shadow-lg transition ${
                            isDanger
                                ? "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                                : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
                        }`}
                    >
                        {loading ? "Processing..." : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
