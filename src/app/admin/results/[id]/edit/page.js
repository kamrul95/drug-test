import { notFound } from "next/navigation";
import { dbConnect } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { ROLES } from "@/lib/models/User";
import DrugTest from "@/lib/models/DrugTest";
import Institution from "@/lib/models/Institution";
import EditResultForm from "@/components/EditResultForm";

export const dynamic = "force-dynamic";

export default async function EditResultPage({ params }) {
  await requireRole(ROLES.SUPERADMIN);
  await dbConnect();

  const test = await DrugTest.findById(params.id).populate("person").lean();
  if (!test) notFound();
  const institutions = await Institution.find().sort({ name: 1 }).lean();

  const data = {
    id: String(test._id),
    serialNumber: test.serialNumber,
    institution: String(test.institution),
    result: test.result,
    testDate: new Date(test.testDate).toISOString().slice(0, 10),
    notes: test.notes || "",
    personName: test.person?.name,
    nationalId: test.person?.nationalId,
  };
  const opts = institutions.map((i) => ({ id: String(i._id), name: i.name }));

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Correct result</h1>
      <p className="mb-4 text-sm text-gray-500">
        {data.personName} — {data.nationalId}{" "}
        <span className="badge bg-amber-100 text-amber-700">This change is logged</span>
      </p>
      <EditResultForm data={data} institutions={opts} />
    </div>
  );
}
