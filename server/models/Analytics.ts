import mongoose from "mongoose";

const AnalyticsSchema = new mongoose.Schema(
  {
    linkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Link",
      required: true,
      index: true,
    },
    ip: {
      type: String,
      default: "Anonymous",
    },
    country: {
      type: String,
      default: "Unknown",
    },
    city: {
      type: String,
      default: "Unknown",
    },
    device: {
      type: String,
      default: "Desktop", // Desktop, Mobile, Tablet, Tablet/Mobile, etc.
    },
    os: {
      type: String,
      default: "Unknown",
    },
    browser: {
      type: String,
      default: "Unknown",
    },
    referrer: {
      type: String,
      default: "Direct",
    },
    isUnique: {
      type: Boolean,
      default: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false, // Use custom timestamp
  }
);

// Helpful compound indexes for aggregation
AnalyticsSchema.index({ linkId: 1, timestamp: -1 });
AnalyticsSchema.index({ linkId: 1, country: 1 });
AnalyticsSchema.index({ linkId: 1, os: 1, browser: 1 });

export const Analytics = mongoose.model("Analytics", AnalyticsSchema);
