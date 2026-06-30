"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createInstitution } from "@/app/actions/admin.actions";

function SubmitBtn() {
  const { pending } = useFormStatus();
  return <button className="btn-primary w-full" disabled={pending}>{pending ? "Adding…" : "Add"}</button>;
}

export default function InstitutionForm() {
  const [state, formAction] = useFormState(createInstitution, {});
  return (
    <div className="card p-5">
      {state?.error && <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state?.success && <p className="mb-3 rounded bg-green-50 px-3 py-2 text-sm text-green-700">{state.success}</p>}
      <form action={formAction} className="space-y-3">
        <div><label className="label">Name *</label><input name="name" className="input" required /></div>
        <div><label className="label">Address</label><input name="address" className="input" /></div>
        <SubmitBtn />
      </form>
    </div>
  );
}
