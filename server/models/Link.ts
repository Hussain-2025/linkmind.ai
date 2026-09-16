import mongoose from "mongoose";

const LinkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    originalUrl: {
      type: String,
      required: true,
      trim: true,
    },
    shortCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    customAlias: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
    },
    password: {
      type: String,
      default: "", // Empty string means no password protection
    },
    isOneTime: {
      type: Boolean,
      default: false,
    },
    hasClickedOneTime: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      default: null,
      index: true,
    },
    qrCodeData: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes to speed up dashboards
LinkSchema.index({ userId: 1, createdAt: -1 });
LinkSchema.index({ userId: 1, isFavorite: 1 });

export const Link = mongoose.model("Link", LinkSchema);
