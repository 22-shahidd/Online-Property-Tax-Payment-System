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

// All officer routes require login + officer role
router.use(authMiddleware, roleMiddleware("officer"));

// Helper: get the ward assigned to this officer
async function getOfficerWard(officerId) {
  return await Ward.findOne({ officerId });
}

// GET /api/officer/dashboard - officer statistics
router.get("/dashboard", async (req, res) => {
  try {
    const ward = await getOfficerWard(req.user.id);

    if (!ward) {
      return res.json({
        wardInfo: null,
        pendingProperties: 0,
        verifiedProperties: 0,
        openGrievances: 0,
        offlinePayments: 0,
      });
    }

    const pendingProperties = await Property.countDocuments({
      wardId: ward._id,
      status: "pending",
    });

    const verifiedProperties = await Property.countDocuments({
      wardId: ward._id,
      status: "verified",
    });

    const openGrievances = await Grievance.countDocuments({
      officerId: req.user.id,
      status: { $in: ["open", "in_progress"] },
    });

    // Count offline payments collected by this officer
    const offlinePaymentsAgg = await Payment.aggregate([
      { $match: { mode: "offline", collectedBy: req.user.id } },
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: "$amount" } } },
    ]);

    res.json({
      wardInfo: `Ward ${ward.wardNumber} - ${ward.zone}`,
      pendingProperties,
      verifiedProperties,
      openGrievances,
      offlinePayments: offlinePaymentsAgg.length > 0 ? offlinePaymentsAgg[0].count : 0,
      offlineTotal: offlinePaymentsAgg.length > 0 ? offlinePaymentsAgg[0].total : 0,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/officer/properties - get pending properties in officer's ward
router.get("/properties", async (req, res) => {
  try {
    const ward = await getOfficerWard(req.user.id);
    if (!ward) {
      return res.json([]);
    }

    const properties = await Property.find({ wardId: ward._id, status: "pending" })
      .populate("ownerId", "name email phone")
      .populate("wardId", "wardNumber zone")
      .sort({ createdAt: -1 });

    const result = properties.map((prop) => ({
      ...prop.toJSON(),
      ownerName: prop.ownerId ? prop.ownerId.name : "Unknown",
      ward: prop.wardId ? `Ward ${prop.wardId.wardNumber}` : "N/A",
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT /api/officer/properties/:id/verify - verify a property
router.put("/properties/:id/verify", async (req, res) => {
  try {
    const { id } = req.params;
    const ward = await getOfficerWard(req.user.id);

    if (!ward) {
      return res.status(403).json({ message: "No ward assigned to you" });
    }

    // Find the property and make sure it belongs to this officer's ward
    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    if (property.wardId.toString() !== ward._id.toString()) {
      return res.status(403).json({ message: "This property is not in your ward" });
    }

    property.status = "verified";
    await property.save();

    // Create a tax record for the current assessment year if one does not exist
    const currentYear = new Date().getFullYear();
    let tax = await Tax.findOne({ propertyId: property._id, assessmentYear: currentYear });
    if (!tax) {
      let rates = await Rate.findOne();
      if (!rates) rates = await Rate.create({});

      const baseTax = calculateBaseTax(
        property.area,
        property.propertyType,
        property.constructionYear,
        rates
      );

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 90);

      tax = await Tax.create({
        propertyId: property._id,
        assessmentYear: currentYear,
        baseTax,
        rebate: 0,
        penalty: 0,
        totalDue: baseTax,
        status: "unpaid",
        dueDate,
      });
    }

    res.json({ message: "Property verified successfully", property });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT /api/officer/properties/:id/reject - reject a property
router.put("/properties/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    const ward = await getOfficerWard(req.user.id);

    if (!ward) {
      return res.status(403).json({ message: "No ward assigned to you" });
    }

    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    if (property.wardId.toString() !== ward._id.toString()) {
      return res.status(403).json({ message: "This property is not in your ward" });
    }

    property.status = "rejected";
    await property.save();

    res.json({ message: "Property rejected", property });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/officer/search - search properties by tenement number or owner name
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.json([]);
    }

    // Search using regex and $or operator
    // Also use projection with select() and sort() and limit()
    const properties = await Property.find({
      $or: [
        { tenementNumber: { $regex: q, $options: "i" } },
        { address: { $regex: q, $options: "i" } },
      ],
    })
      .populate("ownerId", "name")
      .populate("wardId", "wardNumber")
      .select("tenementNumber address area propertyType constructionYear status wardId ownerId")
      .sort({ createdAt: -1 })
      .limit(20);

    const result = properties.map((prop) => ({
      ...prop.toJSON(),
      ownerName: prop.ownerId ? prop.ownerId.name : "Unknown",
      ward: prop.wardId ? `Ward ${prop.wardId.wardNumber}` : "N/A",
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/officer/unpaid-taxes - find unpaid taxes for offline payment
router.get("/unpaid-taxes", async (req, res) => {
  try {
    const { q } = req.query;

    // Build aggregation to find unpaid taxes with property and owner info
    let matchStage = { status: "unpaid" };

    const taxes = await Tax.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "properties",
          localField: "propertyId",
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
          from: "wards",
          localField: "property.wardId",
          foreignField: "_id",
          as: "ward",
        },
      },
      { $unwind: { path: "$ward", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          taxId: "$_id",
          baseTax: 1,
          totalDue: 1,
          dueDate: 1,
          assessmentYear: 1,
          tenementNumber: "$property.tenementNumber",
          address: "$property.address",
          propertyType: "$property.propertyType",
          area: "$property.area",
          constructionYear: "$property.constructionYear",
          ownerName: "$owner.name",
          wardNumber: "$ward.wardNumber",
        },
      },
      { $sort: { dueDate: 1 } },
    ]);

    // Filter by search query if provided
    let filtered = taxes;
    if (q && q.trim() !== "") {
      const regex = new RegExp(q, "i");
      filtered = taxes.filter(
        (t) => regex.test(t.tenementNumber) || regex.test(t.ownerName)
      );
    }

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/officer/pay/:taxId - record an offline payment
router.post("/pay/:taxId", async (req, res) => {
  try {
    const { taxId } = req.params;

    const tax = await Tax.findById(taxId);
    if (!tax) {
      return res.status(404).json({ message: "Tax record not found" });
    }

    if (tax.status === "paid") {
      return res.status(400).json({ message: "Tax already paid" });
    }

    // Get current rates
    let rates = await Rate.findOne();
    if (!rates) rates = await Rate.create({});

    // Recalculate the final amount
    const { rebate, penalty, totalDue } = calculateFinalDue(tax.baseTax, tax.dueDate, rates);

    // Generate receipt number starting with OFF
    const receiptNumber = `OFF-${Date.now()}`;

    // Create payment record with this officer as collectedBy
    const payment = await Payment.create({
      taxId: tax._id,
      amount: totalDue,
      mode: "offline",
      receiptNumber,
      collectedBy: req.user.id,
      paidDate: new Date(),
    });

    // Mark tax as paid
    tax.rebate = rebate;
    tax.penalty = penalty;
    tax.totalDue = totalDue;
    tax.status = "paid";
    await tax.save();

    res.json({
      message: "Offline payment recorded successfully",
      receiptNumber,
      amount: totalDue,
      paidDate: payment.paidDate,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/officer/grievances - get grievances assigned to this officer
router.get("/grievances", async (req, res) => {
  try {
    const grievances = await Grievance.find({ officerId: req.user.id })
      .populate("citizenId", "name")
      .populate("propertyId", "tenementNumber address")
      .sort({ createdAt: -1 });

    const result = grievances.map((g) => ({
      ...g.toJSON(),
      citizenName: g.citizenId ? g.citizenId.name : "Unknown",
      tenementNumber: g.propertyId ? g.propertyId.tenementNumber : "N/A",
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT /api/officer/grievances/:id - update grievance status and resolution
router.put("/grievances/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution } = req.body;

    const grievance = await Grievance.findById(id);
    if (!grievance) {
      return res.status(404).json({ message: "Grievance not found" });
    }

    // Only the assigned officer can update
    if (grievance.officerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not assigned to this grievance" });
    }

    if (status) grievance.status = status;
    if (resolution !== undefined) grievance.resolution = resolution;

    await grievance.save();

    res.json({ message: "Grievance updated successfully", grievance });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
