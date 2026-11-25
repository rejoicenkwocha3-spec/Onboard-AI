import Link from "next/link";
import { SubmitButton } from "@/components/auth/fields";
import { LocalTime } from "@/components/dashboard/client";
import { Badge, btnGhost, Card, Disclosure, Empty, Input, Notice, PageHeader, ReadOnlyNote, Select, Textarea } from "@/components/dashboard/ui";
import { CHANNELS, channelLabel } from "@/lib/constants";
import { getCtx } from "@/lib/ctx";
import { addMessage, setConversation, startConversation } from "./actions";

export const metadata = { title: "Conversations | Onboard AI" };
type Conv = { id: string; subject: string; channel: string; status: string; candidate_id: string | null; assigned_to: string | null; last_message_at: string };

export default async function ConversationsPage({ searchParams }: { searchParams: Promise<{ c?: string; notice?: string; error?: string }> }) {
  const sp = await searchParams;
  const ctx = await getCtx();
  const [{ data: convs }, { data: cands }] = await Promise.all([
    ctx.supabase.from("oa_conversations").select("id, subject, channel, status, candidate_id, assigned_to, last_message_at").order("last_message_at", { ascending: false }),
    ctx.supabase.from("oa_candidates").select("id, full_name").order("full_name"),
  ]);
  const list = (convs ?? []) as Conv[];
  const sel = list.find((c) => c.id === sp.c);
  const name = new Map((cands ?? []).map((c: { id: string; full_name: string }) => [c.id, c.full_name]));
  const { data: msgs } = sel ? await ctx.supabase.from("oa_messages").select("id, body, direction, created_at, sender_id").eq("conversation_id", sel.id).order("created_at") : { data: [] };
  const { data: assignee } = sel?.assigned_to ? await ctx.supabase.from("oa_profiles").select("full_name").eq("id", sel.assigned_to).maybeSingle() : { data: null };
  const candOptions = [["", "No candidate"], ...(cands ?? []).map((c: { id: string; full_name: string }) => [c.id, c.full_name] as [string, string])] as [string, string][];

  return (
    <>
      <PageHeader title="Conversations" subtitle="One workspace for candidate conversations, internal notes and human handoff." />
      <Notice notice={sp.notice} error={sp.error} />
      <ReadOnlyNote canWrite={ctx.canWrite} />
      <Card className="mb-5">
        <h2 className="mb-2 font-heading text-base font-bold text-navy">Channels</h2>
        <div className="flex flex-wrap gap-2">
          {CHANNELS.filter(([k]) => k !== "internal").map(([k, t]) => <Badge key={k}>{t}: not connected</Badge>)}
          <Badge tone="green">Internal notes: available</Badge>
        </div>
        <p className="mt-2 text-xs text-ink-muted">Website chat, email, SMS and WhatsApp conversations will appear here once those channels are connected. Until then you can keep internal threads and notes about candidates.</p>
      </Card>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-3">
          {ctx.canWrite && (
            <Disclosure summary="New internal thread">
              <form action={startConversation} className="space-y-3">
                <Input label="Subject" name="subject" required />
                <Select label="Candidate" name="candidate_id" options={candOptions} />
                <SubmitButton>Start</SubmitButton>
              </form>
            </Disclosure>
          )}
          {list.length === 0 ? <Empty title="No conversations yet" /> : list.map((c) => (
            <Link key={c.id} href={`/dashboard/conversations?c=${c.id}`}
              className={`block rounded-xl border bg-white p-3 text-sm ${c.id === sel?.id ? "border-brand" : "border-line"}`}>
              <p className="font-semibold text-navy">{c.subject}</p>
              <p className="text-xs text-ink-muted">{c.candidate_id ? name.get(c.candidate_id) : "No candidate"} · {channelLabel(c.channel)}</p>
              <div className="mt-1"><Badge tone={c.status === "handoff" ? "amber" : c.status === "closed" ? "gray" : "green"}>{c.status === "handoff" ? "human handoff" : c.status}</Badge></div>
            </Link>
          ))}
        </div>
        <div className="lg:col-span-2">
          {!sel ? <Empty title="Select a conversation">Choose a thread to read its history and add notes.</Empty> : (
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><h2 className="font-heading text-lg font-bold text-navy">{sel.subject}</h2>
                  <p className="text-sm text-ink-muted">Assigned to {assignee?.full_name ?? "nobody"} · {channelLabel(sel.channel)}
                    {sel.candidate_id && <> · <Link href={`/dashboard/candidates/${sel.candidate_id}`} className="text-brand hover:underline">{name.get(sel.candidate_id)}</Link></>}</p></div>
                {ctx.canWrite && (
                  <div className="flex flex-wrap gap-2">
                    {sel.assigned_to !== ctx.user.id && <form action={setConversation}><input type="hidden" name="id" value={sel.id} /><input type="hidden" name="assign" value="me" /><button className={btnGhost}>Assign to me</button></form>}
                    {(["handoff", sel.status === "closed" ? "open" : "closed"] as const).filter((st) => st !== sel.status).map((st) => (
                      <form key={st} action={setConversation}><input type="hidden" name="id" value={sel.id} /><input type="hidden" name="status" value={st} />
                        <button className={btnGhost}>{st === "handoff" ? "Flag for human handoff" : st === "closed" ? "Close" : "Reopen"}</button></form>
                    ))}
                  </div>
                )}
              </div>
              <ul className="my-5 space-y-3">
                {(msgs ?? []).length === 0 && <li className="text-sm text-ink-muted">No messages yet.</li>}
                {(msgs ?? []).map((m: { id: string; body: string; created_at: string }) => (
                  <li key={m.id} className="rounded-lg bg-amber-50 p-3 text-sm"><Badge tone="amber">internal note</Badge>
                    <p className="mt-1 whitespace-pre-wrap text-ink">{m.body}</p><p className="mt-1 text-xs text-ink-muted"><LocalTime iso={m.created_at} /></p></li>
                ))}
              </ul>
              {ctx.canWrite && (
                <form action={addMessage} className="space-y-2"><input type="hidden" name="id" value={sel.id} />
                  <Textarea label="Internal note" name="body" hint="Only your team can see this. It is not sent to the candidate." /><SubmitButton>Save note</SubmitButton></form>
              )}
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
