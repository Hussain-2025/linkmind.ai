import dotenv from "dotenv";
dotenv.config();

import { connectDB, disconnectDB } from "../config/db.js";
import { User } from "../models/User.js";

async function seed(): Promise<void> {
  console.log("=== LinkMind AI Seeding Utility ===");
  try {
    // 1. Establish database connection
    await connectDB();

    // 2. Setup credentials
    const adminEmail = "admin@linkmind.ai";
    const adminUsername = "LinkMind Super Admin";
    const adminPassword = "Password@123";

    // 3. Duplicate Prevention for Super Admin
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      existingAdmin.username = adminUsername;
      existingAdmin.password = adminPassword;
      existingAdmin.role = "admin";
      await existingAdmin.save();
      console.log("Admin already exists - updated/reset credentials successfully");
      console.log("--------------------------------------------------");
      console.log(`Email:    ${adminEmail}`);
      console.log(`Password: ${adminPassword}`);
      console.log(`Role:     admin`);
      console.log("--------------------------------------------------");
    } else {
      // Create admin user - password will be hashed via the pre-save hook automatically
      const adminUser = new User({
        username: adminUsername,
        email: adminEmail,
        password: adminPassword,
        role: "admin",
      });

      await adminUser.save();
      console.log("Admin seeded successfully");
      console.log("--------------------------------------------------");
      console.log(`Email:    ${adminEmail}`);
      console.log(`Password: ${adminPassword}`);
      console.log(`Role:     admin`);
      console.log("--------------------------------------------------");
    }

    console.log("\nAll seeding tasks processed successfully.");
  } catch (err) {
    const error = err as Error;
    console.error("An error occurred during database seeding:", error.message);
    process.exitCode = 1;
  } finally {
    // 5. Safely terminate DB connection
    await disconnectDB();
    process.exit(process.exitCode || 0);
  }
}

// Execute Seeding Trigger Loop
seed();
