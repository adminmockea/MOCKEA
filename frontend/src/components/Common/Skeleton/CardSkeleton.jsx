import React from 'react';
import Skeleton from './Skeleton';

/**
 * CardSkeleton: Shimmer placeholder for grid cards (Mock tests, courses, trainers, etc.)
 */
export default function CardSkeleton({ count = 1, className = '' }) {
  const cards = Array.from({ length: count });

  return (
    <>
      {cards.map((_, idx) => (
        <div
          key={idx}
          className={`flex flex-col justify-between rounded-[2.5rem] bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 p-8 shadow-sm space-y-6 ${className}`}
        >
          {/* Header Row: Badge & Index placeholder */}
          <div className="flex items-center justify-between">
            <Skeleton className="w-12 h-6 rounded-lg" />
            <Skeleton className="w-24 h-6 rounded-xl" />
          </div>

          {/* Title and description */}
          <div className="space-y-3">
            <Skeleton className="w-3/4 h-8 rounded-xl" />
            <Skeleton className="w-1/2 h-4 rounded-md" />
          </div>

          {/* Middle feature pill box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-gray-900/40 border border-slate-100 dark:border-gray-800 flex items-center gap-3">
            <Skeleton variant="circular" className="w-10 h-10 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="w-1/3 h-3" />
              <Skeleton className="w-2/3 h-4" />
            </div>
          </div>

          {/* Footer Action Button placeholder */}
          <Skeleton className="w-full h-14 rounded-2xl" />
        </div>
      ))}
    </>
  );
}
