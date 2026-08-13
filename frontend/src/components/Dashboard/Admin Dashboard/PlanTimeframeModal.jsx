import { useState, useMemo } from "react";
import {
  PiCalendarBlank,
  PiClock,
  PiInfinity,
  PiCheck,
  PiX,
  PiSparkle,
  PiCalendarCheck,
} from "react-icons/pi";

const PRESET_MONTHS = [1, 3, 6, 12];

const PLAN_BADGES = {
  free: "badge-ghost",
  standard: "badge-success",
  premium: "badge-accent",
};

const PlanTimeframeModal = ({ isOpen, onClose, user, targetPlan, onConfirm, loading }) => {
  const [timeframeType, setTimeframeType] = useState("months"); // "months" | "custom" | "infinite"
  const [monthsCount, setMonthsCount] = useState(1);
  const [customEndDate, setCustomEndDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 30);
    return tomorrow.toISOString().split("T")[0];
  });

  // Calculate projected expiration date in real-time
  const calculatedExpiry = useMemo(() => {
    if (timeframeType === "infinite" || targetPlan === "free") {
      return null;
    }

    if (timeframeType === "months") {
      const count = parseInt(monthsCount, 10) || 1;
      const target = new Date();
      const currentDay = target.getDate();
      target.setMonth(target.getMonth() + count);
      if (target.getDate() < currentDay) {
        target.setDate(0);
      }
      return target;
    }

    if (timeframeType === "custom" && customEndDate) {
      const target = new Date(customEndDate);
      target.setHours(23, 59, 59, 999);
      return target;
    }

    return null;
  }, [timeframeType, monthsCount, customEndDate, targetPlan]);

  if (!isOpen || !user) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      userId: user._id,
      plan: targetPlan,
      timeframeType: targetPlan === "free" ? "infinite" : timeframeType,
      monthsCount: parseInt(monthsCount, 10) || 1,
      customEndDate: timeframeType === "custom" ? customEndDate : null,
    });
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-base-300 bg-base-100 p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-base-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-primary/10 text-primary">
                <PiClock className="w-5 h-5" />
              </span>
              <h3 className="text-xl font-bold">Select Plan Duration</h3>
            </div>
            <p className="text-xs text-base-content/60 mt-1">
              Configure how long <span className="font-semibold text-base-content">{user.name}</span> will stay on the{" "}
              <span className={`badge badge-sm font-bold uppercase ${PLAN_BADGES[targetPlan] ?? "badge-ghost"}`}>
                {targetPlan}
              </span>{" "}
              plan.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="btn btn-ghost btn-circle btn-sm text-base-content/60 hover:text-base-content"
          >
            <PiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Timeframe Type Selector Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-base-200/60 border border-base-300">
            <button
              type="button"
              onClick={() => setTimeframeType("months")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                timeframeType === "months"
                  ? "bg-base-100 text-primary shadow-sm"
                  : "text-base-content/70 hover:text-base-content"
              }`}
            >
              <PiCalendarBlank className="w-4 h-4" />
              Months
            </button>

            <button
              type="button"
              onClick={() => setTimeframeType("custom")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                timeframeType === "custom"
                  ? "bg-base-100 text-primary shadow-sm"
                  : "text-base-content/70 hover:text-base-content"
              }`}
            >
              <PiCalendarCheck className="w-4 h-4" />
              Custom Date
            </button>

            <button
              type="button"
              onClick={() => setTimeframeType("infinite")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                timeframeType === "infinite"
                  ? "bg-base-100 text-primary shadow-sm"
                  : "text-base-content/70 hover:text-base-content"
              }`}
            >
              <PiInfinity className="w-4 h-4" />
              Infinite
            </button>
          </div>

          {/* Option Details */}
          {timeframeType === "months" && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-base-content/70 block">
                Select Number of Months
              </label>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_MONTHS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMonthsCount(m)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      monthsCount === m
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-base-300 hover:border-primary/50 text-base-content/70"
                    }`}
                  >
                    {m} {m === 1 ? "Month" : "Months"}
                  </button>
                ))}
              </div>

              <div className="pt-2 flex items-center gap-3">
                <span className="text-xs text-base-content/60">Or custom months:</span>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={monthsCount}
                  onChange={(e) => setMonthsCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="input input-bordered input-sm w-24 rounded-xl font-semibold"
                />
              </div>
            </div>
          )}

          {timeframeType === "custom" && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-base-content/70 block">
                Select Expiration End Date
              </label>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="input input-bordered w-full rounded-xl font-semibold"
                required
              />
              <p className="text-[11px] text-base-content/50">
                Plan will remain active through 23:59:59 on the selected date.
              </p>
            </div>
          )}

          {timeframeType === "infinite" && (
            <div className="p-4 rounded-2xl bg-base-200/50 border border-base-300 flex items-center gap-3 text-xs text-base-content/70">
              <PiSparkle className="w-5 h-5 text-accent shrink-0" />
              <span>
                This user will have <strong>Lifetime Access</strong> with no expiration date until manually changed by an admin.
              </span>
            </div>
          )}

          {/* Expiration Summary Card */}
          <div className="p-4 rounded-2xl bg-linear-to-br from-primary/5 via-secondary/5 to-accent/5 border border-primary/20">
            <div className="flex items-center justify-between text-xs">
              <span className="text-base-content/60 font-medium">Calculated Expiration:</span>
              <span className="font-bold text-primary">
                {calculatedExpiry
                  ? calculatedExpiry.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Never (Infinite / Lifetime)"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-base-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn btn-ghost btn-sm rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-sm rounded-xl font-bold gap-2 px-5"
            >
              {loading ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <>
                  <PiCheck className="w-4 h-4" /> Apply Plan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlanTimeframeModal;
