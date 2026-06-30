import mongoose from "mongoose";

export const RESULTS = { POSITIVE: "positive", NEGATIVE: "negative" };

const DrugTestSchema = new mongoose.Schema(
  {
    person: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    serialNumber: { type: String, required: true, trim: true }, // kit serial number
    institution: { type: mongoose.Schema.Types.ObjectId, ref: "Institution", required: true },
    result: { type: String, enum: [RESULTS.POSITIVE, RESULTS.NEGATIVE], required: true },
    testDate: { type: Date, required: true },
    notes: { type: String, default: null, trim: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date, default: null }, // soft delete
  },
  { timestamps: true }
);

// Indexes for fast paginated/filtered reports at scale (thousands of rows).
// Every list query filters deletedAt:null and sorts by testDate desc.
DrugTestSchema.index({ deletedAt: 1, testDate: -1, _id: -1 });
DrugTestSchema.index({ institution: 1, testDate: -1 });
DrugTestSchema.index({ result: 1, testDate: -1 });
DrugTestSchema.index({ person: 1, testDate: -1 });

export default mongoose.models.DrugTest || mongoose.model("DrugTest", DrugTestSchema);
