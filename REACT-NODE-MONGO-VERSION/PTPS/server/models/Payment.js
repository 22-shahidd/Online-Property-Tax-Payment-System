import mongoose from "mongoose";

// Payment model - records each tax payment (online or offline)
const paymentSchema = new mongoose.Schema({
  taxId: { type: mongoose.Schema.Types.ObjectId, ref: "Tax", required: true },
  amount: { type: Number, required: true },
  mode: { type: String, enum: ["online", "offline"], required: true },
  receiptNumber: { type: String, required: true },
  collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  paidDate: { type: Date, default: Date.now },
});

export default mongoose.model("Payment", paymentSchema);
