import mongoose from "mongoose";

const CampaignSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

CampaignSchema.index({ userId: 1, name: 1 }, { unique: true });

export const Campaign = mongoose.model("Campaign", CampaignSchema);
