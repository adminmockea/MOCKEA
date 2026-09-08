import React from "react";
import { PiWarning, PiDatabase } from "react-icons/pi";
import { motion, AnimatePresence } from "framer-motion";
import TableSkeleton from "./Skeleton/TableSkeleton";
import { fadeIn } from "../../motion/motionTokens";

export default function TableShell({
    isLoading,
    isError,
    errorText = "Failed to load data.",
    empty,
    emptyTitle = "No Data Found",
    emptyText = "There are no records to display at this time.",
    emptyIcon,
    loadingText = "Loading content...",
    onRetry,
    transparent = false,
    skeletonRows = 5,
    skeletonColumns = 4,
    children,
}) {
    if (isLoading) {
        return (
            <motion.div 
                key="table-loading"
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-slate-100 dark:border-gray-700 p-6 overflow-hidden"
            >
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-gray-700">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500 animate-pulse">
                        {loadingText}
                    </span>
                </div>
                <TableSkeleton rows={skeletonRows} columns={skeletonColumns} />
            </motion.div>
        );
    }

    if (isError) {
        return (
            <motion.div 
                key="table-error"
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col items-center justify-center py-16 space-y-4 bg-white dark:bg-gray-800 rounded-3xl border border-slate-100 dark:border-gray-700 shadow-sm text-center px-6"
            >
                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-500">
                    <PiWarning className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white">{errorText}</h3>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="btn btn-sm btn-outline rounded-xl font-bold hover:scale-105 transition-transform"
                    >
                        Try Again
                    </button>
                )}
            </motion.div>
        );
    }

    if (empty) {
        return (
            <motion.div 
                key="table-empty"
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="card bg-white dark:bg-gray-800 p-16 text-center border border-slate-100 dark:border-gray-700 rounded-[2rem] shadow-sm space-y-4"
            >
                <div className="w-20 h-20 bg-slate-50 dark:bg-gray-700 text-slate-300 dark:text-gray-500 rounded-full flex items-center justify-center mx-auto text-3xl">
                    {emptyIcon || <PiDatabase />}
                </div>
                <h3 className="text-xl font-black text-slate-700 dark:text-white">{emptyTitle}</h3>
                {emptyText && (
                    <p className="text-slate-400 dark:text-gray-400 text-sm max-w-sm mx-auto font-medium">
                        {emptyText}
                    </p>
                )}
            </motion.div>
        );
    }

    if (transparent) {
        return (
            <AnimatePresence mode="wait">
                <motion.div key="table-content" variants={fadeIn} initial="hidden" animate="visible">
                    {children}
                </motion.div>
            </AnimatePresence>
        );
    }

    return (
        <AnimatePresence mode="wait">
            <motion.div 
                key="table-content"
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-slate-100 dark:border-gray-700 overflow-hidden"
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
