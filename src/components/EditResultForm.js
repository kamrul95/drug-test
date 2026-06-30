"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { updateResult } from "@/app/actions/results.actions";

function SubmitBtn() {
  const { pending } = useFormStatus();
  return <button className="btn-primary" disabled={pending}>{pending ? "Saving…" : "Save Correction"}</button>;
}

export default function EditResultForm({ data, institutions }) {
  const [state, formAction] = useFormState(updateResult, {});
  return (
    <div className="card p-6">
      {state?.error && <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <form action={formAction} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <input type="hidden" name="id" value={data.id} />
        <div><label className="label">Kit Serial Number *</label><input name="serialNumber" defaultValue={data.serialNumber} className="input" required /></div>
        <div>
          <label className="label">Institution *</label>
          <select name="institution" className="input" defaultValue={data.institution} required>
            {institutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Result *</label>
          <select name="result" className="input" defaultValue={data.result}>
            <option value="negative">Negative</option>
            <option value="positive">Positive</option>
          </select>
        </div>
        <div><label className="label">Test Date *</label><input name="testDate" type="date" defaultValue={data.testDate} className="input" required /></div>
        <div className="md:col-span-2"><label className="label">Notes</label><textarea name="notes" rows={2} defaultValue={data.notes} className="input" /></div>
        <div className="mt-2 flex items-center gap-2 md:col-span-2">
          <SubmitBtn />
          <Link href={`/people/${encodeURIComponent(data.nationalId)}/history`} className="btn-outline">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
