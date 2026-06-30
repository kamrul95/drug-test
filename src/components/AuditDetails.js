"use client";

import { useEffect, useState } from "react";

export default function AuditDetails({ log }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const pretty = JSON.stringify(log.changes ?? {}, null, 2);

  // Lock body scroll + close on Escape while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  async function copy() {
    try { await navigator.clipboard.writeText(pretty); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  }

  const actionTone =
    log.action === "deleted" ? "bg-red-50 text-red-600 ring-red-200"
    : log.action === "updated" ? "bg-amber-50 text-amber-600 ring-amber-200"
    : "bg-emerald-50 text-emerald-600 ring-emerald-200";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-600 shadow-sm transition hover:border-stone-300 hover:bg-stone-50 hover:text-stone-900"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2.5 10S5 4.5 10 4.5 17.5 10 17.5 10 15 15.5 10 15.5 2.5 10 2.5 10Z" />
          <circle cx="10" cy="10" r="2.25" />
        </svg>
        View
      </button>

      {open && (
        <div
          className="animate-fade fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-sm"
          onMouseDown={() => setOpen(false)}
        >
          <div
            className="animate-pop flex max-h-[82vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-5">
              <div className="flex items-center gap-3">
                <span className={`grid h-10 w-10 place-items-center rounded-xl ring-1 ring-inset ${actionTone}`}>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12.5 11 14.5 15 9.5" /><circle cx="12" cy="12" r="9" />
                  </svg>
                </span>
                <div>
                  <h3 className="text-base font-semibold text-stone-900">Audit detail</h3>
                  <p className="mt-0.5 text-xs text-stone-500">
                    <span className="font-medium text-stone-700">{log.actorName || "System"}</span>
                    {" · "}{log.action} {log.subjectType}
                    {log.subjectId ? ` #${String(log.subjectId).slice(-6)}` : ""}
                    {" · "}{log.when}
                  </p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
              </button>
            </div>

            {/* JSON body */}
            <div className="overflow-auto px-6 pb-2">
              <div className="relative">
                <button
                  onClick={copy}
                  className="absolute right-2.5 top-2.5 rounded-md border border-stone-200 bg-white/90 px-2 py-1 text-xs font-medium text-stone-600 shadow-sm backdrop-blur transition hover:bg-white hover:text-stone-900"
                >
                  {copied ? "Copied ✓" : "Copy"}
                </button>
                <pre className="overflow-auto rounded-xl border border-stone-200 bg-stone-50 p-4 pr-16 font-mono text-[12.5px] leading-relaxed text-stone-700">
{pretty}
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end px-6 py-4">
              <button onClick={() => setOpen(false)} className="btn-primary px-4 py-2">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
