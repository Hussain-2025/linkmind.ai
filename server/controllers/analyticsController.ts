import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { Link } from "../models/Link.js";
import { Analytics } from "../models/Analytics.js";
import mongoose from "mongoose";

// @desc    Get consolidated global analytics for the user's entire account
// @route   GET /api/analytics/dashboard
// @access  Protected
export async function getDashboardOverview(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id;

  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Locate all links for user
    const links = await Link.find({ userId: userObjectId });
    const linkIds = links.map((l) => l._id);

    if (linkIds.length === 0) {
      res.json({
        totals: {
          totalLinks: 0,
          totalClicks: 0,
          uniqueClicks: 0,
        },
        deviceStats: [],
        browserStats: [],
        countryStats: [],
        referrerStats: [],
        clickTimeline: [],
        topLinks: [],
      });
      return;
    }

    // Overall Totals
    const totalClicks = await Analytics.countDocuments({ linkId: { $in: linkIds } });
    const uniqueClicks = await Analytics.countDocuments({ linkId: { $in: linkIds }, isUnique: true });

    // Device distribution across all links
    const deviceStats = await Analytics.aggregate([
      { $match: { linkId: { $in: linkIds } } },
      { $group: { _id: "$device", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Browser distribution
    const browserStats = await Analytics.aggregate([
      { $match: { linkId: { $in: linkIds } } },
      { $group: { _id: "$browser", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Country distribution
    const countryStats = await Analytics.aggregate([
      { $match: { linkId: { $in: linkIds } } },
      { $group: { _id: "$country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Referrer distribution
    const referrerStats = await Analytics.aggregate([
      { $match: { linkId: { $in: linkIds } } },
      { $group: { _id: "$referrer", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Aggregated Timeline (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const clickTimeline = await Analytics.aggregate([
      {
        $match: {
          linkId: { $in: linkIds },
          timestamp: { $gte: thirtyDaysAgo },
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

    // Top Links by Click Count
    const topLinksAggregation = await Analytics.aggregate([
      { $match: { linkId: { $in: linkIds } } },
      { $group: { _id: "$linkId", clicks: { $sum: 1 } } },
      { $sort: { clicks: -1 } },
      { $limit: 5 },
    ]);

    // Populate top links meta
    const topLinks = await Promise.all(
      topLinksAggregation.map(async (item) => {
        const link = await Link.findById(item._id).select("shortCode originalUrl customAlias description clicks");
        return {
          ...link?.toObject(),
          clicks: item.clicks,
        };
      })
    );

    res.json({
      totals: {
        totalLinks: linkIds.length,
        totalClicks,
        uniqueClicks,
      },
      deviceStats,
      browserStats,
      countryStats,
      referrerStats,
      clickTimeline,
      topLinks,
    });
  } catch (err: any) {
    console.error("Dashboard overview extraction failed:", err);
    res.status(500).json({ message: "Dashboard aggregation engine failed", error: err.message });
  }
}

// @desc    Export visitor analytics logs to CSV or JSON formats
// @route   GET /api/analytics/export
// @access  Protected
export async function exportAnalyticsReport(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id;
  const { linkId, campaignId, startDate, endDate, format = "csv" } = req.query;

  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // 1. Gather all links belonging to user matching criteria
    const linkQuery: any = { userId: userObjectId };
    if (linkId) {
      linkQuery._id = new mongoose.Types.ObjectId(linkId as string);
    }
    if (campaignId) {
      linkQuery.campaignId = new mongoose.Types.ObjectId(campaignId as string);
    }

    const links = await Link.find(linkQuery);
    const linkIds = links.map((l) => l._id);

    if (linkIds.length === 0) {
      res.status(404).json({ message: "No links found for the specified export parameters." });
      return;
    }

    // 2. Query Analytics matching link IDs and date durations
    const analyticsQuery: any = { linkId: { $in: linkIds } };
    if (startDate || endDate) {
      analyticsQuery.timestamp = {};
      if (startDate) {
        analyticsQuery.timestamp.$gte = new Date(startDate as string);
      }
      if (endDate) {
        analyticsQuery.timestamp.$lte = new Date(endDate as string);
      }
    }

    // Fetch click logs sorted from newest to oldest
    const clicks = await Analytics.find(analyticsQuery).sort({ timestamp: -1 });

    // Link ID to Meta visual dictionary
    const linkDict: { [key: string]: { code: string; url: string } } = {};
    links.forEach((l) => {
      linkDict[l._id.toString()] = {
        code: l.customAlias || l.shortCode,
        url: l.originalUrl,
      };
    });

    const timestampStr = new Date().toISOString().replace(/[:.]/g, "-");

    // 3. Render and stream CSV format
    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="linkmind_analytics_${timestampStr}.csv"`);

      // CSV Header
      let csvContent = "\uFEFF"; // UTF-8 BOM representation for Excel loading
      csvContent += "Event ID,Timestamp,Short Code,Destination URL,IP Address,Country,City,Device,Operating System,Web Browser,Referrer,Is Unique Visitor\r\n";

      clicks.forEach((clk) => {
        const meta = linkDict[clk.linkId.toString()] || { code: "N/A", url: "N/A" };
        const cleanReferrer = clk.referrer.replace(/"/g, '""');
        const cleanUrl = meta.url.replace(/"/g, '""');

        csvContent += `"${clk._id}","${clk.timestamp.toISOString()}","${meta.code}","${cleanUrl}","${clk.ip}","${clk.country}","${clk.city}","${clk.device}","${clk.os}","${clk.browser}","${cleanReferrer}","${clk.isUnique ? "TRUE" : "FALSE"}"\r\n`;
      });

      res.status(200).send(csvContent);
      return;
    }

    // 4. Render and stream JSON format
    const formattedData = clicks.map((clk) => {
      const meta = linkDict[clk.linkId.toString()] || { code: "N/A", url: "N/A" };
      return {
        id: clk._id,
        timestamp: clk.timestamp,
        shortCode: meta.code,
        destinationUrl: meta.url,
        ip: clk.ip,
        country: clk.country,
        city: clk.city,
        device: clk.device,
        os: clk.os,
        browser: clk.browser,
        referrer: clk.referrer,
        isUnique: clk.isUnique,
      };
    });

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="linkmind_analytics_${timestampStr}.json"`);
    res.status(200).json(formattedData);
  } catch (err: any) {
    console.error("Export Analytics aggregation failed:", err);
    res.status(500).json({ message: "Report export assembler execution failed.", error: err.message });
  }
}
