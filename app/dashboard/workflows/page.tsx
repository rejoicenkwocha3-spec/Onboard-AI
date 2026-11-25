import { Plus } from "lucide-react";
import { SubmitButton } from "@/components/auth/fields";
import { btnDanger, Card, Disclosure, Empty, Input, Notice, PageHeader, ReadOnlyNote, Select, Textarea } from "@/components/dashboard/ui";
import { getCtx } from "@/lib/ctx";
import { deleteWorkflow, saveWorkflow } from "./actions";

export const metadata = { title: "Workflows | Onboard AI" };
type Wf = { id: string; name: string; trigger: string; steps: string[] };
const TRIGGERS = [["application_submitted", "Candidate submits an application"], ["stage_changed", "Candidate stage changes"], ["candidate_hired", "Candidate is marked as hired"], ["interview_scheduled", "Interview is scheduled"]] as const;
const label = (t: string) => TRIGGERS.find(([k]) => k === t)?.[1] ?? t;
const TEMPLATES = {
  recruitment: "Send acknowledgment\nCollect screening responses\nSave candidate information\nNotify recruiter\nOffer interview times to eligible candidates\nSend interview reminders",
  onboarding: "Send welcome email\nRequest employee documents\nAssign onboarding tasks\nSchedule orientation\nSend completion summary to HR",
};

function WfForm({ wf, steps }: { wf?: Wf; steps?: string }) {
  return (
    <form action={saveWorkflow} className="space-y-3">
      {wf && <input type="hidden" name="id" value={wf.id} />}
      <Input label="Name" name="name" required defaultValue={wf?.name} />
      <Select label="Trigger" name="trigger" options={TRIGGERS} defaultValue={wf?.trigger ?? "application_submitted"} />
      <Textarea label="Steps" name="steps" rows={6} required defaultValue={wf ? wf.steps.join("\n") : steps} hint="One step per line, in order." />
      <div className="max-w-40"><SubmitButton>Save workflow</SubmitButton></div>
    </form>
  );
}

export default async function WorkflowsPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const sp = await searchParams;
  const ctx = await getCtx();
  const { data } = await ctx.supabase.from("oa_workflows").select("id, name, trigger, steps").order("created_at", { ascending: false });
  const wfs = (data ?? []) as Wf[];
  return (
    <>
      <PageHeader title="Workflows" subtitle="Design the recruitment and onboarding steps your team follows." />
      <Notice notice={sp.notice} error={sp.error} />
      <ReadOnlyNote canWrite={ctx.canWrite} />
      <Card className="mb-6 !border-amber-200 !bg-amber-50">
        <p className="text-sm text-amber-800"><strong>Automatic execution is not enabled yet.</strong> Workflows are saved as documented step lists for your team. They do not send messages or change candidates on their own, and no run history exists.</p>
      </Card>
      {ctx.canWrite && (
        <div className="mb-6 flex flex-wrap gap-3">
          <Disclosure summary={<><Plus size={16} />Recruitment workflow</>}><WfForm steps={TEMPLATES.recruitment} /></Disclosure>
          <Disclosure ghost summary="Onboarding workflow"><WfForm steps={TEMPLATES.onboarding} /></Disclosure>
        </div>
      )}
      {wfs.length === 0 ? <Empty title="No workflows yet" /> : (
        <div className="space-y-4">{wfs.map((w) => (
          <Card key={w.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h2 className="font-heading text-lg font-bold text-navy">{w.name}</h2><p className="text-sm text-ink-muted">When: {label(w.trigger)}</p></div>
              {ctx.canWrite && <form action={deleteWorkflow}><input type="hidden" name="id" value={w.id} /><button className={btnDanger}>Delete</button></form>}
            </div>
            <ol className="mt-3 space-y-1.5 text-sm">{w.steps.map((st, i) => (
              <li key={i} className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">{i + 1}</span><span className="pt-0.5">{st}</span></li>
            ))}</ol>
            {ctx.canWrite && <div className="mt-4"><Disclosure ghost summary="Edit"><WfForm wf={w} /></Disclosure></div>}
          </Card>
        ))}</div>
      )}
    </>
  );
}
