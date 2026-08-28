import React, { useState } from "react";
import { 
    PiArrowUpBold, 
    PiArrowDownBold, 
    PiTrashBold, 
    PiDotsSixVerticalBold, 
    PiCheckCircleFill, 
    PiXCircleFill,
    PiArrowClockwiseBold,
    PiHandGrabbingBold
} from "react-icons/pi";

/**
 * Parses raw paragraph option strings into clean key and body text.
 * E.g. "A. The Rig Veda..." -> { key: "A", text: "The Rig Veda..." }
 *      "The Rig Veda..." (at index 0) -> { key: "A", text: "The Rig Veda..." }
 */
export const getParaInfo = (para, index) => {
    if (!para) return { key: String.fromCharCode(65 + index), text: "" };
    const match = para.match(/^([A-Za-z])[\.\:\)]\s*(.*)/s);
    if (match && match[1] && match[2]) {
        return {
            key: match[1].toUpperCase(),
            text: match[2].trim()
        };
    }
    const fallbackKey = String.fromCharCode(65 + index);
    return {
        key: fallbackKey,
        text: para.trim()
    };
};

const ReorderParagraphsRenderer = ({ 
    q, 
    answers = {}, 
    onAnswerChange, 
    submitted = false, 
    result = null, 
    correctAnswer = "", 
    isCorrect = false 
}) => {
    const paragraphs = q.options || [];
    const currentAns = answers[q.id] || "";
    const orderedKeys = currentAns ? currentAns.split(",").map(s => s.trim()).filter(Boolean) : [];

    const allParsed = paragraphs.map((para, index) => getParaInfo(para, index));

    const handleSelectKey = (key) => {
        if (submitted) return;
        if (orderedKeys.includes(key)) {
            const newOrder = orderedKeys.filter(k => k !== key);
            onAnswerChange(q.id, newOrder.join(", "));
        } else {
            const newOrder = [...orderedKeys, key];
            onAnswerChange(q.id, newOrder.join(", "));
        }
    };

    const handleMoveUp = (index) => {
        if (submitted || index <= 0) return;
        const newOrder = [...orderedKeys];
        const temp = newOrder[index - 1];
        newOrder[index - 1] = newOrder[index];
        newOrder[index] = temp;
        onAnswerChange(q.id, newOrder.join(", "));
    };

    const handleMoveDown = (index) => {
        if (submitted || index >= orderedKeys.length - 1) return;
        const newOrder = [...orderedKeys];
        const temp = newOrder[index + 1];
        newOrder[index + 1] = newOrder[index];
        newOrder[index] = temp;
        onAnswerChange(q.id, newOrder.join(", "));
    };

    const handleReset = () => {
        if (submitted) return;
        onAnswerChange(q.id, "");
    };

    // Drag & Drop State
    const [draggedKey, setDraggedKey] = useState(null);
    const [dragOverIdx, setDragOverIdx] = useState(null);

    const handleDragStart = (e, key) => {
        if (submitted) return;
        setDraggedKey(key);
        e.dataTransfer.setData("text/plain", key);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDropOnTargetSlot = (e, targetIdx) => {
        e.preventDefault();
        setDragOverIdx(null);
        if (submitted || !draggedKey) return;

        let newOrder = [...orderedKeys];
        const existingIdx = newOrder.indexOf(draggedKey);

        if (existingIdx !== -1) {
            newOrder.splice(existingIdx, 1);
            newOrder.splice(targetIdx, 0, draggedKey);
        } else {
            newOrder.splice(targetIdx, 0, draggedKey);
        }
        onAnswerChange(q.id, newOrder.join(", "));
        setDraggedKey(null);
    };

    const handleDropOnTargetContainer = (e) => {
        e.preventDefault();
        setDragOverIdx(null);
        if (submitted || !draggedKey) return;

        if (!orderedKeys.includes(draggedKey)) {
            const newOrder = [...orderedKeys, draggedKey];
            onAnswerChange(q.id, newOrder.join(", "));
        }
        setDraggedKey(null);
    };

    // Evaluation item check if available
    const evalItem = result?.evaluatedAnswers?.find(a => a.questionId === q.id);
    const finalIsCorrect = evalItem ? evalItem.isCorrect : isCorrect;
    const finalCorrectAns = evalItem?.correctAnswer || correctAnswer || q.correctAnswer || q.pteParagraphsOrder?.join(", ");

    return (
        <div className="space-y-4 w-full font-sans">
            {/* Instruction Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100/90 px-5 py-3 rounded-2xl border border-slate-200/80">
                <span className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <PiHandGrabbingBold className="w-4 h-4 text-primary" /> Re-order Paragraphs
                </span>
                <span className="text-[11px] font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
                    Click or drag paragraphs on the left to set correct order
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 bg-slate-50/80 border border-slate-200 rounded-[2.5rem] shadow-xs">
                {/* SOURCE PARAGRAPHS */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            Source Paragraphs <span className="text-[10px] font-bold text-slate-400 normal-case tracking-normal">(Click/Drag to add)</span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-200/60 px-2.5 py-0.5 rounded-full">
                            {allParsed.filter(p => !orderedKeys.includes(p.key)).length} Available
                        </span>
                    </div>

                    <div className="space-y-3">
                        {allParsed.map((item, pIdx) => {
                            const isChosen = orderedKeys.includes(item.key);
                            return (
                                <div
                                    key={item.key}
                                    draggable={!submitted && !isChosen}
                                    onDragStart={(e) => handleDragStart(e, item.key)}
                                    onClick={() => !isChosen && handleSelectKey(item.key)}
                                    className={`group p-4 rounded-2xl border-2 transition-all flex items-start gap-3 select-none ${
                                        isChosen
                                            ? "bg-slate-100/70 border-slate-200 text-slate-400 opacity-60 pointer-events-none"
                                            : "bg-white border-slate-200 hover:border-primary/50 text-slate-800 shadow-xs hover:shadow-md cursor-grab active:cursor-grabbing hover:-translate-y-0.5"
                                    }`}
                                >
                                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 transition-colors ${
                                        isChosen
                                            ? "bg-slate-200 text-slate-400"
                                            : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white"
                                    }`}>
                                        {item.key}
                                    </span>

                                    <div className="flex-1 text-sm font-medium leading-relaxed pt-0.5">
                                        {item.text}
                                    </div>

                                    {!isChosen && (
                                        <PiDotsSixVerticalBold className="text-slate-300 group-hover:text-slate-500 text-lg flex-shrink-0 self-center" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* YOUR ORDER */}
                <div className="space-y-4 border-t lg:border-t-0 lg:border-l border-slate-200 pt-6 lg:pt-0 lg:pl-6">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                            Your Order <span className="text-[10px] font-bold text-slate-400 normal-case tracking-normal">(Click/Drag to remove or reorder)</span>
                        </span>
                        {orderedKeys.length > 0 && !submitted && (
                            <button
                                type="button"
                                onClick={handleReset}
                                className="text-[10px] font-black text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1 rounded-full border border-rose-200 transition-all flex items-center gap-1 cursor-pointer"
                            >
                                <PiArrowClockwiseBold className="w-3 h-3" /> Clear Order
                            </button>
                        )}
                    </div>

                    {orderedKeys.length === 0 ? (
                        <div
                            onDragOver={(e) => { e.preventDefault(); setDragOverIdx(0); }}
                            onDragLeave={() => setDragOverIdx(null)}
                            onDrop={handleDropOnTargetContainer}
                            className={`min-h-[220px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center p-6 transition-all ${
                                dragOverIdx !== null
                                    ? "border-primary bg-primary/5 text-primary scale-[1.01]"
                                    : "border-slate-300 bg-white/70 text-slate-400 hover:border-slate-400"
                            }`}
                        >
                            <PiHandGrabbingBold className="w-8 h-8 mb-2 text-slate-300 animate-bounce" />
                            <p className="text-sm font-bold text-slate-600">No Paragraphs Added Yet</p>
                            <p className="text-xs text-slate-400 mt-1 max-w-xs">
                                Click any paragraph on the left or drag it here to build your paragraph sequence.
                            </p>
                        </div>
                    ) : (
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDropOnTargetContainer}
                            className="space-y-3"
                        >
                            {orderedKeys.map((key, oIdx) => {
                                const item = allParsed.find(p => p.key === key) || { key, text: key };
                                return (
                                    <div
                                        key={key}
                                        draggable={!submitted}
                                        onDragStart={(e) => handleDragStart(e, key)}
                                        onDragOver={(e) => { e.preventDefault(); setDragOverIdx(oIdx); }}
                                        onDragLeave={() => setDragOverIdx(null)}
                                        onDrop={(e) => handleDropOnTargetSlot(e, oIdx)}
                                        className={`group p-4 rounded-2xl border-2 transition-all flex items-start gap-3 select-none ${
                                            dragOverIdx === oIdx ? "border-primary shadow-lg scale-[1.02]" : ""
                                        } ${
                                            submitted
                                                ? "bg-white border-slate-200 text-slate-800"
                                                : "bg-white border-primary/30 hover:border-primary text-slate-800 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing"
                                        }`}
                                    >
                                        {/* Position index badge */}
                                        <span className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-black text-xs flex-shrink-0 shadow-xs">
                                            {oIdx + 1}
                                        </span>

                                        {/* Source key badge */}
                                        <span className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                                            {key}
                                        </span>

                                        <div className="flex-1 text-sm font-medium leading-relaxed pt-0.5">
                                            {item.text}
                                        </div>

                                        {/* Actions: Up, Down, Remove */}
                                        {!submitted && (
                                            <div className="flex flex-col sm:flex-row items-center gap-1 self-center flex-shrink-0">
                                                <button
                                                    type="button"
                                                    disabled={oIdx === 0}
                                                    onClick={(e) => { e.stopPropagation(); handleMoveUp(oIdx); }}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                                                    title="Move Up"
                                                >
                                                    <PiArrowUpBold className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={oIdx === orderedKeys.length - 1}
                                                    onClick={(e) => { e.stopPropagation(); handleMoveDown(oIdx); }}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                                                    title="Move Down"
                                                >
                                                    <PiArrowDownBold className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); handleSelectKey(key); }}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
                                                    title="Remove"
                                                >
                                                    <PiTrashBold className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Persistent Drop Box at bottom of order list when paragraphs remain */}
                            {allParsed.filter(p => !orderedKeys.includes(p.key)).length > 0 && !submitted && (
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setDragOverIdx("bottom"); }}
                                    onDragLeave={() => setDragOverIdx(null)}
                                    onDrop={handleDropOnTargetContainer}
                                    className={`p-4 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 text-center text-xs font-bold transition-all ${
                                        dragOverIdx === "bottom"
                                            ? "border-primary bg-primary/10 text-primary scale-[1.01] shadow-md"
                                            : "border-slate-300/80 bg-white/70 text-slate-500 hover:border-primary/50 hover:bg-white hover:text-primary shadow-2xs"
                                    }`}
                                >
                                    <PiHandGrabbingBold className="w-4 h-4 text-primary animate-pulse" />
                                    <span>Drop next paragraph here ({allParsed.filter(p => !orderedKeys.includes(p.key)).length} remaining)</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Evaluation Banner when submitted */}
            {submitted && (
                <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between text-xs font-bold gap-3 ${
                    finalIsCorrect 
                        ? "bg-emerald-50 border-emerald-300 text-emerald-900" 
                        : "bg-rose-50 border-rose-300 text-rose-900"
                }`}>
                    <div className="flex items-center gap-2">
                        {finalIsCorrect ? (
                            <>
                                <PiCheckCircleFill className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                <span>Correct Sequence! Excellent job.</span>
                            </>
                        ) : (
                            <>
                                <PiXCircleFill className="w-5 h-5 text-rose-500 flex-shrink-0" />
                                <span>Incorrect Order.</span>
                            </>
                        )}
                    </div>
                    {finalCorrectAns && (
                        <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] font-black uppercase tracking-widest text-slate-700 shadow-2xs">
                            Correct Sequence: <span className="text-primary">{finalCorrectAns}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ReorderParagraphsRenderer;
