import { useState } from "react";
import { 
    PiPlusCircle, 
    PiPlus, 
    PiBookOpen, 
    PiTrash,
    PiInfo
} from "react-icons/pi";
import { QuestionTypeSelect, QuestionTypeExtras } from "./QuestionTypeFields";
import { NEEDS_OPTIONS } from "./questionFormConstants";

export default function QuestionsBuilderCard({
    testType,
    formData,
    handleAddQuestion,
    handleRemoveQuestion,
    updateQuestionField,
    handleAddOption,
    updateOption,
    handleRemoveOption,
    handleAddPair,
    updatePair,
}) {
    const [showGuide, setShowGuide] = useState(false);
    const [focusedSelectId, setFocusedSelectId] = useState(null);
    const [selectRevisions, setSelectRevisions] = useState({});

    if ((testType === "writing" || testType === "speaking") && formData.examType !== "PTE") return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <PiPlusCircle className="text-primary" /> Questions
                    <span className="badge badge-primary badge-sm font-black">
                        {formData.questions?.length || 0}
                    </span>
                </h2>
                <button
                    type="button"
                    onClick={() => handleAddQuestion(testType)}
                    className="btn btn-primary btn-sm rounded-full gap-2"
                >
                    <PiPlus /> Add Question
                </button>
            </div>

            <div className="collapse bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-3xl shadow-xs">
                <input 
                    type="checkbox" 
                    className="peer" 
                    checked={showGuide} 
                    onChange={() => setShowGuide(!showGuide)} 
                /> 
                <div className="collapse-title flex items-center gap-2 text-slate-700 font-extrabold text-sm cursor-pointer hover:bg-slate-200/40 transition-colors">
                    <PiInfo className="text-primary w-5 h-5" />
                    <span>Admin Guide: Question Types & Formatting Reference</span>
                    <span className="badge badge-sm font-black ml-auto bg-slate-200/80 border-none text-slate-500 uppercase tracking-widest text-[9px] px-2.5 py-2">
                        {showGuide ? "Hide Guide" : "Show Guide"}
                    </span>
                </div>
                <div className="collapse-content bg-white border-t border-slate-200/50 p-6 space-y-4">
                    <div className="grid md:grid-cols-4 gap-6 text-xs text-slate-600 leading-relaxed font-medium">
                        {/* Drag & Drop / Inline Passage Card */}
                        <div className="space-y-2.5 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                            <h4 className="font-black text-sm text-primary uppercase tracking-wider">
                                Inline Passage Questions
                            </h4>
                            <p>
                                Lets students complete interactive blanks directly inside the passage text (just like the Listening section).
                            </p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>
                                    <strong>Inline Gaps:</strong> In the passage content, place <code>___[Num]___</code> (e.g. <code>___1___</code>) where you want the interactive input/dropzone.
                                </li>
                                <li>
                                    <strong>Drag &amp; Drop:</strong> Set the question type to <em>Drag and Drop Completion</em> to render drop targets linked to a shared options pool.
                                </li>
                                <li>
                                    <strong>Text Inputs:</strong> Set the question type to <em>Short Answer</em> or <em>Sentence Completion</em> to render standard fill-in-the-blank text inputs inside the passage.
                                </li>
                            </ul>
                        </div>

                        {/* Flowchart Card */}
                        <div className="space-y-2.5 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <h4 className="font-black text-sm text-emerald-700 uppercase tracking-wider">
                                Flowchart Completion
                            </h4>
                            <p>
                                Automatically groups questions of this type into a visual, vertically connected flow diagram layout.
                            </p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>
                                    <strong>Visual Connections:</strong> Centered boxes will be rendered and connected by downward arrows (↓).
                                </li>
                                <li>
                                    <strong>Labels:</strong> Use the <code>Question / Label</code> field to describe each step in the flowchart.
                                </li>
                                <li>
                                    <strong>Question Groups:</strong> Ensure questions are grouped in a matching Question Group sequence to organize the flowchart layout.
                                </li>
                            </ul>
                        </div>

                        {/* Table Completion Card */}
                        <div className="space-y-2.5 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                            <h4 className="font-black text-sm text-indigo-700 uppercase tracking-wider">
                                Table Completion
                            </h4>
                            <p>
                                Renders an inline interactive question table on the right side of the split screen next to the passage.
                            </p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>
                                    <strong>Table Format:</strong> In the <em>Group Instructions</em> field, write a standard markdown table (e.g. <code>| Header 1 | Header 2 |</code>).
                                </li>
                                <li>
                                    <strong>Placeholders:</strong> Add <code>___[Num]___</code> (e.g. <code>___1___</code>) inside table cells where students should input answers.
                                </li>
                                <li>
                                    <strong>Interactive Blanks:</strong> Blanks will automatically render as inputs (for typed answers) or dropzones (if drag-drop is selected).
                                </li>
                            </ul>
                        </div>

                        {/* PTE Academic Questions Card */}
                        <div className="space-y-2.5 p-4 bg-purple-50 rounded-2xl border border-purple-100">
                            <h4 className="font-black text-sm text-purple-700 uppercase tracking-wider">
                                PTE Academic Questions
                            </h4>
                            <p>
                                Guidance on setting up specific task types for PTE preparation:
                            </p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>
                                    <strong>Reading Blanks:</strong> Set question to <em>Reading & Writing: Fill in the Blanks</em>. Type text in the passage field, replacing blanks with <code>[blank-1]</code>, <code>[blank-2]</code>, etc. Define options (first is correct).
                                </li>
                                <li>
                                    <strong>Re-order Paragraphs:</strong> Define paragraph choices (A, B, C, D) and input the correct sequence order separated by commas (e.g., <code>B, D, A, C</code>).
                                </li>
                                <li>
                                    <strong>Audio Tasks:</strong> For repeat sentence, retell lecture, dictation, etc., upload the Audio URL and type the exact transcript for grading.
                                </li>
                                <li>
                                    <strong>Describe Image:</strong> Upload image URL under Image URL field, and define response requirements.
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {formData.questions?.map((q, index) => {
                const questionNum = index + 1;
                const group = (testType === "reading" || testType === "listening") && formData.examType !== "PTE"
                    ? (formData.questionGroups || []).find(g => Number(g.fromQuestion) === questionNum)
                    : null;

                return (
                    <div key={q.id} className="space-y-4">
                        {group && (
                            <div className="space-y-2 mt-8">
                                {/* Group header banner */}
                                <div className="flex flex-wrap items-center gap-3 bg-gradient-to-r from-primary/10 to-transparent border-l-4 border-primary px-4 py-3 rounded-r-xl">
                                    <PiBookOpen className="text-primary w-5 h-5 flex-shrink-0" />
                                    <span className="text-xs font-black uppercase tracking-widest text-primary">
                                        Questions {group.fromQuestion}–{group.toQuestion}
                                    </span>
                                    {group.title && (
                                        <span className="font-extrabold text-sm text-slate-800">
                                            · {group.title}
                                        </span>
                                    )}
                                    <span className="ml-auto text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                        📖 Passage {(group.passageIndex || 0) + 1}: {formData.passages?.[group.passageIndex || 0]?.title || "(Untitled)"}
                                    </span>
                                </div>
                                {/* Instructions preview */}
                                {group.instructions && (
                                    <div className="bg-amber-50 border border-amber-200/60 px-4 py-3 rounded-2xl text-sm text-slate-700 italic leading-snug">
                                        {group.instructions}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="card bg-white border border-base-300 shadow-sm p-6 space-y-4 relative group">
                            {/* Delete button */}
                            <button
                                type="button"
                                onClick={() => handleRemoveQuestion(q.id)}
                                className="btn btn-ghost btn-xs btn-circle absolute top-4 right-4 text-error opacity-0 group-hover:opacity-100 transition-opacity animate-none"
                            >
                                <PiTrash className="w-4 h-4" />
                            </button>

                            {/* Question number chip */}
                            <div className="flex items-center gap-2">
                                <span className="w-7 h-7 rounded-xl bg-primary/10 text-primary font-black text-xs flex items-center justify-center">
                                    {index + 1}
                                </span>
                                <span className="text-xs font-black uppercase tracking-widest text-base-content/40">
                                    Question {index + 1}
                                </span>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4">
                                {/* Type picker */}
                                <div>
                                    <label className="label"><span className="label-text font-semibold text-xs">Type</span></label>
                                    <QuestionTypeSelect
                                        value={q.type}
                                        onChange={(val) => updateQuestionField(q.id, "type", val)}
                                        examType={formData.examType}
                                    />
                                </div>
                                {/* Question text */}
                                <div className={testType === "reading" ? "md:col-span-1" : "md:col-span-2"}>
                                    <label className="label"><span className="label-text font-semibold text-xs">Question / Label</span></label>
                                    <input
                                        type="text"
                                        className="input input-bordered w-full rounded-2xl text-sm"
                                        placeholder="e.g. Name of the hotel:"
                                        value={q.question}
                                        onChange={(e) => updateQuestionField(q.id, "question", e.target.value)}
                                        required
                                    />
                                </div>
                                {/* Reading: Passage index picker */}
                                {testType === "reading" && (
                                    <div className="min-w-0">
                                        <label className="label">
                                            <span className="label-text font-semibold text-xs">Target Passage</span>
                                        </label>
                                        <select
                                            key={`${q.id}-${selectRevisions[q.id] || 0}`}
                                            className="select select-bordered w-full rounded-2xl text-sm font-semibold bg-white truncate"
                                            value={q.passageIndex || 0}
                                            onChange={(e) => {
                                                updateQuestionField(q.id, "passageIndex", parseInt(e.target.value));
                                                setFocusedSelectId(null);
                                                setSelectRevisions(prev => ({ ...prev, [q.id]: (prev[q.id] || 0) + 1 }));
                                            }}
                                            onFocus={() => setFocusedSelectId(q.id)}
                                            onBlur={() => {
                                                setFocusedSelectId(null);
                                                setSelectRevisions(prev => ({ ...prev, [q.id]: (prev[q.id] || 0) + 1 }));
                                            }}
                                        >
                                            {(formData.passages || []).map((p, pIdx) => {
                                                const isSelected = pIdx === (q.passageIndex || 0);
                                                const isFocused = focusedSelectId === q.id;
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
                            </div>

                            {/* Type-specific extra inputs */}
                            <QuestionTypeExtras
                                q={q}
                                onUpdate={updateQuestionField}
                                onAddOption={handleAddOption}
                                onUpdateOption={updateOption}
                                onRemoveOption={handleRemoveOption}
                                onAddPair={handleAddPair}
                                onUpdatePair={updatePair}
                                examType={formData.examType}
                            />

                            {/* Correct answer */}
                            <div className="form-control">
                                <label className="label"><span className="label-text font-semibold">Correct Answer</span></label>
                                {NEEDS_OPTIONS.includes(q.type) ? (
                                    <select
                                        className="select select-bordered w-full rounded-2xl border-success/40 bg-white text-slate-800 text-sm font-semibold shadow-xs focus:border-success focus:ring-4 focus:ring-success/10"
                                        value={q.correctAnswer}
                                        onChange={(e) => updateQuestionField(q.id, "correctAnswer", e.target.value)}
                                        required
                                    >
                                        <option value="" className="text-slate-800 font-medium">— Select Correct Answer —</option>
                                        {(q.options && q.options.filter(opt => opt && opt.trim() !== "").length > 0
                                            ? q.options.filter(opt => opt && opt.trim() !== "")
                                            : q.type === "true-false"
                                                ? ["True", "False", "Not Given"]
                                                : q.type === "yes-no"
                                                    ? ["Yes", "No", "Not Given"]
                                                    : []
                                        ).map((opt, optIdx) => (
                                            <option key={optIdx} value={opt} className="text-slate-800 font-medium">
                                                {opt}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        className="input input-bordered rounded-2xl border-success/30 bg-success/5"
                                        placeholder="Enter the exact correct answer"
                                        value={q.correctAnswer}
                                        onChange={(e) => updateQuestionField(q.id, "correctAnswer", e.target.value)}
                                        required
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
