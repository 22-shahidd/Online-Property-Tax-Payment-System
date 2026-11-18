import express from "express";
import Ward from "../models/Ward.js";
import Property from "../models/Property.js";
import Tax from "../models/Tax.js";
import Payment from "../models/Payment.js";
import Grievance from "../models/Grievance.js";
import Rate from "../models/Rate.js";
import { authMiddleware, roleMiddleware } from "../middleware/authMiddleware.js";
import { calculateBaseTax, calculateFinalDue } from "../utils/taxCalculator.js";

const router = express.Router();

// All citizen routes require login + citizen role
router.use(authMiddleware, roleMiddleware("citizen"));

// GET /api/citizen/dashboard - citizen statistics
router.get("/dashboard", async (req, res) => {
  try {
    const userId = req.user.id;

    const myProperties = await Property.countDocuments({ ownerId: userId });
    const verifiedProperties = await Property.countDocuments({ ownerId: userId, status: "verified" });
    const openGrievances = await Grievance.countDocuments({
      citizenId: userId,
      status: { $in: ["open", "in_progress"] },
    });

    // Total due - sum of unpaid taxes for this citizen's properties
    const outstandingAgg = await Tax.aggregate([
      {
        $lookup: {
          from: "properties",
          localField: "propertyId",
          foreignField: "_id",
          as: "property",
        },
      },
      { $unwind: "$property" },
      { $match: { "property.ownerId": userId, status: "unpaid" } },
      { $group: { _id: null, total: { $sum: "$totalDue" } } },
    ]);
    const totalDue = outstandingAgg.length > 0 ? outstandingAgg[0].total : 0;

    res.json({ myProperties, verifiedProperties, totalDue, openGrievances });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/citizen/wards - get all wards for the dropdown
router.get("/wards", async (req, res) => {
  try {
    const wards = await Ward.find().sort({ wardNumber: 1 });
    res.json(wards);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/citizen/properties - list the citizen's properties
router.get("/properties", async (req, res) => {
  try {
    const userId = req.user.id;

    // Find properties owned by this citizen, populate ward info
    const properties = await Property.find({ ownerId: userId })
      .populate("wardId", "wardNumber zone")
      .sort({ createdAt: -1 });

    // For each verified property, find unpaid tax to show tax due
    const propertiesWithTax = await Promise.all(
      properties.map(async (prop) => {
        let taxDue = 0;
        if (prop.status === "verified") {
          const tax = await Tax.findOne({
            propertyId: prop._id,
            status: "unpaid",
          });
          if (tax) taxDue = tax.totalDue;
        }
        return {
          ...prop.toJSON(),
          ward: prop.wardId ? `Ward ${prop.wardId.wardNumber}` : "N/A",
          taxDue,
        };
      })
    );

    res.json(propertiesWithTax);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/citizen/properties - register a new property
router.post("/properties", async (req, res) => {
  try {
    const { tenementNumber, wardId, address, area, propertyType, constructionYear } = req.body;

    // Validate all fields
    if (!tenementNumber || !wardId || !address || !area || !propertyType || !constructionYear) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (area <= 0) {
      return res.status(400).json({ message: "Area must be greater than zero" });
    }

    const currentYear = new Date().getFullYear();
    if (constructionYear > currentYear) {
      return res.status(400).json({ message: "Construction year cannot be in the future" });
    }

    // Create the property with status pending
    const property = await Property.create({
      ownerId: req.user.id,
      tenementNumber,
      wardId,
      address,
      area,
      propertyType,
      constructionYear,
      status: "pending",
    });

    res.status(201).json({ message: "Property registered successfully", property });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/citizen/taxes - get verified properties with tax info
router.get("/taxes", async (req, res) => {
  try {
    const userId = req.user.id;

    // Find verified properties for this citizen
    const properties = await Property.find({ ownerId: userId, status: "verified" })
      .populate("wardId", "wardNumber zone")
      .sort({ createdAt: -1 });

    // Get current rates for calculation
    let rates = await Rate.findOne();
    if (!rates) rates = await Rate.create({});

    const currentYear = new Date().getFullYear();

    // For each property, create tax if not exists, then calculate current amount
    const results = await Promise.all(
      properties.map(async (prop) => {
        // Check if tax already exists for this year
        let tax = await Tax.findOne({
          propertyId: prop._id,
          assessmentYear: currentYear,
        });

        if (!tax) {
          // Create a new tax record
          const baseTax = calculateBaseTax(
            prop.area,
            prop.propertyType,
            prop.constructionYear,
            rates
          );

          // Due date is 90 days from now
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 90);

          tax = await Tax.create({
            propertyId: prop._id,
            assessmentYear: currentYear,
            baseTax,
            rebate: 0,
            penalty: 0,
            totalDue: baseTax,
            status: "unpaid",
            dueDate,
          });
        }

        // Recalculate the current final amount (rebate or penalty may change)
        const { rebate, penalty, totalDue } = calculateFinalDue(
          tax.baseTax,
          tax.dueDate,
          rates
        );

        return {
          propertyId: prop._id,
          tenementNumber: prop.tenementNumber,
          address: prop.address,
          propertyType: prop.propertyType,
          area: prop.area,
          ward: prop.wardId ? `Ward ${prop.wardId.wardNumber}` : "N/A",
          taxId: tax._id,
          baseTax: tax.baseTax,
          rebate,
          penalty,
          totalDue,
          status: tax.status,
          dueDate: tax.dueDate,
        };
      })
    );

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/citizen/pay/:taxId - pay tax online (simulated)
router.post("/pay/:taxId", async (req, res) => {
  try {
    const { taxId } = req.params;

    // Find the tax record
    const tax = await Tax.findById(taxId);
    if (!tax) {
      return res.status(404).json({ message: "Tax record not found" });
    }

    if (tax.status === "paid") {
      return res.status(400).json({ message: "Tax already paid" });
    }

    // Verify this tax belongs to the logged-in citizen
    const property = await Property.findById(tax.propertyId);
    if (!property || property.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Get current rates
    let rates = await Rate.findOne();
    if (!rates) rates = await Rate.create({});

    // Recalculate the final amount
    const { rebate, penalty, totalDue } = calculateFinalDue(tax.baseTax, tax.dueDate, rates);

    // Generate receipt number starting with ONL
    const receiptNumber = `ONL-${Date.now()}`;

    // Create payment record
    const payment = await Payment.create({
      taxId: tax._id,
      amount: totalDue,
      mode: "online",
      receiptNumber,
      collectedBy: null, // citizen pays online, no officer
      paidDate: new Date(),
    });

    // Mark tax as paid
    tax.rebate = rebate;
    tax.penalty = penalty;
    tax.totalDue = totalDue;
    tax.status = "paid";
    await tax.save();

    res.json({
      message: "Payment successful",
      receiptNumber,
      amount: totalDue,
      paidDate: payment.paidDate,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/citizen/grievances - list citizen's grievances
router.get("/grievances", async (req, res) => {
  try {
    const userId = req.user.id;

    const grievances = await Grievance.find({ citizenId: userId })
      .populate("propertyId", "tenementNumber address")
      .populate("officerId", "name")
      .sort({ createdAt: -1 });

    res.json(grievances);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/citizen/grievances - submit a new grievance
router.post("/grievances", async (req, res) => {
  try {
    const { propertyId, subject, description } = req.body;

    if (!propertyId || !subject || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Verify the property belongs to this citizen
    const property = await Property.findById(propertyId);
    if (!property || property.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "This property does not belong to you" });
    }

    // Find the officer assigned to this property's ward
    const ward = await Ward.findById(property.wardId);
    const officerId = ward && ward.officerId ? ward.officerId : null;

    const grievance = await Grievance.create({
      citizenId: req.user.id,
      propertyId,
      subject,
      description,
      status: "open",
      resolution: "",
      officerId,
    });

    res.status(201).json({ message: "Grievance submitted successfully", grievance });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
