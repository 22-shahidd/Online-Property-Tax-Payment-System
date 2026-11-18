import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// POST /api/auth/register - citizen self registration
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Validate all fields
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Create new citizen account - always role citizen, always active
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: "citizen",
      status: "active",
    });

    res.status(201).json({ message: "Account created successfully", user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/auth/login - login with email and password
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Reject inactive accounts
    if (user.status !== "active") {
      return res.status(403).json({ message: "Account is inactive. Contact administrator." });
    }

    // Compare password directly
    if (password !== user.password) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Create a JWT token with user id and role
    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET || "nagarpalika_secret_key",
      { expiresIn: "1d" }
    );

    // Return token and user info (password removed by toJSON in model)
    res.json({
      message: "Login successful",
      token,
      user,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
