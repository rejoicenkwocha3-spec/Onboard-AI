import { notFound } from "next/navigation";
import { ApplyChat } from "@/components/ApplyChat";
import { employmentLabel } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Apply | Onboard AI" };
type Job = { company: string; id: string; title: string; location: string | null; employment_type: string; description: string | null;
  requirements: string | null; qualifications: string | null; questions: { id: string; question: string; required: boolean }[] };

export default async function ApplyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  if (!supabase) notFound();
  const { data } = await supabase.rpc("oa_public_job", { p_job: id });
  const job = data as Job | null;
  if (!job) notFound();
  return (
    <main className="min-h-screen bg-surface px-4 py-8">
      <div className="mx-auto max-w-xl">
        <p className="text-sm font-semibold text-brand">{job.company}</p>
        <h1 className="mt-1 text-2xl font-extrabold text-navy">{job.title}</h1>
        <p className="mb-4 text-sm text-ink-muted">{[job.location, employmentLabel(job.employment_type)].filter(Boolean).join(" · ")}</p>
        {(job.description || job.requirements || job.qualifications) && (
          <details className="mb-4 rounded-xl border border-line bg-white p-4 text-sm">
            <summary className="cursor-pointer font-semibold text-navy">About this role</summary>
            {job.description && <p className="mt-3 whitespace-pre-wrap">{job.description}</p>}
            {job.requirements && <><p className="mt-3 font-semibold">Requirements</p><p className="whitespace-pre-wrap">{job.requirements}</p></>}
            {job.qualifications && <><p className="mt-3 font-semibold">Qualifications</p><p className="whitespace-pre-wrap">{job.qualifications}</p></>}
          </details>
        )}
        <ApplyChat job={{ id: job.id, title: job.title, questions: job.questions }} company={job.company} />
        <p className="mt-4 text-center text-xs text-ink-muted">Your answers are shared only with {job.company}.</p>
      </div>
    </main>
  );
}
