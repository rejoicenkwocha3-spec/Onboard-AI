"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

/** Renders a timestamp in the viewer's own time zone. */
export function LocalTime({ iso, dateOnly }: { iso: string; dateOnly?: boolean }) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    const d = new Date(iso);
    setText(dateOnly
      ? d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
      : d.toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }));
  }, [iso, dateOnly]);
  return <time dateTime={iso} suppressHydrationWarning>{text ?? iso.slice(0, dateOnly ? 10 : 16).replace("T", " ") + (dateOnly ? "" : " UTC")}</time>;
}

/** datetime-local input that submits a true ISO instant, using the viewer's time zone. */
export function DateTimeInput({ name, label, defaultIso }: { name: string; label: string; defaultIso?: string }) {
  const toLocalValue = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    const p = (x: number) => String(x).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  const [local, setLocal] = useState("");
  useEffect(() => { setLocal(toLocalValue(defaultIso)); }, [defaultIso]);
  const iso = local ? new Date(local).toISOString() : "";
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      <input type="datetime-local" required value={local} onChange={(e) => setLocal(e.target.value)}
        className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
      <input type="hidden" name={name} value={iso} />
    </label>
  );
}

export function CopyLink({ path }: { path: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin + path);
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    } catch { /* clipboard unavailable */ }
  };
  return (
    <button type="button" onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-semibold text-navy hover:bg-surface">
      {done ? <Check size={14} /> : <Copy size={14} />}{done ? "Copied" : "Copy link"}
    </button>
  );
}
