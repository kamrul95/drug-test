import { dbConnect } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { ROLES } from "@/lib/models/User";
import AuditLog from "@/lib/models/AuditLog";
import { fmtDate } from "@/components/ui";
import AuditDetails from "@/components/AuditDetails";

export const dynamic = "force-dynamic";

function actionColor(a) {
  if (a === "deleted") return "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200";
  if (a === "updated") return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";
  return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";
}

export default async function AuditPage() {
  await requireRole(ROLES.SUPERADMIN);
  await dbConnect();

  const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(200).lean();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Audit log</h1>
        <p className="mt-1 text-sm text-stone-500">Every create, update and delete — most recent first.</p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50">
              <tr>
                <th className="th">When</th><th className="th">Actor</th><th className="th">Action</th>
                <th className="th">Subject</th><th className="th text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {logs.length === 0 && <tr><td colSpan={5} className="td py-10 text-center text-stone-400">No log entries.</td></tr>}
              {logs.map((l) => {
                const plain = {
                  actorName: l.actorName || null,
                  action: l.action,
                  subjectType: l.subjectType,
                  subjectId: l.subjectId ? String(l.subjectId) : null,
                  when: fmtDate(l.createdAt),
                  changes: l.changes ?? {},
                };
                return (
                  <tr key={String(l._id)} className="hover:bg-stone-50/60">
                    <td className="td whitespace-nowrap">{fmtDate(l.createdAt)}</td>
                    <td className="td">{l.actorName || "System"}</td>
                    <td className="td"><span className={`badge ${actionColor(l.action)}`}>{l.action}</span></td>
                    <td className="td text-stone-500">{l.subjectType}</td>
                    <td className="td text-right"><AuditDetails log={plain} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
