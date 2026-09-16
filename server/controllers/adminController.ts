import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { Link } from "../models/Link.js";
import { Analytics } from "../models/Analytics.js";
import { AuditLog } from "../models/AuditLog.js";

// @desc    Get platform-wide aggregated administration statistics
// @route   GET /api/admin/stats
// @access  Protected (Admin only)
export async function getAdminStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const totalUsers = await User.countDocuments();
    const totalLinks = await Link.countDocuments();
    const totalClicks = await Analytics.countDocuments();
    const suspendedUsers = await User.countDocuments({ isSuspended: true });

    // Recent platform activity
    const recentAuditLogs = await AuditLog.find()
      .populate("userId", "username email")
      .sort({ timestamp: -1 })
      .limit(10);

    res.json({
      metrics: {
        totalUsers,
        totalLinks,
        totalClicks,
        suspendedUsers,
      },
      recentActivity: recentAuditLogs,
    });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to assemble platform statistics", error: err.message });
  }
}

// @desc    Get all platform users (with pagination and sorting)
// @route   GET /api/admin/users
// @access  Protected (Admin only)
export async function getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { page = 1, limit = 10, search } = req.query;

  try {
    const query: any = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Enriched with links count for each user
    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        const linksCount = await Link.countDocuments({ userId: u._id });
        return {
          ...u.toObject(),
          linksCount,
        };
      })
    );

    res.json({
      users: usersWithStats,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to query user records", error: err.message });
  }
}

// @desc    Toggle administrative suspension of a user account
// @route   PATCH /api/admin/users/:id/suspend
// @access  Protected (Admin only)
export async function toggleSuspendUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ message: "User account could not be found" });
      return;
    }

    if (user.role === "admin") {
      res.status(400).json({ message: "Administrative staff cannot be suspended" });
      return;
    }

    user.isSuspended = !user.isSuspended;
    await user.save();

    // Log the audit event
    await AuditLog.create({
      userId: req.user?.id as any,
      action: "USER_SUSPEND",
      details: `User email: ${user.email} was administratively ${user.isSuspended ? "suspended" : "reactivated"}`,
      ip: req.ip || "127.0.0.1",
    });

    res.json({ id: user._id, isSuspended: user.isSuspended, username: user.username });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to toggle user restriction status", error: err.message });
  }
}

// @desc    Moderator view of platform system-wide links
// @route   GET /api/admin/links
// @access  Protected (Admin only)
export async function getPlatformLinks(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { page = 1, limit = 10, search } = req.query;

  try {
    const query: any = {};
    if (search) {
      query.$or = [
        { originalUrl: { $regex: search, $options: "i" } },
        { shortCode: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const total = await Link.countDocuments(query);
    const links = await Link.find(query)
      .populate("userId", "username email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const enrichedLinks = await Promise.all(
      links.map(async (l) => {
        const clicksCount = await Analytics.countDocuments({ linkId: l._id });
        return {
          ...l.toObject(),
          clicksCount,
        };
      })
    );

    res.json({
      links: enrichedLinks,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to assemble platform-wide links data", error: err.message });
  }
}

// @desc    Platform-wide direct link removal (moderator abuse remediation)
// @route   DELETE /api/admin/links/:id
// @access  Protected (Admin only)
export async function moderateDeleteLink(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const link = await Link.findByIdAndDelete(id);
    if (!link) {
      res.status(404).json({ message: "Target shortened link not found" });
      return;
    }

    // Delete analytic entries
    await Analytics.deleteMany({ linkId: link._id });

    // Mark audit trail
    await AuditLog.create({
      userId: req.user?.id as any,
      action: "LINK_MALICIOUS_BLOCK",
      details: `Administrative override: parsed shortCode: ${link.shortCode} moderated / removed`,
      ip: req.ip || "127.0.0.1",
    });

    res.json({ message: "Link moderated and permanently expunged from system" });
  } catch (err: any) {
    res.status(500).json({ message: "Moderator deletion transaction failed", error: err.message });
  }
}
