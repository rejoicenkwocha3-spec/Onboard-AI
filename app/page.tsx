import Link from "next/link";
import { Logo } from "@/components/auth/AuthShell";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <h1 className="max-w-xl text-3xl font-extrabold text-navy sm:text-4xl">
        Every great hire starts with a better experience.
      </h1>
      <div className="flex gap-3">
        <Link href="/signup" className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white">Get Started</Link>
        <Link href="/login" className="rounded-lg border border-line bg-white px-5 py-2.5 text-sm font-semibold text-navy">Log in</Link>
      </div>
      <p className="text-xs text-ink-muted">© 2026 Onboard AI</p>
    </main>
  );
}
