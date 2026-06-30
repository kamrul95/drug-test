import mongoose from "mongoose";

export const ROLES = {
  USER: "user",
  ADMIN: "admin",
  SUPERADMIN: "superadmin",
};

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // National ID or Birth Certificate number — unique master lookup key.
    nationalId: { type: String, required: true, unique: true, trim: true, index: true },
    email: { type: String, default: null, lowercase: true, trim: true },
    mobile: { type: String, default: null, trim: true },
    // Hashed password; null for admin-created person profiles until claimed.
    passwordHash: { type: String, default: null },
    role: {
      type: String,
      enum: [ROLES.USER, ROLES.ADMIN, ROLES.SUPERADMIN],
      default: ROLES.USER,
      index: true,
    },
    institution: { type: mongoose.Schema.Types.ObjectId, ref: "Institution", default: null },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

// Sparse unique email (allows many nulls, but unique when present).
UserSchema.index({ email: 1 }, { unique: true, sparse: true });

export default mongoose.models.User || mongoose.model("User", UserSchema);
