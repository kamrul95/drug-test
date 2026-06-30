import { dbConnect } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { ROLES } from "@/lib/models/User";
import Institution from "@/lib/models/Institution";
import DrugTest from "@/lib/models/DrugTest";
import { toggleInstitution } from "@/app/actions/admin.actions";
import InstitutionForm from "@/components/InstitutionForm";

export const dynamic = "force-dynamic";

export default async function InstitutionsPage() {
  await requireRole(ROLES.SUPERADMIN);
  await dbConnect();

  const list = await Institution.find().sort({ name: 1 }).lean();
  const rows = await Promise.all(
    list.map(async (i) => ({ ...i, count: await DrugTest.countDocuments({ institution: i._id, deletedAt: null }) }))
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="mb-4 text-2xl font-bold">Institutions</h1>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">Address</th><th className="px-4 py-2">Tests</th><th className="px-4 py-2">Status</th><th className="px-4 py-2"></th></tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No institutions yet.</td></tr>}
              {rows.map((i) => (
                <tr key={String(i._id)} className="border-t">
                  <td className="px-4 py-2">{i.name}</td>
                  <td className="px-4 py-2">{i.address || "—"}</td>
                  <td className="px-4 py-2">{i.count}</td>
                  <td className="px-4 py-2">{i.isActive ? <span className="text-green-600">Active</span> : <span className="text-red-600">Disabled</span>}</td>
                  <td className="px-4 py-2 text-right">
                    <form action={toggleInstitution}>
                      <input type="hidden" name="id" value={String(i._id)} />
                      <button className={i.isActive ? "btn-danger" : "btn-outline"}>{i.isActive ? "Disable" : "Enable"}</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <h2 className="mb-4 text-lg font-semibold">Add institution</h2>
        <InstitutionForm />
      </div>
    </div>
  );
}
