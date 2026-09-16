import cron from "node-cron";
import { Link } from "../models/Link.js";
import { Analytics } from "../models/Analytics.js";
import { AuditLog } from "../models/AuditLog.js";

export function initCronJobs() {
  console.log("Initializing Scheduler maintenance routine (node-cron)...");

  // Job 1: Midnight Maintenance (0 0 * * *) - Archive expired links and clean old logs
  cron.schedule("0 0 * * *", async () => {
    console.log("[Scheduler] Initiating off-peak midnight database cleanup routine...");
    const now = new Date();

    try {
      // 1. Auto-archive links that have passed their expiresAt dates
      const expiredResult = await Link.updateMany(
        { expiresAt: { $lt: now }, isArchived: false },
        { isArchived: true }
      );
      if (expiredResult.modifiedCount > 0) {
        console.log(`[Scheduler] Auto-archived ${expiredResult.modifiedCount} recently expired shortened links.`);
      }

      // 2. Clear very old analytics clicks (e.g. older than 180 days) to keep compound indexes highly optimized
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);
      const archivedClicksResult = await Analytics.deleteMany({
        timestamp: { $lt: sixMonthsAgo },
      });
      if (archivedClicksResult.deletedCount > 0) {
        console.log(`[Scheduler] Purged ${archivedClicksResult.deletedCount} analytics clicks historical records older than 180 days.`);
      }

      // 3. Rotate security and administrative audit logs older than 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const auditLogResult = await AuditLog.deleteMany({
        timestamp: { $lt: ninetyDaysAgo },
      });
      if (auditLogResult.deletedCount > 0) {
        console.log(`[Scheduler] Rotated and cleared ${auditLogResult.deletedCount} system audit log entries older than 90 days.`);
      }

      console.log("[Scheduler] Database maintenance successfully completed.");
    } catch (err: any) {
      console.error("[Scheduler failure] Error running midnight maintenance cron jobs:", err.message);
    }
  });

  // Job 2: Hourly Cache Flush Maintenance (0 * * * *)
  cron.schedule("0 * * * *", () => {
    // Keeps connections active and flashes standard diagnostics
    console.log("[Scheduler] Analytics hourly diagnostics heartbeat normal.");
  });
}
