"use server";

import { redirect } from "next/navigation";
import { dbConnect } from "@/lib/db";
import User, { ROLES } from "@/lib/models/User";
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
} from "@/lib/auth";

export async function register(_prevState, formData) {
  await dbConnect();

  const name = (formData.get("name") || "").trim();
  const nationalId = (formData.get("nationalId") || "").trim();
  const email = (formData.get("email") || "").trim().toLowerCase() || null;
  const mobile = (formData.get("mobile") || "").trim() || null;
  const password = formData.get("password") || "";
  const confirm = formData.get("password_confirmation") || "";

  if (!name || !nationalId || !password) {
    return { error: "Name, National ID and password are required." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }
  if (password !== confirm) {
    return { error: "Passwords do not match." };
  }

  const existing = await User.findOne({ nationalId });

  let user;
  if (existing) {
    // Allow claiming an unclaimed citizen profile (admin-created, no password).
    if (existing.role !== ROLES.USER || existing.passwordHash) {
      return { error: "An account with this ID already exists. Please log in." };
    }
    existing.name = name;
    existing.email = email || existing.email;
    existing.mobile = mobile || existing.mobile;
    existing.passwordHash = await hashPassword(password);
    await existing.save();
    user = existing;
  } else {
    if (email && (await User.findOne({ email }))) {
      return { error: "That email is already in use." };
    }
    user = await User.create({
      name,
      nationalId,
      email,
      mobile,
      passwordHash: await hashPassword(password),
      role: ROLES.USER,
      isActive: true,
    });
  }

  await createSession(user);
  redirect("/dashboard");
}

export async function login(_prevState, formData) {
  await dbConnect();

  const loginId = (formData.get("login") || "").trim();
  const password = formData.get("password") || "";
  if (!loginId || !password) return { error: "Enter your login and password." };

  const isEmail = loginId.includes("@");
  const user = await User.findOne(
    isEmail ? { email: loginId.toLowerCase() } : { nationalId: loginId }
  );

  if (!user || !user.isActive || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Invalid credentials, or the account is inactive." };
  }

  await createSession(user);
  redirect("/dashboard");
}

export async function logout() {
  destroySession();
  redirect("/login");
}
