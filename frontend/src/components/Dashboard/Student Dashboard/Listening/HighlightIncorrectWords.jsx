import { useMemo } from "react";
import { 
    PiCheckBold, 
    PiXBold, 
    PiWarningCircleBold, 
    PiCheckCircleFill, 
    PiXCircleFill,
    PiHeadphonesFill,
    PiInfoFill
} from "react-icons/pi";
import { cleanHiwWord, tokenizePassage } from "../../../../utils/hiwTokenizer.js";

/**
 * HighlightIncorrectWords
 * Interactive student component for PTE Academic "Highlight Incorrect Words" (HIW).
 * Renders transcription passage as clickable tokens with toggleable yellow highlights.
 * In review mode, displays green for hits, red for false alarms, and amber outline for missed words.
 */
export default function HighlightIncorrectWords({
    question,
    passageText: explicitPassageText,
    userAnswer,
    onAnswerChange,
    submitted = false,
    result = null,
    questionNumber = 1
}) {
    // 1. Resolve passage text
    const passage = explicitPassageText || question?.question || "";

    // 2. Tokenize the passage into clickable word tokens and layout whitespace
    const tokens = useMemo(() => {
        return tokenizePassage(passage);
    }, [passage]);

    // 3. Extract target incorrect words from options / correctAnswer
    const targetWords = useMemo(() => {
        if (Array.isArray(question?.options) && question.options.length > 0) {
            return question.options.map(w => {
                if (typeof w === "object" && w !== null) {
                    return (w.word || w.text || w.cleanWord || "").trim();
                }
                return String(w).trim();
            }).filter(Boolean);
        }
        if (typeof question?.correctAnswer === "string" && question.correctAnswer.trim()) {
            return question.correctAnswer.split(/[,\n\r;]+/).map(w => w.trim()).filter(Boolean);
        }
        return [];
    }, [question?.options, question?.correctAnswer]);

    // 4. Resolve candidate's selected tokens
    const selectedMap = useMemo(() => {
        const map = new Map();
        if (!userAnswer) return map;

        if (Array.isArray(userAnswer)) {
            userAnswer.forEach((item) => {
                if (typeof item === "object" && item !== null && item.index !== undefined) {
                    map.set(Number(item.index), item.word || "");
                } else if (typeof item === "number") {
                    map.set(item, "");
                } else if (typeof item === "string") {
                    const clean = cleanHiwWord(item);
                    const matchingToken = tokens.find(t => t.type === "word" && t.cleanWord === clean && !map.has(t.index));
                    if (matchingToken) {
                        map.set(matchingToken.index, item);
                    }
                }
            });
        } else if (typeof userAnswer === "string" && userAnswer.trim()) {
            const rawWords = userAnswer.split(/[,\n\r;]+/).map(w => w.trim()).filter(Boolean);
            rawWords.forEach((word) => {
                const clean = cleanHiwWord(word);
                const matchingToken = tokens.find(t => t.type === "word" && t.cleanWord === clean && !map.has(t.index));
                if (matchingToken) {
                    map.set(matchingToken.index, word);
                }
            });
        }

        return map;
    }, [userAnswer, tokens]);

    // 5. Per-token review status calculation handling duplicate words and target quotas
    const tokenReviewStatusMap = useMemo(() => {
        const statusMap = new Map();
        if (!submitted) return statusMap;

        // Build target frequency map
        const targetCounts = {};
        targetWords.forEach(w => {
            const c = cleanHiwWord(w);
            if (c) targetCounts[c] = (targetCounts[c] || 0) + 1;
        });

        // Pass 1: Categorize candidate selections as hit or false-alarm
        tokens.forEach(tok => {
            if (tok.type !== "word") return;
            if (selectedMap.has(tok.index)) {
                const c = tok.cleanWord;
                if (targetCounts[c] && targetCounts[c] > 0) {
                    statusMap.set(tok.index, "hit");
                    targetCounts[c]--;
                } else {
                    statusMap.set(tok.index, "false-alarm");
                }
            }
        });

        // Pass 2: Mark unselected deliberate targets as missed; remainder stay normal
        tokens.forEach(tok => {
            if (tok.type !== "word") return;
            if (!selectedMap.has(tok.index)) {
                const c = tok.cleanWord;
                if (targetCounts[c] && targetCounts[c] > 0) {
                    statusMap.set(tok.index, "missed");
                    targetCounts[c]--;
                } else {
                    statusMap.set(tok.index, "normal");
                }
            }
        });

        return statusMap;
    }, [submitted, targetWords, tokens, selectedMap]);

    // 5b. Handle word toggle
    const handleWordClick = (token) => {
        if (submitted) return;
        const newMap = new Map(selectedMap);
        if (newMap.has(token.index)) {
            newMap.delete(token.index);
        } else {
            newMap.set(token.index, token.word);
        }

        const serialized = Array.from(newMap.entries()).map(([index, word]) => ({
            index,
            word
        }));

        const qId = question?.id || question?._id;
        onAnswerChange(qId, serialized);
    };

    // 6. Evaluation details if submitted
    const evalDetail = useMemo(() => {
        if (!submitted || !result) return null;
        return result.evaluatedAnswers?.find(a => (
            a.questionId === question?.id || 
            a.questionId === question?._id ||
            (question?.id && a.questionId?.endsWith(`_${question.id}`)) ||
            (question?._id && a.questionId?.endsWith(`_${question._id}`)) ||
            result.evaluatedAnswers?.length === 1
        )) || null;
    }, [submitted, result, question?.id, question?._id]);

    const hits = evalDetail?.correctWords || [];
    const falseAlarms = evalDetail?.incorrectWords || [];
    const missed = evalDetail?.missedWords || [];
    const pointsEarned = evalDetail?.score ?? Math.max(0, hits.length - falseAlarms.length);
    const maxPoints = evalDetail?.maxScore ?? targetWords.length;

    return (
        <div className="space-y-6">
            {/* Header banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl">
                <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-amber-500 text-white font-black text-sm flex items-center justify-center shadow-xs">
                        {questionNumber}
                    </span>
                    <div>
                        <h4 className="font-black text-sm text-slate-800 tracking-tight">
                            Highlight Incorrect Words
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium">
                            {submitted 
                                ? "Review your answers against the spoken recording"
                                : "Click on the words that differ from what the speaker says in the audio"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {!submitted ? (
                        <div className="px-3 py-1 rounded-xl bg-amber-100 border border-amber-300/80 text-amber-900 font-bold text-xs flex items-center gap-1.5 shadow-2xs">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <span>{selectedMap.size} word{selectedMap.size === 1 ? "" : "s"} highlighted</span>
                        </div>
                    ) : (
                        <div className="px-3 py-1 rounded-xl bg-white border border-slate-200 font-black text-xs text-slate-700 shadow-2xs flex items-center gap-1.5">
                            <span>Score:</span>
                            <span className={pointsEarned > 0 ? "text-emerald-600 font-black" : "text-slate-600 font-black"}>
                                {pointsEarned} / {maxPoints} pts
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Interactive Passage Card */}
            <div className="p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
                <div className="text-base md:text-lg leading-loose font-serif text-slate-800 whitespace-pre-wrap select-none">
                    {tokens.map((token, tIdx) => {
                        if (token.type === "space") {
                            return <span key={`space-${tIdx}`}>{token.text}</span>;
                        }

                        if (token.type === "punct") {
                            return <span key={`punct-${tIdx}`} className="text-slate-600">{token.text}</span>;
                        }

                        // Word token
                        const isSelected = selectedMap.has(token.index);
                        const reviewStatus = tokenReviewStatusMap.get(token.index) || "normal";

                        let wordClass = "px-1.5 py-0.5 rounded-lg transition-all duration-150 inline-block ";
                        let icon = null;

                        if (submitted) {
                            if (reviewStatus === "hit") {
                                // Hit: correctly identified incorrect word (Green)
                                wordClass += "bg-emerald-500 text-white font-black border border-emerald-600 shadow-sm";
                                icon = <PiCheckBold className="text-xs shrink-0" />;
                            } else if (reviewStatus === "false-alarm") {
                                // False Alarm: student highlighted correct word (Red)
                                wordClass += "bg-red-500 text-white font-black border border-red-600 line-through decoration-white/80 shadow-sm";
                                icon = <PiXBold className="text-xs shrink-0" />;
                            } else if (reviewStatus === "missed") {
                                // Missed: deliberate error candidate overlooked (Amber dashed)
                                wordClass += "bg-amber-100/90 text-amber-950 font-black border-2 border-dashed border-amber-500 shadow-sm ring-2 ring-amber-400/20";
                                icon = <PiWarningCircleBold className="text-xs text-amber-700 shrink-0" />;
                            } else {
                                // Plain text
                                wordClass += "text-slate-700";
                            }
                        } else {
                            if (isSelected) {
                                // Active Highlight during test (Yellow)
                                wordClass += "bg-amber-300 text-amber-950 font-black border border-amber-400 shadow-xs scale-[1.03] cursor-pointer";
                            } else {
                                // Normal unhighlighted word
                                wordClass += "hover:bg-amber-100/70 hover:text-amber-900 cursor-pointer";
                            }
                        }

                        return (
                            <span key={`w-${token.index}`} className="inline">
                                {token.prefix && <span className="text-slate-600 font-sans">{token.prefix}</span>}
                                <span
                                    role="button"
                                    tabIndex={submitted ? -1 : 0}
                                    onClick={() => handleWordClick(token)}
                                    onKeyDown={(e) => {
                                        if (!submitted && (e.key === " " || e.key === "Enter")) {
                                            e.preventDefault();
                                            handleWordClick(token);
                                        }
                                    }}
                                    className={wordClass}
                                    title={
                                        submitted
                                            ? reviewStatus === "hit"
                                                ? "Correctly identified (+1 point)"
                                                : reviewStatus === "false-alarm"
                                                ? "False alarm (-1 penalty)"
                                                : reviewStatus === "missed"
                                                ? "Missed incorrect word"
                                                : ""
                                            : "Click to toggle highlight"
                                    }
                                >
                                    <span className="inline-flex items-center gap-1">
                                        {token.word}
                                        {icon}
                                    </span>
                                </span>
                                {token.suffix && <span className="text-slate-600 font-sans">{token.suffix}</span>}
                            </span>
                        );
                    })}
                </div>

                {/* Helper legend during practice mode */}
                {!submitted && (
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
                        <span className="flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 rounded bg-amber-300 border border-amber-400 inline-block" />
                            Click any word to highlight / unhighlight as incorrect.
                        </span>
                        <span className="italic">
                            PTE Negative Marking: +1 correct, -1 incorrect, minimum 0.
                        </span>
                    </div>
                )}
            </div>

            {/* Post-submission Review & Breakdown Details Card */}
            {submitted && (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl text-white ${
                                pointsEarned === maxPoints ? "bg-emerald-500" : pointsEarned > 0 ? "bg-amber-500" : "bg-red-500"
                            }`}>
                                {pointsEarned === maxPoints ? <PiCheckCircleFill /> : <PiInfoFill />}
                            </div>
                            <div>
                                <h5 className="font-black text-sm text-slate-800">Itemized Performance Breakdown</h5>
                                <p className="text-xs text-slate-500 font-medium">
                                    PTE Academic Scoring Applied (+1 for hits, -1 for false alarms, floor 0)
                                </p>
                            </div>
                        </div>

                        {/* Legend pills */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="px-2.5 py-1 rounded-xl bg-emerald-500 text-white font-bold inline-flex items-center gap-1">
                                <PiCheckBold /> Hit (+1)
                            </span>
                            <span className="px-2.5 py-1 rounded-xl bg-red-500 text-white font-bold inline-flex items-center gap-1 line-through">
                                <PiXBold /> False Alarm (-1)
                            </span>
                            <span className="px-2.5 py-1 rounded-xl bg-amber-100 border border-amber-400 text-amber-900 font-bold inline-flex items-center gap-1">
                                <PiWarningCircleBold /> Missed (0)
                            </span>
                        </div>
                    </div>

                    {/* Stats counters */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 text-center space-y-0.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Identified</span>
                            <span className="text-lg font-black text-emerald-600">{hits.length}</span>
                        </div>
                        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 text-center space-y-0.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">False Alarms</span>
                            <span className="text-lg font-black text-red-600">{falseAlarms.length}</span>
                        </div>
                        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 text-center space-y-0.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Missed</span>
                            <span className="text-lg font-black text-amber-600">{missed.length}</span>
                        </div>
                        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 text-center space-y-0.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Net Score</span>
                            <span className="text-lg font-black text-primary">{pointsEarned} / {maxPoints}</span>
                        </div>
                    </div>

                    {/* Audio Reference Transcript comparison */}
                    {question?.pteAudioTranscript && (
                        <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary">
                                <PiHeadphonesFill className="text-base" />
                                <span>Spoken Reference Transcript (What the speaker said):</span>
                            </div>
                            <p className="text-sm font-medium text-slate-700 italic leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                                “{question.pteAudioTranscript}”
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
