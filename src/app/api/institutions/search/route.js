import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { getSession, canManageResults } from "@/lib/auth";
import Institution from "@/lib/models/Institution";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await getSession();
  if (!session || !canManageResults(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = (request.nextUrl.searchParams.get("q") || "").trim();
  await dbConnect();

  const filter = { isActive: true };
  if (q.length >= 1) {
    filter.name = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  }

  const list = await Institution.find(filter).limit(8).sort({ name: 1 }).lean();
  const results = list.map((i) => ({ id: String(i._id), name: i.name }));

  // Whether the exact typed name already exists (case-insensitive).
  const exactExists = q.length > 0 && results.some((i) => i.name.toLowerCase() === q.toLowerCase());

  return NextResponse.json({ results, exactExists });
}
