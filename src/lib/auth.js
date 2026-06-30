import "server-only";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signToken, verifyToken, COOKIE_NAME } from "@/lib/jwt";
import { ROLES } from "@/lib/models/User";

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain, hash) {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

/** Create the session cookie for a user document. */
export async function createSession(user) {
  const token = await signToken({
    sub: String(user._id),
    role: user.role,
    name: user.name,
    nid: user.nationalId,
  });
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function destroySession() {
  // Overwrite with an immediately-expired cookie (matching attributes) so it is
  // reliably removed — a plain delete() can miss if path/attrs don't match.
  cookies().set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
}

/** Returns the session payload {sub, role, name, nid} or null. */
export async function getSession() {
  const token = cookies().get(COOKIE_NAME)?.value;
  return verifyToken(token);
}

/** Redirects to /login if not authenticated; returns the session otherwise. */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Redirects unless the user has one of the allowed roles. */
export async function requireRole(...roles) {
  const session = await requireUser();
  if (!roles.includes(session.role)) redirect("/dashboard");
  return session;
}

export function canManageResults(role) {
  return role === ROLES.ADMIN || role === ROLES.SUPERADMIN;
}
