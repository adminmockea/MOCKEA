import Questions from "../model/questions.js"
import User from "../model/user.js";
import MockTest from "../model/mockTest.js";
import { v2 as cloudinary } from 'cloudinary';
import { cache } from '../utils/cache.js';

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

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

const getCloudinaryPublicId = (url) => {
    try {
        const parts = url.split('/upload/');
        if (parts.length < 2) return null;
        
        let pathAfterUpload = parts[1];
        if (pathAfterUpload.startsWith('v')) {
            const nextSlashIndex = pathAfterUpload.indexOf('/');
            if (nextSlashIndex !== -1) {
                pathAfterUpload = pathAfterUpload.substring(nextSlashIndex + 1);
            }
        }
        
        const dotIndex = pathAfterUpload.lastIndexOf('.');
        if (dotIndex !== -1) {
            pathAfterUpload = pathAfterUpload.substring(0, dotIndex);
        }
        
        return pathAfterUpload;
    } catch (e) {
        console.error("Error parsing Cloudinary URL", e);
        return null;
    }
};

const clearMockTestCacheForQuestion = async (questionId) => {
    try {
        const mockTests = await MockTest.find({
            $or: [
                { 'sections.reading': questionId },
                { 'sections.listening': questionId },
                { 'sections.writing': questionId },
                { 'sections.speaking': questionId }
            ]
        });
        
        for (const test of mockTests) {
            await cache.del(`mocktest:${test._id}`);
            console.log(`Cleared cache for mocktest:${test._id} due to question update`);
        }
    } catch (err) {
        console.error("Failed to clear mock test cache:", err);
    }
};

export const getFreeTierDailyQuestions = async (email, type, questions) => {
    if (!email || !type) {
        return questions.slice(0, 2);
    }
    const normalizedType = type.toLowerCase();
    const dailyCacheKey = `user-daily-questions:${email}:${normalizedType}`;
    const seenCacheKey = `user-seen-questions:${email}:${normalizedType}`;

    // 1. Try to get cached daily questions
    const cachedDailyIds = await cache.get(dailyCacheKey);
    if (Array.isArray(cachedDailyIds) && cachedDailyIds.length > 0) {
        const dailyQuestions = questions.filter(q => cachedDailyIds.includes(q._id.toString()));
        if (dailyQuestions.length >= Math.min(2, questions.length)) {
            return dailyQuestions;
        }
    }

    // 2. Fetch already served question IDs from cache
    let seenIds = await cache.get(seenCacheKey) || [];

    // Filter to find unseen questions
    let unseenQuestions = questions.filter(q => !seenIds.includes(q._id.toString()));

    let selected = [];
    // 3. If unseen pool has at least 2 questions
    if (unseenQuestions.length >= 2) {
        // Shuffle and pick 2
        for (let i = unseenQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [unseenQuestions[i], unseenQuestions[j]] = [unseenQuestions[j], unseenQuestions[i]];
        }
        selected = unseenQuestions.slice(0, 2);
        seenIds = [...new Set([...seenIds, ...selected.map(q => q._id.toString())])];
    } else {
        // 4. Force Reset: If unseen pool has fewer than 2 questions, reset the seen questions list
        let pool = [...questions];
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        selected = pool.slice(0, 2);
        seenIds = selected.map(q => q._id.toString());
    }

    // Cache the daily selected questions with a 1-day (24h) TTL = 86400
    await cache.set(dailyCacheKey, selected.map(q => q._id.toString()), 86400);

    // Cache the updated seen questions list with a 30-day TTL = 2592000
    await cache.set(seenCacheKey, seenIds, 2592000);

    return selected;
};

export const getQuestions = async (req, res) => {
    try {
        const { type } = req.query;
        
        // Fetch student targeted exam track to dynamically segment available modules
        const email = req.decoded_email;
        let examPreference = "IELTS";
        let userRole = "student";

        let userPlan = "free";

        if (email) {
            const userObj = await User.findOne({ email });
            if (userObj) {
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

        const filter = type 
            ? { testType: type.toLowerCase(), isLatest: { $ne: false } } 
            : { isLatest: { $ne: false } };
        
        // Admins and Instructors see ALL questions regardless of plan & examType
        // Students see only questions matching their exam preference & tier limits
        if (userRole !== "admin" && userRole !== "instructor") {
            filter.isActive = { $ne: false };
            filter.isMockOnly = { $ne: true };
            
            const andConditions = [];

            // 1. Exam preference segment
            if (examPreference === "IELTS") {
                andConditions.push({
                    $or: [
                        { examType: { $in: ["IELTS", "BOTH"] } },
                        { examType: { $exists: false } },
                        { examType: null }
                    ]
                });
            } else if (examPreference === "PTE") {
                andConditions.push({
                    $or: [
                        { examType: { $in: ["PTE", "BOTH"] } },
                        { examType: { $exists: false } },
                        { examType: null }
                    ]
                });
            }

            // 2. Subscription Plan/Tier Gating
            const allowedPlans = ["free"];
            if (userPlan === "standard") {
                allowedPlans.push("standard");
            } else if (userPlan === "premium") {
                allowedPlans.push("standard", "premium");
            }

            andConditions.push({
                $or: [
                    { forPlanType: { $in: allowedPlans } },
                    { forPlanType: { $exists: false } },
                    { forPlanType: null }
                ]
            });

            if (andConditions.length > 0) {
                filter.$and = andConditions;
            }
        }
        // Check if user is free plan to block writing/speaking or limit listening/reading to 2 random questions
        if (userRole !== "admin" && userRole !== "instructor" && userPlan === "free") {
            if (type && ['writing', 'speaking'].includes(type.toLowerCase())) {
                return res.status(200).json({
                    success: true,
                    message: `${type} questions are locked on the Free tier. Please upgrade.`,
                    questions: []
                });
            }
        }

        let questions = await Questions.find(filter);

        if (userRole !== "admin" && userRole !== "instructor" && userPlan === "free") {
            questions = await getFreeTierDailyQuestions(email, type || "all", questions);
        }

        if (userRole === "admin" || userRole === "instructor") {
            const mockTests = await MockTest.find({}, 'title sections').lean();
            const questionMockTestMap = {};

            mockTests.forEach(test => {
                ['reading', 'listening', 'writing', 'speaking'].forEach(sectionKey => {
                    const sectionQs = test.sections?.[sectionKey] || [];
                    sectionQs.forEach(qId => {
                        const idStr = qId.toString();
                        if (!questionMockTestMap[idStr]) {
                            questionMockTestMap[idStr] = [];
                        }
                        if (!questionMockTestMap[idStr].some(m => m._id.toString() === test._id.toString())) {
                            questionMockTestMap[idStr].push({
                                _id: test._id,
                                title: test.title
                            });
                        }
                    });
                });
            });

            questions = questions.map(q => {
                const qObj = q.toObject ? q.toObject() : { ...q };
                qObj.usedInMockTests = questionMockTestMap[q._id.toString()] || [];
                return qObj;
            });
        }

        return res.status(200).json({
            success: true,
            message: "Questions fetched successfully",
            questions
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching questions",
            error: error.message
        });
    }
};

export const postQuestion = async (req, res) => {
    try {
        const questionData = req.body;
        const newQuestion = new Questions(questionData);
        await newQuestion.save();
        return res.status(201).json({
            success: true,
            message: "Question created successfully",
            question: newQuestion
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error creating question",
            error: error.message
        });
    }
};

export const getQuestionById = async (req, res) => {
    try {
        const { id } = req.params;
        const cacheKey = `question:${id}`;

        let question = await cache.get(cacheKey);

        if (!question) {
            question = await Questions.findById(id);
            if (!question) {
                return res.status(404).json({ success: false, message: 'Question not found' });
            }
            await cache.set(cacheKey, question, 3600); // Cache for 1 hour
        }

        // Enforce plan-tier checks on individual question sets
        const email = req.decoded_email;
        let userRole = "student";
        let userPlan = "free";

        if (email) {
            const userObj = await User.findOne({ email });
            if (userObj) {
                userRole = userObj.role || "student";
                userPlan = userObj.plan || "free";
            }
        }

        if (userRole !== "admin" && userRole !== "instructor") {
            // General Free tier blocks
            if (userPlan === "free" && ['writing', 'speaking'].includes(question.testType.toLowerCase())) {
                return res.status(403).json({ 
                    success: false, 
                    message: "Access Denied: This practice module is locked on the Free tier. Please upgrade." 
                });
            }

            // Plan tier hierarchy check
            const planHierarchy = { free: 1, standard: 2, premium: 3 };
            const testRequiredPlan = question.forPlanType || 'free';
            if (planHierarchy[userPlan] < planHierarchy[testRequiredPlan]) {
                return res.status(403).json({
                    success: false,
                    message: `Access Denied: This is a ${testRequiredPlan} question set. Please upgrade your plan to access it.`
                });
            }
        }

        return res.status(200).json({
            success: true,
            question
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching question",
            error: error.message
        });
    }
};

export const updateQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        const original = await Questions.findById(id);
        if (!original) {
            return res.status(404).json({ success: false, message: 'Question not found' });
        }

        // Detect structural modifications (different sub-question count, different question IDs, or changed correct answers)
        let isStructuralChange = false;
        
        if (updateData.questions) {
            if (updateData.questions.length !== original.questions.length) {
                isStructuralChange = true;
            } else {
                // Check if any sub-question ID or correct answer has changed
                for (let i = 0; i < updateData.questions.length; i++) {
                    const originalQ = original.questions[i];
                    const updatedQ = updateData.questions[i];
                    
                    if (originalQ.id !== updatedQ.id || originalQ.correctAnswer !== updatedQ.correctAnswer) {
                        isStructuralChange = true;
                        break;
                    }
                }
            }
        }

        if (isStructuralChange) {
            // --- STRUCTURAL CHANGE FLOW ---
            // 1. Deprecate the old document
            original.isLatest = false;
            await original.save();

            // 2. Clone the document and update parameters
            const clonedData = {
                ...original.toObject(),
                ...updateData,
                version: original.version + 1,
                isLatest: true,
                parentQuestionId: original.parentQuestionId || original._id
            };
            
            // Remove MongoDB identification fields so Mongoose creates a brand new document
            delete clonedData._id;
            delete clonedData.createdAt;
            delete clonedData.updatedAt;

            const newVersion = new Questions(clonedData);
            await newVersion.save();

            // 3. Update referencing Mock Tests to point to the new ID
            const testType = original.testType.toLowerCase(); // 'reading', 'listening', 'writing', 'speaking'
            const updateField = `sections.${testType}`;
            
            await MockTest.updateMany(
                { [updateField]: original._id },
                { $set: { [`${updateField}.$`]: newVersion._id } }
            );

            await cache.del(`question:${original._id}`);
            await clearMockTestCacheForQuestion(original._id);
            return res.status(200).json({
                success: true,
                message: "Structural edit detected. Spawned a new version to preserve historical integrity.",
                question: newVersion
            });
        } else {
            // --- MINOR/TEXTUAL CHANGE FLOW ---
            // Standard in-place update
            const updatedQuestion = await Questions.findByIdAndUpdate(id, updateData, { returnDocument: 'after' });
            await cache.del(`question:${id}`);
            await clearMockTestCacheForQuestion(id);
            return res.status(200).json({
                success: true,
                message: "Minor edit executed in-place.",
                question: updatedQuestion
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const question = await Questions.findById(id);
        if (!question) {
            return res.status(404).json({ success: false, message: 'Question not found' });
        }

        // If the question has an audioUrl on Cloudinary, delete it
        if (question.audioUrl && question.audioUrl.includes("res.cloudinary.com")) {
            const publicId = getCloudinaryPublicId(question.audioUrl);
            if (publicId) {
                console.log(`Deleting Cloudinary audio with public ID: ${publicId}`);
                try {
                    await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
                    console.log(`Successfully deleted Cloudinary asset: ${publicId}`);
                } catch (cloudinaryErr) {
                    console.error("Failed to delete asset from Cloudinary:", cloudinaryErr.message);
                }
            }
        }

        await Questions.findByIdAndDelete(id);
        await cache.del(`question:${id}`);
        await clearMockTestCacheForQuestion(id);
        res.status(200).json({ success: true, message: 'Question deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const evaluateQuestions = async (req, res) => {
    try {
        const { questionSetId, answers } = req.body;
        const set = await Questions.findById(questionSetId);

        if (!set) return res.status(404).json({ success: false, message: 'Question set not found' });

        let correctCount = 0;
        const totalQuestions = set.questions.length;

        const mappedQuestions = set.questions.map(q => {
            const userAnswer = answers[q.id] || "";
            return { q, userAnswer };
        });

        // Group consecutive multiple-selection questions that share the same question text
        const groups = [];
        let currentGroup = null;

        for (let i = 0; i < mappedQuestions.length; i++) {
            const item = mappedQuestions[i];
            const q = item.q;

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
        const evaluatedAnswers = [];

        for (const group of groups) {
            if (group.type === 'multiple-selection') {
                const correctAnswers = group.items.map(it => it.q.correctAnswer).filter(Boolean);
                const cleanCorrectAnswers = correctAnswers.map(ans => ans.toLowerCase().trim());

                group.items.forEach(it => {
                    const userAns = (it.userAnswer || "").toLowerCase().trim();
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
                    evaluatedAnswers.push({
                        questionId: it.q.id,
                        userAnswer: it.userAnswer,
                        correctAnswer: it.q.correctAnswer,
                        isCorrect
                    });
                });
            } else {
                const it = group.item;
                const isCorrect = isAnswerMatching(it.q.correctAnswer, it.userAnswer);
                if (isCorrect) correctCount++;
                evaluatedAnswers.push({
                    questionId: it.q.id,
                    userAnswer: it.userAnswer,
                    correctAnswer: it.q.correctAnswer,
                    isCorrect
                });
            }
        }

        const score = Math.round((correctCount / totalQuestions) * 100);

        res.status(200).json({
            success: true,
            score,
            correctAnswers: correctCount,
            totalQuestions,
            evaluatedAnswers
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const bulkUpdateQuestions = async (req, res) => {
    try {
        const { ids, action, value } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid or empty IDs array" });
        }

        if (!["delete", "update-plan", "update-status"].includes(action)) {
            return res.status(400).json({ success: false, message: "Invalid bulk action" });
        }

        if (action === "delete") {
            const questionsToDelete = await Questions.find({ _id: { $in: ids } });
            for (const question of questionsToDelete) {
                if (question.audioUrl && question.audioUrl.includes("res.cloudinary.com")) {
                    const publicId = getCloudinaryPublicId(question.audioUrl);
                    if (publicId) {
                        try {
                            await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
                        } catch (cloudinaryErr) {
                            console.error(`Failed to delete Cloudinary asset for ${question._id}:`, cloudinaryErr.message);
                        }
                    }
                }
                await cache.del(`question:${question._id}`);
                await clearMockTestCacheForQuestion(question._id);
            }
            await Questions.deleteMany({ _id: { $in: ids } });
            return res.status(200).json({ success: true, message: `Successfully deleted ${ids.length} question sets` });
        }

        if (action === "update-plan") {
            await Questions.updateMany({ _id: { $in: ids } }, { $set: { forPlanType: value } });
            for (const id of ids) {
                await cache.del(`question:${id}`);
                await clearMockTestCacheForQuestion(id);
            }
            return res.status(200).json({ success: true, message: `Successfully updated plan to '${value}' for ${ids.length} question sets` });
        }

        if (action === "update-status") {
            const activeBool = value === true || value === "true";
            await Questions.updateMany({ _id: { $in: ids } }, { $set: { isActive: activeBool } });
            for (const id of ids) {
                await cache.del(`question:${id}`);
                await clearMockTestCacheForQuestion(id);
            }
            return res.status(200).json({ success: true, message: `Successfully updated status to ${activeBool ? 'Active' : 'Disabled'} for ${ids.length} question sets` });
        }

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};