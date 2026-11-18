import mongoose from "mongoose";

// Ward model - each ward can have one assigned officer
const wardSchema = new mongoose.Schema({
  wardNumber: { type: Number, required: true },
  zone: { type: String, default: "" },
  officerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Ward", wardSchema);
