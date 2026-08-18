import PracticeSubmission from '../model/practiceSubmission.js';
import User from '../model/user.js';
import { v2 as cloudinary } from 'cloudinary';

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

export const submitPractice = async (req, res) => {
    try {
        const { questionSetId, testType, title, content, userName, userEmail } = req.body;
        
        if (!req.decoded_email) {
            return res.status(401).json({ success: false, message: 'Unauthorized: No email found in token' });
        }
        
        const user = await User.findOne({ email: req.decoded_email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found in database' });
        }
        
        const userId = user._id;

        if (!questionSetId || !content) {
            return res.status(400).json({ success: false, message: 'Missing required submission data' });
        }

        const submission = new PracticeSubmission({
            userId,
            userName: user.name || userName,
            userEmail: user.email || userEmail,
            questionSetId,
            testType,
            title,
            content,
            institution: user.institution || null
        });

        await submission.save();

        res.status(201).json({ 
            success: true, 
            message: 'Submission received successfully', 
            submission 
        });
    } catch (error) {
        console.error("Submission Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMySubmissions = async (req, res) => {
    try {
        if (!req.decoded_email) {
            return res.status(401).json({ success: false, message: 'Unauthorized: No email found' });
        }

        const submissions = await PracticeSubmission.find({ userEmail: req.decoded_email }).sort({ createdAt: -1 });

        res.status(200).json({ 
            success: true, 
            submissions 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getSubmissions = async (req, res) => {
    try {
        const { status, testType, institutionId, page, limit } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (testType) filter.testType = testType;

        if (req.user && req.user.role === 'instructor') {
            if (req.user.institution) {
                filter.institution = req.user.institution;
            } else {
                filter.institution = null;
            }
        } else if (institutionId) {
            if (institutionId === 'none' || institutionId === 'b2c') {
                filter.institution = null;
            } else {
                filter.institution = institutionId;
            }
        }

        const total = await PracticeSubmission.countDocuments(filter);
        res.set("X-Total-Count", total.toString());
        res.set("Access-Control-Expose-Headers", "X-Total-Count");

        let query = PracticeSubmission.find(filter)
            .populate('userId', 'name email institutionCode')
            .populate('institution', 'name code')
            .sort({ createdAt: -1 });

        if (page || limit) {
            const pageNum = parseInt(page) || 1;
            const limitNum = parseInt(limit) || 10;
            const skip = (pageNum - 1) * limitNum;
            query = query.skip(skip).limit(limitNum);

            const submissions = await query;
            return res.status(200).json({ 
                success: true, 
                submissions,
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            });
        }

        const submissions = await query;
        res.status(200).json({ 
            success: true, 
            submissions,
            total
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const calculateIeltsBand = (scoresList) => {
    if (!scoresList || scoresList.length === 0) return 0;
    const cleanScores = scoresList.map(val => parseFloat(val)).filter(val => !isNaN(val));
    if (cleanScores.length === 0) return 0;
    
    const avg = cleanScores.reduce((sum, val) => sum + val, 0) / cleanScores.length;
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

export const reviewSubmission = async (req, res) => {
    try {
        const { id } = req.params;
        let { score, bandScore, feedback } = req.body;
        
        if (feedback && typeof feedback === 'string' && feedback.trim().startsWith('{') && feedback.trim().endsWith('}')) {
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
                        
                        bandScore = overallBand.toFixed(1);
                        score = Math.round((overallBand / 9.0) * 100);
                        
                        parsed.task1.bandScore = t1Band.toFixed(1);
                        parsed.task2.bandScore = t2Band.toFixed(1);
                        parsed.overallBand = overallBand.toFixed(1);
                        feedback = JSON.stringify(parsed);
                    }
                }
            } catch (e) {
                console.error("Error parsing JSON feedback in practice submission:", e);
            }
        }

        const instructor = await User.findOne({ email: req.decoded_email });
        const reviewedBy = instructor?._id;
        const reviewedByEmail = req.decoded_email;

        const submission = await PracticeSubmission.findByIdAndUpdate(
            id,
            {
                score,
                bandScore,
                feedback,
                status: 'reviewed',
                reviewedBy,
                reviewedByEmail,
                reviewedByName: instructor?.name || req.decoded_email.split('@')[0],
                reviewedAt: new Date(),
                // Clear locks
                lockedBy: null,
                lockedByEmail: null,
                lockExpiresAt: null
            },
            { returnDocument: 'after' }
        );

        if (!submission) {
            return res.status(404).json({ success: false, message: 'Submission not found' });
        }

        res.status(200).json({ 
            success: true, 
            message: 'Submission reviewed successfully', 
            submission 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const lockSubmission = async (req, res) => {
    try {
        const { id } = req.params;
        const instructor = req.user;
        
        // Atomic lock acquisition: only lock if not already locked by someone else
        const lockExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
        const submission = await PracticeSubmission.findOneAndUpdate(
            {
                _id: id,
                $or: [
                    { lockedBy: { $exists: false } },
                    { lockedBy: null },
                    { lockExpiresAt: { $lte: new Date() } },
                    { lockedBy: instructor._id }
                ]
            },
            {
                $set: {
                    lockedBy: instructor._id,
                    lockedByEmail: req.decoded_email,
                    lockedByName: instructor.name || req.decoded_email.split('@')[0],
                    lockExpiresAt: lockExpiresAt
                }
            },
            { returnDocument: 'after' }
        );

        if (!submission) {
            // Check if it exists but is locked by someone else
            const existing = await PracticeSubmission.findById(id);
            if (!existing) {
                return res.status(404).json({ success: false, message: 'Submission not found' });
            }
            return res.status(409).json({ 
                success: false, 
                message: `This submission is currently being reviewed by ${existing.lockedByEmail}`,
                lockedByEmail: existing.lockedByEmail
            });
        }

        res.status(200).json({ 
            success: true, 
            message: 'Submission locked for review', 
            lockExpiresAt: submission.lockExpiresAt 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteSubmission = async (req, res) => {
    try {
        const { id } = req.params;
        const submission = await PracticeSubmission.findByIdAndDelete(id);
        if (!submission) {
            return res.status(404).json({ success: false, message: 'Submission not found' });
        }
        res.status(200).json({ success: true, message: 'Submission deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const bulkDeleteSubmissions = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'No submission IDs provided' });
        }
        const result = await PracticeSubmission.deleteMany({ _id: { $in: ids } });
        res.status(200).json({
            success: true,
            message: `${result.deletedCount} submission(s) deleted successfully`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getUploadSignature = async (req, res) => {
    try {
        if (!process.env.CLOUDINARY_API_SECRET) {
            return res.status(500).json({ success: false, message: 'Cloudinary API Secret is not configured on the server.' });
        }
        const timestamp = Math.round(new Date().getTime() / 1000);
        const folder = 'mockea_speaking_submissions';

        const paramsToSign = {
            timestamp,
            folder
        };

        const signature = cloudinary.utils.api_sign_request(
            paramsToSign,
            process.env.CLOUDINARY_API_SECRET
        );

        res.status(200).json({
            success: true,
            signature,
            timestamp,
            folder,
            apiKey: process.env.CLOUDINARY_API_KEY,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
