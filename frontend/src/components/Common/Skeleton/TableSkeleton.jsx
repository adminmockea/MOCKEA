import React from 'react';
import Skeleton from './Skeleton';

/**
 * TableSkeleton: Shimmer placeholder for data tables (Activity feed, users, questions, etc.)
 */
export default function TableSkeleton({ rows = 5, columns = 4, className = '' }) {
  const rowList = Array.from({ length: rows });
  const colList = Array.from({ length: columns });

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      {/* Table Header placeholder */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-gray-700 px-4">
        {colList.map((_, i) => (
          <Skeleton
            key={i}
            className={`h-4 rounded-md ${i === 0 ? 'w-28' : 'w-20'}`}
          />
        ))}
      </div>

      {/* Table Body rows */}
      <div className="divide-y divide-slate-100 dark:divide-gray-800">
        {rowList.map((_, rIdx) => (
          <div
            key={rIdx}
            className="flex items-center justify-between py-5 px-4 space-x-4"
          >
            {colList.map((_, cIdx) => (
              <div
                key={cIdx}
                className={`flex items-center gap-3 ${cIdx === 0 ? 'flex-1' : 'w-24 justify-end'}`}
              >
                {cIdx === 0 && (
                  <Skeleton variant="circular" className="w-9 h-9 shrink-0" />
                )}
                <Skeleton
                  className={`h-5 rounded-lg ${
                    cIdx === 0 ? 'w-3/5' : cIdx === 1 ? 'w-16' : 'w-20'
                  }`}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
