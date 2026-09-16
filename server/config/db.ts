import mongoose from "mongoose";

let mongod: any = null;

export async function connectDB() {
  try {
    let uri = process.env.MONGODB_URI;

    // Check if MONGODB_URI is absent, default placeholder, or empty
    const isLocalFallback = !uri || uri.includes("username:password") || uri.trim() === "";

    if (isLocalFallback) {
      console.log("No custom MONGODB_URI found. Provisioning MongoMemoryServer local fallback...");
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      console.log(`MongoMemoryServer started in-memory: ${uri}`);
    }

    if (!uri) {
      throw new Error("Failed to determine MongoDB connection URI");
    }

    mongoose.set("strictQuery", true);
    await mongoose.connect(uri);
    console.log(`Successfully connected to MongoDB (${isLocalFallback ? "Local Memory" : "Atlas Production"})`);
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  }
}

export async function disconnectDB() {
  try {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
    console.log("Disconnected from MongoDB database successfully");
  } catch (err) {
    console.error("Error shutting down MongoDB:", err);
  }
}
