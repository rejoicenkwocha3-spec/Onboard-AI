import { Plus } from "lucide-react";
import { SubmitButton } from "@/components/auth/fields";
import { LocalTime } from "@/components/dashboard/client";
import { Badge, btnDanger, btnGhost, Card, Disclosure, Empty, Input, Notice, PageHeader, ReadOnlyNote, Select, Textarea } from "@/components/dashboard/ui";
import { getCtx } from "@/lib/ctx";
import { createTemplate, deleteTemplate, setTask, startProcess } from "./actions";

export const metadata = { title: "Onboarding | Onboard AI" };
type Task = { id: string; process_id: string; title: string; due_date: string | null; status: string };
const TEMPLATE_STARTER = "Send welcome message\nCollect employee information\nRequest identification documents\nAcknowledge company policies\nReceive employee handbook\nAssign equipment\nSchedule orientation\nIntroduce manager\nShare first day instructions";

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ candidate?: string; notice?: string; error?: string }> }) {
  const sp = await searchParams;
  const ctx = await getCtx();
  const [{ data: tpls }, { data: procs }, { data: tasks }, { data: cand }] = await Promise.all([
    ctx.supabase.from("oa_onboarding_templates").select("id, name, department, tasks").order("created_at", { ascending: false }),
    ctx.supabase.from("oa_onboarding_processes").select("id, employee_name, employee_email, start_date, created_at").order("created_at", { ascending: false }),
    ctx.supabase.from("oa_onboarding_tasks").select("id, process_id, title, due_date, status").order("position"),
    sp.candidate ? ctx.supabase.from("oa_candidates").select("id, full_name, email").eq("id", sp.candidate).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const byProc = new Map<string, Task[]>();
  ((tasks ?? []) as Task[]).forEach((t) => byProc.set(t.process_id, [...(byProc.get(t.process_id) ?? []), t]));
  const tplOptions = [["", "Choose a template"], ...(tpls ?? []).map((t: { id: string; name: string }) => [t.id, t.name] as [string, string])] as [string, string][];

  return (
    <>
      <PageHeader title="Onboarding" subtitle="Create onboarding templates, start a checklist for each new employee and track progress." />
      <Notice notice={sp.notice} error={sp.error} />
      <ReadOnlyNote canWrite={ctx.canWrite} />
      {ctx.canWrite && (
        <div className="mb-6 flex flex-wrap items-start gap-3">
          <Disclosure open={!!cand} summary={<><Plus size={16} />Start onboarding</>}>
            <form action={startProcess} className="grid gap-3 sm:grid-cols-2">
              {cand && <input type="hidden" name="candidate_id" value={cand.id} />}
              <Input label="Employee name" name="employee_name" required defaultValue={cand?.full_name ?? ""} />
              <Input label="Employee email" name="employee_email" type="email" required defaultValue={cand?.email ?? ""} />
              <Select label="Template" name="template_id" options={tplOptions} required />
              <Input label="Start date" name="start_date" type="date" defaultValue={today} />
              <Input label="Days to complete each task" name="days" type="number" min={0} max={365} defaultValue={7} />
              <div className="max-w-44 self-end"><SubmitButton>Start onboarding</SubmitButton></div>
            </form>
          </Disclosure>
          <Disclosure ghost summary="New template">
            <form action={createTemplate} className="space-y-3">
              <Input label="Template name" name="name" required placeholder="Retail staff onboarding" />
              <Input label="Department or role" name="department" />
              <Textarea label="Tasks" name="tasks" rows={8} required defaultValue={TEMPLATE_STARTER} hint="One task per line." />
              <SubmitButton>Save template</SubmitButton>
            </form>
          </Disclosure>
        </div>
      )}

      <h2 className="mb-3 font-heading text-lg font-bold text-navy">Employee checklists</h2>
      {(procs ?? []).length === 0 ? <Empty title="No onboarding in progress">Move a candidate to Hired, then start onboarding from their profile.</Empty> : (
        <div className="mb-8 space-y-4">
          {(procs ?? []).map((p: { id: string; employee_name: string; employee_email: string; start_date: string | null; created_at: string }) => {
            const ts = byProc.get(p.id) ?? [];
            const done = ts.filter((t) => t.status === "completed").length;
            const overdue = ts.filter((t) => t.status === "pending" && t.due_date && t.due_date < today).length;
            const pct = ts.length ? Math.round((done / ts.length) * 100) : 0;
            return (
              <Card key={p.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div><h3 className="font-heading text-base font-bold text-navy">{p.employee_name}</h3>
                    <p className="text-sm text-ink-muted">{p.employee_email}{p.start_date ? " · starts " : ""}{p.start_date && <LocalTime iso={p.start_date + "T00:00:00Z"} dateOnly />}</p></div>
                  <div className="flex gap-2"><Badge tone="green">{done} completed</Badge><Badge>{ts.length - done - overdue} pending</Badge>{overdue > 0 && <Badge tone="red">{overdue} overdue</Badge>}</div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-success" style={{ width: `${pct}%` }} /></div>
                <p className="mt-1 text-xs text-ink-muted">{pct}% complete</p>
                <ul className="mt-3 divide-y divide-line text-sm">
                  {ts.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-3 py-2">
                      <span className={t.status === "completed" ? "text-ink-muted line-through" : ""}>{t.title}{t.status === "pending" && t.due_date && t.due_date < today && <Badge tone="red"> overdue</Badge>}</span>
                      {ctx.canWrite && <form action={setTask}><input type="hidden" name="id" value={t.id} /><input type="hidden" name="done" value={t.status === "completed" ? "0" : "1"} />
                        <button className={btnGhost}>{t.status === "completed" ? "Reopen" : "Mark done"}</button></form>}
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      )}

      <h2 className="mb-3 font-heading text-lg font-bold text-navy">Templates</h2>
      {(tpls ?? []).length === 0 ? <Empty title="No templates yet">Create a template with the tasks every new employee should complete.</Empty> : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(tpls ?? []).map((t: { id: string; name: string; department: string | null; tasks: string[] }) => (
            <Card key={t.id}><div className="flex items-start justify-between gap-2"><div><h3 className="font-heading font-bold text-navy">{t.name}</h3><p className="text-xs text-ink-muted">{t.department || "All departments"} · {t.tasks.length} tasks</p></div>
              {ctx.canWrite && <form action={deleteTemplate}><input type="hidden" name="id" value={t.id} /><button className={btnDanger}>Delete</button></form>}</div>
              <ul className="mt-3 list-disc space-y-0.5 pl-5 text-sm text-ink-muted">{t.tasks.slice(0, 5).map((x, i) => <li key={i}>{x}</li>)}{t.tasks.length > 5 && <li>and {t.tasks.length - 5} more</li>}</ul></Card>
          ))}
        </div>
      )}
    </>
  );
}
