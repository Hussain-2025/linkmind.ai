import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { Link } from "../models/Link.js";
import { Campaign } from "../models/Campaign.js";
import { Analytics } from "../models/Analytics.js";
import { AuditLog } from "../models/AuditLog.js";
import { generateAIAnalyticsInsights } from "../services/aiService.js";
import { invalidateLinkCache } from "../routes/redirectRoutes.js";
import QRCode from "qrcode";
import crypto from "crypto";

// URL validation helper
function isValidUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
}

// Generate unique random shortcode
async function generateUniqueCode(length = 6): Promise<string> {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let isUnique = false;
  let code = "";

  while (!isUnique) {
    code = "";
    for (let i = 0; i < length; i++) {
      code += chars.charAt(crypto.randomInt(chars.length));
    }
    const existing = await Link.findOne({ shortCode: code });
    if (!existing) {
      isUnique = true;
    }
  }

  return code;
}

// @desc    Create a shortened link or custom alias
// @route   POST /api/links
// @access  Protected
export async function createLink(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { originalUrl, customAlias, description, password, isOneTime, expiresAt, campaignId } = req.body;
  const userId = req.user?.id;

  try {
    if (!originalUrl) {
      res.status(400).json({ message: "An original URL is required to shorten" });
      return;
    }

    if (!isValidUrl(originalUrl)) {
      res.status(400).json({ message: "Invalid URL format. Links must begin with http:// or https://" });
      return;
    }

    // Safety checks for loops: prevent shortening LinkMind URL redirects
    const serviceHost = process.env.APP_URL || "";
    if (serviceHost && originalUrl.includes(serviceHost)) {
      res.status(400).json({ message: "Recursive link embedding is prohibited" });
      return;
    }

    let code = "";
    if (customAlias) {
      // Clean custom alias of spacing and special characters
      const cleanedAlias = customAlias.trim().replace(/[^a-zA-Z0-9-_]/g, "");
      if (cleanedAlias.length < 3) {
        res.status(400).json({ message: "Custom alias must be at least 3 alphanumeric characters" });
        return;
      }

      const aliasTaken = await Link.findOne({
        $or: [{ shortCode: cleanedAlias }, { customAlias: cleanedAlias }],
      });

      if (aliasTaken) {
        res.status(409).json({ message: "This custom alias is already claimed by another link" });
        return;
      }
      code = cleanedAlias;
    } else {
      code = await generateUniqueCode();
    }

    // Build absolute shortened URL for QR Generation
    const rootUrl = process.env.APP_URL || "http://localhost:3000";
    const shortUrl = `${rootUrl}/r/${code}`;

    // Auto generate QR code
    let qrDataUrl = "";
    try {
      qrDataUrl = await QRCode.toDataURL(shortUrl, {
        errorCorrectionLevel: "H",
        margin: 2,
        color: {
          dark: "#0f172a", // Navy black
          light: "#fafafa", // Off-white canvas
        },
      });
    } catch (qrErr) {
      console.error("QR Code rendering failed:", qrErr);
    }

    // Parse Campaign
    let validatedCampaignId = null;
    if (campaignId) {
      const campaign = await Campaign.findOne({ _id: campaignId, userId });
      if (campaign) {
        validatedCampaignId = campaign._id;
      }
    }

    const newLink = await Link.create({
      userId,
      originalUrl,
      shortCode: code,
      customAlias: customAlias ? code : undefined,
      description: description || "",
      password: password || "",
      isOneTime: !!isOneTime,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      campaignId: validatedCampaignId,
      qrCodeData: qrDataUrl,
    });

    // Logging
    await AuditLog.create({
      userId: userId as any,
      action: "LINK_CREATE",
      details: `Short code: ${code} generated for URL: ${originalUrl}`,
      ip: req.ip || "127.0.0.1",
    });

    res.status(201).json(newLink);
  } catch (err: any) {
    console.error("Create shortened link error:", err);
    res.status(500).json({ message: "Failed to generate shortened link", error: err.message });
  }
}

// @desc    Get user's links (with pagination, filters, searching)
// @route   GET /api/links
// @access  Protected
export async function getLinks(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id;
  const { search, filter, campaignId, page = 1, limit = 10 } = req.query;

  try {
    const query: any = { userId, isArchived: false };

    // Filters
    if (filter === "favorites") {
      query.isFavorite = true;
    } else if (filter === "archived") {
      query.isArchived = true;
    } else if (filter === "one-time") {
      query.isOneTime = true;
    } else if (filter === "expired") {
      query.expiresAt = { $ne: null, $lt: new Date() };
    }

    if (campaignId) {
      query.campaignId = campaignId;
    }

    // Search query
    if (search) {
      query.$or = [
        { originalUrl: { $regex: search, $options: "i" } },
        { shortCode: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const total = await Link.countDocuments(query);
    const links = await Link.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("campaignId", "name");

    res.json({
      links,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to load links catalogue", error: err.message });
  }
}

// @desc    Update link settings
// @route   PUT /api/links/:id
// @access  Protected
export async function updateLink(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user?.id;
  const { originalUrl, description, password, expiresAt, campaignId } = req.body;

  try {
    const link = await Link.findOne({ _id: id, userId });
    if (!link) {
      res.status(404).json({ message: "Link credentials not found" });
      return;
    }

    if (originalUrl) {
      if (!isValidUrl(originalUrl)) {
        res.status(400).json({ message: "Invalid original url schema format" });
        return;
      }
      link.originalUrl = originalUrl;
    }

    if (description !== undefined) link.description = description;
    if (password !== undefined) link.password = password;
    if (expiresAt !== undefined) link.expiresAt = expiresAt ? new Date(expiresAt) : null;

    if (campaignId !== undefined) {
      if (campaignId) {
        const campaign = await Campaign.findOne({ _id: campaignId, userId });
        if (campaign) {
          link.campaignId = campaign._id;
        }
      } else {
        link.campaignId = null;
      }
    }

    await link.save();
    await invalidateLinkCache(link.shortCode, link.customAlias);

    await AuditLog.create({
      userId: userId as any,
      action: "LINK_UPDATE",
      details: `Short url: ${link.shortCode} configurations updated`,
      ip: req.ip || "127.0.0.1",
    });

    res.json(link);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to update link configurations", error: err.message });
  }
}

// @desc    Delete link & corresponding statistics
// @route   DELETE /api/links/:id
// @access  Protected
export async function deleteLink(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const link = await Link.findOneAndDelete({ _id: id, userId });
    if (!link) {
      res.status(404).json({ message: "Shortened link not found" });
      return;
    }

    await invalidateLinkCache(link.shortCode, link.customAlias);

    // Dynamic deletion of cascaded clicks
    await Analytics.deleteMany({ linkId: link._id });

    await AuditLog.create({
      userId: userId as any,
      action: "LINK_DELETE",
      details: `Link and stats purged for shortcode: ${link.shortCode}`,
      ip: req.ip || "127.0.0.1",
    });

    res.json({ message: "Short URL and tracking indices successfully purged" });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to purge link data", error: err.message });
  }
}

// @desc    Toggle link favorite status
// @route   PATCH /api/links/:id/favorite
// @access  Protected
export async function toggleFavorite(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const link = await Link.findOne({ _id: id, userId });
    if (!link) {
      res.status(404).json({ message: "No link matching specifications" });
      return;
    }

    link.isFavorite = !link.isFavorite;
    await link.save();

    res.json({ id: link._id, isFavorite: link.isFavorite });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to modify priority setting", error: err.message });
  }
}

// @desc    Toggle link archive status
// @route   PATCH /api/links/:id/archive
// @access  Protected
export async function toggleArchive(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const link = await Link.findOne({ _id: id, userId });
    if (!link) {
      res.status(404).json({ message: "No link matching code details" });
      return;
    }

    link.isArchived = !link.isArchived;
    await link.save();
    await invalidateLinkCache(link.shortCode, link.customAlias);

    res.json({ id: link._id, isArchived: link.isArchived });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to toggle archive status", error: err.message });
  }
}

// @desc    Get detailed link metrics & charts aggregation
// @route   GET /api/links/:id/stats
// @access  Protected
export async function getLinkStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const link = await Link.findOne({ _id: id, userId });
    if (!link) {
      res.status(404).json({ message: "Link metrics could not be located" });
      return;
    }

    const totalClicks = await Analytics.countDocuments({ linkId: link._id });
    const uniqueClicks = await Analytics.countDocuments({ linkId: link._id, isUnique: true });

    // Aggregations
    // Devices
    const deviceStats = await Analytics.aggregate([
      { $match: { linkId: link._id } },
      { $group: { _id: "$device", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Browsers
    const browserStats = await Analytics.aggregate([
      { $match: { linkId: link._id } },
      { $group: { _id: "$browser", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Countries
    const countryStats = await Analytics.aggregate([
      { $match: { linkId: link._id } },
      { $group: { _id: "$country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Referrers
    const referrerStats = await Analytics.aggregate([
      { $match: { linkId: link._id } },
      { $group: { _id: "$referrer", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Graph click progression over past 15 days
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    fifteenDaysAgo.setHours(0, 0, 0, 0);

    const matchTimeline = await Analytics.aggregate([
      {
        $match: {
          linkId: link._id,
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

    // Hourly Distribution (0-23 UTC)
    const hourlyAggregation = await Analytics.aggregate([
      { $match: { linkId: link._id } },
      { $group: { _id: { $hour: "$timestamp" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const hourlyDistribution = Array.from({ length: 24 }, (_, i) => {
      const dbHour = hourlyAggregation.find((h) => h._id === i);
      return { hour: i, count: dbHour ? dbHour.count : 0 };
    });

    res.json({
      link,
      metrics: {
        totalClicks,
        uniqueClicks,
        deviceStats,
        browserStats,
        countryStats,
        referrerStats,
        clickTimeline: matchTimeline,
        hourlyDistribution,
      },
    });
  } catch (err: any) {
    console.error("Link stats aggregation failed:", err);
    res.status(500).json({ message: "Aggregation pipeline processing failed", error: err.message });
  }
}

// @desc    Obtain AI insights on link performance
// @route   POST /api/links/:id/ai-insights
// @access  Protected
export async function getLinkAIInsights(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const link = await Link.findOne({ _id: id, userId });
    if (!link) {
      res.status(404).json({ message: "Link not found for diagnostic AI insights" });
      return;
    }

    // Assemble analytics summary parameter object
    const totalClicks = await Analytics.countDocuments({ linkId: link._id });
    const uniqueClicks = await Analytics.countDocuments({ linkId: link._id, isUnique: true });

    const deviceStats = await Analytics.aggregate([
      { $match: { linkId: link._id } },
      { $group: { _id: "$device", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const browserStats = await Analytics.aggregate([
      { $match: { linkId: link._id } },
      { $group: { _id: "$browser", count: { $sum: 1 } } },
    ]);

    const referrerStats = await Analytics.aggregate([
      { $match: { linkId: link._id } },
      { $group: { _id: "$referrer", count: { $sum: 1 } } },
    ]);

    const countryStats = await Analytics.aggregate([
      { $match: { linkId: link._id } },
      { $group: { _id: "$country", count: { $sum: 1 } } },
    ]);

    const hourlyAggregation = await Analytics.aggregate([
      { $match: { linkId: link._id } },
      { $group: { _id: { $hour: "$timestamp" }, count: { $sum: 1 } } },
    ]);

    const hourlyDistribution = Array.from({ length: 24 }, (_, i) => {
      const dbHour = hourlyAggregation.find((h) => h._id === i);
      return { hour: i, count: dbHour ? dbHour.count : 0 };
    });

    const insights = await generateAIAnalyticsInsights(
      {
        originalUrl: link.originalUrl,
        shortCode: link.shortCode,
        description: link.description,
      },
      {
        totalClicks,
        uniqueClicks,
        deviceStats,
        browserStats,
        referrerStats,
        countryStats,
        hourlyDistribution,
      }
    );

    res.json({ insights });
  } catch (err: any) {
    console.error("Link AI Insights extraction failed:", err);
    res.status(500).json({ message: "AI Insights engine error", error: err.message });
  }
}
