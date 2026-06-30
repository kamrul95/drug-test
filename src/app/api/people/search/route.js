import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { getSession, canManageResults } from "@/lib/auth";
import User, { ROLES } from "@/lib/models/User";
import DrugTest from "@/lib/models/DrugTest";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await getSession();
  if (!session || !canManageResults(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = (request.nextUrl.searchParams.get("q") || "").trim();
  if (q.length < 2) return NextResponse.json({ results: [] });

  await dbConnect();
  const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  const people = await User.find({
    role: ROLES.USER,
    $or: [{ nationalId: rx }, { name: rx }, { mobile: rx }],
  })
    .limit(8)
    .sort({ name: 1 })
    .lean();

  const results = await Promise.all(
    people.map(async (p) => ({
      id: String(p._id),
      name: p.name,
      nationalId: p.nationalId,
      email: p.email || null,
      mobile: p.mobile || null,
      testCount: await DrugTest.countDocuments({ person: p._id, deletedAt: null }),
    }))
  );

  return NextResponse.json({ results });
}
