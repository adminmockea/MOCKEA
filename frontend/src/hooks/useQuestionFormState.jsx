import { useState, useCallback } from "react";
import { makeQuestion, initialForm } from "../components/Dashboard/Admin Dashboard/QuestionForm/questionFormConstants";
import { stripListeningExampleBlocks } from "../utils/listeningPassage";

// Parser logic to reverse-engineer database HTML wrappers back into editable form state
export function parseQuestionToState(fetchedQuestion) {
    if (!fetchedQuestion) return null;
    
    const testType = fetchedQuestion.testType || "listening";
    const idPrefix = testType === "listening" ? "l" : testType === "reading" ? "r" : "q";
    
    let task1Prompt = "";
    let task1Image = "";
    let task2Prompt = "";
    
    if (fetchedQuestion.testType === "writing" && fetchedQuestion.passage) {
        const task1Match = fetchedQuestion.passage.match(/Task 1: Academic Report.*?<\/h3>\s*<p.*?>(.*?)<\/p>/s);
        const task2Match = fetchedQuestion.passage.match(/Task 2: Opinion Essay.*?<\/h3>\s*<p.*?>(.*?)<\/p>/s);
        
        task1Prompt = task1Match ? task1Match[1].replace(/<br\s*\/?>/g, "\n") : "";
        task2Prompt = task2Match ? task2Match[1].replace(/<br\s*\/?>/g, "\n") : "";
        task1Image = fetchedQuestion.images?.[0] || "";
    }

    let exampleQuestion = "";
    let exampleAnswer = "";
    let cleanPassage = fetchedQuestion.passage || "";

    if (fetchedQuestion.testType === "listening" && fetchedQuestion.passage) {
        let tempPassage = fetchedQuestion.passage;

        const exampleBlockMatch = tempPassage.match(/<div class=["']mb-6[\s\S]*?<\/div>\s*<\/div>/);
        if (exampleBlockMatch) {
            const exampleBlockHtml = exampleBlockMatch[0];
            const eqMatch = exampleBlockHtml.match(/<span>([^<]+)<\/span>\s*<span[^>]*>\s*([^<]+)\s*<\/span>/s);
            exampleQuestion = eqMatch ? eqMatch[1].trim() : "";
            exampleAnswer = eqMatch ? eqMatch[2].trim() : "";
        }

        tempPassage = stripListeningExampleBlocks(tempPassage);
        tempPassage = tempPassage.replace(/<div class=["']ielts-listening-notes[^"']*["'][^>]*>/, "");
        tempPassage = tempPassage.replace(/<\/div>\s*$/, "");

        cleanPassage = tempPassage.trim();
    }

    let passages = [{ title: "", content: "" }];
    if (fetchedQuestion.passages && fetchedQuestion.passages.length > 0) {
        passages = fetchedQuestion.passages.map(p => ({ title: p.title || "", content: p.content || "" }));
    } else if (fetchedQuestion.testType === "reading") {
        passages = [{ title: fetchedQuestion.title || "Passage 1", content: fetchedQuestion.passage || "" }];
    }

    const questionGroups = (fetchedQuestion.questionGroups && fetchedQuestion.questionGroups.length > 0)
        ? fetchedQuestion.questionGroups.map(g => ({
            title: g.title || "",
            instructions: g.instructions || "",
            fromQuestion: g.fromQuestion || 1,
            toQuestion: g.toQuestion || 1,
            passageIndex: g.passageIndex || 0,
            linkUrl: g.linkUrl || "",
            rightSideQuestion: g.rightSideQuestion || false,
        }))
        : [{ title: "", instructions: "", fromQuestion: 1, toQuestion: 13, passageIndex: 0, linkUrl: "", rightSideQuestion: false }];

    return {
        title: fetchedQuestion.title || "",
        instructions: fetchedQuestion.instructions || "",
        passage: cleanPassage,
        passages,
        questionGroups,
        audioUrl: fetchedQuestion.audioUrl || "",
        speakingPrompt: fetchedQuestion.speakingPrompt || "",
        speakingPart1Questions: fetchedQuestion.speakingPart1Questions?.length ? fetchedQuestion.speakingPart1Questions : [""],
        speakingPart3Questions: fetchedQuestion.speakingPart3Questions?.length ? fetchedQuestion.speakingPart3Questions : [""],
        images: fetchedQuestion.images?.filter(img => img && img.trim() !== "") || [],
        task1Prompt,
        task1Image,
        task2Prompt,
        exampleQuestion,
        exampleAnswer,
        examType: fetchedQuestion.examType || "IELTS",
        listeningPart: fetchedQuestion.listeningPart || 1,
        forPlanType: fetchedQuestion.forPlanType || "free",
        isActive: fetchedQuestion.isActive !== false,
        isPublic: fetchedQuestion.isPublic || false,
        isMockOnly: fetchedQuestion.isMockOnly || false,
        questions: fetchedQuestion.questions?.length ? fetchedQuestion.questions.map((q, idx) => ({
            id: q.id || `${idPrefix}${idx + 1}`,
            type: q.type || "short-answer",
            question: q.question || "",
            correctAnswer: q.correctAnswer || "",
            options: q.options || ["", ""],
            matchingPairs: q.matchingPairs || [{ key: "", value: "" }],
            imageUrl: q.imageUrl || "",
            passageIndex: q.passageIndex || 0,
            info: q.info || "",
            pteDropdownOptions: q.pteDropdownOptions || [["", "", "", ""]],
            pteParagraphsOrder: q.pteParagraphsOrder || [],
            pteAudioTranscript: q.pteAudioTranscript || ""
        })) : [makeQuestion(testType)],
    };
}

export const syncMultipleSelectionGroup = (prevQuestions, questionGroups) => {
    if (!prevQuestions || prevQuestions.length === 0) return prevQuestions;
    if (!questionGroups || questionGroups.length === 0) return prevQuestions;
    
    let questions = [...prevQuestions];
    for (const group of questionGroups) {
        const fromQ = Number(group.fromQuestion) || 1;
        const toQ = Number(group.toQuestion) || 1;
        if (fromQ < toQ) {
            const firstQIndex = fromQ - 1;
            const firstQ = questions[firstQIndex];
            if (firstQ && firstQ.type === "multiple-selection") {
                const sourceText = firstQ.question;
                const sourceOptions = firstQ.options;
                for (let i = fromQ; i < toQ; i++) {
                    if (questions[i] && questions[i].type === "multiple-selection") {
                        questions[i] = {
                            ...questions[i],
                            type: "multiple-selection",
                            question: sourceText || questions[i].question,
                            options: sourceOptions ? [...sourceOptions] : questions[i].options
                        };
                    }
                }
            }
        }
    }
    return questions;
};

export function useQuestionFormState(initialData = initialForm("reading")) {
    const [formData, setFormData] = useState(initialData);

    const patch = useCallback((updates) => {
        setFormData((prev) => ({ ...prev, ...updates }));
    }, []);

    const patchQuestion = useCallback((id, updates) => {
        setFormData((prev) => ({
            ...prev,
            questions: prev.questions.map((q) =>
                q.id === id ? { ...q, ...updates } : q
            ),
        }));
    }, []);

    const handleAddQuestion = useCallback((testType) => {
        setFormData((prev) => ({
            ...prev,
            questions: [...prev.questions, makeQuestion(testType || "listening")],
        }));
    }, []);

    const handleRemoveQuestion = useCallback((id) => {
        setFormData((prev) => ({
            ...prev,
            questions: prev.questions.filter((q) => q.id !== id),
        }));
    }, []);

    const updateQuestionField = useCallback((id, field, value) => {
        setFormData((prev) => {
            let updates = { [field]: value };
            if (field === "type") {
                if (value === "true-false") {
                    updates.options = ["True", "False", "Not Given"];
                } else if (value === "yes-no") {
                    updates.options = ["Yes", "No", "Not Given"];
                } else if (value === "matching-grid") {
                    updates.options = ["A", "B", "C"];
                } else if (value === "multiple-choice") {
                    const targetQ = prev.questions.find(q => q.id === id);
                    const currentOpts = targetQ?.options || [];
                    if (currentOpts.length === 0 || currentOpts.every(o => o === "A" || o === "B" || o === "C" || o === "D")) {
                        updates.options = ["Option A", "Option B"];
                    }
                } else if (value === "drag-drop-completion") {
                    const firstDD = prev.questions.find(q => q.type === "drag-drop-completion");
                    if (firstDD && firstDD.options?.length) {
                        updates.options = [...firstDD.options];
                    }
                }
            }
            
            const updatedQuestions = prev.questions.map((q) =>
                q.id === id ? { ...q, ...updates } : q
            );
            
            const finalQuestions = syncMultipleSelectionGroup(updatedQuestions, prev.questionGroups);
            
            return {
                ...prev,
                questions: finalQuestions,
            };
        });
    }, []);

    const handleAddOption = useCallback((qId) => {
        setFormData((prev) => {
            const targetQuestion = prev.questions.find((q) => q.id === qId);
            if (!targetQuestion) return prev;
            const nextValue = targetQuestion.type === "matching-grid"
                ? String.fromCharCode(65 + (targetQuestion.options?.length || 0))
                : "";
            const isDragDrop = targetQuestion.type === "drag-drop-completion";
            const newOptions = [...(targetQuestion.options || []), nextValue];

            const updatedQuestions = prev.questions.map((q) => {
                if (isDragDrop && q.type === "drag-drop-completion") {
                    return { ...q, options: newOptions };
                }
                return q.id === qId ? { ...q, options: newOptions } : q;
            });

            return {
                ...prev,
                questions: updatedQuestions,
            };
        });
    }, []);

    const updateOption = useCallback((qId, idx, value) => {
        setFormData((prev) => {
            const targetQuestion = prev.questions.find((q) => q.id === qId);
            if (!targetQuestion) return prev;
            const opts = [...(targetQuestion.options || [])];
            opts[idx] = value;
            const isDragDrop = targetQuestion.type === "drag-drop-completion";

            const updatedQuestions = prev.questions.map((q) => {
                if (isDragDrop && q.type === "drag-drop-completion") {
                    return { ...q, options: opts };
                }
                return q.id === qId ? { ...q, options: opts } : q;
            });

            return {
                ...prev,
                questions: updatedQuestions,
            };
        });
    }, []);

    const handleRemoveOption = useCallback((qId, idx) => {
        setFormData((prev) => {
            const targetQuestion = prev.questions.find((q) => q.id === qId);
            if (!targetQuestion) return prev;
            const opts = (targetQuestion.options || []).filter((_, i) => i !== idx);
            const isDragDrop = targetQuestion.type === "drag-drop-completion";

            const updatedQuestions = prev.questions.map((q) => {
                if (isDragDrop && q.type === "drag-drop-completion") {
                    return { ...q, options: opts };
                }
                return q.id === qId ? { ...q, options: opts } : q;
            });

            return {
                ...prev,
                questions: updatedQuestions,
            };
        });
    }, []);

    const handleAddPair = useCallback((qId) => {
        setFormData((prev) => {
            const targetQuestion = prev.questions.find((q) => q.id === qId);
            if (!targetQuestion) return prev;
            return {
                ...prev,
                questions: prev.questions.map((q) =>
                    q.id === qId
                        ? {
                              ...q,
                              matchingPairs: [
                                  ...(q.matchingPairs || []),
                                  { key: "", value: "" },
                              ],
                          }
                        : q
                ),
            };
        });
    }, []);

    const updatePair = useCallback((qId, idx, field, value) => {
        setFormData((prev) => {
            const targetQuestion = prev.questions.find((q) => q.id === qId);
            if (!targetQuestion) return prev;
            const pairs = targetQuestion.matchingPairs.map((p, i) =>
                i === idx ? { ...p, [field]: value } : p
            );
            return {
                ...prev,
                questions: prev.questions.map((q) =>
                    q.id === qId ? { ...q, matchingPairs: pairs } : q
                ),
            };
        });
    }, []);

    return {
        formData,
        setFormData,
        patch,
        patchQuestion,
        handleAddQuestion,
        handleRemoveQuestion,
        updateQuestionField,
        handleAddOption,
        updateOption,
        handleRemoveOption,
        handleAddPair,
        updatePair,
    };
}
