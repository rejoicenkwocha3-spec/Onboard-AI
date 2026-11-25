import type { ReactNode } from "react";

export const btn =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-light disabled:opacity-60";
export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-semibold text-navy transition hover:bg-surface";
export const btnDanger =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50";
export const inputCls =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold text-navy">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-line bg-white p-5 shadow-sm ${className}`}>{children}</section>;
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-1 font-heading text-3xl font-extrabold text-navy">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </Card>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-white px-6 py-10 text-center">
      <p className="font-heading text-base font-bold text-navy">{title}</p>
      {children && <div className="mx-auto mt-1 max-w-md text-sm text-ink-muted">{children}</div>}
    </div>
  );
}

const tones: Record<string, string> = {
  green: "bg-green-50 text-success", blue: "bg-brand-soft text-brand", gray: "bg-surface text-ink-muted",
  amber: "bg-amber-50 text-amber-700", red: "bg-red-50 text-red-600",
};
export function Badge({ children, tone = "gray" }: { children: ReactNode; tone?: keyof typeof tones }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export function Notice({ notice, error }: { notice?: string; error?: string }) {
  if (!notice && !error) return null;
  return (
    <div role={error ? "alert" : "status"}
      className={`mb-5 rounded-lg border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-success"}`}>
      {error ?? notice}
    </div>
  );
}

export function Label({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-muted">{hint}</span>}
    </label>
  );
}
export function Input({ label, hint, ...p }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return <Label label={label} hint={hint}><input {...p} className={inputCls} /></Label>;
}
export function Textarea({ label, hint, ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }) {
  return <Label label={label} hint={hint}><textarea rows={3} {...p} className={inputCls} /></Label>;
}
export function Select({ label, options, hint, ...p }: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string; hint?: string; options: readonly (readonly [string, string])[];
}) {
  return (
    <Label label={label} hint={hint}>
      <select {...p} className={inputCls}>
        {options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </Label>
  );
}

/** Collapsible section used for inline create and edit forms. */
export function Disclosure({ summary, children, open, ghost }: { summary: ReactNode; children: ReactNode; open?: boolean; ghost?: boolean }) {
  return (
    <details open={open} className="group">
      <summary className={`${ghost ? btnGhost : btn} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>{summary}</summary>
      <div className="mt-3 rounded-xl border border-line bg-surface p-4">{children}</div>
    </details>
  );
}

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
    </div>
  );
}
export const th = "border-b border-line bg-surface px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-muted";
export const td = "border-b border-line px-4 py-3 align-top last:border-b-0";

export function ReadOnlyNote({ canWrite }: { canWrite: boolean }) {
  if (canWrite) return null;
  return <p className="mb-5 rounded-lg bg-surface px-4 py-2.5 text-sm text-ink-muted">Your role has read only access to this area.</p>;
}
