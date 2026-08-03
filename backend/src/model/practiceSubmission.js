import mongoose from 'mongoose';

const PracticeSubmissionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        userEmail: {
            type: String,
            required: true,
        },
        userName: {
            type: String,
            required: true,
        },
        questionSetId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Questions',
            required: true,
        },
        testType: {
            type: String,
            enum: ['writing', 'speaking'],
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        content: {
            type: String, // Text for writing, Audio URL for speaking
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'reviewed'],
            default: 'pending',
        },
        score: {
            type: Number,
        },
        bandScore: {
            type: String,
        },
        feedback: {
            type: String,
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        reviewedByEmail: {
            type: String,
        },
        reviewedByName: {
            type: String,
        },
        reviewedAt: {
            type: Date,
        },
        lockedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        lockedByEmail: {
            type: String,
        },
        lockedByName: {
            type: String,
        },
        lockExpiresAt: {
            type: Date,
        },
        institution: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Institution',
            default: null,
        }
    },
    { timestamps: true }
);

PracticeSubmissionSchema.index({ userId: 1 });
PracticeSubmissionSchema.index({ questionSetId: 1 });
PracticeSubmissionSchema.index({ status: 1 });
PracticeSubmissionSchema.index({ userEmail: 1 });
PracticeSubmissionSchema.index({ institution: 1 });

const PracticeSubmission = mongoose.model('PracticeSubmission', PracticeSubmissionSchema);
export default PracticeSubmission;
