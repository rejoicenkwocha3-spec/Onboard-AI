import { Plus } from "lucide-react";
import { SubmitButton } from "@/components/auth/fields";
import { AgentTester } from "@/components/dashboard/AgentTester";
import { Badge, btnDanger, btnGhost, Card, Disclosure, Empty, Input, Notice, PageHeader, ReadOnlyNote, Textarea } from "@/components/dashboard/ui";
import { configuredProvider } from "@/lib/ai";
import { AGENT_ACTIONS, CHANNELS } from "@/lib/constants";
import { getCtx } from "@/lib/ctx";
import { deleteAgent, saveAgent, setAgentStatus } from "./actions";

export const metadata = { title: "AI Assistant | Onboard AI" };
type Agent = { id: string; name: string; personality: string | null; tone: string | null; language: string; instructions: string | null; escalation_rules: string | null; channels: string[]; approved_actions: string[]; status: string };

function AgentForm({ a }: { a?: Agent }) {
  return (
    <form action={saveAgent} className="grid gap-3 sm:grid-cols-2">
      {a && <input type="hidden" name="id" value={a.id} />}
      <Input label="Assistant name" name="name" required defaultValue={a?.name} />
      <Input label="Language" name="language" defaultValue={a?.language ?? "English"} />
      <Input label="Personality" name="personality" defaultValue={a?.personality ?? ""} placeholder="Warm, patient and professional" />
      <Input label="Tone" name="tone" defaultValue={a?.tone ?? ""} placeholder="Friendly and clear" />
      <div className="sm:col-span-2"><Textarea label="Instructions and knowledge" name="instructions" rows={6} defaultValue={a?.instructions ?? ""} hint="Company information, job details, FAQs and rules the assistant should follow." /></div>
      <div className="sm:col-span-2"><Textarea label="Escalation rules" name="escalation_rules" defaultValue={a?.escalation_rules ?? ""} hint="When should the assistant hand the conversation to a person?" /></div>
      <fieldset><legend className="mb-1 text-sm font-medium">Approved actions</legend>
        {AGENT_ACTIONS.map((x) => <label key={x} className="flex items-center gap-2 py-0.5 text-sm"><input type="checkbox" name="approved_actions" value={x} defaultChecked={a?.approved_actions.includes(x)} className="accent-brand" />{x}</label>)}</fieldset>
      <fieldset><legend className="mb-1 text-sm font-medium">Intended channels</legend>
        {CHANNELS.filter(([k]) => k !== "internal").map(([k, t]) => <label key={k} className="flex items-center gap-2 py-0.5 text-sm"><input type="checkbox" name="channels" value={k} defaultChecked={a?.channels.includes(k)} className="accent-brand" />{t}</label>)}
        <p className="mt-1 text-xs text-ink-muted">Channels are a plan only until each one is connected.</p></fieldset>
      <div className="max-w-44"><SubmitButton>{a ? "Save changes" : "Create assistant"}</SubmitButton></div>
    </form>
  );
}

export default async function AssistantPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const sp = await searchParams;
  const ctx = await getCtx();
  const { data } = await ctx.supabase.from("oa_agents").select("*").order("created_at", { ascending: false });
  const agents = (data ?? []) as Agent[];
  const provider = configuredProvider();
  return (
    <>
      <PageHeader title="AI Assistant" subtitle="Configure the assistants that answer candidate questions and guide applicants. They support your recruiters and never make hiring decisions." />
      <Notice notice={sp.notice} error={sp.error} />
      <ReadOnlyNote canWrite={ctx.canWrite} />
      <Card className={`mb-6 ${provider ? "" : "!border-amber-200 !bg-amber-50"}`}>
        {provider ? <p className="text-sm">AI provider connected: <Badge tone="green">{provider === "anthropic" ? "Anthropic" : "OpenAI"}</Badge> Use Test on an assistant to try it.</p> : (
          <p className="text-sm text-amber-800"><strong>AI is not set up.</strong> Add ANTHROPIC_API_KEY or OPENAI_API_KEY as a server environment variable in your hosting settings, then redeploy. Until then, you can configure assistants but not run them.</p>
        )}
      </Card>
      {ctx.canWrite && <div className="mb-6"><Disclosure summary={<><Plus size={16} />New assistant</>}><AgentForm /></Disclosure></div>}
      {agents.length === 0 ? <Empty title="No assistants yet">Create an assistant with its name, tone, instructions and the actions it may take.</Empty> : (
        <div className="space-y-4">{agents.map((a) => (
          <Card key={a.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><div className="flex items-center gap-2"><h2 className="font-heading text-lg font-bold text-navy">{a.name}</h2><Badge tone={a.status === "active" ? "green" : "amber"}>{a.status}</Badge></div>
                <p className="text-sm text-ink-muted">{[a.language, a.tone, a.personality].filter(Boolean).join(" · ")}</p>
                {a.approved_actions.length > 0 && <p className="mt-1 text-xs text-ink-muted">Approved actions: {a.approved_actions.join(", ")}</p>}</div>
              {ctx.canWrite && <div className="flex gap-2">
                <form action={setAgentStatus}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="status" value={a.status === "active" ? "paused" : "active"} /><button className={btnGhost}>{a.status === "active" ? "Pause" : "Activate"}</button></form>
                <form action={deleteAgent}><input type="hidden" name="id" value={a.id} /><button className={btnDanger}>Delete</button></form></div>}
            </div>
            {ctx.canWrite && (
              <div className="mt-4 flex flex-wrap items-start gap-3">
                <Disclosure ghost summary="Edit configuration"><AgentForm a={a} /></Disclosure>
                {provider && a.status === "active" && <Disclosure ghost summary="Test assistant"><AgentTester id={a.id} /></Disclosure>}
              </div>
            )}
          </Card>
        ))}</div>
      )}
      <p className="mt-6 text-sm text-ink-muted">Connecting assistants to live channels, knowledge file indexing and automatic replies to applicants are not available yet. Candidates currently apply through the conversational application on each job link.</p>
    </>
  );
}
