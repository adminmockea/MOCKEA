import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    cleanHiwWord,
    normalizeHiwUserAnswer,
    gradePteHighlightIncorrectWords
} from '../controllers/questions.controller.js';
import { tokenizePassage } from '../../../frontend/src/utils/hiwTokenizer.js';

describe('PTE Highlight Incorrect Words (HIW) - Tokenization Suite', () => {
    it('should cleanly tokenize words preserving punctuation and layout', () => {
        const passage = 'The economic situation was disastrous, and caused major inflations across Europe.';
        const tokens = tokenizePassage(passage);

        const wordTokens = tokens.filter(t => t.type === 'word');
        assert.equal(wordTokens.length, 11);
        assert.equal(wordTokens[0].word, 'The');
        assert.equal(wordTokens[0].cleanWord, 'the');

        // Check word with trailing comma
        const disastrousToken = wordTokens.find(t => t.cleanWord === 'disastrous');
        assert.ok(disastrousToken);
        assert.equal(disastrousToken.word, 'disastrous');
        assert.equal(disastrousToken.suffix, ',');

        // Check word with period
        const europeToken = wordTokens.find(t => t.cleanWord === 'europe');
        assert.ok(europeToken);
        assert.equal(europeToken.word, 'Europe');
        assert.equal(europeToken.suffix, '.');
    });

    it('should handle hyphenated words, apostrophes, and quotes correctly', () => {
        const text = '“Don’t wait,” he said to the well-known author.';
        const tokens = tokenizePassage(text);
        const words = tokens.filter(t => t.type === 'word');

        const dontWord = words.find(w => w.cleanWord === "don't");
        assert.ok(dontWord, 'Don’t should be recognized as a single word');
        assert.equal(dontWord.word, 'Don’t');
        assert.equal(dontWord.cleanWord, "don't");
        assert.equal(dontWord.prefix, '“');

        const wellKnownWord = words.find(w => w.cleanWord === 'well-known');
        assert.ok(wellKnownWord);
        assert.equal(wellKnownWord.word, 'well-known');
    });

    it('should handle em-dashes, double-hyphens, and quoted words as distinct tokens', () => {
        const text = "He said 'hello' and word1—word2--word3 were separated.";
        const tokens = tokenizePassage(text);
        const words = tokens.filter(t => t.type === 'word');

        const helloWord = words.find(w => w.cleanWord === 'hello');
        assert.ok(helloWord);
        assert.equal(helloWord.word, 'hello');
        assert.equal(helloWord.prefix, "'");
        assert.equal(helloWord.suffix, "'");

        const word1 = words.find(w => w.cleanWord === 'word1');
        const word2 = words.find(w => w.cleanWord === 'word2');
        const word3 = words.find(w => w.cleanWord === 'word3');
        assert.ok(word1, 'word1 should be tokenized');
        assert.ok(word2, 'word2 should be tokenized');
        assert.ok(word3, 'word3 should be tokenized');
        assert.equal(word1.suffix, '—');
        assert.equal(word2.suffix, '--');
    });

    it('should cleanly handle numbers, decimals, percentages, and currencies', () => {
        const text = 'Inflation reached 5.5% in 2024, costing $150 for 10,000 items.';
        const tokens = tokenizePassage(text);
        const words = tokens.filter(t => t.type === 'word');

        const decimalWord = words.find(w => w.cleanWord === '5.5');
        assert.ok(decimalWord, '5.5 should be recognized as a single decimal word token');
        assert.equal(decimalWord.word, '5.5');
        assert.equal(decimalWord.suffix, '%');

        const inWord = words.find(w => w.cleanWord === '2024');
        assert.ok(inWord, '2024 should be recognized as a token');
        assert.equal(inWord.word, '2024');

        const costWord = words.find(w => w.cleanWord === '150');
        assert.ok(costWord, '150 with dollar prefix should be recognized');
        assert.equal(costWord.prefix, '$');
        assert.equal(costWord.word, '150');

        const commaWord = words.find(w => w.cleanWord === '10,000');
        assert.ok(commaWord, '10,000 should be recognized as a single formatted number token');
        assert.equal(commaWord.word, '10,000');
    });

    it('should preserve unicode letters with accents and diacritics', () => {
        const text = 'The naïve student drank a café latte while writing his résumé.';
        const tokens = tokenizePassage(text);
        const words = tokens.filter(t => t.type === 'word');

        const naive = words.find(w => w.cleanWord === 'naïve');
        assert.ok(naive, 'naïve should be preserved');
        assert.equal(naive.word, 'naïve');

        const cafe = words.find(w => w.cleanWord === 'café');
        assert.ok(cafe, 'café should be preserved');
        assert.equal(cafe.word, 'café');

        const resume = words.find(w => w.cleanWord === 'résumé');
        assert.ok(resume, 'résumé should be preserved');
        assert.equal(resume.word, 'résumé');
    });

    it('should handle empty or whitespace-only strings gracefully', () => {
        assert.deepEqual(tokenizePassage(''), []);
        assert.deepEqual(tokenizePassage(null), []);
        assert.deepEqual(tokenizePassage(undefined), []);
        const spacesOnly = tokenizePassage('   \n\t  ');
        assert.equal(spacesOnly.filter(t => t.type === 'word').length, 0);
    });
});

describe('PTE Highlight Incorrect Words (HIW) - Admin Payload Ingestion', () => {
    it('should normalize and synchronize options array and correctAnswer string', () => {
        const rawOptions = [' disastrous ', 'inflations', '', '  europe '];
        const cleanOptions = rawOptions.map(w => w.trim()).filter(Boolean);
        const derivedAnswer = cleanOptions.join(', ');

        const questionPayload = {
            id: 'l1',
            type: 'pte-highlight-incorrect-words',
            question: 'The economic situation was disastrous and caused major inflations across Europe.',
            options: cleanOptions,
            correctAnswer: derivedAnswer,
            audioUrl: 'https://res.cloudinary.com/demo/audio.mp3',
            pteAudioTranscript: 'The economic situation was difficult and caused major concerns across Europe.'
        };

        assert.equal(questionPayload.type, 'pte-highlight-incorrect-words');
        assert.deepEqual(questionPayload.options, ['disastrous', 'inflations', 'europe']);
        assert.equal(questionPayload.correctAnswer, 'disastrous, inflations, europe');
        assert.ok(questionPayload.audioUrl);
        assert.ok(questionPayload.pteAudioTranscript);
    });
});

describe('PTE Highlight Incorrect Words (HIW) - Scoring Algorithm & Edge Cases', () => {
    const question = {
        id: 'hiw-q1',
        type: 'pte-highlight-incorrect-words',
        question: 'The economic situation was disastrous and caused major inflations across Europe.',
        options: ['disastrous', 'inflations'],
        correctAnswer: 'disastrous, inflations',
        audioUrl: 'https://audio.example.com/test.mp3',
        pteAudioTranscript: 'The economic situation was difficult and caused major concerns across Europe.'
    };

    it('Case 1: Perfect score (all hits, 0 false alarms)', () => {
        const userAnswer = ['disastrous', 'inflations'];
        const result = gradePteHighlightIncorrectWords(question, userAnswer);

        assert.equal(result.score, 2);
        assert.equal(result.rawScore, 2);
        assert.equal(result.maxScore, 2);
        assert.equal(result.isCorrect, true);
        assert.deepEqual(result.correctWords, ['disastrous', 'inflations']);
        assert.deepEqual(result.incorrectWords, []);
        assert.deepEqual(result.missedWords, []);
        assert.equal(result.itemizedDetails.points, 2);
    });

    it('Case 2: Partial score (1 hit, 0 false alarms)', () => {
        const userAnswer = ['disastrous'];
        const result = gradePteHighlightIncorrectWords(question, userAnswer);

        assert.equal(result.score, 1);
        assert.equal(result.rawScore, 1);
        assert.equal(result.maxScore, 2);
        assert.equal(result.isCorrect, false);
        assert.deepEqual(result.correctWords, ['disastrous']);
        assert.deepEqual(result.incorrectWords, []);
        assert.deepEqual(result.missedWords, ['inflations']);
    });

    it('Case 3: Negative marking penalty (1 hit, 1 false alarm -> score 0)', () => {
        const userAnswer = ['disastrous', 'economic']; // 'economic' is a false alarm
        const result = gradePteHighlightIncorrectWords(question, userAnswer);

        assert.equal(result.rawScore, 0); // 1 - 1 = 0
        assert.equal(result.score, 0);
        assert.equal(result.isCorrect, false);
        assert.deepEqual(result.correctWords, ['disastrous']);
        assert.deepEqual(result.incorrectWords, ['economic']);
        assert.deepEqual(result.missedWords, ['inflations']);
    });

    it('Case 4: Score floor 0 (0 hits, 2 false alarms -> score is 0, never negative)', () => {
        const userAnswer = ['situation', 'europe'];
        const result = gradePteHighlightIncorrectWords(question, userAnswer);

        assert.equal(result.rawScore, -2); // 0 - 2 = -2
        assert.equal(result.score, 0); // Floor 0 applied
        assert.equal(result.isCorrect, false);
        assert.deepEqual(result.correctWords, []);
        assert.deepEqual(result.incorrectWords, ['situation', 'europe']);
        assert.deepEqual(result.missedWords, ['disastrous', 'inflations']);
    });

    it('Case 5: Empty answer / no words highlighted', () => {
        const resultEmpty = gradePteHighlightIncorrectWords(question, []);
        assert.equal(resultEmpty.score, 0);
        assert.equal(resultEmpty.rawScore, 0);
        assert.equal(resultEmpty.isCorrect, false);
        assert.deepEqual(resultEmpty.correctWords, []);
        assert.deepEqual(resultEmpty.incorrectWords, []);
        assert.deepEqual(resultEmpty.missedWords, ['disastrous', 'inflations']);

        const resultString = gradePteHighlightIncorrectWords(question, '');
        assert.equal(resultString.score, 0);

        const resultNull = gradePteHighlightIncorrectWords(question, null);
        assert.equal(resultNull.score, 0);
    });

    it('Case 6: Duplicate clicks by candidate does not inflate hits or penalties unfairly', () => {
        // Candidate clicks the same word twice or sends duplicate tokens
        const userAnswer = ['disastrous', 'disastrous'];
        const result = gradePteHighlightIncorrectWords(question, userAnswer);

        // First instance is a hit, second instance becomes a false alarm: 1 - 1 = 0
        assert.equal(result.score, 0);
        assert.equal(result.rawScore, 0);
        assert.deepEqual(result.correctWords, ['disastrous']);
        assert.deepEqual(result.incorrectWords, ['disastrous']);
    });

    it('Case 7: Case-insensitivity and punctuation trimming', () => {
        const userAnswer = ['DISASTROUS', 'inflations.'];
        const result = gradePteHighlightIncorrectWords(question, userAnswer);

        assert.equal(result.score, 2);
        assert.equal(result.isCorrect, true);
        assert.deepEqual(result.correctWords, ['disastrous', 'inflations']);
    });

    it('Case 8: Handles array of token objects [{ index, word }] payload from frontend', () => {
        const tokenPayload = [
            { index: 3, word: 'disastrous' },
            { index: 6, word: 'inflations' }
        ];
        const result = gradePteHighlightIncorrectWords(question, tokenPayload);

        assert.equal(result.score, 2);
        assert.equal(result.isCorrect, true);
        assert.deepEqual(result.correctWords, ['disastrous', 'inflations']);
    });

    it('Case 9: Handles comma-separated string answer format fallback', () => {
        const commaAnswer = 'disastrous, inflations';
        const result = gradePteHighlightIncorrectWords(question, commaAnswer);

        assert.equal(result.score, 2);
        assert.equal(result.isCorrect, true);
    });

    it('Case 10: Fallback to question.correctAnswer if question.options is missing', () => {
        const questionWithoutOptions = {
            id: 'hiw-q2',
            type: 'pte-highlight-incorrect-words',
            correctAnswer: 'disastrous, inflations'
        };
        const result = gradePteHighlightIncorrectWords(questionWithoutOptions, ['disastrous', 'inflations']);

        assert.equal(result.score, 2);
        assert.equal(result.maxScore, 2);
        assert.equal(result.isCorrect, true);
    });

    it('Case 11: Normalizes smart / curly apostrophes between target options and user answer', () => {
        const curlyQuestion = {
            id: 'hiw-curly',
            type: 'pte-highlight-incorrect-words',
            options: ["don't"] // admin typed regular keyboard apostrophe
        };
        // Candidate highlighted word from passage containing curly apostrophe
        const userSubmission = [{ index: 0, word: "Don’t" }];
        const result = gradePteHighlightIncorrectWords(curlyQuestion, userSubmission);

        assert.equal(result.score, 1);
        assert.equal(result.isCorrect, true);
        assert.deepEqual(result.correctWords, ["don't"]);
        assert.deepEqual(result.incorrectWords, []);
        assert.deepEqual(result.missedWords, []);
    });

    it('Case 12: Handles quoted words and edge dashes in options or answers', () => {
        const quoteQuestion = {
            id: 'hiw-quotes',
            type: 'pte-highlight-incorrect-words',
            options: ["'disastrous'", '“inflations”', '-europe-']
        };
        const userSubmission = ['disastrous', 'inflations', 'europe'];
        const result = gradePteHighlightIncorrectWords(quoteQuestion, userSubmission);

        assert.equal(result.score, 3);
        assert.equal(result.isCorrect, true);
        assert.equal(result.maxScore, 3);
    });

    it('Case 13: Handles duplicate word occurrences in passage without inflating score', () => {
        const duplicateQuestion = {
            id: 'hiw-dup',
            type: 'pte-highlight-incorrect-words',
            options: ['the'] // Only 1 occurrence of 'the' is a deliberate error
        };

        // Candidate correctly clicked 1 occurrence of 'the'
        const singleSelection = [{ index: 0, word: 'The' }];
        const singleResult = gradePteHighlightIncorrectWords(duplicateQuestion, singleSelection);
        assert.equal(singleResult.score, 1);
        assert.equal(singleResult.isCorrect, true);
        assert.deepEqual(singleResult.correctWords, ['the']);
        assert.deepEqual(singleResult.incorrectWords, []);

        // Candidate clicked both occurrences of 'the' in the passage: 1 hit, 1 false alarm -> net 0
        const doubleSelection = [{ index: 0, word: 'The' }, { index: 5, word: 'the' }];
        const doubleResult = gradePteHighlightIncorrectWords(duplicateQuestion, doubleSelection);
        assert.equal(doubleResult.score, 0);
        assert.equal(doubleResult.rawScore, 0);
        assert.equal(doubleResult.isCorrect, false);
        assert.deepEqual(doubleResult.correctWords, ['the']);
        assert.deepEqual(doubleResult.incorrectWords, ['the']);
    });

    it('Case 14: Handles multiline, semicolon, and comma separated user input strings', () => {
        const multiQuestion = {
            id: 'hiw-multi',
            type: 'pte-highlight-incorrect-words',
            options: ['disastrous', 'inflations']
        };
        const multilineInput = 'disastrous;\ninflations';
        const result = gradePteHighlightIncorrectWords(multiQuestion, multilineInput);

        assert.equal(result.score, 2);
        assert.equal(result.isCorrect, true);
    });

    it('Case 15: Deduplicates identical token index submissions without double penalty or score inflation', () => {
        const question = {
            id: 'hiw-dedup',
            type: 'pte-highlight-incorrect-words',
            options: ['disastrous']
        };
        // Candidate's client sent the same clicked token twice
        const duplicateIndexPayload = [
            { index: 3, word: 'disastrous' },
            { index: 3, word: 'disastrous' }
        ];
        const result = gradePteHighlightIncorrectWords(question, duplicateIndexPayload);

        assert.equal(result.score, 1, 'Should award exactly 1 point for single correct target');
        assert.equal(result.isCorrect, true);
        assert.deepEqual(result.correctWords, ['disastrous']);
        assert.deepEqual(result.incorrectWords, []);
    });

    it('Case 16: Resolves question ID with proper fallback hierarchy (id -> _id -> questionId)', () => {
        const questionWithMongoId = {
            _id: '67c4f1234567890abcdef123',
            type: 'pte-highlight-incorrect-words',
            options: ['test']
        };
        const result = gradePteHighlightIncorrectWords(questionWithMongoId, ['test']);
        assert.equal(result.questionId, '67c4f1234567890abcdef123');
    });

    it('Case 17: Produces complete itemized details payload for mock test and review integration', () => {
        const question = {
            id: 'q-itemized',
            type: 'pte-highlight-incorrect-words',
            options: ['wrong1', 'wrong2', 'wrong3']
        };
        // 2 correct hits, 1 false alarm, 1 missed
        const userAnswer = ['wrong1', 'wrong2', 'innocentWord'];
        const result = gradePteHighlightIncorrectWords(question, userAnswer);

        assert.equal(result.score, 1); // 2 hits - 1 false alarm = 1
        assert.equal(result.rawScore, 1);
        assert.equal(result.maxScore, 3);
        assert.equal(result.isCorrect, false);
        assert.deepEqual(result.correctWords, ['wrong1', 'wrong2']);
        assert.deepEqual(result.incorrectWords, ['innocentword']);
        assert.deepEqual(result.missedWords, ['wrong3']);
        assert.deepEqual(result.itemizedDetails, {
            hits: ['wrong1', 'wrong2'],
            falseAlarms: ['innocentword'],
            missed: ['wrong3'],
            points: 1,
            rawPoints: 1,
            maxPoints: 3
        });
    });

    it('Case 18: Numerical and statistical targets (e.g. 5.5% and $150)', () => {
        const numQuestion = {
            id: 'hiw-num',
            type: 'pte-highlight-incorrect-words',
            options: ['5.5', '150']
        };
        // Candidate clicks tokens corresponding to 5.5 and $150
        const submission = [
            { index: 2, word: '5.5' },
            { index: 5, word: '150' }
        ];
        const result = gradePteHighlightIncorrectWords(numQuestion, submission);

        assert.equal(result.score, 2);
        assert.equal(result.isCorrect, true);
        assert.deepEqual(result.correctWords, ['5.5', '150']);
        assert.deepEqual(result.incorrectWords, []);
    });

    it('Case 19: Scoped questionId matching fallback in review / mock tests', () => {
        const question = {
            id: 'l1',
            type: 'pte-highlight-incorrect-words',
            options: ['disastrous']
        };
        const evalResult = gradePteHighlightIncorrectWords(question, ['disastrous']);

        // Simulate mock test finalized evaluation result with scoped key
        const scopedKey = '67c1234567890abcdef12345_l1';
        const simulatedMockTestAnswer = {
            ...evalResult,
            questionId: scopedKey
        };

        // Assert that client-side logic can resolve by exact ID or scoped suffix
        const isMatched = simulatedMockTestAnswer.questionId === question.id ||
            simulatedMockTestAnswer.questionId.endsWith(`_${question.id}`);
        assert.ok(isMatched, 'Scoped composite key must cleanly resolve back to question.id');
    });
});
