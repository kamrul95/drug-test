"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createResult } from "@/app/actions/results.actions";

function SubmitBtn() {
  const { pending } = useFormStatus();
  return <button className="btn-primary mt-2" disabled={pending}>{pending ? "Saving…" : "Save Result"}</button>;
}

export default function ResultForm() {
  const [state, formAction] = useFormState(createResult, {});
  const today = new Date().toISOString().slice(0, 10);

  // ---- Person (national ID) search ----
  const [name, setName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [matches, setMatches] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const boxRef = useRef(null);
  const debounce = useRef(null);

  useEffect(() => {
    if (selected && nationalId === selected.nationalId) return;
    const q = nationalId.trim();
    clearTimeout(debounce.current);
    if (q.length < 2) { setMatches([]); setOpen(false); return; }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/people/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setMatches(data.results || []);
        setOpen(true);
      } catch { setMatches([]); } finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(debounce.current);
  }, [nationalId, selected]);

  // ---- Institution search (select existing or create new) ----
  const [instName, setInstName] = useState("");
  const [instId, setInstId] = useState("");
  const [instMatches, setInstMatches] = useState([]);
  const [instOpen, setInstOpen] = useState(false);
  const [instExact, setInstExact] = useState(true);
  const instRef = useRef(null);
  const instDebounce = useRef(null);

  useEffect(() => {
    const q = instName.trim();
    clearTimeout(instDebounce.current);
    if (q.length < 1) { setInstMatches([]); setInstOpen(false); return; }
    instDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/institutions/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setInstMatches(data.results || []);
        setInstExact(!!data.exactExists);
        setInstOpen(true);
      } catch { setInstMatches([]); }
    }, 200);
    return () => clearTimeout(instDebounce.current);
  }, [instName]);

  // Close dropdowns on outside click
  useEffect(() => {
    function onClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
      if (instRef.current && !instRef.current.contains(e.target)) setInstOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function choosePerson(p) { setSelected(p); setNationalId(p.nationalId); setName(p.name); setOpen(false); }
  function clearPerson() { setSelected(null); setName(""); setNationalId(""); }
  function chooseInst(i) { setInstId(i.id); setInstName(i.name); setInstOpen(false); setInstExact(true); }

  const isNewInstitution = instName.trim().length > 0 && !instId && !instExact;

  return (
    <div className="card p-6">
      {state?.error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <form action={formAction} className="grid grid-cols-1 gap-5 md:grid-cols-2">

        {/* Searchable National ID */}
        <div className="relative md:col-span-2" ref={boxRef}>
          <label className="label">National ID / Birth Cert. No. *</label>
          <div className="relative">
            <input
              name="nationalId" className="input pr-9" autoComplete="off"
              placeholder="Type to search existing people, or enter a new ID"
              value={nationalId}
              onChange={(e) => { setNationalId(e.target.value); if (selected) setSelected(null); }}
              onFocus={() => matches.length && setOpen(true)}
              required
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">{loading ? "…" : "🔍"}</span>
          </div>
          {open && matches.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg">
              {matches.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => choosePerson(p)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-stone-50">
                    <span><span className="font-medium text-stone-800">{p.name}</span><span className="ml-2 text-sm text-stone-500">{p.nationalId}</span></span>
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">{p.testCount} test{p.testCount === 1 ? "" : "s"}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {open && !loading && matches.length === 0 && nationalId.trim().length >= 2 && (
            <div className="absolute z-20 mt-1 w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-500 shadow-lg">
              No existing person — a new profile will be created.
            </div>
          )}
          {selected && (
            <p className="mt-2 flex items-center gap-2 text-sm text-emerald-700">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              Existing person selected — {selected.testCount} previous record{selected.testCount === 1 ? "" : "s"}.
              <button type="button" onClick={clearPerson} className="text-stone-400 underline hover:text-stone-600">clear</button>
            </p>
          )}
        </div>

        <div>
          <label className="label">Person&apos;s Name *</label>
          <input name="name" className="input" value={name} onChange={(e) => setName(e.target.value)} readOnly={!!selected} required />
        </div>
        <div>
          <label className="label">Kit Serial Number *</label>
          <input name="serialNumber" className="input" required />
        </div>

        {/* Searchable Institution (select or create) */}
        <div className="relative" ref={instRef}>
          <label className="label">Institution *</label>
          <input type="hidden" name="institution" value={instId} />
          <div className="relative">
            <input
              name="institutionName" className="input pr-9" autoComplete="off"
              placeholder="Search or type a new institution"
              value={instName}
              onChange={(e) => { setInstName(e.target.value); setInstId(""); }}
              onFocus={() => setInstOpen(true)}
              required
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">🔍</span>
          </div>
          {instOpen && instMatches.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg">
              {instMatches.map((i) => (
                <li key={i.id}>
                  <button type="button" onClick={() => chooseInst(i)} className="block w-full px-4 py-2.5 text-left text-stone-800 hover:bg-stone-50">{i.name}</button>
                </li>
              ))}
            </ul>
          )}
          {isNewInstitution && (
            <p className="mt-2 flex items-center gap-2 text-sm text-[#c45f3f]">
              <span className="inline-block h-2 w-2 rounded-full bg-[#d97757]" />
              New institution — &quot;{instName.trim()}&quot; will be created.
            </p>
          )}
        </div>

        <div>
          <label className="label">Result *</label>
          <select name="result" className="input" defaultValue="negative">
            <option value="negative">Negative</option>
            <option value="positive">Positive</option>
          </select>
        </div>
        <div>
          <label className="label">Test Date *</label>
          <input name="testDate" type="date" defaultValue={today} className="input" required />
        </div>
        <div className="md:col-span-2">
          <label className="label">Notes (optional)</label>
          <textarea name="notes" rows={2} className="input" />
        </div>
        <div className="md:col-span-2"><SubmitBtn /></div>
      </form>
    </div>
  );
}
