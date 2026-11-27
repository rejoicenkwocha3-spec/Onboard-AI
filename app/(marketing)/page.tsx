import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FAQS, FEATURES } from "@/lib/marketing";
import { PLANS } from "@/lib/pricing";
import { IndustryTabs } from "@/components/marketing/IndustryTabs";
import { Chat, DashboardMock, Heading, PhoneFrame, Section, StatusTag, Visual } from "@/components/marketing/ui";

export const metadata = { title: "Onboard AI | Every great hire starts with a better experience" };

const CARDS = ["Conversational Applications", "Candidate Screening", "Interview Scheduling", "Candidate CRM", "Employee Onboarding", "Workflow Automation"];
const PILLARS = [
  ["Intelligence", "Assistants that answer from the information you provide, follow your rules and pass the conversation to a person when it matters."],
  ["Automation", "Less copying between inboxes and spreadsheets. Applications, screening answers, interviews and onboarding tasks live in one workspace."],
  ["Experience", "A short, friendly chat for candidates and a clear checklist for new employees, on any phone."],
];

export default function Home() {
  return (
    <>
      <section className="overflow-hidden bg-white px-4 pb-16 pt-14 sm:pt-20">
        <div className="mx-auto max-w-6xl text-center">
          <h1 className="mx-auto max-w-4xl font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-navy sm:text-6xl lg:text-7xl">
            Every great hire starts with a <span className="text-teal-accent">better experience.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-muted">
            Meet the intelligent hiring platform that helps you engage candidates, automate recruitment, schedule interviews, and onboard new employees from one workspace.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/signup" className="rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-light">Get Started</Link>
            <Link href="/platform" className="rounded-xl border border-line bg-white px-6 py-3 font-semibold text-navy hover:bg-surface">Explore Platform</Link>
          </div>
          <div className="mt-14 grid items-end gap-6 md:grid-cols-3">
            <div className="hidden md:block"><PhoneFrame title="Apply"><Chat items={[["bot", "Thanks for your interest in the Store Associate role. What is your full name?"], ["me", "Amara Okafor"], ["bot", "Can you work weekends?"], ["me", "Yes"]]} /></PhoneFrame></div>
            <div className="md:-translate-y-6"><DashboardMock /></div>
            <div className="hidden md:block"><PhoneFrame title="Welcome"><Chat items={[["bot", "Welcome to the team, Amara. Here is your first week checklist."], ["bot", "1. Sign the policies. 2. Upload your ID. 3. Meet your manager."], ["me", "Done with the first one"]]} /></PhoneFrame></div>
          </div>
          <p className="mt-4 text-xs text-ink-muted">Illustrative product examples</p>
        </div>
      </section>

      <Section tone="soft">
        <Heading lead="Automate the repetitive work:" accent="everywhere you hire." sub="Each part of the hiring journey works on its own and gets better when they work together." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((c) => {
            const f = FEATURES.find((x) => x.title === c)!;
            return (
              <Link key={c} href="/features" className="group flex flex-col rounded-2xl border border-line bg-white p-6 transition hover:shadow-lg">
                <div className="mb-5 rounded-xl bg-surface p-4"><Visual kind={f.visual} /></div>
                <h3 className="font-heading text-xl font-bold text-navy">{c}</h3>
                <p className="mt-2 flex-1 text-sm text-ink-muted">{f.summary}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">Learn more <ArrowRight size={16} className="transition group-hover:translate-x-1" /></span>
              </Link>
            );
          })}
        </div>
      </Section>

      <Section>
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <h2 className="font-heading text-3xl font-extrabold leading-tight text-navy sm:text-5xl">Say hello to the recruiting assistant that <span className="text-teal-accent">welcomes every candidate.</span></h2>
            <p className="mt-5 text-lg text-ink-muted">Give your assistant a name, a tone and the rules it must follow. It answers from your information, collects what you need and hands over to your team when a person should step in.</p>
            <ul className="mt-6 space-y-2 text-ink">
              {["Choose its name, tone, language and instructions", "Decide which actions it may take", "Set escalation rules for a human handoff", "Support recruiters: it never makes hiring decisions"].map((t) => <li key={t} className="flex gap-3"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-teal-accent" />{t}</li>)}
            </ul>
            <Link href="/features" className="mt-8 inline-flex rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-light">See how it works</Link>
          </div>
          <PhoneFrame title="Ava, Onboard AI"><Chat items={[["me", "Is this role remote?"], ["bot", "This position is based in Lagos with two remote days each week."], ["me", "What happens after I apply?"], ["bot", "A recruiter reviews your answers, then you may be invited to an interview."]]} /></PhoneFrame>
        </div>
      </Section>

      <Section tone="soft">
        <Heading lead="The right workflow for" accent="every industry." sub="Retail, hospitality, healthcare, logistics, manufacturing, franchise groups and agencies each hire differently. Shape the conversation to match." />
        <IndustryTabs />
        <div className="mt-8 text-center"><Link href="/solutions" className="font-semibold text-brand hover:underline">Explore all solutions</Link></div>
      </Section>

      <Section>
        <Heading lead="The right solution," accent="right sized for you." />
        <div className="grid gap-5 md:grid-cols-2">
          {[["Enterprise Organizations", "Role based access enforced in the database, an activity log of important changes, and separate assistants and templates for each business unit."], ["Small and Medium Businesses", "Start with one job and one link in minutes. Replace spreadsheets and inbox threads, then add screening, interviews and onboarding as you grow."]].map(([t, d], i) => (
            <div key={t} className={`rounded-3xl p-8 ${i ? "bg-brand-soft" : "bg-surface"}`}>
              <h3 className="font-heading text-2xl font-extrabold text-navy">{t}</h3>
              <p className="mt-3 text-ink-muted">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="navy">
        <Heading dark lead="Hire smarter. Welcome better." accent="Grow faster." />
        <div className="grid gap-5 md:grid-cols-3">
          {PILLARS.map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-white/10 bg-white/5 p-6"><h3 className="font-heading text-xl font-bold text-teal-accent">{t}</h3><p className="mt-2 text-white/75">{d}</p></div>
          ))}
        </div>
      </Section>

      <Section>
        <Heading lead="Simple monthly" accent="pricing." sub="Three plans, billed monthly through Selar. Cancel at any time." />
        <div className="grid gap-5 md:grid-cols-3">
          {PLANS.map((p) => (
            <div key={p.name} className="rounded-2xl border border-line bg-white p-6 text-center">
              <h3 className="font-heading text-lg font-bold text-navy">{p.name}</h3>
              <p className="mt-2 font-heading text-4xl font-extrabold text-navy">{p.price}<span className="text-base font-medium text-ink-muted"> {p.billing}</span></p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center"><Link href="/pricing" className="rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-light">See pricing</Link></div>
      </Section>

      <Section tone="soft" id="faq">
        <Heading lead="Frequently asked" accent="questions." />
        <div className="mx-auto max-w-3xl divide-y divide-line rounded-2xl border border-line bg-white">
          {FAQS.map(([q, a]) => (
            <details key={q} className="group px-6 py-4">
              <summary className="cursor-pointer list-none font-heading font-bold text-navy [&::-webkit-details-marker]:hidden">{q}</summary>
              <p className="mt-2 text-ink-muted">{a}</p>
            </details>
          ))}
        </div>
      </Section>

      <Section tone="navy" className="text-center">
        <h2 className="mx-auto max-w-3xl font-heading text-3xl font-extrabold text-white sm:text-5xl">Ready to give every candidate a better experience?</h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/signup" className="rounded-xl bg-teal-accent px-6 py-3 font-semibold text-navy-deep hover:opacity-90">Get Started</Link>
          <Link href="/platform" className="rounded-xl border border-white/30 px-6 py-3 font-semibold text-white hover:bg-white/10">Explore Platform</Link>
        </div>
      </Section>
    </>
  );
}
