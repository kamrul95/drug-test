import { SignJWT, jwtVerify } from "jose";

// Edge-safe JWT helpers (no Node-only deps) so they can be used in middleware too.

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Missing AUTH_SECRET environment variable.");
  return new TextEncoder().encode(secret);
}

export async function signToken(payload, expiresIn = "7d") {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey());
}

export async function verifyToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload;
  } catch {
    return null;
  }
}

export const COOKIE_NAME = "drs_session";
