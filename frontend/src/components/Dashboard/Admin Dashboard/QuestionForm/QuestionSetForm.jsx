import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import { PiCheckCircle, PiArrowLeft } from "react-icons/pi";
import useAxiosSecure from "../../../../hooks/useAxiosSecure";
import { convertMarkdownContentToHtml } from "../../../../utils/markdownUtils";
import { stripListeningExampleBlocks } from "../../../../utils/listeningPassage";

import { initialForm } from "./questionFormConstants";
import { useQuestionFormState, parseQuestionToState } from "../../../../hooks/useQuestionFormState";

import TestSectionPicker from "./TestSectionPicker";
import GeneralInfoCard from "./GeneralInfoCard";
import ListeningPartSelector from "./ListeningPartSelector";
import ListeningInlineGuide from "./ListeningInlineGuide";
import ContentEditorCard from "./ContentEditorCard";
import QuestionsBuilderCard from "./QuestionsBuilderCard";

export default function QuestionSetForm({ mode = "add", questionId }) {
    const axiosSecure = useAxiosSecure();

    const isEdit = mode === "edit";
    const { data: fetchedQuestion, isLoading } = useQuery({
        queryKey: ["admin-question", questionId],
        queryFn: async () => {
            const res = await axiosSecure.get(`/questions/${questionId}`);
            return res.data.question;
        },
        enabled: isEdit && !!questionId
    });

    if (isEdit) {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center min-h-[400px]">
                    <span className="loading loading-spinner loading-lg text-primary" />
                </div>
            );
        }

        if (!fetchedQuestion) {
            return <div className="text-center p-8 text-slate-500">Question set not found.</div>;
        }
        const parsedData = parseQuestionToState(fetchedQuestion);
        return (
            <QuestionSetFormContent 
                key={questionId} 
                mode="edit" 
                id={questionId} 
                initialData={parsedData} 
                fetchedQuestionTestType={fetchedQuestion.testType}
            />
        );
    }

    return <QuestionSetFormContent mode="add" initialData={initialForm("reading")} />;
}

function QuestionSetFormContent({ mode, id, initialData, fetchedQuestionTestType }) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const axiosSecure = useAxiosSecure();

    const [testType, setTestType] = useState(mode === "edit" ? fetchedQuestionTestType : "reading");
    const {
        formData,
        patch,
        handleAddQuestion,
        handleRemoveQuestion,
        updateQuestionField,
        handleAddOption,
        updateOption,
        handleRemoveOption,
        handleSmartPasteOptions,
        handleResetOptions,
        handleAddPair,
        updatePair,
    } = useQuestionFormState(initialData);

    useEffect(() => {
        if (mode === "add") {
            const prefix = testType === "listening" ? "l" : testType === "reading" ? "r" : "q";
            const firstQuestion = formData.questions?.[0];
            if (firstQuestion && !firstQuestion.id.startsWith(prefix)) {
                patch({
                    questions: formData.questions.map((q, idx) => ({
                        ...q,
                        id: `${prefix}${idx + 1}`
                    }))
                });
            }
        }
    }, [testType, mode, patch, formData.questions]);

    const isIeltsListening =
        testType === "listening" &&
        (formData.examType === "IELTS" || formData.examType === "BOTH");

    const mutation = useMutation({
        mutationFn: (data) => {
            if (mode === "edit") {
                return axiosSecure.put(`/questions/${id}`, data);
            } else {
                return axiosSecure.post("/questions/add", data);
            }
        },
        onSuccess: (res) => {
            toast.success(res.data.message || `Question set ${mode === "edit" ? "updated" : "saved"} successfully!`);
            queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
            queryClient.invalidateQueries({ queryKey: ["admin-questions-for-bundle"] });
            if (mode === "edit") {
                queryClient.invalidateQueries({ queryKey: ["admin-question", id] });
                navigate("/dashboard/admin/manage-questions");
            } else {
                // reset form in add mode
                patch(initialForm(testType));
            }
        },
        onError: (err) => {
            const errorMsg = err.response?.data?.message || err.message || "Failed to save questions";
            toast.error(errorMsg);
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        let sanitizedGroups = (formData.questionGroups || []).map(g => ({
            ...g,
            fromQuestion: Number(g.fromQuestion) || 1,
            toQuestion: Number(g.toQuestion) || 1,
        }));

        for (let i = 0; i < sanitizedGroups.length; i++) {
            if (sanitizedGroups[i].toQuestion < sanitizedGroups[i].fromQuestion) {
                sanitizedGroups[i].toQuestion = sanitizedGroups[i].fromQuestion;
            }
            if (i > 0) {
                const prevTo = sanitizedGroups[i - 1].toQuestion;
                if (sanitizedGroups[i].fromQuestion <= prevTo) {
                    sanitizedGroups[i].fromQuestion = prevTo + 1;
                    if (sanitizedGroups[i].toQuestion < sanitizedGroups[i].fromQuestion) {
                        sanitizedGroups[i].toQuestion = sanitizedGroups[i].fromQuestion;
                    }
                }
            }
        }

        const data = { ...formData, questionGroups: sanitizedGroups, testType };

        if (testType === "reading") {
            if (formData.examType === "PTE") {
                data.passage = formData.passage;
                data.passages = [];
            } else {
                const activePassages = (formData.passages || []).filter(p => p.title.trim() !== "" || p.content.trim() !== "");
                data.passages = activePassages;
                data.passage = activePassages.map((p, idx) => `
<section class="p-8 bg-primary/5 rounded-[2rem] border border-primary/10 mb-8">
  <h2 class="text-3xl font-black text-primary mb-4">Reading Passage ${idx + 1}: ${p.title}</h2>
  <div class="space-y-4 text-slate-600">${convertMarkdownContentToHtml(p.content)}</div>
</section>
                `.trim()).join('\n\n');
            }
        } else if (testType === "writing") {
            if (formData.examType !== "PTE") {
                const task1HTML = `
<div class="p-6 bg-slate-50 rounded-2xl border border-slate-200">
  <h3 class="text-xl font-bold text-slate-800 mb-2">Task 1: Academic Report (Recommended: 20 minutes, minimum 150 words)</h3>
  <p class="mb-4 text-slate-700 leading-relaxed font-medium">${formData.task1Prompt.replace(/\n/g, "<br/>")}</p>
</div>`.trim();
                const task2HTML = `
<div class="p-6 bg-slate-50 rounded-2xl border border-slate-200 mt-6">
  <h3 class="text-xl font-bold text-slate-800 mb-2">Task 2: Opinion Essay (Recommended: 40 minutes, minimum 250 words)</h3>
  <p class="mb-4 text-slate-700 leading-relaxed font-semibold">${formData.task2Prompt.replace(/\n/g, "<br/>")}</p>
</div>`.trim();
                data.passage = `<div class="space-y-6">\n  ${task1HTML}\n\n  ${task2HTML}\n</div>`;
                data.images = formData.task1Image ? [formData.task1Image] : [];
                data.questions = [
                    { id: "w1", type: "short-answer", question: "Task Responses:", correctAnswer: "[INSTRUCTOR REVIEW REQUIRED]" },
                ];
            }
            // Clear reading-specific passages — they have a required title field in the schema
            data.passages = [];
        } else if (testType === "speaking") {
            if (formData.examType !== "PTE") {
                data.speakingPart1Questions = formData.speakingPart1Questions.filter(q => q.trim() !== "");
                data.speakingPart3Questions = formData.speakingPart3Questions.filter(q => q.trim() !== "");
                data.questions = [
                    { id: "s1", type: "short-answer", question: "Speaking Recording Response:", correctAnswer: "[INSTRUCTOR REVIEW REQUIRED]" },
                ];
            }
            // Clear reading-specific passages — they have a required title field in the schema
            data.passages = [];
        } else if (
            testType === "listening" &&
            (formData.examType === "IELTS" || formData.examType === "BOTH")
        ) {
            if (formData.listeningPart === 1) {
                const cleanNotes = stripListeningExampleBlocks(formData.passage);
                // Compile example row + gapped notes into passage HTML if example data exists
                const hasExample = (formData.exampleQuestion || "").trim() || (formData.exampleAnswer || "").trim();
                if (hasExample) {
                    const exampleHTML = `
<div class="mb-6 p-5 bg-indigo-50/50 border border-indigo-100 rounded-3xl">
  <div class="text-[9px] font-black uppercase tracking-widest text-primary mb-2">Example</div>
  <div class="flex items-center justify-between text-sm font-semibold text-slate-700">
    <span>${formData.exampleQuestion || "Destination:"}</span>
    <span class="px-3 py-1 bg-white border border-slate-200 rounded-xl font-bold text-slate-800">${formData.exampleAnswer || "Harbour City"}</span>
  </div>
</div>`.trim();
                    data.passage = cleanNotes
                        ? `${exampleHTML}\n\n<div class="ielts-listening-notes space-y-4">\n${cleanNotes}\n</div>`
                        : exampleHTML;
                } else {
                    data.passage = cleanNotes
                        ? `<div class="ielts-listening-notes space-y-4">\n${cleanNotes}\n</div>`
                        : "";
                }
            } else {
                const cleanNotes = stripListeningExampleBlocks(formData.passage);
                data.passage = cleanNotes
                    ? `<div class="ielts-listening-notes space-y-4">\n${cleanNotes}\n</div>`
                    : "";
            }
            // Clear reading-specific passages — they have a required title field in the schema
            data.passages = [];
        } else if (testType === "listening") {
            // PTE listening (examType is PTE) — no passages needed
            data.passages = [];
        }

        // Strip frontend-only fields that are not part of the DB schema
        delete data.task1Prompt;
        delete data.task1Image;
        delete data.task2Prompt;
        delete data.exampleQuestion;
        delete data.exampleAnswer;

        if (data.images) {
            data.images = data.images.filter(img => img && img.trim() !== "");
        }

        mutation.mutate(data);
    };

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
            <header className="flex flex-col gap-2 border-b border-base-300 pb-6 relative">
                <button
                    type="button"
                    onClick={() => navigate("/dashboard/admin/manage-questions")}
                    className="btn btn-ghost btn-sm rounded-xl gap-2 self-start mb-2"
                >
                    <PiArrowLeft /> Back to Question Bank
                </button>
                <p className="text-sm uppercase tracking-[0.3em] text-primary font-semibold">Admin Panel</p>
                <h1 className="text-3xl font-bold">{mode === "edit" ? "Edit Question Set" : "Add New Question Set"}</h1>
                <p className="text-base-content/60">
                    {mode === "edit" 
                        ? `Modify details of question set: ${formData.title || ""}` 
                        : "Create a standardized question set for any section — IELTS or PTE Academic."
                    }
                </p>
            </header>

            {/* Exam Format Tab Switcher */}
            <div className="flex justify-center">
                <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-2 border border-slate-200 shadow-inner">
                    <button
                        type="button"
                        onClick={() => patch({ examType: "IELTS" })}
                        className={`px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                            formData.examType === "IELTS" || formData.examType === "BOTH"
                                ? "bg-white text-primary shadow-md transform scale-[1.02]"
                                : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                        🎓 IELTS Format
                    </button>
                    <button
                        type="button"
                        onClick={() => patch({ examType: "PTE" })}
                        className={`px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                            formData.examType === "PTE"
                                ? "bg-white text-primary shadow-md transform scale-[1.02]"
                                : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                        📘 PTE Academic Format
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Test Section Selector */}
                <TestSectionPicker 
                    testType={testType} 
                    setTestType={setTestType} 
                    locked={mode === "edit"} 
                />

                {/* General Info */}
                <GeneralInfoCard 
                    formData={formData} 
                    patch={patch} 
                />

                {/* IELTS Listening Part Selector */}
                {testType === "listening" && formData.examType !== "PTE" && (
                    <ListeningPartSelector 
                        value={formData.listeningPart} 
                        onChange={(part) => patch({ listeningPart: part })} 
                    />
                )}

                {/* Listening Guide — shown above Content Editor */}
                {testType === "listening" && isIeltsListening && (
                    <ListeningInlineGuide 
                        listeningPart={formData.listeningPart} 
                    />
                )}

                {/* Content Editor Card */}
                <ContentEditorCard 
                    testType={testType} 
                    isIeltsListening={isIeltsListening} 
                    formData={formData} 
                    patch={patch} 
                />

                {/* Sub-Questions list builder */}
                <QuestionsBuilderCard 
                    testType={testType} 
                    formData={formData} 
                    handleAddQuestion={handleAddQuestion} 
                    handleRemoveQuestion={handleRemoveQuestion} 
                    updateQuestionField={updateQuestionField} 
                    handleAddOption={handleAddOption} 
                    updateOption={updateOption} 
                    handleRemoveOption={handleRemoveOption}
                    handleSmartPasteOptions={handleSmartPasteOptions}
                    handleResetOptions={handleResetOptions}
                    handleAddPair={handleAddPair} 
                    updatePair={updatePair} 
                />

                {/* Submit button */}
                <div className="flex justify-end pt-8">
                    <button
                        type="submit"
                        className="btn btn-primary btn-lg rounded-2xl px-12 gap-3 shadow-lg shadow-primary/20"
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending
                            ? <span className="loading loading-spinner" />
                            : <PiCheckCircle className="w-6 h-6" />
                        }
                        {mode === "edit" ? "Update Question Set" : "Save Question Set"}
                    </button>
                </div>
            </form>
        </div>
    );
}
