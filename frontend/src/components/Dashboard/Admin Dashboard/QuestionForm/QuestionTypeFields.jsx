import { PiPlus, PiTrash } from "react-icons/pi";
import { 
  QUESTION_TYPE_GROUPS, 
  PTE_QUESTION_TYPE_GROUPS,
  NEEDS_OPTIONS, 
  NEEDS_PAIRS, 
  NEEDS_IMAGE 
} from "./questionFormConstants";
import { parsePastedOptionsText } from "../../../../hooks/useQuestionFormState.jsx";

export const QuestionTypeSelect = ({ value, onChange, examType }) => {
    const groups = examType === "PTE" ? PTE_QUESTION_TYPE_GROUPS : QUESTION_TYPE_GROUPS;
    return (
        <select
            className="select select-bordered w-full rounded-2xl text-sm bg-white text-slate-800 font-semibold"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            {groups.map((g) => (
                <optgroup key={g.group} label={`── ${g.group} ──`} className="text-slate-800 font-bold">
                    {g.types.map((t) => (
                        <option key={t.value} value={t.value} className="text-slate-800 font-medium">
                            {t.label}
                        </option>
                    ))}
                </optgroup>
            ))}
        </select>
    );
};

export const QuestionTypeExtras = ({ 
    q, 
    onUpdate, 
    onAddOption, 
    onUpdateOption, 
    onRemoveOption, 
    onSmartPasteOptions,
    onResetOptions,
    onAddPair, 
    onUpdatePair 
}) => {
    if (NEEDS_OPTIONS.includes(q.type)) {
        const handleOptionPaste = (e, i) => {
            const pastedText = e.clipboardData?.getData("text");
            if (!pastedText) return;
            const parsed = parsePastedOptionsText(pastedText);
            if (parsed && parsed.length > 1) {
                e.preventDefault();
                if (onSmartPasteOptions) {
                    onSmartPasteOptions(q.id, i, parsed);
                }
            }
        };

        return (
            <div className="bg-base-100 p-4 rounded-2xl space-y-3">
                {q.type === "matching-grid" && (
                    <div className="form-control w-full">
                        <label className="label py-1">
                            <span className="label-text font-black text-[10px] uppercase tracking-widest text-base-content/50">Info / Passage Text (Legend)</span>
                        </label>
                        <textarea
                            className="textarea textarea-bordered w-full rounded-xl text-xs font-semibold min-h-[5rem]"
                            placeholder="Enter paragraph descriptions or list options legend mapping (e.g. A. option A text, B. option B text...)"
                            value={q.info || ""}
                            onChange={(e) => onUpdate(q.id, "info", e.target.value)}
                        />
                    </div>
                )}
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-base-content/50">
                        Options <span className="normal-case font-normal text-slate-400 ml-1">(Paste multi-line options to auto-split A, B, C...)</span>
                    </span>
                    {onResetOptions && q.options?.length > 0 && (
                        <button
                            type="button"
                            onClick={() => onResetOptions(q.id)}
                            className="btn btn-ghost btn-xs text-slate-400 hover:text-error gap-1 text-[10px] px-1.5"
                            title="Clear all options"
                        >
                            <PiTrash className="w-3 h-3" /> Clear Options
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt, i) => (
                        <div key={i} className="flex items-center gap-1.5 w-full">
                            <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0">
                                {String.fromCharCode(65 + i)}
                            </span>
                            <input
                                type="text"
                                className="input input-bordered input-sm rounded-xl flex-1"
                                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                value={opt}
                                onChange={(e) => onUpdateOption(q.id, i, e.target.value)}
                                onPaste={(e) => handleOptionPaste(e, i)}
                            />
                            {q.options.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => onRemoveOption && onRemoveOption(q.id, i)}
                                    className="btn btn-ghost btn-xs btn-circle text-error flex-shrink-0"
                                    title="Delete Option"
                                >
                                    <PiTrash className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => onAddOption(q.id)}
                        className="btn btn-ghost btn-xs text-primary gap-1 self-center md:col-span-2 justify-start pl-1"
                    >
                        <PiPlus /> Add Option
                    </button>
                </div>
            </div>
        );
    }

    if (NEEDS_PAIRS.includes(q.type)) {
        return (
            <div className="bg-base-100 p-4 rounded-2xl space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-base-content/50">
                    Matching Pairs
                </span>
                {q.matchingPairs.map((pair, i) => (
                    <div key={i} className="grid grid-cols-2 gap-2">
                        <input
                            type="text"
                            className="input input-bordered input-sm rounded-xl"
                            placeholder={`Item ${i + 1}`}
                            value={pair.key}
                            onChange={(e) => onUpdatePair(q.id, i, "key", e.target.value)}
                        />
                        <input
                            type="text"
                            className="input input-bordered input-sm rounded-xl"
                            placeholder={`Match ${i + 1}`}
                            value={pair.value}
                            onChange={(e) => onUpdatePair(q.id, i, "value", e.target.value)}
                        />
                    </div>
                ))}
                <button
                    type="button"
                    onClick={() => onAddPair(q.id)}
                    className="btn btn-ghost btn-xs text-primary gap-1"
                >
                    <PiPlus /> Add Pair
                </button>
            </div>
        );
    }

    if (NEEDS_IMAGE.includes(q.type)) {
        return (
            <div className="form-control">
                <label className="label">
                    <span className="label-text font-semibold text-xs">
                        Map / Diagram / Describe Image URL (for this question)
                    </span>
                </label>
                <input
                    type="url"
                    className="input input-bordered rounded-2xl text-sm"
                    placeholder="https://domain.com/map.png"
                    value={q.imageUrl || ""}
                    onChange={(e) => onUpdate(q.id, "imageUrl", e.target.value)}
                />
            </div>
        );
    }

    // ── PTE Reading Dropdown Fill-in-the-Blanks ──
    if (q.type === "pte-reading-writing-fill-blanks") {
        const dropdownOptions = q.pteDropdownOptions || [["", "", "", ""]];
        return (
            <div className="bg-slate-50 p-4 rounded-2xl space-y-4 border border-slate-200">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                    PTE Reading &amp; Writing Blanks (4 options per blank)
                </span>
                <div className="space-y-4">
                    {dropdownOptions.map((optionsArr, blankIdx) => (
                        <div key={blankIdx} className="space-y-2 border-b border-slate-200 pb-3 last:border-none">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700">Blank #{blankIdx + 1} Options (use `[blank-${blankIdx + 1}]` in passage)</span>
                                {dropdownOptions.length > 1 && (
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-xs text-error"
                                        onClick={() => {
                                            const newArr = [...dropdownOptions];
                                            newArr.splice(blankIdx, 1);
                                            onUpdate(q.id, "pteDropdownOptions", newArr);
                                        }}
                                    >
                                        Remove Blank
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {(optionsArr || ["", "", "", ""]).map((opt, optIdx) => (
                                    <input
                                        key={optIdx}
                                        type="text"
                                        className="input input-bordered input-sm rounded-xl"
                                        placeholder={`Option ${optIdx + 1} ${optIdx === 0 ? "(Correct Answer)" : ""}`}
                                        value={opt}
                                        onChange={(e) => {
                                            const newArr = dropdownOptions.map((arr, aIdx) => {
                                                if (aIdx !== blankIdx) return arr;
                                                const updatedSub = [...arr];
                                                updatedSub[optIdx] = e.target.value;
                                                return updatedSub;
                                            });
                                            onUpdate(q.id, "pteDropdownOptions", newArr);
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => {
                            onUpdate(q.id, "pteDropdownOptions", [...dropdownOptions, ["", "", "", ""]]);
                        }}
                        className="btn btn-ghost btn-xs text-primary gap-1 pl-0"
                    >
                        <PiPlus /> Add Dropdown Blank Options Pool
                    </button>
                </div>
            </div>
        );
    }

    // ── PTE Reading Re-order Paragraphs ──
    if (q.type === "pte-reorder-paragraphs") {
        const paragraphs = q.options || [""];
        const correctOrder = q.pteParagraphsOrder || [];
        return (
            <div className="bg-slate-50 p-4 rounded-2xl space-y-4 border border-slate-200">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                    PTE Paragraphs Re-ordering
                </span>
                <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-700">Enter paragraphs to re-order:</span>
                    {paragraphs.map((para, paraIdx) => (
                        <div key={paraIdx} className="flex gap-2 items-start">
                            <span className="bg-slate-200 text-slate-700 w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs mt-2 flex-shrink-0">
                                {String.fromCharCode(65 + paraIdx)}
                            </span>
                            <textarea
                                className="textarea textarea-bordered textarea-sm rounded-xl flex-1 text-xs"
                                placeholder={`Paragraph Content ${String.fromCharCode(65 + paraIdx)}`}
                                value={para}
                                onChange={(e) => {
                                    onUpdateOption(q.id, paraIdx, e.target.value);
                                }}
                            />
                            {paragraphs.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => onRemoveOption(q.id, paraIdx)}
                                    className="btn btn-ghost btn-xs btn-circle text-error mt-2"
                                >
                                    <PiTrash />
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => onAddOption(q.id)}
                        className="btn btn-ghost btn-xs text-primary gap-1 pl-0"
                    >
                        <PiPlus /> Add Paragraph
                    </button>
                    <div className="flex flex-col gap-1.5 pt-2">
                        <label className="text-xs font-bold text-slate-700">Correct Order Sequence (e.g. A, C, B, D)</label>
                        <input
                            type="text"
                            className="input input-bordered rounded-xl text-sm"
                            placeholder="A, B, C, D"
                            value={correctOrder.join(", ")}
                            onChange={(e) => {
                                const seq = e.target.value.split(",").map(s => s.trim().toUpperCase()).filter(s => s !== "");
                                onUpdate(q.id, "pteParagraphsOrder", seq);
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // ── PTE Audio Transcripts ──
    if (["pte-repeat-sentence", "pte-retell-lecture", "pte-summarize-spoken-text", "pte-write-from-dictation"].includes(q.type)) {
        return (
            <div className="form-control">
                <label className="label">
                    <span className="label-text font-semibold text-xs">
                        PTE Audio Reference Transcript (for Auto-grading)
                    </span>
                </label>
                <textarea
                    className="textarea textarea-bordered rounded-2xl text-sm min-h-[5rem]"
                    placeholder="Enter the exact spoken text inside the audio file..."
                    value={q.pteAudioTranscript || ""}
                    onChange={(e) => onUpdate(q.id, "pteAudioTranscript", e.target.value)}
                />
            </div>
        );
    }

    return null;
};
