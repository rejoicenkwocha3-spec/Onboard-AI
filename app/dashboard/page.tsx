import Link from "next/link";
import { LocalTime } from "@/components/dashboard/client";
import { Badge, Card, Empty, Notice, PageHeader, Stat } from "@/components/dashboard/ui";
import { STAGES } from "@/lib/constants";
import { getCtx } from "@/lib/ctx";

export const metadata = { title: "Overview | Onboard AI" };

const ACTIONS = [["/dashboard/jobs", "Create a job"], ["/dashboard/candidates", "Add a candidate"], ["/dashboard/interviews", "Schedule an interview"], ["/dashboard/onboarding", "Start onboarding"], ["/dashboard/assistant", "Set up an assistant"]];

export default async function OverviewPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const sp = await searchParams;
  const ctx = await getCtx();
  const sb = ctx.supabase;
  const nowIso = new Date().toISOString();
  const today = nowIso.slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const [jobs, cands, ivs, tasks, logs, agents, usage, org] = await Promise.all([
    sb.from("oa_jobs").select("id", { count: "exact", head: true }).eq("status", "published"),
    sb.from("oa_candidates").select("stage"),
    sb.from("oa_interviews").select("id, candidate_id, scheduled_at, interviewer").eq("status", "scheduled").gte("scheduled_at", nowIso).order("scheduled_at").limit(5),
    sb.from("oa_onboarding_tasks").select("due_date").eq("status", "pending"),
    sb.from("oa_audit_logs").select("id, action, detail, created_at").order("created_at", { ascending: false }).limit(8),
    sb.from("oa_agents").select("id, status"),
    sb.from("oa_usage_events").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
    sb.from("oa_organizations").select("onboarding_completed_at").eq("id", ctx.orgId).maybeSingle(),
  ]);
  const stageCount = new Map<string, number>();
  (cands.data ?? []).forEach((c: { stage: string }) => stageCount.set(c.stage, (stageCount.get(c.stage) ?? 0) + 1));
  const total = cands.data?.length ?? 0;
  const pending = tasks.data ?? [];
  const overdue = pending.filter((t: { due_date: string | null }) => t.due_date && t.due_date < today).length;
  const candIds = (ivs.data ?? []).map((i: { candidate_id: string }) => i.candidate_id);
  const { data: names } = candIds.length ? await sb.from("oa_candidates").select("id, full_name").in("id", candIds) : { data: [] };
  const name = new Map((names ?? []).map((n: { id: string; full_name: string }) => [n.id, n.full_name]));
  const maxStage = Math.max(1, ...STAGES.map(([k]) => stageCount.get(k) ?? 0));

  return (
    <>
      <PageHeader title={`Welcome, ${ctx.fullName.split(" ")[0] || "there"}`} subtitle={`Here is what is happening at ${ctx.orgName}.`} />
      <Notice notice={sp.notice} error={sp.error} />
      {!org.data?.onboarding_completed_at && ctx.isAdmin && (
        <Card className="mb-6 !border-brand/30 !bg-brand-soft"><p className="text-sm">Finish setting up your organization: <Link href="/onboarding" className="font-semibold text-brand hover:underline">complete company setup</Link></p></Card>
      )}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Active job openings" value={jobs.count ?? 0} />
        <Stat label="Total applicants" value={total} />
        <Stat label="Upcoming interviews" value={ivs.data?.length ?? 0} hint="Next scheduled" />
        <Stat label="Pending onboarding tasks" value={pending.length} hint={overdue ? `${overdue} overdue` : "None overdue"} />
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-3 font-heading text-base font-bold text-navy">Candidate pipeline</h2>
          {total === 0 ? <Empty title="No candidates yet">Share a job link or add a candidate to start your pipeline.</Empty> : (
            <ul className="space-y-2.5">{STAGES.map(([k, label]) => (
              <li key={k} className="flex items-center gap-3 text-sm"><span className="w-28 shrink-0 text-ink-muted">{label}</span>
                <span className="h-3 flex-1 overflow-hidden rounded-full bg-surface"><span className="block h-full bg-brand" style={{ width: `${((stageCount.get(k) ?? 0) / maxStage) * 100}%` }} /></span>
                <span className="w-8 text-right font-semibold">{stageCount.get(k) ?? 0}</span></li>
            ))}</ul>
          )}
        </Card>
        <Card>
          <h2 className="mb-3 font-heading text-base font-bold text-navy">Quick actions</h2>
          <ul className="space-y-1.5">{ACTIONS.map(([href, label]) => <li key={href}><Link href={href} className="block rounded-lg px-3 py-2 text-sm font-medium text-brand hover:bg-brand-soft">{label}</Link></li>)}</ul>
        </Card>
        <Card>
          <h2 className="mb-3 font-heading text-base font-bold text-navy">Upcoming interviews</h2>
          {(ivs.data ?? []).length === 0 ? <p className="text-sm text-ink-muted">Nothing scheduled.</p> : (
            <ul className="space-y-2 text-sm">{(ivs.data ?? []).map((i: { id: string; candidate_id: string; scheduled_at: string; interviewer: string | null }) => (
              <li key={i.id}><Link href={`/dashboard/candidates/${i.candidate_id}`} className="font-semibold text-brand hover:underline">{name.get(i.candidate_id) ?? "Candidate"}</Link><p className="text-xs text-ink-muted"><LocalTime iso={i.scheduled_at} />{i.interviewer ? ` · ${i.interviewer}` : ""}</p></li>
            ))}</ul>
          )}
        </Card>
        <Card>
          <h2 className="mb-3 font-heading text-base font-bold text-navy">AI assistant activity</h2>
          <p className="text-sm">{agents.data?.length ?? 0} assistant{agents.data?.length === 1 ? "" : "s"} configured, {(agents.data ?? []).filter((a: { status: string }) => a.status === "active").length} active</p>
          <p className="mt-1 text-sm text-ink-muted">{usage.count ?? 0} AI test message{usage.count === 1 ? "" : "s"} in the last 7 days</p>
          <Link href="/dashboard/assistant" className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">Manage assistants</Link>
        </Card>
        <Card>
          <h2 className="mb-3 font-heading text-base font-bold text-navy">Recruitment activity</h2>
          {(logs.data ?? []).length === 0 ? <p className="text-sm text-ink-muted">No activity yet.</p> : (
            <ul className="space-y-2 text-sm">{(logs.data ?? []).map((l: { id: string; action: string; detail: string | null; created_at: string }) => (
              <li key={l.id}><Badge>{l.action.replace(/[._]/g, " ")}</Badge>{l.detail && <span className="text-ink-muted"> {l.detail}</span>}<p className="text-xs text-ink-muted"><LocalTime iso={l.created_at} /></p></li>
            ))}</ul>
          )}
        </Card>
      </div>
    </>
  );
}
