import { SubmitButton } from "@/components/auth/fields";
import { Card, Input, Notice, PageHeader, Select } from "@/components/dashboard/ui";
import { getCtx } from "@/lib/ctx";
import { roleLabel } from "@/lib/constants";
import { COMPANY_SIZES, HIRING_VOLUMES, INDUSTRIES, TEAM_SIZES } from "@/lib/org-options";
import { saveOrganization, saveProfile } from "./actions";

export const metadata = { title: "Settings | Onboard AI" };
const withBlank = (o: [string, string][]) => [["", "Select"], ...o] as [string, string][];

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const sp = await searchParams;
  const ctx = await getCtx();
  const { data: o } = await ctx.supabase.from("oa_organizations").select("*").eq("id", ctx.orgId).maybeSingle();
  return (
    <>
      <PageHeader title="Settings" subtitle="Your profile and organization details." />
      <Notice notice={sp.notice} error={sp.error} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-heading text-base font-bold text-navy">Your profile</h2>
          <form action={saveProfile} className="space-y-3">
            <Input label="Full name" name="full_name" required defaultValue={ctx.fullName} />
            <Input label="Email" value={ctx.user.email ?? ""} disabled readOnly />
            <p className="text-sm text-ink-muted">Your role: <strong className="text-ink">{roleLabel(ctx.role)}</strong></p>
            <SubmitButton>Save profile</SubmitButton>
          </form>
        </Card>
        <Card>
          <h2 className="mb-3 font-heading text-base font-bold text-navy">Organization</h2>
          <form action={saveOrganization} className="space-y-3">
            <fieldset disabled={!ctx.isAdmin} className="space-y-3">
              <Input label="Company name" name="name" required defaultValue={o?.name ?? ""} />
              <Input label="Website" name="website" defaultValue={o?.website ?? ""} />
              <Select label="Industry" name="industry" options={withBlank(INDUSTRIES)} defaultValue={o?.industry ?? ""} />
              <Select label="Company size" name="company_size" options={withBlank(COMPANY_SIZES)} defaultValue={o?.company_size ?? ""} />
              <Select label="Hiring volume" name="hiring_volume" options={withBlank(HIRING_VOLUMES)} defaultValue={o?.hiring_volume ?? ""} />
              <Select label="Recruitment team size" name="recruitment_team_size" options={withBlank(TEAM_SIZES)} defaultValue={o?.recruitment_team_size ?? ""} />
            </fieldset>
            {ctx.isAdmin ? <SubmitButton>Save organization</SubmitButton> : <p className="text-sm text-ink-muted">Only owners and admins can edit organization details.</p>}
          </form>
        </Card>
      </div>
    </>
  );
}
