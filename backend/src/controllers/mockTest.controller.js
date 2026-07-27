import MockTest from '../model/mockTest.js';
import MockTestResult from '../model/mockTestResult.js';
import User from '../model/user.js';
import { cache } from '../utils/cache.js';

const cleanAnswer = (str) => {
    if (!str) return "";
    return str.toLowerCase().trim()
        .replace(/^[a-z]\s*[\.\-\)]\s+/, "")
        .replace(/^[a-z]\s*[\.\-\)]\s*$/, "")
        .replace(/\s+/g, " ")
        .trim();
};

const getLetterPrefix = (str) => {
    if (!str) return "";
    const match = str.trim().match(/^([a-z])\s*[\.\-\)]\s*/i);
    return match ? match[1].toLowerCase() : "";
};

const isAnswerMatching = (correct, user) => {
    if (correct === undefined || correct === null || user === undefined || user === null) return false;
    
    const correctStr = String(correct).trim();
    const userStr = String(user).trim();
    if (!correctStr || !userStr) return false;

    const userClean = userStr.toLowerCase();

    // Split correct answer by '/', ',' or ';' or ' or ' to get all possible valid options
    const options = correctStr.split(/\s*(?:\/|,|;| or )\s*/i).map(opt => opt.trim().toLowerCase()).filter(Boolean);

    for (const option of options) {
        if (option === userClean) return true;

        const optClean = cleanAnswer(option);
        const usrClean = cleanAnswer(userClean);
        if (optClean && usrClean && optClean === usrClean) return true;

        const optLetter = getLetterPrefix(option);
        const usrLetter = getLetterPrefix(userClean);
        if (optLetter && optLetter === userClean) return true;
        if (usrLetter && usrLetter === option) return true;

        // Regex comparison for optional parentheses (e.g. "locker(s)", "hotel (room)")
        try {
            let regexPattern = option;
            regexPattern = regexPattern.replace(/\s*\(([^)]+)\)/g, '__OPT__$1');
            regexPattern = regexPattern.replace(/[-\/\\^$*+?.|[\]{}]/g, '\\$&');
            regexPattern = regexPattern.replace(/__OPT__([a-zA-Z0-9]+)/g, (_, p1) => `(?:\\s*${p1})?`);
            
            const regex = new RegExp(`^${regexPattern}$`, 'i');
            if (regex.test(userClean) || regex.test(usrClean)) return true;
        } catch (e) {
            // Fallback silent
        }
    }

    return false;
};

// Get all mock tests (Library)
export const getAllMockTests = async (req, res) => {
    try {
        const email = req.decoded_email;
        let examPreference = "IELTS";
        let userRole = "student";
        let userPlan = "free";
        let userId = null;

        if (email) {
            const userObj = await User.findOne({ email });
            if (userObj) {
                userId = userObj._id;
                if (userObj.targetExam) {
                    examPreference = userObj.targetExam;
                }
                if (userObj.role) {
                    userRole = userObj.role;
                }
                if (userObj.plan) {
                    userPlan = userObj.plan;
                }
            }
        }

        // Enforce Free plan view block
        if (userRole !== "admin" && userRole !== "instructor" && userPlan === "free") {
            return res.status(200).json({ success: true, tests: [], todayMockTestTaken: false });
        }

        const filter = {};

        // Admins see ALL mock tests regardless of examType
        // Students see tests matching their preference, or legacy tests without examType
        if (userRole !== "admin") {
            if (examPreference === "IELTS") {
                filter.$or = [
                    { examType: { $in: ["IELTS", "BOTH"] } },
                    { examType: { $exists: false } },
                    { examType: null }
                ];
            } else if (examPreference === "PTE") {
                filter.$or = [
                    { examType: { $in: ["PTE", "BOTH"] } },
                    { examType: { $exists: false } },
                    { examType: null }
                ];
            }
            // BOTH: no filter — student sees everything
        }

        const tests = await MockTest.find(filter)
            .populate('sections.reading', 'title category subType testType duration')
            .populate('sections.listening', 'title category subType testType duration')
            .populate('sections.writing', 'title category subType testType duration')
            .populate('sections.speaking', 'title category subType testType duration')
            .lean();

        // Check if standard user took a test today
        let todayMockTestTaken = false;
        if (userRole !== "admin" && userRole !== "instructor" && userPlan === "standard" && userId) {
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            
            const testToday = await MockTestResult.findOne({
                userId,
                createdAt: { $gte: startOfToday }
            });
            if (testToday) {
                todayMockTestTaken = true;
            }
        }

        res.status(200).json({ success: true, tests, todayMockTestTaken });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get single mock test by ID
export const getMockTestById = async (req, res) => {
    try {
        const { id } = req.params;
        const cacheKey = `mocktest:${id}`;

        let test = await cache.get(cacheKey);

        if (!test) {
            test = await MockTest.findById(id)
                .populate('sections.reading')
                .populate('sections.listening')
                .populate('sections.writing')
                .populate('sections.speaking');
            
            if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
            await cache.set(cacheKey, test, 3600); // Cache for 1 hour
        }

        // Plan tier authorization check
        const userObj = req.user;
        if (!userObj) {
            return res.status(404).json({ success: false, message: 'User not found in session' });
        }

        if (userObj.role !== 'admin' && userObj.role !== 'instructor') {
            const planHierarchy = { free: 1, standard: 2, premium: 3 };
            const userPlan = userObj.plan || 'free';
            const testRequiredPlan = test.planType || 'free';
            if (planHierarchy[userPlan] < planHierarchy[testRequiredPlan]) {
                return res.status(403).json({
                    success: false,
                    message: `Access Denied: This is a ${testRequiredPlan} mock test. Please upgrade your plan to access it.`
                });
            }
        }

        res.status(200).json({ success: true, test });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Start a test
export const startTest = async (req, res) => {
    try {
        const { testId } = req.body;
        const userObj = req.user;

        if (!userObj) {
            return res.status(404).json({ success: false, message: 'User not found in session' });
        }

        // Block admins and instructors
        if (userObj.role === 'admin' || userObj.role === 'instructor') {
            return res.status(403).json({ 
                success: false, 
                message: 'Access Denied: Admins and Instructors are not permitted to take mock tests.' 
            });
        }

        if (userObj.plan === 'free') {
            return res.status(403).json({ 
                success: false, 
                message: 'Free tier users cannot access mock tests. Please upgrade your plan to Standard or Premium.' 
            });
        }

        // Fetch the test to verify tier permissions
        const test = await MockTest.findById(testId);
        if (!test) {
            return res.status(404).json({ success: false, message: 'Test not found' });
        }

        const planHierarchy = { free: 1, standard: 2, premium: 3 };
        const userPlan = userObj.plan || 'free';
        const testRequiredPlan = test.planType || 'free';
        if (planHierarchy[userPlan] < planHierarchy[testRequiredPlan]) {
            return res.status(403).json({
                success: false,
                message: `Access Denied: This is a ${testRequiredPlan} mock test. Please upgrade your plan to access it.`
            });
        }

        if (userObj.plan === 'standard') {
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            const testToday = await MockTestResult.findOne({
                userId: userObj._id,
                createdAt: { $gte: startOfToday }
            });
            if (testToday) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Access Denied: Standard plan users are limited to 1 mock test per day. Please upgrade to Premium for unlimited access.' 
                });
            }
        }

        const result = new MockTestResult({ userId: userObj._id, testId });
        await result.save();
        res.status(201).json({ success: true, resultId: result._id });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Submit a section result
export const submitSection = async (req, res) => {
    try {
        const { resultId, sectionType, answers, timeTaken } = req.body;
        const result = await MockTestResult.findById(resultId);
        
        if (!result) return res.status(404).json({ success: false, message: 'Result session not found' });

        if (result.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const formattedAnswers = Object.entries(answers).map(([qId, val]) => ({
            questionId: qId,
            userAnswer: val
        }));

        result.sectionResults.push({ 
            sectionType, 
            answers: formattedAnswers, 
            timeTaken,
            isGraded: false
        });
        
        await result.save();
        res.status(200).json({ success: true, message: 'Section submitted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Anti-cheat stats
export const updateCheatStats = async (req, res) => {
    try {
        const { resultId, tabSwitches, fullscreenExits } = req.body;
        const result = await MockTestResult.findById(resultId);

        if (!result) return res.status(404).json({ success: false, message: 'Result session not found' });

        if (result.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const safeTabSwitches = Math.max(0, Number(tabSwitches) || 0);
        const safeFullscreenExits = Math.max(0, Number(fullscreenExits) || 0);
        if (safeTabSwitches > 0) result.tabSwitchCount += safeTabSwitches;
        if (safeFullscreenExits > 0) result.fullscreenExits += safeFullscreenExits;

        if (result.tabSwitchCount >= 3) {
            result.status = 'terminated';
        }

        await result.save();
        res.status(200).json({ success: true, status: result.status });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Finalize test & Auto-grade Reading/Listening
export const finalizeTest = async (req, res) => {
    try {
        const { resultId, isTerminated } = req.body;
        const result = await MockTestResult.findById(resultId).populate({
            path: 'testId',
            populate: { path: 'sections.reading sections.listening sections.writing sections.speaking' }
        });

        if (!result) return res.status(404).json({ success: false, message: 'Result session not found' });

        if (result.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        for (let section of result.sectionResults) {
            if (['reading', 'listening'].includes(section.sectionType)) {
                const questionSets = result.testId.sections[section.sectionType] || [];
                
                // Map all answers to include their original question details first
                // Map all questions in the test section to include user answers (if any) in the correct order
                const mappedAnswers = [];
                for (const qSet of questionSets) {
                    const qs = qSet.questions || [];
                    for (const q of qs) {
                        const scopedKey = `${qSet._id}_${q.id}`;
                        const foundAns = section.answers.find(ans => ans.questionId === scopedKey);
                        
                        mappedAnswers.push({
                            ans: {
                                questionId: scopedKey,
                                userAnswer: foundAns ? foundAns.userAnswer : ""
                            },
                            originalQ: q
                        });
                    }
                }

                // Group consecutive multiple-selection questions that share the same question text
                const groups = [];
                let currentGroup = null;

                for (let i = 0; i < mappedAnswers.length; i++) {
                    const item = mappedAnswers[i];
                    const q = item.originalQ;

                    if (q && q.type === 'multiple-selection') {
                        const qText = q.question ? q.question.trim().toLowerCase() : "";
                        if (currentGroup && currentGroup.qText === qText) {
                            currentGroup.items.push(item);
                        } else {
                            currentGroup = {
                                type: 'multiple-selection',
                                qText,
                                items: [item]
                            };
                            groups.push(currentGroup);
                        }
                    } else {
                        currentGroup = null;
                        groups.push({
                            type: 'single',
                            item
                        });
                    }
                }

                // Grade each group
                let correctCount = 0;
                const finalAnswers = [];

                for (const group of groups) {
                    if (group.type === 'multiple-selection') {
                        const correctAnswers = group.items.map(it => it.originalQ?.correctAnswer).filter(Boolean);
                        const cleanCorrectAnswers = correctAnswers.map(ans => ans.toLowerCase().trim());

                        group.items.forEach(it => {
                            const userAns = (it.ans.userAnswer || "").toLowerCase().trim();
                            let isCorrect = false;

                            if (userAns) {
                                const matchIdx = cleanCorrectAnswers.findIndex(cAns => {
                                    return isAnswerMatching(cAns, userAns);
                                });
                                if (matchIdx !== -1) {
                                    isCorrect = true;
                                    cleanCorrectAnswers.splice(matchIdx, 1);
                                }
                            }

                            if (isCorrect) correctCount++;
                            finalAnswers.push({
                                ...it.ans,
                                isCorrect,
                                correctAnswer: it.originalQ?.correctAnswer
                            });
                        });
                    } else {
                        const it = group.item;
                        const hasCorrectAnswer = it.originalQ && it.originalQ.correctAnswer != null;
                        const isCorrect = hasCorrectAnswer && isAnswerMatching(it.originalQ.correctAnswer, it.ans.userAnswer || '');
                        if (isCorrect) correctCount++;
                        finalAnswers.push({
                            ...it.ans,
                            isCorrect,
                            correctAnswer: it.originalQ?.correctAnswer
                        });
                    }
                }

                section.answers = finalAnswers;
                section.score = correctCount;
                section.isGraded = true;
            }
        }

        if (isTerminated || result.status === 'terminated' || result.tabSwitchCount >= 3) {
            await MockTestResult.findByIdAndDelete(resultId);
            return res.status(200).json({ success: true, message: 'Test session discarded' });
        } else {
            result.status = 'completed';
            await result.save();
            res.status(200).json({ success: true, message: 'Test finalized' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get results for current user
export const getUserResults = async (req, res) => {
    try {
        const results = await MockTestResult.find({ userId: req.user._id })
            .populate('testId', 'title')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, results });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get single result details for review
export const getResultDetail = async (req, res) => {
    try {
        const result = await MockTestResult.findById(req.params.id)
            .populate({
                path: 'testId',
                populate: { path: 'sections.reading sections.listening sections.writing sections.speaking' }
            });

        if (!result) return res.status(404).json({ success: false, message: 'Result not found' });

        // Security: Ensure student only sees their own results
        if (req.user.role !== 'admin' && req.user.role !== 'instructor' && result.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        res.status(200).json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all results (For Instructors)
export const getAllResults = async (req, res) => {
    try {
        const { page, limit } = req.query;
        const total = await MockTestResult.countDocuments();

        res.set("X-Total-Count", total.toString());
        res.set("Access-Control-Expose-Headers", "X-Total-Count");

        let query = MockTestResult.find()
            .populate('userId', 'name email')
            .populate('testId', 'title')
            .sort({ createdAt: -1 });

        if (page || limit) {
            const pageNum = parseInt(page) || 1;
            const limitNum = parseInt(limit) || 10;
            const skip = (pageNum - 1) * limitNum;
            query = query.skip(skip).limit(limitNum);

            const results = await query;
            return res.status(200).json({ 
                success: true, 
                results,
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            });
        }

        const results = await query;
        res.status(200).json({ success: true, results, total });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const calculateIeltsBand = (scoresList) => {
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

export const gradeSection = async (req, res) => {
    try {
        let { resultId, sectionType, score, feedback } = req.body;
        const result = await MockTestResult.findById(resultId);

        if (!result) return res.status(404).json({ success: false, message: 'Result not found' });

        const section = result.sectionResults.find(s => s.sectionType === sectionType);
        if (!section) return res.status(404).json({ success: false, message: 'Section not found' });

        if (sectionType === 'writing' && feedback && typeof feedback === 'string' && feedback.trim().startsWith('{') && feedback.trim().endsWith('}')) {
            try {
                const parsed = JSON.parse(feedback);
                if (parsed.task1 && parsed.task2) {
                    const t1c = parsed.task1.criteria || {};
                    const t1Scores = [t1c.ta, t1c.cc, t1c.lr, t1c.gra].map(parseFloat).filter(s => !isNaN(s));
                    
                    const t2c = parsed.task2.criteria || {};
                    const t2Scores = [t2c.tr, t2c.cc, t2c.lr, t2c.gra].map(parseFloat).filter(s => !isNaN(s));

                    if (t1Scores.length === 4 && t2Scores.length === 4) {
                        const t1Band = calculateIeltsBand(t1Scores);
                        const t2Band = calculateIeltsBand(t2Scores);
                        const overallBand = calculateIeltsBand([t1Band, t2Band, t2Band]);
                        
                        score = overallBand;
                        
                        parsed.task1.bandScore = t1Band.toFixed(1);
                        parsed.task2.bandScore = t2Band.toFixed(1);
                        parsed.overallBand = overallBand.toFixed(1);
                        feedback = JSON.stringify(parsed);
                    }
                }
            } catch (e) {
                console.error("Error parsing JSON feedback in mock writing grading:", e);
            }
        }

        const instructor = req.user;

        section.score = score;
        if (feedback !== undefined) {
            section.feedback = feedback;
        }
        section.isGraded = true;
        section.reviewedBy = instructor._id;
        section.reviewedByEmail = req.decoded_email;
        section.reviewedByName = instructor.name || req.decoded_email.split('@')[0];
        section.reviewedAt = new Date();

        // Clear locks if this was the last section to grade (optional logic, but let's clear it anyway if explicitly graded)
        result.lockedBy = null;
        result.lockedByEmail = null;
        result.lockExpiresAt = null;

        await result.save();
        res.status(200).json({ success: true, message: 'Graded successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const lockMockResult = async (req, res) => {
    try {
        const { id } = req.params;
        const instructor = req.user;
        
        const result = await MockTestResult.findById(id);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Result session not found' });
        }

        // Check if already locked by someone else
        if (result.lockedBy && result.lockedBy.toString() !== instructor._id.toString() && result.lockExpiresAt > new Date()) {
            return res.status(409).json({ 
                success: false, 
                message: `This test is currently being reviewed by ${result.lockedByEmail}`,
                lockedByEmail: result.lockedByEmail
            });
        }

        // Set lock for 1 hour
        result.lockedBy = instructor._id;
        result.lockedByEmail = req.decoded_email;
        result.lockedByName = instructor.name || req.decoded_email.split('@')[0];
        result.lockExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await result.save();

        res.status(200).json({ 
            success: true, 
            message: 'Test locked for review', 
            lockExpiresAt: result.lockExpiresAt 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Admin Mock Test CRUD
export const createMockTest = async (req, res) => {
    try {
        const { title, description, planType, isPublic, totalDuration, sections } = req.body;
        const newTest = new MockTest({ title, description, planType, isPublic, totalDuration, sections });
        await newTest.save();
        res.status(201).json({ success: true, test: newTest });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateMockTest = async (req, res) => {
    try {
        const { title, description, planType, isPublic, totalDuration, sections } = req.body;
        const test = await MockTest.findByIdAndUpdate(
            req.params.id,
            { title, description, planType, isPublic, totalDuration, sections },
            { returnDocument: 'after' }
        );
        await cache.del(`mocktest:${req.params.id}`);
        res.status(200).json({ success: true, test });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteMockTest = async (req, res) => {
    try {
        await MockTest.findByIdAndDelete(req.params.id);
        await cache.del(`mocktest:${req.params.id}`);
        res.status(200).json({ success: true, message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteMockResult = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await MockTestResult.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Result not found' });
        }
        res.status(200).json({ success: true, message: 'Mock test result deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
