"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3, Bot, Briefcase, CalendarCheck, CalendarDays, ChevronsLeft, ClipboardCheck, CreditCard, FileText,
  Globe, LayoutDashboard, ListChecks, LogOut, Menu, MessagesSquare, Plug, Settings, UserCircle, Users, UsersRound, Workflow, X,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/assistant", label: "AI Assistant", icon: Bot },
  { href: "/dashboard/jobs", label: "Jobs", icon: Briefcase },
  { href: "/dashboard/candidates", label: "Candidates", icon: Users },
  { href: "/dashboard/screening", label: "Screening", icon: ListChecks },
  { href: "/dashboard/interviews", label: "Interviews", icon: CalendarCheck },
  { href: "/dashboard/conversations", label: "Conversations", icon: MessagesSquare },
  { href: "/dashboard/onboarding", label: "Onboarding", icon: ClipboardCheck },
  { href: "/dashboard/employee-portal", label: "Employee Portal", icon: UserCircle },
  { href: "/dashboard/documents", label: "Documents", icon: FileText },
  { href: "/dashboard/workflows", label: "Workflows", icon: Workflow },
  { href: "/dashboard/career-pages", label: "Career Pages", icon: Globe },
  { href: "/dashboard/events", label: "Hiring Events", icon: CalendarDays },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/team", label: "Team", icon: UsersRound },
  { href: "/dashboard/integrations", label: "Integrations", icon: Plug },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Shell({ children, orgName, userName, email }: {
  children: React.ReactNode; orgName: string; userName: string; email: string;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try { setCollapsed(localStorage.getItem("oa-sidebar") === "1"); } catch { /* storage unavailable */ }
  }, []);
  useEffect(() => { setOpen(false); }, [pathname]);

  const toggle = () => {
    setCollapsed((c) => {
      try { localStorage.setItem("oa-sidebar", c ? "0" : "1"); } catch { /* ignore */ }
      return !c;
    });
  };
  const active = (href: string) => (href === "/dashboard" ? pathname === href : pathname.startsWith(href));

  const sidebar = (mobile: boolean) => {
    const slim = collapsed && !mobile;
    return (
      <div className="flex h-full flex-col bg-navy-deep text-white">
        <div className={`flex h-16 items-center ${slim ? "justify-center" : "justify-between px-4"}`}>
          <Link href="/dashboard" className="flex items-center gap-2.5 font-heading font-extrabold">
            <Image src="/logo.png" alt="" width={32} height={32} className="h-8 w-8 rounded-lg" />
            {!slim && <span>Onboard AI</span>}
          </Link>
          {mobile && <button onClick={() => setOpen(false)} aria-label="Close menu" className="p-1"><X size={20} /></button>}
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} title={slim ? label : undefined} aria-current={active(href) ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${slim ? "justify-center" : ""} ${
                active(href) ? "bg-brand text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>
              <Icon size={18} className="shrink-0" />
              {!slim && label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 p-2">
          <form action="/auth/signout" method="post">
            <button title="Sign out" className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white ${slim ? "justify-center" : ""}`}>
              <LogOut size={18} className="shrink-0" />{!slim && "Sign out"}
            </button>
          </form>
          {!mobile && (
            <button onClick={toggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={`mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/50 hover:bg-white/10 hover:text-white ${slim ? "justify-center" : ""}`}>
              <ChevronsLeft size={18} className={`shrink-0 transition ${collapsed ? "rotate-180" : ""}`} />{!slim && "Collapse"}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-surface">
      <aside className={`fixed inset-y-0 left-0 z-30 hidden transition-all lg:block ${collapsed ? "w-16" : "w-60"}`}>{sidebar(false)}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64">{sidebar(true)}</aside>
        </div>
      )}
      <div className={`transition-all ${collapsed ? "lg:pl-16" : "lg:pl-60"}`}>
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-white px-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-lg p-2 hover:bg-surface lg:hidden"><Menu size={20} /></button>
            <p className="truncate font-heading text-sm font-bold text-navy">{orgName}</p>
          </div>
          <div className="min-w-0 text-right">
            <p className="truncate text-sm font-semibold text-navy">{userName}</p>
            <p className="hidden truncate text-xs text-ink-muted sm:block">{email}</p>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
