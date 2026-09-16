import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { Campaign } from "../models/Campaign.js";
import { Link } from "../models/Link.js";
import { Analytics } from "../models/Analytics.js";

// @desc    Create a new marketing campaign Group
// @route   POST /api/campaigns
// @access  Protected
export async function createCampaign(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { name, description } = req.body;
  const userId = req.user?.id;

  try {
    if (!name) {
      res.status(400).json({ message: "Campaign name is required" });
      return;
    }

    const trimmedName = name.trim();
    const existing = await Campaign.findOne({ userId, name: trimmedName });
    if (existing) {
      res.status(409).json({ message: "You already have a campaign folder with this exact name" });
      return;
    }

    const campaign = await Campaign.create({
      userId,
      name: trimmedName,
      description: description || "",
    });

    res.status(201).json(campaign);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to provision campaign environment", error: err.message });
  }
}

// @desc    Get all active campaigns
// @route   GET /api/campaigns
// @access  Protected
export async function getCampaigns(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id;

  try {
    const campaigns = await Campaign.find({ userId }).sort({ createdAt: -1 });
    
    // Inject link count for each campaign
    const enrichedCampaigns = await Promise.all(
      campaigns.map(async (c) => {
        const linkCount = await Link.countDocuments({ campaignId: c._id });
        return {
          ...c.toObject(),
          linkCount,
        };
      })
    );

    res.json(enrichedCampaigns);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to pull campaigns list", error: err.message });
  }
}

// @desc    Delete a campaign folder
// @route   DELETE /api/campaigns/:id
// @access  Protected
export async function deleteCampaign(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const campaign = await Campaign.findOneAndDelete({ _id: id, userId });
    if (!campaign) {
      res.status(404).json({ message: "Campaign folder not found" });
      return;
    }

    // Detach any grouped links rather than deleting them Cascade-style (soft release)
    await Link.updateMany({ campaignId: campaign._id }, { campaignId: null });

    res.json({ message: "Campaign disassembled successfully. Grouped links released." });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to destroy campaign group", error: err.message });
  }
}

// @desc    Get consolidated campaign stats & analytics
// @route   GET /api/campaigns/:id/stats
// @access  Protected
export async function getCampaignStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const campaign = await Campaign.findOne({ _id: id, userId });
    if (!campaign) {
      res.status(404).json({ message: "Campaign context not found" });
      return;
    }

    const campaignLinks = await Link.find({ campaignId: campaign._id });
    const linkIds = campaignLinks.map((l) => l._id);

    // Sum aggregate clicks
    const totalClicks = await Analytics.countDocuments({ linkId: { $in: linkIds } });
    const uniqueClicks = await Analytics.countDocuments({ linkId: { $in: linkIds }, isUnique: true });

    // Click timeline aggregated (last 15 days)
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    fifteenDaysAgo.setHours(0, 0, 0, 0);

    const matchTimeline = await Analytics.aggregate([
      {
        $match: {
          linkId: { $in: linkIds },
          timestamp: { $gte: fifteenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          clicks: { $sum: 1 },
          unique: { $sum: { $cond: [{ $eq: ["$isUnique", true] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Country splits
    const countryStats = await Analytics.aggregate([
      { $match: { linkId: { $in: linkIds } } },
      { $group: { _id: "$country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Device splits
    const deviceStats = await Analytics.aggregate([
      { $match: { linkId: { $in: linkIds } } },
      { $group: { _id: "$device", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      campaign,
      links: campaignLinks,
      metrics: {
        totalClicks,
        uniqueClicks,
        clickTimeline: matchTimeline,
        countryStats,
        deviceStats,
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to assemble aggregated campaign graphics", error: err.message });
  }
}
