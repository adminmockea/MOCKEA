import { useState, useMemo } from "react";
import { PiPlus, PiTrash } from "react-icons/pi";
import { 
  QUESTION_TYPE_GROUPS, 
  PTE_QUESTION_TYPE_GROUPS,
  NEEDS_OPTIONS, 
  NEEDS_PAIRS, 
  NEEDS_IMAGE,
  PTE_NEEDS_AUDIO
} from "./questionFormConstants";
import { parsePastedOptionsText } from "../../../../hooks/useQuestionFormState.jsx";
import { cleanHiwWord, tokenizePassage } from "../../../../utils/hiwTokenizer.js";
import AudioUploader from "./AudioUploader";

export const QuestionTypeSelect = ({ value, onChange, examType }) => {
    const groups = examType === "PTE" ? PTE_QUESTION_TYPE_GROUPS : QUESTION_TYPE_GROUPS;
    return (
        <select
            className="select select-bordered w-full rounded-2xl text-sm bg-white text-slate-800 font-semibold"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            {groups.map((g) => (
                <optgroup key={g.group} label={`── ${g.group} ──`} className="text-slate-800 font-bold">
                    {g.types.map((t) => (
                        <option key={t.value} value={t.value} className="text-slate-800 font-medium">
                            {t.label}
                        </option>
                    ))}
                </optgroup>
            ))}
        </select>
    );
};

export const QuestionTypeExtras = ({ 
    q, 
    onUpdate, 
    onAddOption, 
    onUpdateOption, 
    onRemoveOption, 
    onSmartPasteOptions,
    onResetOptions,
    onAddPair, 
    onUpdatePair 
}) => {
    if (NEEDS_OPTIONS.includes(q.type)) {
        const handleOptionPaste = (e, i) => {
            const pastedText = e.clipboardData?.getData("text");
            if (!pastedText) return;
            const parsed = parsePastedOptionsText(pastedText);
            if (parsed && parsed.length > 1) {
                e.preventDefault();
                if (onSmartPasteOptions) {
                    onSmartPasteOptions(q.id, i, parsed);
                }
            }
        };

        return (
            <div className="bg-base-100 p-4 rounded-2xl space-y-3">
                {q.type === "matching-grid" && (
                    <div className="form-control w-full">
                        <label className="label py-1">
                            <span className="label-text font-black text-[10px] uppercase tracking-widest text-base-content/50">Info / Passage Text (Legend)</span>
                        </label>
                        <textarea
                            className="textarea textarea-bordered w-full rounded-xl text-xs font-semibold min-h-[5rem]"
                            placeholder="Enter paragraph descriptions or list options legend mapping (e.g. A. option A text, B. option B text...)"
                            value={q.info || ""}
                            onChange={(e) => onUpdate(q.id, "info", e.target.value)}
                        />
                    </div>
                )}
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-base-content/50">
                        Options <span className="normal-case font-normal text-slate-400 ml-1">(Paste multi-line options to auto-split A, B, C...)</span>
                    </span>
                    {onResetOptions && q.options?.length > 0 && (
                        <button
                            type="button"
                            onClick={() => onResetOptions(q.id)}
                            className="btn btn-ghost btn-xs text-slate-400 hover:text-error gap-1 text-[10px] px-1.5"
                            title="Clear all options"
                        >
                            <PiTrash className="w-3 h-3" /> Clear Options
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt, i) => (
                        <div key={i} className="flex items-center gap-1.5 w-full">
                            <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0">
                                {String.fromCharCode(65 + i)}
                            </span>
                            <input
                                type="text"
                                className="input input-bordered input-sm rounded-xl flex-1"
                                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                value={opt}
                                onChange={(e) => onUpdateOption(q.id, i, e.target.value)}
                                onPaste={(e) => handleOptionPaste(e, i)}
                            />
                            {q.options.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => onRemoveOption && onRemoveOption(q.id, i)}
                                    className="btn btn-ghost btn-xs btn-circle text-error flex-shrink-0"
                                    title="Delete Option"
                                >
                                    <PiTrash className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => onAddOption(q.id)}
                        className="btn btn-ghost btn-xs text-primary gap-1 self-center md:col-span-2 justify-start pl-1"
                    >
                        <PiPlus /> Add Option
                    </button>
                </div>
            </div>
        );
    }

    if (NEEDS_PAIRS.includes(q.type)) {
        return (
            <div className="bg-base-100 p-4 rounded-2xl space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-base-content/50">
                    Matching Pairs
                </span>
                {q.matchingPairs.map((pair, i) => (
                    <div key={i} className="grid grid-cols-2 gap-2">
                        <input
                            type="text"
                            className="input input-bordered input-sm rounded-xl"
                            placeholder={`Item ${i + 1}`}
                            value={pair.key}
                            onChange={(e) => onUpdatePair(q.id, i, "key", e.target.value)}
                        />
                        <input
                            type="text"
                            className="input input-bordered input-sm rounded-xl"
                            placeholder={`Match ${i + 1}`}
                            value={pair.value}
                            onChange={(e) => onUpdatePair(q.id, i, "value", e.target.value)}
                        />
                    </div>
                ))}
                <button
                    type="button"
                    onClick={() => onAddPair(q.id)}
                    className="btn btn-ghost btn-xs text-primary gap-1"
                >
                    <PiPlus /> Add Pair
                </button>
            </div>
        );
    }

    if (NEEDS_IMAGE.includes(q.type)) {
        return (
            <div className="form-control">
                <label className="label">
                    <span className="label-text font-semibold text-xs">
                        Map / Diagram / Describe Image URL (for this question)
                    </span>
                </label>
                <input
                    type="url"
                    className="input input-bordered rounded-2xl text-sm"
                    placeholder="https://domain.com/map.png"
                    value={q.imageUrl || ""}
                    onChange={(e) => onUpdate(q.id, "imageUrl", e.target.value)}
                />
            </div>
        );
    }

    // ── PTE Reading Dropdown Fill-in-the-Blanks ──
    if (q.type === "pte-reading-writing-fill-blanks") {
        const dropdownOptions = q.pteDropdownOptions || [["", "", "", ""]];
        
        const insertPteBlankInPassage = (blankNum) => {
            const tag = `[blank-${blankNum}]`;
            const ta = document.getElementById("pte-reading-passage-textarea") || document.getElementById("reading-passage-textarea-0");
            if (ta) {
                const start = ta.selectionStart;
                const end = ta.selectionEnd;
                const text = ta.value || "";
                const newText = text.substring(0, start) + tag + text.substring(end);
                
                const nativeTextareaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
                if (nativeTextareaValueSetter) {
                    nativeTextareaValueSetter.call(ta, newText);
                } else {
                    ta.value = newText;
                }
                ta.dispatchEvent(new Event("input", { bubbles: true }));
                
                setTimeout(() => {
                    ta.focus();
                    ta.selectionStart = ta.selectionEnd = start + tag.length;
                }, 0);
            }
        };
        
        const handlePteDropdownPaste = (e, blankIdx, optIdx) => {
            const pastedText = e.clipboardData?.getData("text");
            if (!pastedText) return;
            const parsed = parsePastedOptionsText(pastedText);
            if (parsed && parsed.length > 1) {
                e.preventDefault();
                const newArr = dropdownOptions.map((arr, aIdx) => {
                    if (aIdx !== blankIdx) return arr;
                    const updatedSub = [...(arr || ["", "", "", ""])];
                    for (let k = 0; k < Math.min(4, parsed.length); k++) {
                        updatedSub[k] = parsed[k];
                    }
                    return updatedSub;
                });
                onUpdate(q.id, "pteDropdownOptions", newArr);
            }
        };

        return (
            <div className="bg-slate-50 p-4 rounded-2xl space-y-4 border border-slate-200">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                        PTE Reading &amp; Writing Blanks (4 options per blank)
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                        💡 <strong>Smart Paste Enabled:</strong> Paste multi-line options or <em>"Option 1 / Option 2 / Option 3 / Option 4"</em> into any option box to auto-fill all 4 choices!
                    </span>
                </div>
                <div className="space-y-4">
                    {dropdownOptions.map((optionsArr, blankIdx) => (
                        <div key={blankIdx} className="space-y-2 border-b border-slate-200 pb-3 last:border-none">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 flex-wrap">
                                    <span>Blank #{blankIdx + 1} Options</span>
                                    <button
                                        type="button"
                                        onClick={() => insertPteBlankInPassage(blankIdx + 1)}
                                        className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white font-mono font-bold text-xs transition-all cursor-pointer flex items-center gap-1"
                                        title="Click to insert this blank tag at cursor in passage"
                                    >
                                        + Insert [blank-{blankIdx + 1}] in Passage
                                    </button>
                                </span>
                                {dropdownOptions.length > 1 && (
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-xs text-error"
                                        onClick={() => {
                                            const newArr = [...dropdownOptions];
                                            newArr.splice(blankIdx, 1);
                                            onUpdate(q.id, "pteDropdownOptions", newArr);
                                        }}
                                    >
                                        Remove Blank
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {(optionsArr || ["", "", "", ""]).map((opt, optIdx) => (
                                    <input
                                        key={optIdx}
                                        type="text"
                                        className="input input-bordered input-sm rounded-xl"
                                        placeholder={`Option ${optIdx + 1} ${optIdx === 0 ? "(Correct Answer)" : ""}`}
                                        value={opt}
                                        onPaste={(e) => handlePteDropdownPaste(e, blankIdx, optIdx)}
                                        onChange={(e) => {
                                            const newArr = dropdownOptions.map((arr, aIdx) => {
                                                if (aIdx !== blankIdx) return arr;
                                                const updatedSub = [...arr];
                                                updatedSub[optIdx] = e.target.value;
                                                return updatedSub;
                                            });
                                            onUpdate(q.id, "pteDropdownOptions", newArr);
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => {
                            onUpdate(q.id, "pteDropdownOptions", [...dropdownOptions, ["", "", "", ""]]);
                        }}
                        className="btn btn-ghost btn-xs text-primary gap-1 pl-0"
                    >
                        <PiPlus /> Add Dropdown Blank Options Pool
                    </button>
                </div>
            </div>
        );
    }

    // ── PTE Reading Re-order Paragraphs ──
    if (q.type === "pte-reorder-paragraphs") {
        const paragraphs = q.options || [""];
        const correctOrder = q.pteParagraphsOrder || [];

        const handlePteParagraphsPaste = (e, paraIdx) => {
            const pastedText = e.clipboardData?.getData("text");
            if (!pastedText) return;
            const parsed = parsePastedOptionsText(pastedText);
            if (parsed && parsed.length > 1) {
                e.preventDefault();
                onUpdate(q.id, "options", parsed);
            }
        };

        return (
            <div className="bg-slate-50 p-4 rounded-2xl space-y-4 border border-slate-200">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                        PTE Paragraphs Re-ordering
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                        💡 <strong>Smart Paste Enabled:</strong> Paste multi-line paragraphs into Paragraph A to auto-split them into A, B, C, D!
                    </span>
                </div>
                <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-700">Enter paragraphs to re-order:</span>
                    {paragraphs.map((para, paraIdx) => (
                        <div key={paraIdx} className="flex gap-2 items-start">
                            <span className="bg-slate-200 text-slate-700 w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs mt-2 flex-shrink-0">
                                {String.fromCharCode(65 + paraIdx)}
                            </span>
                            <textarea
                                className="textarea textarea-bordered textarea-sm rounded-xl flex-1 text-xs"
                                placeholder={`Paragraph Content ${String.fromCharCode(65 + paraIdx)}`}
                                value={para}
                                onPaste={(e) => handlePteParagraphsPaste(e, paraIdx)}
                                onChange={(e) => {
                                    onUpdateOption(q.id, paraIdx, e.target.value);
                                }}
                            />
                            {paragraphs.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => onRemoveOption(q.id, paraIdx)}
                                    className="btn btn-ghost btn-xs btn-circle text-error mt-2"
                                >
                                    <PiTrash />
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => onAddOption(q.id)}
                        className="btn btn-ghost btn-xs text-primary gap-1 pl-0"
                    >
                        <PiPlus /> Add Paragraph
                    </button>
                </div>
            </div>
        );
    }

    // ── PTE Highlight Incorrect Words Dedicated Builder ──
    if (q.type === "pte-highlight-incorrect-words") {
        return <PteHighlightIncorrectWordsFields q={q} onUpdate={onUpdate} />;
    }

    // ── PTE Listening & Speaking Audio Prompts & Transcripts ──
    if (["pte-repeat-sentence", "pte-retell-lecture", "pte-summarize-spoken-text", "pte-write-from-dictation", "pte-answer-short-question", "pte-select-missing-word"].includes(q.type)) {
        return (
            <div className="bg-slate-50 p-4 rounded-2xl space-y-4 border border-slate-200">
                <AudioUploader
                    label="PTE Listening Audio Clip"
                    audioUrl={q.audioUrl || ""}
                    onChange={(url) => onUpdate(q.id, "audioUrl", url)}
                    helperText="Upload the audio clip the candidate listens to (e.g. lecture recording, sentence, or dictation)"
                />

                <div className="form-control">
                    <label className="label py-1">
                        <span className="label-text font-semibold text-xs text-slate-700">
                            PTE Audio Reference Transcript (for Auto-grading &amp; Fallback)
                        </span>
                    </label>
                    <textarea
                        className="textarea textarea-bordered rounded-xl text-sm min-h-[4.5rem] bg-white font-medium"
                        placeholder="Enter the exact spoken text inside the audio clip..."
                        value={q.pteAudioTranscript || ""}
                        onChange={(e) => onUpdate(q.id, "pteAudioTranscript", e.target.value)}
                    />
                </div>
            </div>
        );
    }

    return null;
};

export const PteHighlightIncorrectWordsFields = ({ q, onUpdate }) => {
    const [inputValue, setInputValue] = useState("");
    const incorrectWords = Array.isArray(q.options) && q.options.length > 0
        ? q.options.filter(Boolean)
        : (typeof q.correctAnswer === "string" && q.correctAnswer.trim()
            ? q.correctAnswer.split(",").map(w => w.trim()).filter(Boolean)
            : []);

    const updateWords = (newWords) => {
        const cleaned = newWords.map(w => w.trim()).filter(Boolean);
        onUpdate(q.id, "options", cleaned);
        onUpdate(q.id, "correctAnswer", cleaned.join(", "));
    };

    const handleAddWord = (wordToAdd) => {
        const raw = wordToAdd || inputValue;
        if (!raw || !raw.trim()) return;
        const parts = raw.split(/[,;\n\r]+/).map(w => cleanHiwWord(w)).filter(Boolean);
        const existingSet = new Set(incorrectWords.map(w => cleanHiwWord(w)));
        const toAdd = parts.filter(p => !existingSet.has(p));
        if (toAdd.length > 0) {
            updateWords([...incorrectWords, ...toAdd]);
        }
        setInputValue("");
    };

    const handleRemoveWord = (indexToRemove) => {
        const newWords = incorrectWords.filter((_, idx) => idx !== indexToRemove);
        updateWords(newWords);
    };

    const handleClearAll = () => {
        updateWords([]);
    };

    const passageTokens = useMemo(() => {
        return tokenizePassage(q.question || "").filter(t => t.type === "word");
    }, [q.question]);

    return (
        <div className="bg-slate-50 p-5 rounded-3xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                    🎯 Highlight Incorrect Words (HIW) Configuration
                </span>
                <span className="badge badge-sm bg-primary/10 text-primary border-none font-bold text-[10px]">
                    +1 hit / -1 penalty / min 0
                </span>
            </div>

            {/* Audio Clip Uploader */}
            <AudioUploader
                label="PTE Listening Audio Clip"
                audioUrl={q.audioUrl || ""}
                onChange={(url) => onUpdate(q.id, "audioUrl", url)}
                helperText="Upload the audio recording the candidate listens to while reading the altered passage"
            />

            {/* Audio Spoken Transcript */}
            <div className="form-control">
                <label className="label py-1">
                    <span className="label-text font-semibold text-xs text-slate-700">
                        PTE Audio Reference Transcript (What the speaker actually says)
                    </span>
                </label>
                <textarea
                    className="textarea textarea-bordered rounded-xl text-sm min-h-[4.5rem] bg-white font-medium"
                    placeholder="Enter the exact spoken text inside the audio clip..."
                    value={q.pteAudioTranscript || ""}
                    onChange={(e) => onUpdate(q.id, "pteAudioTranscript", e.target.value)}
                />
                <label className="label py-0.5">
                    <span className="label-text-alt text-slate-400 text-[11px]">
                        The speaker says this; candidate spots the words that were altered in the passage.
                    </span>
                </label>
            </div>

            {/* Tag / Chips Manager */}
            <div className="space-y-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-700 block">
                            Target Incorrect Words Chips ({incorrectWords.length})
                        </span>
                        <span className="text-[11px] text-slate-400">
                            Deliberate errors in the transcription passage that candidates must highlight
                        </span>
                    </div>
                    {incorrectWords.length > 0 && (
                        <button
                            type="button"
                            onClick={handleClearAll}
                            className="btn btn-ghost btn-xs text-error gap-1 text-[11px]"
                        >
                            <PiTrash className="w-3.5 h-3.5" /> Clear All
                        </button>
                    )}
                </div>

                {/* Add chip input */}
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        className="input input-bordered input-sm rounded-xl flex-1 text-xs font-semibold"
                        placeholder="Type incorrect word and press Enter (or paste comma-separated)..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddWord();
                            }
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => handleAddWord()}
                        className="btn btn-primary btn-sm rounded-xl gap-1 text-xs font-bold px-4"
                    >
                        <PiPlus /> Add Word
                    </button>
                </div>

                {/* Chips Display */}
                <div className="flex flex-wrap gap-2 pt-1 min-h-[2.5rem] items-center">
                    {incorrectWords.length === 0 ? (
                        <span className="text-xs italic text-slate-400">
                            No incorrect words added yet. Type above or click words from the passage preview below.
                        </span>
                    ) : (
                        incorrectWords.map((word, idx) => (
                            <span
                                key={idx}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs shadow-xs"
                            >
                                <span>{word}</span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveWord(idx)}
                                    className="w-4 h-4 rounded-full hover:bg-amber-200 inline-flex items-center justify-center text-amber-800 text-xs font-black cursor-pointer"
                                    title="Remove this word"
                                >
                                    ×
                                </button>
                            </span>
                        ))
                    )}
                </div>

                {/* One-click word picker from passage */}
                {passageTokens.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 space-y-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                            💡 Quick Click-to-Flag from Passage:
                        </span>
                        <div className="flex flex-wrap gap-1 p-2.5 bg-slate-50 rounded-xl border border-slate-200 max-h-40 overflow-y-auto">
                            {passageTokens.map((tok) => {
                                const isFlagged = incorrectWords.some(w => cleanHiwWord(w) === tok.cleanWord);
                                return (
                                    <button
                                        key={tok.index}
                                        type="button"
                                        onClick={() => {
                                            if (isFlagged) {
                                                const newWords = incorrectWords.filter(w => cleanHiwWord(w) !== tok.cleanWord);
                                                updateWords(newWords);
                                            } else {
                                                handleAddWord(tok.word);
                                            }
                                        }}
                                        className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                            isFlagged
                                                ? "bg-amber-300 text-amber-950 font-bold shadow-xs scale-105"
                                                : "bg-white hover:bg-slate-200 text-slate-700 border border-slate-200"
                                        }`}
                                        title={isFlagged ? "Click to unflag" : "Click to flag as incorrect word"}
                                    >
                                        {tok.word}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
