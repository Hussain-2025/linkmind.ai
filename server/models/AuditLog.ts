import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    action: {
      type: String,
      required: true, // e.g., 'USER_REGISTER', 'USER_SUSPEND', 'LINK_MALICIOUS_BLOCK', 'LINK_DELETE'
      index: true,
    },
    details: {
      type: String,
      required: true,
    },
    ip: {
      type: String,
      default: "System",
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  }
);

// Auto-clean audit logs older than 90 days to conserve space
AuditLogSchema.index({ timestamp: -1 });

export const AuditLog = mongoose.model("AuditLog", AuditLogSchema);
