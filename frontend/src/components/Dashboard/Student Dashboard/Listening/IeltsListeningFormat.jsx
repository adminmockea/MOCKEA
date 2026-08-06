import { useMemo, useRef, useEffect, memo, useState } from "react";
import { motion } from "framer-motion";
import { collapseListeningExampleBlocks } from "../../../../utils/listeningPassage";

const EMPTY_ARRAY = [];
import {
    PiHeadphonesFill,
    PiCheckCircleFill,
    PiXCircleFill,
} from "react-icons/pi";

// ─── Constants ────────────────────────────────────────────────────────────────

const PART_META = {
    1: { label: "Part 1", context: "Social Conversation",    instruction: "Complete the form. Write ONE WORD AND/OR A NUMBER for each answer." },
    2: { label: "Part 2", context: "Social Monologue",       instruction: "Choose the correct letter A, B, or C." },
    3: { label: "Part 3", context: "Academic Discussion",    instruction: "Choose the correct letter, A, B or C. Write answers in boxes on your answer sheet." },
    4: { label: "Part 4", context: "Academic Lecture",       instruction: "Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer." },
};

// Which types render an inline fill-in input
const COMPLETION_TYPES = new Set([
    "short-answer",
    "sentence-completion",
    "summary-completion",
    "table-completion",
    "flow-chart-completion",
]);

const findQuestion = (questions, matchKey, offset = 0, header = null, placeholderIdx = 0, usedQuestionIds = null) => {
    if (!questions || !matchKey) return null;

    const fromQ = header?.fromQuestion ? Number(header.fromQuestion) : null;
    const toQ = header?.toQuestion ? Number(header.toQuestion) : null;

    if (fromQ !== null && toQ !== null && !isNaN(fromQ) && !isNaN(toQ)) {
        const groupQuestions = questions.filter((item, idx) => {
            const questionNum = offset + idx + 1;
            return questionNum >= fromQ && questionNum <= toQ;
        });

        if (groupQuestions.length > 0) {
            const exactMatch = groupQuestions.find((item) => {
                const qIdx = questions.indexOf(item);
                const questionNum = offset + qIdx + 1;
                return (
                    item.id === matchKey ||
                    (item.id && item.id.toLowerCase() === matchKey.toLowerCase()) ||
                    questionNum.toString() === matchKey
                );
            });
            if (exactMatch && (!usedQuestionIds || !usedQuestionIds.has(exactMatch.id))) {
                return exactMatch;
            }

            const unusedInGroup = groupQuestions.filter(item => !usedQuestionIds || !usedQuestionIds.has(item.id));
            if (unusedInGroup.length > 0) {
                return unusedInGroup[0];
            }
        }
    }

    const cleanKey = matchKey.toLowerCase().replace(/^[a-z]+/, "");
    return questions.find((item, idx) => {
        if (usedQuestionIds && usedQuestionIds.has(item.id)) return false;
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

/**
 * Renders the passage text and replaces ___[number]___ placeholders with React inline inputs.
 * If no placeholders are present, it renders the raw HTML.
 */
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

const InlinePassage = memo(({ passage, questions, answers, onAnswerChange, submitted, result, offset, header, clickedOption, setClickedOption, className = "leading-relaxed text-slate-700 whitespace-pre-line" }) => {
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

        const usedQuestionIds = new Set();
        let placeholderIdx = 0;

        return text.replace(/___([\w-]+)___/g, (match, matchKey) => {
            const currentIdx = placeholderIdx++;
            const q = findQuestion(questions, matchKey, offset, header, currentIdx, usedQuestionIds);
            if (!q) return match;
            usedQuestionIds.add(q.id);

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
                        ? `<span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold ml-1 flex-shrink-0">✓</span>`
                        : `<span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold ml-1 flex-shrink-0">✗</span>`;
                    let correctAnswerHtml = !isCorrect 
                        ? `<span class="inline-flex items-center text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-2.5 py-0.5 ml-1.5 flex-shrink-0 align-middle">✓ ${q.correctAnswer}</span>`
                        : "";
                    const titleAttr = !isCorrect ? `Correct Answer: ${q.correctAnswer}` : "";
                    
                    return `
                        <span class="inline-flex items-center gap-1 mx-1.5 relative group align-baseline">
                            <span class="text-red-600 font-black mr-0.5 flex-shrink-0">(${labelNum})</span>
                            <span 
                                class="inline-flex items-center justify-center min-w-[130px] h-9 px-3 border-2 rounded-xl text-xs font-black align-middle ${borderClass}"
                                data-q-id="${qId}"
                                title="${titleAttr}"
                            >
                                ${answers[qId] || "No Answer"}
                            </span>
                            ${badge}
                            ${correctAnswerHtml}
                        </span>
                    `.trim();
                } else {
                    return `
                        <span class="inline-flex items-baseline mx-0.5 relative group align-baseline">
                            <span class="text-red-600 font-black mr-0.5 flex-shrink-0">(${labelNum})</span>
                            <span 
                                class="drag-drop-target inline-flex items-center justify-center min-w-[130px] h-9 px-3 border-2 border-dashed border-slate-400 rounded-xl bg-slate-50/50 hover:bg-slate-100/50 hover:border-primary/40 cursor-pointer select-none transition-all text-xs font-bold text-slate-500 align-middle"
                                data-q-id="${qId}"
                                data-q-num="${labelNum}"
                            >
                                Drop here
                            </span>
                        </span>
                    `.trim();
                }
            }

            let inputClass = "inline-flex items-baseline gap-0.5 text-sm font-bold bg-transparent outline-none transition-all";
            if (submitted) {
                inputClass += isCorrect
                    ? " text-emerald-700"
                    : " text-red-700";
            }

            let badgeHtml = "";
            if (!isMockTest && submitted) {
                badgeHtml = isCorrect
                    ? `<span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold ml-1 flex-shrink-0">✓</span>`
                    : `<span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold ml-1 flex-shrink-0">✗</span>`;
            }

            let correctAnswerHtml = "";
            if (!isMockTest && submitted && !isCorrect) {
                correctAnswerHtml = `<span class="inline-flex items-center text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-2.5 py-0.5 ml-1.5 flex-shrink-0 align-middle">✓ ${q.correctAnswer}</span>`;
            }

            const titleAttr = (!isMockTest && submitted && !isCorrect) ? `Correct Answer: ${q.correctAnswer}` : "";

            return `
                <span class="inline-flex items-baseline mx-0.5 relative group align-baseline">
                    <span class="text-red-600 font-black mr-0.5 flex-shrink-0">(${labelNum})</span>
                    <input
                        type="text"
                        data-q-id="${qId}"
                        ${(!isMockTest && submitted) ? "disabled" : ""}
                        placeholder="________"
                        value=""
                        class="${inputClass} w-28 border-b-2 border-dashed border-slate-400 focus:border-primary pb-0.5 text-center placeholder:text-slate-400 placeholder:font-normal placeholder:text-sm ${submitted ? (isCorrect ? "border-emerald-400" : "border-red-400") : ""}"
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
                    target.innerHTML = `<span class="text-slate-800 font-black mx-1 font-sans">${value}</span> <button class="clear-btn text-slate-400 hover:text-error ml-1.5 text-sm font-black" data-q-id="${qId}">×</button>`;
                    target.classList.remove('border-dashed', 'text-slate-500', 'bg-slate-50/50');
                    target.classList.add('border-solid', 'border-primary', 'bg-white');
                } else {
                    target.innerHTML = `Drop here`;
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

/**
 * TableCompletionRenderer — renders a markdown table with inline input boxes
 * matching the classic IELTS table-completion format (dark headers, dotted-underline inputs).
 */
const TableCompletionRenderer = memo(({ passage, questions, answers, onAnswerChange, submitted, result, offset }) => {
    const containerRef = useRef(null);

    const parsedTable = useMemo(() => {
        if (!passage) return null;
        const lines = passage.split(/\r?\n/);
        const tableStartIndex = lines.findIndex(l => l.trim().startsWith("|"));
        if (tableStartIndex === -1) return null;

        const tableLines = [];
        let currentLine = "";

        for (let i = tableStartIndex; i < lines.length; i++) {
            const trimmed = lines[i].trim();

            if (trimmed.startsWith("|")) {
                if (currentLine) {
                    tableLines.push(currentLine);
                }
                currentLine = trimmed;
            } else if (currentLine) {
                if (trimmed === "" && currentLine.endsWith("|")) {
                    tableLines.push(currentLine);
                    currentLine = "";
                    break;
                }
                currentLine += "\n" + trimmed;
            } else {
                break;
            }
        }

        if (currentLine) {
            tableLines.push(currentLine);
        }

        if (tableLines.length === 0) return null;

        const rows = [];
        let isHeader = true;
        for (const line of tableLines) {
            let cellParts = line.split("|");
            if (cellParts[0].trim() === "") cellParts.shift();
            if (cellParts.length > 0 && cellParts[cellParts.length - 1].trim() === "") cellParts.pop();

            const cells = cellParts.map(c => c.trim());
            if (cells.length === 0) continue;

            if (cells.every(c => /^:?-+:?$/.test(c))) {
                isHeader = false;
                continue;
            }
            rows.push({ cells, isHeader });
            isHeader = false;
        }

        return rows.length >= 1 ? rows : null;
    }, [passage]);

    const processedRows = useMemo(() => {
        if (!parsedTable) return [];
        return parsedTable.map(row => ({
            ...row,
            cells: row.cells.map(cellText => {
                const formatInlineBullets = (str) => {
                    if (!str) return str;
                    let formatted = str.trim();
                    formatted = formatted.replace(/^[-*]\s+/, '<span class="text-primary font-black mr-1">•</span> ');
                    formatted = formatted.replace(/\s*[,;\n]\s*[-*]\s+/g, '<br/><span class="text-primary font-black mr-1">•</span> ');
                    formatted = formatted.replace(/\s+[-*]\s+/g, '<br/><span class="text-primary font-black mr-1">•</span> ');
                    return formatted;
                };

                const formattedText = formatInlineBullets(cellText);

                if (row.isHeader) {
                    return { dangerouslySetInnerHTML: { __html: formattedText }, text: formattedText };
                }

                // Replace placeholders
                const html = formattedText.replace(/___([\w-]+)___/g, (match, matchKey) => {
                    const q = questions.find((item, idx) => {
                        const questionNum = offset + idx + 1;
                        const localIndex = idx + 1;
                        return (
                            item.id === matchKey ||
                            questionNum.toString() === matchKey ||
                            localIndex.toString() === matchKey
                        );
                    });
                    if (!q) return match;

                    const qIndexInSet = questions.indexOf(q);
                    const labelNum = offset + qIndexInSet + 1;
                    const qId = q.id;
                    const evaluation = result?.evaluatedAnswers?.find((a) => a.questionId === qId);
                    const isCorrect = evaluation?.isCorrect;
                    const isMockTest = submitted === undefined;

                    let inputClass = "inline-flex bg-transparent border-b-2 border-dashed border-slate-400 focus:border-primary outline-none text-sm font-bold text-center pb-0.5 placeholder:text-slate-400 placeholder:font-normal placeholder:text-sm transition-colors";
                    if (submitted) {
                        inputClass += isCorrect
                            ? " text-emerald-700 border-emerald-400"
                            : " text-red-700 border-red-400";
                    }

                    let badgeHtml = "";
                    if (!isMockTest && submitted) {
                        badgeHtml = isCorrect
                            ? `<span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold ml-1 flex-shrink-0">✓</span>`
                            : `<span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold ml-1 flex-shrink-0">✗</span>`;
                    }

                    let correctAnswerHtml = "";
                    if (!isMockTest && submitted && !isCorrect) {
                        correctAnswerHtml = `<span class="inline-flex items-center text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-2.5 py-0.5 ml-1.5 flex-shrink-0 align-middle">✓ ${q.correctAnswer}</span>`;
                    }

                    return `
                        <span class="inline-flex items-baseline mx-0.5 relative group align-baseline">
                            <span class="text-red-600 font-black mr-0.5 flex-shrink-0">(${labelNum})</span>
                            <input
                                type="text"
                                data-q-id="${qId}"
                                ${submitted ? "disabled" : ""}
                                placeholder="________"
                                class="${inputClass} w-28"
                                value=""
                            />
                            ${badgeHtml}
                            ${correctAnswerHtml}
                        </span>
                    `.trim();
                });

                return { dangerouslySetInnerHTML: { __html: html || "&nbsp;" }, text: cellText };
            })
        }));
    }, [parsedTable, questions, offset, submitted, result]);

    useEffect(() => {
        if (!containerRef.current) return;
        const inputs = containerRef.current.querySelectorAll('input[data-q-id]');
        inputs.forEach(input => {
            const qId = input.getAttribute('data-q-id');
            const value = answers[qId] || "";
            if (input.value !== value) input.value = value;
        });
    }, [answers, processedRows]);

    const onAnswerChangeRef = useRef(onAnswerChange);
    useEffect(() => { onAnswerChangeRef.current = onAnswerChange; }, [onAnswerChange]);

    useEffect(() => {
        const handleInput = (e) => {
            if (e.target?.hasAttribute('data-q-id')) {
                onAnswerChangeRef.current(e.target.getAttribute('data-q-id'), e.target.value);
            }
        };
        const el = containerRef.current;
        if (el) el.addEventListener('input', handleInput);
        return () => { if (el) el.removeEventListener('input', handleInput); };
    }, []);

    if (!processedRows.length) return null;

    return (
        <div ref={containerRef} className="overflow-x-auto my-6">
            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr>
                        {processedRows[0]?.cells.map((cell, ci) => (
                            <th key={ci} className="bg-slate-900 text-white font-black text-xs uppercase tracking-widest px-5 py-3.5 text-left border border-slate-700">
                                <span dangerouslySetInnerHTML={cell.dangerouslySetInnerHTML} />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {processedRows.slice(1).map((row, ri) => (
                        <tr key={ri} className={ri % 2 === 1 ? "bg-slate-50/50" : "bg-white"}>
                            {row.cells.map((cell, ci) => (
                                <td key={ci} className="px-5 py-3 border border-slate-200 text-slate-700 leading-relaxed">
                                    <span dangerouslySetInnerHTML={cell.dangerouslySetInnerHTML} />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
});

// ─── Per-question-type renderers ─────────────────────────────────────────────

/** Inline text input — note/form/sentence/summary/table/flow-chart completion */
const CompletionRenderer = ({ q, idx, offset = 0, submitted, evaluation, answers, onAnswerChange }) => {
    const isCorrect = evaluation?.isCorrect;
    return (
        <div className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl border transition-all ${
            submitted
                ? isCorrect
                    ? "bg-emerald-50/60 border-emerald-300/40"
                    : "bg-red-50/60 border-red-300/40"
                : "bg-slate-50/60 border-slate-200 hover:border-primary/30"
        }`}>
            <div className="flex items-center gap-4 flex-1">
                {/* Number badge */}
                <div className="w-8 h-8 rounded-xl bg-white border border-base-300 shadow-sm flex items-center justify-center font-black text-xs text-slate-700 flex-shrink-0">
                    {offset + idx + 1}
                </div>

                {/* Label */}
                <span className="font-semibold text-sm text-slate-700 flex-1 leading-relaxed">
                    {q.question}
                </span>
            </div>

            {/* Input */}
            <div className="w-full sm:w-48 md:w-64 flex-shrink-0">
                <input
                    type="text"
                    disabled={submitted}
                    className={`w-full h-11 px-4 rounded-xl border text-sm font-bold bg-white transition-all outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-70 ${
                        submitted
                            ? isCorrect
                                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                                : "border-red-400 bg-red-50 text-red-700"
                            : "border-base-300 focus:border-primary"
                    }`}
                    placeholder={`Answer ${offset + idx + 1}`}
                    value={answers[q.id] || ""}
                    onChange={(e) => onAnswerChange(q.id, e.target.value)}
                />
            </div>

            {/* Result icons */}
            {submitted && (
                <div className="flex items-center gap-2 flex-shrink-0">
                    {isCorrect
                        ? <PiCheckCircleFill className="text-emerald-500 text-2xl flex-shrink-0" />
                        : <PiXCircleFill className="text-red-500 text-2xl flex-shrink-0" />
                    }
                    {!isCorrect && (
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1 flex-shrink-0">
                            ✓ {q.correctAnswer}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

/** Radio option cards — multiple choice / true-false / yes-no */
const McqRenderer = ({ q, idx, offset = 0, submitted, evaluation, answers, onAnswerChange }) => {
    const isCorrect = evaluation?.isCorrect;
    const selected  = answers[q.id] || "";
    const options   = q.options?.length ? q.options : ["True", "False", "Not Given"];

    return (
        <div className={`p-5 rounded-2xl border transition-all space-y-3 ${
            submitted
                ? isCorrect ? "bg-emerald-50/40 border-emerald-200" : "bg-red-50/40 border-red-200"
                : "bg-slate-50/40 border-slate-200"
        }`}>
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white border border-base-300 shadow-sm flex items-center justify-center font-black text-xs text-slate-700 flex-shrink-0">
                    {offset + idx + 1}
                </div>
                <span className="font-semibold text-sm text-slate-700">{q.question}</span>
                {submitted && (
                    isCorrect
                        ? <PiCheckCircleFill className="text-emerald-500 text-xl ml-auto flex-shrink-0" />
                        : <PiXCircleFill className="text-red-500 text-xl ml-auto flex-shrink-0" />
                )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-11">
                {options.map((opt, i) => {
                    const isSelected  = selected === opt;
                    const isAnswer    = submitted && opt === q.correctAnswer;
                    return (
                        <label
                            key={i}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all text-sm font-semibold ${
                                submitted
                                    ? isAnswer
                                        ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                                        : isSelected && !isAnswer
                                            ? "border-red-400 bg-red-50 text-red-600"
                                            : "border-base-200 text-base-content/40"
                                    : isSelected
                                        ? "border-primary bg-primary/5 text-primary"
                                        : "border-base-200 hover:border-primary/40"
                            }`}
                        >
                            <input
                                type="radio"
                                className="radio radio-primary radio-sm"
                                name={q.id}
                                value={opt}
                                checked={isSelected}
                                disabled={submitted}
                                onChange={() => onAnswerChange(q.id, opt)}
                            />
                            <span className="font-black text-[10px] w-5 text-center shrink-0">
                                {String.fromCharCode(65 + i)}
                            </span>
                            {opt}
                        </label>
                    );
                })}
            </div>
            {submitted && !isCorrect && (
                <p className="pl-11 text-[10px] font-black text-emerald-600">
                    ✓ Correct: {q.correctAnswer}
                </p>
            )}
        </div>
    );
};

/** Dropdown per item — matching / heading-matching */
const MatchingRenderer = ({ q, idx, offset = 0, submitted, evaluation, answers, onAnswerChange }) => {
    const isCorrect = evaluation?.isCorrect;
    const pairs     = q.matchingPairs || [];
    const options   = (q.options?.length && q.options.some(opt => opt && opt.trim() !== ""))
        ? q.options.filter(opt => opt && opt.trim() !== "")
        : pairs.map((p) => p.value).filter(Boolean);

    return (
        <div className={`p-5 rounded-2xl border transition-all space-y-3 ${
            submitted
                ? isCorrect ? "bg-emerald-50/40 border-emerald-200" : "bg-red-50/40 border-red-200"
                : "bg-slate-50/40 border-slate-200"
        }`}>
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white border border-base-300 shadow-sm flex items-center justify-center font-black text-xs text-slate-700 flex-shrink-0">
                    {offset + idx + 1}
                </div>
                <span className="font-semibold text-sm text-slate-700">{q.question}</span>
                {submitted && (
                    isCorrect
                        ? <PiCheckCircleFill className="text-emerald-500 text-xl ml-auto flex-shrink-0" />
                        : <PiXCircleFill className="text-red-500 text-xl ml-auto flex-shrink-0" />
                )}
            </div>
            <div className="pl-11 flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-600 flex-shrink-0">→</span>
                <select
                    disabled={submitted}
                    className={`select select-bordered select-sm rounded-xl flex-1 ${
                        submitted
                            ? isCorrect ? "border-emerald-400 bg-emerald-50" : "border-red-400 bg-red-50"
                            : ""
                    }`}
                    value={answers[q.id] || ""}
                    onChange={(e) => onAnswerChange(q.id, e.target.value)}
                >
                    <option value="">— Select a match —</option>
                    {options.map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                    ))}
                </select>
            </div>
            {submitted && !isCorrect && (
                <p className="pl-11 text-[10px] font-black text-emerald-600">
                    ✓ Correct: {q.correctAnswer}
                </p>
            )}
        </div>
    );
};

/** Image + numbered input — map/diagram labelling */
const MapLabellingRenderer = ({ q, idx, offset = 0, submitted, evaluation, answers, onAnswerChange }) => {
    const isCorrect = evaluation?.isCorrect;
    return (
        <div className={`p-5 rounded-2xl border transition-all space-y-4 ${
            submitted
                ? isCorrect ? "bg-emerald-50/40 border-emerald-200" : "bg-red-50/40 border-red-200"
                : "bg-slate-50/40 border-slate-200"
        }`}>
            {q.imageUrl && (
                <img
                    src={q.imageUrl}
                    alt={`Map / Diagram for Q${offset + idx + 1}`}
                    className="w-full max-h-64 object-contain rounded-2xl border border-base-200 bg-white"
                />
            )}
            <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-xl bg-white border border-base-300 shadow-sm flex items-center justify-center font-black text-xs text-slate-700 flex-shrink-0">
                    {offset + idx + 1}
                </div>
                <span className="font-semibold text-sm text-slate-700 flex-shrink-0 min-w-[120px]">
                    {q.question}
                </span>
                <input
                    type="text"
                    disabled={submitted}
                    className={`flex-1 h-10 px-4 rounded-xl border text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-70 ${
                        submitted
                            ? isCorrect ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-red-400 bg-red-50 text-red-700"
                            : "border-base-300"
                    }`}
                    placeholder={`Label ${offset + idx + 1}`}
                    value={answers[q.id] || ""}
                    onChange={(e) => onAnswerChange(q.id, e.target.value)}
                />
                {submitted && (
                    isCorrect
                        ? <PiCheckCircleFill className="text-emerald-500 text-2xl flex-shrink-0" />
                        : <PiXCircleFill className="text-red-500 text-2xl flex-shrink-0" />
                )}
            </div>
            {submitted && !isCorrect && (
                <p className="pl-11 text-[10px] font-black text-emerald-600">✓ {q.correctAnswer}</p>
            )}
        </div>
    );
};


/** Table/matrix grid per group of matching-grid items */
const MatchingGridRenderer = ({ questions, options, answers, onAnswerChange, submitted, result, offset, activeSet }) => {
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
                        <th className="p-3 font-black text-xs uppercase tracking-widest text-slate-500">
                            Question
                        </th>
                        {options.map((opt, i) => (
                            <th key={i} className="p-3 text-center font-black text-xs uppercase tracking-widest text-slate-600">
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
                                <td className="p-3 font-semibold text-slate-700 flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-white border border-base-300 shadow-sm flex items-center justify-center font-black text-[10px] text-slate-500 flex-shrink-0">
                                        {offset + idx + 1}
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
                                        <td key={optIdx} className="p-3 text-center align-middle">
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
        } else if (q.type === 'multiple-selection') {
            currentGridGroup = null;
            currentGroupId = null;
            currentOptionsKey = null;

            const cleanOptions = (q.options || []).filter(o => o && o.trim() !== "");
            const optionsKey = cleanOptions.join('|');
            const qText = q.question ? q.question.trim().toLowerCase() : "";

            if (currentSelectionGroup && currentSelectionQuestionText === qText && currentSelectionGroup.optionsKey === optionsKey) {
                currentSelectionGroup.questions.push(q);
            } else {
                currentSelectionGroup = {
                    type: 'multiple-selection-group',
                    options: cleanOptions,
                    optionsKey: optionsKey,
                    questions: [q]
                };
                currentSelectionQuestionText = qText;
                groups.push(currentSelectionGroup);
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

// ─── Question Router ─────────────────────────────────────────────────────────


const DragDropRenderer = ({ q, idx, offset = 0, submitted, evaluation, answers, onAnswerChange, clickedOption, setClickedOption }) => {
    const isCorrect = evaluation?.isCorrect;
    const value = answers[q.id] || "";

    return (
        <div className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            submitted
                ? isCorrect ? "bg-emerald-50/40 border-emerald-200" : "bg-red-50/40 border-red-200"
                : "bg-slate-50/40 border-slate-200"
        }`}>
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white border border-base-300 shadow-sm flex items-center justify-center font-black text-xs text-slate-700 flex-shrink-0">
                    {offset + idx + 1}
                </div>
                <span className="font-semibold text-sm text-slate-700">{q.question}</span>
            </div>

            <div className="flex items-center gap-2">
                <div
                    onDragOver={(e) => !submitted && e.preventDefault()}
                    onDrop={(e) => {
                        if (submitted) return;
                        e.preventDefault();
                        const val = e.dataTransfer.getData("text/plain");
                        if (val) onAnswerChange(q.id, val);
                    }}
                    onClick={() => {
                        if (submitted) return;
                        if (clickedOption) {
                            onAnswerChange(q.id, clickedOption);
                            if (setClickedOption) setClickedOption(null);
                        }
                    }}
                    className={`min-w-36 h-10 px-4 border-2 border-dashed rounded-xl flex items-center justify-center text-xs font-bold transition-all bg-white ${
                        submitted
                            ? isCorrect ? "border-emerald-400 text-emerald-700 bg-emerald-50" : "border-red-400 text-red-700 bg-red-50"
                            : value
                            ? "border-primary text-slate-800 font-black cursor-pointer"
                            : "border-slate-300 text-slate-400 hover:border-primary/40 cursor-pointer bg-slate-50/50"
                    }`}
                >
                    {value || "Drop answer here"}
                    {!submitted && value && (
                        <button 
                            type="button"
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
                {submitted && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {isCorrect
                            ? <PiCheckCircleFill className="text-emerald-500 text-2xl flex-shrink-0" />
                            : <PiXCircleFill className="text-red-500 text-2xl flex-shrink-0" />
                        }
                        {!isCorrect && (
                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1 flex-shrink-0">
                                ✓ {q.correctAnswer}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

/** Picks the right renderer based on question type */
const QuestionRenderer = ({ q, idx, offset = 0, submitted, result, answers, onAnswerChange, clickedOption, setClickedOption }) => {
    const evaluation = result?.evaluatedAnswers?.find((a) => a.questionId === q.id);
    const props      = { q, idx, offset, submitted, evaluation, answers, onAnswerChange };

    if (q.type === "drag-drop-completion" || (q.type === "flow-chart-completion" && q.options && q.options.filter(Boolean).length > 0)) {
        return <DragDropRenderer {...props} clickedOption={clickedOption} setClickedOption={setClickedOption} />;
    }
    if (COMPLETION_TYPES.has(q.type))           return <CompletionRenderer {...props} />;
    if (["multiple-choice","true-false","yes-no"].includes(q.type)) return <McqRenderer {...props} />;
    if (["matching","heading-matching","matching-grid"].includes(q.type)) return <MatchingRenderer {...props} />;
    if (["map-labelling","diagram-labelling"].includes(q.type))     return <MapLabellingRenderer {...props} />;

    // Fallback — same as completion
    return <CompletionRenderer {...props} />;
};

const ReferenceMediaRenderer = ({ url }) => {
    const [isImage, setIsImage] = useState(true);

    if (!url) return null;

    return (
        <div className="group relative rounded-3xl border border-base-200 bg-base-50 p-4 transition-all hover:shadow-md max-w-2xl mx-auto w-full space-y-3">
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

const GroupedQuestionsRenderer = ({ groupedItems, answers, onAnswerChange, submitted, result, offset, activeSet, clickedOption, setClickedOption }) => {
    return (
        <div className="space-y-8">
            {groupedItems.map((groupEntry, geIdx) => {
                const isGroup = groupEntry.type === 'group';
                
                const children = groupEntry.visuals.map((vg, vgIdx) => {
                    if (vg.type === 'matching-grid-group') {
                        return (
                            <motion.div
                                key={`grid-${geIdx}-${vgIdx}`}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: vgIdx * 0.04 }}
                            >
                                <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] space-y-4 shadow-xs">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 pl-2">
                                        Matching Table
                                    </h3>
                                    <MatchingGridRenderer
                                        questions={vg.questions}
                                        options={vg.options}
                                        answers={answers}
                                        onAnswerChange={onAnswerChange}
                                        submitted={submitted}
                                        result={result}
                                        offset={offset}
                                        activeSet={activeSet}
                                    />
                                </div>
                            </motion.div>
                        );
                    }

                    if (vg.type === 'multiple-selection-group') {
                        return (
                            <motion.div
                                key={`selection-${geIdx}-${vgIdx}`}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: vgIdx * 0.04 }}
                            >
                                <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] space-y-4 shadow-xs">
                                    <MultipleSelectionRenderer
                                        questions={vg.questions}
                                        options={vg.options}
                                        answers={answers}
                                        onAnswerChange={onAnswerChange}
                                        offset={offset}
                                        data={activeSet}
                                    />
                                </div>
                            </motion.div>
                        );
                    }

                    const q = vg.question;
                    const idx = activeSet.questions.findIndex(item => item.id === q.id);
                    const isFlowChart = q.type === 'flow-chart-completion';
                    const nextIsFlowChart = vgIdx < groupEntry.visuals.length - 1 && groupEntry.visuals[vgIdx + 1]?.question?.type === 'flow-chart-completion';

                    return (
                        <motion.div
                            key={q.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            className="w-full space-y-4"
                        >
                            <div className={isFlowChart ? "bg-slate-50/50 border border-dashed border-slate-300 p-6 rounded-3xl max-w-lg mx-auto text-center shadow-xs" : ""}>
                                <QuestionRenderer
                                    q={q}
                                    idx={idx}
                                    offset={offset}
                                    submitted={submitted}
                                    result={result}
                                    answers={answers}
                                    onAnswerChange={onAnswerChange}
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
                        </motion.div>
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
                                    passage={header.instructions}
                                    questions={activeSet.questions || EMPTY_ARRAY}
                                    answers={answers}
                                    onAnswerChange={onAnswerChange}
                                    submitted={submitted}
                                    result={result}
                                    offset={offset}
                                />
                            ) : hasInlineInstructions ? (
                                <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-xs">
                                    <InlinePassage
                                        passage={header.instructions}
                                        questions={activeSet.questions || EMPTY_ARRAY}
                                        answers={answers}
                                        onAnswerChange={onAnswerChange}
                                        submitted={submitted}
                                        result={result}
                                        offset={offset}
                                        header={header}
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
                    <div key={`ungrouped-${geIdx}`} className="space-y-6">
                        {children}
                    </div>
                );
            })}
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * IeltsListeningFormat
 *
 * Props:
 *   activeSet      — question set object (passage, questions, listeningPart, audioUrl)
 *   answers        — { [questionId]: string }
 *   onAnswerChange — (questionId, value) => void
 *   submitted      — boolean
 *   result         — evaluation result or null
 */
const IeltsListeningFormat = ({ activeSet, answers, onAnswerChange, submitted, result, clickedOption: propClickedOption, setClickedOption: propSetClickedOption }) => {
    const [localClickedOption, localSetClickedOption] = useState(null);
    const clickedOption = propClickedOption !== undefined ? propClickedOption : localClickedOption;
    const setClickedOption = propSetClickedOption !== undefined ? propSetClickedOption : localSetClickedOption;
    const part = activeSet?.listeningPart || 1;
    const meta = PART_META[part] || PART_META[1];
    const offset = (part - 1) * 10;

    const hasPassage = activeSet?.passage && activeSet.passage.trim() !== "";
    const dragDropQuestions = useMemo(() => activeSet?.questions?.filter(q => q.type === 'drag-drop-completion' || (q.type === 'flow-chart-completion' && q.options?.length > 0)) || [], [activeSet?.questions]);
    const sharedOptions = useMemo(() => {
        const first = dragDropQuestions[0];
        return first?.options?.filter(Boolean) || [];
    }, [dragDropQuestions]);

    const renderedInlineIds = useMemo(() => {
        const ids = new Set();
        
        const scanText = (text) => {
            if (!text) return;
            const matches = text.match(/___([\w-]+)___/g) || [];
            matches.forEach(m => {
                const matchKey = m.replace(/___/g, "").trim();
                const q = findQuestion(activeSet.questions, matchKey, offset);
                if (q) {
                    ids.add(q.id);
                }
            });
        };

        scanText(activeSet.passage);
        activeSet.questionGroups?.forEach(g => {
            if (g.instructions) {
                scanText(g.instructions);
            }
        });

        return ids;
    }, [activeSet.passage, activeSet.questions, offset, activeSet.questionGroups]);

    const remainingQuestions = useMemo(() => {
        return activeSet.questions?.filter(q => !renderedInlineIds.has(q.id)) || [];
    }, [activeSet.questions, renderedInlineIds]);

    if (!activeSet) return null;

    return (
        <div className="card bg-white p-10 rounded-[3.5rem] border border-base-300 shadow-sm relative overflow-hidden">
            {/* Watermark */}
            <div className="absolute top-0 right-0 p-10 text-primary/5 text-9xl pointer-events-none select-none">
                <PiHeadphonesFill />
            </div>

            <div className="relative z-10 space-y-8">

                {/* ── Part context banner ─────────────────────────────── */}
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <span className="badge badge-primary px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest">
                                {meta.label}
                            </span>
                            <h2 className="text-2xl font-black tracking-tighter text-slate-800">
                                {meta.context}
                            </h2>
                        </div>
                        <p className="text-xs font-semibold text-slate-400 pl-1">
                            Questions {offset + 1}–{offset + (activeSet.questions?.length || 0)}
                        </p>
                    </div>
                </div>

                {/* ── Instruction strip ───────────────────────────────── */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-600 leading-relaxed">
                    <span className="text-primary font-black uppercase tracking-widest text-[10px] block mb-1">
                        Instructions
                    </span>
                    {activeSet.instructions || meta.instruction}
                </div>

                {/* ── Reference Media ─────────────────────────────────── */}
                {(() => {
                    if (activeSet.images?.[0]) {
                        return <ReferenceMediaRenderer url={activeSet.images[0]} />;
                    }
                    return null;
                })()}

                {/* ── Passage (auto-detect table vs inline) ────────── */}
                {activeSet.passage && activeSet.passage.trim() !== "" && (() => {
                    const hasTableCompletion = /___([\w-]+)___/.test(activeSet.passage) && /^\|.+\|$/m.test(activeSet.passage);
                    return (
                        <div className="prose prose-sm max-w-none">
                            {hasTableCompletion ? (
                                <TableCompletionRenderer
                                    passage={activeSet.passage}
                                    questions={activeSet.questions || EMPTY_ARRAY}
                                    answers={answers}
                                    onAnswerChange={onAnswerChange}
                                    submitted={submitted}
                                    result={result}
                                    offset={offset}
                                />
                            ) : (
                                <InlinePassage
                                    passage={activeSet.passage}
                                    questions={activeSet.questions || EMPTY_ARRAY}
                                    answers={answers}
                                    onAnswerChange={onAnswerChange}
                                    submitted={submitted}
                                    result={result}
                                    offset={offset}
                                    clickedOption={clickedOption}
                                    setClickedOption={setClickedOption}
                                />
                            )}
                        </div>
                    );
                })()}




                {/* ── Questions ───────────────────────────────────────── */}
                {(() => {
                    const groups = groupQuestions(remainingQuestions, activeSet.questionGroups, offset, activeSet.questions);
                    const groupedItems = groupVisualsByQuestionGroups(groups, activeSet.questionGroups, offset, activeSet.questions);
                    if (groupedItems.length === 0) return null;
                    return (
                        <GroupedQuestionsRenderer
                            groupedItems={groupedItems}
                            answers={answers}
                            onAnswerChange={onAnswerChange}
                            submitted={submitted}
                            result={result}
                            offset={offset}
                            activeSet={activeSet}
                            clickedOption={clickedOption}
                            setClickedOption={setClickedOption}
                        />
                    );
                })()}




            </div>
        </div>
    );
};

export default IeltsListeningFormat;
