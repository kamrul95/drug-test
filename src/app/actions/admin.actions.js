"use server";

import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db";
import { requireRole, hashPassword } from "@/lib/auth";
import User, { ROLES } from "@/lib/models/User";
import Institution from "@/lib/models/Institution";
import AuditLog from "@/lib/models/AuditLog";

/** SuperAdmin: create an admin or superadmin. */
export async function createAdmin(_prevState, formData) {
  const session = await requireRole(ROLES.SUPERADMIN);
  await dbConnect();

  const name = (formData.get("name") || "").trim();
  const nationalId = (formData.get("nationalId") || "").trim();
  const email = (formData.get("email") || "").trim().toLowerCase();
  const mobile = (formData.get("mobile") || "").trim() || null;
  const role = (formData.get("role") || "").trim();
  const institution = (formData.get("institution") || "").trim() || null;
  const password = formData.get("password") || "";

  if (!name || !nationalId || !email || !password) {
    return { error: "Name, National ID, email and password are required." };
  }
  if (![ROLES.ADMIN, ROLES.SUPERADMIN].includes(role)) {
    return { error: "Invalid role." };
  }
  if (await User.findOne({ $or: [{ email }, { nationalId }] })) {
    return { error: "A user with that email or National ID already exists." };
  }

  const admin = await User.create({
    name,
    nationalId,
    email,
    mobile,
    role,
    institution,
    passwordHash: await hashPassword(password),
    isActive: true,
    createdBy: session.sub,
  });

  await AuditLog.create({
    actor: session.sub,
    actorName: session.name,
    action: "created",
    subjectType: "User",
    subjectId: admin._id,
    changes: { role },
  });

  revalidatePath("/admin/admins");
  return { success: "Admin account created." };
}

/** SuperAdmin: enable/disable an admin. */
export async function toggleAdmin(formData) {
  const session = await requireRole(ROLES.SUPERADMIN);
  await dbConnect();

  const id = formData.get("id");
  if (String(id) === String(session.sub)) {
    revalidatePath("/admin/admins");
    return;
  }
  const user = await User.findById(id);
  if (user) {
    user.isActive = !user.isActive;
    await user.save();
    await AuditLog.create({
      actor: session.sub,
      actorName: session.name,
      action: "updated",
      subjectType: "User",
      subjectId: user._id,
      changes: { isActive: user.isActive },
    });
  }
  revalidatePath("/admin/admins");
}

/** SuperAdmin: add an institution. */
export async function createInstitution(_prevState, formData) {
  await requireRole(ROLES.SUPERADMIN);
  await dbConnect();

  const name = (formData.get("name") || "").trim();
  const address = (formData.get("address") || "").trim() || null;
  if (!name) return { error: "Name is required." };

  await Institution.create({ name, address, isActive: true });
  revalidatePath("/admin/institutions");
  return { success: "Institution added." };
}

/** SuperAdmin: enable/disable an institution. */
export async function toggleInstitution(formData) {
  await requireRole(ROLES.SUPERADMIN);
  await dbConnect();

  const inst = await Institution.findById(formData.get("id"));
  if (inst) {
    inst.isActive = !inst.isActive;
    await inst.save();
  }
  revalidatePath("/admin/institutions");
}
