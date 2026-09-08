import React from "react";
import { createPortal } from "react-dom";
import { FiAlertTriangle } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { modalOverlayVariants, modalPanelVariants } from "../../motion/motionTokens";
import LoadingButton from "./LoadingButton";

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
    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    key="confirm-modal-overlay"
                    variants={modalOverlayVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
                    onClick={onClose}
                >
                    <motion.div 
                        key="confirm-modal-box"
                        variants={modalPanelVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-gray-700"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center space-x-4 mb-4">
                            <div className={`p-3.5 rounded-2xl shrink-0 ${isDanger ? "bg-red-50 text-red-500 dark:bg-red-950/40" : "bg-blue-50 text-blue-500 dark:bg-blue-950/40"}`}>
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
                                className="px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition cursor-pointer disabled:opacity-50"
                            >
                                {cancelText}
                            </button>
                            <LoadingButton
                                type="button"
                                onClick={onConfirm}
                                loading={loading}
                                variant={isDanger ? "danger" : "primary"}
                                size="sm"
                                className="uppercase tracking-wider font-black"
                            >
                                {confirmText}
                            </LoadingButton>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    if (typeof document !== "undefined") {
        return createPortal(modalContent, document.body);
    }

    return modalContent;
}
