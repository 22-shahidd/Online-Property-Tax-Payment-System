import express from "express";
import User from "../models/User.js";
import Ward from "../models/Ward.js";
import Property from "../models/Property.js";
import Tax from "../models/Tax.js";
import Payment from "../models/Payment.js";
import Grievance from "../models/Grievance.js";
import Rate from "../models/Rate.js";
import { authMiddleware, roleMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// All admin routes require login + admin role
router.use(authMiddleware, roleMiddleware("admin"));

// GET /api/admin/dashboard - statistics using aggregation
router.get("/dashboard", async (req, res) => {
  try {
    // Count total citizens
    const totalCitizens = await User.countDocuments({ role: "citizen" });

    // Count properties by status
    const totalProperties = await Property.countDocuments();
    const verifiedProperties = await Property.countDocuments({ status: "verified" });
    const pendingProperties = await Property.countDocuments({ status: "pending" });

    // Total collected using $group and $sum aggregation
    const collectedAgg = await Payment.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalCollected = collectedAgg.length > 0 ? collectedAgg[0].total : 0;

    // Outstanding amount - sum of unpaid taxes
    const outstandingAgg = await Tax.aggregate([
      { $match: { status: "unpaid" } },
      { $group: { _id: null, total: { $sum: "$totalDue" } } },
    ]);
    const outstanding = outstandingAgg.length > 0 ? outstandingAgg[0].total : 0;

    // Open grievances count
    const openGrievances = await Grievance.countDocuments({
      status: { $in: ["open", "in_progress"] },
    });

    // Total payments count
    const totalPayments = await Payment.countDocuments();

    // Recent payments with property and owner info using $lookup
    const recentPayments = await Payment.aggregate([
      {
        $lookup: {
          from: "taxes",
          localField: "taxId",
          foreignField: "_id",
          as: "tax",
        },
      },
      { $unwind: "$tax" },
      {
        $lookup: {
          from: "properties",
          localField: "tax.propertyId",
          foreignField: "_id",
          as: "property",
        },
      },
      { $unwind: "$property" },
      {
        $lookup: {
          from: "users",
          localField: "property.ownerId",
          foreignField: "_id",
          as: "owner",
        },
      },
      { $unwind: "$owner" },
      {
        $project: {
          receiptNumber: 1,
          amount: 1,
          mode: 1,
          paidDate: 1,
          tenementNumber: "$property.tenementNumber",
          ownerName: "$owner.name",
        },
      },
      { $sort: { paidDate: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      totalCitizens,
      totalProperties,
      verifiedProperties,
      pendingProperties,
      totalCollected,
      outstanding,
      openGrievances,
      totalPayments,
      recentPayments,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/admin/rates - get current tax rates
router.get("/rates", async (req, res) => {
  try {
    let rates = await Rate.findOne();
    if (!rates) {
      rates = await Rate.create({});
    }
    res.json(rates);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT /api/admin/rates - update tax rates
router.put("/rates", async (req, res) => {
  try {
    const {
      baseRate,
      residentialFactor,
      commercialFactor,
      industrialFactor,
      rebatePercent,
      penaltyPercent,
      penaltyCap,
    } = req.body;

    let rates = await Rate.findOne();
    if (!rates) {
      rates = await Rate.create({});
    }

    // Update only the fields that are provided
    if (baseRate !== undefined) rates.baseRate = baseRate;
    if (residentialFactor !== undefined) rates.residentialFactor = residentialFactor;
    if (commercialFactor !== undefined) rates.commercialFactor = commercialFactor;
    if (industrialFactor !== undefined) rates.industrialFactor = industrialFactor;
    if (rebatePercent !== undefined) rates.rebatePercent = rebatePercent;
    if (penaltyPercent !== undefined) rates.penaltyPercent = penaltyPercent;
    if (penaltyCap !== undefined) rates.penaltyCap = penaltyCap;

    await rates.save();
    res.json({ message: "Rates updated successfully", rates });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/admin/reports - payment reports with filters
router.get("/reports", async (req, res) => {
  try {
    const { mode, sort, limit } = req.query;

    // Build the match filter
    let matchFilter = {};
    if (mode && mode !== "all") {
      matchFilter.mode = mode; // "online" or "offline"
    }

    // Build the sort option
    let sortOption = { paidDate: -1 }; // default newest first
    if (sort === "oldest") sortOption = { paidDate: 1 };
    if (sort === "amount_high") sortOption = { amount: -1 };
    if (sort === "amount_low") sortOption = { amount: 1 };

    // Parse the limit
    let limitNum = parseInt(limit) || 20;

    // Use aggregation with $lookup to join property and owner info
    const payments = await Payment.aggregate([
      { $match: matchFilter },
      {
        $lookup: {
          from: "taxes",
          localField: "taxId",
          foreignField: "_id",
          as: "tax",
        },
      },
      { $unwind: "$tax" },
      {
        $lookup: {
          from: "properties",
          localField: "tax.propertyId",
          foreignField: "_id",
          as: "property",
        },
      },
      { $unwind: "$property" },
      {
        $lookup: {
          from: "users",
          localField: "property.ownerId",
          foreignField: "_id",
          as: "owner",
        },
      },
      { $unwind: "$owner" },
      {
        $lookup: {
          from: "users",
          localField: "collectedBy",
          foreignField: "_id",
          as: "collector",
        },
      },
      {
        $project: {
          receiptNumber: 1,
          amount: 1,
          mode: 1,
          paidDate: 1,
          tenementNumber: "$property.tenementNumber",
          propertyType: "$property.propertyType",
          ownerName: "$owner.name",
          collectedByName: {
            $ifNull: [{ $arrayElemAt: ["$collector.name", 0] }, "Citizen portal"],
          },
        },
      },
      { $sort: sortOption },
      { $limit: limitNum },
    ]);

    // Calculate grand total of the filtered results
    const totalAgg = await Payment.aggregate([
      { $match: matchFilter },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $count: {} } } },
    ]);

    const grandTotal = totalAgg.length > 0 ? totalAgg[0].total : 0;
    const totalCount = totalAgg.length > 0 ? totalAgg[0].count : 0;

    res.json({ payments, grandTotal, totalCount, shownCount: payments.length });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/admin/users - list all users with optional role filter
router.get("/users", async (req, res) => {
  try {
    const { role } = req.query;

    let filter = {};
    if (role && role !== "all") {
      filter.role = role;
    }

    // Use select() projection to exclude password
    const users = await User.find(filter).select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT /api/admin/users/:id/status - activate or deactivate a user
router.put("/users/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Do not allow admin to deactivate their own account
    if (id === req.user.id) {
      return res.status(400).json({ message: "You cannot change your own account status" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User status updated", user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/admin/wards - list all wards
router.get("/wards", async (req, res) => {
  try {
    const wards = await Ward.find().populate("officerId", "name email phone");
    res.json(wards);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/admin/officers - create a new officer
router.post("/officers", async (req, res) => {
  try {
    const { name, email, phone, password, wardId } = req.body;

    if (!name || !email || !phone || !password || !wardId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Create the officer account
    const officer = await User.create({
      name,
      email,
      phone,
      password,
      role: "officer",
      status: "active",
    });

    // Assign officer to the ward
    await Ward.findByIdAndUpdate(wardId, { officerId: officer._id });

    res.status(201).json({ message: "Officer created successfully", officer });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/admin/officers - list all officers with their ward
router.get("/officers", async (req, res) => {
  try {
    // Find all officers
    const officers = await User.find({ role: "officer" }).select("-password");

    // Find their assigned wards
    const wards = await Ward.find({ officerId: { $in: officers.map((o) => o._id) } });

    // Attach ward info to each officer
    const officersWithWards = officers.map((officer) => {
      const ward = wards.find((w) => w.officerId && w.officerId.toString() === officer._id.toString());
      return {
        ...officer.toJSON(),
        ward: ward ? `Ward ${ward.wardNumber}` : "Not assigned",
      };
    });

    res.json(officersWithWards);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
