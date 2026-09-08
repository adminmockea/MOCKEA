import React from 'react';
import Skeleton from './Skeleton';

/**
 * StatSkeleton: Shimmer placeholder for KPI stat cards
 */
export default function StatSkeleton({ count = 1, className = '' }) {
  const cards = Array.from({ length: count });

  return (
    <>
      {cards.map((_, idx) => (
        <div
          key={idx}
          className={`stat bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-slate-100 dark:border-gray-700 p-6 flex flex-col justify-between ${className}`}
        >
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <Skeleton className="w-20 h-3 rounded-md" />
              <Skeleton className="w-32 h-9 rounded-xl mt-1" />
            </div>
            <Skeleton variant="circular" className="w-14 h-14 shrink-0 rounded-2xl" />
          </div>
          <div className="mt-4 pt-2">
            <Skeleton className="w-28 h-4 rounded-md" />
          </div>
        </div>
      ))}
    </>
  );
}
