import Link from "next/link";
import { SubmitButton } from "@/components/auth/fields";
import { CopyLink } from "@/components/dashboard/client";
import { Badge, Card, Input, Notice, PageHeader, ReadOnlyNote, Textarea } from "@/components/dashboard/ui";
import { getCtx } from "@/lib/ctx";
import { saveCareerPage } from "./actions";

export const metadata = { title: "Career Pages | Onboard AI" };

export default async function CareerPagesPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const sp = await searchParams;
  const ctx = await getCtx();
  const [{ data: page }, { count }] = await Promise.all([
    ctx.supabase.from("oa_career_pages").select("*").eq("organization_id", ctx.orgId).maybeSingle(),
    ctx.supabase.from("oa_jobs").select("id", { count: "exact", head: true }).eq("status", "published"),
  ]);
  const suggested = ctx.orgName.toLowerCase().replace(/'s organization$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  return (
    <>
      <PageHeader title="Career Pages" subtitle="Publish a branded career page that lists your open jobs and links to the conversational application." />
      <Notice notice={sp.notice} error={sp.error} />
      <ReadOnlyNote canWrite={ctx.canWrite} />
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <form action={saveCareerPage} className="space-y-3">
            <Input label="Web address" name="slug" required defaultValue={page?.slug ?? suggested} hint="Your page will live at /careers/your-address" disabled={!ctx.canWrite} />
            <Input label="Headline" name="headline" defaultValue={page?.headline ?? ""} placeholder="Join our team" disabled={!ctx.canWrite} />
            <Textarea label="Company description" name="description" rows={5} defaultValue={page?.description ?? ""} disabled={!ctx.canWrite} />
            <label className="block"><span className="mb-1 block text-sm font-medium">Brand color</span>
              <input type="color" name="brand_color" defaultValue={page?.brand_color ?? "#2563EB"} disabled={!ctx.canWrite} className="h-10 w-20 rounded border border-line" /></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={page?.published} disabled={!ctx.canWrite} className="accent-brand" />Publish this page</label>
            {ctx.canWrite && <div className="max-w-40"><SubmitButton>Save page</SubmitButton></div>}
          </form>
        </Card>
        <Card>
          <h2 className="mb-2 font-heading text-base font-bold text-navy">Status</h2>
          {page ? (
            <div className="space-y-3 text-sm">
              <Badge tone={page.published ? "green" : "gray"}>{page.published ? "Published" : "Not published"}</Badge>
              <p className="text-ink-muted">{count ?? 0} published job{count === 1 ? "" : "s"} will be listed.</p>
              <div className="flex flex-wrap items-center gap-2"><Link href={`/careers/${page.slug}`} target="_blank" className="font-semibold text-brand hover:underline">Open page</Link><CopyLink path={`/careers/${page.slug}`} /></div>
              {!page.published && <p className="text-xs text-ink-muted">Visitors see a not found page until you publish.</p>}
            </div>
          ) : <p className="text-sm text-ink-muted">Save your page to get a shareable link.</p>}
          <p className="mt-4 text-xs text-ink-muted">Custom logo upload is not available yet. The page uses your company name and brand color.</p>
        </Card>
      </div>
    </>
  );
}
