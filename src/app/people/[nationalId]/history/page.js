import Link from "next/link";
import { notFound } from "next/navigation";
import { dbConnect } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import User, { ROLES } from "@/lib/models/User";
import DrugTest from "@/lib/models/DrugTest";
import { fmtDate, ResultBadge } from "@/components/ui";
import PrintButton from "@/components/PrintButton";
import DeleteResultButton from "@/components/DeleteResultButton";

export const dynamic = "force-dynamic";

export default async function HistoryPage({ params }) {
  const session = await requireRole(ROLES.ADMIN, ROLES.SUPERADMIN);
  await dbConnect();

  const nationalId = decodeURIComponent(params.nationalId);
  const person = await User.findOne({ nationalId, role: ROLES.USER }).lean();
  if (!person) notFound();

  const tests = await DrugTest.find({ person: person._id, deletedAt: null })
    .populate("institution recordedBy")
    .sort({ testDate: -1 })
    .lean();

  const latest = tests[0];
  const isSuper = session.role === ROLES.SUPERADMIN;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Test history</h1>
        <PrintButton />
      </div>

      <div className="card mb-6 p-5">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{person.name}</h2>
            <p className="text-sm text-gray-600">National ID: <strong>{person.nationalId}</strong></p>
            <p className="text-sm text-gray-600">Mobile: {person.mobile || "—"} &nbsp;|&nbsp; Email: {person.email || "—"}</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Latest result</div>
            {latest ? (
              <>
                <div className="text-lg"><ResultBadge result={latest.result} /></div>
                <div className="text-xs text-gray-500">{fmtDate(latest.testDate)}</div>
              </>
            ) : <span className="text-gray-400">No records</span>}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b px-4 py-3 font-semibold">All records ({tests.length})</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">#</th><th className="px-4 py-2">Date</th><th className="px-4 py-2">Result</th>
              <th className="px-4 py-2">Kit Serial</th><th className="px-4 py-2">Institution</th>
              <th className="px-4 py-2">Recorded by</th><th className="px-4 py-2">Notes</th>
              {isSuper && <th className="px-4 py-2 print:hidden">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {tests.length === 0 && <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-400">No records.</td></tr>}
            {tests.map((t, i) => (
              <tr key={String(t._id)} className="border-t align-middle">
                <td className="px-4 py-2">{i + 1}</td>
                <td className="px-4 py-2">{fmtDate(t.testDate)}</td>
                <td className="px-4 py-2"><ResultBadge result={t.result} /></td>
                <td className="px-4 py-2">{t.serialNumber}</td>
                <td className="px-4 py-2">{t.institution?.name}</td>
                <td className="px-4 py-2">{t.recordedBy?.name}</td>
                <td className="px-4 py-2 text-gray-500">{t.notes || "—"}</td>
                {isSuper && (
                  <td className="whitespace-nowrap px-4 py-2 print:hidden">
                    <div className="flex items-center gap-3">
                      <Link href={`/admin/results/${String(t._id)}/edit`} className="font-medium text-[#c45f3f] hover:underline">Edit</Link>
                      <DeleteResultButton id={String(t._id)} label={`${t.result} result on ${fmtDate(t.testDate)}`} />
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
