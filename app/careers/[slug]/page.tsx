import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { employmentLabel } from "@/lib/constants";

type Page = { company: string; headline: string; description: string; brand_color: string;
  jobs: { id: string; title: string; location: string | null; employment_type: string; department: string | null }[] };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `Careers | ${slug}` };
}

export default async function CareersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  if (!supabase) notFound();
  const { data } = await supabase.rpc("oa_public_career_page", { p_slug: slug });
  const page = data as Page | null;
  if (!page) notFound();
  return (
    <main className="min-h-screen bg-surface">
      <header className="px-4 py-14 text-center text-white" style={{ background: page.brand_color }}>
        <p className="text-sm font-semibold opacity-90">{page.company}</p>
        <h1 className="mx-auto mt-2 max-w-2xl text-3xl font-extrabold sm:text-4xl">{page.headline || `Careers at ${page.company}`}</h1>
        {page.description && <p className="mx-auto mt-4 max-w-2xl whitespace-pre-wrap opacity-95">{page.description}</p>}
      </header>
      <section className="mx-auto max-w-3xl px-4 py-10">
        <h2 className="mb-4 font-heading text-xl font-bold text-navy">Open positions</h2>
        {page.jobs.length === 0 ? <p className="rounded-xl border border-dashed border-line bg-white p-8 text-center text-ink-muted">There are no open positions right now. Please check back soon.</p> : (
          <ul className="space-y-3">{page.jobs.map((j) => (
            <li key={j.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white p-4">
              <div><p className="font-heading font-bold text-navy">{j.title}</p>
                <p className="text-sm text-ink-muted">{[j.department, j.location, employmentLabel(j.employment_type)].filter(Boolean).join(" · ")}</p></div>
              <Link href={`/apply/${j.id}`} className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: page.brand_color }}>Apply</Link>
            </li>
          ))}</ul>
        )}
      </section>
      <p className="pb-8 text-center text-xs text-ink-muted">Powered by Onboard AI</p>
    </main>
  );
}
