import { PiPlusCircle } from "react-icons/pi";

export default function GeneralInfoCard({ formData, patch }) {
    return (
        <div className="card bg-white border border-base-300 shadow-sm p-6 space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <PiPlusCircle className="text-primary" /> General Information
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 tracking-wide">Test Title</label>
                    <input
                        type="text"
                        className="w-full px-4 py-3 bg-white border border-slate-200 hover:border-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl text-sm transition-all duration-200 outline-none"
                        placeholder="e.g. Cambridge 18 – Test 1 – Part 1"
                        value={formData.title}
                        onChange={(e) => patch({ title: e.target.value })}
                        required
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 tracking-wide">Exam Program</label>
                    <select
                        className="select select-bordered w-full rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200"
                        value={formData.examType}
                        onChange={(e) => patch({ examType: e.target.value })}
                    >
                        <option value="IELTS">🎓 IELTS</option>
                        <option value="PTE">📘 PTE Academic</option>
                        <option value="BOTH">🌐 Both (IELTS &amp; PTE)</option>
                    </select>
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 tracking-wide">
                        Time Limit (Minutes)
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="300"
                        className="w-full px-4 py-3 bg-white border border-slate-200 hover:border-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl text-sm transition-all duration-200 outline-none"
                        placeholder={formData.examType === "PTE" ? "Default: 20 mins" : "Default: standard time"}
                        value={formData.timeLimit !== undefined && formData.timeLimit !== null ? formData.timeLimit : ""}
                        onChange={(e) => patch({ timeLimit: e.target.value })}
                    />
                    <span className="text-[10px] text-slate-500 font-medium">
                        {formData.examType === "PTE"
                            ? "Leave empty for 20-min PTE default"
                            : "Leave empty for IELTS standard time"}
                    </span>
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 tracking-wide">Plan Type</label>
                    <select
                        className="select select-bordered w-full rounded-2xl text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200"
                        value={formData.forPlanType}
                        onChange={(e) => patch({ forPlanType: e.target.value })}
                    >
                        <option value="free">Free</option>
                        <option value="standard">Standard</option>
                        <option value="premium">Premium</option>
                    </select>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-6 py-2">
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        className="toggle toggle-primary animate-none"
                        checked={formData.isActive !== false}
                        onChange={(e) => patch({ isActive: e.target.checked })}
                    />
                    <span className="text-xs font-bold text-slate-700 tracking-wide">
                        Active Status (Enable/Disable question set)
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        className="toggle toggle-primary animate-none"
                        checked={formData.isPublic}
                        onChange={(e) => patch({ isPublic: e.target.checked })}
                    />
                    <span className="text-xs font-bold text-slate-700 tracking-wide">
                        Make available for guest (free-practice) users
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        className="toggle toggle-primary animate-none"
                        checked={formData.isMockOnly}
                        onChange={(e) => patch({ isMockOnly: e.target.checked })}
                    />
                    <span className="text-xs font-bold text-slate-700 tracking-wide">
                        Mock Test Only (Hide from standard Practice Labs)
                    </span>
                </div>
            </div>
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 tracking-wide">Global Instructions</label>
                <textarea
                    className="w-full p-4 bg-white border border-slate-200 hover:border-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl text-sm transition-all duration-200 outline-none resize-y min-h-[100px]"
                    placeholder="e.g. Complete the form. Write ONE WORD AND/OR A NUMBER for each answer."
                    value={formData.instructions}
                    onChange={(e) => patch({ instructions: e.target.value })}
                />
            </div>
        </div>
    );
}
