export function cleanHiwWord(w) {
    if (!w) return "";
    return String(w)
        .toLowerCase()
        .replace(/[\u2018\u2019\u02BC\u201B]/g, "'")
        .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "")
        .trim();
}

/**
 * Tokenizes a passage into an array of token objects.
 * Words are cleanly isolated while preserving internal apostrophes/hyphens,
 * punctuation (including em-dashes/quotes), and layout whitespace.
 */
export function tokenizePassage(text) {
    if (!text || typeof text !== "string") return [];

    const regex = /(\s+)|([^\s\p{L}\p{N}]*)([\p{L}\p{N}]+(?:(?:['’\u2019-]|(?<=\d)[.,](?=\d))[\p{L}\p{N}]+)*)([^\s\p{L}\p{N}]*)|([^\s\p{L}\p{N}]+)/gu;
    const tokens = [];
    let match;
    let wordIndex = 0;

    while ((match = regex.exec(text)) !== null) {
        if (match[1]) {
            tokens.push({
                type: "space",
                text: match[1],
            });
        } else if (match[3]) {
            const prefix = match[2] || "";
            const word = match[3];
            const suffix = match[4] || "";
            tokens.push({
                type: "word",
                index: wordIndex++,
                word,
                prefix,
                suffix,
                cleanWord: cleanHiwWord(word),
                raw: match[0],
            });
        } else if (match[5]) {
            tokens.push({
                type: "punct",
                text: match[5],
            });
        }
    }

    return tokens;
}
