import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import useAnswers from "../../../../hooks/useAnswers";
import useCountdown from "../../../../hooks/useCountdown";
import useAxiosSecure from "../../../../hooks/useAxiosSecure.jsx";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useAuth from "../../../../hooks/useAuth.jsx";
import useUserProfile from "../../../../hooks/useUserProfile.jsx";
import { toast } from "react-toastify";
import alerts from "../../../../utils/alerts";
import { getQuestionPassageIndex } from "../../../../utils/readingUtils.js";
import Loader from "../../../Loader/Loader.jsx";
import { motion } from "framer-motion";
import { 
    PiBookOpenFill, 
    PiCheckCircleFill, 
    PiXCircleFill, 
    PiArrowRightBold,
    PiClockFill,
    PiChartLineUpFill,
    PiArrowLeftBold
} from "react-icons/pi";
import { useNavigate } from "react-router";
import useTestIntegrity from "../../../../hooks/useTestIntegrity.jsx";
import TestShell from "../../../Common/TestShell.jsx";
import useEvaluate from "../../../../hooks/useEvaluate";
import TableCompletionRenderer from "../../../Common/TableCompletionRenderer";
import ReadingPassageRenderer from "../../../Common/ReadingPassageRenderer";

const MatchingGridRenderer = ({ questions, options, answers, onAnswerChange, submitted, result, activeSet }) => {
    const firstQ = questions[0];
    const infoText = firstQ?.info;

    return (
        <div className="space-y-4 w-full">
            {infoText && (
                <div className="p-5 bg-white border border-slate-200 rounded-3xl text-sm text-slate-700 leading-relaxed shadow-xs whitespace-pre-line">
                    {infoText}
                </div>
            )}
            <div className="overflow-x-auto my-6 border border-slate-200 rounded-3xl bg-slate-50/20 p-5 shadow-inner">
                <table className="w-full text-left border-collapse text-sm">
                <thead>
                    <tr className="bg-slate-100/80 text-slate-800 font-bold border-b border-slate-200">
                        <th className="px-2 py-3 font-black text-xs uppercase tracking-widest text-slate-500">
                            Question
                        </th>
                        {options.map((opt, i) => (
                            <th key={i} className="px-1.5 py-3 text-center font-black text-xs uppercase tracking-widest text-slate-600">
                                {opt}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {questions.map((q) => {
                        const idx = activeSet.questions.findIndex(item => item.id === q.id);
                        const evaluation = result?.evaluatedAnswers?.find((a) => a.questionId === q.id);
                        const isCorrect = evaluation?.isCorrect;
                        const selectedVal = answers[q.id] || "";
                        
                        return (
                            <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-2 py-3 font-semibold text-slate-700 flex items-center gap-2 text-xs">
                                    <div className="w-7 h-7 rounded-lg bg-white border border-base-300 shadow-sm flex items-center justify-center font-black text-[10px] text-slate-500 flex-shrink-0">
                                        {idx + 1}
                                    </div>
                                    <span>{q.question}</span>
                                </td>
                                {options.map((opt, optIdx) => {
                                    const isSelected = selectedVal === opt;
                                    const isCorrectOption = q.correctAnswer === opt;
                                    
                                    // Styling on submission
                                    let cellContent = null;
                                    if (submitted) {
                                        if (isSelected && isCorrect) {
                                            cellContent = <PiCheckCircleFill className="text-emerald-500 text-lg mx-auto" />;
                                        } else if (isSelected && !isCorrect) {
                                            cellContent = <PiXCircleFill className="text-red-500 text-lg mx-auto" />;
                                        } else if (!isSelected && isCorrectOption) {
                                            cellContent = (
                                                <div className="flex items-center justify-center">
                                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black">
                                                        ✓
                                                    </span>
                                                </div>
                                            );
                                        }
                                    }
 
                                    return (
                                        <td key={optIdx} className="px-1.5 py-3 text-center align-middle">
                                            {submitted ? (
                                                cellContent || (
                                                    <input
                                                        type="radio"
                                                        disabled
                                                        checked={isSelected}
                                                        className="radio radio-primary radio-xs opacity-20 pointer-events-none mx-auto"
                                                    />
                                                )
                                            ) : (
                                                <input
                                                    type="radio"
                                                    name={q.id}
                                                    value={opt}
                                                    checked={isSelected}
                                                    onChange={() => onAnswerChange(q.id, opt)}
                                                    className="radio radio-primary radio-sm cursor-pointer mx-auto transition-transform hover:scale-110"
                                                />
                                            )}
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

const QuestionRenderer = ({ q, idx, submitted, answers, handleAnswerChange, isCorrect, correctAnswer, clickedOption, setClickedOption }) => {
    const isDragDrop = q.type === 'drag-drop-completion' || (q.type === 'flow-chart-completion' && q.options && q.options.filter(Boolean).length > 0);
    const isPteFillBlanks = q.type === 'pte-reading-writing-fill-blanks' || q.type === 'pte-reading-fill-blanks';
    const isPteReorder = q.type === 'pte-reorder-paragraphs';

    return (
        <div className={`space-y-4 p-6 rounded-3xl transition-all ${
            submitted 
            ? (isCorrect ? "bg-success/5 border border-success/20" : "bg-error/5 border border-error/20")
            : "bg-base-50/50 border border-base-200"
        }`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-white border border-base-300 flex items-center justify-center font-black text-sm shadow-sm">{idx + 1}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-base-content/30">Question</span>
                </div>
                {submitted && (
                    isCorrect ? <PiCheckCircleFill className="text-success text-xl" /> : <PiXCircleFill className="text-error text-xl" />
                )}
            </div>

            {!isPteFillBlanks && <p className="font-bold text-slate-700 leading-snug">{q.question}</p>}

            {q.imageUrl && (
                <div className="w-full">
                    <img
                        src={q.imageUrl}
                        alt={`Map / Diagram for Q${idx + 1}`}
                        className="w-full max-h-64 object-contain rounded-2xl border border-base-200 bg-white"
                    />
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
                    if (submitted) return;
                    const newAnsList = [...ansList];
                    newAnsList[blankIdx] = val;
                    handleAnswerChange(q.id, newAnsList.join(", "));
                };

                return (
                    <div className="space-y-4">
                        <div className="leading-loose text-slate-700 bg-slate-50 p-6 rounded-3xl border border-slate-200 text-sm font-medium">
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
                                            disabled={submitted}
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
                        {submitted && !isCorrect && (
                            <div className="text-[10px] font-black uppercase tracking-widest text-success mt-2 flex items-center gap-1">
                                <PiCheckCircleFill /> Correct: {correctAnswer}
                            </div>
                        )}
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
                    if (submitted) return;
                    if (orderedKeys.includes(key)) {
                        const newOrder = orderedKeys.filter(k => k !== key);
                        handleAnswerChange(q.id, newOrder.join(", "));
                    } else {
                        const newOrder = [...orderedKeys, key];
                        handleAnswerChange(q.id, newOrder.join(", "));
                    }
                };

                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 border border-slate-200 rounded-[2rem] text-xs font-sans">
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
                                                    disabled={submitted}
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
                        {submitted && !isCorrect && (
                            <div className="text-[10px] font-black uppercase tracking-widest text-success mt-2 flex items-center gap-1">
                                <PiCheckCircleFill /> Correct Sequence: {correctAnswer}
                            </div>
                        )}
                    </div>
                );
            })()}

            {isDragDrop ? (
                <div className="space-y-2">
                    <div 
                        onDragOver={(e) => !submitted && e.preventDefault()}
                        onDrop={(e) => {
                            if (submitted) return;
                            e.preventDefault();
                            const val = e.dataTransfer.getData("text/plain");
                            if (val) handleAnswerChange(q.id, val);
                        }}
                        onClick={() => {
                            if (submitted) return;
                            if (clickedOption) {
                                handleAnswerChange(q.id, clickedOption);
                                if (setClickedOption) setClickedOption(null);
                            }
                        }}
                        className={`min-w-40 h-12 px-4 border-2 border-dashed rounded-2xl flex items-center justify-center text-sm font-bold transition-all bg-white ${
                            submitted
                                ? isCorrect ? "border-success text-success bg-success/5" : "border-error text-error bg-error/5"
                                : answers[q.id]
                                ? "border-primary text-slate-800 font-black cursor-pointer shadow-xs"
                                : "border-slate-300 text-slate-400 hover:border-primary/40 cursor-pointer bg-slate-50/50"
                        }`}
                    >
                        {answers[q.id] || "Drop answer here"}
                        {!submitted && answers[q.id] && (
                            <button 
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleAnswerChange(q.id, "");
                                }}
                                className="ml-2.5 text-slate-400 hover:text-error text-lg font-black"
                            >
                                ×
                            </button>
                        )}
                    </div>
                    {submitted && !isCorrect && (
                        <div className="text-[10px] font-black uppercase tracking-widest text-success mt-2 flex items-center gap-1">
                            <PiCheckCircleFill /> Correct: {correctAnswer}
                        </div>
                    )}
                </div>
            ) : q.options && q.options.filter(opt => opt && opt.trim() !== "").length > 0 && !isPteReorder && !isPteFillBlanks ? (
                <div className="grid gap-3">
                    {q.options.filter(opt => opt && opt.trim() !== "").map((opt, oIdx) => (
                        <label 
                            key={oIdx}
                            className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                                answers[q.id] === opt 
                                ? "bg-primary/10 border-primary text-primary font-bold shadow-md shadow-primary/10" 
                                : "bg-white border-base-200 hover:border-primary/30"
                            }`}
                        >
                            <input 
                                type="radio" 
                                className="hidden"
                                name={q.id}
                                value={opt}
                                disabled={submitted}
                                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                            />
                            <span className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center p-1">
                                {answers[q.id] === opt && <div className="w-full h-full rounded-full bg-current" />}
                            </span>
                            <span className="text-sm">{opt}</span>
                        </label>
                    ))}
                </div>
            ) : !isPteFillBlanks && !isPteReorder && (
                <div className="space-y-2">
                    <input 
                        type="text" 
                        disabled={submitted}
                        className="input input-bordered w-full rounded-2xl font-bold bg-white focus:border-primary"
                        placeholder="Type your answer here..."
                        value={answers[q.id] || ""}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    />
                    {submitted && !isCorrect && (
                        <div className="text-[10px] font-black uppercase tracking-widest text-success mt-2 flex items-center gap-1">
                            <PiCheckCircleFill /> Correct: {correctAnswer}
                        </div>
                    )}
                </div>
            )}
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

const MultipleSelectionRenderer = ({ questions, options, answers, onAnswerChange, offset = 0, data }) => {
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

const GroupedQuestionsRenderer = ({ groupedItems, answers, handleAnswerChange, submitted, result, activeSet, clickedOption, setClickedOption, activePassageTab }) => {
    const renderedInlineIds = useMemo(() => {
        const ids = new Set();
        if (!activeSet) return ids;

        const passages = activeSet.passages || [];
        passages.forEach(p => {
            if (!p.content) return;
            const matches = p.content.match(/___([\w-]+)___/g) || [];
            matches.forEach(m => {
                const matchKey = m.replace(/___/g, "").trim();
                const q = activeSet.questions?.find((item, idx) => {
                    const questionNum = idx + 1;
                    return (
                        item.id === matchKey ||
                        questionNum.toString() === matchKey
                    );
                });
                if (q) ids.add(q.id);
            });
        });

        if (activeSet.passage) {
            const matches = activeSet.passage.match(/___([\w-]+)___/g) || [];
            matches.forEach(m => {
                const matchKey = m.replace(/___/g, "").trim();
                const q = activeSet.questions?.find((item, idx) => {
                    const questionNum = idx + 1;
                    return (
                        item.id === matchKey ||
                        questionNum.toString() === matchKey
                    );
                });
                if (q) ids.add(q.id);
            });
        }

        if (activeSet.questionGroups) {
            activeSet.questionGroups.forEach(g => {
                if (!g.instructions) return;
                if (/^\|.+\|$/m.test(g.instructions)) return; // Skip tables
                const matches = g.instructions.match(/___([\w-]+)___/g) || [];
                matches.forEach(m => {
                    const matchKey = m.replace(/___/g, "").trim();
                    const q = activeSet.questions?.find((item, idx) => {
                        const questionNum = idx + 1;
                        return (
                            item.id === matchKey ||
                            questionNum.toString() === matchKey
                        );
                    });
                    if (q) ids.add(q.id);
                });
            });
        }
        return ids;
    }, [activeSet]);

    const passageInlineIds = useMemo(() => {
        const ids = new Set();
        if (!activeSet) return ids;

        const passages = activeSet.passages || [];
        passages.forEach(p => {
            if (!p.content) return;
            const matches = p.content.match(/___([\w-]+)___/g) || [];
            matches.forEach(m => {
                const matchKey = m.replace(/___/g, "").trim();
                const q = activeSet.questions?.find((item, idx) => {
                    const questionNum = idx + 1;
                    return (
                        item.id === matchKey ||
                        questionNum.toString() === matchKey
                    );
                });
                if (q) ids.add(q.id);
            });
        });

        if (activeSet.passage) {
            const matches = activeSet.passage.match(/___([\w-]+)___/g) || [];
            matches.forEach(m => {
                const matchKey = m.replace(/___/g, "").trim();
                const q = activeSet.questions?.find((item, idx) => {
                    const questionNum = idx + 1;
                    return (
                        item.id === matchKey ||
                        questionNum.toString() === matchKey
                    );
                });
                if (q) ids.add(q.id);
            });
        }

        return ids;
    }, [activeSet]);

    const dragDropQuestions = useMemo(() => activeSet?.questions?.filter(q => q.type === 'drag-drop-completion' || (q.type === 'flow-chart-completion' && q.options?.length > 0)) || [], [activeSet?.questions]);
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
                                key={`group-${geIdx}`} 
                                header={{
                                    ...header,
                                    fromQuestion: Number(header.fromQuestion),
                                    toQuestion: Number(header.toQuestion)
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
                                                onAnswerChange={handleAnswerChange}
                                                submitted={submitted}
                                                result={result}
                                                activeSet={activeSet}
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
                                key={`group-${geIdx}`} 
                                header={{
                                    ...header,
                                    fromQuestion: Number(header.fromQuestion),
                                    toQuestion: Number(header.toQuestion)
                                }}
                                hideInstructions={true}
                            >
                                <TableCompletionRenderer
                                    instructions={header.instructions}
                                    allQuestions={activeSet.questions || []}
                                    answers={answers}
                                    onAnswerChange={handleAnswerChange}
                                    submitted={submitted}
                                    result={result}
                                    clickedOption={clickedOption}
                                    setClickedOption={setClickedOption}
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
                                key={`group-${geIdx}`} 
                                header={{
                                    ...header,
                                    fromQuestion: Number(header.fromQuestion),
                                    toQuestion: Number(header.toQuestion)
                                }}
                                hideInstructions={true}
                            >
                                {renderDragOptions()}
                                <div className="p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-xs">
                                    <ReadingPassageRenderer
                                        passageContent={header.instructions}
                                        questions={activeSet.questions || []}
                                        answers={answers}
                                        onAnswerChange={handleAnswerChange}
                                        submitted={submitted}
                                        result={result}
                                        clickedOption={clickedOption}
                                        setClickedOption={setClickedOption}
                                        className="prose prose-sm max-w-none font-sans text-slate-700 leading-relaxed space-y-4"
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
                                    onAnswerChange={handleAnswerChange}
                                    offset={0}
                                    data={activeSet}
                                />
                            </div>
                        );
                    }

                    const q = vg.question;
                    if (renderedInlineIds.has(q.id)) {
                        return null;
                    }

                    const idx = activeSet.questions.findIndex(item => item.id === q.id);
                    const isCorrect = submitted && result?.evaluatedAnswers?.find(a => a.questionId === q.id)?.isCorrect;
                    const isFlowChart = q.type === 'flow-chart-completion';
                    const nextIsFlowChart = vgIdx < groupEntry.visuals.length - 1 && groupEntry.visuals[vgIdx + 1]?.question?.type === 'flow-chart-completion';

                    return (
                        <div key={q.id || idx} className="space-y-4 animate-fadeIn">
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
                                    submitted={submitted}
                                    answers={answers}
                                    handleAnswerChange={handleAnswerChange}
                                    isCorrect={isCorrect}
                                    correctAnswer={q.correctAnswer}
                                    clickedOption={clickedOption}
                                    setClickedOption={setClickedOption}
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
                            key={`group-${geIdx}`} 
                            header={{
                                ...header,
                                fromQuestion: Number(header.fromQuestion),
                                toQuestion: Number(header.toQuestion)
                            }}
                            hideInstructions={hasTable}
                        >
                            {renderDragOptions()}
                            {hasTable ? (
                                <TableCompletionRenderer
                                    instructions={header.instructions}
                                    allQuestions={activeSet.questions || []}
                                    answers={answers}
                                    onAnswerChange={handleAnswerChange}
                                    submitted={submitted}
                                    result={result}
                                    clickedOption={clickedOption}
                                    setClickedOption={setClickedOption}
                                />
                            ) : (
                                children
                            )}
                        </GroupedContainer>
                    );
                }

                return (
                    <div key={`ungrouped-${geIdx}`} className="space-y-8">
                        {children}
                    </div>
                );
            })}
        </div>
    );
};

const Reading = ({ preloadedSet = null }) => {
  const axiosSecure = useAxiosSecure();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userData } = useUserProfile();
  const targetExam = userData?.targetExam || "IELTS";

  const { data: fetchedReadingSets = [], isLoading: queryLoading } = useQuery({
    queryKey: ["reading-sets", user?.email],
    queryFn: async () => {
      const response = await axiosSecure.get("/questions?type=reading");
      return response?.data?.questions || [];
    },
    enabled: !!user?.email && !preloadedSet,
    staleTime: 5 * 60 * 1000,
  });

  const readingSets = preloadedSet ? [preloadedSet] : fetchedReadingSets;
  const loading = preloadedSet ? false : queryLoading;

  const [selectedSetId, setSelectedSetId] = useState("");
  const [prevSelectedSetId, setPrevSelectedSetId] = useState("");
  const { answers, setAnswers, handleAnswerChange } = useAnswers({});
  const { submitting, submitted, setSubmitted, result, setResult, evaluate } = useEvaluate();
  const [activePassageTab, setActivePassageTab] = useState(0);

  const [toolbar, setToolbar] = useState({ show: false, x: 0, y: 0, range: null });
  const [activeNote, setActiveNote] = useState({ show: false, text: "", element: null, x: 0, y: 0 });
  const lastShownRef = useRef(0);

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

  const handleTextSelection = useCallback((e) => {
    const container = e.currentTarget;
    
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.toString().trim() === "") {
        // If the toolbar was shown very recently (within 300ms), ignore the collapsed check
        // to prevent trackpad pointer-up bounces/micro-clicks from hiding the toolbar.
        if (Date.now() - lastShownRef.current < 300) {
          return;
        }
        setToolbar((prev) => ({ ...prev, show: false }));
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
  }, []);

  const applyHighlight = (colorClass) => {
    if (!toolbar.range) return;

    const span = document.createElement("mark");
    span.className = `${colorClass} text-slate-900 cursor-pointer rounded px-0.5 transition-all hover:opacity-90 relative`;
    span.setAttribute("data-highlight", "true");
    span.setAttribute("data-color", colorClass);
    span.setAttribute("data-note", "");

    // Set inline styles to completely bypass Tailwind/prose specificity overrides!
    if (colorClass.includes("bg-emerald-200")) {
      span.style.backgroundColor = "#a7f3d0"; // Emerald 200
    } else if (colorClass.includes("bg-sky-200")) {
      span.style.backgroundColor = "#bae6fd"; // Sky 200
    }

    span.onclick = (e) => {
      e.stopPropagation();
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

    window.getSelection().removeAllRanges();
    setToolbar({ show: false, x: 0, y: 0, range: null });
  };

//   const openNoteModal = (element) => {
//     const rect = element.getBoundingClientRect();
//     const noteText = element.getAttribute("data-note") || "";
//     setActiveNote({
//       show: true,
//       text: noteText,
//       element: element,
//       x: rect.left + window.scrollX + rect.width / 2,
//       y: rect.top + window.scrollY + rect.height + 10
//     });
//   };




  // Fullscreen & Gating States
  const [isStarted, setIsStarted] = useState(false);
  const { isFullscreen, showWarning, setShowWarning, enterFullscreen, exitFullscreen } = useTestIntegrity(isStarted, submitted);

  // Reading data fetched via useQuery above

  const activeSet = useMemo(
    () => readingSets.find((set) => set._id === selectedSetId) || null,
    [readingSets, selectedSetId],
  );
  const isPte = activeSet?.examType === "PTE";

  const hasInlineQuestions = useMemo(() => {
    if (!activeSet) return false;
    const passages = activeSet.passages || [];
    const hasInPassages = passages.some(p => p.content && /___([\w-]+)___/.test(p.content));
    const hasInPassage = activeSet.passage && /___([\w-]+)___/.test(activeSet.passage);
    return hasInPassages || hasInPassage;
  }, [activeSet]);

  const [clickedOption, setClickedOption] = useState(null);

  const dragDropQuestions = useMemo(() => activeSet?.questions?.filter(q => q.type === 'drag-drop-completion' || (q.type === 'flow-chart-completion' && q.options?.length > 0)) || [], [activeSet?.questions]);
  const sharedOptions = useMemo(() => {
      const first = dragDropQuestions[0];
      return first?.options?.filter(Boolean) || [];
  }, [dragDropQuestions]);
 
  const groupedItems = useMemo(() => {
      if (!activeSet) return [];
      const groups = groupQuestions(activeSet.questions || [], activeSet.questionGroups, 0, activeSet.questions || []);
      return groupVisualsByQuestionGroups(groups, activeSet.questionGroups, 0, activeSet.questions || []);
  }, [activeSet]);

  const currentTabGroupedItems = useMemo(() => {
      if (!activeSet) return [];
      if (isPte) return groupedItems;
      return groupedItems.filter(groupEntry => {
          const firstQ = groupEntry.visuals[0]?.type === 'matching-grid-group' || groupEntry.visuals[0]?.type === 'multiple-selection-group'
              ? groupEntry.visuals[0].questions[0] 
              : groupEntry.visuals[0]?.question;
          if (!firstQ) return false;
          const qIdx = activeSet.questions.findIndex(item => item.id === firstQ.id);
          const qPassageIndex = getQuestionPassageIndex(firstQ, activeSet.questionGroups, qIdx);
          return qPassageIndex === activePassageTab;
      });
  }, [groupedItems, activePassageTab, activeSet, isPte]);

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
    if (!activeSet) return false;
    return true;
  }, [activeSet]);
 
  if (selectedSetId !== prevSelectedSetId) {
      setPrevSelectedSetId(selectedSetId);
      setClickedOption(null);
  }

  const { timeLeft, fmtTime, resetCountdown } = useCountdown(3600, !!selectedSetId, submitted);

  const passageElement = useMemo(() => {
    if (!activeSet) return null;
    const contentText = (activeSet.passages && activeSet.passages.length > 0)
      ? (activeSet.passages[activePassageTab]?.content || "")
      : (activeSet.passage || "");

    return (
      <div
        data-passage-container="true"
        onMouseUp={handleTextSelection}
        onPointerUp={handleTextSelection}
      >
        <ReadingPassageRenderer
          passageContent={contentText}
          questions={activeSet.questions || []}
          answers={answers}
          onAnswerChange={handleAnswerChange}
          submitted={submitted}
          result={result}
          clickedOption={clickedOption}
          setClickedOption={setClickedOption}
          className="text-lg leading-relaxed text-slate-600 text-justify select-text"
        />
      </div>
    );
  }, [activeSet, activePassageTab, answers, submitted, result, clickedOption, handleAnswerChange, handleTextSelection]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await evaluate(activeSet, answers);
  };

  const handleExitTest = async () => {
    if (submitted) {
      exitFullscreen();
      setIsStarted(false);
      setSelectedSetId("");
      setAnswers({});
      setSubmitted(false);
      setResult(null);
      return;
    }

    const hasAnswers = Object.keys(answers).length > 0;
    const result = hasAnswers
      ? await alerts.confirmExitPractice("Reading Practice Lab")
      : await alerts.confirmCancelPractice("Reading Practice Lab");

    if (result.isConfirmed) {
      exitFullscreen();
      setIsStarted(false);

      if (hasAnswers) {
        try {
          toast.info("Auto-evaluating your answers...");
          const response = await axiosSecure.post("/questions/evaluate", {
            questionSetId: activeSet._id,
            answers,
          });
          if (response.data.success) {
            toast.success("Practice test auto-submitted successfully!");
            queryClient.invalidateQueries({ queryKey: ["user-lab-results"] });
          }
        } catch (error) {
          console.error("Auto submit failed:", error);
          toast.error("Auto-submit failed");
        }
      } else {
        toast.info("No answers entered. Exiting practice.");
      }

      setSelectedSetId("");
      setAnswers({});
      setSubmitted(false);
      setResult(null);
    } else if (result.isDenied) {
      exitFullscreen();
      setIsStarted(false);

      Object.keys(localStorage).forEach((key) => {
        if (key.includes("test_cache") || key.includes("test_scratchpad") || key.includes("reading")) {
          localStorage.removeItem(key);
        }
      });

      toast.info("Practice cancelled. Answers discarded.");
      setSelectedSetId("");
      setAnswers({});
      setSubmitted(false);
      setResult(null);
    }
  };

  const handleReturnToDashboard = () => {
    exitFullscreen();
    setIsStarted(false);
    navigate("/dashboard");
  };

  const handleRetake = () => {
    setAnswers({});
    setSubmitted(false);
    setResult(null);
    setClickedOption(null);
    setActivePassageTab(0);
    resetCountdown(3600);
    setIsStarted(true);
    enterFullscreen();
  };


  if (loading) return <Loader />;

  if (!activeSet || !selectedSetId) {
    return (
        <div className="max-w-7xl mx-auto px-6 pt-2 pb-20">
            <div className="text-center space-y-4 mb-16">
                <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest border ${
                    readingSets.length > 0
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-amber-50 text-amber-600 border-amber-200"
                }`}>
                    <PiBookOpenFill /> {readingSets.length} Modules Available
                </div>
                <h2 className="text-5xl font-black tracking-tighter text-slate-800">Select a <span className="text-primary italic">Reading Lab</span></h2>
                <p className="text-slate-400 font-medium text-lg">Choose a comprehensive passage to sharpen your analytical skills.</p>
            </div>

            {userData?.plan === "free" && userData?.role !== "admin" && userData?.role !== "instructor" && (
                <div className="max-w-3xl mx-auto mb-10 p-5 bg-amber-50/60 border border-amber-200/60 rounded-3xl flex items-start gap-4 shadow-xs text-left">
                    <span className="text-2xl mt-0.5">💡</span>
                    <div>
                        <h4 className="font-black text-amber-800 text-sm uppercase tracking-wider">Free Tier Plan</h4>
                        <p className="text-amber-700/90 text-xs font-semibold mt-1 leading-relaxed">
                            You can access <strong>2 random questions per day</strong>. Your questions will reset tomorrow! Upgrade your plan for unlimited access to all modules.
                        </p>
                    </div>
                </div>
            )}

            {readingSets.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-xl mx-auto"
                >
                    <div className="card bg-white border-2 border-dashed border-base-300 p-16 rounded-[3rem] text-center space-y-6">
                        <div className="w-20 h-20 rounded-[2rem] bg-amber-50 border border-amber-100 flex items-center justify-center text-4xl mx-auto">
                            📖
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black tracking-tight text-slate-800">
                                No Reading Modules Yet
                            </h3>
                            <p className="text-slate-500 font-medium leading-relaxed">
                                No reading content is available for your current exam track{" "}
                                <span className="font-black text-primary">({targetExam})</span>.
                                This could be because:
                            </p>
                        </div>
                        <ul className="text-left space-y-3 text-sm text-slate-500 font-medium">
                            <li className="flex items-start gap-3">
                                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">1</span>
                                The admin hasn't uploaded any reading passages for <strong>{targetExam}</strong> yet.
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">2</span>
                                Your exam preference might not match the available content — try switching to <strong>IELTS</strong> or <strong>BOTH</strong>.
                            </li>
                        </ul>
                        <a
                            href="/dashboard/profile"
                            className="btn btn-primary btn-block rounded-2xl h-14 font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20"
                        >
                            Change Exam Preference →
                        </a>
                    </div>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {readingSets.map((set, idx) => (
                        <motion.div 
                            key={set._id}
                            whileHover={{ y: -10 }}
                            className="card bg-white p-8 rounded-[3rem] border border-base-300 shadow-sm hover:shadow-2xl hover:border-primary/30 cursor-pointer group transition-all"
                            onClick={() => {
                              setActivePassageTab(0);
                              setSelectedSetId(set._id);
                            }}
                        >
                            <div className="flex flex-col h-full space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl group-hover:bg-primary group-hover:text-white transition-all">
                                        <PiBookOpenFill />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-base-content/20">Module {idx + 1}</span>
                                </div>
                                <h3 className="text-xl font-black group-hover:text-primary transition-colors">{set.title}</h3>
                                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-base-content/40">
                                    <span className="flex items-center gap-1.5"><PiClockFill /> 60m</span>
                                    <span className="flex items-center gap-1.5"><PiChartLineUpFill /> {set.questions?.length} Qs</span>
                                    {set.examType && (
                                        <span className={`badge badge-sm font-black ${
                                            set.examType === 'IELTS' ? 'badge-primary' :
                                            set.examType === 'PTE' ? 'badge-success' : 'badge-warning'
                                        }`}>{set.examType}</span>
                                    )}
                                </div>
                                <button className="btn btn-block rounded-2xl h-14 bg-slate-900 text-white border-none group-hover:bg-primary transition-all font-black uppercase tracking-widest text-xs">
                                    Open Module
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
  }

  return (
    <TestShell
      isStarted={isStarted}
      onStart={() => { setIsStarted(true); enterFullscreen(); }}
      onCancel={() => setSelectedSetId("")}
      title="Ready to Start?"
      description="This practice test will open in fullscreen mode. Ensure you are in a quiet environment."
      icon={PiBookOpenFill}
      isFullscreen={isFullscreen}
      showWarning={showWarning}
      onWarningResume={() => { setShowWarning(false); enterFullscreen(); }}
      onWarningExit={handleExitTest}
    >

      {/* Premium Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button onClick={handleExitTest} className="btn btn-ghost btn-circle text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                    <PiArrowLeftBold />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">{activeSet?.title}</h1>
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Reading Practice</p>
                </div>
            </div>

            <div className="flex items-center gap-6">
                {!submitted && (
                    <div className={`badge ${timeLeft < 300 ? 'bg-red-500 text-white animate-pulse' : 'badge-neutral'} p-4 rounded-xl font-black flex gap-2 border-none`}>
                        <PiClockFill /> {fmtTime(timeLeft)}
                    </div>
                )}
                <div className="h-10 w-px bg-slate-200" />
                {submitted ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-success font-black text-xs uppercase tracking-widest">
                      <PiCheckCircleFill className="text-xl" /> Session Finalized
                    </div>
                    <button
                      onClick={!preloadedSet ? handleRetake : handleReturnToDashboard}
                      className="btn btn-primary btn-sm rounded-2xl px-4 h-10 font-black text-[10px] uppercase tracking-widest"
                    >
                      {!preloadedSet ? "Retake Test" : "Return to Dashboard"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleExitTest}
                    className="btn btn-error text-white rounded-2xl px-8 h-12 font-black border-none shadow-xl shadow-error/20"
                  >
                    End Session
                  </button>
                )}
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-10">
        {submitted && result && (
            <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="card bg-linear-to-r from-primary to-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-primary/20 mb-10 flex flex-col md:flex-row items-center justify-between gap-6"
            >
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center text-4xl font-black backdrop-blur-md border border-white/20">
                        {result.score}%
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight">Practice Performance</h2>
                        <p className="text-white/70 font-bold uppercase tracking-widest text-xs mt-1">
                            {result.correctAnswers} Correct of {result.totalQuestions} Questions
                        </p>
                    </div>
                </div>
                <button
                    onClick={!preloadedSet ? handleRetake : handleReturnToDashboard}
                    className="btn bg-white text-primary border-none rounded-2xl px-8 h-14 font-black shadow-xl"
                >
                    {!preloadedSet ? "Retake Test" : "Return to Dashboard"}
                </button>
            </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-0">
            {/* Passage Side */}
            {!isPte && (
                <div className={`${!hasRightPaneQuestions ? "lg:col-span-12" : "lg:col-span-6"} h-full min-h-0`}>
                <div className="card bg-white p-10 rounded-[3rem] border border-base-300 shadow-sm h-full overflow-y-auto custom-scrollbar">
                    <div className="prose prose-slate max-w-none">
                        <h2 className="text-3xl font-black tracking-tight mb-8 text-slate-800">{activeSet.title}</h2>
                        {activeSet.passages && activeSet.passages.length > 0 && (
                            <div className="flex border-b border-slate-200 mb-8 gap-2 overflow-x-auto">
                                {activeSet.passages.map((p, idx) => (
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
                        {activeSet.passages && activeSet.passages.length > 0 && activeSet.passages[activePassageTab] && (
                            <h3 className="text-2xl font-black tracking-tight mb-6 text-slate-700">
                                {activeSet.passages[activePassageTab].title}
                            </h3>
                        )}
                        {passageElement}
                    </div>
                </div>
                </div>
            )}

            {/* Questions Side */}
            {(hasRightPaneQuestions || isPte) && (
                <div className={`${isPte ? "lg:col-span-12" : "lg:col-span-6"} h-full min-h-0`}>
                    <div className="card bg-white p-5 rounded-[3rem] border border-base-300 shadow-sm h-full overflow-y-auto custom-scrollbar relative">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black tracking-tight">Question Panel</h2>
                            <PiBookOpenFill className="text-2xl text-primary/20" />
                        </div>

                        {activeSet.images?.[0] && (
                            <div className="mb-6">
                                <img
                                    src={activeSet.images[0]}
                                    alt="Reference Map / Diagram"
                                    className="w-full max-h-96 object-contain rounded-2xl border border-base-200 bg-white"
                                />
                            </div>
                        )}



                        <form onSubmit={handleSubmit} className="space-y-10">
                            <GroupedQuestionsRenderer
                                groupedItems={currentTabGroupedItems}
                                answers={answers}
                                handleAnswerChange={handleAnswerChange}
                                submitted={submitted}
                                result={result}
                                activeSet={activeSet}
                                clickedOption={clickedOption}
                                setClickedOption={setClickedOption}
                                activePassageTab={activePassageTab}
                            />

                            {!submitted && (
                                <button 
                                    type="submit" 
                                    disabled={submitting}
                                    className="btn btn-primary btn-block rounded-3xl h-16 text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20"
                                >
                                    {submitting ? <span className="loading loading-spinner" /> : "Verify Performance"}
                                    <PiArrowRightBold />
                                </button>
                            )}
                        </form>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Floating Highlight Action Toolbar */}
      {toolbar.show && (
          <div 
              data-highlight-toolbar="true"
              className="absolute z-[100] flex items-center gap-2 p-2 bg-slate-900/95 text-white rounded-2xl shadow-2xl border border-white/10 backdrop-blur-md -translate-x-1/2"
              style={{ top: `${toolbar.y}px`, left: `${toolbar.x}px` }}
          >
              <button 
                  onClick={() => applyHighlight("bg-emerald-200")}
                  className="w-6 h-6 rounded-full bg-emerald-200 hover:scale-110 active:scale-95 transition-transform border border-white/20"
                  title="Green"
              />
              <button 
                  onClick={() => applyHighlight("bg-sky-200")}
                  className="w-6 h-6 rounded-full bg-sky-200 hover:scale-110 active:scale-95 transition-transform border border-white/20"
                  title="Blue"
              />
          </div>
      )}


    </TestShell>
  );
};

export default Reading;
