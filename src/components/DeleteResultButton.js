"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { deleteResult } from "@/app/actions/results.actions";

function ConfirmBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn inline-flex bg-red-600 px-4 py-2 text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
    >
      {pending ? "Deleting…" : "Delete record"}
    </button>
  );
}

export default function DeleteResultButton({ id, label }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="font-medium text-red-600 hover:underline">
        Delete
      </button>

      {open && (
        <div
          className="animate-fade fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-sm"
          onMouseDown={() => setOpen(false)}
        >
          <div
            className="animate-pop w-full max-w-sm overflow-hidden rounded-2xl bg-white p-6 text-center shadow-2xl ring-1 ring-black/5"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-red-50 text-red-600 ring-1 ring-inset ring-red-200">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
              </svg>
            </span>
            <h3 className="mt-4 text-lg font-semibold text-stone-900">Delete this result?</h3>
            <p className="mt-1.5 text-sm text-stone-500">
              {label ? <>This will remove the <span className="font-medium text-stone-700">{label}</span> record. </> : "This record will be removed. "}
              It is soft-deleted and logged in the audit trail, but it will no longer appear in history or reports.
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <button type="button" onClick={() => setOpen(false)} className="btn-outline px-4 py-2">Cancel</button>
              <form action={deleteResult}>
                <input type="hidden" name="id" value={id} />
                <ConfirmBtn />
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
