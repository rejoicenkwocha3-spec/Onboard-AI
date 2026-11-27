import Link from "next/link";
import { PLANS, PLAN_FACTS } from "@/lib/pricing";
import { Heading, Section } from "@/components/marketing/ui";

export const metadata = { title: "Pricing | Onboard AI" };

export default function PricingPage() {
  return (
    <>
      <section className="bg-white px-4 pb-4 pt-14 text-center sm:pt-20">
        <h1 className="mx-auto max-w-4xl font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-navy sm:text-6xl">Simple monthly <span className="text-teal-accent">pricing.</span></h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-muted">Choose a plan and subscribe through Selar. You can cancel at any time.</p>
      </section>
      <Section>
        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((p, i) => (
            <div key={p.href} className={`flex flex-col rounded-3xl border bg-white p-8 ${i === 1 ? "border-brand shadow-xl" : "border-line"}`}>
              <h2 className="font-heading text-xl font-extrabold text-navy">{p.name}</h2>
              <p className="mt-4 font-heading text-5xl font-extrabold text-navy">{p.price}</p>
              <p className="text-sm text-ink-muted">{p.billing}</p>
              {p.description && <p className="mt-4 text-ink-muted">{p.description}</p>}
              <ul className="mt-6 flex-1 space-y-2 text-sm">
                {[...p.features, ...(p.features.length ? [] : PLAN_FACTS)].map((f) => <li key={f} className="flex gap-3"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal-accent" />{f}</li>)}
              </ul>
              <a href={p.href} target="_blank" rel="noopener noreferrer" className="mt-8 block rounded-xl bg-brand px-5 py-3 text-center font-semibold text-white hover:bg-brand-light">Subscribe to {p.name}</a>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-ink-muted">Each button opens that plan's secure checkout on Selar in a new tab. Your subscription is activated only after Selar confirms your payment, never because a checkout button was clicked.</p>
      </Section>
      <Section tone="soft" className="text-center">
        <Heading lead="Questions about plans?" sub="Create an account to explore the workspace first, then subscribe when you are ready." />
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/signup" className="rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-light">Get Started</Link>
          <Link href="/features" className="rounded-xl border border-line bg-white px-6 py-3 font-semibold text-navy">See features</Link>
        </div>
      </Section>
    </>
  );
}
