import { useState, useRef, useEffect } from "react";
import { 
    PiFunnelFill, 
    PiCaretDownBold, 
    PiCheckBold, 
    PiMagnifyingGlassBold, 
    PiXBold 
} from "react-icons/pi";
import { motion, AnimatePresence } from "framer-motion";

export default function CategoryDropdown({
    categories = [],
    selectedCategory = "ALL",
    onSelectCategory,
    totalCount = 0,
    placeholder = "Search category..."
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const dropdownRef = useRef(null);

    // Close on outside click or Escape key
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleKeyDown);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    // Reset search when dropdown closes
    useEffect(() => {
        if (!isOpen) setSearch("");
    }, [isOpen]);

    const activeCatObj = categories.find((c) => c.name === selectedCategory);
    const currentLabel = selectedCategory === "ALL" 
        ? "All Categories" 
        : (activeCatObj?.name || selectedCategory);
    const currentCount = selectedCategory === "ALL" 
        ? totalCount 
        : (activeCatObj?.count ?? 0);

    const filteredCategories = categories.filter((cat) =>
        cat.name.toLowerCase().includes(search.toLowerCase().trim())
    );

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            {/* Trigger Button */}
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => setIsOpen((prev) => !prev)}
                    className={`inline-flex items-center justify-between gap-3 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer shadow-xs hover:shadow-md ${
                        selectedCategory !== "ALL"
                            ? "bg-slate-900 text-white border-slate-900 hover:bg-slate-800 scale-[1.01]"
                            : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                >
                    <span className="flex items-center gap-2.5">
                        <PiFunnelFill className={`text-sm flex-shrink-0 ${selectedCategory !== "ALL" ? "text-primary-foreground/80" : "text-slate-400"}`} />
                        <span className="max-w-[220px] sm:max-w-[340px] truncate text-left">
                            {currentLabel}
                        </span>
                    </span>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            selectedCategory !== "ALL" 
                                ? "bg-white/20 text-white" 
                                : "bg-slate-100 text-slate-600"
                        }`}>
                            {currentCount}
                        </span>
                        <PiCaretDownBold 
                            className={`text-xs transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} 
                        />
                    </div>
                </button>

                {/* Reset button if not "ALL" */}
                {selectedCategory !== "ALL" && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelectCategory("ALL");
                        }}
                        title="Reset to All Categories"
                        className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer text-xs"
                    >
                        <PiXBold />
                    </button>
                )}
            </div>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 mt-2 w-[320px] sm:w-[400px] max-w-[90vw] bg-white rounded-3xl border border-slate-200 shadow-2xl p-3 z-50 overflow-hidden"
                    >
                        {/* Search category input if many categories */}
                        {categories.length > 5 && (
                            <div className="relative mb-2">
                                <PiMagnifyingGlassBold className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={placeholder}
                                    className="w-full pl-8 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
                                    autoFocus
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch("")}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                                    >
                                        <PiXBold />
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="max-h-72 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                            {/* "ALL CATEGORIES" option */}
                            {(!search || "all categories".includes(search.toLowerCase())) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onSelectCategory("ALL");
                                        setIsOpen(false);
                                    }}
                                    className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-between gap-2 transition-all text-left cursor-pointer ${
                                        selectedCategory === "ALL"
                                            ? "bg-slate-900 text-white shadow-sm"
                                            : "hover:bg-slate-50 text-slate-700"
                                    }`}
                                >
                                    <span className="flex items-center gap-2">
                                        {selectedCategory === "ALL" && <PiCheckBold className="text-xs flex-shrink-0" />}
                                        <span>All Categories</span>
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        selectedCategory === "ALL" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                                    }`}>
                                        {totalCount}
                                    </span>
                                </button>
                            )}

                            {/* Category options */}
                            {filteredCategories.map((cat) => {
                                const isSelected = selectedCategory === cat.name;
                                return (
                                    <button
                                        key={cat.name}
                                        type="button"
                                        onClick={() => {
                                            onSelectCategory(cat.name);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold tracking-wide flex items-center justify-between gap-2 transition-all text-left cursor-pointer ${
                                            isSelected
                                                ? "bg-slate-900 text-white shadow-sm font-black uppercase tracking-wider"
                                                : "hover:bg-slate-50 text-slate-700 hover:text-slate-900"
                                        }`}
                                    >
                                        <span className="flex items-center gap-2 truncate pr-2">
                                            {isSelected && <PiCheckBold className="text-xs flex-shrink-0" />}
                                            <span className="truncate">{cat.name}</span>
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${
                                            isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                                        }`}>
                                            {cat.count}
                                        </span>
                                    </button>
                                );
                            })}

                            {filteredCategories.length === 0 && search && (
                                <div className="py-6 text-center text-xs text-slate-400 font-medium">
                                    No categories match "{search}"
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
