import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import { SubmitButton } from "@/components/auth/fields";
import { DateTimeInput, LocalTime } from "@/components/dashboard/client";
import { Badge, btnDanger, btnGhost, Card, Disclosure, Empty, Input, Notice, PageHeader, ReadOnlyNote, Select } from "@/components/dashboard/ui";
import { getCtx } from "@/lib/ctx";
import { scheduleInterview, updateInterview } from "./actions";

export const metadata = { title: "Interviews | Onboard AI" };
type Iv = { id: string; candidate_id: string; scheduled_at: string; duration_minutes: number; interviewer: string | null; location: string | null; status: string };
const tone: Record<string, "blue" | "green" | "red" | "amber"> = { scheduled: "blue", completed: "green", cancelled: "red", no_show: "amber" };

export default async function InterviewsPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const sp = await searchParams;
  const ctx = await getCtx();
  const [{ data: ivs }, { data: cands }] = await Promise.all([
    ctx.supabase.from("oa_interviews").select("id, candidate_id, scheduled_at, duration_minutes, interviewer, location, status").order("scheduled_at", { ascending: false }),
    ctx.supabase.from("oa_candidates").select("id, full_name").order("full_name"),
  ]);
  const name = new Map((cands ?? []).map((c: { id: string; full_name: string }) => [c.id, c.full_name]));
  const now = Date.now();
  const all = (ivs ?? []) as Iv[];
  const upcoming = all.filter((i) => i.status === "scheduled" && Date.parse(i.scheduled_at) >= now).reverse();
  const past = all.filter((i) => !upcoming.includes(i));
  const candOptions = [["", "Choose a candidate"], ...(cands ?? []).map((c: { id: string; full_name: string }) => [c.id, c.full_name] as [string, string])] as [string, string][];

  const row = (i: Iv) => (
    <Card key={i.id}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={`/dashboard/candidates/${i.candidate_id}`} className="font-heading font-bold text-brand hover:underline">{name.get(i.candidate_id) ?? "Candidate"}</Link>
          <p className="text-sm text-ink-muted"><LocalTime iso={i.scheduled_at} /> · {i.duration_minutes} min{i.interviewer ? ` · ${i.interviewer}` : ""}{i.location ? ` · ${i.location}` : ""}</p>
        </div>
        <Badge tone={tone[i.status]}>{i.status.replace("_", " ")}</Badge>
      </div>
      {ctx.canWrite && (
        <div className="mt-3 flex flex-wrap items-start gap-2">
          {i.status === "scheduled" && (["completed", "no_show", "cancelled"] as const).map((st) => (
            <form key={st} action={updateInterview}><input type="hidden" name="id" value={i.id} /><input type="hidden" name="status" value={st} />
              <button className={st === "cancelled" ? btnDanger : btnGhost}>{st === "completed" ? "Mark attended" : st === "no_show" ? "Mark no show" : "Cancel"}</button></form>
          ))}
          <Disclosure ghost summary="Reschedule">
            <form action={updateInterview} className="flex flex-wrap items-end gap-3"><input type="hidden" name="id" value={i.id} />
              <DateTimeInput name="scheduled_at" label="New date and time" defaultIso={i.scheduled_at} /><SubmitButton>Reschedule</SubmitButton></form>
          </Disclosure>
        </div>
      )}
    </Card>
  );

  return (
    <>
      <PageHeader title="Interviews" subtitle="Schedule interviews, reschedule or cancel them, and track attendance." />
      <Notice notice={sp.notice} error={sp.error} />
      <ReadOnlyNote canWrite={ctx.canWrite} />
      {ctx.canWrite && (
        <div className="mb-6"><Disclosure summary={<><CalendarPlus size={16} />Schedule interview</>}>
          <form action={scheduleInterview} className="grid gap-3 sm:grid-cols-2">
            <Select label="Candidate" name="candidate_id" options={candOptions} required />
            <DateTimeInput name="scheduled_at" label="Date and time" />
            <Input label="Duration in minutes" name="duration_minutes" type="number" min={5} max={480} defaultValue={30} />
            <Input label="Interviewer" name="interviewer" placeholder="Name of the interviewer" />
            <div className="sm:col-span-2"><Input label="Location or video link" name="location" /></div>
            <div className="max-w-44"><SubmitButton>Schedule</SubmitButton></div>
          </form></Disclosure></div>
      )}
      <h2 className="mb-3 font-heading text-lg font-bold text-navy">Upcoming</h2>
      <div className="mb-8 space-y-3">{upcoming.length ? upcoming.map(row) : <Empty title="No upcoming interviews" />}</div>
      <h2 className="mb-3 font-heading text-lg font-bold text-navy">Past and closed</h2>
      <div className="mb-8 space-y-3">{past.length ? past.map(row) : <Empty title="Nothing here yet" />}</div>
      <Card>
        <h2 className="font-heading text-base font-bold text-navy">Calendars and reminders</h2>
        <p className="mt-2 text-sm text-ink-muted">No calendar is connected. Google Calendar and Outlook sync, candidate self scheduling and automatic reminders are not available yet, so interviews are recorded here and are not added to external calendars. <Link href="/dashboard/integrations" className="text-brand hover:underline">See integrations</Link></p>
      </Card>
    </>
  );
}
