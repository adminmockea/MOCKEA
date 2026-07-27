import React from "react";

/**
 * Standardized StatusBadge component for plans, roles, exam types, and submission statuses.
 */
export default function StatusBadge({ type, value, size = "md" }) {
    if (!value) return null;

    const val = String(value).toLowerCase();
    let badgeStyle = "bg-slate-100 text-slate-700 dark:bg-gray-800 dark:text-gray-300 border-slate-200";

    // Plan badges
    if (val === "free") {
        badgeStyle = "bg-slate-100 text-slate-600 border-slate-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
    } else if (val === "standard") {
        badgeStyle = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800";
    } else if (val === "premium") {
        badgeStyle = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 font-bold";
    }

    // Role badges
    else if (val === "superadmin") {
        badgeStyle = "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-700 font-bold";
    } else if (val === "admin") {
        badgeStyle = "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-700 font-semibold";
    } else if (val === "instructor") {
        badgeStyle = "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700";
    } else if (val === "student") {
        badgeStyle = "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-700";
    }

    // Exam Type badges
    else if (val === "ielts") {
        badgeStyle = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800";
    } else if (val === "pte") {
        badgeStyle = "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800";
    } else if (val === "both") {
        badgeStyle = "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800";
    }

    // Status badges
    else if (val === "completed" || val === "graded" || val === "active") {
        badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800";
    } else if (val === "pending" || val === "ongoing") {
        badgeStyle = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800";
    } else if (val === "banned" || val === "terminated" || val === "failed") {
        badgeStyle = "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800";
    }

    const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs";

    return (
        <span className={`inline-flex items-center font-black uppercase tracking-wider rounded-full border ${badgeStyle} ${sizeClasses}`}>
            {value}
        </span>
    );
}
