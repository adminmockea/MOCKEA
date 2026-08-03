import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      default: "student",
    },
    plan: {
      type: String,
      enum: ["free", "standard", "premium"],
      default: "free",
    },
    targetExam: {
      type: String,
      enum: ["IELTS", "PTE", "BOTH"],
      default: "IELTS",
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", "Prefer not to say"],
      default: null,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    lastNotificationsReadAt: {
      type: Date,
      default: Date.now,
    },
    fcmTokens: {
      type: [String],
      default: [],
    },
    planExpiresAt: {
      type: Date,
      default: null,
    },
    planDurationType: {
      type: String,
      enum: ["months", "custom", "infinite", null],
      default: null,
    },
    planAssignedAt: {
      type: Date,
      default: null,
    },
    planSource: {
      type: String,
      enum: ["admin_manual", "payment_gateway", "system_default"],
      default: "system_default",
    },
    lastTransactionId: {
      type: String,
      default: null,
    },
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      default: null,
    },
    institutionCode: {
      type: String,
      uppercase: true,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ plan: 1, planExpiresAt: 1 });
userSchema.index({ institution: 1 });
userSchema.index({ institutionCode: 1 });

const User = mongoose.model("User", userSchema);
export default User;