import { SubmitButton } from "@/components/auth/fields";
import { Logo } from "@/components/auth/AuthShell";
import { Card, Input, Notice, Select } from "@/components/dashboard/ui";
import { CHANNELS } from "@/lib/constants";
import { getCtx } from "@/lib/ctx";
import { CHALLENGES, COMPANY_SIZES, HIRING_VOLUMES, INDUSTRIES, TEAM_SIZES } from "@/lib/org-options";
import { completeSetup } from "./actions";

export const metadata = { title: "Set up your organization | Onboard AI" };
const withBlank = (o: [string, string][]) => [["", "Select"], ...o] as [string, string][];

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const ctx = await getCtx();
  const { data: o } = await ctx.supabase.from("oa_organizations").select("*").eq("id", ctx.orgId).maybeSingle();
  return (
    <main className="min-h-screen bg-surface px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 text-center"><Logo /></div>
        <h1 className="text-center text-2xl font-extrabold text-navy">Set up your organization</h1>
        <p className="mb-6 mt-1 text-center text-sm text-ink-muted">A few details help us tailor Onboard AI to your hiring. You can change them later in Settings.</p>
        <Notice error={sp.error} />
        <form action={completeSetup} className="space-y-5">
          <Card className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><Input label="Company name" name="name" required defaultValue={o?.name ?? ""} /></div>
            <Input label="Company website" name="website" placeholder="example.com" defaultValue={o?.website ?? ""} />
            <Select label="Industry" name="industry" options={withBlank(INDUSTRIES)} defaultValue={o?.industry ?? ""} />
            <Select label="Company size" name="company_size" options={withBlank(COMPANY_SIZES)} defaultValue={o?.company_size ?? ""} />
            <Select label="Hiring volume" name="hiring_volume" options={withBlank(HIRING_VOLUMES)} defaultValue={o?.hiring_volume ?? ""} />
            <Select label="Recruitment team size" name="recruitment_team_size" options={withBlank(TEAM_SIZES)} defaultValue={o?.recruitment_team_size ?? ""} />
          </Card>
          <Card>
            <p className="mb-2 text-sm font-medium">Main recruitment challenges</p>
            <div className="grid gap-1.5 sm:grid-cols-2">{CHALLENGES.map((c) => <label key={c} className="flex items-center gap-2 text-sm"><input type="checkbox" name="challenges" value={c} defaultChecked={o?.challenges?.includes(c)} className="accent-brand" />{c}</label>)}</div>
            <p className="mb-2 mt-5 text-sm font-medium">Preferred communication channels</p>
            <div className="grid gap-1.5 sm:grid-cols-2">{CHANNELS.filter(([k]) => k !== "internal").map(([k, t]) => <label key={k} className="flex items-center gap-2 text-sm"><input type="checkbox" name="channels" value={k} defaultChecked={o?.preferred_channels?.includes(k)} className="accent-brand" />{t}</label>)}</div>
          </Card>
          <Card>
            <p className="mb-2 text-sm font-medium">What would you like to start with?</p>
            <div className="space-y-1.5 text-sm">
              <label className="flex items-center gap-2"><input type="radio" name="first" value="job" defaultChecked className="accent-brand" />Create my first job opening</label>
              <label className="flex items-center gap-2"><input type="radio" name="first" value="assistant" className="accent-brand" />Create my first AI recruitment assistant</label>
              <label className="flex items-center gap-2"><input type="radio" name="first" value="skip" className="accent-brand" />Skip for now</label>
            </div>
            <div className="mt-3"><Input label="Job title or assistant name" name="first_name" placeholder="Store Associate" hint="Used for the option you chose above. Leave blank to skip." /></div>
          </Card>
          <SubmitButton>Finish setup</SubmitButton>
        </form>
      </div>
    </main>
  );
}
