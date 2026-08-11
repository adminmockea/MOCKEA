import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    ctaText: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      default: "General",
    },
    fileType: {
      type: String,
      required: true,
      default: "PDF",
    },
    size: {
      type: String,
      default: "Unknown size",
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    addedBy: {
      type: String,
      default: "system@mockea.com",
    },
    status: {
      type: String,
      enum: ["Approved", "Pending", "Rejected"],
      default: "Approved",
    },
    isBook: {
      type: Boolean,
      default: true,
    },
    isFeaturedOnRegister: {
      type: Boolean,
      default: false,
    },
    examType: {
      type: String,
      enum: ["PTE", "IELTS", "Both"],
      default: "Both",
    },
  },
  { timestamps: true }
);

const Resource = mongoose.model("Resource", resourceSchema);

export default Resource;
