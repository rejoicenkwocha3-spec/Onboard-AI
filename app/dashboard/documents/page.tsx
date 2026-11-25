import { Upload } from "lucide-react";
import { SubmitButton } from "@/components/auth/fields";
import { LocalTime } from "@/components/dashboard/client";
import { Badge, btnDanger, Card, Disclosure, Empty, Input, Notice, PageHeader, ReadOnlyNote, Select, TableWrap, td, th } from "@/components/dashboard/ui";
import { DOC_CATEGORIES, docLabel } from "@/lib/constants";
import { getCtx } from "@/lib/ctx";
import { deleteDocument, uploadDocument } from "./actions";

export const metadata = { title: "Documents | Onboard AI" };
type Doc = { id: string; name: string; category: string; storage_path: string; size_bytes: number | null; created_at: string };

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ cat?: string; notice?: string; error?: string }> }) {
  const sp = await searchParams;
  const ctx = await getCtx();
  let q = ctx.supabase.from("oa_documents").select("id, name, category, storage_path, size_bytes, created_at").order("created_at", { ascending: false });
  if (sp.cat && DOC_CATEGORIES.some(([k]) => k === sp.cat)) q = q.eq("category", sp.cat);
  const { data } = await q;
  const docs = (data ?? []) as Doc[];
  const { data: signed } = docs.length ? await ctx.supabase.storage.from("oa-documents").createSignedUrls(docs.map((d) => d.storage_path), 300) : { data: [] };
  const url = new Map<string | null, string | null>((signed ?? []).map((x) => [x.path, x.signedUrl] as [string | null, string | null]));

  return (
    <>
      <PageHeader title="Documents" subtitle="Private storage for resumes, offer letters, policies and onboarding files. Files are never public: download links expire after five minutes." />
      <Notice notice={sp.notice} error={sp.error} />
      <ReadOnlyNote canWrite={ctx.canWrite} />
      <div className="mb-5 flex flex-wrap gap-2">
        {[["", "All"], ...DOC_CATEGORIES].map(([v, t]) => (
          <a key={v} href={v ? `/dashboard/documents?cat=${v}` : "/dashboard/documents"}
            className={`rounded-full border px-3 py-1 text-sm font-medium ${(sp.cat ?? "") === v ? "border-brand bg-brand-soft text-brand" : "border-line bg-white text-ink-muted"}`}>{t}</a>
        ))}
      </div>
      {ctx.canWrite && (
        <div className="mb-6"><Disclosure summary={<><Upload size={16} />Upload document</>}>
          <form action={uploadDocument} className="grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2"><span className="mb-1 block text-sm font-medium">File</span>
              <input type="file" name="file" required accept=".pdf,.doc,.docx,.txt,.rtf,.csv,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg" className="block w-full text-sm" />
              <span className="mt-1 block text-xs text-ink-muted">PDF, DOCX, TXT, spreadsheets, slides or images, up to 4 MB.</span></label>
            <Input label="Display name (optional)" name="name" />
            <Select label="Category" name="category" options={DOC_CATEGORIES} defaultValue="other" />
            <div className="max-w-40"><SubmitButton>Upload</SubmitButton></div>
          </form></Disclosure></div>
      )}
      {docs.length === 0 ? <Empty title="No documents yet" /> : (
        <TableWrap>
          <thead><tr><th className={th}>Name</th><th className={th}>Category</th><th className={th}>Size</th><th className={th}>Uploaded</th><th className={th}></th></tr></thead>
          <tbody>{docs.map((d) => (
            <tr key={d.id}>
              <td className={td}>{url.get(d.storage_path) ? <a href={url.get(d.storage_path) ?? undefined} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand hover:underline">{d.name}</a> : d.name}</td>
              <td className={td}><Badge tone="blue">{docLabel(d.category)}</Badge></td>
              <td className={td}>{d.size_bytes ? `${(d.size_bytes / 1024).toFixed(d.size_bytes > 1048576 ? 0 : 1)} KB` : ""}</td>
              <td className={td}><LocalTime iso={d.created_at} dateOnly /></td>
              <td className={td}>{ctx.canWrite && <form action={deleteDocument}><input type="hidden" name="id" value={d.id} /><button className={btnDanger}>Delete</button></form>}</td>
            </tr>
          ))}</tbody>
        </TableWrap>
      )}
      <Card className="mt-6"><p className="text-sm text-ink-muted">Employee document requests and policy acknowledgments are handled as onboarding tasks for now. Dedicated request and e-sign flows are not available yet.</p></Card>
    </>
  );
}
