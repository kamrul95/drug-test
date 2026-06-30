import { requireRole } from "@/lib/auth";
import { ROLES } from "@/lib/models/User";
import ResultForm from "@/components/ResultForm";

export const dynamic = "force-dynamic";

export default async function NewResultPage() {
  await requireRole(ROLES.ADMIN, ROLES.SUPERADMIN);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-stone-900">Add drug-test result</h1>
      <p className="mb-5 mt-1 text-sm text-stone-500">
        Search an existing person by National ID, or enter a new one — a profile is created automatically. Institutions work the same way.
      </p>
      <ResultForm />
    </div>
  );
}
