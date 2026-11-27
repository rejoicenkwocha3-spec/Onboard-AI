import Link from "next/link";
import { FEATURES } from "@/lib/marketing";
import { Heading, Section, StatusTag, Visual } from "@/components/marketing/ui";

export const metadata = { title: "Platform | Onboard AI" };

const JOURNEY = [
  ["Attract", "Publish jobs and a branded career page. Every job gets its own application link.", ["Job Management", "Career Page Builder"]],
  ["Engage", "Candidates apply in a short chat and get answers from your assistant.", ["Conversational Applications", "AI Recruitment Assistant"]],
  ["Screen", "Your questions and minimum requirements organize every response for human review.", ["Candidate Screening", "Candidate CRM"]],
  ["Schedule", "Book interviews, track attendance and keep the conversation in one place.", ["Interview Scheduling", "Communication Hub", "Hiring Events"]],
  ["Onboard", "Turn an accepted offer into a checklist and give new hires their own portal.", ["Employee Onboarding", "Employee Portal", "Document Management"]],
  ["Improve", "See what is working with live analytics and a clear record of what changed.", ["Analytics", "Workflow Automation", "Team Collaboration"]],
] as const;

const SECURITY = [
  ["Database level access control", "Row Level Security keeps every organization's records separate. Rules are enforced in the database, not only in the interface."],
  ["Role based permissions", "Owners, admins, HR managers, recruiters, hiring managers and employees each get the access their role needs."],
  ["Private document storage", "Files are stored privately. Download links expire after a few minutes."],
  ["Server side AI keys", "AI provider keys stay on the server and are never sent to the browser."],
  ["Activity log", "Important changes are recorded with who made them and when."],
  ["Human decisions", "Screening compares answers with your criteria. It never ranks people on personal characteristics and never rejects anyone automatically."],
];

export default function PlatformPage() {
  return (
    <>
      <section className="bg-white px-4 pb-12 pt-14 text-center sm:pt-20">
        <h1 className="mx-auto max-w-4xl font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-navy sm:text-6xl">One platform from <span className="text-teal-accent">first hello to first day.</span></h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-muted">Onboard AI connects recruitment and employee onboarding, so what you learn about a candidate carries through to their first week.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/signup" className="rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-light">Get Started</Link>
          <Link href="/features" className="rounded-xl border border-line px-6 py-3 font-semibold text-navy hover:bg-surface">See all features</Link>
        </div>
      </section>

      <Section tone="soft">
        <Heading lead="How the modules" accent="work together." sub="Follow a candidate through the platform. Each step feeds the next." />
        <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {JOURNEY.map(([t, d, mods], i) => (
            <li key={t} className="rounded-2xl border border-line bg-white p-6">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-sm font-bold text-white">{i + 1}</span>
              <h3 className="mt-4 font-heading text-xl font-bold text-navy">{t}</h3>
              <p className="mt-2 text-sm text-ink-muted">{d}</p>
              <p className="mt-3 text-xs font-semibold text-brand">{mods.join(" · ")}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section>
        <Heading lead="Every module," accent="in one workspace." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex flex-col rounded-2xl border border-line bg-white p-6">
              <div className="mb-4 rounded-xl bg-surface p-4"><Visual kind={f.visual} /></div>
              <div className="flex items-start justify-between gap-2"><h3 className="font-heading text-lg font-bold text-navy">{f.title}</h3><StatusTag status={f.status} /></div>
              <p className="mt-2 text-sm text-ink-muted">{f.summary}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="navy">
        <Heading dark lead="Built to protect" accent="people's data." sub="Hiring involves personal information. Security is part of how the platform is built." />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {SECURITY.map(([t, d]) => <div key={t} className="rounded-2xl border border-white/10 bg-white/5 p-6"><h3 className="font-heading font-bold text-teal-accent">{t}</h3><p className="mt-2 text-sm text-white/75">{d}</p></div>)}
        </div>
      </Section>

      <Section tone="blue" className="text-center">
        <h2 className="mx-auto max-w-2xl font-heading text-3xl font-extrabold text-navy sm:text-4xl">See it with your own jobs.</h2>
        <p className="mx-auto mt-3 max-w-xl text-ink-muted">Create an account, publish a job and share the application link in a few minutes.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/signup" className="rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-light">Get Started</Link>
          <Link href="/solutions" className="rounded-xl border border-line bg-white px-6 py-3 font-semibold text-navy">Explore solutions</Link>
        </div>
      </Section>
    </>
  );
}
