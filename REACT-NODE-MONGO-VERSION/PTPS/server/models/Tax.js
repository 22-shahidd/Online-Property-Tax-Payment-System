import mongoose from "mongoose";

// Tax model - one tax record per property per assessment year
const taxSchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
  assessmentYear: { type: Number, required: true },
  baseTax: { type: Number, default: 0 },
  rebate: { type: Number, default: 0 },
  penalty: { type: Number, default: 0 },
  totalDue: { type: Number, default: 0 },
  status: { type: String, enum: ["unpaid", "paid"], default: "unpaid" },
  dueDate: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Tax", taxSchema);
