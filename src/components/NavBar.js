"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logout } from "@/app/actions/auth.actions";
import Logo from "@/components/Logo";

export default function NavBar({ name, role, staff, isSuper }) {
  const pathname = usePathname();
  const [manageOpen, setManageOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const manageRef = useRef(null);
  const userRef = useRef(null);

  // Close menus on navigation
  useEffect(() => { setManageOpen(false); setUserOpen(false); setMobileOpen(false); }, [pathname]);

  // Close on outside click
  useEffect(() => {
    function onClick(e) {
      if (manageRef.current && !manageRef.current.contains(e.target)) setManageOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const isActive = (href) => pathname === href || pathname.startsWith(href + "/");
  const linkCls = (href) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
      isActive(href) ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
    }`;
  const manageLinks = [
    { href: "/admin/admins", label: "Admins" },
    { href: "/admin/institutions", label: "Institutions" },
    { href: "/admin/audit", label: "Audit Log" },
  ];
  const manageActive = manageLinks.some((l) => isActive(l.href));

  return (
    <nav className="sticky top-0 z-30 border-b border-stone-200 bg-[#faf9f5]/90 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5">
        {/* Brand */}
        <Link href="/dashboard" className="mr-2 flex items-center gap-2 text-base font-semibold text-stone-900">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#d97757]"><Logo className="h-4 w-4 text-white" /></span>
          <span className="hidden sm:inline">Drug Results</span>
        </Link>

        {/* Desktop primary links */}
        <div className="hidden items-center gap-1 md:flex">
          {staff && <Link href="/results/new" className={linkCls("/results/new")}>Add Result</Link>}
          {staff && <Link href="/search" className={linkCls("/search")}>Search</Link>}
          {staff && <Link href="/admin/reports" className={linkCls("/admin/reports")}>Reports</Link>}

          {isSuper && (
            <div className="relative" ref={manageRef}>
              <button
                onClick={() => setManageOpen((v) => !v)}
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  manageActive ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                }`}
              >
                Manage <Chevron open={manageOpen} />
              </button>
              {manageOpen && (
                <div className="absolute left-0 mt-1 w-44 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
                  {manageLinks.map((l) => (
                    <Link key={l.href} href={l.href} className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">{l.label}</Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: user menu */}
        <div className="relative ml-auto" ref={userRef}>
          <button
            onClick={() => setUserOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full border border-stone-200 bg-white py-1 pl-1 pr-2.5 hover:bg-stone-50"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#d97757] text-sm font-semibold text-white">
              {name?.charAt(0)?.toUpperCase() || "?"}
            </span>
            <span className="hidden text-sm font-medium text-stone-700 sm:inline">{name}</span>
            <Chevron open={userOpen} />
          </button>
          {userOpen && (
            <div className="absolute right-0 mt-1 w-56 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg">
              <div className="border-b border-stone-100 px-4 py-3">
                <div className="text-sm font-medium text-stone-800">{name}</div>
                <div className="mt-0.5 inline-block rounded-full bg-stone-100 px-2 py-0.5 text-xs uppercase tracking-wide text-stone-500">{role}</div>
              </div>
              {/* On mobile, surface nav links here too */}
              <div className="md:hidden">
                {staff && <Link href="/results/new" className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">Add Result</Link>}
                {staff && <Link href="/search" className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">Search</Link>}
                {staff && <Link href="/admin/reports" className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">Reports</Link>}
                {isSuper && manageLinks.map((l) => (
                  <Link key={l.href} href={l.href} className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">{l.label}</Link>
                ))}
                <div className="border-t border-stone-100" />
              </div>
              <form action={logout}>
                <button className="block w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50">Log out</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function Chevron({ open }) {
  return (
    <svg className={`h-4 w-4 text-stone-400 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
    </svg>
  );
}
