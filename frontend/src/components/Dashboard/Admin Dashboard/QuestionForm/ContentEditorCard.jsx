import { useState } from "react";
import { 
    PiPlus, 
    PiTrash, 
    PiBookOpen, 
    PiPencilLine
} from "react-icons/pi";
import { makeQuestion } from "./questionFormConstants";
import { syncMultipleSelectionGroup } from "../../../../hooks/useQuestionFormState";

function adjustGroupRanges(groups, changedIdx, field, newValue) {
    const updated = (groups || []).map(g => ({ ...g }));
    const val = parseInt(newValue) || 1;
    
    if (field === "toQuestion") {
        updated[changedIdx].toQuestion = val;
        if ((updated[changedIdx].fromQuestion || 1) > val) {
            updated[changedIdx].fromQuestion = val;
        }
        
        // Cascade forward to subsequent groups if they overlap
        for (let i = changedIdx + 1; i < updated.length; i++) {
            const prevTo = Number(updated[i - 1].toQuestion) || 1;
            const currentFrom = Number(updated[i].fromQuestion) || 1;
            const currentTo = Number(updated[i].toQuestion) || 1;
            
            if (currentFrom <= prevTo) {
                updated[i].fromQuestion = prevTo + 1;
                if (currentTo < prevTo + 1) {
                    updated[i].toQuestion = prevTo + 1;
                }
            }
        }
    } else if (field === "fromQuestion") {
        updated[changedIdx].fromQuestion = val;
        if ((updated[changedIdx].toQuestion || 1) < val) {
            updated[changedIdx].toQuestion = val;
        }
        
        // Adjust previous group if it overlaps
        if (changedIdx > 0) {
            const prevTo = Number(updated[changedIdx - 1].toQuestion) || 1;
            if (prevTo >= val) {
                updated[changedIdx - 1].toQuestion = Math.max(1, val - 1);
            }
        }
        
        // Cascade forward to subsequent groups if needed
        for (let i = changedIdx + 1; i < updated.length; i++) {
            const prevTo = Number(updated[i - 1].toQuestion) || 1;
            const currentFrom = Number(updated[i].fromQuestion) || 1;
            const currentTo = Number(updated[i].toQuestion) || 1;
            
            if (currentFrom <= prevTo) {
                updated[i].fromQuestion = prevTo + 1;
                if (currentTo < prevTo + 1) {
                    updated[i].toQuestion = prevTo + 1;
                }
            }
        }
    }
    
    return updated;
}

export default function ContentEditorCard({ testType, isIeltsListening, formData, patch }) {
    const [focusedSelectId, setFocusedSelectId] = useState(null);
    const [selectRevisions, setSelectRevisions] = useState({});
    return (
        <div className="card bg-white border border-base-300 shadow-sm p-6 space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <PiPencilLine className="text-primary" /> Test Content &amp; Context
            </h2>

            {/* Reading Passages Manager */}
            {testType === "reading" && (
                <div className="space-y-6">
                    {formData.examType !== "PTE" ? (
                        <>
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 tracking-wide">Reading Passages ({formData.passages?.length || 0})</label>
                                <button
                                    type="button"
                                    onClick={() => patch({ passages: [...(formData.passages || []), { title: "", content: "" }] })}
                                    className="btn btn-primary btn-sm rounded-xl gap-1"
                                >
                                    <PiPlus /> Add Passage
                                </button>
                            </div>
                            <div className="space-y-4">
                                {(formData.passages || []).map((passage, pIdx) => (
                                    <div key={pIdx} className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4 relative">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black uppercase tracking-widest text-primary">Passage {pIdx + 1}</span>
                                            {formData.passages.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => patch({ passages: formData.passages.filter((_, idx) => idx !== pIdx) })}
                                                    className="btn btn-ghost btn-xs text-error hover:bg-error/10 rounded-lg gap-1"
                                                >
                                                    <PiTrash /> Remove Passage
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-bold text-slate-700">Passage Title</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl text-sm transition-all outline-none"
                                                placeholder={`e.g. Reading Passage ${pIdx + 1}: Electroreception`}
                                                value={passage.title}
                                                onChange={(e) => {
                                                    const updated = [...formData.passages];
                                                    updated[pIdx].title = e.target.value;
                                                    patch({ passages: updated });
                                                }}
                                                required
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-bold text-slate-700">Passage Content</label>
                                            <textarea
                                                id={`reading-passage-textarea-${pIdx}`}
                                                className="w-full p-4 bg-white border border-slate-200 hover:border-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl text-sm transition-all outline-none resize-y min-h-[150px] font-serif"
                                                placeholder="Paste passage paragraphs here..."
                                                value={passage.content}
                                                onChange={(e) => {
                                                    const updated = [...formData.passages];
                                                    updated[pIdx].content = e.target.value;
                                                    patch({ passages: updated });
                                                }}
                                                required
                                            />
                                            <p className="text-[11px] text-slate-500 font-semibold mt-1">
                                                Use markdown tables with vertical bars (<code>|</code>) and markdown links like <code>[example](https://example.com)</code>. Empty lines create paragraph breaks.
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-700 tracking-wide">PTE Reading Text / Passage</label>
                            <textarea
                                className="w-full p-4 bg-white border border-slate-200 hover:border-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl text-sm transition-all outline-none resize-y min-h-[200px] font-mono text-slate-800 leading-relaxed"
                                placeholder="Enter the reading text passage here. Use [blank-1], [blank-2], etc. for Reading Fill in the Blanks interactive dropdowns."
                                value={formData.passage || ""}
                                onChange={(e) => patch({ passage: e.target.value })}
                                required
                            />
                        </div>
                    )}
                </div>
            )}

            {testType === "reading" && (
                <div className="flex flex-col gap-1.5 pt-2">
                    <label className="text-xs font-bold text-slate-700 tracking-wide">Map / Reference Link or Image URL (Optional)</label>
                    <input
                        type="url"
                        className="w-full px-4 py-3 bg-white border border-slate-200 hover:border-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl text-sm transition-all duration-200 outline-none"
                        placeholder="e.g. https://example.com/map.png (renders map image or reference link)"
                        value={formData.images?.[0] || ""}
                        onChange={(e) => {
                            const newImages = [...(formData.images || [])];
                            newImages[0] = e.target.value;
                            patch({ images: newImages });
                        }}
                    />
                </div>
            )}

            {testType === "listening" && (
                <div className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-700 tracking-wide">Audio URL</label>
                            <input
                                type="url"
                                className="w-full px-4 py-3 bg-white border border-slate-200 hover:border-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl text-sm transition-all duration-200 outline-none"
                                placeholder="Direct link to audio file (Dropbox, S3, Cloudinary…)"
                                value={formData.audioUrl || ""}
                                onChange={(e) => patch({ audioUrl: e.target.value })}
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-700 tracking-wide">Map / Reference Link or Image URL (Optional)</label>
                            <input
                                type="url"
                                className="w-full px-4 py-3 bg-white border border-slate-200 hover:border-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl text-sm transition-all duration-200 outline-none"
                                placeholder="e.g. https://example.com/map.png (renders map image or reference link)"
                                value={formData.images?.[0] || ""}
                                onChange={(e) => {
                                    const newImages = [...(formData.images || [])];
                                    newImages[0] = e.target.value;
                                    patch({ images: newImages });
                                }}
                            />
                        </div>
                    </div>

                    {/* IELTS/BOTH: Example box + Gapped Notes */}
                    {isIeltsListening && (
                        <div className="p-6 bg-indigo-50/40 border border-indigo-100 rounded-3xl space-y-5">
                            <h3 className="text-xs font-black uppercase tracking-widest text-primary">
                                IELTS — Example &amp; Notes Context
                            </h3>

                            {formData.listeningPart === 1 && (
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-indigo-700 tracking-wide">
                                            Example Question Label
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 bg-white border border-slate-200 hover:border-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl text-sm transition-all duration-200 outline-none"
                                            placeholder="e.g. Destination:"
                                            value={formData.exampleQuestion || ""}
                                            onChange={(e) => patch({ exampleQuestion: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-indigo-700 tracking-wide">
                                            Example Answer (pre-filled for student)
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 bg-white border border-slate-200 hover:border-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl text-sm transition-all duration-200 outline-none"
                                            placeholder="e.g. Harbour City"
                                            value={formData.exampleAnswer || ""}
                                            onChange={(e) => patch({ exampleAnswer: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-indigo-700 tracking-wide flex justify-between items-center">
                                    <span>Gapped Notes / Passage Context (Optional)</span>
                                    {(formData.listeningPart === 3 || formData.listeningPart === 4) && (
                                        <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-bold">
                                            Part {formData.listeningPart} Inline Format Enabled
                                        </span>
                                    )}
                                </label>
                                <textarea
                                    id="listening-passage-textarea"
                                    className="w-full p-4 bg-white border border-slate-200 hover:border-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl text-sm transition-all duration-200 outline-none resize-y min-h-[140px] font-mono text-slate-800 leading-relaxed"
                                    placeholder={
                                        formData.listeningPart === 3
                                            ? "Novel: (21) ___21___\nProtagonists: Mary Lennox; Colin Craven\nTime period: Early in (22) ___22___..."
                                            : formData.listeningPart === 4
                                            ? "| Column Header 1 | Column Header 2 |\n|---|---|\n| Avoid pain | ___31___ |\n| Plan future | ___32___ |"
                                            : "Transport from Bayswater...\nThe passenger wants to travel to ___1___ on ___2___ of this month..."
                                    }
                                    value={formData.passage || ""}
                                    onChange={(e) => patch({ passage: e.target.value })}
                                />
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">Insert:</span>
                                    
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const ta = document.getElementById("listening-passage-textarea");
                                            const arrow = "↓";
                                            if (ta) {
                                                const start = ta.selectionStart;
                                                const end = ta.selectionEnd;
                                                const text = formData.passage || "";
                                                const newText = text.substring(0, start) + arrow + text.substring(end);
                                                patch({ passage: newText });
                                                setTimeout(() => {
                                                    ta.focus();
                                                    ta.selectionStart = ta.selectionEnd = start + arrow.length;
                                                }, 0);
                                            } else {
                                                patch({ passage: (formData.passage || "") + arrow });
                                            }
                                        }}
                                        className="px-2.5 py-1 rounded-lg text-[11px] font-black border border-primary/30 bg-primary/5 text-primary hover:bg-primary hover:text-white hover:border-primary transition-all cursor-pointer flex items-center gap-1"
                                        title="Insert flowchart arrow (↓) at cursor"
                                    >
                                        <span>↓</span> Arrow
                                    </button>

                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-2 select-none">Gap:</span>
                                    {(formData.questions || []).map((q, idx) => {
                                        const num = idx + 1;
                                        const id = q.id || `l${num}`;
                                        const alreadyInserted = (formData.passage || "").includes(`___${id}___`);
                                        return (
                                            <button
                                                key={q.id}
                                                type="button"
                                                onClick={() => {
                                                    const ta = document.getElementById("listening-passage-textarea");
                                                    const placeholder = `___${id}___`;
                                                    if (ta) {
                                                        const start = ta.selectionStart;
                                                        const end = ta.selectionEnd;
                                                        const text = formData.passage || "";
                                                        const newText = text.substring(0, start) + placeholder + text.substring(end);
                                                        patch({ passage: newText });
                                                        setTimeout(() => {
                                                            ta.focus();
                                                            ta.selectionStart = ta.selectionEnd = start + placeholder.length;
                                                        }, 0);
                                                    } else {
                                                        patch({ passage: (formData.passage || "") + `___${id}___` });
                                                    }
                                                }}
                                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                                                    alreadyInserted
                                                        ? "bg-emerald-50 text-emerald-600 border-emerald-200 cursor-default"
                                                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-primary hover:text-white hover:border-primary cursor-pointer"
                                                }`}
                                                title={alreadyInserted ? `${id} already in passage` : `Insert ___${id}___ at cursor`}
                                            >
                                                Q{num}
                                            </button>
                                        );
                                    })}
                                    {(!formData.questions || formData.questions.length === 0) && (
                                        <span className="text-[10px] text-slate-400 italic select-none">Add questions below first, then click to insert gaps</span>
                                    )}
                                    <p className="text-[11px] text-slate-500 font-semibold mt-1 flex flex-col gap-1 select-none">
                                        <span>💡 Click a <strong>QN</strong> button to insert a gap at your cursor position, then <strong>keep typing</strong> to add text after it.</span>
                                        <span>📊 For tables, use <code>|</code> columns. For single top headers, put <code>| Title |</code> on row 1.</span>
                                        <span>✨ Use <code>**bold text**</code> for bolding and <code>- </code> or <code>• </code> for bullet points in both passage text and table cells.</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Question Groups Manager ──────────────────────────── */}
            {(testType === "reading" || testType === "listening") && formData.examType !== "PTE" && (
                <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-xs font-black text-slate-700 tracking-wide uppercase">Question Groups</label>
                            <p className="text-[10px] text-slate-400 mt-0.5">Define ranges, headers &amp; instructions shown above each block of questions.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                const groups = formData.questionGroups || [];
                                const lastGroup = groups[groups.length - 1];
                                const nextFrom = lastGroup ? (Number(lastGroup.toQuestion) || 0) + 1 : 1;
                                const newGroup = { title: "", instructions: "", fromQuestion: nextFrom, toQuestion: nextFrom, passageIndex: 0, linkUrl: "", rightSideQuestion: false };
                                const upd = [...groups, newGroup];
                                const maxTo = Math.max(...upd.map(g => Number(g.toQuestion) || 1));
                                let currentQuestions = [...(formData.questions || [])];
                                if (currentQuestions.length < maxTo) {
                                    const diff = maxTo - currentQuestions.length;
                                    for (let i = 0; i < diff; i++) {
                                        currentQuestions.push(makeQuestion(testType));
                                    }
                                    patch({ questionGroups: upd, questions: currentQuestions });
                                } else {
                                    patch({ questionGroups: upd });
                                }
                            }}
                            className="btn btn-outline btn-primary btn-sm rounded-xl gap-1"
                        >
                            <PiPlus /> Add Group
                        </button>
                    </div>
                    <div className="space-y-3">
                        {(formData.questionGroups || []).map((group, gIdx) => (
                            <div key={gIdx} className="p-5 bg-gradient-to-br from-primary/5 to-transparent border border-primary/15 rounded-3xl space-y-4 relative">
                                {/* Delete */}
                                {(formData.questionGroups || []).length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => patch({ questionGroups: (formData.questionGroups || []).filter((_, i) => i !== gIdx) })}
                                        className="btn btn-ghost btn-xs btn-circle absolute top-3 right-3 text-error animate-none"
                                    >✕</button>
                                )}
                                <div className="flex items-center gap-2">
                                    <PiBookOpen className="text-primary w-4 h-4" />
                                    <span className="text-xs font-black uppercase tracking-widest text-primary">Group {gIdx + 1}</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Question Range */}
                                    <div className="col-span-1">
                                        <label className="label">
                                            <span className="label-text font-semibold text-xs text-slate-700">Question Range</span>
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number" min={1}
                                                className="input input-bordered w-full rounded-2xl text-sm text-center font-bold"
                                                placeholder="From"
                                                value={group.fromQuestion || 1}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 1;
                                                    const upd = adjustGroupRanges(formData.questionGroups || [], gIdx, "fromQuestion", val);
                                                    const maxTo = Math.max(...upd.map(g => Number(g.toQuestion) || 1));
                                                    let currentQuestions = [...(formData.questions || [])];
                                                    if (currentQuestions.length < maxTo) {
                                                        const diff = maxTo - currentQuestions.length;
                                                        for (let i = 0; i < diff; i++) {
                                                            currentQuestions.push(makeQuestion(testType));
                                                        }
                                                        patch({ questionGroups: upd, questions: currentQuestions });
                                                    } else {
                                                        patch({ questionGroups: upd });
                                                    }
                                                }}
                                            />
                                            <span className="text-slate-400 font-bold text-xs select-none">to</span>
                                            <input
                                                type="number" min={1}
                                                className="input input-bordered w-full rounded-2xl text-sm text-center font-bold"
                                                placeholder="To"
                                                value={group.toQuestion || 1}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 1;
                                                    const upd = adjustGroupRanges(formData.questionGroups || [], gIdx, "toQuestion", val);
                                                    const maxTo = Math.max(...upd.map(g => Number(g.toQuestion) || 1));
                                                    let currentQuestions = [...(formData.questions || [])];
                                                    if (currentQuestions.length < maxTo) {
                                                        const diff = maxTo - currentQuestions.length;
                                                        for (let i = 0; i < diff; i++) {
                                                            currentQuestions.push(makeQuestion(testType));
                                                        }
                                                        patch({ questionGroups: upd, questions: currentQuestions });
                                                    } else {
                                                        patch({ questionGroups: upd });
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                    {/* Target Passage */}
                                    {testType !== "listening" && (
                                        <div className="col-span-1 min-w-0">
                                            <label className="label"><span className="label-text font-semibold text-xs">Target Passage</span></label>
                                            <select
                                                key={`group-${gIdx}-${selectRevisions[`group-${gIdx}`] || 0}`}
                                                className="select select-bordered w-full rounded-2xl text-sm font-semibold bg-white truncate"
                                                value={group.passageIndex || 0}
                                                onChange={(e) => {
                                                    const upd = [...(formData.questionGroups || [])];
                                                    upd[gIdx] = { ...upd[gIdx], passageIndex: parseInt(e.target.value) };
                                                    patch({ questionGroups: upd });
                                                    setFocusedSelectId(null);
                                                    setSelectRevisions(prev => ({ ...prev, [`group-${gIdx}`]: (prev[`group-${gIdx}`] || 0) + 1 }));
                                                }}
                                                onFocus={() => setFocusedSelectId(`group-${gIdx}`)}
                                                onBlur={() => {
                                                    setFocusedSelectId(null);
                                                    setSelectRevisions(prev => ({ ...prev, [`group-${gIdx}`]: (prev[`group-${gIdx}`] || 0) + 1 }));
                                                }}
                                            >
                                                {(formData.passages || []).map((p, pIdx) => {
                                                    const isSelected = pIdx === (group.passageIndex || 0);
                                                    const isFocused = focusedSelectId === `group-${gIdx}`;
                                                    const fullTitle = `Passage ${pIdx + 1}: ${p.title || "(Untitled)"}`;
                                                    const truncatedTitle = (p.title && p.title.length > 20)
                                                        ? `Passage ${pIdx + 1}: ${p.title.substring(0, 20)}...`
                                                        : fullTitle;
                                                    return (
                                                        <option key={pIdx} value={pIdx} title={fullTitle}>
                                                            {(isSelected && !isFocused) ? truncatedTitle : fullTitle}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>
                                    )}
                                    {/* Group Question Type */}
                                    <div className={testType === "listening" ? "col-span-1 md:col-span-2 min-w-0" : "col-span-1 min-w-0"}>
                                        <label className="label"><span className="label-text font-semibold text-xs">Group Question Type</span></label>
                                        <select
                                            className="select select-bordered w-full rounded-2xl text-sm font-bold bg-white text-primary border-primary/20 hover:bg-slate-50 truncate"
                                            value={(() => {
                                                const fromQ = Number(group.fromQuestion) || 1;
                                                return formData.questions?.[fromQ - 1]?.type || "";
                                            })()}
                                            onChange={(e) => {
                                                const selectedType = e.target.value;
                                                const fromQ = Number(group.fromQuestion) || 1;
                                                const toQ = Number(group.toQuestion) || 1;
                                                
                                                let currentQuestions = [...(formData.questions || [])];
                                                if (currentQuestions.length < toQ) {
                                                    const diff = toQ - currentQuestions.length;
                                                    for (let i = 0; i < diff; i++) {
                                                        currentQuestions.push(makeQuestion(testType));
                                                    }
                                                }

                                                const sourceQ = currentQuestions[fromQ - 1] || {};
                                                const sourceText = sourceQ.question || "";
                                                const sourceOpts = (sourceQ.options && sourceQ.options.length > 0) ? sourceQ.options : (selectedType === "multiple-selection" ? ["A", "B", "C", "D", "E"] : ["Option A", "Option B"]);
                                                
                                                const updatedQuestions = currentQuestions.map((q, idx) => {
                                                    const questionNum = idx + 1;
                                                    if (questionNum >= fromQ && questionNum <= toQ) {
                                                        let updatedQ = { ...q, type: selectedType };
                                                        if (selectedType === "true-false") {
                                                            updatedQ.options = ["True", "False", "Not Given"];
                                                        } else if (selectedType === "yes-no") {
                                                            updatedQ.options = ["Yes", "No", "Not Given"];
                                                        } else if (selectedType === "matching-grid") {
                                                            updatedQ.options = ["A", "B", "C"];
                                                        } else if (selectedType === "multiple-selection") {
                                                            updatedQ.question = sourceText || q.question;
                                                            updatedQ.options = [...sourceOpts];
                                                        } else if (selectedType === "multiple-choice") {
                                                            const hasValidMcqOpts = q.options && q.options.length >= 2 && !q.options.every(o => o === "A" || o === "B" || o === "C" || o === "D");
                                                            updatedQ.options = hasValidMcqOpts ? [...q.options] : ["Option A", "Option B"];
                                                        } else if (selectedType === "drag-drop-completion") {
                                                            const firstDDInGroup = currentQuestions.find((item, i) => {
                                                                const num = i + 1;
                                                                return num >= fromQ && num <= toQ && item.type === "drag-drop-completion";
                                                            });
                                                            if (firstDDInGroup && firstDDInGroup.options?.length) {
                                                                updatedQ.options = [...firstDDInGroup.options];
                                                            } else {
                                                                updatedQ.options = [];
                                                            }
                                                        }
                                                        return updatedQ;
                                                    }
                                                    return q;
                                                });

                                                const finalQuestions = syncMultipleSelectionGroup(updatedQuestions, formData.questionGroups);
                                                
                                                patch({ questions: finalQuestions });
                                            }}
                                        >
                                            <option value="">— Select Type —</option>
                                            <option value="short-answer">Short Answer / Form Fill</option>
                                            <option value="sentence-completion">Sentence Completion</option>
                                            <option value="summary-completion">Summary Completion</option>
                                            <option value="table-completion">Table Completion</option>
                                            <option value="flow-chart-completion">Flow Chart Completion</option>
                                            <option value="drag-drop-completion">Drag and Drop Completion</option>
                                            <option value="multiple-choice">Multiple Choice</option>
                                            <option value="multiple-selection">Multiple Selection</option>
                                            <option value="true-false">True / False / Not Given</option>
                                            <option value="yes-no">Yes / No / Not Given</option>
                                            <option value="matching">Matching</option>
                                            <option value="heading-matching">Heading Matching</option>
                                            <option value="matching-grid">Matching Grid</option>
                                            <option value="map-labelling">Map Labelling</option>
                                            <option value="diagram-labelling">Diagram Labelling</option>
                                        </select>
                                    </div>
                                    {/* Group Title */}
                                    <div className="col-span-1">
                                        <label className="label"><span className="label-text font-semibold text-xs">Group Title (optional)</span></label>
                                        <input
                                            type="text"
                                            className="input input-bordered w-full rounded-2xl text-sm"
                                            placeholder="e.g. True / False / Not Given"
                                            value={group.title || ""}
                                            onChange={(e) => {
                                                const upd = [...(formData.questionGroups || [])];
                                                upd[gIdx] = { ...upd[gIdx], title: e.target.value };
                                                patch({ questionGroups: upd });
                                            }}
                                        />
                                    </div>
                                    {/* Link URL */}
                                    <div className="col-span-1">
                                        <label className="label"><span className="label-text font-semibold text-xs">Link URL (optional)</span></label>
                                        <input
                                            type="url"
                                            className="input input-bordered w-full rounded-2xl text-sm"
                                            placeholder="e.g. https://..."
                                            value={group.linkUrl || ""}
                                            onChange={(e) => {
                                                const upd = [...(formData.questionGroups || [])];
                                                upd[gIdx] = { ...upd[gIdx], linkUrl: e.target.value };
                                                patch({ questionGroups: upd });
                                            }}
                                        />
                                        {group.linkUrl && (() => {
                                            const isImg = /\.(jpeg|jpg|gif|png|webp|svg)/i.test(group.linkUrl) || group.linkUrl.includes("cloudinary") || group.linkUrl.includes("img") || group.linkUrl.includes("image");
                                            const isAud = /\.(mp3|wav|ogg|m4a|aac|mp4)/i.test(group.linkUrl) || group.linkUrl.includes("audio");
                                            if (isImg) {
                                                return (
                                                    <div className="mt-2 border rounded-xl overflow-hidden max-h-40 bg-slate-50 flex items-center justify-center p-2">
                                                        <img src={group.linkUrl} alt="Group Reference Preview" className="max-h-36 object-contain" />
                                                    </div>
                                                );
                                            } else if (isAud) {
                                                return (
                                                    <div className="mt-2 p-2 bg-slate-50 rounded-xl border flex flex-col gap-1">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Audio Preview</span>
                                                        <audio src={group.linkUrl} controls className="w-full h-8" />
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
                                    {/* Right-side inline question */}
                                    <div className="col-span-1 flex items-center h-full pt-6">
                                        <label className="flex items-center gap-3 cursor-pointer p-4 bg-primary/5 rounded-2xl border border-primary/10 w-full select-none hover:bg-primary/10 transition-colors">
                                            <input
                                                type="checkbox"
                                                className="checkbox checkbox-primary checkbox-sm cursor-pointer"
                                                checked={!!group.rightSideQuestion}
                                                onChange={(e) => {
                                                    const upd = [...(formData.questionGroups || [])];
                                                    upd[gIdx] = { ...upd[gIdx], rightSideQuestion: e.target.checked };
                                                    patch({ questionGroups: upd });
                                                }}
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-800">Right-side Question</span>
                                                <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Inline Table/Flowchart</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {(() => {
                                    const fromQ = Number(group.fromQuestion) || 1;
                                    const groupType = formData.questions?.[fromQ - 1]?.type || "";
                                    if (groupType === "multiple-selection") {
                                        return (
                                            <div className="p-5 bg-blue-50 border border-blue-100 rounded-3xl text-xs text-blue-800 space-y-2.5 leading-relaxed">
                                                <h4 className="font-bold text-sm flex items-center gap-1.5 text-blue-900">
                                                    ℹ️ Multiple Selection Group Guide
                                                </h4>
                                                <p>
                                                    To ensure these questions merge and display correctly as a single visual checkbox block on the student dashboard:
                                                </p>
                                                <ul className="list-disc pl-5 space-y-1">
                                                    <li>All questions in this group (from <strong>Q{group.fromQuestion}</strong> to <strong>Q{group.toQuestion}</strong>) must have the <strong>exact same Question Text</strong>.</li>
                                                    <li>All questions in this group must have the <strong>exact same Options list</strong> in the Questions Builder.</li>
                                                    <li>Students will be able to select multiple options up to the number of questions in this group. Grading is order-independent.</li>
                                                    <li>Create multiple groups to separate questions if you need different sets of multiple-selection questions.</li>
                                                </ul>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}

                                {/* Instructions */}
                                <div>
                                    <label className="label"><span className="label-text font-semibold text-xs">Instructions for this group</span></label>
                                    <textarea
                                        id={`group-instructions-textarea-${gIdx}`}
                                        className="textarea textarea-bordered w-full rounded-xl text-sm bg-white min-h-[10rem] font-mono leading-relaxed"
                                        placeholder="e.g. Complete the table below using words from the passage..."
                                        value={group.instructions || ""}
                                        onChange={(e) => {
                                            const upd = [...(formData.questionGroups || [])];
                                            upd[gIdx] = { ...upd[gIdx], instructions: e.target.value };
                                            patch({ questionGroups: upd });
                                        }}
                                    />
                                    {(() => {
                                        const fromQ = Number(group.fromQuestion) || 1;
                                        const firstQ = formData.questions?.[fromQ - 1];
                                        if (firstQ?.type === "matching-grid") return null;

                                        return (
                                            <div className="flex flex-wrap items-center gap-2 mt-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl animate-fadeIn">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">Insert:</span>
                                                
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const ta = document.getElementById(`group-instructions-textarea-${gIdx}`);
                                                        const arrow = "↓";
                                                        if (ta) {
                                                            const start = ta.selectionStart;
                                                            const end = ta.selectionEnd;
                                                            const text = group.instructions || "";
                                                            const newText = text.substring(0, start) + arrow + text.substring(end);
                                                            
                                                            const upd = [...(formData.questionGroups || [])];
                                                            upd[gIdx] = { ...upd[gIdx], instructions: newText };
                                                            patch({ questionGroups: upd });
                                                            
                                                            setTimeout(() => {
                                                                ta.focus();
                                                                ta.selectionStart = ta.selectionEnd = start + arrow.length;
                                                            }, 0);
                                                        } else {
                                                            const upd = [...(formData.questionGroups || [])];
                                                            upd[gIdx] = { ...upd[gIdx], instructions: (group.instructions || "") + arrow };
                                                            patch({ questionGroups: upd });
                                                        }
                                                    }}
                                                    className="px-2.5 py-1 rounded-lg text-[11px] font-black border border-primary/30 bg-primary/5 text-primary hover:bg-primary hover:text-white hover:border-primary transition-all cursor-pointer flex items-center gap-1"
                                                    title="Insert flowchart arrow (↓) at cursor"
                                                >
                                                    <span>↓</span> Arrow
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const ta = document.getElementById(`group-instructions-textarea-${gIdx}`);
                                                        const startQ = Number(group.fromQuestion) || 1;
                                                        const tpl = `| Responsibilities |\n| | Task 1 | Task 2 | Notes |\n|---|---|---|---|\n| Bakery section | Check sell by dates | Change price labels | Use ___${startQ}___ labels |`;
                                                        if (ta) {
                                                            const start = ta.selectionStart;
                                                            const end = ta.selectionEnd;
                                                            const text = group.instructions || "";
                                                            const prefix = text && !text.endsWith("\n") ? "\n\n" : "";
                                                            const newText = text.substring(0, start) + prefix + tpl + text.substring(end);
                                                            
                                                            const upd = [...(formData.questionGroups || [])];
                                                            upd[gIdx] = { ...upd[gIdx], instructions: newText };
                                                            patch({ questionGroups: upd });
                                                            
                                                            setTimeout(() => {
                                                                ta.focus();
                                                                ta.selectionStart = ta.selectionEnd = start + prefix.length + tpl.length;
                                                            }, 0);
                                                        } else {
                                                            const upd = [...(formData.questionGroups || [])];
                                                            upd[gIdx] = { ...upd[gIdx], instructions: (group.instructions || "") + "\n\n" + tpl };
                                                            patch({ questionGroups: upd });
                                                        }
                                                    }}
                                                    className="px-2.5 py-1 rounded-lg text-[11px] font-black border border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                                                    title="Insert single table head & multi-column structure"
                                                >
                                                    <span>📊</span> + Single Head Table
                                                </button>

                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-2 select-none">Gap:</span>
                                                {(() => {
                                                    const toQ = Number(group.toQuestion) || 1;
                                                    const buttons = [];
                                                    for (let num = fromQ; num <= toQ; num++) {
                                                        const alreadyInserted = (group.instructions || "").includes(`___${num}___`);
                                                        buttons.push(
                                                            <button
                                                                key={num}
                                                                type="button"
                                                                onClick={() => {
                                                                    const ta = document.getElementById(`group-instructions-textarea-${gIdx}`);
                                                                    const placeholder = `___${num}___`;
                                                                    if (ta) {
                                                                        const start = ta.selectionStart;
                                                                        const end = ta.selectionEnd;
                                                                        const text = group.instructions || "";
                                                                        const newText = text.substring(0, start) + placeholder + text.substring(end);
                                                                        
                                                                        const upd = [...(formData.questionGroups || [])];
                                                                        upd[gIdx] = { ...upd[gIdx], instructions: newText };
                                                                        patch({ questionGroups: upd });
                                                                        
                                                                        setTimeout(() => {
                                                                            ta.focus();
                                                                            ta.selectionStart = ta.selectionEnd = start + placeholder.length;
                                                                        }, 0);
                                                                    } else {
                                                                        const upd = [...(formData.questionGroups || [])];
                                                                        upd[gIdx] = { ...upd[gIdx], instructions: (group.instructions || "") + placeholder };
                                                                        patch({ questionGroups: upd });
                                                                    }
                                                                }}
                                                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                                                                    alreadyInserted
                                                                        ? "bg-emerald-50 text-emerald-600 border-emerald-200 cursor-default"
                                                                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-primary hover:text-white hover:border-primary cursor-pointer"
                                                                }`}
                                                                title={alreadyInserted ? `Q${num} already in instructions` : `Insert ___${num}___ at cursor`}
                                                            >
                                                                Q{num}
                                                            </button>
                                                        );
                                                    }
                                                     return buttons;
                                                 })()}
                                             </div>
                                         );
                                     })()}
                                 </div>
                             </div>
                        ))}
                    </div>
                </div>
            )}


            {/* Writing */}
            {testType === "writing" && (
                <div className="space-y-6">
                    {formData.examType !== "PTE" ? (
                        <>
                            <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-200/60 space-y-6">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                                    Writing Task 1 — Academic Report
                                </h3>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-700 tracking-wide">Task 1 Prompt</label>
                                    <textarea
                                        className="w-full p-4 bg-white border border-slate-200 hover:border-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl text-sm transition-all duration-200 outline-none resize-y min-h-[140px]"
                                        placeholder="The table below shows global plastic production…"
                                        value={formData.task1Prompt}
                                        onChange={(e) => patch({ task1Prompt: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-700 tracking-wide">Task 1 Diagram Image URL (Optional)</label>
                                    <input
                                        type="url"
                                        className="w-full px-4 py-3.5 bg-white border border-slate-200 hover:border-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl text-sm transition-all duration-200 outline-none"
                                        placeholder="https://domain.com/chart.png"
                                        value={formData.task1Image}
                                        onChange={(e) => patch({ task1Image: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-200/60 space-y-6">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                                    Writing Task 2 — Opinion Essay
                                </h3>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-700 tracking-wide">Task 2 Prompt</label>
                                    <textarea
                                        className="w-full p-4 bg-white border border-slate-200 hover:border-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl text-sm transition-all duration-200 outline-none resize-y min-h-[140px]"
                                        placeholder="Some people argue that university education should be free…"
                                        value={formData.task2Prompt}
                                        onChange={(e) => patch({ task2Prompt: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="p-6 bg-purple-50 border border-purple-100 rounded-3xl text-sm text-purple-700 space-y-2">
                            <h3 className="font-bold text-base">PTE Writing Tasks Guidance</h3>
                            <p>No global writing prompts or templates are required for PTE Academic.</p>
                            <p className="font-semibold text-xs">Please use the <strong>Questions Builder</strong> section below to add and configure your PTE writing questions (e.g. <em>Summarize Written Text</em>, <em>Write Essay</em>).</p>
                        </div>
                    )}
                </div>
            )}

            {/* Speaking */}
            {testType === "speaking" && (
                <div className="space-y-6">
                    {formData.examType !== "PTE" ? (
                        <>
                            {/* Part 1 */}
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200/60 space-y-4">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                                    <span>Part 1: Introduction &amp; Interview Questions</span>
                                    <button
                                        type="button"
                                        onClick={() => patch({ speakingPart1Questions: [...formData.speakingPart1Questions, ""] })}
                                        className="btn btn-ghost btn-xs text-primary font-bold uppercase tracking-wider"
                                    >
                                        + Add Question
                                    </button>
                                </h3>
                                <div className="space-y-2">
                                    {formData.speakingPart1Questions.map((q, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <span className="text-xs font-bold text-slate-400">{idx + 1}.</span>
                                            <input
                                                type="text"
                                                className="input input-bordered rounded-2xl flex-1 text-sm h-11 bg-white"
                                                placeholder="e.g. Do you work or study?"
                                                value={q}
                                                onChange={(e) => {
                                                    const arr = [...formData.speakingPart1Questions];
                                                    arr[idx] = e.target.value;
                                                    patch({ speakingPart1Questions: arr });
                                                }}
                                            />
                                            {formData.speakingPart1Questions.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => patch({ speakingPart1Questions: formData.speakingPart1Questions.filter((_, i) => i !== idx) })}
                                                    className="btn btn-ghost btn-circle btn-sm text-error animate-none"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Part 2 Cue Card */}
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200/60 space-y-4">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                                    Part 2: Long Turn (Cue Card Prompt)
                                </h3>
                                <div className="form-control w-full">
                                    <label className="label">
                                        <span className="label-text font-semibold text-xs text-slate-600">Cue Card Topic Prompt</span>
                                    </label>
                                    <textarea
                                        className="textarea textarea-bordered w-full rounded-2xl h-28 text-sm bg-white font-medium"
                                        placeholder="Describe a historical building you have visited. You should say..."
                                        value={formData.speakingPrompt}
                                        onChange={(e) => patch({ speakingPrompt: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Part 3 Discussion */}
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200/60 space-y-4">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                                    <span>Part 3: Two-Way Analytical Discussion Questions</span>
                                    <button
                                        type="button"
                                        onClick={() => patch({ speakingPart3Questions: [...formData.speakingPart3Questions, ""] })}
                                        className="btn btn-ghost btn-xs text-primary font-bold uppercase tracking-wider"
                                    >
                                        + Add Question
                                    </button>
                                </h3>
                                <div className="space-y-2">
                                    {formData.speakingPart3Questions.map((q, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <span className="text-xs font-bold text-slate-400">{idx + 1}.</span>
                                            <input
                                                type="text"
                                                className="input input-bordered rounded-2xl flex-1 text-sm h-11 bg-white"
                                                placeholder="e.g. Why do people think protecting old buildings is important?"
                                                value={q}
                                                onChange={(e) => {
                                                    const arr = [...formData.speakingPart3Questions];
                                                    arr[idx] = e.target.value;
                                                    patch({ speakingPart3Questions: arr });
                                                }}
                                            />
                                            {formData.speakingPart3Questions.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => patch({ speakingPart3Questions: formData.speakingPart3Questions.filter((_, i) => i !== idx) })}
                                                    className="btn btn-ghost btn-circle btn-sm text-error animate-none"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="p-6 bg-purple-50 border border-purple-100 rounded-3xl text-sm text-purple-700 space-y-2">
                            <h3 className="font-bold text-base">PTE Speaking Tasks Guidance</h3>
                            <p>No global speaking prompts or interview structures are required for PTE Academic.</p>
                            <p className="font-semibold text-xs">Please use the <strong>Questions Builder</strong> section below to add and configure your PTE speaking questions (e.g. <em>Read Aloud</em>, <em>Describe Image</em>, <em>Retell Lecture</em>).</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
