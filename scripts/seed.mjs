import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { MONGODB_URI } = process.env;
if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI. Copy .env.example to .env and set it.");
  process.exit(1);
}

// Minimal schemas (kept in sync with src/lib/models) so this runs under plain Node.
const User = mongoose.model("User", new mongoose.Schema({
  name: String,
  nationalId: { type: String, unique: true },
  email: String,
  mobile: String,
  passwordHash: String,
  role: String,
  institution: mongoose.Schema.Types.ObjectId,
  isActive: Boolean,
}, { timestamps: true }));

const Institution = mongoose.model("Institution", new mongoose.Schema({
  name: String,
  address: String,
  isActive: Boolean,
}, { timestamps: true }));

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  const inst = await Institution.findOneAndUpdate(
    { name: "Central Diagnostic Lab" },
    { $setOnInsert: { address: "Dhaka, Bangladesh", isActive: true } },
    { upsert: true, new: true }
  );

  const email = process.env.SUPERADMIN_EMAIL || "super@admin.test";
  const password = process.env.SUPERADMIN_PASSWORD || "password";
  const nationalId = process.env.SUPERADMIN_NATIONAL_ID || "SUPER-0001";

  const existingSuper = await User.findOne({ email });
  if (existingSuper) {
    console.log(`SuperAdmin already exists: ${email}`);
  } else {
    await User.create({
      name: process.env.SUPERADMIN_NAME || "Super Admin",
      nationalId,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: "superadmin",
      isActive: true,
    });
    console.log(`Created SuperAdmin: ${email} / ${password}`);
  }

  const adminEmail = "admin@admin.test";
  if (!(await User.findOne({ email: adminEmail }))) {
    await User.create({
      name: "Lab Admin",
      nationalId: "ADMIN-0001",
      email: adminEmail,
      passwordHash: await bcrypt.hash("password", 10),
      role: "admin",
      institution: inst._id,
      isActive: true,
    });
    console.log(`Created sample Admin: ${adminEmail} / password`);
  } else {
    console.log("Sample Admin already exists.");
  }

  await mongoose.disconnect();
  console.log("Done.");
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
