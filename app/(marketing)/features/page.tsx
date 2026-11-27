import Link from "next/link";
import { FEATURES } from "@/lib/marketing";
import { Heading, Section, StatusTag, Visual } from "@/components/marketing/ui";

export const metadata = { title: "Features | Onboard AI" };

export default function FeaturesPage() {
  return (
    <>
      <section className="bg-white px-4 pb-10 pt-14 text-center sm:pt-20">
        <h1 className="mx-auto max-w-4xl font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-navy sm:text-6xl">Everything you need to <span className="text-teal-accent">hire and welcome.</span></h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-muted">Sixteen capabilities across recruitment and onboarding. Each one is marked as available now or coming soon, so you always know what to expect.</p>
        <div className="mx-auto mt-8 flex max-w-5xl flex-wrap justify-center gap-2">
          {FEATURES.map((f, i) => <a key={f.title} href={`#f${i}`} className="rounded-full border border-line px-3 py-1.5 text-sm font-semibold text-navy hover:bg-surface">{f.title}</a>)}
        </div>
      </section>
      {FEATURES.map((f, i) => (
        <Section key={f.title} id={`f${i}`} tone={i % 2 ? "white" : "soft"} className="!py-12 sm:!py-16">
          <div className={`grid items-center gap-8 md:grid-cols-2 ${i % 2 ? "md:[&>div:first-child]:order-2" : ""}`}>
            <div>
              <div className="flex flex-wrap items-center gap-3"><h2 className="font-heading text-3xl font-extrabold text-navy">{f.title}</h2><StatusTag status={f.status} /></div>
              <p className="mt-3 text-lg text-ink-muted">{f.summary}</p>
              <ul className="mt-5 space-y-2">{f.points.map((p) => <li key={p} className="flex gap-3 text-sm"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal-accent" />{p}</li>)}</ul>
            </div>
            <div className="rounded-2xl border border-line bg-white p-5 shadow-sm"><Visual kind={f.visual} /><p className="mt-3 text-[11px] text-ink-muted">Illustrative example</p></div>
          </div>
        </Section>
      ))}
      <Section tone="navy" className="text-center">
        <Heading dark lead="Try the available features today." />
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/signup" className="rounded-xl bg-teal-accent px-6 py-3 font-semibold text-navy-deep">Get Started</Link>
          <Link href="/pricing" className="rounded-xl border border-white/30 px-6 py-3 font-semibold text-white">See pricing</Link>
        </div>
      </Section>
    </>
  );
}
