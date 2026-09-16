import { Router, Response } from "express";
import { protect, AuthenticatedRequest } from "../middleware/auth.js";
import { ApiKey } from "../models/ApiKey.js";
import crypto from "crypto";

const router = Router();

router.use(protect as any);

// @desc    List all API Keys for the authenticated user
// @route   GET /api/keys
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const keys = await ApiKey.find({ userId: req.user?.id }).sort({ createdAt: -1 });
    res.json(keys);
  } catch (err: any) {
    res.status(500).json({ message: "Failed listing API keys", error: err.message });
  }
});

// @desc    Generate a new API Key
// @route   POST /api/keys
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  const { name, scopes, expiresDays } = req.body;

  if (!name || name.trim() === "") {
    res.status(400).json({ message: "API Key descriptive name is required." });
    return;
  }

  try {
    // Generate a strong random key prefixed with lm_live_
    const randomSecret = crypto.randomBytes(30).toString("hex");
    const rawApiKey = `lm_live_${randomSecret}`;

    // Hash using SHA-256 for secure storage (never store raw keys)
    const keyHash = crypto.createHash("sha256").update(rawApiKey).digest("hex");
    
    // Mask visual tracker prefix
    const keyPrefix = `lm_live_••••${rawApiKey.slice(-4)}`;

    // Calculate expiration if days provided
    let expiresAt: Date | undefined;
    if (expiresDays && parseInt(expiresDays) > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiresDays));
    }

    const newKey = await ApiKey.create({
      userId: req.user?.id,
      name: name.trim(),
      keyHash,
      keyPrefix,
      scopes: scopes || ["links:read", "links:write", "analytics:read"],
      expiresAt,
    });

    // Provide the original raw secret ONCE for visual copying
    res.status(211).json({
      message: "API Key generated successfully! Please record it securely as it will not be displayed again.",
      keyMetadata: newKey,
      rawApiKey,
    });
  } catch (err: any) {
    res.status(500).json({ message: "API Key creation failed", error: err.message });
  }
});

// @desc    Revoke/Delete an API Key
// @route   DELETE /api/keys/:id
router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const deleted = await ApiKey.findOneAndDelete({ _id: id, userId: req.user?.id });
    if (!deleted) {
      res.status(404).json({ message: "API key not found or unauthorized to revoke." });
      return;
    }
    res.json({ message: "API Key revoked successfully." });
  } catch (err: any) {
    res.status(500).json({ message: "Failed revoking API key", error: err.message });
  }
});

export default router;
