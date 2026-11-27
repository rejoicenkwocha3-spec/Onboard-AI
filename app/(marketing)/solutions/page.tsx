import Link from "next/link";
import { SOLUTIONS } from "@/lib/marketing";
import { Heading, Section } from "@/components/marketing/ui";

export const metadata = { title: "Solutions | Onboard AI" };

export default function SolutionsPage() {
  return (
    <>
      <section className="bg-white px-4 pb-10 pt-14 text-center sm:pt-20">
        <h1 className="mx-auto max-w-4xl font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-navy sm:text-6xl">The right solution, <span className="text-teal-accent">right sized for you.</span></h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-muted">Every industry hires differently. See how Onboard AI fits the way your team recruits and onboards.</p>
        <div className="mx-auto mt-8 flex max-w-4xl flex-wrap justify-center gap-2">
          {SOLUTIONS.map((s) => <a key={s.id} href={`#${s.id}`} className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-navy hover:bg-surface">{s.title}</a>)}
        </div>
      </section>
      {SOLUTIONS.map((s, i) => (
        <Section key={s.id} id={s.id} tone={i % 2 ? "white" : "soft"} className="!py-12 sm:!py-16">
          <div className="grid gap-8 md:grid-cols-5">
            <div className="md:col-span-2">
              <h2 className="font-heading text-3xl font-extrabold text-navy">{s.title}</h2>
              <p className="mt-3 text-ink-muted"><span className="font-semibold text-navy">The challenge:</span> {s.challenge}</p>
            </div>
            <div className="md:col-span-3">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand">How Onboard AI helps</p>
              <ul className="space-y-3">{s.how.map((h) => <li key={h} className="flex gap-3 rounded-xl border border-line bg-white p-4"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-teal-accent" /><span>{h}</span></li>)}</ul>
            </div>
          </div>
        </Section>
      ))}
      <Section tone="navy" className="text-center">
        <Heading dark lead="Not sure where to start?" sub="Create an account and publish your first job. You can add screening, interviews and onboarding as you go." />
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/signup" className="rounded-xl bg-teal-accent px-6 py-3 font-semibold text-navy-deep">Get Started</Link>
          <Link href="/features" className="rounded-xl border border-white/30 px-6 py-3 font-semibold text-white">See features</Link>
        </div>
      </Section>
    </>
  );
}
