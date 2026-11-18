import mongoose from "mongoose";

// Rate model - tax calculation rates, only one document needed
// Uses Number (double) values for all rate fields
const rateSchema = new mongoose.Schema({
  baseRate: { type: Number, default: 2.0 },
  residentialFactor: { type: Number, default: 1.0 },
  commercialFactor: { type: Number, default: 1.7 },
  industrialFactor: { type: Number, default: 2.2 },
  rebatePercent: { type: Number, default: 5 },
  penaltyPercent: { type: Number, default: 1 },
  penaltyCap: { type: Number, default: 1500 },
});

export default mongoose.model("Rate", rateSchema);
