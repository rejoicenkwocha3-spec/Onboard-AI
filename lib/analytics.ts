import type { Ctx } from "./ctx";
import { STAGES } from "./constants";

export const RANGES = [["7", "Last 7 days"], ["30", "Last 30 days"], ["90", "Last 90 days"], ["all", "All time"]] as const;

export type Analytics = {
  since: string | null;
  totalApplicants: number; activeJobs: number; hired: number; conversionRate: number | null;
  screeningRate: number | null; interviewsScheduled: number; attendanceRate: number | null;
  offersMade: number; avgTimeToHire: number | null; onboardingCompletion: number | null;
  stages: { stage: string; label: string; count: number }[];
  perJob: { job: string; applications: number }[];
  activity: { day: string; events: number }[];
};

const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : null);

/** All figures come from the database for the current organization. Nothing is estimated. */
export async function getAnalytics(ctx: Ctx, range: string): Promise<Analytics> {
  const days = range === "all" ? null : Number(range) || 30;
  const since = days ? new Date(Date.now() - days * 86400000).toISOString() : null;
  const sb = ctx.supabase;

  let cq = sb.from("oa_candidates").select("id, job_id, stage, created_at").limit(5000);
  if (since) cq = cq.gte("created_at", since);
  let iq = sb.from("oa_interviews").select("status, scheduled_at").limit(5000);
  if (since) iq = iq.gte("scheduled_at", since);
  let eq = sb.from("oa_candidate_events").select("candidate_id, detail, created_at").eq("type", "stage").limit(5000);
  if (since) eq = eq.gte("created_at", since);
  let aq = sb.from("oa_audit_logs").select("created_at").limit(5000);
  if (since) aq = aq.gte("created_at", since);

  const [{ data: cands }, { data: jobs }, { data: ivs }, { data: stageEvents }, { data: audit }, { data: tasks }, { data: qs }] = await Promise.all([
    cq, sb.from("oa_jobs").select("id, title, status"), iq, eq, aq,
    sb.from("oa_onboarding_tasks").select("status").limit(5000),
    sb.from("oa_screening_questions").select("id, job_id, required").limit(5000),
  ]);

  const cs = (cands ?? []) as { id: string; job_id: string | null; stage: string; created_at: string }[];
  const js = (jobs ?? []) as { id: string; title: string; status: string }[];

  // Screening completion: candidates whose job has required questions and who answered all of them.
  const required = new Map<string, string[]>();
  ((qs ?? []) as { id: string; job_id: string; required: boolean }[]).filter((q) => q.required).forEach((q) => required.set(q.job_id, [...(required.get(q.job_id) ?? []), q.id]));
  const screened = cs.filter((c) => c.job_id && required.has(c.job_id));
  let complete = 0;
  if (screened.length) {
    const { data: resp } = await sb.from("oa_screening_responses").select("candidate_id, question_id, answer").in("candidate_id", screened.map((c) => c.id).slice(0, 1000));
    const answered = new Map<string, Set<string>>();
    ((resp ?? []) as { candidate_id: string; question_id: string; answer: string }[]).filter((r) => r.answer.trim()).forEach((r) => {
      if (!answered.has(r.candidate_id)) answered.set(r.candidate_id, new Set());
      answered.get(r.candidate_id)!.add(r.question_id);
    });
    complete = screened.slice(0, 1000).filter((c) => required.get(c.job_id!)!.every((id) => answered.get(c.id)?.has(id))).length;
  }

  const events = (stageEvents ?? []) as { candidate_id: string; detail: string | null; created_at: string }[];
  const offersMade = new Set(events.filter((e) => e.detail?.endsWith("to Offer")).map((e) => e.candidate_id)).size;
  const created = new Map(cs.map((c) => [c.id, Date.parse(c.created_at)]));
  const hireTimes = events.filter((e) => e.detail?.endsWith("to Hired") && created.has(e.candidate_id)).map((e) => (Date.parse(e.created_at) - created.get(e.candidate_id)!) / 86400000);

  const hired = cs.filter((c) => c.stage === "hired").length;
  const done = (ivs ?? []).filter((i: { status: string }) => i.status === "completed").length;
  const noShow = (ivs ?? []).filter((i: { status: string }) => i.status === "no_show").length;
  const ts = (tasks ?? []) as { status: string }[];

  const perJob = js.map((j) => ({ job: j.title, applications: cs.filter((c) => c.job_id === j.id).length })).filter((x) => x.applications > 0).sort((a, b) => b.applications - a.applications).slice(0, 10);
  const byDay = new Map<string, number>();
  (audit ?? []).forEach((a: { created_at: string }) => { const d = a.created_at.slice(0, 10); byDay.set(d, (byDay.get(d) ?? 0) + 1); });

  return {
    since, totalApplicants: cs.length, activeJobs: js.filter((j) => j.status === "published").length, hired,
    conversionRate: pct(hired, cs.length), screeningRate: pct(complete, Math.min(screened.length, 1000)),
    interviewsScheduled: (ivs ?? []).length, attendanceRate: pct(done, done + noShow), offersMade,
    avgTimeToHire: hireTimes.length ? Math.round((hireTimes.reduce((a, b) => a + b, 0) / hireTimes.length) * 10) / 10 : null,
    onboardingCompletion: pct(ts.filter((t) => t.status === "completed").length, ts.length),
    stages: STAGES.map(([k, label]) => ({ stage: k, label, count: cs.filter((c) => c.stage === k).length })),
    perJob, activity: [...byDay.entries()].sort().map(([day, events]) => ({ day, events })),
  };
}
