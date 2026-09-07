import mongoose from "mongoose";

const visitorLogSchema = new mongoose.Schema(
  {
    ip: {
      type: String,
      required: true,
      index: true,
    },
    country: {
      type: String,
      default: "Unknown",
    },
    countryCode: {
      type: String,
      default: "UN",
      uppercase: true,
      trim: true,
    },
    city: {
      type: String,
      default: "Unknown",
    },
    region: {
      type: String,
      default: "",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    userEmail: {
      type: String,
      default: null,
    },
    userName: {
      type: String,
      default: null,
    },
    userRole: {
      type: String,
      default: "guest",
    },
    path: {
      type: String,
      required: true,
    },
    referrer: {
      type: String,
      default: "",
    },
    device: {
      type: String,
      enum: ["desktop", "mobile", "tablet", "other"],
      default: "desktop",
    },
    browser: {
      type: String,
      default: "Other",
    },
    os: {
      type: String,
      default: "Other",
    },
    sessionId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// 90-day TTL index to automatically purge stale logs and prevent unbounded collection growth
visitorLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Composite indexes for fast time-series & geographic aggregation
visitorLogSchema.index({ createdAt: -1 });
visitorLogSchema.index({ countryCode: 1, createdAt: -1 });
visitorLogSchema.index({ userId: 1, createdAt: -1 });
visitorLogSchema.index({ sessionId: 1, createdAt: -1 });

const VisitorLog = mongoose.model("VisitorLog", visitorLogSchema);
export default VisitorLog;
