"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import User, { ROLES } from "@/lib/models/User";
import DrugTest, { RESULTS } from "@/lib/models/DrugTest";
import Institution from "@/lib/models/Institution";
import AuditLog from "@/lib/models/AuditLog";

function isValidResult(r) {
  return r === RESULTS.POSITIVE || r === RESULTS.NEGATIVE;
}

/** Resolve an institution by selected id, else find-or-create by name. */
async function resolveInstitution(institutionId, institutionName, session) {
  if (institutionId) {
    const found = await Institution.findById(institutionId);
    if (found) return found;
  }
  const nm = (institutionName || "").trim();
  if (!nm) return null;

  const escaped = nm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let inst = await Institution.findOne({ name: new RegExp(`^${escaped}$`, "i") });
  if (!inst) {
    inst = await Institution.create({ name: nm, isActive: true });
    await AuditLog.create({
      actor: session.sub,
      actorName: session.name,
      action: "created",
      subjectType: "Institution",
      subjectId: inst._id,
      changes: { name: nm, note: "Auto-created while recording a result" },
    });
  }
  return inst;
}

/** Admin/SuperAdmin: record a result, auto-creating the person if needed. */
export async function createResult(_prevState, formData) {
  const session = await requireRole(ROLES.ADMIN, ROLES.SUPERADMIN);
  await dbConnect();

  const name = (formData.get("name") || "").trim();
  const nationalId = (formData.get("nationalId") || "").trim();
  const serialNumber = (formData.get("serialNumber") || "").trim();
  const institutionId = (formData.get("institution") || "").trim();
  const institutionName = (formData.get("institutionName") || "").trim();
  const result = (formData.get("result") || "").trim();
  const testDate = (formData.get("testDate") || "").trim();
  const notes = (formData.get("notes") || "").trim() || null;

  if (!name || !nationalId || !serialNumber || !institutionName || !testDate) {
    return { error: "All fields except notes are required." };
  }
  if (!isValidResult(result)) return { error: "Invalid result." };

  const inst = await resolveInstitution(institutionId, institutionName, session);
  if (!inst) return { error: "Please choose or enter an institution." };

  let person = await User.findOne({ nationalId });
  if (!person) {
    person = await User.create({
      name,
      nationalId,
      role: ROLES.USER,
      isActive: true,
      createdBy: session.sub,
    });
    await AuditLog.create({
      actor: session.sub,
      actorName: session.name,
      action: "created",
      subjectType: "User",
      subjectId: person._id,
      changes: { note: "Auto-created while recording a result" },
    });
  }

  const test = await DrugTest.create({
    person: person._id,
    serialNumber,
    institution: inst._id,
    result,
    testDate: new Date(testDate),
    notes,
    recordedBy: session.sub,
  });

  await AuditLog.create({
    actor: session.sub,
    actorName: session.name,
    action: "created",
    subjectType: "DrugTest",
    subjectId: test._id,
    changes: { serialNumber, institution: inst.name, result, testDate },
  });

  revalidatePath(`/people/${nationalId}/history`);
  redirect(`/people/${encodeURIComponent(nationalId)}/history`);
}

/** SuperAdmin: correct a result. */
export async function updateResult(_prevState, formData) {
  const session = await requireRole(ROLES.SUPERADMIN);
  await dbConnect();

  const id = formData.get("id");
  const test = await DrugTest.findById(id).populate("person");
  if (!test) return { error: "Record not found." };

  const before = {
    serialNumber: test.serialNumber,
    institution: String(test.institution),
    result: test.result,
    testDate: test.testDate,
    notes: test.notes,
  };

  const result = (formData.get("result") || "").trim();
  if (!isValidResult(result)) return { error: "Invalid result." };

  test.serialNumber = (formData.get("serialNumber") || "").trim();
  test.institution = (formData.get("institution") || "").trim();
  test.result = result;
  test.testDate = new Date((formData.get("testDate") || "").trim());
  test.notes = (formData.get("notes") || "").trim() || null;
  await test.save();

  await AuditLog.create({
    actor: session.sub,
    actorName: session.name,
    action: "updated",
    subjectType: "DrugTest",
    subjectId: test._id,
    changes: { before, after: { serialNumber: test.serialNumber, institution: String(test.institution), result: test.result, testDate: test.testDate, notes: test.notes } },
  });

  redirect(`/people/${encodeURIComponent(test.person.nationalId)}/history`);
}

/** SuperAdmin: soft-delete a result. */
export async function deleteResult(formData) {
  const session = await requireRole(ROLES.SUPERADMIN);
  await dbConnect();

  const id = formData.get("id");
  const test = await DrugTest.findById(id).populate("person");
  if (!test) redirect("/dashboard");

  test.deletedAt = new Date();
  await test.save();

  await AuditLog.create({
    actor: session.sub,
    actorName: session.name,
    action: "deleted",
    subjectType: "DrugTest",
    subjectId: test._id,
    changes: { serialNumber: test.serialNumber, result: test.result },
  });

  redirect(`/people/${encodeURIComponent(test.person.nationalId)}/history`);
}
