export const PTE_QUESTION_TYPE_LABELS = {
  // PTE Reading
  "pte-reading-writing-fill-blanks": "Reading & Writing: Fill in the Blanks",
  "pte-reorder-paragraphs": "Re-order Paragraphs",
  "pte-reading-fill-blanks": "Reading: Fill in the Blanks",

  // PTE Speaking
  "pte-read-aloud": "Read Aloud",
  "pte-repeat-sentence": "Repeat Sentence",
  "pte-describe-image": "Describe Image",
  "pte-retell-lecture": "Re-tell Lecture",
  "pte-answer-short-question": "Answer Short Question",

  // PTE Writing
  "pte-summarize-written-text": "Summarize Written Text",
  "pte-write-essay": "Write Essay",

  // PTE Listening
  "pte-summarize-spoken-text": "Summarize Spoken Text",
  "pte-highlight-incorrect-words": "Highlight Incorrect Words",
  "pte-write-from-dictation": "Write from Dictation",
  "pte-select-missing-word": "Select Missing Word",

  // Choice types
  "multiple-choice": "Multiple Choice (Single Answer)",
  "multiple-selection": "Multiple Choice (Multiple Answers)",

  // General / IELTS Fallbacks
  "short-answer": "Short Answer / Completion",
  "sentence-completion": "Sentence Completion",
  "summary-completion": "Summary Completion",
  "table-completion": "Table Completion",
  "flow-chart-completion": "Flow-chart Completion",
  "drag-drop-completion": "Drag & Drop Completion",
  "true-false": "True / False / Not Given",
  "yes-no": "Yes / No / Not Given",
  "matching": "Matching",
  "heading-matching": "Heading Matching",
  "matching-grid": "Matching Grid",
  "map-labelling": "Map Labelling",
  "diagram-labelling": "Diagram Labelling",
};

/**
 * Derives the Category Name for a Question Set
 */
export function getSetCategory(set) {
  if (!set) return "General Module";

  const firstQ = set.questions?.[0];
  const qType = firstQ?.type;

  if (qType && PTE_QUESTION_TYPE_LABELS[qType]) {
    // If it's multiple choice in non-PTE context
    if (qType === "multiple-choice" && set.examType === "IELTS") {
      return "Multiple Choice";
    }
    if (qType === "multiple-selection" && set.examType === "IELTS") {
      return "Multiple Selection";
    }
    return PTE_QUESTION_TYPE_LABELS[qType];
  }

  if (set.examType === "IELTS" && set.listeningPart) {
    return `Part ${set.listeningPart}`;
  }

  return "General Module";
}

/**
 * Returns Category Badge background & text styles for clear visual distinction
 */
export function getCategoryBadgeStyle(categoryName) {
  if (!categoryName) return "bg-slate-100 text-slate-700 border-slate-200";
  
  const lower = categoryName.toLowerCase();
  if (lower.includes("fill in") || lower.includes("blanks")) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
  }
  if (lower.includes("re-order") || lower.includes("order")) {
    return "bg-amber-50 text-amber-700 border-amber-200/80";
  }
  if (lower.includes("multiple choice") || lower.includes("choice")) {
    return "bg-blue-50 text-blue-700 border-blue-200/80";
  }
  if (lower.includes("read aloud") || lower.includes("repeat") || lower.includes("describe")) {
    return "bg-purple-50 text-purple-700 border-purple-200/80";
  }
  if (lower.includes("summarize") || lower.includes("essay") || lower.includes("dictation")) {
    return "bg-rose-50 text-rose-700 border-rose-200/80";
  }
  return "bg-indigo-50 text-indigo-700 border-indigo-200/80";
}
