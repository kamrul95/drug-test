import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import User, { ROLES } from "@/lib/models/User";
import DrugTest, { RESULTS } from "@/lib/models/DrugTest";
import { fmtDate, ResultBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

function StatCard({ label, value, accent }) {
  return (
    <div className="card p-5">
      <div className="text-sm text-stone-500">{label}</div>
      <div className={`mt-1 text-3xl font-semibold ${accent || "text-stone-900"}`}>{value}</div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await requireUser();
  await dbConnect();

  // ---------- Citizen view ----------
  if (session.role === ROLES.USER) {
    const tests = await DrugTest.find({ person: session.sub, deletedAt: null })
      .populate("institution")
      .sort({ testDate: -1 })
      .lean();
    const latest = tests[0];

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-stone-900">Welcome, {session.name}</h1>
            <p className="mt-1 text-sm text-stone-500">National ID: <span className="font-medium text-stone-700">{session.nid}</span></p>
          </div>
          {latest && (
            <div className="card flex items-center gap-3 px-4 py-3">
              <span className="text-sm text-stone-500">Latest result</span>
              <ResultBadge result={latest.result} />
              <span className="text-sm text-stone-400">{fmtDate(latest.testDate)}</span>
            </div>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-stone-100 px-5 py-3.5 font-semibold text-stone-800">My drug-test history</div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50"><tr><th className="th">Date</th><th className="th">Result</th><th className="th">Kit Serial</th><th className="th">Institution</th></tr></thead>
              <tbody className="divide-y divide-stone-100">
                {tests.length === 0 && <tr><td colSpan={4} className="td py-10 text-center text-stone-400">No records yet.</td></tr>}
                {tests.map((t) => (
                  <tr key={String(t._id)} className="hover:bg-stone-50/60">
                    <td className="td">{fmtDate(t.testDate)}</td>
                    <td className="td"><ResultBadge result={t.result} /></td>
                    <td className="td">{t.serialNumber}</td>
                    <td className="td">{t.institution?.name ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Admin / SuperAdmin view ----------
  const [people, total, positive, mine, recent] = await Promise.all([
    User.countDocuments({ role: ROLES.USER }),
    DrugTest.countDocuments({ deletedAt: null }),
    DrugTest.countDocuments({ deletedAt: null, result: RESULTS.POSITIVE }),
    DrugTest.countDocuments({ deletedAt: null, recordedBy: session.sub }),
    DrugTest.find({ deletedAt: null }).populate("person institution recordedBy").sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Dashboard</h1>
          <p className="mt-1 text-sm text-stone-500">Overview of recorded test results.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/results/new" className="btn-primary">+ Add Result</Link>
          <Link href="/search" className="btn-outline">Search</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="People" value={people} />
        <StatCard label="Total tests" value={total} />
        <StatCard label="Positive" value={positive} accent="text-[#c45f3f]" />
        <StatCard label="Entered by me" value={mine} />
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-stone-100 px-5 py-3.5 font-semibold text-stone-800">Recent results</div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50">
              <tr><th className="th">Date</th><th className="th">Person</th><th className="th">National ID</th><th className="th">Result</th><th className="th">Institution</th><th className="th">By</th></tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {recent.length === 0 && <tr><td colSpan={6} className="td py-10 text-center text-stone-400">No results yet.</td></tr>}
              {recent.map((t) => (
                <tr key={String(t._id)} className="hover:bg-stone-50/60">
                  <td className="td">{fmtDate(t.testDate)}</td>
                  <td className="td"><Link className="font-medium text-[#c45f3f] hover:underline" href={`/people/${encodeURIComponent(t.person?.nationalId)}/history`}>{t.person?.name}</Link></td>
                  <td className="td text-stone-500">{t.person?.nationalId}</td>
                  <td className="td"><ResultBadge result={t.result} /></td>
                  <td className="td">{t.institution?.name}</td>
                  <td className="td text-stone-500">{t.recordedBy?.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
