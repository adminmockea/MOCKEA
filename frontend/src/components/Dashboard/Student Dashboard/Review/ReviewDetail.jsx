import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router";
import { useState, useEffect, useMemo, useRef } from "react";
import useAxiosSecure from "../../../../hooks/useAxiosSecure";
import { convertMarkdownContentToHtml } from "../../../../utils/markdownUtils.js";
import { getQuestionPassageIndex } from "../../../../utils/readingUtils.js";
import { parseFeedback } from "../../../../utils/parseFeedback";
import TableCompletionRenderer from "../../../Common/TableCompletionRenderer";
import ReadingPassageRenderer from "../../../Common/ReadingPassageRenderer";
import { 
    PiArrowLeftBold, 
    PiCheckCircleFill, 
    PiXCircleFill, 
    PiInfoFill,
    PiClockFill,
    PiEarFill,
    PiPencilLineFill,
    PiMicrophoneStageFill
} from "react-icons/pi";

const parseSpeakingSubmission = (content) => {
    if (!content) return [];
    const parts = content.split(/(?=--- Part \d+)/);
    const parsed = [];
    
    parts.forEach(partText => {
        const titleMatch = partText.match(/--- (Part \d+[^\n]+) ---/);
        const title = titleMatch ? titleMatch[1] : "Speaking Part";
        
        const items = [];
        const lines = partText.split("\n");
        let currentItem = null;
        
        lines.forEach(line => {
            const cleanLine = line.trim();
            if ((cleanLine.startsWith("Q") && cleanLine.includes(":")) || cleanLine.startsWith("Cue Card:")) {
                if (currentItem) items.push(currentItem);
                const label = cleanLine.startsWith("Cue Card:") ? "Cue Card" : cleanLine.split(":")[0];
                const questionText = cleanLine.substring(cleanLine.indexOf(":") + 1).trim();
                currentItem = { label, question: questionText, audioUrl: "" };
            } else if (cleanLine.startsWith("Answer:")) {
                if (currentItem) {
                    currentItem.audioUrl = cleanLine.replace("Answer:", "").trim();
                }
            }
        });
        if (currentItem) items.push(currentItem);
        if (items.length > 0) {
            parsed.push({ title, items });
        }
    });
    return parsed;
};

const parseWritingSubmission = (content) => {
    if (!content) return { task1: "", task2: "" };
    if (content.includes("--- TASK 2")) {
        const match = content.match(/--- TASK 1.*---\n([\s\S]*?)\n\n--- TASK 2.*---\n([\s\S]*)/);
        if (match) {
            return { task1: match[1].trim(), task2: match[2].trim() };
        } else {
            const parts = content.split(/--- TASK 2.*---\n?/);
            const t1 = parts[0].replace(/--- TASK 1.*---\n?/, "").trim();
            const t2 = (parts[1] || "").trim();
            return { task1: t1, task2: t2 };
        }
    }
    return { task1: content.trim(), task2: "" };
};


const ReviewMatchingGrid = ({ items, options }) => {
    const firstItem = items[0];
    const infoText = firstItem?.q?.info;

    return (
        <div className="space-y-4 w-full">
            {infoText && (
                <div className="p-5 bg-white border border-slate-200 rounded-3xl text-sm text-slate-700 leading-relaxed shadow-xs whitespace-pre-line">
                    {infoText}
                </div>
            )}
            <div className="card p-6 rounded-[2rem] border border-base-300 bg-white shadow-sm overflow-x-auto my-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-primary/45 mb-4 pl-1">Matching Grid Feedback</h4>
            <table className="w-full text-left border-collapse text-sm">
                <thead>
                    <tr className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200">
                        <th className="p-3 font-black text-xs uppercase tracking-widest text-slate-500">Question</th>
                        {options.map((opt, i) => (
                            <th key={i} className="p-3 text-center font-black text-xs uppercase tracking-widest text-slate-600">{opt}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {items.map(({ ans, q, originalIdx }) => {
                        const selectedVal = ans.userAnswer || "";
                        return (
                            <tr key={ans.questionId} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-3 font-semibold text-slate-700 flex items-center gap-3">
                                    <span className="w-7 h-7 rounded-xl bg-white border border-base-300 flex items-center justify-center font-black text-xs shadow-sm flex-shrink-0">
                                        {originalIdx + 1}
                                    </span>
                                    <span>{q?.question}</span>
                                </td>
                                {options.map((opt, optIdx) => {
                                    const isSelected = selectedVal === opt;
                                    const isCorrectOption = ans.correctAnswer === opt;
                                    
                                    let cellContent = null;
                                    if (isSelected && ans.isCorrect) {
                                        cellContent = <PiCheckCircleFill className="text-success text-lg mx-auto" />;
                                    } else if (isSelected && !ans.isCorrect) {
                                        cellContent = <PiXCircleFill className="text-error text-lg mx-auto" />;
                                    } else if (!isSelected && isCorrectOption) {
                                        cellContent = (
                                            <div className="flex items-center justify-center">
                                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black">
                                                    ✓
                                                </span>
                                            </div>
                                        );
                                    }
                                    
                                    return (
                                        <td key={optIdx} className="p-3 text-center align-middle">
                                            {cellContent || (
                                                <input
                                                    type="radio"
                                                    disabled
                                                    checked={isSelected}
                                                    className="radio radio-primary radio-xs opacity-20 pointer-events-none mx-auto"
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

const groupReviewAnswers = (answers = [], currentSectionData, activeTab, activePassageTab, isSectionTab = false) => {
    const safeAnswers = Array.isArray(answers) ? answers : [];
    const mapped = safeAnswers.map((ans, idx) => {
        const parts = ans.questionId.split('_');
        const isScoped = parts.length > 1 && currentSectionData?._id && parts[0] === currentSectionData._id.toString();
        const localQId = isScoped ? parts.slice(1).join('_') : ans.questionId;

        const originalQ = currentSectionData?.questions?.find(q => q.id === localQId || q.id === ans.questionId);
        const qIdx = currentSectionData?.questions?.findIndex(q => q.id === localQId || q.id === ans.questionId);
        
        if (!originalQ) return null;
        
        // Filter by passage if reading and it's a single question set containing multiple passages
        if (activeTab === 'reading' && !isSectionTab && currentSectionData?.passages && currentSectionData.passages.length > 0) {
            const qPassageIndex = getQuestionPassageIndex(originalQ, currentSectionData?.questionGroups, qIdx);
            if (qPassageIndex !== activePassageTab) return null;
        }
        
        return { ans, q: originalQ, qIdx, originalIdx: idx };
    }).filter(Boolean);

    const groups = [];
    let currentGridGroup = null;
    let currentGroupId = null;
    let currentOptionsKey = null;
    let currentSelectionGroup = null;
    let currentSelectionQuestionText = null;

    for (const item of mapped) {
        if (item.q && item.q.type === 'matching-grid') {
            currentSelectionGroup = null;
            currentSelectionQuestionText = null;

            let groupId = 'no-group';
            if (currentSectionData && currentSectionData.questionGroups) {
                const globalQNum = item.qIdx + 1;
                const matchingGroup = currentSectionData.questionGroups.find(qg => {
                    const fromQ = Number(qg.fromQuestion);
                    const toQ = Number(qg.toQuestion);
                    return globalQNum >= fromQ && globalQNum <= toQ;
                });
                if (matchingGroup) {
                    groupId = `${matchingGroup.fromQuestion}-${matchingGroup.toQuestion}`;
                }
            }

            const cleanOptions = (item.q.options || []).filter(o => o && o.trim() !== "");
            const optionsKey = cleanOptions.join('|');

            if (currentGridGroup && currentGroupId === groupId && currentOptionsKey === optionsKey) {
                currentGridGroup.items.push(item);
            } else {
                currentGridGroup = {
                    type: 'matching-grid-group',
                    options: cleanOptions,
                    items: [item]
                };
                currentGroupId = groupId;
                currentOptionsKey = optionsKey;
                groups.push(currentGridGroup);
            }
        } else if (item.q && (item.q.type === 'multiple-selection' || item.q.type === 'multiple-choice')) {
            currentGridGroup = null;
            currentGroupId = null;
            currentOptionsKey = null;

            const cleanOptions = (item.q.options || []).filter(o => o && o.trim() !== "");
            const optionsKey = cleanOptions.join('|');
            const qText = item.q.question ? item.q.question.trim().toLowerCase() : "";

            const isGroupableWithCurrent = currentSelectionGroup && qText && currentSelectionQuestionText === qText;
            const isMultiSelection = item.q.type === 'multiple-selection';

            if (isGroupableWithCurrent) {
                currentSelectionGroup.items.push(item);
                if (cleanOptions.length > currentSelectionGroup.options.length) {
                    currentSelectionGroup.options = cleanOptions;
                    currentSelectionGroup.optionsKey = optionsKey;
                }
            } else if (isMultiSelection) {
                currentSelectionGroup = {
                    type: 'multiple-selection-group',
                    options: cleanOptions,
                    optionsKey: optionsKey,
                    items: [item]
                };
                currentSelectionQuestionText = qText;
                groups.push(currentSelectionGroup);
            } else {
                currentSelectionGroup = null;
                currentSelectionQuestionText = null;
                groups.push({
                    type: 'single',
                    item
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
                item
            });
        }
    }
    return groups;
};

const ReviewMultipleSelection = ({ items, options, offset }) => {
    const firstItem = items[0];
    const questionNumbers = items.map(item => offset + item.qIdx + 1);

    return (
        <div className="space-y-4 p-4 rounded-3xl border border-base-200 bg-white shadow-xs">
            <div className="flex items-center gap-3">
                <div className="flex gap-1.5 flex-wrap">
                    {questionNumbers.map(num => (
                        <div key={num} className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                            {num}
                        </div>
                    ))}
                </div>
                <p className="text-sm font-bold text-slate-800">
                    {firstItem.q.question}
                </p>
            </div>

            <div className="grid grid-cols-1 gap-3 pl-2">
                {items.map((item, idx) => {
                    const displayNum = offset + item.qIdx + 1;
                    const ans = item.ans;
                    return (
                        <div key={item.q.id} className={`flex items-start justify-between gap-4 p-3.5 rounded-2xl border transition-all ${
                            ans.isCorrect ? "bg-success/5 border-success/20" : "bg-error/5 border-error/20"
                        }`}>
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-white border border-base-300 flex items-center justify-center font-black text-xs shadow-xs">
                                        {displayNum}
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-base-content/30">Selection Analysis</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-base-content/40">Your Answer</p>
                                        <p className={`font-black text-sm ${ans.isCorrect ? "text-success" : "text-error"}`}>
                                            {ans.userAnswer || "No Answer"}
                                        </p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-base-content/40">Correct Answer</p>
                                        <p className="font-black text-sm text-success">{ans.correctAnswer}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-2xl flex-shrink-0 pt-1">
                                {ans.isCorrect ? <PiCheckCircleFill className="text-success" /> : <PiXCircleFill className="text-error" />}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const groupVisualsByQuestionGroups = (visualGroups, questionGroups) => {
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
            const firstItem = (vg.type === 'matching-grid-group' || vg.type === 'multiple-selection-group') ? vg.items[0] : vg.item;
            const localQNum = firstItem.qIdx + 1;

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
                        <div 
                            className="bg-amber-50 border border-amber-200/60 px-5 py-3.5 rounded-2xl text-sm text-slate-700 leading-relaxed shadow-xs"
                            dangerouslySetInnerHTML={{ __html: convertMarkdownContentToHtml(header.instructions) }}
                        />
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

const GroupedReviewQuestionsRenderer = ({ 
    groupedItems, 
    allQuestions, 
    answersMap, 
    evaluationResult,
    activeTab,
    currentSectionData,
    activePassageTab,
    offset = 0
}) => {
    const renderedInlineIds = useMemo(() => {
        const ids = new Set();
        if (!currentSectionData || !allQuestions) return ids;

        const checkText = (text) => {
            if (!text) return;
            const matches = text.match(/___([\w-]+)___/g) || [];
            matches.forEach(m => {
                const matchKey = m.replace(/___/g, "").trim();
                const q = allQuestions.find((item, idx) => {
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
        };

        if (activeTab === 'reading') {
            const passages = currentSectionData.passages || [];
            if (passages[activePassageTab]) {
                checkText(passages[activePassageTab].content);
            }
            checkText(currentSectionData.passage);
        } else if (activeTab === 'listening') {
            checkText(currentSectionData.passage);
            checkText(currentSectionData.instructions);
        }

        // Scan question group instructions for both reading and listening
        const qGroups = currentSectionData.questionGroups || [];
        qGroups.forEach(g => {
            if (g.instructions && !/^\|.+\|$/m.test(g.instructions)) {
                checkText(g.instructions);
            }
        });

        return ids;
    }, [currentSectionData, allQuestions, activeTab, activePassageTab, offset]);

    const passageInlineIds = useMemo(() => {
        const ids = new Set();
        if (!currentSectionData || !allQuestions) return ids;

        const checkText = (text) => {
            if (!text) return;
            const matches = text.match(/___([\w-]+)___/g) || [];
            matches.forEach(m => {
                const matchKey = m.replace(/___/g, "").trim();
                const q = allQuestions.find((item, idx) => {
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
        };

        if (activeTab === 'reading') {
            const passages = currentSectionData.passages || [];
            if (passages[activePassageTab]) {
                checkText(passages[activePassageTab].content);
            }
            checkText(currentSectionData.passage);
        } else if (activeTab === 'listening') {
            checkText(currentSectionData.passage);
        }

        return ids;
    }, [currentSectionData, allQuestions, activeTab, activePassageTab, offset]);

    return (
        <div className="space-y-8">
            {groupedItems.map((groupEntry, geIdx) => {
                const isGroup = groupEntry.type === 'group';
                
                const children = groupEntry.visuals.map((vg, vgIdx) => {
                    if (vg.type === 'matching-grid-group') {
                        if (activeTab === 'reading') {
                            return null; // completely hide matching grid from the right panel for Reading!
                        }
                        const nonInlineQuestions = vg.items.filter(item => !renderedInlineIds.has(item.q.id));
                        if (nonInlineQuestions.length === 0) return null;
                        return (
                            <ReviewMatchingGrid
                                key={`grid-${geIdx}-${vgIdx}`}
                                items={nonInlineQuestions}
                                options={vg.options}
                            />
                        );
                    }
                    if (vg.type === 'multiple-selection-group') {
                        return (
                            <ReviewMultipleSelection
                                key={`selection-${geIdx}-${vgIdx}`}
                                items={vg.items}
                                options={vg.options}
                                offset={offset}
                            />
                        );
                    }

                    const { ans, originalIdx, q } = vg.item;
                    if (q && renderedInlineIds.has(q.id)) {
                        return null;
                    }
                    const qIdx = currentSectionData?.questions?.findIndex(item => item.id === q.id);
                    const displayNum = qIdx !== -1 ? ((offset || 0) + qIdx + 1) : (originalIdx + 1);
                    return (
                        <div key={originalIdx} className={`card p-4 rounded-3xl border shadow-sm transition-all ${
                            ans.isCorrect ? "bg-success/5 border-success/20" : "bg-error/5 border-error/20"
                        }`}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-xl bg-white border border-base-300 flex items-center justify-center font-black text-sm shadow-sm">{displayNum}</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-base-content/30">Question Analysis</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-base-content/40">Your Answer</p>
                                            <p className={`font-black text-lg ${ans.isCorrect ? "text-success" : "text-error"}`}>
                                                {ans.userAnswer || "No Answer"}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-base-content/40">Correct Answer</p>
                                            <p className="font-black text-lg text-success">{ans.correctAnswer}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-3xl flex-shrink-0">
                                    {ans.isCorrect ? <PiCheckCircleFill className="text-success" /> : <PiXCircleFill className="text-error" />}
                                </div>
                            </div>
                        </div>
                    );
                }).filter(Boolean);

                if (isGroup) {
                    const header = groupEntry.header;
                    const isMatchingGrid = groupEntry.visuals?.some(vg => vg.type === 'matching-grid-group');
                    const hasTable = header?.rightSideQuestion || (header?.instructions && 
                                     /___([\w-]+)___/.test(header.instructions) && 
                                     /^\|.+\|$/m.test(header.instructions));
                    const instructionHasBlanks = header?.instructions && 
                                                 /___([\w-]+)___/.test(header.instructions) && 
                                                 !hasTable;
                    const groupQIds = [];
                    groupEntry.visuals.forEach(vg => {
                        if (vg.type === 'matching-grid-group' || vg.type === 'multiple-selection-group') {
                            if (vg.items) {
                                vg.items.forEach(it => {
                                    if (it.q) groupQIds.push(it.q.id);
                                });
                            }
                        } else if (vg.item && vg.item.q) {
                            groupQIds.push(vg.item.q.id);
                        }
                    });
                    const anyGroupQInline = groupQIds.some(id => renderedInlineIds.has(id));
                    const isPassageInlineGroup = groupQIds.some(id => passageInlineIds.has(id));
                    const hasInlineInstructions = instructionHasBlanks && anyGroupQInline;

                    if (children.length === 0 && !hasTable && !hasInlineInstructions) {
                        return null;
                    }

                    if (hasInlineInstructions && isPassageInlineGroup) {
                        return null;
                    }

                    return (
                        <GroupedContainer 
                            key={`group-${geIdx}`} 
                            header={{
                                ...header,
                                fromQuestion: (offset || 0) + Number(header.fromQuestion),
                                toQuestion: (offset || 0) + Number(header.toQuestion)
                            }}
                            hideInstructions={hasTable || hasInlineInstructions}
                        >
                            {hasTable ? (
                                <TableCompletionRenderer
                                    instructions={header.instructions}
                                    allQuestions={allQuestions || []}
                                    answers={answersMap || {}}
                                    onAnswerChange={() => {}}
                                    submitted={true}
                                    result={evaluationResult}
                                    offset={offset}
                                />
                            ) : hasInlineInstructions ? (
                                <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-xs">
                                    <ReadingPassageRenderer
                                        passageContent={header.instructions}
                                        questions={allQuestions || []}
                                        answers={answersMap || {}}
                                        onAnswerChange={() => {}}
                                        submitted={true}
                                        result={evaluationResult}
                                        clickedOption={null}
                                        setClickedOption={null}
                                        className="prose prose-sm max-w-none font-sans text-slate-700 leading-relaxed space-y-4"
                                        offset={offset}
                                    />
                                </div>
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


const ReviewDetailSkeleton = () => {
    return (
        <div className="min-h-screen bg-base-200 pb-20 animate-pulse">
            {/* Sticky Header Skeleton */}
            <div className="bg-white border-b border-base-300 sticky top-0 z-50">
                <div className="w-full px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="w-10 h-10 bg-slate-200 rounded-full" />
                        <div className="space-y-2">
                            <div className="h-6 w-48 bg-slate-200 rounded-lg" />
                            <div className="h-3 w-32 bg-slate-200 rounded-lg" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-8 w-20 bg-slate-200 rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>

            <main className="w-full px-8 pt-10">
                <div className="space-y-8">
                    {/* Summary Bar Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="card bg-white p-8 rounded-[2.5rem] border border-base-300 shadow-sm flex flex-row items-center gap-6 h-32">
                                <div className="w-16 h-16 rounded-3xl bg-slate-200 flex-shrink-0" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-3 w-20 bg-slate-200 rounded-md" />
                                    <div className="h-8 w-16 bg-slate-200 rounded-lg" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Main Content Layout Skeleton (Two-column style) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        {/* Left column skeleton */}
                        <div className="card bg-white p-10 rounded-[3rem] border border-base-300 shadow-sm space-y-6 h-[600px]">
                            <div className="h-8 w-2/3 bg-slate-200 rounded-lg" />
                            <div className="space-y-3">
                                <div className="h-4 w-full bg-slate-200 rounded-md" />
                                <div className="h-4 w-full bg-slate-200 rounded-md" />
                                <div className="h-4 w-5/6 bg-slate-200 rounded-md" />
                                <div className="h-4 w-full bg-slate-200 rounded-md" />
                                <div className="h-4 w-4/5 bg-slate-200 rounded-md" />
                            </div>
                            <div className="space-y-3 pt-4">
                                <div className="h-4 w-full bg-slate-200 rounded-md" />
                                <div className="h-4 w-full bg-slate-200 rounded-md" />
                                <div className="h-4 w-3/4 bg-slate-200 rounded-md" />
                            </div>
                        </div>

                        {/* Right column skeleton */}
                        <div className="space-y-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="card p-6 rounded-[2rem] border border-base-300 bg-white shadow-sm space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-slate-200 flex-shrink-0" />
                                        <div className="h-4 w-1/3 bg-slate-200 rounded-md" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <div className="h-3 w-16 bg-slate-200 rounded-md" />
                                            <div className="h-5 w-24 bg-slate-200 rounded-md" />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="h-3 w-16 bg-slate-200 rounded-md" />
                                            <div className="h-5 w-24 bg-slate-200 rounded-md" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

const ReviewDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const axiosSecure = useAxiosSecure();
    const [activeTab, setActiveTab] = useState("reading");
    const [activePassageTab, setActivePassageTab] = useState(0);
    const prevActiveTabRef = useRef(activeTab);

    useEffect(() => {
        if (prevActiveTabRef.current !== activeTab) {
            prevActiveTabRef.current = activeTab;
            setActivePassageTab(0);
        }
    }, [activeTab]);

    const { data: result, isLoading } = useQuery({
        queryKey: ["mock-result-detail", id],
        queryFn: async () => {
            const res = await axiosSecure.get(`/mock-tests/results/${id}`);
            return res.data.result;
        }
    });

    const sectionsList = useMemo(() => {
        return result?.testId?.sections?.[activeTab] || [];
    }, [result, activeTab]);

    const currentSectionData = sectionsList[activePassageTab] || sectionsList[0];

    const activeSectionOffset = useMemo(() => {
        let currentOffset = 0;
        for (let i = 0; i < activePassageTab; i++) {
            currentOffset += sectionsList[i]?.questions?.length || 0;
        }
        return currentOffset;
    }, [sectionsList, activePassageTab]);

    const currentSectionResult = result?.sectionResults?.find(s => s.sectionType === activeTab);
 
    const groupedItems = useMemo(() => {
        if (!currentSectionResult || !currentSectionData) return [];
        const isSectionTab = sectionsList.length > 1;
        const groups = groupReviewAnswers(currentSectionResult?.answers || [], currentSectionData, activeTab, activePassageTab, isSectionTab);
        return groupVisualsByQuestionGroups(groups, currentSectionData?.questionGroups);
    }, [currentSectionResult, currentSectionData, activeTab, activePassageTab, sectionsList]);

    if (isLoading) return <ReviewDetailSkeleton />;
    if (!result) return <div className="p-10 text-center">Result not found.</div>;

    return (
        <div className="min-h-screen bg-base-200 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-base-300 sticky top-0 z-50">
                <div className="w-full px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-circle">
                            <PiArrowLeftBold className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-xl font-black tracking-tight">{result.testId?.title}</h1>
                            <p className="text-[10px] font-bold text-base-content/40 uppercase tracking-widest">Performance Review • {new Date(result.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2" role="tablist" aria-label="Test sections">
                        {['reading', 'listening', 'writing', 'speaking'].map((type) => (
                            <button 
                                key={type}
                                role="tab"
                                aria-selected={activeTab === type}
                                aria-controls={`panel-${type}`}
                                id={`tab-${type}`}
                                onClick={() => setActiveTab(type)}
                                className={`btn btn-sm rounded-xl px-4 font-black uppercase tracking-tighter ${
                                    activeTab === type ? "btn-primary" : "btn-ghost text-base-content/40"
                                }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <main className="w-full px-8 pt-10" role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
                {!currentSectionResult ? (
                    <div className="card bg-white p-20 text-center space-y-4 rounded-[3rem] border border-base-300 shadow-sm">
                        <PiInfoFill className="text-5xl text-base-content/10 mx-auto" />
                        <h2 className="text-2xl font-black opacity-30">Section Not Attempted</h2>
                        <p className="text-base-content/40">You didn't complete this section during the test.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Summary Bar */}
                        {(() => {
                            const parsedFeedback = parseFeedback(currentSectionResult.feedback);
                            const crit = parsedFeedback.criteria;
                            const comments = parsedFeedback.comments || currentSectionResult.feedback;
                            
                            return (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="card bg-white p-8 rounded-[2.5rem] border border-base-300 shadow-sm flex flex-row items-center gap-6">
                                            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-3xl flex-shrink-0 ${
                                                currentSectionResult.isGraded ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                                            }`}>
                                                {currentSectionResult.isGraded ? <PiCheckCircleFill /> : <PiClockFill />}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-base-content/40">Overall Band Score</p>
                                                <p className="text-3xl font-black tracking-tighter">
                                                    {currentSectionResult.isGraded ? currentSectionResult.score : "Pending"}
                                                </p>
                                            </div>
                                        </div>

                                        {parsedFeedback.isTwoTasks ? (
                                            <div className="card bg-white p-6 rounded-[2.5rem] border border-base-300 shadow-sm flex flex-col justify-center">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-base-content/40">Task 1 Details</span>
                                                    <span className="badge badge-primary font-black text-[9px] uppercase px-2 py-0.5 rounded-lg">Band {parsedFeedback.task1?.bandScore || "—"}</span>
                                                </div>
                                                <div className="grid grid-cols-4 gap-1 mt-1 text-center">
                                                    {Object.entries(parsedFeedback.task1?.criteria || {}).map(([key, val]) => (
                                                        <div key={key} className="bg-slate-50 p-1.5 rounded-xl border border-slate-100 shadow-inner flex flex-col justify-between items-center">
                                                            <span className="text-xs font-black text-slate-800">{val}</span>
                                                            <span className="text-[6px] block font-black uppercase tracking-widest text-slate-400 mt-0.5">{key}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                {parsedFeedback.task1?.feedback && (
                                                    <p className="text-[9px] font-bold text-slate-500 italic mt-3 line-clamp-2 leading-tight">"{parsedFeedback.task1.feedback}"</p>
                                                )}
                                            </div>
                                        ) : crit ? (
                                            <div className="card bg-white p-6 rounded-[2.5rem] border border-base-300 shadow-sm flex flex-col justify-center">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-base-content/40 mb-3 text-center">Criteria Breakdown</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {activeTab === 'writing' ? (
                                                        <>
                                                            <div className="bg-slate-50 p-2 rounded-xl flex flex-col items-center justify-center border border-slate-100 shadow-inner">
                                                                <span className="text-sm font-black text-slate-800">{crit.ta}</span>
                                                                <span className="text-[7px] font-black uppercase tracking-widest text-slate-400">Task Resp.</span>
                                                            </div>
                                                            <div className="bg-slate-50 p-2 rounded-xl flex flex-col items-center justify-center border border-slate-100 shadow-inner">
                                                                <span className="text-sm font-black text-slate-800">{crit.cc}</span>
                                                                <span className="text-[7px] font-black uppercase tracking-widest text-slate-400">Coherence</span>
                                                            </div>
                                                            <div className="bg-slate-50 p-2 rounded-xl flex flex-col items-center justify-center border border-slate-100 shadow-inner">
                                                                <span className="text-sm font-black text-slate-800">{crit.lr}</span>
                                                                <span className="text-[7px] font-black uppercase tracking-widest text-slate-400">Lexical</span>
                                                            </div>
                                                            <div className="bg-slate-50 p-2 rounded-xl flex flex-col items-center justify-center border border-slate-100 shadow-inner">
                                                                <span className="text-sm font-black text-slate-800">{crit.gra}</span>
                                                                <span className="text-[7px] font-black uppercase tracking-widest text-slate-400">Grammar</span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="bg-slate-50 p-2 rounded-xl flex flex-col items-center justify-center border border-slate-100 shadow-inner">
                                                                <span className="text-sm font-black text-slate-800">{crit.fc}</span>
                                                                <span className="text-[7px] font-black uppercase tracking-widest text-slate-400">Fluency</span>
                                                            </div>
                                                            <div className="bg-slate-50 p-2 rounded-xl flex flex-col items-center justify-center border border-slate-100 shadow-inner">
                                                                <span className="text-sm font-black text-slate-800">{crit.lr}</span>
                                                                <span className="text-[7px] font-black uppercase tracking-widest text-slate-400">Lexical</span>
                                                            </div>
                                                            <div className="bg-slate-50 p-2 rounded-xl flex flex-col items-center justify-center border border-slate-100 shadow-inner">
                                                                <span className="text-sm font-black text-slate-800">{crit.gra}</span>
                                                                <span className="text-[7px] font-black uppercase tracking-widest text-slate-400">Grammar</span>
                                                            </div>
                                                            <div className="bg-slate-50 p-2 rounded-xl flex flex-col items-center justify-center border border-slate-100 shadow-inner">
                                                                <span className="text-sm font-black text-slate-800">{crit.pr}</span>
                                                                <span className="text-[7px] font-black uppercase tracking-widest text-slate-400">Pronunc.</span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ) : null}

                                        {parsedFeedback.isTwoTasks ? (
                                            <div className="card bg-white p-6 rounded-[2.5rem] border border-base-300 shadow-sm flex flex-col justify-center">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-base-content/40">Task 2 Details</span>
                                                    <span className="badge badge-primary font-black text-[9px] uppercase px-2 py-0.5 rounded-lg">Band {parsedFeedback.task2?.bandScore || "—"}</span>
                                                </div>
                                                <div className="grid grid-cols-4 gap-1 mt-1 text-center">
                                                    {Object.entries(parsedFeedback.task2?.criteria || {}).map(([key, val]) => (
                                                        <div key={key} className="bg-slate-50 p-1.5 rounded-xl border border-slate-100 shadow-inner flex flex-col justify-between items-center">
                                                            <span className="text-xs font-black text-slate-800">{val}</span>
                                                            <span className="text-[6px] block font-black uppercase tracking-widest text-slate-400 mt-0.5">{key}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                {parsedFeedback.task2?.feedback && (
                                                    <p className="text-[9px] font-bold text-slate-500 italic mt-3 line-clamp-2 leading-tight">"{parsedFeedback.task2.feedback}"</p>
                                                )}
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="card bg-white p-8 rounded-[2.5rem] border border-base-300 shadow-sm flex flex-row items-center gap-6 w-full">
                                        <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center text-3xl flex-shrink-0">
                                            <PiInfoFill />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-base-content/40">Instructor Comments</p>
                                            <div 
                                                className="text-base-content/70 prose prose-sm max-w-none italic mt-1"
                                                dangerouslySetInnerHTML={{ 
                                                    __html: convertMarkdownContentToHtml(
                                                        currentSectionResult.isGraded 
                                                            ? comments || "_No specific comments provided for this section._" 
                                                            : "_This section is currently under review by our senior instructors._"
                                                    ) 
                                                }} 
                                            />
                                            {currentSectionResult.reviewedByName && (
                                                <p className="text-[9px] font-black uppercase tracking-widest text-primary/40 mt-2">
                                                    Evaluated by {currentSectionResult.reviewedByName}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Detail Review Content */}
                        <div className={['listening', 'writing'].includes(activeTab) ? "w-full space-y-8" : "grid grid-cols-1 lg:grid-cols-2 gap-8 items-start"}>
                            {/* Left: Passage / Content */}
                            <div className={`card bg-white p-10 rounded-[3rem] border border-base-300 shadow-sm ${['listening', 'writing'].includes(activeTab) ? "w-full" : "sticky top-28 h-[calc(100vh-180px)] overflow-y-auto custom-scrollbar"}`}>
                                {activeTab === 'reading' && (() => {
                                    const showSectionTabs = sectionsList.length > 1;
                                    const showPassageTabs = !showSectionTabs && currentSectionData?.passages && currentSectionData.passages.length > 0;
                                    const hasMultiplePassages = showSectionTabs || showPassageTabs;

                                    const contentText = showSectionTabs
                                        ? (currentSectionData?.passage || currentSectionData?.content || "")
                                        : (showPassageTabs
                                            ? (currentSectionData.passages[activePassageTab]?.content || "")
                                            : (currentSectionData?.passage || currentSectionData?.content || "No content available."));

                                    const titleText = showSectionTabs
                                        ? currentSectionData?.title || ""
                                        : (showPassageTabs
                                            ? currentSectionData.passages[activePassageTab]?.title || ""
                                            : currentSectionData?.title || "");

                                    const answersMap = (() => {
                                        const map = {};
                                        (currentSectionResult?.answers || []).forEach(a => {
                                            map[a.questionId] = a.userAnswer;
                                            const parts = a.questionId.split('_');
                                            if (parts.length > 1) {
                                                map[parts.slice(1).join('_')] = a.userAnswer;
                                            }
                                        });
                                        return map;
                                    })();

                                    const evaluationResult = {
                                        evaluatedAnswers: (() => {
                                            const list = [];
                                            (currentSectionResult?.answers || []).forEach(a => {
                                                list.push(a);
                                                const parts = a.questionId.split('_');
                                                if (parts.length > 1) {
                                                    list.push({
                                                        ...a,
                                                        questionId: parts.slice(1).join('_')
                                                    });
                                                }
                                            });
                                            return list;
                                        })()
                                    };

                                    return (
                                        <div className="prose prose-slate max-w-none">
                                            <h2 className="text-3xl font-black tracking-tight mb-6">{currentSectionData?.title || "Reading Section"}</h2>
                                            
                                            {/* Passage selection tabs */}
                                            {hasMultiplePassages && (
                                                <div className="flex border-b border-base-200 mb-8 gap-2 overflow-x-auto">
                                                    {(showSectionTabs ? sectionsList : currentSectionData.passages).map((p, idx) => (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={() => setActivePassageTab(idx)}
                                                            className={`px-5 py-2.5 font-bold text-sm border-b-2 transition-all whitespace-nowrap ${
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

                                            {hasMultiplePassages && (
                                                <h3 className="text-2xl font-black tracking-tight mb-6 text-slate-700">{titleText}</h3>
                                            )}

                                            <ReadingPassageRenderer
                                                passageContent={contentText}
                                                questions={currentSectionData?.questions || []}
                                                answers={answersMap}
                                                onAnswerChange={() => {}}
                                                submitted={true}
                                                result={evaluationResult}
                                                clickedOption={null}
                                                setClickedOption={null}
                                                className="text-lg leading-relaxed text-base-content/80 text-justify select-text"
                                            />
                                        </div>
                                    );
                                })()}
                                {activeTab === 'listening' && (() => {
                                    const hasPassage = currentSectionData?.passage && currentSectionData.passage.trim() !== "";
                                    const answersMap = (() => {
                                        const map = {};
                                        (currentSectionResult?.answers || []).forEach(a => {
                                            map[a.questionId] = a.userAnswer;
                                            const parts = a.questionId.split('_');
                                            if (parts.length > 1) {
                                                map[parts.slice(1).join('_')] = a.userAnswer;
                                            }
                                        });
                                        return map;
                                    })();

                                    const evaluationResult = {
                                        evaluatedAnswers: (() => {
                                            const list = [];
                                            (currentSectionResult?.answers || []).forEach(a => {
                                                list.push(a);
                                                const parts = a.questionId.split('_');
                                                if (parts.length > 1) {
                                                    list.push({
                                                        ...a,
                                                        questionId: parts.slice(1).join('_')
                                                    });
                                                }
                                            });
                                            return list;
                                        })()
                                    };

                                    return (
                                        <div className="space-y-8">
                                            {sectionsList.length > 1 && (
                                                <div className="flex border-b border-base-200 mb-6 gap-2 overflow-x-auto">
                                                    {sectionsList.map((sec, idx) => (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={() => setActivePassageTab(idx)}
                                                            className={`px-5 py-2.5 font-bold text-sm border-b-2 transition-all whitespace-nowrap ${
                                                                activePassageTab === idx
                                                                    ? "border-primary text-primary font-black bg-primary/5 rounded-t-xl"
                                                                    : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-t-xl"
                                                            }`}
                                                        >
                                                            Part {idx + 1}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-[2rem] space-y-4">
                                                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-2xl text-purple-600">
                                                    <PiEarFill />
                                                </div>
                                                <audio controls src={currentSectionData?.audioUrl} className="w-full" />
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Section Recording Player</p>
                                            </div>

                                            {currentSectionData?.images?.filter(img => img && img.trim() !== "").map((img, i) => (
                                                <div key={i} className="rounded-3xl overflow-hidden border border-base-300 bg-base-100 p-4">
                                                    <img src={img} alt={`Listening Reference Map or Diagram ${i+1}`} className="w-full h-auto object-contain max-h-[400px] mx-auto" />
                                                </div>
                                            ))}

                                            {hasPassage && (
                                                <div className="prose prose-slate max-w-none">
                                                    <ReadingPassageRenderer
                                                        passageContent={currentSectionData.passage}
                                                        questions={currentSectionData?.questions || []}
                                                        answers={answersMap}
                                                        onAnswerChange={() => {}}
                                                        submitted={true}
                                                        result={evaluationResult}
                                                        clickedOption={null}
                                                        setClickedOption={null}
                                                        className="text-lg leading-relaxed text-base-content/80 text-justify select-text"
                                                        offset={activeSectionOffset}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                                {activeTab === 'writing' && (
                                    <div className="space-y-6">
                                        <h2 className="text-2xl font-black uppercase tracking-tighter text-primary">Writing Task Prompt</h2>
                                        <div dangerouslySetInnerHTML={{ __html: convertMarkdownContentToHtml(currentSectionData?.passage || currentSectionData?.content) }} className="text-lg bg-base-100 p-8 rounded-[2rem] border border-base-300 shadow-inner select-text" />
                                        {currentSectionData?.images?.filter(img => img && img.trim() !== "").length > 0 && (
                                            <div className="grid gap-4 pt-4">
                                                {currentSectionData.images.filter(img => img && img.trim() !== "").map((img, i) => (
                                                    <div key={i} className="rounded-3xl overflow-hidden border border-base-300 bg-base-100 p-4">
                                                        <img src={img} alt={`Writing Task Diagram ${i+1}`} className="w-full h-auto object-contain max-h-[400px]" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {activeTab === 'speaking' && (
                                    <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                                        <PiMicrophoneStageFill className="text-6xl text-green-500 animate-bounce" />
                                        <h3 className="text-2xl font-black">Speaking Evaluation</h3>
                                        <p className="text-base-content/50">Your verbal answers are loaded on the right. You can play them sequentially.</p>
                                        <div className="w-full h-1 bg-base-200 rounded-full overflow-hidden">
                                            <div className="w-full h-full bg-success" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right: Answer Comparison */}
                            <div className="space-y-6">
                                {['reading', 'listening'].includes(activeTab) ? (
                                    <>
                                        {activeTab === 'reading' && currentSectionData?.passages?.[activePassageTab]?.instructions && (
                                            <div className="p-6 bg-primary/5 border border-primary/10 rounded-3xl text-sm font-semibold text-slate-700 leading-relaxed border-l-4 border-primary mb-4">
                                                <h3 className="font-bold text-xs uppercase tracking-widest text-primary mb-1">Instructions:</h3>
                                                <p className="whitespace-pre-line">{currentSectionData.passages[activePassageTab].instructions}</p>
                                            </div>
                                        )}
                                        <GroupedReviewQuestionsRenderer
                                            groupedItems={groupedItems}
                                            allQuestions={currentSectionData?.questions || []}
                                            answersMap={(() => {
                                                const map = {};
                                                (currentSectionResult?.answers || []).forEach(a => {
                                                    map[a.questionId] = a.userAnswer;
                                                    const parts = a.questionId.split('_');
                                                    if (parts.length > 1) {
                                                        map[parts.slice(1).join('_')] = a.userAnswer;
                                                    }
                                                });
                                                return map;
                                            })()}
                                            evaluationResult={{
                                                evaluatedAnswers: (() => {
                                                    const list = [];
                                                    (currentSectionResult?.answers || []).forEach(a => {
                                                        list.push(a);
                                                        const parts = a.questionId.split('_');
                                                        if (parts.length > 1) {
                                                            list.push({
                                                                ...a,
                                                                questionId: parts.slice(1).join('_')
                                                            });
                                                        }
                                                    });
                                                    return list;
                                                })()
                                            }}
                                            activeTab={activeTab}
                                            currentSectionData={currentSectionData}
                                            activePassageTab={activePassageTab}
                                            offset={activeSectionOffset}
                                        />
                                    </>
                                ) : (
                                    <div className="card bg-white p-10 rounded-[3rem] border border-base-300 shadow-sm space-y-6">
                                        <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                                            <PiPencilLineFill className="text-primary" />
                                            Your Submission
                                        </h3>
                                        {activeTab === 'speaking' ? (() => {
                                            const speakingAnswer = (currentSectionResult?.answers || []).find(ans => 
                                                ans.questionId === currentSectionData?._id?.toString() ||
                                                ans.questionId === currentSectionData?.id ||
                                                (ans.userAnswer && (ans.userAnswer.includes("--- Part ") || ans.userAnswer.includes("Answer:")))
                                            );
                                            const parsedSpeakingParts = parseSpeakingSubmission(speakingAnswer?.userAnswer);
                                            
                                            // Align with speakingQuestionData
                                            const aligned = (() => {
                                                const findAudio = (partTitle, qText, qIndex) => {
                                                    const part = parsedSpeakingParts.find(p => p.title.toLowerCase().includes(partTitle.toLowerCase()));
                                                    if (!part) return null;
                                                    const match = part.items.find(item => {
                                                        const cleanItemQ = item.question.toLowerCase().replace(/[^a-z0-9]/g, "");
                                                        const cleanTargetQ = (qText || "").split("\n")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
                                                        return cleanItemQ === cleanTargetQ || item.label.includes((qIndex + 1).toString());
                                                    });
                                                    return match?.audioUrl || null;
                                                };
                                                return {
                                                    part1: (currentSectionData?.speakingPart1Questions || []).map((q, idx) => ({
                                                        question: q,
                                                        audioUrl: findAudio("Part 1", q, idx)
                                                    })),
                                                    part2: {
                                                        question: currentSectionData?.speakingPrompt || "Describe a historical building you have visited.",
                                                        audioUrl: findAudio("Part 2", currentSectionData?.speakingPrompt || "", 0)
                                                    },
                                                    part3: (currentSectionData?.speakingPart3Questions || []).map((q, idx) => ({
                                                        question: q,
                                                        audioUrl: findAudio("Part 3", q, idx)
                                                    }))
                                                };
                                            })();

                                            const hasConfiguredQuestions = (currentSectionData?.speakingPart1Questions?.length > 0 || currentSectionData?.speakingPrompt || currentSectionData?.speakingPart3Questions?.length > 0);

                                            if (!hasConfiguredQuestions && parsedSpeakingParts.length > 0) {
                                                return (
                                                    <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                                        {parsedSpeakingParts.map((part, partIdx) => (
                                                            <div key={partIdx} className="space-y-3 col-span-full">
                                                                <h4 className="text-xs font-black uppercase tracking-widest text-primary border-b pb-1">{part.title}</h4>
                                                                <div className="grid grid-cols-1 gap-4">
                                                                    {part.items.map((item, itemIdx) => (
                                                                        <div key={itemIdx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 shadow-inner">
                                                                            <span className="badge badge-primary font-black text-[8px] uppercase tracking-wider">{item.label}</span>
                                                                            <p className="text-xs font-bold text-slate-700 leading-tight">{item.question}</p>
                                                                            {item.audioUrl ? (
                                                                                <audio src={item.audioUrl} controls className="w-full rounded-lg mt-2" />
                                                                            ) : (
                                                                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest italic pt-1">No recording uploaded</p>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {/* Part 1 */}
                                                    <div className="space-y-3">
                                                        <h4 className="text-xs font-black uppercase tracking-widest text-primary border-b pb-1">Part 1: Interview</h4>
                                                        {aligned.part1.length > 0 ? (
                                                            <div className="grid grid-cols-1 gap-4">
                                                                {aligned.part1.map((item, idx) => (
                                                                    <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 shadow-inner">
                                                                        <span className="badge badge-primary font-black text-[8px] uppercase tracking-wider">Question {idx + 1}</span>
                                                                        <p className="text-xs font-bold text-slate-700 leading-tight">{item.question}</p>
                                                                        {item.audioUrl ? (
                                                                            <audio src={item.audioUrl} controls className="w-full rounded-lg mt-2" />
                                                                        ) : (
                                                                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest italic pt-1">No recording uploaded</p>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs font-bold text-slate-400 italic">No Part 1 questions configured.</p>
                                                        )}
                                                    </div>

                                                    {/* Part 2 */}
                                                    <div className="space-y-3">
                                                        <h4 className="text-xs font-black uppercase tracking-widest text-primary border-b pb-1">Part 2: Cue Card Prompt</h4>
                                                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 shadow-inner">
                                                            <span className="badge badge-primary font-black text-[8px] uppercase tracking-wider">Cue Card Topic</span>
                                                            <p className="text-xs font-bold text-slate-700 leading-tight whitespace-pre-wrap">{aligned.part2.question}</p>
                                                            {aligned.part2.audioUrl ? (
                                                                <audio src={aligned.part2.audioUrl} controls className="w-full rounded-lg mt-2" />
                                                            ) : (
                                                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest italic pt-1">No recording uploaded</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Part 3 */}
                                                    <div className="space-y-3">
                                                        <h4 className="text-xs font-black uppercase tracking-widest text-primary border-b pb-1">Part 3: Discussion</h4>
                                                        {aligned.part3.length > 0 ? (
                                                            <div className="grid grid-cols-1 gap-4">
                                                                {aligned.part3.map((item, idx) => (
                                                                    <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 shadow-inner">
                                                                        <span className="badge badge-primary font-black text-[8px] uppercase tracking-wider">Discussion Q{idx + 1}</span>
                                                                        <p className="text-xs font-bold text-slate-700 leading-tight">{item.question}</p>
                                                                        {item.audioUrl ? (
                                                                            <audio src={item.audioUrl} controls className="w-full rounded-lg mt-2" />
                                                                        ) : (
                                                                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest italic pt-1">No recording uploaded</p>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs font-bold text-slate-400 italic">No Part 3 questions configured.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })() : (() => {
                                            const writingAnswer = (currentSectionResult?.answers || []).find(ans => 
                                                ans.questionId === currentSectionData?._id?.toString() ||
                                                ans.questionId === currentSectionData?.id ||
                                                (ans.userAnswer && ans.userAnswer.includes("--- TASK 1"))
                                            );
                                            const { task1, task2 } = parseWritingSubmission(writingAnswer?.userAnswer);
                                            return (
                                                <div className="space-y-4">
                                                    {task1 && (
                                                        <div className="space-y-2">
                                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Task 1 Response</h4>
                                                            <div className="bg-base-50 p-6 rounded-2xl border border-base-200 shadow-inner leading-relaxed whitespace-pre-wrap font-medium text-slate-700 select-text">
                                                                {task1}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {task2 && (
                                                        <div className="space-y-2">
                                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Task 2 Response</h4>
                                                            <div className="bg-base-50 p-6 rounded-2xl border border-base-200 shadow-inner leading-relaxed whitespace-pre-wrap font-medium text-slate-700 select-text">
                                                                {task2}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {!task1 && !task2 && (
                                                        <div className="bg-base-100 p-8 rounded-[2rem] border border-base-300 shadow-inner min-h-[300px] leading-relaxed whitespace-pre-wrap font-medium text-base-content/80 select-text">
                                                            {writingAnswer?.userAnswer || "No response recorded."}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                        {!currentSectionResult.isGraded && (
                                            <div className="alert alert-info rounded-2xl shadow-sm border-none bg-primary/10 text-primary">
                                                <PiInfoFill className="w-5 h-5" />
                                                <span className="text-xs font-bold uppercase tracking-widest">Evaluation in progress. Band descriptors will be visible once graded.</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ReviewDetail;
