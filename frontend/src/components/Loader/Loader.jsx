import React from "react";
import { motion } from "framer-motion";

/**
 * Modern Context-Aware Loader
 * Supports 'fullscreen' (default for route fallbacks), 'component' (for card/tab boundaries), and 'inline'.
 */
const Loader = ({
  variant = "fullscreen", // "fullscreen" | "component" | "inline"
  size = "md", // "sm" | "md" | "lg"
  label = "LOADING...",
  className = "",
}) => {
  const sizeMap = {
    sm: { container: "w-8 h-8", stroke: "border-2", text: "text-[10px]" },
    md: { container: "w-14 h-14", stroke: "border-3", text: "text-xs" },
    lg: { container: "w-18 h-18", stroke: "border-4", text: "text-sm" },
  }[size] || { container: "w-14 h-14", stroke: "border-3", text: "text-xs" };

  if (variant === "inline") {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className={`${sizeMap.container} rounded-full ${sizeMap.stroke} border-slate-200 border-t-primary animate-spin`} />
        {label && <span className={`font-bold text-slate-500 ${sizeMap.text}`}>{label}</span>}
      </div>
    );
  }

  const containerClasses =
    variant === "component"
      ? "w-full py-16 flex flex-col items-center justify-center min-h-[220px]"
      : "min-h-screen w-full flex flex-col items-center justify-center bg-[#FAF9F6] dark:bg-gray-900";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={`${containerClasses} ${className}`}
    >
      <div className="relative flex items-center justify-center">
        {/* Soft outer glow ring */}
        <div className="absolute -inset-4 rounded-full bg-primary/10 blur-xl animate-pulse" />
        
        {/* Outer pulsing ring */}
        <div className={`absolute inset-0 rounded-full border border-primary/30 animate-ping`} />

        {/* Modern multi-layer spinner */}
        <div
          className={`${sizeMap.container} rounded-full ${sizeMap.stroke} border-slate-200/60 dark:border-gray-700 border-t-primary dark:border-t-primary animate-spin relative z-10 shadow-sm`}
        />

        {/* Inner brand dot */}
        <div className="absolute w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
      </div>

      {label && (
        <p className={`mt-5 text-primary dark:text-slate-200 font-black tracking-[0.25em] ${sizeMap.text} uppercase animate-pulse select-none`}>
          {label}
        </p>
      )}
    </motion.div>
  );
};

export default Loader;
