import Link from "next/link";
import { notFound } from "next/navigation";
import { SubmitButton } from "@/components/auth/fields";
import { LocalTime } from "@/components/dashboard/client";
import { Badge, btn, btnGhost, Card, Input, Notice, PageHeader, ReadOnlyNote, Select, Textarea } from "@/components/dashboard/ui";
import { STAGES, stageLabel } from "@/lib/constants";
import { getCtx } from "@/lib/ctx";
import { addNote, assignToMe, moveStage, updateCandidate } from "../actions";

export const metadata = { title: "Candidate | Onboard AI" };

export default async function CandidatePage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const ctx = await getCtx();
  const { data: c } = await ctx.supabase.from("oa_candidates").select("*").eq("id", id).maybeSingle();
  if (!c) notFound();

  const [{ data: job }, { data: events }, { data: resp }, { data: interviews }, { data: owner }] = await Promise.all([
    c.job_id ? ctx.supabase.from("oa_jobs").select("title").eq("id", c.job_id).maybeSingle() : Promise.resolve({ data: null }),
    ctx.supabase.from("oa_candidate_events").select("id, type, detail, created_at, actor_id").eq("candidate_id", id).order("created_at", { ascending: false }),
    ctx.supabase.from("oa_screening_responses").select("answer, question_id, oa_screening_questions(question)").eq("candidate_id", id),
    ctx.supabase.from("oa_interviews").select("id, scheduled_at, status, interviewer").eq("candidate_id", id).order("scheduled_at", { ascending: false }),
    c.owner_id ? ctx.supabase.from("oa_profiles").select("full_name").eq("id", c.owner_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const actorIds = [...new Set((events ?? []).map((e: { actor_id: string | null }) => e.actor_id).filter(Boolean))] as string[];
  const { data: actors } = actorIds.length ? await ctx.supabase.from("oa_profiles").select("id, full_name").in("id", actorIds) : { data: [] };
  const actorName = new Map((actors ?? []).map((a: { id: string; full_name: string }) => [a.id, a.full_name]));
  const path = `/dashboard/candidates/${id}`;

  return (
    <>
      <p className="mb-3 text-sm"><Link href="/dashboard/candidates" className="text-brand hover:underline">Back to candidates</Link></p>
      <PageHeader title={c.full_name} subtitle={`${c.email}${c.phone ? " · " + c.phone : ""}`}
        action={<Badge tone={c.stage === "hired" ? "green" : "blue"}>{stageLabel(c.stage)}</Badge>} />
      <Notice notice={sp.notice} error={sp.error} />
      <ReadOnlyNote canWrite={ctx.canWrite} />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <h2 className="mb-3 font-heading text-base font-bold text-navy">Profile</h2>
            <p className="mb-3 text-sm text-ink-muted">Applied position: <strong className="text-ink">{job?.title ?? "None"}</strong> · Owner: <strong className="text-ink">{owner?.full_name ?? "Unassigned"}</strong> · Source: {c.source.replace(/_/g, " ")}</p>
            {ctx.canWrite ? (
              <form action={updateCandidate} className="grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="id" value={id} />
                <Input label="Full name" name="full_name" required defaultValue={c.full_name} />
                <Input label="Phone" name="phone" defaultValue={c.phone ?? ""} />
                <Input label="Skills" name="skills" hint="Separate with commas" defaultValue={(c.skills ?? []).join(", ")} />
                <Input label="Qualifications" name="qualifications" defaultValue={c.qualifications ?? ""} />
                <div className="sm:col-span-2"><Textarea label="Work experience" name="experience" defaultValue={c.experience ?? ""} /></div>
                <div className="max-w-40"><SubmitButton>Save profile</SubmitButton></div>
              </form>
            ) : (
              <dl className="space-y-2 text-sm"><div><dt className="font-medium">Skills</dt><dd className="text-ink-muted">{(c.skills ?? []).join(", ") || "None"}</dd></div>
                <div><dt className="font-medium">Experience</dt><dd className="whitespace-pre-wrap text-ink-muted">{c.experience || "None"}</dd></div></dl>
            )}
          </Card>
          <Card>
            <h2 className="mb-3 font-heading text-base font-bold text-navy">Screening responses</h2>
            {(resp ?? []).length === 0 ? <p className="text-sm text-ink-muted">No screening responses yet.</p> : (
              <ul className="space-y-3 text-sm">
                {(resp ?? []).map((r: { question_id: string; answer: string; oa_screening_questions: { question: string } | { question: string }[] | null }) => {
                  const qn = Array.isArray(r.oa_screening_questions) ? r.oa_screening_questions[0]?.question : r.oa_screening_questions?.question;
                  return <li key={r.question_id}><p className="font-medium text-ink">{qn}</p><p className="text-ink-muted">{r.answer || "No answer"}</p></li>;
                })}
              </ul>
            )}
          </Card>
          <Card>
            <h2 className="mb-3 font-heading text-base font-bold text-navy">Notes and history</h2>
            {ctx.canWrite && (
              <form action={addNote} className="mb-4 space-y-2">
                <input type="hidden" name="id" value={id} />
                <Textarea label="Recruiter note" name="note" placeholder="Add an internal note" />
                <button className={btn}>Add note</button>
              </form>
            )}
            <ul className="space-y-3 text-sm">
              {(events ?? []).map((e: { id: string; type: string; detail: string | null; created_at: string; actor_id: string | null }) => (
                <li key={e.id} className="border-l-2 border-line pl-3">
                  <p className="text-ink"><Badge tone={e.type === "note" ? "amber" : "gray"}>{e.type}</Badge> <span className="whitespace-pre-wrap">{e.detail}</span></p>
                  <p className="text-xs text-ink-muted">{e.actor_id ? actorName.get(e.actor_id) ?? "Team member" : "Candidate"} · <LocalTime iso={e.created_at} /></p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <div className="space-y-5">
          <Card>
            <h2 className="mb-3 font-heading text-base font-bold text-navy">Pipeline stage</h2>
            {ctx.canWrite ? (
              <form action={moveStage} className="space-y-3">
                <input type="hidden" name="id" value={id} />
                <Select label="Move to" name="stage" options={STAGES} defaultValue={c.stage} />
                <SubmitButton>Update stage</SubmitButton>
              </form>
            ) : <Badge tone="blue">{stageLabel(c.stage)}</Badge>}
            {ctx.canWrite && c.owner_id !== ctx.user.id && (
              <form action={assignToMe} className="mt-3"><input type="hidden" name="id" value={id} /><button className={btnGhost}>Assign to me</button></form>
            )}
            {c.stage === "hired" && ctx.canWrite && (
              <Link href={`/dashboard/onboarding?candidate=${id}`} className={`${btn} mt-3 w-full`}>Start onboarding</Link>
            )}
          </Card>
          <Card>
            <h2 className="mb-3 font-heading text-base font-bold text-navy">Interviews</h2>
            {(interviews ?? []).length === 0 ? <p className="text-sm text-ink-muted">No interviews scheduled.</p> : (
              <ul className="space-y-2 text-sm">
                {(interviews ?? []).map((i: { id: string; scheduled_at: string; status: string; interviewer: string | null }) => (
                  <li key={i.id}><LocalTime iso={i.scheduled_at} /> <Badge>{i.status.replace("_", " ")}</Badge>{i.interviewer && <span className="text-ink-muted"> with {i.interviewer}</span>}</li>
                ))}
              </ul>
            )}
            <Link href="/dashboard/interviews" className="mt-3 inline-block text-sm text-brand hover:underline">Open interviews</Link>
          </Card>
        </div>
      </div>
    </>
  );
}
