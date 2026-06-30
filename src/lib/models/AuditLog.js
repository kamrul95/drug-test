import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    actorName: { type: String, default: null },
    action: { type: String, required: true }, // created | updated | deleted
    subjectType: { type: String, required: true }, // DrugTest | User | Institution
    subjectId: { type: mongoose.Schema.Types.ObjectId, default: null },
    changes: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
