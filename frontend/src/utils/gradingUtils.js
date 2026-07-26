/**
 * Utility functions for evaluation and grading parsing
 */

export const parseSpeakingSubmission = (content) => {
    if (!content) return [];
    const parts = content.split(/(?=--- Part \d+)/);
    const parsed = [];
    
    parts.forEach(partText => {
        const titleMatch = partText.match(/--- (Part \d+[^\n]+) ---/);
        const title = titleMatch ? titleMatch[1] : "Speaking Part";
        
        const items = [];
        const lines = partText.split("\n");
        let currentItem = null;
        
        lines.forEach(line => {
            const cleanLine = line.trim();
            if ((cleanLine.startsWith("Q") && cleanLine.includes(":")) || cleanLine.startsWith("Cue Card:")) {
                if (currentItem) items.push(currentItem);
                const label = cleanLine.startsWith("Cue Card:") ? "Cue Card" : cleanLine.split(":")[0];
                const questionText = cleanLine.substring(cleanLine.indexOf(":") + 1).trim();
                currentItem = { label, question: questionText, audioUrl: "" };
            } else if (cleanLine.startsWith("Answer:")) {
                if (currentItem) {
                    currentItem.audioUrl = cleanLine.replace("Answer:", "").trim();
                }
            }
        });
        if (currentItem) items.push(currentItem);
        if (items.length > 0) {
            parsed.push({ title, items });
        }
    });
    return parsed;
};

export const parseWritingSubmission = (content) => {
    if (!content) return { task1: "", task2: "" };
    if (content.includes("--- TASK 2")) {
        const match = content.match(/--- TASK 1.*---\n([\s\S]*?)\n\n--- TASK 2.*---\n([\s\S]*)/);
        if (match) {
            return { task1: match[1].trim(), task2: match[2].trim() };
        } else {
            const parts = content.split(/--- TASK 2.*---\n?/);
            const t1 = parts[0].replace(/--- TASK 1.*---\n?/, "").trim();
            const t2 = (parts[1] || "").trim();
            return { task1: t1, task2: t2 };
        }
    }
    return { task1: content.trim(), task2: "" };
};

export const calculateIeltsBand = (scoresList) => {
    if (!scoresList || scoresList.length === 0) return 0;
    const avg = scoresList.reduce((sum, val) => sum + parseFloat(val || 0), 0) / scoresList.length;
    const integerPart = Math.floor(avg);
    const decimalPart = avg - integerPart;
    if (decimalPart < 0.25) {
        return integerPart;
    } else if (decimalPart < 0.75) {
        return integerPart + 0.5;
    } else {
        return integerPart + 1.0;
    }
};
