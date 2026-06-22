// src/ server.js

import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";
import { publishScheduledPosts } from "./services/instagramScheduler.js";

dotenv.config();

const PORT = process.env.PORT || 7000;

// Connect to Database
connectDB();

// Start Server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);

  // Run scheduler once on startup, then every 60 seconds
  publishScheduledPosts();
  setInterval(publishScheduledPosts, 60 * 1000);
});
