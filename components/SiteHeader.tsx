import Link from "next/link";
import { Logo } from "@/components/auth/AuthShell";

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-navy hover:bg-surface">
            Log in
          </Link>
          <Link href="/signup" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-light">
            Get Started
          </Link>
        </nav>
      </div>
    </header>
  );
}
