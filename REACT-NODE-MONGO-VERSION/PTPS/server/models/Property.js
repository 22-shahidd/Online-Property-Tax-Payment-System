import mongoose from "mongoose";

// Property model - a citizen's registered property
const propertySchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  tenementNumber: { type: String, required: true },
  address: { type: String, required: true },
  wardId: { type: mongoose.Schema.Types.ObjectId, ref: "Ward", required: true },
  area: { type: Number, required: true },
  propertyType: { type: String, enum: ["residential", "commercial", "industrial"], required: true },
  constructionYear: { type: Number, required: true },
  status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Property", propertySchema);
