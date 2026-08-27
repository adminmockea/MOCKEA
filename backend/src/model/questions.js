import mongoose from 'mongoose';

const QuestionItemSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            required: true,
            enum: [
                // ── Completion (IELTS + PTE) ─────────────────────────
                "short-answer",           // Note / Form completion fill-in
                "sentence-completion",    // Sentence with a blank
                "summary-completion",     // Paragraph with numbered gaps
                "table-completion",       // Table grid with editable cells
                "flow-chart-completion",  // Flow chart with gaps
                "drag-drop-completion",   // Drag and drop completion fill-in

                // ── Selection (IELTS + PTE) ──────────────────────────
                "multiple-choice",        // MCQ with radio options
                "true-false",             // True / False / Not Given
                "yes-no",                 // Yes / No / Not Given
                "multiple-selection",     // Choose multiple options (checkboxes)

                // ── Matching (IELTS + PTE) ───────────────────────────
                "matching",               // Match items to a list
                "heading-matching",       // Match headings to paragraphs
                "matching-grid",          // Matrix grid layout with radio buttons

                // ── Visual / Map (IELTS) ─────────────────────────────
                "map-labelling",          // Map / Plan with numbered labels
                "diagram-labelling",      // Diagram with labelled parts

                // ── PTE Academic Question Types ───────────────────────
                "pte-read-aloud",
                "pte-repeat-sentence",
                "pte-describe-image",
                "pte-retell-lecture",
                "pte-answer-short-question",
                "pte-summarize-written-text",
                "pte-write-essay",
                "pte-reading-writing-fill-blanks",
                "pte-reorder-paragraphs",
                "pte-reading-fill-blanks",
                "pte-summarize-spoken-text",
                "pte-highlight-incorrect-words",
                "pte-write-from-dictation",
                "pte-select-missing-word",
            ],
            default: "short-answer",
        },
        question: {
            type: String,
            required: true,
        },
        correctAnswer: {
            type: String,
            required: true,
        },
        options: {
            type: [String],
            default: [],
        },
        maxSelections: {
            type: Number,
            default: 1,
        },
        // For matching types: list of key-value pairs
        matchingPairs: [{
            key: String,
            value: String
        }],
        // For map/diagram labelling: optional image URL per question
        imageUrl: {
            type: String,
            default: ""
        },
        passageIndex: {
            type: Number,
            default: 0
        },
        info: {
            type: String,
            default: ""
        },
        // PTE specific fields
        pteDropdownOptions: {
            type: [[String]],
            default: []
        },
        pteParagraphsOrder: {
            type: [String],
            default: []
        },
        pteAudioTranscript: {
            type: String,
            default: ""
        }
    },
    { _id: false },
);

const QuestionsSchema = new mongoose.Schema(
    {
        testType: {
            type: String,
            enum: ['reading', 'listening', 'writing', 'speaking'],
            required: true,
            default: 'reading'
        },
        examType: {
            type: String,
            enum: ['IELTS', 'PTE', 'BOTH'],
            default: 'IELTS'
        },
        // IELTS Listening: which of the 4 parts this set covers (1-4)
        listeningPart: {
            type: Number,
            enum: [1, 2, 3, 4],
            default: 1
        },
        title: {
            type: String,
            required: true,
        },
        // For Reading / IELTS Note Completion context text
        passage: {
            type: String,
        },
        passages: [
            {
                title: { type: String, required: true },
                content: { type: String, required: true },
            }
        ],
        // Question groups: admin-defined ranges with headers & instructions
        questionGroups: [
            {
                title:             { type: String },
                instructions:      { type: String },
                fromQuestion:      { type: Number },
                toQuestion:        { type: Number },
                passageIndex:      { type: Number, default: 0 },
                linkUrl:           { type: String },
                rightSideQuestion: { type: Boolean, default: false },
            }
        ],
        // For Listening
        audioUrl: {
            type: String,
        },
        // For Writing/Speaking prompt images
        images: {
            type: [String],
            default: []
        },
        // Existing sections support
        sections: [
            {
                title: { type: String, required: true },
                content: { type: String, required: true },
            },
        ],
        // Grouping instructions (e.g., "Complete the form. Write ONE WORD AND/OR A NUMBER")
        instructions: {
            type: String
        },
        questions: [QuestionItemSchema],
        forPlanType: {
            type: String,
            default: "free",
        },
        // Speaking topic / cue card prompt
        speakingPrompt: {
            type: String,
            default: ""
        },
        speakingPart1Questions: {
            type: [String],
            default: []
        },
        speakingPart3Questions: {
            type: [String],
            default: []
        },
        // Custom time limit in minutes (if null/undefined, defaults apply: PTE=20m, IELTS=standard section duration)
        timeLimit: {
            type: Number,
            default: null,
        },
        // If true, this question set is visible to unauthenticated (guest) users
        isPublic: {
            type: Boolean,
            default: false,
        },
        // If true, this question set is only available for mock tests and hidden from practice lists
        isMockOnly: {
            type: Boolean,
            default: false,
        },
        version: {
            type: Number,
            default: 1,
            required: true
        },
        isLatest: {
            type: Boolean,
            default: true,
            required: true
        },
        parentQuestionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Questions',
            default: null
        },
        isActive: {
            type: Boolean,
            default: true,
            required: true
        },
    },
    { timestamps: true },
);

QuestionsSchema.index({ isLatest: 1 });
QuestionsSchema.index({ parentQuestionId: 1 });

const Questions = mongoose.model('Questions', QuestionsSchema);
export default Questions;