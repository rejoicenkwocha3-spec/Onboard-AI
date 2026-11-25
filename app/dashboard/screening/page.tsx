import Link from "next/link";
import { SubmitButton } from "@/components/auth/fields";
import { Badge, btnDanger, Card, Empty, Input, inputCls, Notice, PageHeader, ReadOnlyNote } from "@/components/dashboard/ui";
import { getCtx } from "@/lib/ctx";
import { addQuestion, deleteQuestion } from "./actions";

export const metadata = { title: "Screening | Onboard AI" };
type Q = { id: string; question: string; required: boolean; min_answer: string | null };

export default async function ScreeningPage({ searchParams }: { searchParams: Promise<{ job?: string; notice?: string; error?: string }> }) {
  const sp = await searchParams;
  const ctx = await getCtx();
  const { data: jobs } = await ctx.supabase.from("oa_jobs").select("id, title, status").order("created_at", { ascending: false });
  const jobId = sp.job ?? jobs?.[0]?.id;

  let questions: Q[] = [];
  let rows: { id: string; name: string; answered: number; missing: string[]; unmet: string[] }[] = [];
  if (jobId) {
    const [{ data: qs }, { data: cands }] = await Promise.all([
      ctx.supabase.from("oa_screening_questions").select("id, question, required, min_answer").eq("job_id", jobId).order("position"),
      ctx.supabase.from("oa_candidates").select("id, full_name").eq("job_id", jobId).order("created_at", { ascending: false }),
    ]);
    questions = (qs ?? []) as Q[];
    const ids = (cands ?? []).map((c: { id: string }) => c.id);
    const { data: resp } = ids.length ? await ctx.supabase.from("oa_screening_responses").select("candidate_id, question_id, answer").in("candidate_id", ids) : { data: [] };
    const byCand = new Map<string, Map<string, string>>();
    (resp ?? []).forEach((r: { candidate_id: string; question_id: string; answer: string }) => {
      if (!byCand.has(r.candidate_id)) byCand.set(r.candidate_id, new Map());
      byCand.get(r.candidate_id)!.set(r.question_id, r.answer);
    });
    rows = (cands ?? []).map((c: { id: string; full_name: string }) => {
      const a = byCand.get(c.id) ?? new Map<string, string>();
      const missing = questions.filter((q) => q.required && !(a.get(q.id) ?? "").trim()).map((q) => q.question);
      const unmet = questions.filter((q) => q.min_answer && (a.get(q.id) ?? "").trim() &&
        !(a.get(q.id) ?? "").toLowerCase().includes(q.min_answer.toLowerCase())).map((q) => q.question);
      return { id: c.id, name: c.full_name, answered: questions.filter((q) => (a.get(q.id) ?? "").trim()).length, missing, unmet };
    });
  }

  return (
    <>
      <PageHeader title="Screening" subtitle="Configure screening questions for each job and review responses. Criteria are shown openly, and every decision stays with your recruiters." />
      <Notice notice={sp.notice} error={sp.error} />
      <ReadOnlyNote canWrite={ctx.canWrite} />
      {!jobs?.length ? <Empty title="Create a job first">Screening questions belong to a job. <Link href="/dashboard/jobs" className="text-brand hover:underline">Go to Jobs</Link></Empty> : (
        <>
          <div className="mb-5 flex flex-wrap gap-2">
            {jobs.map((j: { id: string; title: string }) => (
              <Link key={j.id} href={`/dashboard/screening?job=${j.id}`}
                className={`rounded-full border px-3 py-1 text-sm font-medium ${j.id === jobId ? "border-brand bg-brand-soft text-brand" : "border-line bg-white text-ink-muted"}`}>{j.title}</Link>
            ))}
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <h2 className="mb-3 font-heading text-base font-bold text-navy">Screening questions</h2>
              {questions.length === 0 ? <p className="mb-3 text-sm text-ink-muted">No questions yet. Candidates applying through the job link will be asked these questions.</p> : (
                <ul className="mb-4 space-y-3">
                  {questions.map((q) => (
                    <li key={q.id} className="flex items-start justify-between gap-3 text-sm">
                      <div><p className="font-medium text-ink">{q.question}</p>
                        <p className="text-xs text-ink-muted">{q.required ? "Required" : "Optional"}{q.min_answer ? ` · Minimum requirement: answer includes "${q.min_answer}"` : ""}</p></div>
                      {ctx.canWrite && <form action={deleteQuestion}><input type="hidden" name="id" value={q.id} /><input type="hidden" name="job_id" value={jobId} /><button className={btnDanger}>Remove</button></form>}
                    </li>
                  ))}
                </ul>
              )}
              {ctx.canWrite && (
                <form action={addQuestion} className="space-y-3 border-t border-line pt-4">
                  <input type="hidden" name="job_id" value={jobId} />
                  <Input label="Question" name="question" required placeholder="Do you hold a valid nursing licence?" />
                  <Input label="Minimum requirement (optional)" name="min_answer" hint="If set, answers that do not include this text are flagged for review, never rejected automatically." />
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="required" defaultChecked className="accent-brand" />Required</label>
                  <SubmitButton>Add question</SubmitButton>
                </form>
              )}
            </Card>
            <Card>
              <h2 className="mb-3 font-heading text-base font-bold text-navy">Candidate review</h2>
              {rows.length === 0 ? <p className="text-sm text-ink-muted">No candidates for this job yet.</p> : (
                <ul className="space-y-3 text-sm">
                  {rows.map((r) => (
                    <li key={r.id} className="rounded-lg border border-line p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link href={`/dashboard/candidates/${r.id}`} className="font-semibold text-brand hover:underline">{r.name}</Link>
                        <span className="text-xs text-ink-muted">{r.answered} of {questions.length} answered</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {questions.length === 0 ? <Badge>No questions configured</Badge> :
                          r.missing.length === 0 && r.unmet.length === 0 ? <Badge tone="green">Meets configured criteria</Badge> : null}
                        {r.missing.length > 0 && <Badge tone="amber">Missing: {r.missing.length} required</Badge>}
                        {r.unmet.length > 0 && <Badge tone="red">Review: {r.unmet.length} below minimum</Badge>}
                      </div>
                      {(r.missing.length > 0 || r.unmet.length > 0) && (
                        <ul className="mt-2 list-disc pl-5 text-xs text-ink-muted">
                          {r.missing.map((m) => <li key={"m" + m}>Missing answer: {m}</li>)}
                          {r.unmet.map((m) => <li key={"u" + m}>Answer needs review: {m}</li>)}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-4 text-xs text-ink-muted">These flags only compare answers with the criteria you configured. They do not use personal characteristics and never change a candidate's stage. A recruiter makes every decision.</p>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
