"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createAdmin } from "@/app/actions/admin.actions";

function SubmitBtn() {
  const { pending } = useFormStatus();
  return <button className="btn-primary w-full" disabled={pending}>{pending ? "Creating…" : "Create"}</button>;
}

export default function AdminForm({ institutions }) {
  const [state, formAction] = useFormState(createAdmin, {});
  return (
    <div className="card p-5">
      {state?.error && <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state?.success && <p className="mb-3 rounded bg-green-50 px-3 py-2 text-sm text-green-700">{state.success}</p>}
      <form action={formAction} className="space-y-3">
        <div><label className="label">Name *</label><input name="name" className="input" required /></div>
        <div><label className="label">National ID *</label><input name="nationalId" className="input" required /></div>
        <div><label className="label">Email *</label><input name="email" type="email" className="input" required /></div>
        <div><label className="label">Mobile</label><input name="mobile" className="input" /></div>
        <div>
          <label className="label">Role *</label>
          <select name="role" className="input" defaultValue="admin">
            <option value="admin">Admin</option>
            <option value="superadmin">SuperAdmin</option>
          </select>
        </div>
        <div>
          <label className="label">Institution</label>
          <select name="institution" className="input" defaultValue="">
            <option value="">— none —</option>
            {institutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
        <div><label className="label">Password *</label><input name="password" type="password" className="input" required /></div>
        <SubmitBtn />
      </form>
    </div>
  );
}
