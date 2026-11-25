import Link from "next/link";
import { Plus } from "lucide-react";
import { SubmitButton } from "@/components/auth/fields";
import { LocalTime } from "@/components/dashboard/client";
import {
  Badge, btnGhost, Disclosure, Empty, Input, inputCls, Notice, PageHeader, ReadOnlyNote, Select, TableWrap, td, Textarea, th,
} from "@/components/dashboard/ui";
import { STAGES, stageLabel } from "@/lib/constants";
import { getCtx } from "@/lib/ctx";
import { createCandidate } from "./actions";

export const metadata = { title: "Candidates | Onboard AI" };

export default async function CandidatesPage({ searchParams }: {
  searchParams: Promise<{ q?: string; stage?: string; job?: string; sort?: string; notice?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const ctx = await getCtx();
  let q = ctx.supabase.from("oa_candidates").select("id, full_name, email, stage, job_id, source, created_at");
  const term = (sp.q ?? "").replace(/[,()%*]/g, " ").trim();
  if (term) q = q.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`);
  if (sp.stage && STAGES.some(([k]) => k === sp.stage)) q = q.eq("stage", sp.stage);
  if (sp.job) q = q.eq("job_id", sp.job);
  q = sp.sort === "name" ? q.order("full_name") : q.order("created_at", { ascending: false });
  const [{ data: cands }, { data: jobs }] = await Promise.all([q.limit(200), ctx.supabase.from("oa_jobs").select("id, title").order("title")]);
  const jobTitle = new Map((jobs ?? []).map((j: { id: string; title: string }) => [j.id, j.title]));
  const list = (cands ?? []) as { id: string; full_name: string; email: string; stage: string; job_id: string | null; source: string; created_at: string }[];
  const jobOptions = [["", "No job"], ...(jobs ?? []).map((j: { id: string; title: string }) => [j.id, j.title] as [string, string])] as [string, string][];

  return (
    <>
      <PageHeader title="Candidates" subtitle="Your recruitment CRM. Search, filter and move candidates through the hiring pipeline." />
      <Notice notice={sp.notice} error={sp.error} />
      <ReadOnlyNote canWrite={ctx.canWrite} />
      {ctx.canWrite && (
        <div className="mb-6">
          <Disclosure summary={<><Plus size={16} />Add candidate</>}>
            <form action={createCandidate} className="grid gap-3 sm:grid-cols-2">
              <Input label="Full name" name="full_name" required />
              <Input label="Email" name="email" type="email" required />
              <Input label="Phone" name="phone" />
              <Select label="Applied position" name="job_id" options={jobOptions} />
              <Input label="Skills" name="skills" hint="Separate with commas" />
              <Input label="Qualifications" name="qualifications" />
              <div className="sm:col-span-2"><Textarea label="Work experience" name="experience" /></div>
              <div className="max-w-40"><SubmitButton>Add candidate</SubmitButton></div>
            </form>
          </Disclosure>
        </div>
      )}
      <form className="mb-5 grid gap-2 sm:grid-cols-5" method="get">
        <input name="q" defaultValue={sp.q ?? ""} placeholder="Search name or email" className={`${inputCls} sm:col-span-2`} />
        <select name="stage" defaultValue={sp.stage ?? ""} className={inputCls}>
          <option value="">All stages</option>{STAGES.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
        </select>
        <select name="job" defaultValue={sp.job ?? ""} className={inputCls}>
          <option value="">All jobs</option>{(jobs ?? []).map((j: { id: string; title: string }) => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
        <div className="flex gap-2">
          <select name="sort" defaultValue={sp.sort ?? ""} className={inputCls}><option value="">Newest</option><option value="name">Name</option></select>
          <button className={btnGhost}>Filter</button>
        </div>
      </form>
      {list.length === 0 ? (
        <Empty title="No candidates found">Candidates appear here when people apply through a job link, or when you add them.</Empty>
      ) : (
        <TableWrap>
          <thead><tr><th className={th}>Name</th><th className={th}>Position</th><th className={th}>Stage</th><th className={th}>Source</th><th className={th}>Added</th></tr></thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id}>
                <td className={td}><Link href={`/dashboard/candidates/${c.id}`} className="font-semibold text-brand hover:underline">{c.full_name}</Link><div className="text-xs text-ink-muted">{c.email}</div></td>
                <td className={td}>{(c.job_id && jobTitle.get(c.job_id)) || "None"}</td>
                <td className={td}><Badge tone={c.stage === "hired" ? "green" : c.stage === "not_selected" || c.stage === "withdrawn" ? "red" : "blue"}>{stageLabel(c.stage)}</Badge></td>
                <td className={td}>{c.source.replace(/_/g, " ")}</td>
                <td className={td}><LocalTime iso={c.created_at} dateOnly /></td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </>
  );
}
