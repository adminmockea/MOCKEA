import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { getQuestionPassageIndex } from "../../../../utils/readingUtils.js";
import { PiNotePencil } from "react-icons/pi";
import TableCompletionRenderer from "../../../Common/TableCompletionRenderer";
import ReadingPassageRenderer from "../../../Common/ReadingPassageRenderer";


const MatchingGridRenderer = ({ questions, options, answers, onAnswerChange, data, offset = 0 }) => {
    const firstQ = questions[0];
    const infoText = firstQ?.info;

    return (
        <div className="space-y-4 w-full">
            {infoText && (
                <div className="p-5 bg-white border border-slate-200 rounded-3xl text-sm text-slate-700 leading-relaxed shadow-xs whitespace-pre-line">
                    {infoText}
                </div>
            )}
            <div className="overflow-x-auto my-6 border border-base-200 rounded-3xl bg-white p-6 shadow-xs">
                <table className="w-full text-left border-collapse text-sm">
                <thead>
                    <tr className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200">
                        <th className="p-4 font-black text-xs uppercase tracking-widest text-slate-500">
                            Question
                        </th>
                        {options.map((opt, i) => (
                            <th key={i} className="p-4 text-center font-black text-xs uppercase tracking-widest text-slate-600">
                                {opt}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {questions.map((q) => {
                        const idx = data.questions.findIndex(item => item.id === q.id);
                        const selectedVal = answers[q.id] || "";
                        
                        return (
                            <tr key={q.id} className="hover:bg-slate-50/50 transition-colors" id={`question-${idx}`}>
                                <td className="p-4 font-semibold text-slate-700 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs flex-shrink-0">
                                        {(offset || 0) + idx + 1}
                                    </div>
                                    <span>{q.question}</span>
                                </td>
                                {options.map((opt, optIdx) => {
                                    const isSelected = selectedVal === opt;
                                    return (
                                        <td key={optIdx} className="p-4 text-center align-middle">
                                            <input
                                                type="radio"
                                                name={q.id}
                                                value={opt}
                                                checked={isSelected}
                                                onChange={() => onAnswerChange(q.id, opt)}
                                                className="radio radio-primary radio-sm cursor-pointer mx-auto transition-transform hover:scale-110"
                                            />
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
        </div>
    );
};

const groupQuestions = (questions, questionGroups, offset = 0, allQuestions = []) => {
    const groups = [];
    let currentGridGroup = null;
    let currentGroupId = null;
    let currentOptionsKey = null;
    let currentSelectionGroup = null;
    let currentSelectionQuestionText = null;

    for (const q of questions) {
        if (q.type === 'matching-grid') {
            currentSelectionGroup = null;
            currentSelectionQuestionText = null;

            let groupId = 'no-group';
            if (questionGroups && allQuestions && allQuestions.length > 0) {
                const qIdx = allQuestions.findIndex(item => item.id === q.id);
                if (qIdx !== -1) {
                    const localQNum = qIdx + 1;
                    const matchingGroup = questionGroups.find(qg => {
                        const fromQ = Number(qg.fromQuestion);
                        const toQ = Number(qg.toQuestion);
                        return localQNum >= fromQ && localQNum <= toQ;
                    });
                    if (matchingGroup) {
                        groupId = `${matchingGroup.fromQuestion}-${matchingGroup.toQuestion}`;
                    }
                }
            }

            const cleanOptions = (q.options || []).filter(o => o && o.trim() !== "");
            const optionsKey = cleanOptions.join('|');

            if (currentGridGroup && currentGroupId === groupId && currentOptionsKey === optionsKey) {
                currentGridGroup.questions.push(q);
            } else {
                currentGridGroup = {
                    type: 'matching-grid-group',
                    options: cleanOptions,
                    questions: [q]
                };
                currentGroupId = groupId;
                currentOptionsKey = optionsKey;
                groups.push(currentGridGroup);
            }
        } else if (q.type === 'multiple-selection' || q.type === 'multiple-choice') {
            currentGridGroup = null;
            currentGroupId = null;
            currentOptionsKey = null;

            const cleanOptions = (q.options || []).filter(o => o && o.trim() !== "");
            const optionsKey = cleanOptions.join('|');
            const qText = q.question ? q.question.trim().toLowerCase() : "";

            const isGroupableWithCurrent = currentSelectionGroup && qText && currentSelectionQuestionText === qText;
            const isMultiSelection = q.type === 'multiple-selection';

            if (isGroupableWithCurrent) {
                currentSelectionGroup.questions.push(q);
                if (cleanOptions.length > currentSelectionGroup.options.length) {
                    currentSelectionGroup.options = cleanOptions;
                    currentSelectionGroup.optionsKey = optionsKey;
                }
            } else if (isMultiSelection) {
                currentSelectionGroup = {
                    type: 'multiple-selection-group',
                    options: cleanOptions,
                    optionsKey: optionsKey,
                    questions: [q]
                };
                currentSelectionQuestionText = qText;
                groups.push(currentSelectionGroup);
            } else {
                currentSelectionGroup = null;
                currentSelectionQuestionText = null;
                groups.push({
                    type: 'single',
                    question: q
                });
            }
        } else {
            currentGridGroup = null;
            currentGroupId = null;
            currentOptionsKey = null;
            currentSelectionGroup = null;
            currentSelectionQuestionText = null;
            groups.push({
                type: 'single',
                question: q
            });
        }
    }
    return groups;
};

const MultipleSelectionRenderer = ({ questions, options, answers, onAnswerChange, offset, data }) => {
    const firstQ = questions[0];
    const questionNumbers = questions.map(q => {
        const idx = data.questions.findIndex(item => item.id === q.id);
        return offset + idx + 1;
    });

    const isAllChecked = (opt) => {
        return questions.some(q => answers[q.id] === opt);
    };

    const handleCheckboxChange = (opt) => {
        const currentlySelected = questions.map(q => answers[q.id]).filter(Boolean);
        const alreadySelectedIdx = currentlySelected.indexOf(opt);

        if (alreadySelectedIdx !== -1) {
            const newSelection = currentlySelected.filter(val => val !== opt);
            questions.forEach((q, idx) => {
                onAnswerChange(q.id, newSelection[idx] || "");
            });
        } else {
            if (currentlySelected.length < questions.length) {
                const newSelection = [...currentlySelected, opt];
                questions.forEach((q, idx) => {
                    onAnswerChange(q.id, newSelection[idx] || "");
                });
            }
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="flex gap-1.5 flex-wrap">
                    {questionNumbers.map(num => (
                        <div key={num} className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                            {num}
                        </div>
                    ))}
                </div>
                <p className="text-sm font-bold text-slate-800">
                    {firstQ.question}
                </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 pl-2">
                {options.map((opt, optIdx) => {
                    const isChecked = isAllChecked(opt);
                    const letter = String.fromCharCode(65 + optIdx);
                    
                    return (
                        <label 
                            key={optIdx} 
                            className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                                isChecked 
                                ? "border-primary bg-primary/5 text-primary font-bold" 
                                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                            }`}
                        >
                            <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleCheckboxChange(opt)}
                                className="checkbox checkbox-primary checkbox-sm rounded-lg"
                            />
                            <span className="text-xs font-black w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-slate-500">
                                {letter}
                            </span>
                            <span className="text-xs">{opt}</span>
                        </label>
                    );
                })}
            </div>
        </div>
    );
};

const QuestionRenderer = ({ q, idx, answers, onAnswerChange, clickedOption, setClickedOption, offset = 0 }) => {
    const isDragDrop = q.type === 'drag-drop-completion' || (q.type === 'flow-chart-completion' && q.options && q.options.filter(Boolean).length > 0);
    const isPteFillBlanks = q.type === 'pte-reading-writing-fill-blanks' || q.type === 'pte-reading-fill-blanks';
    const isPteReorder = q.type === 'pte-reorder-paragraphs';

    return (
        <div id={`question-${idx}`} className="space-y-4 scroll-mt-6">
            <div className="flex items-start gap-4">
                <div className="flex-none w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-black">
                    {offset + idx + 1}
                </div>
                <p className="text-lg font-medium pt-1">
                    {isPteFillBlanks ? "Fill in the Blanks:" : q.question}
                </p>
            </div>

            {q.imageUrl && (
                <div className="ml-14">
                    <img
                        src={q.imageUrl}
                        alt={`Map / Diagram for Q${offset + idx + 1}`}
                        className="w-full max-h-64 object-contain rounded-2xl border border-base-200 bg-white"
                    />
                </div>
            )}

            {q.type === 'true-false' && (
                <div className="flex flex-wrap gap-2 ml-14">
                    {['TRUE', 'FALSE', 'NOT GIVEN'].map((opt) => (
                        <button 
                            key={opt}
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onAnswerChange(q.id, opt);
                            }}
                            className={`px-6 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                                answers[q.id] === opt 
                                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                                : "bg-white border-base-200 hover:border-primary/40"
                            }`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )}

            {q.type === 'multiple-choice' && (
                <div className="space-y-2 ml-14">
                    {q.options?.filter(opt => opt && opt.trim() !== "").map((opt, optIdx) => (
                        <button 
                            key={optIdx}
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onAnswerChange(q.id, opt);
                            }}
                            className={`w-full text-left px-6 py-4 rounded-2xl text-sm font-bold border-2 transition-all flex items-center gap-4 ${
                                answers[q.id] === opt 
                                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                                : "bg-white border-base-200 hover:border-primary/40"
                            }`}
                        >
                            <span className="w-8 h-8 rounded-lg bg-base-200 text-base-content/40 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                {String.fromCharCode(65 + optIdx)}
                            </span>
                            {opt}
                        </button>
                    ))}
                </div>
            )}

            {(q.type === 'matching' || q.type === 'heading-matching') && (
                <div className="ml-14">
                    <select
                        value={answers[q.id] || ""}
                        onChange={(e) => onAnswerChange(q.id, e.target.value)}
                        className="select select-bordered border-slate-400 w-full rounded-2xl font-bold bg-white focus:border-primary text-sm h-12 text-slate-800"
                    >
                        <option value="">— Select a match —</option>
                        {((q.options?.length && q.options.some(opt => opt && opt.trim() !== ""))
                            ? q.options.filter(opt => opt && opt.trim() !== "")
                            : (q.matchingPairs || []).map((p) => p.value).filter(Boolean)
                        ).map((opt, optIdx) => (
                            <option key={optIdx} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>
            )}

            {isDragDrop && (
                <div 
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        const val = e.dataTransfer.getData("text/plain");
                        if (val) onAnswerChange(q.id, val);
                    }}
                    className="ml-14 flex items-center gap-3"
                >
                    <span className="text-sm font-bold text-slate-500">Answer:</span>
                    <div 
                        onClick={() => {
                            if (clickedOption) {
                                onAnswerChange(q.id, clickedOption);
                                if (setClickedOption) setClickedOption(null);
                            }
                        }}
                        className={`min-w-40 h-12 px-4 border-2 border-dashed rounded-2xl flex items-center justify-center text-sm font-bold transition-all bg-white ${
                            answers[q.id]
                            ? "border-primary text-slate-800 bg-white font-black cursor-pointer shadow-xs"
                            : "border-slate-300 text-slate-400 hover:border-primary/40 cursor-pointer bg-slate-50/50"
                        }`}
                    >
                        {answers[q.id] || "Drop answer here"}
                        {answers[q.id] && (
                            <button 
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAnswerChange(q.id, "");
                                }}
                                className="ml-2.5 text-slate-400 hover:text-error text-lg font-black"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>
            )}

            {isPteFillBlanks && (() => {
                const text = q.question || "";
                const parts = text.split(/\[blank-\d+\]/g);
                const matches = text.match(/\[blank-\d+\]/g) || [];
                const currentAns = answers[q.id] || "";
                const ansList = [];
                const rawAnswers = currentAns.split(",").map(s => s.trim());
                for (let i = 0; i < matches.length; i++) {
                    ansList[i] = rawAnswers[i] || "";
                }

                const handleChange = (blankIdx, val) => {
                    const newAnsList = [...ansList];
                    newAnsList[blankIdx] = val;
                    onAnswerChange(q.id, newAnsList.join(", "));
                };

                return (
                    <div className="ml-14 leading-loose text-slate-700 bg-slate-50 p-6 rounded-3xl border border-slate-200 text-sm font-medium">
                        {parts.map((part, index) => {
                            const isLast = index === parts.length - 1;
                            if (isLast) {
                                return <span key={index}>{part}</span>;
                            }
                            const blankIdx = index;
                            let blankOptions = [];
                            if (q.type === 'pte-reading-writing-fill-blanks' && q.pteDropdownOptions) {
                                blankOptions = q.pteDropdownOptions[blankIdx] || [];
                            } else {
                                blankOptions = q.options || [];
                            }
                            
                            return (
                                <span key={index} className="inline-flex items-center gap-1 mx-1 align-middle">
                                    <span>{part}</span>
                                    <select
                                        value={ansList[blankIdx]}
                                        onChange={(e) => handleChange(blankIdx, e.target.value)}
                                        className="select select-bordered select-xs font-bold bg-white text-slate-800 rounded-lg border-slate-300 focus:border-primary px-2 py-0 h-8"
                                    >
                                        <option value="">— select —</option>
                                        {blankOptions.map((opt, oIdx) => (
                                            <option key={oIdx} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </span>
                            );
                        })}
                    </div>
                );
            })()}

            {isPteReorder && (() => {
                const paragraphs = q.options || [];
                const currentAns = answers[q.id] || "";
                const orderedKeys = currentAns ? currentAns.split(",").map(s => s.trim()).filter(Boolean) : [];
                
                const getParaKey = (para) => {
                    const match = para.match(/^([A-Ea-e])/);
                    return match ? match[1].toUpperCase() : para.substring(0, 1).toUpperCase();
                };

                const handleSelectKey = (key) => {
                    if (orderedKeys.includes(key)) {
                        const newOrder = orderedKeys.filter(k => k !== key);
                        onAnswerChange(q.id, newOrder.join(", "));
                    } else {
                        const newOrder = [...orderedKeys, key];
                        onAnswerChange(q.id, newOrder.join(", "));
                    }
                };

                return (
                    <div className="ml-14 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 border border-slate-200 rounded-[2rem] text-xs font-sans">
                        <div className="space-y-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Source Paragraphs (Click to add)</span>
                            <div className="space-y-2">
                                {paragraphs.map((para, pIdx) => {
                                    const key = getParaKey(para);
                                    const isChosen = orderedKeys.includes(key);
                                    return (
                                        <button
                                            key={pIdx}
                                            type="button"
                                            onClick={() => handleSelectKey(key)}
                                            className={`w-full text-left p-4 rounded-2xl border-2 text-xs font-semibold leading-relaxed transition-all flex items-start gap-3 ${
                                                isChosen
                                                ? "bg-slate-200/50 border-slate-200 text-slate-400 pointer-events-none"
                                                : "bg-white border-slate-200 hover:border-primary/50 text-slate-700 shadow-sm"
                                            }`}
                                        >
                                            <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                                                {key}
                                            </span>
                                            <span className="flex-1">{para}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-3 border-l border-slate-200 pl-6">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Your Order (Click to remove)</span>
                            {orderedKeys.length === 0 ? (
                                <div className="h-[200px] border-2 border-dashed border-slate-300 rounded-3xl flex items-center justify-center text-slate-400 text-xs font-semibold">
                                    Click paragraphs on the left to set order
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {orderedKeys.map((key, oIdx) => {
                                        const paraText = paragraphs.find(p => getParaKey(p) === key) || key;
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => handleSelectKey(key)}
                                                className="w-full text-left p-4 rounded-2xl border-2 border-primary/20 bg-primary/5 hover:bg-red-50 hover:border-red-200 hover:text-red-700 text-xs font-bold leading-relaxed transition-all flex items-start gap-3 text-primary group"
                                            >
                                                <span className="w-6 h-6 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                                                    {oIdx + 1}
                                                </span>
                                                <span className="flex-1">{paraText}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })()}

            {!(q.type === 'true-false' || q.type === 'multiple-choice' || q.type === 'matching' || q.type === 'heading-matching' || isDragDrop || isPteFillBlanks || isPteReorder) && (
                <div className="ml-14">
                    <input 
                        type="text" 
                        className="input input-bordered border-slate-400 w-full rounded-2xl font-bold bg-white focus:border-primary text-sm h-12 text-slate-800"
                        placeholder="Type your answer here..."
                        value={answers[q.id] || ""}
                        onChange={(e) => onAnswerChange(q.id, e.target.value)}
                    />
                </div>
            )}
        </div>
    );
};

const groupVisualsByQuestionGroups = (visualGroups, questionGroups, offset, questions) => {
    const grouped = [];
    const assignedVisuals = new Set();
    const sortedGroups = [...(questionGroups || [])].sort((a, b) => Number(a.fromQuestion) - Number(b.fromQuestion));

    for (const qg of sortedGroups) {
        const fromQ = Number(qg.fromQuestion);
        const toQ = Number(qg.toQuestion);
        const groupVisuals = [];

        for (let i = 0; i < visualGroups.length; i++) {
            if (assignedVisuals.has(i)) continue;

            const vg = visualGroups[i];
            const firstQ = (vg.type === 'matching-grid-group' || vg.type === 'multiple-selection-group') ? vg.questions[0] : vg.question;
            const firstQIdx = questions.findIndex(item => item.id === firstQ.id);
            const localQNum = firstQIdx + 1;

            if (localQNum >= fromQ && localQNum <= toQ) {
                groupVisuals.push(vg);
                assignedVisuals.add(i);
            }
        }

        if (groupVisuals.length > 0) {
            grouped.push({
                type: 'group',
                header: qg,
                visuals: groupVisuals
            });
        }
    }

    const ungroupedVisuals = [];
    for (let i = 0; i < visualGroups.length; i++) {
        if (!assignedVisuals.has(i)) {
            ungroupedVisuals.push(visualGroups[i]);
        }
    }

    if (ungroupedVisuals.length > 0) {
        grouped.push({
            type: 'ungrouped',
            visuals: ungroupedVisuals
        });
    }

    return grouped;
};

const GroupImageRenderer = ({ url }) => {
    const [isImage, setIsImage] = useState(true);
    if (!url) return null;
    const isPotentiallyImage = /\.(jpeg|jpg|gif|png|webp|svg)/i.test(url) || url.includes("cloudinary") || url.includes("img") || url.includes("image");
    if (!isImage || !isPotentiallyImage) return null;
    return (
        <div className="w-full overflow-hidden rounded-2xl border border-base-200 bg-white p-2 mb-4">
            <img 
                src={url} 
                alt="Group Diagram / Map" 
                className="w-full h-auto max-h-[420px] object-contain mx-auto rounded-xl" 
                onError={() => setIsImage(false)}
            />
        </div>
    );
};

const GroupedContainer = ({ header, children, hideInstructions }) => {
    return (
        <div className="card p-5 rounded-[2rem] border border-slate-200 bg-slate-50/20 space-y-5 shadow-xs w-full mb-6">
            {header && (
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-primary/10 to-transparent border-l-4 border-primary px-5 py-3 rounded-r-2xl">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-widest text-primary">
                                Questions {header.fromQuestion}–{header.toQuestion}
                            </span>
                            {header.title && (
                                <span className="font-bold text-sm text-slate-700">· {header.title}</span>
                            )}
                        </div>
                        {header.linkUrl && (
                            <a 
                                href={header.linkUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-flex items-center gap-1.5 text-xs font-black text-primary hover:underline bg-white border border-primary/20 px-3 py-1.5 rounded-xl shadow-xs"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                </svg>
                                Reference Link
                            </a>
                        )}
                    </div>
                    {header.instructions && !hideInstructions && (
                        <div className="bg-amber-50 border border-amber-200/60 px-5 py-3.5 rounded-2xl text-sm text-slate-700 leading-relaxed shadow-xs">
                            {header.instructions}
                        </div>
                    )}
                </div>
            )}
            <div className="space-y-6">
                {header?.linkUrl && (() => {
                    const isImg = /\.(jpeg|jpg|gif|png|webp|svg)/i.test(header.linkUrl) || header.linkUrl.includes("cloudinary") || header.linkUrl.includes("img") || header.linkUrl.includes("image");
                    const isAud = /\.(mp3|wav|ogg|m4a|aac|mp4)/i.test(header.linkUrl) || header.linkUrl.includes("audio");
                    if (isImg) {
                        return <GroupImageRenderer url={header.linkUrl} />;
                    } else if (isAud) {
                        return (
                            <div className="w-full p-4 bg-white rounded-2xl border border-base-200 shadow-sm flex flex-col gap-2">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Group Audio Reference</span>
                                <audio src={header.linkUrl} controls className="w-full" />
                            </div>
                        );
                    }
                    return null;
                })()}
                {children}
            </div>
        </div>
    );
};

const GroupedQuestionsRenderer = ({ groupedItems, answers, onAnswerChange, offset, data, clickedOption, setClickedOption }) => {
    const renderedInlineIds = useMemo(() => {
        const ids = new Set();
        if (!data) return ids;

        const passages = data.passages || [];
        passages.forEach(p => {
            if (!p.content) return;
            const matches = p.content.match(/___([\w-]+)___/g) || [];
            matches.forEach(m => {
                const matchKey = m.replace(/___/g, "").trim();
                const q = data.questions?.find((item, idx) => {
                    const questionNum = (offset || 0) + idx + 1;
                    const localIndex = idx + 1;
                    return (
                        item.id === matchKey ||
                        questionNum.toString() === matchKey ||
                        localIndex.toString() === matchKey
                    );
                });
                if (q) ids.add(q.id);
            });
        });

        if (data.passage) {
            const matches = data.passage.match(/___([\w-]+)___/g) || [];
            matches.forEach(m => {
                const matchKey = m.replace(/___/g, "").trim();
                const q = data.questions?.find((item, idx) => {
                    const questionNum = (offset || 0) + idx + 1;
                    const localIndex = idx + 1;
                    return (
                        item.id === matchKey ||
                        questionNum.toString() === matchKey ||
                        localIndex.toString() === matchKey
                    );
                });
                if (q) ids.add(q.id);
            });
        }

        if (data.questionGroups) {
            data.questionGroups.forEach(g => {
                if (!g.instructions) return;
                if (/^\|.+\|$/m.test(g.instructions)) return; // Skip tables
                const matches = g.instructions.match(/___([\w-]+)___/g) || [];
                matches.forEach(m => {
                    const matchKey = m.replace(/___/g, "").trim();
                    const q = data.questions?.find((item, idx) => {
                        const questionNum = (offset || 0) + idx + 1;
                        const localIndex = idx + 1;
                        return (
                            item.id === matchKey ||
                            questionNum.toString() === matchKey ||
                            localIndex.toString() === matchKey
                        );
                    });
                    if (q) ids.add(q.id);
                });
            });
        }
        return ids;
    }, [data, offset]);

    const passageInlineIds = useMemo(() => {
        const ids = new Set();
        if (!data) return ids;

        const passages = data.passages || [];
        passages.forEach(p => {
            if (!p.content) return;
            const matches = p.content.match(/___([\w-]+)___/g) || [];
            matches.forEach(m => {
                const matchKey = m.replace(/___/g, "").trim();
                const q = data.questions?.find((item, idx) => {
                    const questionNum = (offset || 0) + idx + 1;
                    const localIndex = idx + 1;
                    return (
                        item.id === matchKey ||
                        questionNum.toString() === matchKey ||
                        localIndex.toString() === matchKey
                    );
                });
                if (q) ids.add(q.id);
            });
        });

        if (data.passage) {
            const matches = data.passage.match(/___([\w-]+)___/g) || [];
            matches.forEach(m => {
                const matchKey = m.replace(/___/g, "").trim();
                const q = data.questions?.find((item, idx) => {
                    const questionNum = (offset || 0) + idx + 1;
                    const localIndex = idx + 1;
                    return (
                        item.id === matchKey ||
                        questionNum.toString() === matchKey ||
                        localIndex.toString() === matchKey
                    );
                });
                if (q) ids.add(q.id);
            });
        }

        return ids;
    }, [data, offset]);

    const dragDropQuestions = useMemo(() => data?.questions?.filter(q => q.type === 'drag-drop-completion' || (q.type === 'flow-chart-completion' && q.options?.length > 0)) || [], [data?.questions]);
    const sharedOptions = useMemo(() => {
        const first = dragDropQuestions[0];
        return first?.options?.filter(Boolean) || [];
    }, [dragDropQuestions]);

    return (
        <div className="space-y-8">
            {groupedItems.map((groupEntry, geIdx) => {
                const isGroup = groupEntry.type === 'group';
                const header = groupEntry.header;
                
                const isMatchingGrid = groupEntry.visuals?.some(vg => vg.type === 'matching-grid-group');
                const hasTable = header?.rightSideQuestion || (header?.instructions &&
                                 /___([\w-]+)___/.test(header.instructions) &&
                                 /^\|.+\|$/m.test(header.instructions));
                const hasInlineInstructions = header?.instructions &&
                                             /___([\w-]+)___/.test(header.instructions) &&
                                             !hasTable;

                const groupQIds = [];
                groupEntry.visuals?.forEach(vg => {
                    if (vg.type === 'matching-grid-group' || vg.type === 'multiple-selection-group') {
                        if (vg.questions) {
                            vg.questions.forEach(q => groupQIds.push(q.id));
                        }
                    } else if (vg.question) {
                        groupQIds.push(vg.question.id);
                    }
                });
                const isPassageInlineGroup = groupQIds.some(id => passageInlineIds.has(id));

                const groupDragDropQuestions = groupEntry.visuals?.flatMap(vg => {
                    if (vg.type === 'matching-grid-group' || vg.type === 'multiple-selection-group') {
                        return vg.questions?.filter(q => q.type === 'drag-drop-completion' || (q.type === 'flow-chart-completion' && q.options?.length > 0)) || [];
                    }
                    const q = vg.question;
                    return q?.type === 'drag-drop-completion' || (q?.type === 'flow-chart-completion' && q.options?.length > 0) ? [q] : [];
                }) || [];
                const groupOptions = groupDragDropQuestions[0]?.options?.filter(Boolean) || [];

                const renderDragOptions = () => {
                    if (groupOptions.length === 0) return null;
                    return (
                        <div className="border-b border-slate-200/60 pb-4 mb-4 pt-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center mb-3">
                                Drag or click to select an option to fill each blank
                            </p>
                            <div className="flex flex-wrap justify-center gap-2 pr-1">
                                {groupOptions.map((opt, i) => {
                                    const letter = String.fromCharCode(65 + i);
                                    const label = `${letter}. ${opt}`;
                                    const isSelected = clickedOption === label;
                                    return (
                                        <div
                                            key={i}
                                            draggable={true}
                                            onDragStart={(e) => {
                                                e.dataTransfer.setData("text/plain", label);
                                            }}
                                            onClick={() => {
                                                setClickedOption(isSelected ? null : label);
                                            }}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all select-none ${
                                                isSelected
                                                    ? "bg-primary border-primary text-white shadow-md scale-105"
                                                    : "bg-white border-slate-200 hover:border-primary/50 text-slate-700 hover:scale-105 active:scale-95 cursor-pointer"
                                            }`}
                                        >
                                            {label}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                };

                if (isGroup) {
                    if (isMatchingGrid) {
                        return (
                            <GroupedContainer 
                                key={`group-${header?.fromQuestion || geIdx}-${header?.toQuestion || geIdx}`} 
                                header={{
                                    ...header,
                                    fromQuestion: (offset || 0) + Number(header.fromQuestion),
                                    toQuestion: (offset || 0) + Number(header.toQuestion)
                                }}
                                hideInstructions={false}
                            >
                                {groupEntry.visuals.map((vg, vgIdx) => {
                                    if (vg.type !== 'matching-grid-group') return null;
                                    return (
                                        <div key={`grid-right-${geIdx}-${vgIdx}`} className="p-6 bg-white border border-slate-200 rounded-[2.5rem] space-y-4 shadow-xs">
                                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 pl-2">
                                                Matching Table
                                            </h3>
                                            <MatchingGridRenderer
                                                questions={vg.questions}
                                                options={vg.options}
                                                answers={answers}
                                                onAnswerChange={onAnswerChange}
                                                offset={offset}
                                                data={data}
                                            />
                                        </div>
                                    );
                                })}
                            </GroupedContainer>
                        );
                    }

                    if (hasTable) {
                        return (
                            <GroupedContainer 
                                key={`group-${header?.fromQuestion || geIdx}-${header?.toQuestion || geIdx}`} 
                                header={{
                                    ...header,
                                    fromQuestion: (offset || 0) + Number(header.fromQuestion),
                                    toQuestion: (offset || 0) + Number(header.toQuestion)
                                }}
                                hideInstructions={true}
                            >
                                <TableCompletionRenderer
                                    instructions={header.instructions}
                                    allQuestions={data?.questions || []}
                                    answers={answers}
                                    onAnswerChange={onAnswerChange}
                                    clickedOption={clickedOption}
                                    setClickedOption={setClickedOption}
                                    offset={offset}
                                />
                            </GroupedContainer>
                        );
                    }

                    if (hasInlineInstructions) {
                        if (isPassageInlineGroup) {
                            return null;
                        }
                        return (
                            <GroupedContainer 
                                key={`group-${header?.fromQuestion || geIdx}-${header?.toQuestion || geIdx}`} 
                                header={{
                                    ...header,
                                    fromQuestion: (offset || 0) + Number(header.fromQuestion),
                                    toQuestion: (offset || 0) + Number(header.toQuestion)
                                }}
                                hideInstructions={true}
                            >
                                {renderDragOptions()}
                                <div className="p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-xs">
                                    <ReadingPassageRenderer
                                        passageContent={header.instructions}
                                        questions={data?.questions || []}
                                        answers={answers}
                                        onAnswerChange={onAnswerChange}
                                        submitted={undefined}
                                        result={null}
                                        clickedOption={clickedOption}
                                        setClickedOption={setClickedOption}
                                        className="prose prose-sm max-w-none font-sans text-slate-700 leading-relaxed space-y-4"
                                        offset={offset}
                                    />
                                </div>
                            </GroupedContainer>
                        );
                    }
                }

                const children = groupEntry.visuals.map((vg, vgIdx) => {
                    if (vg.type === 'matching-grid-group') {
                        return null; 
                    }

                    if (vg.type === 'multiple-selection-group') {
                        return (
                            <div key={`selection-${geIdx}-${vgIdx}`} className="space-y-4 p-4 rounded-3xl border border-base-200 bg-white shadow-xs">
                                <MultipleSelectionRenderer
                                    questions={vg.questions}
                                    options={vg.options}
                                    answers={answers}
                                    onAnswerChange={onAnswerChange}
                                    offset={offset}
                                    data={data}
                                />
                            </div>
                        );
                    }

                    const q = vg.question;
                    if (renderedInlineIds.has(q.id)) {
                        return null;
                    }

                    const idx = data.questions.findIndex(item => item.id === q.id);
                    const isFlowChart = q.type === 'flow-chart-completion';
                    const nextIsFlowChart = vgIdx < groupEntry.visuals.length - 1 && groupEntry.visuals[vgIdx + 1]?.question?.type === 'flow-chart-completion';

                    return (
                        <div key={q.id || idx} className="space-y-4">
                            <div 
                                id={`question-${idx}`}
                                className={`space-y-4 p-4 rounded-3xl border transition-all scroll-mt-6 ${
                                    isFlowChart 
                                    ? "bg-slate-50/50 border-dashed border-slate-300 max-w-lg mx-auto text-center shadow-xs" 
                                    : "border-base-200 bg-white hover:border-primary/30"
                                }`}
                            >
                                <QuestionRenderer
                                    q={q}
                                    idx={idx}
                                    answers={answers}
                                    onAnswerChange={onAnswerChange}
                                    clickedOption={clickedOption}
                                    setClickedOption={setClickedOption}
                                    offset={offset}
                                />
                            </div>
                            {isFlowChart && nextIsFlowChart && (
                                <div className="flex justify-center my-3 text-slate-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6 animate-bounce">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    );
                }).filter(Boolean);

                if (isGroup) {
                    const groupQIds = [];
                    groupEntry.visuals.forEach(vg => {
                        if (vg.type === 'matching-grid-group' || vg.type === 'multiple-selection-group') {
                            if (vg.questions) {
                                vg.questions.forEach(q => groupQIds.push(q.id));
                            }
                        } else if (vg.question) {
                            groupQIds.push(vg.question.id);
                        }
                    });
                    const anyGroupQInline = groupQIds.some(id => renderedInlineIds.has(id));
                    const instructionHasBlanks = header?.instructions &&
                                                 /___([\w-]+)___/.test(header.instructions) &&
                                                 !hasTable;
                    const hasInlineInstructionsRendered = instructionHasBlanks && anyGroupQInline;

                    if (isMatchingGrid || hasInlineInstructionsRendered || hasTable) {
                        return null; 
                    }

                    if (children.length === 0 && groupOptions.length === 0 && !hasTable) {
                        return null;
                    }

                    return (
                        <GroupedContainer 
                            key={`group-${header?.fromQuestion || geIdx}-${header?.toQuestion || geIdx}`} 
                            header={{
                                ...header,
                                fromQuestion: (offset || 0) + Number(header.fromQuestion),
                                toQuestion: (offset || 0) + Number(header.toQuestion)
                            }}
                            hideInstructions={hasTable}
                        >
                            {renderDragOptions()}
                            {hasTable ? (
                                <TableCompletionRenderer
                                    instructions={header.instructions}
                                    allQuestions={data?.questions || []}
                                    answers={answers}
                                    onAnswerChange={onAnswerChange}
                                    clickedOption={clickedOption}
                                    setClickedOption={setClickedOption}
                                    offset={offset}
                                />
                            ) : (
                                children
                            )}
                        </GroupedContainer>
                    );
                }

                return (
                    <div key={`ungrouped-${groupEntry.visuals[0]?.question?.id || geIdx}`} className="space-y-8">
                        {children}
                    </div>
                );
            })}
        </div>
    );
};


const ReadingSection = ({ sections = [], answers, onAnswerChange, activeSectionIdx, setActiveSectionIdx }) => {
    const data = sections[activeSectionIdx];
    const [toolbar, setToolbar] = useState({ show: false, x: 0, y: 0, range: null });
    const [activeNote, setActiveNote] = useState({ show: false, text: "", element: null, x: 0, y: 0 });
    const [activePassageTab, setActivePassageTab] = useState(0);
    const [clickedOption, setClickedOption] = useState(null);
    const leftPaneScrollRef = useRef(null);
    const passageContainerRef = useRef(null);

    const handleLocalAnswerChange = useCallback((qId, val) => {
        if (!data?._id) {
            onAnswerChange(qId, val);
            return;
        }
        onAnswerChange(`${data._id}_${qId}`, val);
    }, [data, onAnswerChange]);

    const scopedAnswers = useMemo(() => {
        if (!data?._id) return answers;
        const scoped = {};
        data.questions?.forEach(q => {
            const scopedKey = `${data._id}_${q.id}`;
            scoped[q.id] = answers[scopedKey] !== undefined ? answers[scopedKey] : answers[q.id];
        });
        return scoped;
    }, [data, answers]);

    const sectionOffsets = useMemo(() => {
        const offsets = [];
        let currentOffset = 0;
        sections.forEach((sec) => {
            offsets.push(currentOffset);
            currentOffset += sec.questions?.length || 0;
        });
        return offsets;
    }, [sections]);

    const activeSectionOffset = sectionOffsets[activeSectionIdx] || 0;

    const hasInlineQuestions = useMemo(() => {
        if (!data) return false;
        const passages = data.passages || [];
        const hasInPassages = passages.some(p => p.content && /___([\w-]+)___/.test(p.content));
        const hasInPassage = data.passage && /___([\w-]+)___/.test(data.passage);
        return hasInPassages || hasInPassage;
    }, [data]);

    const dragDropQuestions = useMemo(() => data?.questions?.filter(q => q.type === 'drag-drop-completion' || (q.type === 'flow-chart-completion' && q.options?.length > 0)) || [], [data?.questions]);
    const sharedOptions = useMemo(() => {
        const first = dragDropQuestions[0];
        return first?.options?.filter(Boolean) || [];
    }, [dragDropQuestions]);
 
    const groupedItems = useMemo(() => {
        if (!data) return [];
        const groups = groupQuestions(data.questions || [], data.questionGroups, activeSectionOffset, data.questions || []);
        return groupVisualsByQuestionGroups(groups, data.questionGroups, activeSectionOffset, data.questions || []);
    }, [data, activeSectionOffset]);

    const currentTabGroupedItems = useMemo(() => {
        if (!data) return [];
        return groupedItems.filter(groupEntry => {
            const firstQ = groupEntry.visuals[0]?.type === 'matching-grid-group' || groupEntry.visuals[0]?.type === 'multiple-selection-group'
                ? groupEntry.visuals[0].questions[0] 
                : groupEntry.visuals[0]?.question;
            if (!firstQ) return false;
            const qIdx = data.questions.findIndex(item => item.id === firstQ.id);
            const qPassageIndex = getQuestionPassageIndex(firstQ, data.questionGroups, qIdx);
            return qPassageIndex === activePassageTab;
        });
    }, [groupedItems, activePassageTab, data]);

    const hasDragDropInActiveTab = useMemo(() => {
        return currentTabGroupedItems.some(groupEntry => 
            groupEntry.visuals?.some(vg => {
                if (vg.type === 'matching-grid-group' || vg.type === 'multiple-selection-group') {
                    return vg.questions?.some(q => q.type === 'drag-drop-completion');
                }
                return vg.question?.type === 'drag-drop-completion';
            })
        );
    }, [currentTabGroupedItems]);

    const hasRightPaneQuestions = useMemo(() => {
        if (!data) return false;
        return true;
    }, [data]);
 
    const hasMultipleGroups = data?.questionGroups?.length > 1;

    const lastShownRef = useRef(0);
    const prevSectionIdxRef = useRef(activeSectionIdx);

    useEffect(() => {
        if (prevSectionIdxRef.current !== activeSectionIdx) {
            prevSectionIdxRef.current = activeSectionIdx;
            setActivePassageTab(0);
        }
        const rightContainer = document.querySelector(".w-\\[55\\%\\]");
        if (rightContainer) rightContainer.scrollTop = 0;
        const leftContainer = document.querySelector(".w-\\[45\\%\\] .overflow-y-auto");
        if (leftContainer) leftContainer.scrollTop = 0;
    }, [activeSectionIdx]);

    useEffect(() => {
        const handleGlobalClick = (e) => {
            // Hide selection toolbar if clicking away (outside both the toolbar and the passage container)
            if (toolbar.show && !e.target.closest("[data-highlight-toolbar]") && !e.target.closest("[data-passage-container]")) {
                setToolbar((prev) => ({ ...prev, show: false }));
            }
            // Close active sticky note editor if clicking away from it and from highlights
            if (activeNote.show && !e.target.closest("[data-note-popover]") && !e.target.closest("[data-highlight]")) {
                setActiveNote({ show: false, text: "", element: null, x: 0, y: 0 });
            }
        };

        document.addEventListener("pointerdown", handleGlobalClick);
        return () => document.removeEventListener("pointerdown", handleGlobalClick);
    }, [toolbar.show, activeNote.show]);



    // Use a ref for toolbar.show so handleTextSelection stays stable (no new
    // function reference on every toolbar state change), preventing passageElement
    // from getting a new handler reference unnecessarily.
    const toolbarShowRef = useRef(toolbar.show);
    useEffect(() => { toolbarShowRef.current = toolbar.show; }, [toolbar.show]);

    const handleTextSelection = useCallback((e) => {
        const container = e.currentTarget;
        
        setTimeout(() => {
            const selection = window.getSelection();
            if (!selection || selection.isCollapsed || selection.toString().trim() === "") {
                if (Date.now() - lastShownRef.current < 300) {
                    return;
                }
                if (toolbarShowRef.current) {
                    setToolbar((prev) => ({ ...prev, show: false }));
                }
                return;
            }

            try {
                const range = selection.getRangeAt(0);
                if (!container.contains(range.commonAncestorContainer)) {
                    return;
                }

                const rect = range.getBoundingClientRect();
                setToolbar({
                    show: true,
                    x: rect.left + window.scrollX + rect.width / 2,
                    y: rect.top + window.scrollY - 45,
                    range: range.cloneRange()
                });
                lastShownRef.current = Date.now();
            } catch (err) {
                console.debug("Highlight range capture skipped:", err);
            }
        }, 80);
    // Stable callback — reads toolbar.show via ref to avoid stale closures
    // without adding it to the deps array (which would recreate this fn on every
    // toolbar state change and risk triggering useMemo recomputes downstream).
    }, []);

    const applyHighlight = (colorClass) => {
        if (!toolbar.range) return;

        const span = document.createElement("mark");
        span.className = `${colorClass} text-slate-900 cursor-pointer rounded px-0.5 transition-all hover:opacity-90 relative`;
        span.setAttribute("data-highlight", "true");
        span.setAttribute("data-color", colorClass);
        span.setAttribute("data-note", "");

        // Set inline styles to completely bypass Tailwind/prose specificity overrides!
        if (colorClass.includes("bg-yellow-200")) {
            span.style.backgroundColor = "#fef08a"; // Yellow 200
        } else if (colorClass.includes("bg-emerald-200")) {
            span.style.backgroundColor = "#a7f3d0"; // Emerald 200
        } else if (colorClass.includes("bg-sky-200")) {
            span.style.backgroundColor = "#bae6fd"; // Sky 200
        } else if (colorClass.includes("bg-pink-200")) {
            span.style.backgroundColor = "#fbcfe8"; // Pink 200
        } else if (colorClass.includes("border-yellow-400")) {
            span.style.backgroundColor = "rgba(254, 240, 138, 0.5)"; // Yellow 100/50
            span.style.borderBottom = "2px solid #eab308"; // Yellow 500 border
        }

        span.onclick = (e) => {
            e.stopPropagation();
            openNoteModal(span);
        };

        try {
            toolbar.range.surroundContents(span);
        } catch (err) {
            console.warn("surroundContents failed, trying extractContents fallback:", err);
            try {
                const fragment = toolbar.range.extractContents();
                span.appendChild(fragment);
                toolbar.range.insertNode(span);
            } catch (innerErr) {
                console.error("Highlight extraction fallback failed:", innerErr);
            }
        }

        // Auto-open note editor if "Add Note" was clicked
        const isNote = colorClass.includes("border-yellow-400");
        if (isNote) {
            openNoteModal(span);
        }

        window.getSelection().removeAllRanges();
        setToolbar({ show: false, x: 0, y: 0, range: null });
    };

    const openNoteModal = (element) => {
        const rect = element.getBoundingClientRect();
        const noteText = element.getAttribute("data-note") || "";
        setActiveNote({
            show: true,
            text: noteText,
            element: element,
            x: rect.left + window.scrollX + rect.width / 2,
            y: rect.top + window.scrollY + rect.height + 10
        });
    };

    const removeHighlight = (element) => {
        if (!element) return;
        const parent = element.parentNode;
        while (element.firstChild) {
            parent.insertBefore(element.firstChild, element);
        }
        parent.removeChild(element);
        setActiveNote({ show: false, text: "", element: null, x: 0, y: 0 });
    };

    // Derive passage content outside useMemo so it updates when data/tab changes
    const passageContentText = useMemo(() => {
        if (!data) return "";
        return (data.passages && data.passages.length > 0)
            ? (data.passages[activePassageTab]?.content || "")
            : (data.passage || data.sections?.[0]?.content || "No passage content available.");
    }, [data, activePassageTab]);

    const minQuestionNum = activeSectionOffset + 1;
    const maxQuestionNum = activeSectionOffset + (data?.questions?.length || 0);

    const showSectionTabs = sections.length > 1;
    const showPassageTabs = !showSectionTabs && data?.passages && data.passages.length > 0;
    
    return (
        <div className="flex h-full overflow-hidden bg-white">
            {/* Left Pane: Passage with Sticky Question Palette at the Bottom */}
            <div className={`${!hasRightPaneQuestions ? "w-full" : "w-[45%]"} flex flex-col h-full border-r border-base-200`}>
                <div ref={leftPaneScrollRef} className="flex-1 overflow-y-auto p-12">
                    <div className="max-w-2xl mx-auto space-y-8">
                        <header className="space-y-2 font-sans">
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">Part {activeSectionIdx + 1}</p>
                            <h1 className="text-4xl font-extrabold tracking-tight">{data?.passageTitle || data?.title}</h1>
                            {data?.description && (
                                <p className="text-base-content/60 italic leading-relaxed text-lg">
                                    {data.description}
                                </p>
                            )}
                        </header>
    
                        {showSectionTabs && (
                            <div className="flex border-b border-slate-200 mb-8 gap-2 overflow-x-auto select-none">
                                {sections.map((sec, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => {
                                            setActiveSectionIdx(idx);
                                        }}
                                        className={`px-6 py-3 font-bold text-sm border-b-2 transition-all whitespace-nowrap ${
                                            activeSectionIdx === idx
                                                ? "border-primary text-primary font-black bg-primary/5 rounded-t-xl"
                                                : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-t-xl"
                                        }`}
                                    >
                                        Passage {idx + 1}
                                    </button>
                                ))}
                            </div>
                        )}
    
                        {showPassageTabs && (
                            <div className="flex border-b border-slate-200 mb-8 gap-2 overflow-x-auto select-none">
                                {data.passages.map((p, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => {
                                            setActivePassageTab(idx);
                                        }}
                                        className={`px-6 py-3 font-bold text-sm border-b-2 transition-all whitespace-nowrap ${
                                            activePassageTab === idx
                                                ? "border-primary text-primary font-black bg-primary/5 rounded-t-xl"
                                                : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-t-xl"
                                        }`}
                                    >
                                        Passage {idx + 1}
                                    </button>
                                ))}
                            </div>
                        )}
                        {showPassageTabs && data.passages[activePassageTab] && (
                            <h3 className="text-2xl font-black tracking-tight mb-6 text-slate-700 font-sans">
                                {data.passages[activePassageTab].title}
                            </h3>
                        )}
                        {data && (
                            <div 
                                ref={passageContainerRef}
                                data-passage-container="true"
                                onMouseUp={handleTextSelection}
                                onPointerUp={handleTextSelection}
                            >
                                <ReadingPassageRenderer
                                    passageContent={passageContentText}
                                    questions={data.questions || []}
                                    answers={scopedAnswers}
                                    onAnswerChange={handleLocalAnswerChange}
                                    submitted={undefined}
                                    result={null}
                                    clickedOption={clickedOption}
                                    setClickedOption={setClickedOption}
                                    className="prose prose-lg max-w-none prose-p:leading-relaxed prose-p:text-base-content/80 prose-headings:font-black font-serif text-xl space-y-6 select-text"
                                    offset={activeSectionOffset}
                                />
                            </div>
                        )}

                     {/* End of Passage Container */}
                    </div>
                </div>
            </div>

            {/* Right Pane: Question Panel */}
            {hasRightPaneQuestions && (
                <div className="w-[55%] overflow-y-auto p-6 md:p-8 bg-base-100 relative">
                    <div className="max-w-3xl mx-auto flex gap-8 items-start">
                        <div className="flex-1 min-w-0 space-y-12">
                            <header className="space-y-4">
                                <div className="flex items-center gap-2 text-primary">
                                    <PiNotePencil className="w-6 h-6" />
                                    <h2 className="text-xl font-black uppercase tracking-widest">Questions {minQuestionNum}–{maxQuestionNum}</h2>
                                </div>
                            </header>

                            {data.images?.[0] && (
                                <div className="mb-6">
                                    <img
                                        src={data.images[0]}
                                        alt="Reference Map / Diagram"
                                        className="w-full max-h-96 object-contain rounded-2xl border border-base-200 bg-white"
                                    />
                                </div>
                            )}



                            <div className="space-y-8">
                                <GroupedQuestionsRenderer
                                    groupedItems={currentTabGroupedItems}
                                    answers={scopedAnswers}
                                    onAnswerChange={handleLocalAnswerChange}
                                    offset={activeSectionOffset}
                                    data={data}
                                    clickedOption={clickedOption}
                                    setClickedOption={setClickedOption}
                                />
                            </div>

                            {showSectionTabs && activeSectionIdx < sections.length - 1 && (
                                <div className="flex justify-end pt-8">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActiveSectionIdx(activeSectionIdx + 1);
                                        }}
                                        className="btn btn-primary rounded-2xl px-8 h-12 text-xs font-black uppercase tracking-widest shadow-md shadow-primary/10 flex items-center gap-2 hover:scale-105 transition-transform"
                                    >
                                        Go to Passage {activeSectionIdx + 2}
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                            {showPassageTabs && activePassageTab < data.passages.length - 1 && (
                                <div className="flex justify-end pt-8">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActivePassageTab(activePassageTab + 1);
                                        }}
                                        className="btn btn-primary rounded-2xl px-8 h-12 text-xs font-black uppercase tracking-widest shadow-md shadow-primary/10 flex items-center gap-2 hover:scale-105 transition-transform"
                                    >
                                        Go to Passage {activePassageTab + 2}
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            


            {/* Floating Highlight Action Toolbar */}
            {toolbar.show && (
                <div 
                    data-highlight-toolbar="true"
                    className="absolute z-[100] flex items-center gap-2 p-2 bg-slate-900/95 text-white rounded-2xl shadow-2xl border border-white/10 backdrop-blur-md -translate-x-1/2"
                    style={{ top: `${toolbar.y}px`, left: `${toolbar.x}px` }}
                >
                    <button 
                        onClick={() => applyHighlight("bg-yellow-200")}
                        className="w-6 h-6 rounded-full bg-yellow-200 hover:scale-110 active:scale-95 transition-transform border border-white/20"
                        title="Yellow"
                    />
                    <button 
                        onClick={() => applyHighlight("bg-emerald-200")}
                        className="w-6 h-6 rounded-full bg-emerald-200 hover:scale-110 active:scale-95 transition-transform border border-white/20"
                        title="Mint Green"
                    />
                    <button 
                        onClick={() => applyHighlight("bg-sky-200")}
                        className="w-6 h-6 rounded-full bg-sky-200 hover:scale-110 active:scale-95 transition-transform border border-white/20"
                        title="Soft Blue"
                    />
                    <button 
                        onClick={() => applyHighlight("bg-pink-200")}
                        className="w-6 h-6 rounded-full bg-pink-200 hover:scale-110 active:scale-95 transition-transform border border-white/20"
                        title="Rose Pink"
                    />
                    <div className="w-px h-5 bg-white/25 mx-1" />
                    <button 
                        onClick={() => applyHighlight("bg-yellow-100/50 border-b-2 border-yellow-400")}
                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 hover:bg-white/10 rounded-xl transition-all text-white/90"
                    >
                        <PiNotePencil className="w-4 h-4 text-yellow-300" /> Add Note
                    </button>
                </div>
            )}

            {/* Sticky Note Popover Editor */}
            {activeNote.show && (
                <div 
                    data-note-popover="true"
                    className="absolute z-[110] w-64 p-4 bg-white rounded-3xl shadow-2xl border border-base-200 -translate-x-1/2 flex flex-col gap-3"
                    style={{ 
                        top: `${activeNote.y}px`, 
                        left: `${activeNote.x}px` 
                    }}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
                            <PiNotePencil className="text-sm" /> Sticky Note
                        </span>
                        <button 
                            onClick={() => removeHighlight(activeNote.element)}
                            className="btn btn-ghost btn-xs text-error font-black uppercase text-[9px] tracking-wider hover:bg-error/10 rounded-lg"
                        >
                            Delete Note
                        </button>
                    </div>
                    <textarea
                        value={activeNote.text}
                        onChange={(e) => {
                            setActiveNote((prev) => ({ ...prev, text: e.target.value }));
                            activeNote.element.setAttribute("data-note", e.target.value);
                        }}
                        placeholder="Jot down a quick note..."
                        className="textarea textarea-bordered rounded-2xl w-full h-24 text-xs font-medium focus:outline-none"
                    />
                    <div className="flex justify-end gap-2">
                        <button 
                            onClick={() => setActiveNote({ show: false, text: "", element: null, x: 0, y: 0 })}
                            className="btn btn-primary btn-sm rounded-xl text-[10px] font-black uppercase tracking-widest px-4 border-none shadow-md shadow-primary/20"
                        >
                            Save
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReadingSection;
