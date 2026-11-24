import Link from "next/link";
import type { ReactNode } from "react";

export function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2 font-heading text-lg font-extrabold text-navy">
      <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white">O</span>
      Onboard AI
    </Link>
  );
}

export function AuthShell({ title, subtitle, children, footer }: {
  title: string; subtitle?: string; children: ReactNode; footer?: ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-10">
      <Logo />
      <div className="mt-8 w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <h1 className="font-heading text-2xl font-extrabold text-navy">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <p className="mt-6 text-sm text-ink-muted">{footer}</p>}
    </main>
  );
}
