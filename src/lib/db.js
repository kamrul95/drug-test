import mongoose from "mongoose";

// Register every model up-front so `.populate()` always finds the referenced
// schema, no matter which page triggered the query first.
import "./models/User";
import "./models/Institution";
import "./models/DrugTest";
import "./models/AuditLog";

// Cache the connection across hot-reloads in dev to avoid creating many connections.
let cached = global._mongoose;
if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

export async function dbConnect() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI environment variable. Copy .env.example to .env and set it.");
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, { bufferCommands: false })
      .then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
