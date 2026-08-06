import { useMemo, useRef } from "react";
import { convertMarkdownContentToHtml } from "../../utils/markdownUtils.js";

const DEBOUNCE_MS = 500;

const formatInlineBullets = (str) => {
    if (!str) return str;
    let formatted = str.trim();
    // Replace markdown list item markers with nice inline bullet points
    formatted = formatted.replace(/^[-*]\s+/, '<span class="text-primary font-black mr-1.5 select-none">•</span> ');
    formatted = formatted.replace(/\s*[,;\n]\s*[-*]\s+/g, '<br/><span class="text-primary font-black mr-1.5 select-none">•</span> ');
    formatted = formatted.replace(/\s+[-*]\s+/g, '<br/><span class="text-primary font-black mr-1.5 select-none">•</span> ');
    return formatted;
};

const renderCellContent = (cellText, allQuestions, answers, onAnswerChange, submitted, result, clickedOption, setClickedOption, offset = 0, lastInteractionRef = null) => {
    if (!cellText) return "";

    const isDebounced = (qId) => {
        if (!qId || !lastInteractionRef) return false;
        const now = Date.now();
        const last = lastInteractionRef.current.get(qId) || 0;
        if (now - last < DEBOUNCE_MS) return true;
        lastInteractionRef.current.set(qId, now);
        return false;
    };
    
    // Split by placeholders like ___1___ or ___question-id___
    const parts = cellText.split(/(___[\w-]+___)/g);
    
    return parts.map((part, index) => {
        const match = part.match(/^___([\w-]+)___$/);
        if (!match) {
            const formatted = formatInlineBullets(part);
            return <span key={index} dangerouslySetInnerHTML={{ __html: formatted }} />;
        }

        const matchKey = match[1];
        // Find question in the entire test set that matches the placeholder index or ID
        const q = allQuestions.find((item, idx) => {
            const questionNum = (offset || 0) + idx + 1;
            const localIndex = idx + 1;
            return (
                item.id === matchKey ||
                questionNum.toString() === matchKey ||
                localIndex.toString() === matchKey
            );
        });

        if (!q) return <span key={index}>{part}</span>;

        const qIndexInSet = allQuestions.indexOf(q);
        const labelNum = (offset || 0) + qIndexInSet + 1;
        const qId = q.id;
        const evaluation = result?.evaluatedAnswers?.find((a) => a.questionId === qId);
        const isCorrect = evaluation?.isCorrect;
        const value = answers[qId] || "";

        // Check if it's a drag-and-drop / flowchart pool question
        const isDragDrop = q.type === 'drag-drop-completion' || (q.type === 'flow-chart-completion' && q.options && q.options.filter(Boolean).length > 0);

        if (isDragDrop) {
            return (
                <span 
                    key={index} 
                    className="inline-flex items-baseline mx-1 relative align-baseline"
                >
                    <span className="text-primary font-black mr-1 flex-shrink-0 text-xs select-none">({labelNum})</span>
                    <span
                        draggable={false}
                        onDragOver={(e) => !submitted && e.preventDefault()}
                        onDrop={(e) => {
                            if (submitted) return;
                            e.preventDefault();
                            const val = e.dataTransfer.getData("text/plain");
                            if (val) {
                                if (isDebounced(qId)) return;
                                onAnswerChange(qId, val);
                            }
                        }}
                        onClick={() => {
                            if (submitted) return;
                            if (clickedOption) {
                                if (isDebounced(qId)) return;
                                onAnswerChange(qId, clickedOption);
                                if (setClickedOption) setClickedOption(null);
                            }
                        }}
                        className={`min-w-28 h-8 px-2.5 border border-dashed rounded-lg inline-flex items-center justify-center text-xs font-bold transition-all bg-white cursor-pointer select-none align-middle ${
                            submitted
                                ? isCorrect 
                                    ? "border-success text-success bg-success/5" 
                                    : "border-error text-error bg-error/5"
                                : value
                                ? "border-primary text-slate-800 font-black shadow-xs"
                                : "border-slate-300 text-slate-400 hover:border-primary/40 bg-slate-50/50"
                        }`}
                    >
                        {value ? (value.includes(". ") ? value.split(". ").slice(1).join(". ") : value) : "___"}
                        {!submitted && value && (
                            <button 
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAnswerChange(qId, "");
                                }}
                                className="ml-1 text-slate-400 hover:text-error text-sm font-black transition-colors"
                            >
                                ×
                            </button>
                        )}
                    </span>
                    {submitted && (
                        isCorrect ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-black ml-1 select-none">✓</span>
                        ) : (
                            <>
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black ml-1 select-none">✗</span>
                                <span className="inline-flex items-center text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-0.5 ml-1.5 select-none">
                                    ✓ {q.correctAnswer}
                                </span>
                            </>
                        )
                    )}
                </span>
            );
        }

        // Standard text input
        return (
            <span key={index} className="inline-flex items-baseline mx-1 relative align-baseline">
                <span className="text-primary font-black mr-1 flex-shrink-0 text-xs select-none">({labelNum})</span>
                <input
                    type="text"
                    disabled={submitted}
                    value={value}
                    onChange={(e) => {
                        onAnswerChange(qId, e.target.value);
                    }}
                    placeholder="________"
                    className={`inline-flex bg-transparent border-b-2 border-dashed focus:border-primary outline-none text-xs font-bold text-center pb-0.5 placeholder:text-slate-400 transition-colors w-28 align-middle ${
                        submitted
                            ? isCorrect
                                ? "text-emerald-700 border-emerald-400 bg-emerald-50/20"
                                : "text-rose-700 border-rose-400 bg-rose-50/20"
                            : "border-slate-400"
                    }`}
                />
                {submitted && (
                    isCorrect ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-black ml-1 select-none">✓</span>
                    ) : (
                        <>
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black ml-1 select-none">✗</span>
                            <span className="inline-flex items-center text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-0.5 ml-1.5 select-none">
                                ✓ {q.correctAnswer}
                            </span>
                        </>
                    )
                )}
            </span>
        );
    });
};

export default function TableCompletionRenderer({ 
    instructions, 
    allQuestions, 
    answers, 
    onAnswerChange, 
    submitted, 
    result, 
    clickedOption, 
    setClickedOption,
    offset = 0
}) {
    const lastInteractionRef = useRef(new Map());

    const { introText, tableRows, outroText } = useMemo(() => {
        if (!instructions) return { introText: "", tableRows: null, outroText: "" };
        
        const lines = instructions.split(/\r?\n/);
        const tableStartIndex = lines.findIndex(l => l.trim().startsWith("|"));
        if (tableStartIndex === -1) {
            return { introText: instructions, tableRows: null, outroText: "" };
        }
        
        const introLines = lines.slice(0, tableStartIndex).join("\n").trim();
        
        const tableLines = [];
        let currentLine = "";
        let lastTableIndex = tableStartIndex;

        for (let i = tableStartIndex; i < lines.length; i++) {
            const trimmed = lines[i].trim();

            if (trimmed.startsWith("|")) {
                if (currentLine) {
                    tableLines.push(currentLine);
                }
                currentLine = trimmed;
                lastTableIndex = i;
            } else if (currentLine) {
                if (trimmed === "" && currentLine.endsWith("|")) {
                    tableLines.push(currentLine);
                    currentLine = "";
                    lastTableIndex = i - 1;
                    break;
                }
                currentLine += "\n" + trimmed;
                lastTableIndex = i;
            } else {
                break;
            }
        }

        if (currentLine) {
            tableLines.push(currentLine);
        }

        const outroLines = lines.slice(lastTableIndex + 1).join("\n").trim();
        
        // Parse table rows
        const rows = [];
        let isHeader = true;
        for (const line of tableLines) {
            let cellParts = line.split("|");
            if (cellParts[0].trim() === "") cellParts.shift();
            if (cellParts.length > 0 && cellParts[cellParts.length - 1].trim() === "") cellParts.pop();

            const cells = cellParts.map(c => c.trim());
            if (cells.length === 0) continue;

            // Check for markdown alignment row (e.g. |---| or |:---|:---:|)
            if (cells.every(c => /^:?-+:?$/.test(c))) {
                isHeader = false;
                continue;
            }
            rows.push({ cells, isHeader });
            isHeader = false;
        }
        
        return {
            introText: introLines,
            tableRows: rows.length >= 1 ? rows : null,
            outroText: outroLines
        };
    }, [instructions]);

    if (!tableRows) {
        // Fallback if no valid table structure exists in instructions
        return (
            <div className="bg-amber-50 border border-amber-200 px-5 py-3.5 rounded-2xl text-sm text-slate-700 leading-relaxed shadow-xs">
                {instructions}
            </div>
        );
    }

    return (
        <div className="space-y-4 w-full">
            {introText && (
                <div className="prose prose-sm max-w-none text-slate-600 mb-2 leading-relaxed font-semibold">
                    <div dangerouslySetInnerHTML={{ __html: convertMarkdownContentToHtml(introText) }} />
                </div>
            )}
            
            <div className="overflow-x-auto my-4 border border-slate-200 rounded-3xl bg-white shadow-xs">
                <table className="w-full border-collapse text-sm text-left">
                    <thead>
                        <tr className="bg-slate-900 border-b border-slate-700">
                            {tableRows[0]?.cells.map((cell, ci) => (
                                <th key={ci} className="text-white font-black text-xs uppercase tracking-widest px-5 py-4 border border-slate-700">
                                    {renderCellContent(cell, allQuestions, answers, onAnswerChange, submitted, result, clickedOption, setClickedOption, offset, lastInteractionRef)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {tableRows.slice(1).map((row, ri) => (
                            <tr key={ri} className={ri % 2 === 1 ? "bg-slate-50/50 hover:bg-slate-50 transition-colors" : "bg-white hover:bg-slate-50 transition-colors"}>
                                {row.cells.map((cell, ci) => (
                                    <td key={ci} className="px-5 py-4 border border-slate-200 text-slate-700 leading-relaxed font-medium align-top">
                                        {renderCellContent(cell, allQuestions, answers, onAnswerChange, submitted, result, clickedOption, setClickedOption, offset, lastInteractionRef)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {outroText && (
                <div className="prose prose-sm max-w-none text-slate-600 mt-2 leading-relaxed font-semibold">
                    <div dangerouslySetInnerHTML={{ __html: convertMarkdownContentToHtml(outroText) }} />
                </div>
            )}
        </div>
    );
}
