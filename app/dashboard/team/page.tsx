import { SubmitButton } from "@/components/auth/fields";
import { CopyLink, LocalTime } from "@/components/dashboard/client";
import { Badge, btnDanger, btnGhost, Card, Empty, Input, Notice, PageHeader, Select, TableWrap, td, th } from "@/components/dashboard/ui";
import { ROLES, roleLabel } from "@/lib/constants";
import { getCtx } from "@/lib/ctx";
import { changeRole, invite, removeMember, revokeInvite } from "./actions";

export const metadata = { title: "Team | Onboard AI" };

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const sp = await searchParams;
  const ctx = await getCtx();
  const [{ data: members }, { data: invites }, { data: logs }] = await Promise.all([
    ctx.supabase.from("oa_organization_members").select("id, user_id, role, created_at").eq("status", "active").order("created_at"),
    ctx.isAdmin ? ctx.supabase.from("oa_invitations").select("id, email, role, token, status, created_at").eq("status", "pending").order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    ctx.supabase.from("oa_audit_logs").select("id, actor_id, action, detail, created_at").order("created_at", { ascending: false }).limit(40),
  ]);
  const ids = [...new Set([...(members ?? []).map((m: { user_id: string }) => m.user_id), ...(logs ?? []).map((l: { actor_id: string | null }) => l.actor_id).filter(Boolean)])] as string[];
  const { data: profiles } = ids.length ? await ctx.supabase.from("oa_profiles").select("id, full_name, email").in("id", ids) : { data: [] };
  const p = new Map((profiles ?? []).map((x: { id: string; full_name: string; email: string }) => [x.id, x]));

  return (
    <>
      <PageHeader title="Team" subtitle="Invite colleagues, assign roles and review recent activity." />
      <Notice notice={sp.notice} error={sp.error} />
      <h2 className="mb-3 font-heading text-lg font-bold text-navy">Members</h2>
      <TableWrap>
        <thead><tr><th className={th}>Name</th><th className={th}>Role</th><th className={th}>Joined</th>{ctx.isAdmin && <th className={th}></th>}</tr></thead>
        <tbody>{(members ?? []).map((m: { id: string; user_id: string; role: string; created_at: string }) => (
          <tr key={m.id}>
            <td className={td}><p className="font-medium">{p.get(m.user_id)?.full_name ?? "Member"}{m.user_id === ctx.user.id && " (you)"}</p><p className="text-xs text-ink-muted">{p.get(m.user_id)?.email}</p></td>
            <td className={td}>
              {ctx.isAdmin && m.role !== "owner" && m.user_id !== ctx.user.id ? (
                <form action={changeRole} className="flex gap-2"><input type="hidden" name="id" value={m.id} />
                  <select name="role" defaultValue={m.role} className="rounded-lg border border-line px-2 py-1 text-sm">{ROLES.map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select>
                  <button className={btnGhost}>Save</button></form>
              ) : <Badge tone="blue">{roleLabel(m.role)}</Badge>}
            </td>
            <td className={td}><LocalTime iso={m.created_at} dateOnly /></td>
            {ctx.isAdmin && <td className={td}>{m.role !== "owner" && m.user_id !== ctx.user.id && <form action={removeMember}><input type="hidden" name="id" value={m.id} /><button className={btnDanger}>Remove</button></form>}</td>}
          </tr>
        ))}</tbody>
      </TableWrap>

      {ctx.isAdmin && (
        <>
          <h2 className="mb-3 mt-8 font-heading text-lg font-bold text-navy">Invitations</h2>
          <Card className="mb-4">
            <form action={invite} className="grid gap-3 sm:grid-cols-3">
              <Input label="Email" name="email" type="email" required />
              <Select label="Role" name="role" options={ROLES} defaultValue="recruiter" />
              <div className="self-end"><SubmitButton>Create invitation</SubmitButton></div>
            </form>
            <p className="mt-3 text-xs text-ink-muted">Invitations are links you send yourself. The person must sign in or sign up with the same email address to accept.</p>
          </Card>
          {(invites ?? []).length === 0 ? <Empty title="No pending invitations" /> : (
            <ul className="space-y-2">{(invites ?? []).map((i: { id: string; email: string; role: string; token: string }) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-white p-3 text-sm">
                <span><strong>{i.email}</strong> as {roleLabel(i.role)}</span>
                <span className="flex gap-2"><CopyLink path={`/invite/${i.token}`} />
                  <form action={revokeInvite}><input type="hidden" name="id" value={i.id} /><button className={btnDanger}>Revoke</button></form></span>
              </li>
            ))}</ul>
          )}
        </>
      )}

      <h2 className="mb-3 mt-8 font-heading text-lg font-bold text-navy">Activity log</h2>
      {(logs ?? []).length === 0 ? <Empty title="No activity yet" /> : (
        <Card><ul className="divide-y divide-line text-sm">{(logs ?? []).map((l: { id: string; actor_id: string | null; action: string; detail: string | null; created_at: string }) => (
          <li key={l.id} className="flex flex-wrap justify-between gap-2 py-2"><span><strong>{l.actor_id ? p.get(l.actor_id)?.full_name ?? "Team member" : "System"}</strong> <span className="text-ink-muted">{l.action.replace(/[._]/g, " ")}{l.detail ? `: ${l.detail}` : ""}</span></span>
            <span className="text-xs text-ink-muted"><LocalTime iso={l.created_at} /></span></li>
        ))}</ul></Card>
      )}
    </>
  );
}
