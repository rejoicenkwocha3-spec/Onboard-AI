import Link from "next/link";
import { Plus } from "lucide-react";
import { CopyLink } from "@/components/dashboard/client";
import {
  Badge, btn, btnGhost, Card, Disclosure, Empty, Input, Notice, PageHeader, ReadOnlyNote, Select, Textarea,
} from "@/components/dashboard/ui";
import { SubmitButton } from "@/components/auth/fields";
import { EMPLOYMENT_TYPES, employmentLabel } from "@/lib/constants";
import { getCtx } from "@/lib/ctx";
import { saveJob, setJobStatus } from "./actions";

export const metadata = { title: "Jobs | Onboard AI" };
const tone = { draft: "gray", published: "green", paused: "amber", archived: "red" } as const;

type Job = {
  id: string; title: string; department: string | null; location: string | null; employment_type: string;
  salary_min: number | null; salary_max: number | null; salary_currency: string;
  description: string | null; requirements: string | null; qualifications: string | null; status: keyof typeof tone;
};

function JobForm({ job }: { job?: Job }) {
  return (
    <form action={saveJob} className="grid gap-3 sm:grid-cols-2">
      {job && <input type="hidden" name="id" value={job.id} />}
      <Input label="Job title" name="title" required defaultValue={job?.title} />
      <Input label="Department" name="department" defaultValue={job?.department ?? ""} />
      <Input label="Location" name="location" defaultValue={job?.location ?? ""} />
      <Select label="Employment type" name="employment_type" options={EMPLOYMENT_TYPES} defaultValue={job?.employment_type ?? "full_time"} />
      <Input label="Salary minimum" name="salary_min" type="number" min={0} defaultValue={job?.salary_min ?? ""} />
      <Input label="Salary maximum" name="salary_max" type="number" min={0} defaultValue={job?.salary_max ?? ""} />
      <Input label="Currency" name="salary_currency" maxLength={3} defaultValue={job?.salary_currency ?? "USD"} />
      <div className="sm:col-span-2"><Textarea label="Description" name="description" defaultValue={job?.description ?? ""} /></div>
      <Textarea label="Requirements" name="requirements" defaultValue={job?.requirements ?? ""} />
      <Textarea label="Qualifications" name="qualifications" defaultValue={job?.qualifications ?? ""} />
      <div className="sm:col-span-2"><div className="max-w-40"><SubmitButton>{job ? "Save changes" : "Create job"}</SubmitButton></div></div>
    </form>
  );
}

export default async function JobsPage({ searchParams }: { searchParams: Promise<{ status?: string; notice?: string; error?: string }> }) {
  const sp = await searchParams;
  const ctx = await getCtx();
  let q = ctx.supabase.from("oa_jobs").select("*").order("created_at", { ascending: false });
  if (sp.status && sp.status in tone) q = q.eq("status", sp.status);
  const [{ data: jobs }, { data: cands }] = await Promise.all([q, ctx.supabase.from("oa_candidates").select("job_id")]);
  const counts = new Map<string, number>();
  (cands ?? []).forEach((c: { job_id: string | null }) => c.job_id && counts.set(c.job_id, (counts.get(c.job_id) ?? 0) + 1));
  const list = (jobs ?? []) as Job[];

  return (
    <>
      <PageHeader title="Jobs" subtitle="Create, publish and manage your open positions. Each published job has its own application link." />
      <Notice notice={sp.notice} error={sp.error} />
      <ReadOnlyNote canWrite={ctx.canWrite} />
      <div className="mb-5 flex flex-wrap gap-2">
        {[["", "All"], ["draft", "Draft"], ["published", "Published"], ["paused", "Paused"], ["archived", "Archived"]].map(([v, t]) => (
          <Link key={v} href={v ? `/dashboard/jobs?status=${v}` : "/dashboard/jobs"}
            className={`rounded-full border px-3 py-1 text-sm font-medium ${(sp.status ?? "") === v ? "border-brand bg-brand-soft text-brand" : "border-line bg-white text-ink-muted"}`}>{t}</Link>
        ))}
      </div>
      {ctx.canWrite && (
        <div className="mb-6"><Disclosure summary={<><Plus size={16} />New job</>}><JobForm /></Disclosure></div>
      )}
      {list.length === 0 ? (
        <Empty title="No jobs yet">{ctx.canWrite ? "Create your first job to start receiving applications." : "Jobs created by your team will appear here."}</Empty>
      ) : (
        <div className="space-y-4">
          {list.map((j) => (
            <Card key={j.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-heading text-lg font-bold text-navy">{j.title}</h2><Badge tone={tone[j.status]}>{j.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">
                    {[j.department, j.location, employmentLabel(j.employment_type),
                      j.salary_min || j.salary_max ? `${j.salary_currency} ${j.salary_min ?? ""}${j.salary_max ? ` to ${j.salary_max}` : ""}` : null]
                      .filter(Boolean).join(" · ")}
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">{counts.get(j.id) ?? 0} applicant{(counts.get(j.id) ?? 0) === 1 ? "" : "s"}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {j.status === "published" && <CopyLink path={`/apply/${j.id}`} />}
                  {ctx.canWrite && (["published", "paused", "archived", "draft"] as const).filter((st) => st !== j.status).map((st) => (
                    <form key={st} action={setJobStatus}>
                      <input type="hidden" name="id" value={j.id} /><input type="hidden" name="status" value={st} />
                      <button className={st === "published" ? btn + " !py-1.5" : btnGhost}>{st === "published" ? "Publish" : st === "draft" ? "Move to draft" : st === "paused" ? "Pause" : "Archive"}</button>
                    </form>
                  ))}
                </div>
              </div>
              {ctx.canWrite && <div className="mt-4"><Disclosure ghost summary="Edit details"><JobForm job={j} /></Disclosure></div>}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
