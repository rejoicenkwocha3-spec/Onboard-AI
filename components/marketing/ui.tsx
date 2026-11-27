import type { ReactNode } from "react";

export function Section({ children, tone = "white", id, className = "" }: { children: ReactNode; tone?: "white" | "soft" | "navy" | "blue"; id?: string; className?: string }) {
  const bg = { white: "bg-white", soft: "bg-surface", navy: "bg-navy-deep text-white", blue: "bg-brand-soft" }[tone];
  return <section id={id} className={`${bg} px-4 py-16 sm:py-24 ${className}`}><div className="mx-auto max-w-6xl">{children}</div></section>;
}

export function Heading({ lead, accent, sub, center = true, dark = false }: { lead: string; accent?: string; sub?: string; center?: boolean; dark?: boolean }) {
  return (
    <div className={`mb-10 sm:mb-14 ${center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}`}>
      <h2 className={`font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl ${dark ? "text-white" : "text-navy"}`}>
        {lead}{accent && <> <span className="text-teal-accent">{accent}</span></>}
      </h2>
      {sub && <p className={`mt-4 text-base sm:text-lg ${dark ? "text-white/70" : "text-ink-muted"}`}>{sub}</p>}
    </div>
  );
}

export function StatusTag({ status }: { status: "Available" | "Coming soon" }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${status === "Available" ? "bg-green-50 text-success" : "bg-amber-50 text-amber-700"}`}>{status}</span>;
}

export function PhoneFrame({ children, title = "Onboard AI", className = "" }: { children: ReactNode; title?: string; className?: string }) {
  return (
    <div className={`mx-auto w-full max-w-[260px] rounded-[2.2rem] border-[7px] border-navy-deep bg-white shadow-xl ${className}`}>
      <div className="mx-auto mt-2 h-4 w-20 rounded-full bg-navy-deep" />
      <div className="border-b border-line px-4 pb-2 pt-2 text-center text-xs font-semibold text-navy">{title}</div>
      <div className="min-h-[300px] space-y-2 px-3 py-3">{children}</div>
      <div className="mx-3 mb-3 flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs text-ink-muted">Type your answer</div>
    </div>
  );
}

export function Chat({ items, soft = false }: { items: readonly (readonly [string, string])[]; soft?: boolean }) {
  return (
    <>
      {items.map(([from, text], i) => (
        <div key={i} className={`flex ${from === "me" ? "justify-end" : ""}`}>
          <p className={`max-w-[88%] rounded-2xl px-3 py-2 text-xs leading-snug ${from === "me" ? "bg-brand text-white" : soft ? "border border-line bg-white text-ink" : "bg-surface text-ink"}`}>{text}</p>
        </div>
      ))}
    </>
  );
}

export function BrowserFrame({ children, url = "app.onboardai.example/dashboard" }: { children: ReactNode; url?: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
      <div className="flex items-center gap-2 border-b border-line bg-surface px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-300" /><span className="h-2.5 w-2.5 rounded-full bg-amber-300" /><span className="h-2.5 w-2.5 rounded-full bg-green-300" />
        <span className="ml-2 truncate rounded-md bg-white px-3 py-0.5 text-[11px] text-ink-muted">{url}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

const STAGES = [["New", 8], ["Screening", 6], ["Shortlisted", 4], ["Interview", 3], ["Offer", 1]] as const;
const Bar = ({ w, c = "bg-brand" }: { w: number; c?: string }) => <span className="block h-2 overflow-hidden rounded-full bg-surface"><span className={`block h-full ${c}`} style={{ width: `${w}%` }} /></span>;
const Row = ({ a, b, tag }: { a: string; b: string; tag?: string }) => (
  <div className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2 text-xs"><span><strong className="text-navy">{a}</strong> <span className="text-ink-muted">{b}</span></span>{tag && <span className="rounded-full bg-brand-soft px-2 py-0.5 font-semibold text-brand">{tag}</span>}</div>
);

/** Small product illustrations. All names and numbers are illustrative examples, not customer results. */
export function Visual({ kind }: { kind: string }) {
  switch (kind) {
    case "assistant": return <div className="space-y-2"><Row a="Ava" b="Recruitment assistant" tag="Active" /><div className="space-y-1.5 rounded-lg bg-surface p-3"><Chat soft items={[["me", "What are the working hours?"], ["bot", "The role runs Monday to Friday, 9 to 5. Would you like to apply?"]]} /></div></div>;
    case "apply": case "career": return <div className="space-y-1.5 rounded-lg bg-surface p-3"><Chat soft items={[["bot", "What is your full name?"], ["me", "Amara Okafor"], ["bot", "Thanks. What is your email?"]]} /></div>;
    case "screening": return <div className="space-y-2"><Row a="Licence held" b="Required" tag="Meets" /><Row a="Weekend shifts" b="Required" tag="Review" /><Row a="Reference" b="Optional" tag="Missing" /></div>;
    case "jobs": return <div className="space-y-2"><Row a="Store Associate" b="Lagos" tag="Published" /><Row a="Night Nurse" b="Abuja" tag="Draft" /><Row a="Driver" b="Remote" tag="Paused" /></div>;
    case "schedule": return <div className="space-y-2"><Row a="Tue 10:00" b="Phone screen" tag="Scheduled" /><Row a="Wed 14:30" b="Panel interview" tag="Scheduled" /><Row a="Mon 09:00" b="Phone screen" tag="Attended" /></div>;
    case "crm": return <div className="space-y-2">{STAGES.slice(0, 4).map(([s, n]) => <div key={s} className="flex items-center gap-3 text-xs"><span className="w-20 text-ink-muted">{s}</span><div className="flex-1"><Bar w={n * 11} /></div><span className="font-semibold">{n}</span></div>)}</div>;
    case "hub": return <div className="space-y-2"><Row a="Follow up" b="Internal note" tag="Open" /><Row a="Visa question" b="Handoff to a recruiter" tag="Handoff" /></div>;
    case "onboarding": case "portal": return <div className="space-y-2"><div className="mb-1 flex justify-between text-xs"><span className="font-semibold text-navy">Welcome checklist</span><span className="text-ink-muted">3 of 5</span></div><Bar w={60} c="bg-success" /><Row a="Sign policy" b="Done" /><Row a="Upload ID" b="Due Friday" tag="Pending" /></div>;
    case "docs": return <div className="space-y-2"><Row a="Handbook.pdf" b="Policy" /><Row a="Offer letter.docx" b="Offer" /><Row a="Safety training.pdf" b="Training" /></div>;
    case "workflow": return <div className="space-y-1.5 text-xs">{["Application received", "Send acknowledgment", "Collect screening answers", "Notify recruiter"].map((s, i) => <div key={s} className="flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-brand-soft font-bold text-brand">{i + 1}</span><span className="flex-1 rounded-lg border border-line px-3 py-1.5">{s}</span></div>)}</div>;
    case "events": return <div className="space-y-2"><Row a="Open day" b="In person" tag="Scheduled" /><Row a="Virtual fair" b="Online" tag="Scheduled" /></div>;
    case "analytics": return <div className="flex h-24 items-end gap-2">{[40, 65, 50, 85, 70, 95].map((h, i) => <span key={i} className="flex-1 rounded-t bg-brand" style={{ height: `${h}%`, opacity: 0.5 + i * 0.1 }} />)}</div>;
    case "team": return <div className="space-y-2"><Row a="Admin" b="Full access" /><Row a="Recruiter" b="Candidates and jobs" /><Row a="Hiring manager" b="Read access" /></div>;
    case "integrations": return <div className="space-y-2"><Row a="Calendars" b="Not connected" tag="Soon" /><Row a="Messaging" b="Not connected" tag="Soon" /><Row a="ATS" b="Not connected" tag="Soon" /></div>;
    default: return null;
  }
}

export function DashboardMock() {
  return (
    <BrowserFrame>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[["Open jobs", "6"], ["Applicants", "128"], ["Interviews", "9"]].map(([l, v]) => <div key={l} className="rounded-lg border border-line p-2"><p className="text-[10px] uppercase text-ink-muted">{l}</p><p className="font-heading text-xl font-extrabold text-navy">{v}</p></div>)}
      </div>
      <div className="mt-3 space-y-2">{STAGES.map(([s, n]) => <div key={s} className="flex items-center gap-3 text-xs"><span className="w-20 text-ink-muted">{s}</span><div className="flex-1"><Bar w={n * 12} /></div><span className="w-4 text-right font-semibold">{n}</span></div>)}</div>
      <p className="mt-3 text-[10px] text-ink-muted">Illustrative example</p>
    </BrowserFrame>
  );
}
