"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { register } from "@/app/actions/auth.actions";

function SubmitBtn({ children }) {
  const { pending } = useFormStatus();
  return <button className="btn-primary w-full" disabled={pending}>{pending ? "Please wait…" : children}</button>;
}

export default function RegisterPage() {
  const [state, formAction] = useFormState(register, {});
  return (
    <div className="mx-auto mt-10 max-w-md">
      <div className="card p-6">
        <h1 className="mb-1 text-xl font-bold">Create your account</h1>
        <p className="mb-4 text-sm text-gray-500">Register to view your own drug-test records.</p>
        {state?.error && <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
        <form action={formAction} className="space-y-3">
          <div><label className="label">Full Name *</label><input name="name" className="input" required /></div>
          <div><label className="label">National ID / Birth Certificate No. *</label><input name="nationalId" className="input" required /></div>
          <div><label className="label">Email (optional)</label><input name="email" type="email" className="input" /></div>
          <div><label className="label">Mobile (optional)</label><input name="mobile" className="input" /></div>
          <div><label className="label">Password *</label><input name="password" type="password" className="input" required /></div>
          <div><label className="label">Confirm Password *</label><input name="password_confirmation" type="password" className="input" required /></div>
          <SubmitBtn>Register</SubmitBtn>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account? <Link href="/login" className="font-medium text-[#c45f3f] hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
