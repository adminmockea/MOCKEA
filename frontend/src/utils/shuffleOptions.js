/**
 * Deterministically shuffles an array of options based on a seed string.
 * This ensures options are randomized so the correct answer is not always listed first,
 * while maintaining a stable order across React re-renders for a given question and blank.
 */
export function shuffleOptions(array, seedStr = "") {
    if (!Array.isArray(array) || array.length <= 1) {
        return Array.isArray(array) ? [...array] : [];
    }

    const str = "pte-salt-v2:" + String(seedStr);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0; // Convert to 32-bit signed integer
    }

    // PRNG using Mulberry32
    let seed = Math.abs(hash) || 123456789;
    const random = () => {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Extracts and deterministically shuffles the option pool for a specific PTE blank index.
 * Handles single-question documents, sub-question arrays in activeSet, and legacy option formats.
 */
export function getOptionsForBlank(q, activeSet, blankIdx) {
    let rawOptions = [];

    // 1. Check pteDropdownOptions on current question q at blankIdx
    if (q?.pteDropdownOptions && Array.isArray(q.pteDropdownOptions[blankIdx]) && q.pteDropdownOptions[blankIdx].length > 0) {
        rawOptions = q.pteDropdownOptions[blankIdx];
    }
    // 2. Check sub-question object in activeSet.questions at index blankIdx
    else if (activeSet?.questions?.[blankIdx]?.pteDropdownOptions?.[0]?.length > 0) {
        rawOptions = activeSet.questions[blankIdx].pteDropdownOptions[0];
    }
    else if (activeSet?.questions?.[blankIdx]?.options?.length > 0) {
        rawOptions = activeSet.questions[blankIdx].options;
    }
    // 3. Check pteDropdownOptions on first question of activeSet at blankIdx
    else if (activeSet?.questions?.[0]?.pteDropdownOptions?.[blankIdx]?.length > 0) {
        rawOptions = activeSet.questions[0].pteDropdownOptions[blankIdx];
    }
    // 4. Check activeSet root pteDropdownOptions
    else if (activeSet?.pteDropdownOptions?.[blankIdx]?.length > 0) {
        rawOptions = activeSet.pteDropdownOptions[blankIdx];
    }
    // 5. Fallback to q.options
    else if (Array.isArray(q?.options) && q.options.length > 0) {
        if (Array.isArray(q.options[blankIdx])) {
            rawOptions = q.options[blankIdx];
        } else {
            rawOptions = q.options;
        }
    }

    const cleanOptions = (rawOptions || []).filter(opt => opt && typeof opt === 'string' && opt.trim() !== "");
    const seedStr = `${activeSet?._id || q?._id || q?.id || 'pte'}-${blankIdx}-${cleanOptions.join('|')}`;
    return shuffleOptions(cleanOptions, seedStr);
}
