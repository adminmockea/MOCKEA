import React from 'react';
import { motion } from 'framer-motion';
import { springs } from '../../motion/motionTokens';

/**
 * LoadingButton: Ultra-smooth interactive button that prevents width-jumping layout shifts,
 * provides tactile spring physics (whileTap / whileHover), and elegant loading spinner cross-fading.
 */
export default function LoadingButton({
  children,
  loading = false,
  disabled = false,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg'
  type = 'button',
  onClick,
  className = '',
  icon,
  ...props
}) {
  const sizeClasses = {
    sm: 'px-4 py-2 text-xs rounded-xl font-bold gap-1.5',
    md: 'px-6 py-3 text-sm font-black rounded-2xl gap-2',
    lg: 'px-8 py-4 text-base font-black rounded-[1.5rem] gap-2.5',
  }[size] || 'px-6 py-3 text-sm font-black rounded-2xl gap-2';

  const variantClasses = {
    primary:
      'bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 border border-transparent',
    secondary:
      'bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-slate-900/10 border border-transparent',
    outline:
      'bg-transparent border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-gray-800',
    danger:
      'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20 border border-transparent',
    ghost:
      'bg-transparent text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800 border-none',
  }[variant] || 'bg-primary text-white';

  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      whileHover={!isDisabled ? { scale: 1.02 } : undefined}
      whileTap={!isDisabled ? { scale: 0.97 } : undefined}
      transition={springs.snappy}
      className={`relative inline-flex items-center justify-center select-none transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {/* Invisible content copy to strictly lock button width */}
      <span className="opacity-0 pointer-events-none flex items-center justify-center gap-2" aria-hidden="true">
        {icon && <span className="shrink-0">{icon}</span>}
        <span>{children}</span>
      </span>

      {/* Actual interactive content container */}
      <span
        className={`absolute inset-0 flex items-center justify-center gap-2 transition-opacity duration-200 ${
          loading ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        <span>{children}</span>
      </span>

      {/* Loading Spinner overlay with smooth fade */}
      <span
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
          loading ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <svg
          className="animate-spin h-5 w-5 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </span>
    </motion.button>
  );
}
