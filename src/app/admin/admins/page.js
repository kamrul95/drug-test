import { dbConnect } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import User, { ROLES } from "@/lib/models/User";
import Institution from "@/lib/models/Institution";
import { toggleAdmin } from "@/app/actions/admin.actions";
import AdminForm from "@/components/AdminForm";

export const dynamic = "force-dynamic";

export default async function AdminsPage() {
  const session = await requireRole(ROLES.SUPERADMIN);
  await dbConnect();

  const admins = await User.find({ role: { $in: [ROLES.ADMIN, ROLES.SUPERADMIN] } })
    .populate("institution").sort({ role: 1, name: 1 }).lean();
  const institutions = await Institution.find().sort({ name: 1 }).lean();
  const opts = institutions.map((i) => ({ id: String(i._id), name: i.name }));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="mb-4 text-2xl font-bold">Admin accounts</h1>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">Email</th><th className="px-4 py-2">Role</th><th className="px-4 py-2">Institution</th><th className="px-4 py-2">Status</th><th className="px-4 py-2"></th></tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={String(a._id)} className="border-t">
                  <td className="px-4 py-2">{a.name}</td>
                  <td className="px-4 py-2">{a.email}</td>
                  <td className="px-4 py-2"><span className="badge bg-gray-100 uppercase text-gray-600">{a.role}</span></td>
                  <td className="px-4 py-2">{a.institution?.name || "—"}</td>
                  <td className="px-4 py-2">{a.isActive ? <span className="text-green-600">Active</span> : <span className="text-red-600">Disabled</span>}</td>
                  <td className="px-4 py-2 text-right">
                    {String(a._id) !== String(session.sub) && (
                      <form action={toggleAdmin}>
                        <input type="hidden" name="id" value={String(a._id)} />
                        <button className={a.isActive ? "btn-danger" : "btn-outline"}>{a.isActive ? "Disable" : "Enable"}</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <h2 className="mb-4 text-lg font-semibold">Create admin</h2>
        <AdminForm institutions={opts} />
      </div>
    </div>
  );
}
