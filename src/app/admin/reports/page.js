import Link from "next/link";
import { dbConnect } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { ROLES } from "@/lib/models/User";
import DrugTest from "@/lib/models/DrugTest";
import Institution from "@/lib/models/Institution";
import { fmtDate, ResultBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function ReportsPage({ searchParams }) {
  await requireRole(ROLES.ADMIN, ROLES.SUPERADMIN);
  await dbConnect();

  const { result, institution, from, to } = searchParams || {};
  const page = Math.max(1, parseInt(searchParams?.page || "1", 10) || 1);

  const filter = { deletedAt: null };
  if (result) filter.result = result;
  if (institution) filter.institution = institution;
  if (from || to) {
    filter.testDate = {};
    if (from) filter.testDate.$gte = new Date(from);
    if (to) filter.testDate.$lte = new Date(to);
  }

  // Fetch ONLY the current page + a total count (no full-collection fetch).
  const [total, tests, institutions] = await Promise.all([
    DrugTest.countDocuments(filter),
    DrugTest.find(filter)
      .populate("person institution recordedBy")
      .sort({ testDate: -1, _id: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    Institution.find().sort({ name: 1 }).lean(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startRow = total === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endRow = Math.min(safePage * PAGE_SIZE, total);

  // Build hrefs that keep the active filters.
  const baseParams = {};
  if (result) baseParams.result = result;
  if (institution) baseParams.institution = institution;
  if (from) baseParams.from = from;
  if (to) baseParams.to = to;
  const hrefFor = (p) => {
    const sp = new URLSearchParams({ ...baseParams, page: String(p) });
    return `/admin/reports?${sp.toString()}`;
  };

  // Window of page numbers around the current page.
  const windowSize = 5;
  let startP = Math.max(1, safePage - Math.floor(windowSize / 2));
  let endP = Math.min(totalPages, startP + windowSize - 1);
  startP = Math.max(1, endP - windowSize + 1);
  const pageNumbers = [];
  for (let p = startP; p <= endP; p++) pageNumbers.push(p);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">All reports</h1>
        <p className="mt-1 text-sm text-stone-500">
          {total.toLocaleString()} record{total === 1 ? "" : "s"} total
          {total > 0 && <> · showing {startRow.toLocaleString()}–{endRow.toLocaleString()}</>}
        </p>
      </div>

      <form method="GET" className="card grid grid-cols-1 gap-3 p-4 md:grid-cols-5">
        <div>
          <label className="label">Result</label>
          <select name="result" className="input" defaultValue={result || ""}>
            <option value="">All</option>
            <option value="negative">Negative</option>
            <option value="positive">Positive</option>
          </select>
        </div>
        <div>
          <label className="label">Institution</label>
          <select name="institution" className="input" defaultValue={institution || ""}>
            <option value="">All</option>
            {institutions.map((i) => <option key={String(i._id)} value={String(i._id)}>{i.name}</option>)}
          </select>
        </div>
        <div><label className="label">From</label><input type="date" name="from" defaultValue={from || ""} className="input" /></div>
        <div><label className="label">To</label><input type="date" name="to" defaultValue={to || ""} className="input" /></div>
        <div className="flex items-end"><button className="btn-primary w-full">Filter</button></div>
      </form>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50">
              <tr><th className="th">Date</th><th className="th">Person</th><th className="th">National ID</th><th className="th">Result</th><th className="th">Kit Serial</th><th className="th">Institution</th><th className="th">By</th></tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {tests.length === 0 && <tr><td colSpan={7} className="td py-10 text-center text-stone-400">No results match.</td></tr>}
              {tests.map((t) => (
                <tr key={String(t._id)} className="hover:bg-stone-50/60">
                  <td className="td">{fmtDate(t.testDate)}</td>
                  <td className="td"><Link className="font-medium text-[#c45f3f] hover:underline" href={`/people/${encodeURIComponent(t.person?.nationalId)}/history`}>{t.person?.name}</Link></td>
                  <td className="td text-stone-500">{t.person?.nationalId}</td>
                  <td className="td"><ResultBadge result={t.result} /></td>
                  <td className="td">{t.serialNumber}</td>
                  <td className="td">{t.institution?.name}</td>
                  <td className="td text-stone-500">{t.recordedBy?.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-stone-500">Page {safePage} of {totalPages}</span>
          <div className="flex items-center gap-1">
            {safePage > 1
              ? <Link href={hrefFor(safePage - 1)} className="btn-outline px-3 py-1.5">‹ Prev</Link>
              : <span className="btn-outline cursor-not-allowed px-3 py-1.5 opacity-40">‹ Prev</span>}

            {startP > 1 && <Link href={hrefFor(1)} className="btn-outline px-3 py-1.5">1</Link>}
            {startP > 2 && <span className="px-1 text-stone-400">…</span>}

            {pageNumbers.map((p) => (
              p === safePage
                ? <span key={p} className="btn-primary px-3 py-1.5">{p}</span>
                : <Link key={p} href={hrefFor(p)} className="btn-outline px-3 py-1.5">{p}</Link>
            ))}

            {endP < totalPages - 1 && <span className="px-1 text-stone-400">…</span>}
            {endP < totalPages && <Link href={hrefFor(totalPages)} className="btn-outline px-3 py-1.5">{totalPages}</Link>}

            {safePage < totalPages
              ? <Link href={hrefFor(safePage + 1)} className="btn-outline px-3 py-1.5">Next ›</Link>
              : <span className="btn-outline cursor-not-allowed px-3 py-1.5 opacity-40">Next ›</span>}
          </div>
        </div>
      )}
    </div>
  );
}
