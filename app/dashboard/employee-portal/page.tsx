import { LocalTime } from "@/components/dashboard/client";
import { Badge, btn, Card, Empty, Notice, PageHeader } from "@/components/dashboard/ui";
import { getCtx } from "@/lib/ctx";
import { setTask } from "../onboarding/actions";

export const metadata = { title: "Employee Portal | Onboard AI" };
type Task = { id: string; process_id: string; title: string; due_date: string | null; status: string };

export default async function EmployeePortalPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const sp = await searchParams;
  const ctx = await getCtx();
  const email = (ctx.user.email ?? "").toLowerCase();
  const { data: procs } = await ctx.supabase.from("oa_onboarding_processes").select("id, employee_name, start_date, organization_id").ilike("employee_email", email);
  const ids = (procs ?? []).map((p: { id: string }) => p.id);
  const { data: tasks } = ids.length ? await ctx.supabase.from("oa_onboarding_tasks").select("id, process_id, title, due_date, status").in("process_id", ids).order("position") : { data: [] };
  const { data: hr } = await ctx.supabase.from("oa_organization_members").select("user_id, role").in("role", ["owner", "admin", "hr_manager"]);
  const hrIds = (hr ?? []).map((h: { user_id: string }) => h.user_id);
  const { data: hrProfiles } = hrIds.length ? await ctx.supabase.from("oa_profiles").select("full_name, email").in("id", hrIds) : { data: [] };
  const today = new Date().toISOString().slice(0, 10);
  const all = (tasks ?? []) as Task[];
  const done = all.filter((t) => t.status === "completed").length;
  const pct = all.length ? Math.round((done / all.length) * 100) : 0;

  return (
    <>
      <PageHeader title="Employee Portal" subtitle="Your onboarding tasks, progress and HR contacts." />
      <Notice notice={sp.notice} error={sp.error} />
      {(procs ?? []).length === 0 ? (
        <Empty title="No onboarding assigned to you">
          Onboarding checklists appear here when your HR team starts onboarding for {ctx.user.email}. HR users manage checklists from the Onboarding page.
        </Empty>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Card>
              <h2 className="font-heading text-lg font-bold text-navy">Welcome, {procs![0].employee_name}</h2>
              {procs![0].start_date && <p className="mt-1 text-sm text-ink-muted">Your start date: <LocalTime iso={procs![0].start_date + "T00:00:00Z"} dateOnly /></p>}
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-success" style={{ width: `${pct}%` }} /></div>
              <p className="mt-1 text-xs text-ink-muted">{done} of {all.length} tasks complete ({pct}%)</p>
            </Card>
            <Card>
              <h2 className="mb-2 font-heading text-base font-bold text-navy">Your tasks</h2>
              <ul className="divide-y divide-line text-sm">
                {all.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                    <div><p className={t.status === "completed" ? "text-ink-muted line-through" : "font-medium text-ink"}>{t.title}</p>
                      {t.due_date && <p className="text-xs text-ink-muted">Due <LocalTime iso={t.due_date + "T00:00:00Z"} dateOnly />{t.status === "pending" && t.due_date < today && <> <Badge tone="red">overdue</Badge></>}</p>}</div>
                    {t.status === "completed" ? <Badge tone="green">Done</Badge> : (
                      <form action={setTask}><input type="hidden" name="id" value={t.id} /><input type="hidden" name="done" value="1" /><input type="hidden" name="return" value="/dashboard/employee-portal" /><button className={btn}>Mark done</button></form>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
          <Card>
            <h2 className="mb-2 font-heading text-base font-bold text-navy">Contact HR</h2>
            {(hrProfiles ?? []).length === 0 ? <p className="text-sm text-ink-muted">Contact the person who invited you to Onboard AI.</p> : (
              <ul className="space-y-2 text-sm">{(hrProfiles ?? []).map((h: { full_name: string; email: string }) => (
                <li key={h.email}><p className="font-medium">{h.full_name}</p><a className="text-brand hover:underline" href={`mailto:${h.email}`}>{h.email}</a></li>
              ))}</ul>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
