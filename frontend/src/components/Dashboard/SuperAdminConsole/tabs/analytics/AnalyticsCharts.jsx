import { useState } from "react";
import { motion } from "framer-motion";

/**
 * Reusable, responsive SVG Time-Series Spline Chart
 * Zero external charting dependencies; theme-adaptive with hover tooltips.
 */
export const TimeSeriesChart = ({
  data = [],
  series = [
    { key: "pageviews", label: "Pageviews", color: "#3b82f6" },
    { key: "uniqueVisitors", label: "Unique Visitors", color: "#10b981" },
  ],
  height = 220,
}) => {
  const [hoverIndex, setHoverIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
        No timeseries data available for this timeframe.
      </div>
    );
  }

  const chartWidth = 600;
  const paddingLeft = 45;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 35;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  // Find max value across all requested series
  let maxValue = 1;
  data.forEach((item) => {
    series.forEach((s) => {
      const val = Number(item[s.key]) || 0;
      if (val > maxValue) maxValue = val;
    });
  });
  // Add 10% breathing headroom
  maxValue = Math.ceil(maxValue * 1.15) || 5;

  // Calculate coordinates for each series
  const seriesPaths = series.map((s) => {
    let pathD = "";
    let areaD = "";
    const points = [];

    data.forEach((item, idx) => {
      const x = paddingLeft + idx * (plotWidth / (data.length - 1 || 1));
      const val = Number(item[s.key]) || 0;
      const yPercent = val / maxValue;
      const y = height - paddingBottom - yPercent * plotHeight;

      points.push({ x, y, val });

      if (idx === 0) {
        pathD += `M ${x} ${y}`;
      } else {
        const prevX = paddingLeft + (idx - 1) * (plotWidth / (data.length - 1 || 1));
        const prevVal = Number(data[idx - 1][s.key]) || 0;
        const prevY = height - paddingBottom - (prevVal / maxValue) * plotHeight;

        const cpX1 = prevX + (x - prevX) / 2;
        const cpY1 = prevY;
        const cpX2 = prevX + (x - prevX) / 2;
        const cpY2 = y;
        pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${x} ${y}`;
      }
    });

    const firstX = paddingLeft;
    const lastX = paddingLeft + (data.length - 1) * (plotWidth / (data.length - 1 || 1));
    areaD = `${pathD} L ${lastX} ${height - paddingBottom} L ${firstX} ${height - paddingBottom} Z`;

    return { ...s, pathD, areaD, points };
  });

  return (
    <div className="w-full space-y-3">
      {/* Legend & Hover Info */}
      <div className="flex flex-wrap items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-4">
          {series.map((s) => (
            <div key={s.key} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: s.color }}
              ></span>
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {hoverIndex !== null && data[hoverIndex] && (
          <div className="bg-slate-800 text-white text-xs px-2.5 py-1 rounded-lg flex items-center gap-2 shadow">
            <span className="font-bold text-slate-300">{data[hoverIndex].date}:</span>
            {series.map((s) => (
              <span key={s.key} style={{ color: s.color }} className="font-mono font-bold">
                {s.label}: {data[hoverIndex][s.key] ?? 0}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${chartWidth} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            {series.map((s) => (
              <linearGradient
                key={`grad-${s.key}`}
                id={`grad-${s.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={s.color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.0" />
              </linearGradient>
            ))}
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = height - paddingBottom - pct * plotHeight;
            const labelVal = Math.round(pct * maxValue);
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-700/60"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-slate-400 text-[10px] font-mono"
                >
                  {labelVal}
                </text>
              </g>
            );
          })}

          {/* X Axis labels */}
          {data.map((item, idx) => {
            // Show every Nth label if dense
            const skip = data.length > 14 ? 3 : data.length > 7 ? 2 : 1;
            if (idx % skip !== 0 && idx !== data.length - 1) return null;

            const x = paddingLeft + idx * (plotWidth / (data.length - 1 || 1));
            return (
              <text
                key={idx}
                x={x}
                y={height - 10}
                textAnchor="middle"
                className="fill-slate-400 text-[10px] font-medium"
              >
                {item.date}
              </text>
            );
          })}

          {/* Areas & Paths */}
          {seriesPaths.map((s) => (
            <g key={s.key}>
              <path d={s.areaD} fill={`url(#grad-${s.key})`} />
              <path
                d={s.pathD}
                fill="none"
                stroke={s.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          ))}

          {/* Hover interactive columns */}
          {data.map((item, idx) => {
            const x = paddingLeft + idx * (plotWidth / (data.length - 1 || 1));
            const colWidth = plotWidth / (data.length || 1);

            return (
              <rect
                key={idx}
                x={x - colWidth / 2}
                y={paddingTop}
                width={colWidth}
                height={plotHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoverIndex(idx)}
                onMouseLeave={() => setHoverIndex(null)}
              />
            );
          })}

          {/* Hover Vertical Guide Line */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={paddingLeft + hoverIndex * (plotWidth / (data.length - 1 || 1))}
                y1={paddingTop}
                x2={paddingLeft + hoverIndex * (plotWidth / (data.length - 1 || 1))}
                y2={height - paddingBottom}
                stroke="#64748b"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              {seriesPaths.map((s) => {
                const pt = s.points[hoverIndex];
                if (!pt) return null;
                return (
                  <circle
                    key={s.key}
                    cx={pt.x}
                    cy={pt.y}
                    r="4.5"
                    fill={s.color}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                );
              })}
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};

/**
 * Clean SVG Donut Breakdown with legend
 */
export const DonutBreakdown = ({
  data = [],
  title = "",
  totalLabel = "Total",
  size = 180,
}) => {
  const total = data.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);

  const radius = 60;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <div className="flex flex-col items-center space-y-4">
      {title && <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">{title}</h4>}

      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg viewBox="0 0 160 160" className="w-full h-full transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            className="text-slate-100 dark:text-slate-800"
            strokeWidth={strokeWidth}
          />

          {total > 0 &&
            data.map((item, idx) => {
              const val = Number(item.value) || 0;
              const percent = val / total;
              const strokeDasharray = `${percent * circumference} ${circumference}`;
              const strokeDashoffset = -cumulativePercent * circumference;
              cumulativePercent += percent;

              return (
                <circle
                  key={idx}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke={item.color || "#3b82f6"}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-500 hover:opacity-80"
                />
              );
            })}
        </svg>

        {/* Center label */}
        <div className="absolute text-center flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black text-slate-800 dark:text-white leading-tight">
            {total}
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            {totalLabel}
          </span>
        </div>
      </div>

      {/* Legend list */}
      <div className="w-full space-y-1.5 pt-2">
        {data.map((item, idx) => {
          const val = Number(item.value) || 0;
          const pct = total > 0 ? Math.round((val / total) * 100) : 0;

          return (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color || "#3b82f6" }}
                ></span>
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="font-bold text-slate-800 dark:text-white">{val}</span>
                <span className="text-[10px] text-slate-400">({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Country Ranking Table with Flag Emojis and Visual Bars
 */
export const CountryRankingTable = ({ countries = [] }) => {
  if (!countries || countries.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        No country traffic recorded yet. Visits will populate here automatically.
      </div>
    );
  }

  const maxVisits = countries[0]?.visits || 1;

  return (
    <div className="overflow-x-auto">
      <table className="table w-full text-xs">
        <thead>
          <tr className="border-b border-base-200 text-slate-400 uppercase tracking-wider text-[10px]">
            <th className="py-2 pl-3">Country</th>
            <th className="py-2">Visits</th>
            <th className="py-2">Unique Visitors</th>
            <th className="py-2 pr-3 text-right">Traffic Share</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-base-200">
          {countries.map((c, idx) => (
            <tr key={c.countryCode || idx} className="hover:bg-base-200/40 transition-colors">
              <td className="py-2.5 pl-3 font-semibold flex items-center gap-2.5">
                <span className="text-xl shrink-0" role="img" aria-label={c.country}>
                  {c.flag || "🌐"}
                </span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">
                  {c.country}
                </span>
                <span className="badge badge-ghost badge-xs text-[9px] uppercase font-mono text-slate-400">
                  {c.countryCode}
                </span>
              </td>
              <td className="py-2.5 font-bold font-mono text-slate-700 dark:text-slate-300">
                {c.visits}
              </td>
              <td className="py-2.5 font-mono text-slate-500">
                {c.uniqueVisitors || c.visits}
              </td>
              <td className="py-2.5 pr-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="w-20 bg-base-300 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.round((c.visits / maxVisits) * 100))}%` }}
                    ></div>
                  </div>
                  <span className="font-mono text-slate-600 dark:text-slate-400 font-bold min-w-[32px]">
                    {c.percentage || Math.round((c.visits / maxVisits) * 100)}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
