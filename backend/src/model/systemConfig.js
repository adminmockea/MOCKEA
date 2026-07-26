import mongoose from "mongoose";

const systemConfigSchema = new mongoose.Schema(
  {
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    maintenanceMessage: {
      type: String,
      default: "MOCKEA is currently undergoing scheduled maintenance. Please check back shortly.",
    },
    featureFlags: {
      aiGrading: { type: Boolean, default: true },
      antiCheatTabSwitch: { type: Boolean, default: true },
      speakingPracticeBeta: { type: Boolean, default: false },
      promoDiscountActive: { type: Boolean, default: false },
    },
    systemNotice: {
      active: { type: Boolean, default: false },
      message: { type: String, default: "" },
      type: { type: String, enum: ["info", "warning", "error"], default: "info" },
    },
    rateLimits: {
      globalLimit: { type: Number, default: 60 },
      authLimit: { type: Number, default: 10 },
      submitLimit: { type: Number, default: 5 },
    },
    watchDemoUrl: {
      type: String,
      default: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    },
    watchDemoEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// We keep a single configuration document in the database
const SystemConfig = mongoose.model("SystemConfig", systemConfigSchema);
export default SystemConfig;
