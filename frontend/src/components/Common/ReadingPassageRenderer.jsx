import { useMemo, useRef, memo, useCallback } from "react";
import { convertMarkdownContentToHtml } from "../../utils/markdownUtils.js";

const DEBOUNCE_MS = 400;

/**
 * Splits HTML content into segments: plain HTML parts and inline placeholders.
 * Returns an array of { type: 'html'|'placeholder', content, matchKey }
 */
function splitIntoSegments(html) {
    const segments = [];
    const regex = /(?:___([\w-]+)___|\[blank-\$?(\d+)\])/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(html)) !== null) {
        if (match.index > lastIndex) {
            segments.push({ type: "html", content: html.slice(lastIndex, match.index) });
        }
        const matchKey = match[1] || match[2];
        segments.push({ type: "placeholder", matchKey });
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < html.length) {
        segments.push({ type: "html", content: html.slice(lastIndex) });
    }

    return segments;
}

/**
 * Finds a question by the placeholder matchKey, supporting id, global number, local index,
 * and numeric ID stripping (e.g. "r1" → "1", "$1" → "1").
 */
function findQuestion(questions, matchKey, offset) {
    if (!questions || !matchKey) return null;
    const cleanKey = matchKey.toString().replace(/^\$/, "").replace(/^blank-\$?/, "");
    return questions.find((item, idx) => {
        const questionNum = (offset || 0) + idx + 1;
        const localIndex = idx + 1;
        return (
            item.id === matchKey ||
            item.id === cleanKey ||
            questionNum.toString() === matchKey ||
            questionNum.toString() === cleanKey ||
            localIndex.toString() === matchKey ||
            localIndex.toString() === cleanKey
        );
    });
}

/** A stable drag-drop target rendered as a real React element (no innerHTML mutation). */
const DragDropTarget = memo(function DragDropTarget({
    qId, labelNum, value, onAnswerChange, submitted, isCorrect, correctAnswer,
    clickedOption, setClickedOption, lastInteractionRef,
}) {
    const isDebounced = useCallback((id) => {
        if (!id || !lastInteractionRef) return false;
        const now = Date.now();
        const last = lastInteractionRef.current.get(id) || 0;
        if (now - last < DEBOUNCE_MS) return true;
        lastInteractionRef.current.set(id, now);
        return false;
    }, [lastInteractionRef]);

    const handleDragOver = useCallback((e) => e.preventDefault(), []);

    const handleDrop = useCallback((e) => {
        if (submitted) return;
        e.preventDefault();
        const val = e.dataTransfer.getData("text/plain");
        if (val && !isDebounced(qId)) {
            onAnswerChange(qId, val);
        }
    }, [submitted, qId, onAnswerChange, isDebounced]);

    const handleClick = useCallback(() => {
        if (submitted) return;
        if (clickedOption && !isDebounced(qId)) {
            onAnswerChange(qId, clickedOption);
            if (setClickedOption) setClickedOption(null);
        }
    }, [submitted, clickedOption, qId, onAnswerChange, setClickedOption, isDebounced]);

    const handleClear = useCallback((e) => {
        e.stopPropagation();
        onAnswerChange(qId, "");
    }, [qId, onAnswerChange]);

    if (submitted) {
        const borderClass = isCorrect
            ? "border-emerald-400 bg-emerald-50/90 text-emerald-800 font-extrabold shadow-2xs"
            : "border-rose-400 bg-rose-50/90 text-rose-800 font-extrabold shadow-2xs";
        return (
            <span className="inline-flex items-center gap-1 mx-1 relative group align-middle my-0.5">
                <span className="inline-flex items-center justify-center h-5 px-1.5 rounded-md bg-slate-100 text-slate-500 font-black text-[10px] mr-0.5 select-none flex-shrink-0">
                    ({labelNum})
                </span>
                <span
                    className={`inline-flex items-center justify-center min-w-[120px] h-8 px-3 border-2 rounded-xl text-xs align-middle ${borderClass}`}
                    data-q-id={qId}
                    title={!isCorrect ? `Correct Answer: ${correctAnswer}` : ""}
                >
                    {value || "No Answer"}
                </span>
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] font-bold flex-shrink-0 shadow-2xs ${isCorrect ? "bg-emerald-500" : "bg-rose-500"}`}>
                    {isCorrect ? "✓" : "✗"}
                </span>
                {!isCorrect && (
                    <span className="inline-flex items-center text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-2.5 py-0.5 flex-shrink-0 align-middle shadow-2xs">
                        ✓ {correctAnswer}
                    </span>
                )}
            </span>
        );
    }

    return (
        <span className="inline-flex items-center mx-1 relative group align-middle my-0.5">
            <span className="inline-flex items-center justify-center h-5 px-1.5 rounded-md bg-primary/10 text-primary font-black text-[10px] mr-1 select-none flex-shrink-0 shadow-2xs">
                ({labelNum})
            </span>
            <span
                className={`inline-flex items-center justify-between min-w-[125px] h-8.5 px-3 border-2 rounded-xl text-xs font-bold align-middle cursor-pointer select-none transition-all duration-200 ${
                    value
                        ? "border-primary bg-white text-slate-900 font-extrabold shadow-xs hover:shadow-md hover:border-primary-hover"
                        : "border-dashed border-primary/35 bg-primary/5 hover:bg-primary/10 hover:border-primary text-primary/70 font-semibold shadow-2xs"
                }`}
                data-q-id={qId}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={handleClick}
            >
                {value ? (
                    <>
                        <span className="text-slate-900 font-extrabold font-sans truncate">{value}</span>
                        <button
                            type="button"
                            className="w-4 h-4 rounded-full bg-slate-100 hover:bg-rose-500 hover:text-white text-slate-400 text-xs font-black inline-flex items-center justify-center transition-all ml-1.5 flex-shrink-0"
                            onClick={handleClear}
                            title="Clear answer"
                        >
                            ×
                        </button>
                    </>
                ) : (
                    <span className="w-full text-center tracking-wide font-bold">Drop here</span>
                )}
            </span>
        </span>
    );
});

/** A stable inline text input rendered as a real React controlled element. */
const InlineTextInput = memo(function InlineTextInput({
    qId, labelNum, value, onAnswerChange, submitted, isCorrect, correctAnswer, isMockTest,
}) {
    const handleChange = useCallback((e) => {
        onAnswerChange(qId, e.target.value);
    }, [qId, onAnswerChange]);

    let inputClass = "inline-flex items-baseline gap-0.5 text-sm font-bold bg-transparent outline-none transition-all w-28 border-b-2 border-dashed focus:border-primary pb-0.5 text-center placeholder:text-slate-400 placeholder:font-normal placeholder:text-sm";

    if (submitted) {
        inputClass += isCorrect ? " text-emerald-700 border-emerald-400" : " text-red-700 border-red-400";
    } else {
        inputClass += " border-slate-400";
    }

    return (
        <span className="inline-flex items-center mx-1 relative group align-middle my-0.5">
            <span className="inline-flex items-center justify-center h-5 px-1.5 rounded-md bg-primary/10 text-primary font-black text-[10px] mr-1 select-none flex-shrink-0 shadow-2xs">
                ({labelNum})
            </span>
            <input
                type="text"
                value={value}
                onChange={handleChange}
                disabled={!isMockTest && submitted}
                placeholder="________"
                className={inputClass}
                title={(!isMockTest && submitted && !isCorrect) ? `Correct Answer: ${correctAnswer}` : ""}
            />
            {!isMockTest && submitted && (
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] font-bold ml-1 flex-shrink-0 ${isCorrect ? "bg-emerald-500" : "bg-red-500"}`}>
                    {isCorrect ? "✓" : "✗"}
                </span>
            )}
            {!isMockTest && submitted && !isCorrect && (
                <span className="inline-flex items-center text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-2.5 py-0.5 ml-1.5 flex-shrink-0 align-middle">
                    ✓ {correctAnswer}
                </span>
            )}
        </span>
    );
});

/**
 * Renders a single segment: either raw HTML or an interactive inline element.
 * Memoized so it only re-renders when its own props change.
 */
const Segment = memo(function Segment({
    segment, questions, answers, onAnswerChange, submitted, result, clickedOption, setClickedOption, offset, lastInteractionRef,
}) {
    if (segment.type === "html") {
        return <span dangerouslySetInnerHTML={{ __html: segment.content }} />;
    }

    // Placeholder segment — find the matching question
    const q = findQuestion(questions, segment.matchKey, offset);
    if (!q) return <span>{`___${segment.matchKey}___`}</span>;

    const qIndexInSet = questions.indexOf(q);
    const labelNum = (offset || 0) + qIndexInSet + 1;
    const qId = q.id;
    const evaluation = result?.evaluatedAnswers?.find((a) => a.questionId === qId);
    const isCorrect = evaluation?.isCorrect;
    const isMockTest = submitted === undefined;
    const value = answers[qId] || "";

    if (q.type === "drag-drop-completion" || q.type === "pte-reading-fill-blanks" || q.type === "pte-reading-fill-blanks-drag-drop") {
        return (
            <DragDropTarget
                qId={qId}
                labelNum={labelNum}
                value={value}
                onAnswerChange={onAnswerChange}
                submitted={submitted}
                isCorrect={isCorrect}
                correctAnswer={q.correctAnswer}
                isMockTest={isMockTest}
                clickedOption={clickedOption}
                setClickedOption={setClickedOption}
                lastInteractionRef={lastInteractionRef}
            />
        );
    }

    return (
        <InlineTextInput
            qId={qId}
            labelNum={labelNum}
            value={value}
            onAnswerChange={onAnswerChange}
            submitted={submitted}
            isCorrect={isCorrect}
            correctAnswer={q.correctAnswer}
            isMockTest={isMockTest}
        />
    );
});

/**
 * Renders Reading passage content, replacing ___N___ placeholders with real React
 * interactive elements (controlled inputs / drag-drop zones). Uses no dangerouslySetInnerHTML
 * for interactive parts, eliminating all DOM-mutation focus and scroll issues.
 */
const ReadingPassageRenderer = memo(function ReadingPassageRenderer({
    passageContent,
    questions,
    answers,
    onAnswerChange,
    submitted,
    result,
    clickedOption,
    setClickedOption,
    className = "text-lg leading-relaxed text-slate-600 text-justify select-text",
    offset = 0,
}) {
    const lastInteractionRef = useRef(new Map());

    // Convert markdown → HTML once (stable unless passage/questions/submit state change)
    const baseHtml = useMemo(() => {
        if (!passageContent) return "";
        return convertMarkdownContentToHtml(passageContent);
    }, [passageContent]);

    const hasInlinePlaceholders = useMemo(() => /(?:___[\w-]+___|\[blank-\$?(\d+)\])/.test(baseHtml), [baseHtml]);

    // Split HTML into segments only when passage content changes — NOT on answer changes
    const segments = useMemo(() => {
        if (!hasInlinePlaceholders) return null;
        return splitIntoSegments(baseHtml);
    }, [baseHtml, hasInlinePlaceholders]);

    // Stable key list so Segment children only remount when questions set changes
    const questionsKey = useMemo(() => questions.map((q) => q.id).join(","), [questions]);

    if (!hasInlinePlaceholders || !segments) {
        // Pure HTML passage — no interactive elements needed
        return <div className={className} dangerouslySetInnerHTML={{ __html: baseHtml }} />;
    }

    // Passage with interactive inline elements — render as real React tree
    return (
        <div className={className}>
            {segments.map((seg, i) => (
                <Segment
                    key={`${questionsKey}-${i}`}
                    segment={seg}
                    questions={questions}
                    answers={answers}
                    onAnswerChange={onAnswerChange}
                    submitted={submitted}
                    result={result}
                    clickedOption={clickedOption}
                    setClickedOption={setClickedOption}
                    offset={offset}
                    lastInteractionRef={lastInteractionRef}
                />
            ))}
        </div>
    );
});

export default ReadingPassageRenderer;
