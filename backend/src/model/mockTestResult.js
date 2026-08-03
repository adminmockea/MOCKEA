import mongoose from 'mongoose';

const mockTestResultSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MockTest',
        required: true
    },
    sectionResults: [{
        sectionType: {
            type: String,
            enum: ['reading', 'listening', 'writing', 'speaking']
        },
        answers: [{
            questionId: String,
            userAnswer: String,
            isCorrect: Boolean,
            correctAnswer: String
        }],
        score: Number,
        isGraded: {
            type: Boolean,
            default: false
        },
        feedback: {
            type: String
        },
        timeTaken: Number, // in seconds
        completedAt: {
            type: Date,
            default: Date.now
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reviewedByEmail: {
            type: String
        },
        reviewedByName: {
            type: String
        },
        reviewedAt: {
            type: Date
        }
    }],
    tabSwitchCount: {
        type: Number,
        default: 0
    },
    fullscreenExits: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['ongoing', 'completed', 'auto-submitted', 'terminated'],
        default: 'ongoing'
    },
    lockedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lockedByEmail: {
        type: String
    },
    lockedByName: {
        type: String
    },
    lockExpiresAt: {
        type: Date
    },
    institution: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institution',
        default: null
    }
}, { timestamps: true });

mockTestResultSchema.index({ userId: 1 });
mockTestResultSchema.index({ testId: 1 });
mockTestResultSchema.index({ status: 1 });
mockTestResultSchema.index({ institution: 1 });
mockTestResultSchema.index({ userId: 1, createdAt: -1 });

const MockTestResult = mongoose.model('MockTestResult', mockTestResultSchema);
export default MockTestResult;
