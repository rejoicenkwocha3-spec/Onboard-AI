"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/auth/AuthShell";

const LINKS = [["/platform", "Platform"], ["/solutions", "Solutions"], ["/features", "Features"], ["/pricing", "Pricing"]] as const;

export function MarketingHeader() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [path]);
  const cls = (href: string) => `rounded-lg px-3 py-2 text-sm font-semibold transition ${path === href ? "text-brand" : "text-navy hover:bg-surface"}`;
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {LINKS.map(([h, t]) => <Link key={h} href={h} className={cls(h)}>{t}</Link>)}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-navy hover:bg-surface">Sign in</Link>
          <Link href="/signup" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-light">Get Started</Link>
        </div>
        <button className="rounded-lg p-2 md:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <div className="border-t border-line bg-white px-4 pb-4 md:hidden">
          <nav className="flex flex-col py-2" aria-label="Mobile">
            {LINKS.map(([h, t]) => <Link key={h} href={h} className={`${cls(h)} py-3`}>{t}</Link>)}
          </nav>
          <div className="flex gap-2">
            <Link href="/login" className="flex-1 rounded-lg border border-line px-4 py-2.5 text-center text-sm font-semibold text-navy">Sign in</Link>
            <Link href="/signup" className="flex-1 rounded-lg bg-brand px-4 py-2.5 text-center text-sm font-semibold text-white">Get Started</Link>
          </div>
        </div>
      )}
    </header>
  );
}
