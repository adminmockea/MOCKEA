import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { PiClockFill, PiFileTextFill } from "react-icons/pi";
import { getSetCategory, getCategoryBadgeStyle } from "../../utils/questionCategoryUtils";

export default function PracticeSetSelector({
    sets = [],
    onSelect,
    onSelectSet,
    title,
    subtitle,
    emptyTitle = "No Sessions Available",
    emptySuggestions = [],
    actionText = "Change Exam Preference →",
    actionLink = "/dashboard/profile",
    trackExam = "IELTS",
    icon,
    timeLabel = "15m",
    actionLabel = "Open Test",
}) {
    const handleSelect = onSelect || onSelectSet || (() => {});
    const [selectedCategory, setSelectedCategory] = useState("ALL");

    const categories = useMemo(() => {
        const map = new Map();
        sets.forEach(set => {
            const cat = getSetCategory(set);
            map.set(cat, (map.get(cat) || 0) + 1);
        });
        return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
    }, [sets]);

    const filteredSets = useMemo(() => {
        if (selectedCategory === "ALL") return sets;
        return sets.filter(set => getSetCategory(set) === selectedCategory);
    }, [sets, selectedCategory]);

    if (sets.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-xl mx-auto py-12"
            >
                <div className="card bg-white p-10 border border-slate-200 rounded-[3rem] shadow-sm text-center space-y-6">
                    <div className="w-20 h-20 rounded-[2rem] bg-amber-50 border border-amber-100 flex items-center justify-center text-4xl mx-auto">
                        🎤
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black tracking-tight text-slate-800">
                            {emptyTitle}
                        </h3>
                        <p className="text-slate-500 font-medium leading-relaxed">
                            No content is available for your current exam track{" "}
                            <span className="font-black text-primary">({trackExam})</span>.
                        </p>
                    </div>
                    {emptySuggestions.length > 0 && (
                        <ul className="text-left space-y-3 text-sm text-slate-500 font-medium">
                            {emptySuggestions.map((s, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">
                                        {idx + 1}
                                    </span>
                                    <span>{s}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                    {actionLink && (
                        <a
                            href={actionLink}
                            className="btn btn-primary btn-block rounded-2xl h-14 font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20"
                        >
                            {actionText}
                        </a>
                    )}
                </div>
            </motion.div>
        );
    }

    return (
        <div className="space-y-8">
            {(title || subtitle) && (
                <div>
                    {title && <h2 className="text-2xl font-black text-slate-800">{title}</h2>}
                    {subtitle && <p className="text-slate-500 font-medium">{subtitle}</p>}
                </div>
            )}

            {/* Category Filter Tabs */}
            {categories.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    <button
                        onClick={() => setSelectedCategory("ALL")}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border ${
                            selectedCategory === "ALL"
                            ? "bg-slate-900 text-white border-slate-900 shadow-md scale-[1.02]"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                    >
                        All Categories ({sets.length})
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.name}
                            onClick={() => setSelectedCategory(cat.name)}
                            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border flex items-center gap-2 ${
                                selectedCategory === cat.name
                                ? "bg-primary text-white border-primary shadow-md scale-[1.02]"
                                : "bg-white text-slate-600 border-slate-200 hover:border-primary/30 hover:bg-slate-50"
                            }`}
                        >
                            <span>{cat.name}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                selectedCategory === cat.name ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                            }`}>
                                {cat.count}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {filteredSets.length === 0 ? (
                <div className="p-12 text-center bg-white border border-slate-200 rounded-[2.5rem]">
                    <p className="text-slate-500 font-bold text-sm">No modules found for category "{selectedCategory}".</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredSets.map((set, idx) => {
                        const categoryName = getSetCategory(set);
                        return (
                            <motion.div
                                key={set._id}
                                whileHover={{ y: -10 }}
                                className="card bg-white p-8 rounded-[3rem] border border-base-300 shadow-sm hover:shadow-2xl hover:border-primary/30 cursor-pointer group transition-all"
                                onClick={() => handleSelect(set._id)}
                            >
                                <div className="flex flex-col h-full space-y-6">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl group-hover:bg-primary group-hover:text-white transition-all flex-shrink-0">
                                            {icon || <PiFileTextFill />}
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5 flex-1 min-w-0">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-base-content/20">
                                                Session {idx + 1}
                                            </span>
                                            {categoryName && (
                                                <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border truncate max-w-full ${getCategoryBadgeStyle(categoryName)}`}>
                                                    {categoryName}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-black group-hover:text-primary transition-colors text-slate-800">
                                        {set.title}
                                    </h3>
                                    <div className="flex items-center gap-3 flex-wrap text-[10px] font-black uppercase tracking-widest text-base-content/40">
                                        <span className="flex items-center gap-1.5"><PiClockFill /> {set.timeLimit ? `${set.timeLimit}m` : (set.examType === "PTE" ? "20m" : timeLabel)}</span>
                                        <span className="flex items-center gap-1.5">{icon || <PiFileTextFill />} {actionLabel}</span>
                                        {set.examType && (
                                            <span className={`badge badge-sm font-black ${
                                                set.examType === "IELTS" ? "badge-primary" :
                                                set.examType === "PTE" ? "badge-success" : "badge-warning"
                                            }`}>{set.examType}</span>
                                        )}
                                    </div>
                                    <button className="btn btn-block rounded-2xl h-14 bg-primary text-white border-none transition-all font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 hover:bg-slate-900">
                                        Start Test
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
