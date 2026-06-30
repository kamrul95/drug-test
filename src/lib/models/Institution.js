import mongoose from "mongoose";

const InstitutionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, default: null, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Institution || mongoose.model("Institution", InstitutionSchema);
