import mongoose, { Schema, Document } from "mongoose";

export interface IApiKey extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  keyHash: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

const ApiKeySchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true, trim: true },
  keyHash: { type: String, required: true, unique: true },
  keyPrefix: { type: String, required: true },
  scopes: { type: [String], default: ["links:read", "links:write", "analytics:read"] },
  lastUsedAt: { type: Date },
  expiresAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

// Index by keyHash for super-fast lookups in under 1ms
ApiKeySchema.index({ keyHash: 1 });

export const ApiKey = mongoose.model<IApiKey>("ApiKey", ApiKeySchema);
