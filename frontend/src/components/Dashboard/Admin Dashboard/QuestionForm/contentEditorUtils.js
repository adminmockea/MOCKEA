export function adjustGroupRanges(groups, changedIdx, field, newValue) {
    const updated = (groups || []).map(g => ({ ...g }));
    const val = parseInt(newValue) || 1;
    
    if (field === "toQuestion") {
        updated[changedIdx].toQuestion = val;
        if ((updated[changedIdx].fromQuestion || 1) > val) {
            updated[changedIdx].fromQuestion = val;
        }
        
        // Cascade forward to subsequent groups if they overlap
        for (let i = changedIdx + 1; i < updated.length; i++) {
            const prevTo = Number(updated[i - 1].toQuestion) || 1;
            const currentFrom = Number(updated[i].fromQuestion) || 1;
            const currentTo = Number(updated[i].toQuestion) || 1;
            
            if (currentFrom <= prevTo) {
                updated[i].fromQuestion = prevTo + 1;
                if (currentTo < prevTo + 1) {
                    updated[i].toQuestion = prevTo + 1;
                }
            }
        }
    } else if (field === "fromQuestion") {
        updated[changedIdx].fromQuestion = val;
        if ((updated[changedIdx].toQuestion || 1) < val) {
            updated[changedIdx].toQuestion = val;
        }
        
        // Adjust previous group if it overlaps
        if (changedIdx > 0) {
            const prevTo = Number(updated[changedIdx - 1].toQuestion) || 1;
            if (prevTo >= val) {
                updated[changedIdx - 1].toQuestion = Math.max(1, val - 1);
            }
        }
        
        // Cascade forward to subsequent groups if needed
        for (let i = changedIdx + 1; i < updated.length; i++) {
            const prevTo = Number(updated[i - 1].toQuestion) || 1;
            const currentFrom = Number(updated[i].fromQuestion) || 1;
            const currentTo = Number(updated[i].toQuestion) || 1;
            
            if (currentFrom <= prevTo) {
                updated[i].fromQuestion = prevTo + 1;
                if (currentTo < prevTo + 1) {
                    updated[i].toQuestion = prevTo + 1;
                }
            }
        }
    }
    
    return updated;
}

export function getPteBlankNumbers(text) {
    if (!text) return [];
    const re = new RegExp("\\[blank-(\\d+)\\]", "g");
    const matches = [...text.matchAll(re)];
    return matches.map(m => parseInt(m[1])).filter(Boolean);
}

export function isWebCopyText(text) {
    if (!text) return false;
    const re = new RegExp("Select|Choose|Answer|______", "i");
    if (re.test(text)) return true;
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const avgWords = lines.length > 0 ? lines.reduce((acc, l) => acc + l.split(/\s+/).length, 0) / lines.length : 10;
    return avgWords < 3.5 && lines.length > 3;
}

export function cleanAndFormatWebPassage(rawText, mode = "pte") {
    if (!rawText) return "";

    // 1. Process line by line to catch dropdown placeholders on their own lines
    const rawLines = rawText.split(/\r?\n/);
    const processedLines = rawLines.map(line => {
        const trimmed = line.trim();
        const isDropdownLine = /^(?:\[?\s*(?:Select(?:\s+Answer)?|Choose(?:\s+Answer)?|Blank)\s*\]?[\s\u25bc\u25bd\u2193\u2304v∨^]*|______+|──────+)$/i.test(trimmed);
        if (isDropdownLine) {
            return " __BLANK_MARKER__ ";
        }
        return line;
    });

    let intermediateText = processedLines.join("\n");

    // 2. Also replace inline dropdown placeholders
    intermediateText = intermediateText
        .replace(/(?:\[?\s*Select\s+Answer\s*\]?[\s\u25bc\u25bd\u2193\u2304v∨^]*)/gi, " __BLANK_MARKER__ ")
        .replace(/(?:\[?\s*Select\s*\]?[\s\u25bc\u25bd\u2193\u2304v∨^]*)/gi, " __BLANK_MARKER__ ")
        .replace(/(?:\[?\s*Choose\s+Answer\s*\]?)/gi, " __BLANK_MARKER__ ")
        .replace(/______+/g, " __BLANK_MARKER__ ")
        .replace(/──────+/g, " __BLANK_MARKER__ ");

    // 3. Un-wrap single-word multi-line breaks
    const linesAfterMarker = intermediateText.split(/\r?\n/);
    const nonEmptyLines = linesAfterMarker.map(l => l.trim()).filter(Boolean);
    const totalWords = nonEmptyLines.reduce((acc, l) => acc + l.split(/\s+/).length, 0);
    const avgWordsPerLine = nonEmptyLines.length > 0 ? totalWords / nonEmptyLines.length : 10;

    let unwrappedText = "";
    if (avgWordsPerLine < 3.5 && nonEmptyLines.length > 3) {
        const paragraphs = [];
        let currentPara = [];
        for (let line of linesAfterMarker) {
            const trimmed = line.trim();
            if (!trimmed) {
                if (currentPara.length > 0) {
                    paragraphs.push(currentPara.join(" "));
                    currentPara = [];
                }
            } else {
                currentPara.push(trimmed);
            }
        }
        if (currentPara.length > 0) {
            paragraphs.push(currentPara.join(" "));
        }
        unwrappedText = paragraphs.join("\n\n");
    } else {
        unwrappedText = intermediateText;
    }

    // 4. Determine starting blank index if existing blanks are present
    let existingMax = 0;
    const existingBlanks = getPteBlankNumbers(unwrappedText);
    if (existingBlanks.length > 0) {
        existingMax = Math.max(...existingBlanks);
    }

    let blankIndex = existingMax > 0 ? existingMax + 1 : 1;

    // 5. Replace __BLANK_MARKER__ with [blank-1], [blank-2]... or ___1___, ___2___...
    let resultText = unwrappedText.replace(/\s*__BLANK_MARKER__\s*/g, () => {
        const tag = mode === "pte" ? ` [blank-${blankIndex}] ` : ` ___${blankIndex}___ `;
        blankIndex++;
        return tag;
    });

    // 6. Clean up multiple spaces & punctuation spacing
    resultText = resultText
        .replace(/[ \t]+/g, " ")
        .replace(/\s+\./g, ".")
        .replace(/\s+,/g, ",")
        .replace(/\n /g, "\n")
        .replace(/ \n/g, "\n")
        .trim();

    return resultText;
}

export function insertTextAtCursor(elementId, textToInsert, currentValue, onUpdate) {
    const ta = document.getElementById(elementId);
    if (ta) {
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const text = currentValue || "";
        const newText = text.substring(0, start) + textToInsert + text.substring(end);
        onUpdate(newText);
        setTimeout(() => {
            ta.focus();
            ta.selectionStart = ta.selectionEnd = start + textToInsert.length;
        }, 0);
    } else {
        onUpdate((currentValue || "") + textToInsert);
    }
}
