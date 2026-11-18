import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import citizenRoutes from "./routes/citizenRoutes.js";
import officerRoutes from "./routes/officerRoutes.js";

const app = express();``

// Middleware to parse JSON bodies
app.use(express.json());

// Allow requests from the frontend
app.use(cors());

// Connect to MongoDB
const MONGO_URI = "mongodb://127.0.0.1:27017/property_tax_db";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB - property_tax_db"))
  .catch((err) => console.error("MongoDB connection error:", err.message));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/citizen", citizenRoutes);
app.use("/api/officer", officerRoutes);

// Simple health check route
app.get("/", (req, res) => {
  res.json({ message: "Nagarpalika Property Tax System API is running" });
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
