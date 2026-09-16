import { Router, Request, Response } from "express";
import { Link } from "../models/Link.js";
import { getIOInstance } from "../sockets.js";
import { getGeoIP } from "../utils/geoLookup.js";
import { redisService } from "../services/redisService.js";
import { enqueueClickTelemetry } from "../services/queueService.js";

const router = Router();

// Helper to invalidate link cache
export async function invalidateLinkCache(shortCode: string, customAlias?: string) {
  try {
    await redisService.del(`link:code:${shortCode}`);
    if (customAlias) {
      await redisService.del(`link:code:${customAlias}`);
    }
  } catch (err) {
    console.error("Cache invalidation failed:", err);
  }
}

// Redirect API Endpoint
router.get("/:code", async (req: Request, res: Response): Promise<void> => {
  const { code } = req.params;
  const cacheKey = `link:code:${code}`;

  try {
    let link: any = null;

    // 1. Redis Caching Lookup (Targeting <5ms response latency)
    const cachedLink = await redisService.get(cacheKey);
    if (cachedLink) {
      try {
        link = JSON.parse(cachedLink);
      } catch (err) {
        console.warn("Corrupt JSON in Redis cache, falling back to database", err);
      }
    }

    // 2. Database Fallback & Cache Population
    if (!link) {
      link = await Link.findOne({
        $or: [{ shortCode: code }, { customAlias: code }],
      });

      if (link) {
        // Cache for 1 hour
        await redisService.set(cacheKey, JSON.stringify(link), 3600);
      }
    }

    if (!link) {
      res.status(404).redirect("/?err=not_found");
      return;
    }

    if (link.isArchived) {
      res.status(410).redirect("/?err=archived");
      return;
    }

    // Expiration check
    if (link.expiresAt && new Date(link.expiresAt).getTime() < Date.now()) {
      res.status(410).redirect("/?err=expired");
      return;
    }

    // One-time check
    if (link.isOneTime && link.hasClickedOneTime) {
      res.status(410).redirect("/?err=burned");
      return;
    }

    // Password requirement check
    if (link.password && link.password.trim() !== "") {
      // Direct visitor to the password portal (client site handles form inputs)
      res.redirect(`/unlock/${code}`);
      return;
    }

    // 3. Performance Uplift: Non-Blocking Background Analytics Queue Event
    const payload = {
      linkId: link._id.toString(),
      ip: req.ip || req.headers["x-forwarded-for"]?.toString() || "Anonymous",
      userAgent: req.get("user-agent"),
      referer: req.get("referrer") || "Direct",
      campaignId: link.campaignId?.toString(),
      timestamp: new Date().toISOString(),
    };

    // To prevent race conditions with one-time clicks, burn link synchronously
    if (link.isOneTime) {
      await Link.updateOne({ _id: link._id }, { hasClickedOneTime: true });
      await invalidateLinkCache(link.shortCode, link.customAlias);
    }

    // Push into high-throughput queue and redirect visitor immediately
    await enqueueClickTelemetry(payload);

    res.redirect(302, link.originalUrl);
  } catch (err: any) {
    console.error("Cache/DB routing redirection failure:", err);
    res.status(500).redirect("/?err=server_error");
  }
});

// Endpoint to verify password & redirect
router.post("/unlock/:code", async (req: Request, res: Response): Promise<void> => {
  const { code } = req.params;
  const { password } = req.body;

  try {
    const link = await Link.findOne({
      $or: [{ shortCode: code }, { customAlias: code }],
    });

    if (!link) {
      res.status(404).json({ message: "Short link not found" });
      return;
    }

    if (link.isArchived || (link.isOneTime && link.hasClickedOneTime)) {
      res.status(410).json({ message: "Link is archived or already burned" });
      return;
    }

    if (link.expiresAt && new Date() > link.expiresAt) {
      res.status(410).json({ message: "Link is expired" });
      return;
    }

    if (link.password !== password) {
      res.status(401).json({ message: "Invalid access password specified" });
      return;
    }

    // Capture visitor click via background queue
    const payload = {
      linkId: link._id.toString(),
      ip: req.ip || req.headers["x-forwarded-for"]?.toString() || "Anonymous",
      userAgent: req.get("user-agent"),
      referer: req.get("referrer") || "Direct",
      campaignId: link.campaignId?.toString(),
      timestamp: new Date().toISOString(),
    };

    if (link.isOneTime) {
      link.hasClickedOneTime = true;
      await link.save();
      await invalidateLinkCache(link.shortCode, link.customAlias);
    }

    await enqueueClickTelemetry(payload);

    res.json({ originalUrl: link.originalUrl });
  } catch (err: any) {
    res.status(500).json({ message: "Unlock sequence failed", error: err.message });
  }
});

export default router;
