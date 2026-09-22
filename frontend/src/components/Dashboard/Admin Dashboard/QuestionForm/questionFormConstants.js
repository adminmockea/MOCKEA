import {
    PiBookOpen,
    PiEar,
    PiPencilLine,
    PiMicrophoneStage,
    PiListBullets,
    PiTextT,
    PiArrowsLeftRight,
    PiMapTrifold,
} from "react-icons/pi";

export const TEST_SECTIONS = [
    { id: "reading",   label: "Reading",   icon: PiBookOpen,        color: "text-blue-500"   },
    { id: "listening", label: "Listening", icon: PiEar,             color: "text-purple-500" },
    { id: "writing",   label: "Writing",   icon: PiPencilLine,      color: "text-orange-500" },
    { id: "speaking",  label: "Speaking",  icon: PiMicrophoneStage, color: "text-green-500"  },
];

// Grouped question types for the dropdown
export const QUESTION_TYPE_GROUPS = [
    {
        group: "Completion",
        icon: PiTextT,
        types: [
            { value: "short-answer",          label: "Short Answer / Note Completion" },
            { value: "sentence-completion",   label: "Sentence Completion" },
            { value: "summary-completion",    label: "Summary Completion" },
            { value: "table-completion",      label: "Table Completion" },
            { value: "flow-chart-completion", label: "Flow-chart Completion" },
            { value: "drag-drop-completion",   label: "Drag and Drop Completion" },
        ],
    },
    {
        group: "Selection",
        icon: PiListBullets,
        types: [
            { value: "multiple-choice", label: "Multiple Choice (MCQ)" },
            { value: "true-false",      label: "True / False / Not Given" },
            { value: "yes-no",          label: "Yes / No / Not Given" },
            { value: "multiple-selection", label: "Multiple Selection" },
        ],
    },
    {
        group: "Matching",
        icon: PiArrowsLeftRight,
        types: [
            { value: "matching",         label: "Matching" },
            { value: "heading-matching", label: "Heading Matching" },
            { value: "matching-grid",    label: "Matching Grid" },
        ],
    },
    {
        group: "Visual / Map (IELTS)",
        icon: PiMapTrifold,
        types: [
            { value: "map-labelling",     label: "Map / Plan Labelling" },
            { value: "diagram-labelling", label: "Diagram Labelling" },
        ],
    },
];

// Which types need options array
export const NEEDS_OPTIONS = ["multiple-choice", "true-false", "yes-no", "matching-grid", "drag-drop-completion", "multiple-selection", "pte-select-missing-word", "pte-reading-fill-blanks-drag-drop", "pte-reading-fill-blanks"];
// Which types need matchingPairs
export const NEEDS_PAIRS = ["matching", "heading-matching"];
// Which types need a per-question image URL
export const NEEDS_IMAGE = ["map-labelling", "diagram-labelling", "pte-describe-image"];
// Which PTE types need an audio prompt file
export const PTE_NEEDS_AUDIO = ["pte-repeat-sentence", "pte-retell-lecture", "pte-answer-short-question"];

export const PTE_QUESTION_TYPE_GROUPS = [
    {
        group: "PTE Speaking",
        icon: PiMicrophoneStage,
        types: [
            { value: "pte-read-aloud", label: "Read Aloud" },
            { value: "pte-repeat-sentence", label: "Repeat Sentence" },
            { value: "pte-describe-image", label: "Describe Image" },
            { value: "pte-retell-lecture", label: "Re-tell Lecture" },
            { value: "pte-answer-short-question", label: "Answer Short Question" },
        ]
    },
    {
        group: "PTE Writing",
        icon: PiPencilLine,
        types: [
            { value: "pte-summarize-written-text", label: "Summarize Written Text" },
            { value: "pte-write-essay", label: "Write Essay" },
        ]
    },
    {
        group: "PTE Reading",
        icon: PiBookOpen,
        types: [
            { value: "pte-reading-fill-blanks-drag-drop", label: "Reading: Fill in the Blanks (Drag & Drop)" },
            { value: "pte-reading-writing-fill-blanks", label: "Reading & Writing: Fill in the Blanks (Dropdown)" },
            { value: "pte-reorder-paragraphs", label: "Re-order Paragraphs" },
            { value: "pte-reading-fill-blanks", label: "Reading: Fill in the Blanks" },
            { value: "multiple-choice", label: "Multiple Choice (Single Answer)" },
            { value: "multiple-selection", label: "Multiple Choice (Multiple Answers)" },
        ]
    },
    {
        group: "PTE Listening",
        icon: PiEar,
        types: [
            { value: "pte-summarize-spoken-text", label: "Summarize Spoken Text" },
            { value: "pte-highlight-incorrect-words", label: "Highlight Incorrect Words" },
            { value: "pte-write-from-dictation", label: "Write from Dictation" },
            { value: "pte-select-missing-word", label: "Select Missing Word" },
            { value: "multiple-choice", label: "Multiple Choice (Single Answer)" },
            { value: "multiple-selection", label: "Multiple Choice (Multiple Answers)" },
        ]
    }
];

// IELTS Listening Part definitions
export const LISTENING_PARTS = [
    { part: 1, label: "Part 1", context: "Social conversation (2 speakers)", hint: "Form / Note completion" },
    { part: 2, label: "Part 2", context: "Social monologue (1 speaker)",     hint: "MCQ / Matching / Map labelling" },
    { part: 3, label: "Part 3", context: "Academic discussion (2–4 speakers)", hint: "MCQ / Sentence completion" },
    { part: 4, label: "Part 4", context: "Academic lecture (1 speaker)",      hint: "Note / Summary / Table completion" },
];

// ─── Default question factory ─────────────────────────────────────────────────
let _qCounter = 0;
export const makeQuestion = (testType = "listening") => {
    _qCounter++;
    const prefix = testType === "listening" ? "l" : testType === "reading" ? "r" : testType === "writing" ? "w" : "q";
    const isWriting = testType === "writing";
    return {
        id: `${prefix}${_qCounter}`,
        type: isWriting ? "pte-summarize-written-text" : "short-answer",
        question: "",
        correctAnswer: isWriting ? "[INSTRUCTOR REVIEW REQUIRED]" : "",
        options: ["", ""],
        matchingPairs: [{ key: "", value: "" }],
        imageUrl: "",
        audioUrl: "",
        passageIndex: 0,
        info: "",
        // PTE specific fields
        pteDropdownOptions: [["", "", "", ""]],
        pteParagraphsOrder: [""],
        pteAudioTranscript: "",
    };
};

// ─── Initial form state ───────────────────────────────────────────────────────
export const initialForm = (testType = "reading") => ({
    title: "",
    instructions: "",
    passage: "",
    passages: [{ title: "", content: "" }],
    questionGroups: [{ title: "", instructions: "", fromQuestion: 1, toQuestion: 13, passageIndex: 0, linkUrl: "", rightSideQuestion: false }],
    audioUrl: "",
    speakingPrompt: "",
    speakingPart1Questions: [""],
    speakingPart1AudioUrls: [""],
    speakingPart2AudioUrl: "",
    speakingPart3Questions: [""],
    speakingPart3AudioUrls: [""],
    images: [],
    task1Prompt: "",
    task1Image: "",
    task2Prompt: "",
    exampleQuestion: "",
    exampleAnswer: "",
    examType: "IELTS",
    listeningPart: 1,
    timeLimit: "",
    forPlanType: "free",
    isActive: true,
    isPublic: false,
    isMockOnly: false,
    questions: [makeQuestion(testType)],
});
