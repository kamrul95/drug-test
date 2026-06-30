"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { login } from "@/app/actions/auth.actions";
import Logo from "@/components/Logo";

function SubmitBtn({ children }) {
  const { pending } = useFormStatus();
  return <button className="btn-primary w-full py-2.5" disabled={pending}>{pending ? "Signing in…" : children}</button>;
}

export default function LoginPage() {
  const [state, formAction] = useFormState(login, {});

  return (
    <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm md:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between p-10 text-white md:flex"
           style={{ background: "linear-gradient(150deg, #d97757 0%, #b8492c 100%)" }}>
        <div className="flex items-center gap-2 text-lg font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/20"><Logo className="h-5 w-5 text-white" /></span>
          Drug Result System
        </div>
        <div>
          <h2 className="text-3xl font-semibold leading-tight">Verified test records,<br/>in one place.</h2>
          <p className="mt-3 max-w-sm text-white/80">
            Securely record and look up drug-test results by national ID — built for fast, reliable verification when it matters.
          </p>
        </div>
        <p className="text-sm text-white/60">Append-only records · Full audit trail</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 md:hidden">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#d97757]"><Logo className="h-6 w-6 text-white" /></span>
          </div>
          <h1 className="text-2xl font-semibold text-stone-900">Welcome back</h1>
          <p className="mb-6 mt-1 text-sm text-stone-500">Log in to manage and view test records.</p>

          {state?.error && (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
          )}

          <form action={formAction} className="space-y-4">
            <div>
              <label className="label">Email or National ID</label>
              <input name="login" className="input" placeholder="you@example.com" required autoFocus />
            </div>
            <div>
              <label className="label">Password</label>
              <input name="password" type="password" className="input" placeholder="••••••••" required />
            </div>
            <SubmitBtn>Log in</SubmitBtn>
          </form>

          <p className="mt-6 text-center text-sm text-stone-500">
            No account?{" "}
            <Link href="/register" className="font-medium text-[#c45f3f] hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
