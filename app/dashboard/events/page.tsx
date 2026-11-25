import { Plus } from "lucide-react";
import { SubmitButton } from "@/components/auth/fields";
import { DateTimeInput, LocalTime } from "@/components/dashboard/client";
import { Badge, btnDanger, btnGhost, Card, Disclosure, Empty, Input, Notice, PageHeader, ReadOnlyNote, Select, Textarea } from "@/components/dashboard/ui";
import { getCtx } from "@/lib/ctx";
import { deleteEvent, saveEvent, setEventStatus } from "./actions";

export const metadata = { title: "Hiring Events | Onboard AI" };
type Ev = { id: string; title: string; event_type: string; starts_at: string; location: string | null; description: string | null; capacity: number | null; status: string };
const TYPES = [["virtual", "Virtual"], ["in_person", "In person"]] as const;

function EventForm({ ev }: { ev?: Ev }) {
  return (
    <form action={saveEvent} className="grid gap-3 sm:grid-cols-2">
      {ev && <input type="hidden" name="id" value={ev.id} />}
      <Input label="Title" name="title" required defaultValue={ev?.title} />
      <Select label="Format" name="event_type" options={TYPES} defaultValue={ev?.event_type ?? "virtual"} />
      <DateTimeInput name="starts_at" label="Date and time" defaultIso={ev?.starts_at} />
      <Input label="Capacity" name="capacity" type="number" min={1} defaultValue={ev?.capacity ?? ""} />
      <div className="sm:col-span-2"><Input label="Location or video link" name="location" defaultValue={ev?.location ?? ""} /></div>
      <div className="sm:col-span-2"><Textarea label="Description" name="description" defaultValue={ev?.description ?? ""} /></div>
      <div className="max-w-40"><SubmitButton>{ev ? "Save changes" : "Create event"}</SubmitButton></div>
    </form>
  );
}

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const sp = await searchParams;
  const ctx = await getCtx();
  const { data } = await ctx.supabase.from("oa_hiring_events").select("*").order("starts_at", { ascending: false });
  const evs = (data ?? []) as Ev[];
  return (
    <>
      <PageHeader title="Hiring Events" subtitle="Plan virtual and in person hiring events." />
      <Notice notice={sp.notice} error={sp.error} />
      <ReadOnlyNote canWrite={ctx.canWrite} />
      {ctx.canWrite && <div className="mb-6"><Disclosure summary={<><Plus size={16} />New event</>}><EventForm /></Disclosure></div>}
      {evs.length === 0 ? <Empty title="No events yet">Create a hiring event to track its date, format and capacity.</Empty> : (
        <div className="space-y-4">{evs.map((e) => (
          <Card key={e.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h2 className="font-heading text-lg font-bold text-navy">{e.title}</h2>
                <p className="text-sm text-ink-muted"><LocalTime iso={e.starts_at} /> · {e.event_type === "virtual" ? "Virtual" : "In person"}{e.location ? ` · ${e.location}` : ""}{e.capacity ? ` · Capacity ${e.capacity}` : ""}</p>
                {e.description && <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{e.description}</p>}</div>
              <Badge tone={e.status === "scheduled" ? "blue" : e.status === "completed" ? "green" : "red"}>{e.status}</Badge>
            </div>
            {ctx.canWrite && (
              <div className="mt-4 flex flex-wrap items-start gap-2">
                {(["scheduled", "completed", "cancelled"] as const).filter((st) => st !== e.status).map((st) => (
                  <form key={st} action={setEventStatus}><input type="hidden" name="id" value={e.id} /><input type="hidden" name="status" value={st} />
                    <button className={btnGhost}>{st === "scheduled" ? "Reopen" : st === "completed" ? "Mark completed" : "Cancel event"}</button></form>
                ))}
                <form action={deleteEvent}><input type="hidden" name="id" value={e.id} /><button className={btnDanger}>Delete</button></form>
                <Disclosure ghost summary="Edit"><EventForm ev={e} /></Disclosure>
              </div>
            )}
          </Card>
        ))}</div>
      )}
      <p className="mt-6 text-sm text-ink-muted">Registration forms, reminders and attendance tracking for events are not available yet. Events are planning records for now.</p>
    </>
  );
}
