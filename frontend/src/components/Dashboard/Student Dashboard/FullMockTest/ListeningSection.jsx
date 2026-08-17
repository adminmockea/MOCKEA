import { useState, useRef, useMemo, useEffect, memo, useCallback } from "react";
import { PiEar, PiPlayCircle, PiPauseCircle } from "react-icons/pi";
import { collapseListeningExampleBlocks } from "../../../../utils/listeningPassage";
import { convertMarkdownContentToHtml } from "../../../../utils/markdownUtils";
import TableCompletionRenderer from "../../../Common/TableCompletionRenderer";

const EMPTY_ARRAY = [];

const findQuestion = (questions, matchKey, offset = 0) => {
    if (!questions || !matchKey) return null;
    const cleanKey = matchKey.toLowerCase().replace(/^[a-z]+/, "");
    return questions.find((item, idx) => {
        const questionNum = offset + idx + 1;
        const localIndex = idx + 1;
        const cleanId = (item.id || "").toLowerCase().replace(/^[a-z]+/, "");
        return (
            item.id === matchKey ||
            (item.id && item.id.toLowerCase() === matchKey.toLowerCase()) ||
            questionNum.toString() === matchKey ||
            questionNum.toString() === cleanKey ||
            localIndex.toString() === matchKey ||
            localIndex.toString() === cleanKey ||
            (cleanId && cleanId === cleanKey && cleanKey !== "")
        );
    });
};

const convertMarkdownTablesToHtml = (text) => {
    if (!text) return "";
    
    let hasWrapper = false;
    let wrapperClass = "ielts-listening-notes space-y-4";
    let cleanedText = text.trim();
    
    const wrapperMatch = cleanedText.match(/^<div class=["'](ielts-listening-notes[^"']*)["']>/);
    if (wrapperMatch && cleanedText.endsWith("</div>")) {
        hasWrapper = true;
        wrapperClass = wrapperMatch[1];
        cleanedText = cleanedText.substring(wrapperMatch[0].length, cleanedText.length - 6).trim();
    }

    const lines = cleanedText.split("\n");
    let inTable = false;
    let inList = false;
    let tableHtml = "";
    let listHtml = "";
    const result = [];
    let rowCount = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        const formatInlineBullets = (str) => {
            if (!str) return str;
            let formatted = str.trim();
            formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-slate-900">$1</strong>');
            formatted = formatted.replace(/<b>(.*?)<\/b>/gi, '<strong class="font-black text-slate-900">$1</strong>');
            formatted = formatted.replace(/<strong>(.*?)<\/strong>/gi, '<strong class="font-black text-slate-900">$1</strong>');
            formatted = formatted.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em class="italic">$1</em>');
            formatted = formatted.replace(/^[-*]\s+/, '<span class="text-primary font-black mr-1">•</span> ');
            formatted = formatted.replace(/\s*[,;\n]\s*[-*]\s+/g, '<br/><span class="text-primary font-black mr-1">•</span> ');
            formatted = formatted.replace(/\s+[-*]\s+/g, '<br/><span class="text-primary font-black mr-1">•</span> ');
            return formatted;
        };

        if (line.startsWith("|") && line.endsWith("|")) {
            if (inList) {
                inList = false;
                listHtml += '</ul>';
                result.push(listHtml);
                listHtml = "";
            }
            if (!inTable) {
                inTable = true;
                tableHtml = '<div class="overflow-x-auto my-6"><table class="table-auto w-full text-left border-collapse border border-slate-200 text-sm">';
                rowCount = 0;
            }
            const cells = line.split("|").slice(1, -1).map(c => c.trim());
            const isSeparator = cells.every(c => /^:?-+:?$/.test(c));
            if (isSeparator) {
                if (tableHtml.includes("<thead>") && !tableHtml.includes("</thead>")) {
                    tableHtml += "</thead><tbody class=\"text-slate-700\">";
                }
                continue;
            }
            if (!tableHtml.includes("<thead>")) {
                tableHtml += "<thead><tr class=\"bg-slate-100 text-slate-800 font-bold\">";
                cells.forEach(c => {
                    tableHtml += `<th class="border border-slate-200 p-3">${formatInlineBullets(c)}</th>`;
                });
                tableHtml += "</tr>";
            } else {
                const rowClass = rowCount % 2 === 1 ? "bg-slate-50/30" : "";
                tableHtml += `<tr class="${rowClass}">`;
                cells.forEach(c => {
                    tableHtml += `<td class="border border-slate-200 p-3">${formatInlineBullets(c)}</td>`;
                });
                tableHtml += "</tr>";
                rowCount++;
            }
        } else if (/^[-*+]\s+/.test(line)) {
            if (inTable) {
                inTable = false;
                if (tableHtml.includes("<tbody>") && !tableHtml.includes("</tbody>")) {
                    tableHtml += "</tbody>";
                } else if (tableHtml.includes("<thead>") && !tableHtml.includes("</thead>")) {
                    tableHtml += "</thead>";
                }
                tableHtml += "</table></div>";
                result.push(tableHtml);
                tableHtml = "";
            }
            if (!inList) {
                inList = true;
                listHtml = '<ul class="list-disc pl-5 my-4 space-y-1.5">';
            }
            const itemText = line.replace(/^[-*+]\s+/, "");
            listHtml += `<li>${formatInlineBullets(itemText)}</li>`;
        } else {
            if (inTable) {
                inTable = false;
                if (tableHtml.includes("<tbody>") && !tableHtml.includes("</tbody>")) {
                    tableHtml += "</tbody>";
                } else if (tableHtml.includes("<thead>") && !tableHtml.includes("</thead>")) {
                    tableHtml += "</thead>";
                }
                tableHtml += "</table></div>";
                result.push(tableHtml);
                tableHtml = "";
            }
            if (inList) {
                inList = false;
                listHtml += '</ul>';
                result.push(listHtml);
                listHtml = "";
            }
            result.push(formatInlineBullets(lines[i]));
        }
    }
    if (inTable) {
        if (tableHtml.includes("<tbody>") && !tableHtml.includes("</tbody>")) {
            tableHtml += "</tbody>";
        } else if (tableHtml.includes("<thead>") && !tableHtml.includes("</thead>")) {
            tableHtml += "</thead>";
        }
        tableHtml += "</table></div>";
        result.push(tableHtml);
    }
    if (inList) {
        listHtml += '</ul>';
        result.push(listHtml);
    }
    
    const finalHtml = result.join("\n");
    return hasWrapper ? `<div class="${wrapperClass}">${finalHtml}</div>` : finalHtml;
};

const formatFlowChartPassage = (text) => {
    if (!text || !text.includes("↓")) return text;

    // Check if it has HTML paragraphs
    if (/<p>/.test(text)) {
        // 1. Replace paragraphs containing only ↓
        let html = text.replace(/<p>\s*↓\s*<\/p>/g, '<div class="text-center text-slate-400 font-black text-xl my-2">↓</div>');
        
        // 2. Replace other paragraphs with cards
        html = html.replace(/<p>([\s\S]*?)<\/p>/g, (match, content) => {
            const trimmed = content.trim();
            if (trimmed === "" || trimmed.startsWith("<div") || trimmed === "↓") return match;
            return `<div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-center font-semibold text-slate-700 max-w-lg mx-auto my-3">${content}</div>`;
        });
        return html;
    } else {
        // Plain text split by newlines and arrows
        const segments = text.split(/\s*↓\s*/);
        const cards = segments.map((seg) => {
            const trimmed = seg.trim();
            if (!trimmed) return "";
            return `<div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-center font-semibold text-slate-700 max-w-lg mx-auto my-3">${trimmed}</div>`;
        }).filter(Boolean);
        
        return cards.join('\n<div class="text-center text-slate-400 font-black text-xl my-2">↓</div>\n');
    }
};

const DEBOUNCE_MS = 400;

const InlinePassage = memo(({ passage, questions, answers, onAnswerChange, submitted, result, offset, clickedOption, setClickedOption, className = "leading-relaxed text-slate-700 whitespace-pre-line" }) => {
    const containerRef = useRef(null);
    const lastInteractionRef = useRef(new Map());

    const questionsKey = useMemo(() => questions.map(q => q.id).join(","), [questions]);
    const resultKey = useMemo(() => result ? JSON.stringify(result.evaluatedAnswers?.map(a => `${a.questionId}:${a.isCorrect}`)) : "", [result]);

    const processedPassage = useMemo(() => {
        let text = convertMarkdownTablesToHtml(collapseListeningExampleBlocks(passage));
        text = formatFlowChartPassage(text);
        const hasInlinePlaceholders = /___([\w-]+)___/.test(text);
        if (!hasInlinePlaceholders) {
            return text;
        }

        return text.replace(/___([\w-]+)___/g, (match, matchKey) => {
            const q = findQuestion(questions, matchKey, offset);
            if (!q) return match;

            const qIndexInSet = questions.indexOf(q);
            const labelNum = offset + qIndexInSet + 1;

            const qId = q.id;
            const evaluation = result?.evaluatedAnswers?.find((a) => a.questionId === qId);
            const isCorrect = evaluation?.isCorrect;
            
            const isMockTest = submitted === undefined;
            const isDragDrop = q.type === 'drag-drop-completion' || (q.type === 'flow-chart-completion' && q.options && q.options.filter(Boolean).length > 0);

            if (isDragDrop) {
                if (submitted) {
                    let borderClass = isCorrect ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-red-400 bg-red-50 text-red-700";
                    let badge = isCorrect
                        ? `<span class="badge badge-success text-[10px] text-white font-bold p-1 rounded-full w-5 h-5 inline-flex items-center justify-center ml-1">✓</span>`
                        : `<span class="badge badge-error text-[10px] text-white font-bold p-1 rounded-full w-5 h-5 inline-flex items-center justify-center ml-1">✗</span>`;
                    let correctAnswerHtml = !isCorrect 
                        ? `<span class="inline-flex items-center text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-2.5 py-0.5 ml-1.5 flex-shrink-0 align-middle">✓ ${q.correctAnswer}</span>`
                        : "";
                    const titleAttr = !isCorrect ? `Correct Answer: ${q.correctAnswer}` : "";
                    
                    return `
                        <span class="inline-flex items-center gap-1 mx-1.5 relative group align-baseline">
                            <span 
                                class="inline-flex items-center justify-center min-w-[130px] h-9 px-3 border-2 rounded-xl text-xs font-black align-middle ${borderClass}"
                                data-q-id="${qId}"
                                title="${titleAttr}"
                            >
                                (${labelNum}) ${answers[qId] || "No Answer"}
                            </span>
                            ${badge}
                            ${correctAnswerHtml}
                        </span>
                    `.trim();
                } else {
                    return `
                        <span 
                            class="drag-drop-target inline-flex items-center justify-center min-w-[130px] h-9 px-3 border-2 border-dashed border-slate-400 rounded-xl bg-slate-50/50 hover:bg-slate-100/50 hover:border-primary/40 cursor-pointer select-none transition-all text-xs font-bold text-slate-500 align-middle mx-1.5"
                            data-q-id="${qId}"
                            data-q-num="${labelNum}"
                        >
                            (${labelNum}) Drop here
                        </span>
                    `.trim();
                }
            }

            let inputClass = "inline-block px-3 py-1 text-sm font-bold bg-white border-2 border-slate-400 rounded-lg outline-none transition-all text-center focus:ring-2 focus:ring-primary/20 w-36";
            if (isMockTest) {
                inputClass = "inline-block h-10 px-3 py-1 rounded-xl w-36 font-bold border border-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm text-center outline-none bg-white transition-all";
            } else if (submitted) {
                inputClass += isCorrect
                    ? " border-emerald-400 bg-emerald-50 text-emerald-700"
                    : " border-red-400 bg-red-50 text-red-700";
            } else {
                inputClass += " border-slate-400 focus:border-primary hover:border-slate-500";
            }

            let badgeHtml = "";
            if (!isMockTest && submitted) {
                badgeHtml = isCorrect
                    ? `<span class="badge badge-success text-[10px] text-white font-bold p-1 rounded-full w-5 h-5 inline-flex items-center justify-center ml-1">✓</span>`
                    : `<span class="badge badge-error text-[10px] text-white font-bold p-1 rounded-full w-5 h-5 inline-flex items-center justify-center ml-1">✗</span>`;
            }

            let correctAnswerHtml = "";
            if (!isMockTest && submitted && !isCorrect) {
                correctAnswerHtml = `<span class="inline-flex items-center text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-2.5 py-0.5 ml-1.5 flex-shrink-0 align-middle">✓ ${q.correctAnswer}</span>`;
            }

            const titleAttr = (!isMockTest && submitted && !isCorrect) ? `Correct Answer: ${q.correctAnswer}` : "";

            return `
                <span class="inline-flex items-center gap-1 mx-1.5 relative group align-baseline">
                    <input
                        type="text"
                        data-q-id="${qId}"
                        ${(!isMockTest && submitted) ? "disabled" : ""}
                        placeholder="(${labelNum})"
                        value=""
                        class="${inputClass}"
                        title="${titleAttr}"
                    />
                    ${badgeHtml}
                    ${correctAnswerHtml}
                </span>
            `.trim();
        });
    }, [passage, questionsKey, submitted, resultKey, offset]);

    useEffect(() => {
        if (containerRef.current) {
            const inputs = containerRef.current.querySelectorAll('input[data-q-id]');
            inputs.forEach(input => {
                const qId = input.getAttribute('data-q-id');
                const value = answers[qId] || "";
                if (input.value !== value) {
                    input.value = value;
                }
            });

            const targets = containerRef.current.querySelectorAll('.drag-drop-target[data-q-id]');
            targets.forEach(target => {
                const qId = target.getAttribute('data-q-id');
                const qNum = target.getAttribute('data-q-num');
                const value = answers[qId] || "";
                if (value) {
                    target.innerHTML = `(${qNum}) <span class="text-slate-800 font-black mx-1 font-sans">${value}</span> <button class="clear-btn text-slate-400 hover:text-error ml-1.5 text-sm font-black" data-q-id="${qId}">×</button>`;
                    target.classList.remove('border-dashed', 'text-slate-500', 'bg-slate-50/50');
                    target.classList.add('border-solid', 'border-primary', 'bg-white');
                } else {
                    target.innerHTML = `(${qNum}) Drop here`;
                    target.classList.remove('border-solid', 'border-primary', 'bg-white');
                    target.classList.add('border-dashed', 'text-slate-500', 'bg-slate-50/50');
                }
            });
        }
    }, [answers, processedPassage]);

    const onAnswerChangeRef = useRef(onAnswerChange);
    const clickedOptionRef = useRef(clickedOption);
    const setClickedOptionRef = useRef(setClickedOption);

    useEffect(() => {
        onAnswerChangeRef.current = onAnswerChange;
        clickedOptionRef.current = clickedOption;
        setClickedOptionRef.current = setClickedOption;
    }, [onAnswerChange, clickedOption, setClickedOption]);

    useEffect(() => {
        const isDebounced = (qId) => {
            if (!qId) return false;
            const now = Date.now();
            const last = lastInteractionRef.current.get(qId) || 0;
            if (now - last < DEBOUNCE_MS) return true;
            lastInteractionRef.current.set(qId, now);
            return false;
        };

        const flashDebounced = (el) => {
            if (!el) return;
            el.style.opacity = "0.5";
            el.style.pointerEvents = "none";
            setTimeout(() => {
                el.style.opacity = "";
                el.style.pointerEvents = "";
            }, DEBOUNCE_MS);
        };

        const handleInput = (e) => {
            if (e.target && e.target.hasAttribute('data-q-id') && e.target.tagName === 'INPUT') {
                const qId = e.target.getAttribute('data-q-id');
                onAnswerChangeRef.current(qId, e.target.value);
            }
        };

        const handleDragOver = (e) => {
            const target = e.target.closest('.drag-drop-target');
            if (target) {
                e.preventDefault();
            }
        };

        const handleDrop = (e) => {
            const target = e.target.closest('.drag-drop-target');
            if (target) {
                e.preventDefault();
                const qId = target.getAttribute('data-q-id');
                const val = e.dataTransfer.getData("text/plain");
                if (qId && val) {
                    if (isDebounced(qId)) {
                        flashDebounced(target);
                        return;
                    }
                    onAnswerChangeRef.current(qId, val);
                }
            }
        };

        const handleClick = (e) => {
            const clearBtn = e.target.closest('.clear-btn');
            if (clearBtn) {
                e.stopPropagation();
                e.preventDefault();
                const qId = clearBtn.getAttribute('data-q-id');
                if (qId) {
                    onAnswerChangeRef.current(qId, "");
                }
                return;
            }

            const target = e.target.closest('.drag-drop-target');
            if (target) {
                const qId = target.getAttribute('data-q-id');
                if (qId && clickedOptionRef.current) {
                    if (isDebounced(qId)) {
                        flashDebounced(target);
                        return;
                    }
                    onAnswerChangeRef.current(qId, clickedOptionRef.current);
                    if (setClickedOptionRef.current) {
                        setClickedOptionRef.current(null);
                    }
                }
            }
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('input', handleInput);
            container.addEventListener('dragover', handleDragOver);
            container.addEventListener('drop', handleDrop);
            container.addEventListener('click', handleClick);
        }
        return () => {
            if (container) {
                container.removeEventListener('input', handleInput);
                container.removeEventListener('dragover', handleDragOver);
                container.removeEventListener('drop', handleDrop);
                container.removeEventListener('click', handleClick);
            }
        };
    }, []);

    const dangerouslySetHtml = useMemo(() => ({ __html: processedPassage }), [processedPassage]);

    return (
        <div 
            ref={containerRef}
            className={className}
            dangerouslySetInnerHTML={dangerouslySetHtml}
        />
    );
});


const MatchingGridRenderer = ({ questions, options, answers, onAnswerChange, offset, data }) => {
    const firstQ = questions[0];
    const infoText = firstQ?.info;

    return (
        <div className="space-y-4 w-full">
            {infoText && (
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm text-slate-700 leading-relaxed shadow-xs whitespace-pre-line">
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
                                        {offset + idx + 1}
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

const ReferenceMediaRenderer = ({ url }) => {
    const [isImage, setIsImage] = useState(true);

    if (!url) return null;

    return (
        <div className="group relative rounded-3xl border border-base-200 bg-base-50 p-4 transition-all hover:shadow-md max-w-2xl mx-auto w-full space-y-3 mb-6">
            {isImage ? (
                <div className="relative overflow-hidden rounded-2xl bg-white">
                    <img 
                        src={url} 
                        alt="Reference Map or Diagram" 
                        className="w-full h-auto max-h-[420px] object-contain mx-auto" 
                        onError={() => setIsImage(false)}
                    />
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn btn-sm btn-circle btn-primary shadow-lg"
                            title="Open in new tab"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                        </a>
                    </div>
                </div>
            ) : (
                <div className="p-8 flex flex-col items-center justify-center text-center space-y-3 bg-white rounded-2xl">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5M7.5 12h9m-9 3.75h9m-9-7.5h3" />
                        </svg>
                    </div>
                    <div className="space-y-1">
                        <h4 className="font-bold text-slate-800">Reference Document / Map Link</h4>
                        <p className="text-xs text-slate-500 max-w-sm">Admins have provided a reference link for this section. Click below to open it.</p>
                    </div>
                </div>
            )}
            <div className="flex justify-center pt-1">
                <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                    {isImage ? "Open Map / Diagram in new window" : "Open Reference Link"}
                </a>
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

        const hasInlineInstructions = qg.instructions && /___([\w-]+)___/.test(qg.instructions) && !/^\|.+\|$/m.test(qg.instructions);
        const hasTable = qg.instructions && /___([\w-]+)___/.test(qg.instructions) && /^\|.+\|$/m.test(qg.instructions);
        if (groupVisuals.length > 0 || hasInlineInstructions || hasTable) {
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
        <div className="card p-5 rounded-[2rem] border border-slate-200 bg-slate-50/20 space-y-5 shadow-xs w-full">
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
                        return (
                            <div className="w-full overflow-hidden rounded-2xl border border-base-200 bg-white p-2">
                                <img 
                                    src={header.linkUrl} 
                                    alt="Group Diagram / Map" 
                                    className="w-full h-auto max-h-[420px] object-contain mx-auto rounded-xl" 
                                />
                            </div>
                        );
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

const QuestionRenderer = ({ q, idx, answers, onAnswerChange, clickedOption, setClickedOption }) => {
    const isDragDrop = q.type === 'drag-drop-completion' || (q.type === 'flow-chart-completion' && q.options && q.options.filter(Boolean).length > 0);
    return (
        <div className="space-y-4">
            {(q.type === 'true-false' || q.type === 'yes-no') && (
                <div className="flex flex-wrap gap-2">
                    {(q.options && q.options.filter(Boolean).length > 0
                        ? q.options.filter(Boolean)
                        : (q.type === 'yes-no' ? ['YES', 'NO', 'NOT GIVEN'] : ['TRUE', 'FALSE', 'NOT GIVEN'])
                    ).map((opt) => (
                        <button 
                            key={opt}
                            type="button"
                            onClick={() => onAnswerChange(q.id, opt)}
                            className={`px-5 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                                answers[q.id] === opt 
                                ? "bg-primary border-primary text-white" 
                                : "bg-white border-base-200 hover:border-primary/40"
                            }`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )}

            {q.type === 'multiple-choice' && (
                <div className="space-y-2">
                    {q.options?.filter(opt => opt && opt.trim() !== "").map((opt, optIdx) => (
                        <button 
                            key={optIdx}
                            type="button"
                            onClick={() => onAnswerChange(q.id, opt)}
                            className={`w-full text-left px-5 py-3 rounded-xl text-xs font-bold border-2 transition-all flex items-center gap-3 ${
                                answers[q.id] === opt 
                                ? "bg-primary border-primary text-white" 
                                : "bg-white border-base-200 hover:border-primary/40"
                            }`}
                        >
                            <span className="w-6 h-6 rounded bg-base-200 text-base-content/40 flex items-center justify-center font-bold">
                                {String.fromCharCode(65 + optIdx)}
                            </span>
                            {opt}
                        </button>
                    ))}
                </div>
            )}

            {(q.type === 'matching' || q.type === 'heading-matching') && (
                <div>
                    <select
                        value={answers[q.id] || ""}
                        onChange={(e) => onAnswerChange(q.id, e.target.value)}
                        className="select select-bordered border-slate-400 w-full rounded-xl font-bold bg-white focus:border-primary text-xs h-10 text-slate-800"
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
                    className="flex items-center justify-center gap-2"
                >
                    <span className="text-xs font-bold text-slate-500">Answer:</span>
                    <div 
                        onClick={() => {
                            if (clickedOption) {
                                onAnswerChange(q.id, clickedOption);
                                if (setClickedOption) setClickedOption(null);
                            }
                        }}
                        className={`min-w-36 h-10 px-4 border-2 border-dashed rounded-xl flex items-center justify-center text-xs font-bold transition-all cursor-pointer bg-slate-50/50 ${
                            answers[q.id]
                            ? "border-primary text-slate-800 bg-white font-black"
                            : "border-slate-300 text-slate-400 hover:border-primary/40"
                        }`}
                    >
                        {answers[q.id] || "Drop answer here"}
                        {answers[q.id] && (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAnswerChange(q.id, "");
                                }}
                                className="ml-2 text-slate-400 hover:text-error text-sm font-black"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>
            )}

            {!(q.type === 'true-false' || q.type === 'yes-no' || q.type === 'multiple-choice' || q.type === 'matching' || q.type === 'heading-matching' || isDragDrop) && (
                <div>
                    {q.type === "pte-summarize-spoken-text" ? (
                        <div className="relative">
                            <textarea 
                                className="textarea textarea-bordered border-slate-400 w-full rounded-2xl font-semibold bg-white focus:border-primary text-sm p-4 resize-y min-h-[120px] text-slate-800"
                                placeholder="Type your answer here..."
                                value={answers[q.id] || ""}
                                onChange={(e) => onAnswerChange(q.id, e.target.value)}
                            />
                            <div className="text-right text-xs font-bold text-slate-400 mt-1">
                                Word count: {(answers[q.id] || "").trim() ? (answers[q.id] || "").trim().split(/\s+/).filter(w => w.length > 0).length : 0}
                            </div>
                        </div>
                    ) : (
                        <input 
                            type="text" 
                            className="input input-bordered border-slate-400 w-full rounded-xl font-bold bg-white focus:border-primary text-xs h-10 text-slate-800"
                            placeholder="Type your answer here..."
                            value={answers[q.id] || ""}
                            onChange={(e) => onAnswerChange(q.id, e.target.value)}
                        />
                    )}
                </div>
            )}
        </div>
    );
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

const GroupedQuestionsRenderer = ({ groupedItems, answers, onAnswerChange, offset, data, clickedOption, setClickedOption }) => {
    return (
        <div className="space-y-8">
            {groupedItems.map((groupEntry, geIdx) => {
                const isGroup = groupEntry.type === 'group';
                
                const children = groupEntry.visuals.map((vg, vgIdx) => {
                    if (vg.type === 'matching-grid-group') {
                        return (
                            <div key={`grid-${geIdx}-${vgIdx}`} className="space-y-4 p-4 rounded-3xl border border-base-200 bg-white shadow-xs">
                                <h3 className="text-lg font-black uppercase tracking-widest text-primary/40 pl-2">
                                    Matching Grid
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
                    const idx = data.questions.findIndex(item => item.id === q.id);
                    const isFlowChart = q.type === 'flow-chart-completion';
                    const nextIsFlowChart = vgIdx < groupEntry.visuals.length - 1 && groupEntry.visuals[vgIdx + 1]?.question?.type === 'flow-chart-completion';

                    return (
                        <div key={q.id || idx} className="space-y-4">
                            <div 
                                id={`question-${idx}`}
                                className={`p-4 rounded-3xl border transition-all scroll-mt-6 ${
                                    isFlowChart 
                                    ? "bg-slate-50/50 border-dashed border-slate-300 max-w-lg mx-auto text-center shadow-xs" 
                                    : "border-base-200 bg-white hover:border-primary/30"
                                }`}
                            >
                                <div className={`flex items-start gap-4 ${isFlowChart ? "flex-col items-center text-center" : ""}`}>
                                    <div className="flex-none w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
                                        {offset + idx + 1}
                                    </div>
                                    <div className="flex-1 space-y-4 w-full">
                                        <p className="text-lg font-semibold leading-snug">
                                            {q.question}
                                        </p>
                                        
                                        <QuestionRenderer
                                            q={q}
                                            idx={idx}
                                            answers={answers}
                                            onAnswerChange={onAnswerChange}
                                            clickedOption={clickedOption}
                                            setClickedOption={setClickedOption}
                                        />
                                    </div>
                                </div>
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
                });

                if (isGroup) {
                    const header = groupEntry.header;
                    const hasTable = header?.instructions && 
                                     /___([\w-]+)___/.test(header.instructions) && 
                                     /^\|.+\|$/m.test(header.instructions);
                    const hasInlineInstructions = header?.instructions && 
                                                  /___([\w-]+)___/.test(header.instructions) && 
                                                  !/^\|.+\|$/m.test(header.instructions);

                    return (
                        <GroupedContainer key={`group-${geIdx}`} header={header} hideInstructions={hasTable || hasInlineInstructions}>
                            {hasTable ? (
                                <TableCompletionRenderer
                                    instructions={header.instructions}
                                    allQuestions={data?.questions || []}
                                    answers={answers}
                                    onAnswerChange={onAnswerChange}
                                    offset={offset}
                                    clickedOption={clickedOption}
                                    setClickedOption={setClickedOption}
                                />
                            ) : hasInlineInstructions ? (
                                <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-xs">
                                    <InlinePassage
                                        passage={header.instructions}
                                        questions={data?.questions || []}
                                        answers={answers}
                                        onAnswerChange={onAnswerChange}
                                        offset={offset}
                                        clickedOption={clickedOption}
                                        setClickedOption={setClickedOption}
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

const ListeningSection = ({ sections = [], answers, onAnswerChange, activePartIdx, setActivePartIdx }) => {
    const data = sections[activePartIdx];
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [clickedOption, setClickedOption] = useState(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const handleLocalAnswerChange = useCallback((qId, val) => {
        if (!data?._id) {
            onAnswerChange(qId, val);
            return;
        }
        onAnswerChange(`${data._id}_${qId}`, val);
    }, [data?._id, onAnswerChange]);

    const scopedAnswers = useMemo(() => {
        if (!data?._id) return answers;
        const scoped = {};
        data.questions?.forEach(q => {
            const scopedKey = `${data._id}_${q.id}`;
            scoped[q.id] = answers[scopedKey] !== undefined ? answers[scopedKey] : answers[q.id];
        });
        return scoped;
    }, [data?._id, data?.questions, answers]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.load();
            setIsPlaying(false);
            setCurrentTime(0);
        }
        const rightContainer = document.querySelector(".w-\\[70\\%\\]");
        if (rightContainer) rightContainer.scrollTop = 0;
    }, [activePartIdx]);

    const passage = data?.passage;
    const questions = data?.questions;
    const hasPassage = passage && passage.trim() !== "";

    const dragDropQuestions = useMemo(() => questions?.filter(q => q.type === 'drag-drop-completion' || (q.type === 'flow-chart-completion' && q.options?.length > 0)) || [], [questions]);
    const sharedOptions = useMemo(() => {
        const first = dragDropQuestions[0];
        return first?.options?.filter(Boolean) || [];
    }, [dragDropQuestions]);
    const offset = ((data?.listeningPart || (activePartIdx + 1)) - 1) * 10;

    const unifiedQuestions = useMemo(() => {
        const list = [];
        sections.forEach((sec, secIdx) => {
            const secOffset = ((sec?.listeningPart || (secIdx + 1)) - 1) * 10;
            const qs = sec.questions || [];
            qs.forEach((q, qIdx) => {
                list.push({
                    q,
                    secIdx,
                    localIdx: qIdx,
                    displayNum: secOffset + qIdx + 1
                });
            });
        });
        return list;
    }, [sections]);

    const renderedInlineIds = useMemo(() => {
        const ids = new Set();
        
        const scanText = (text) => {
            if (!text) return;
            const matches = text.match(/___([\w-]+)___/g) || [];
            matches.forEach(m => {
                const matchKey = m.replace(/___/g, "").trim();
                const q = findQuestion(questions, matchKey, offset);
                if (q) {
                    ids.add(q.id);
                }
            });
        };

        scanText(passage);
        data?.questionGroups?.forEach(g => {
            if (g.instructions) {
                scanText(g.instructions);
            }
        });

        return ids;
    }, [passage, questions, offset, data?.questionGroups]);

    const remainingQuestions = useMemo(() => {
        return questions?.filter(q => !renderedInlineIds.has(q.id)) || [];
    }, [questions, renderedInlineIds]);



    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleProgressChange = (e) => {
        const newTime = parseFloat(e.target.value);
        setCurrentTime(newTime);
        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
        }
    };

    const formatAudioTime = (time) => {
        if (isNaN(time)) return "0:00";
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const togglePlay = () => {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="flex h-full overflow-hidden bg-white">
            {/* Left Pane: Audio Control & Instructions with Sticky Palette */}
            <div className="w-[38%] flex flex-col h-full border-r border-base-200 bg-base-50/10">
                <div className="flex-1 overflow-y-auto p-12 space-y-8">
                    <div className="max-w-2xl mx-auto space-y-6">
                        <header className="space-y-2">
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">Listening Section</p>
                            <h1 className="text-3xl font-extrabold tracking-tight">Audio — Section {data?.title || "1"}</h1>
                        </header>

                        {sections.length > 1 && (
                            <div className="flex border-b border-slate-200 gap-2 overflow-x-auto select-none pb-2">
                                {sections.map((sec, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setActivePartIdx(idx)}
                                        className={`px-5 py-2.5 font-black text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                                            activePartIdx === idx
                                                ? "border-primary text-primary bg-primary/5 rounded-t-xl"
                                                : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-t-xl"
                                        }`}
                                    >
                                        Part {idx + 1}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Audio control card */}
                        <div className="p-8 rounded-[2.5rem] bg-white border border-base-200 shadow-sm space-y-6">
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={togglePlay}
                                    disabled={isPlaying}
                                    className="btn btn-primary btn-circle btn-lg shadow-lg shadow-primary/20 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isPlaying ? <PiPauseCircle className="w-8 h-8" /> : <PiPlayCircle className="w-8 h-8" />}
                                </button>
                                <div className="flex-1 min-w-0">
                                    <h2 className="font-bold text-lg">Control Board</h2>
                                    <p className="text-xs text-base-content/50 font-medium">Click play to begin. You will hear the recording only ONCE.</p>
                                </div>
                            </div>

                            {/* Progress Bar & Time */}
                            <div className="space-y-2 pt-2">
                                <input
                                    type="range"
                                    min="0"
                                    max={duration || 100}
                                    value={currentTime}
                                    onChange={handleProgressChange}
                                    disabled={true}
                                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-not-allowed accent-primary"
                                />
                                <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-500">
                                    <span>{formatAudioTime(currentTime)}</span>
                                    <span>{formatAudioTime(duration)}</span>
                                </div>
                            </div>
                            
                            <audio 
                                ref={audioRef} 
                                src={data?.audioUrl} 
                                onTimeUpdate={handleTimeUpdate}
                                onLoadedMetadata={handleLoadedMetadata}
                                onEnded={() => setIsPlaying(false)}
                                className="hidden" 
                            />
                        </div>

                        {/* Instructions */}
                        <div className="p-6 rounded-2xl bg-white border border-base-200 shadow-sm mb-6">
                            <h3 className="font-bold mb-2">Instructions:</h3>
                            <p className="text-sm text-base-content/60 leading-relaxed">
                                Listen to the audio and answer the questions on the right. For gap-fill questions, use NO MORE THAN TWO WORDS and/or a number.
                            </p>
                        </div>

                        {/* Map Diagram / Reference Media */}
                        {(() => {
                            if (data?.images?.[0]) {
                                return <ReferenceMediaRenderer url={data.images[0]} />;
                            }
                            return null;
                        })()}
                    </div>
                </div>

            </div>

            {/* Right Pane: Questions */}
            <div className="w-[70%] overflow-y-auto p-12 bg-base-100">
                <div className="max-w-3xl mx-auto flex gap-8 items-start">
                    <div className="flex-1 min-w-0 space-y-12">
                        <header className="space-y-4">
                            <div className="flex items-center gap-3 text-primary">
                                <PiEar className="w-8 h-8" />
                                <h2 className="text-2xl font-black uppercase tracking-widest">Questions {offset + 1}–{offset + (data?.questions?.length || 10)}</h2>
                            </div>
                        </header>

                        {/* ── Passage (HTML with Inline Inputs) ── */}
                        {hasPassage && (
                            <div className="p-8 rounded-[2rem] border border-base-200 bg-white shadow-xs prose prose-sm max-w-none">
                                <InlinePassage
                                    passage={data.passage}
                                    questions={data.questions || EMPTY_ARRAY}
                                    answers={scopedAnswers}
                                    onAnswerChange={handleLocalAnswerChange}
                                    offset={offset}
                                    clickedOption={clickedOption}
                                    setClickedOption={setClickedOption}
                                />
                            </div>
                        )}

                        {(() => {
                            const groups = groupQuestions(remainingQuestions, data.questionGroups, offset, data.questions);
                            const groupedItems = groupVisualsByQuestionGroups(groups, data.questionGroups, offset, data.questions);
                            if (groupedItems.length === 0) return null;
                            return (
                                <GroupedQuestionsRenderer
                                    groupedItems={groupedItems}
                                    answers={scopedAnswers}
                                    onAnswerChange={handleLocalAnswerChange}
                                    offset={offset}
                                    data={data}
                                    clickedOption={clickedOption}
                                    setClickedOption={setClickedOption}
                                />
                            );
                        })()}

                        {activePartIdx < sections.length - 1 && (
                            <div className="flex justify-end pt-8">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActivePartIdx(activePartIdx + 1);
                                    }}
                                    className="btn btn-primary rounded-2xl px-8 h-12 text-xs font-black uppercase tracking-widest shadow-md shadow-primary/10 flex items-center gap-2 hover:scale-105 transition-transform"
                                >
                                    Go to Part {activePartIdx + 2}
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Options pool placed as a sticky right sidebar next to the flowchart/questions */}
                    {sharedOptions.length > 0 && (
                        <div className="w-56 shrink-0 sticky top-0 bg-slate-50 border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-xs">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">
                                Answers Bank
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold leading-snug text-center">
                                Drag or click to place.
                            </p>
                            <div className="flex flex-col gap-2">
                                {sharedOptions.map((opt, i) => {
                                    const letter = String.fromCharCode(65 + i);
                                    const label = `${letter}. ${opt}`;
                                    const isPlaced = false;
                                    const isSelected = clickedOption === label;
                                    return (
                                        <div
                                            key={i}
                                            draggable={!isPlaced}
                                            onDragStart={(e) => {
                                                e.dataTransfer.setData("text/plain", label);
                                            }}
                                            onClick={() => {
                                                if (!isPlaced) {
                                                    setClickedOption(isSelected ? null : label);
                                                }
                                            }}
                                            className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all select-none text-center ${
                                                isPlaced
                                                    ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50"
                                                    : isSelected
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
                    )}
                </div>
            </div>
        </div>
    );
};

export default ListeningSection;
