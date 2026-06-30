import Link from "next/link";
import { dbConnect } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import User, { ROLES } from "@/lib/models/User";
import DrugTest from "@/lib/models/DrugTest";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }) {
  await requireRole(ROLES.ADMIN, ROLES.SUPERADMIN);
  await dbConnect();

  const q = (searchParams?.q || "").trim();
  let results = [];
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const people = await User.find({
      role: ROLES.USER,
      $or: [{ nationalId: rx }, { name: rx }, { mobile: rx }],
    }).limit(50).sort({ name: 1 }).lean();

    results = await Promise.all(
      people.map(async (p) => ({
        ...p,
        count: await DrugTest.countDocuments({ person: p._id, deletedAt: null }),
      }))
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Search person</h1>
      <form method="GET" className="mb-6 flex gap-2">
        <input name="q" defaultValue={q} placeholder="National ID, name, or mobile" className="input max-w-md" autoFocus />
        <button className="btn-primary">Search</button>
      </form>

      {q && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">National ID</th><th className="px-4 py-2">Mobile</th><th className="px-4 py-2">Tests</th><th className="px-4 py-2"></th></tr>
            </thead>
            <tbody>
              {results.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No matches found.</td></tr>}
              {results.map((p) => (
                <tr key={String(p._id)} className="border-t">
                  <td className="px-4 py-2">{p.name}</td>
                  <td className="px-4 py-2">{p.nationalId}</td>
                  <td className="px-4 py-2">{p.mobile || "—"}</td>
                  <td className="px-4 py-2">{p.count}</td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/people/${encodeURIComponent(p.nationalId)}/history`} className="btn-primary">View history</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
