"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { submitApplication } from "@/app/apply/actions";

type Q = { id: string; question: string; required: boolean };
type Step = { key: string; prompt: string; required: boolean; type?: string; qid?: string };

export function ApplyChat({ job, company }: { job: { id: string; title: string; questions: Q[] }; company: string }) {
  const steps: Step[] = [
    { key: "name", prompt: `Hi, and thank you for your interest in ${job.title} at ${company}. This takes about two minutes. What is your full name?`, required: true },
    { key: "email", prompt: "Thanks. What email address should we use to contact you?", required: true, type: "email" },
    { key: "phone", prompt: "What is the best phone number to reach you? You can skip this.", required: false, type: "tel" },
    { key: "experience", prompt: "Tell us briefly about your relevant experience.", required: false },
    ...job.questions.map((q) => ({ key: "q" + q.id, qid: q.id, prompt: q.question, required: q.required })),
  ];
  const [i, setI] = useState(0);
  const [log, setLog] = useState<{ from: "bot" | "me"; text: string }[]>([{ from: "bot", text: steps[0].prompt }]);
  const [vals, setVals] = useState<Record<string, string>>({});
  const [input, setInput] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [log, err]);

  const finished = i >= steps.length;

  async function send(skip = false) {
    const cur = steps[i];
    const text = skip ? "" : input.trim();
    if (!text && cur.required) return setErr("This question is required.");
    if (cur.key === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(text)) return setErr("Please enter a valid email address.");
    if (cur.key === "name" && text.length < 2) return setErr("Please enter your full name.");
    setErr("");
    const next = { ...vals, [cur.key]: text };
    setVals(next);
    const added: { from: "bot" | "me"; text: string }[] = [{ from: "me", text: text || "Skipped" }];
    if (i + 1 < steps.length) added.push({ from: "bot", text: steps[i + 1].prompt });
    else added.push({ from: "bot", text: "That is everything. Submit your application when you are ready." });
    setLog((l) => [...l, ...added]);
    setInput("");
    setI(i + 1);
  }

  async function submit() {
    setBusy(true); setErr("");
    const res = await submitApplication({
      jobId: job.id, name: vals.name ?? "", email: vals.email ?? "", phone: vals.phone ?? "", experience: vals.experience ?? "",
      answers: job.questions.map((q) => ({ question_id: q.id, answer: vals["q" + q.id] ?? "" })),
    });
    setBusy(false);
    if (res.ok) setDone(true); else setErr(res.error);
  }

  if (done) return (
    <div className="rounded-2xl border border-line bg-white p-6 text-center">
      <h2 className="font-heading text-xl font-bold text-navy">Application received</h2>
      <p className="mt-2 text-sm text-ink-muted">Thank you. {company} will review your application and contact you at {vals.email}.</p>
    </div>
  );

  return (
    <div className="flex h-[70vh] min-h-[420px] flex-col rounded-2xl border border-line bg-white">
      <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
        {log.map((m, k) => (
          <div key={k} className={`flex ${m.from === "me" ? "justify-end" : ""}`}>
            <p className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${m.from === "me" ? "bg-brand text-white" : "bg-surface text-ink"}`}>{m.text}</p>
          </div>
        ))}
        {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
        <div ref={end} />
      </div>
      <div className="border-t border-line p-3">
        {finished ? (
          <button onClick={submit} disabled={busy} className="w-full rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Submitting" : "Submit application"}</button>
        ) : (
          <form noValidate onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} type={steps[i].type ?? "text"} autoFocus maxLength={2000}
              inputMode={steps[i].type === "tel" ? "tel" : undefined} aria-label="Your answer" placeholder="Type your answer"
              className="min-w-0 flex-1 rounded-lg border border-line px-3 py-3 text-base outline-none focus:border-brand" />
            {!steps[i].required && <button type="button" onClick={() => send(true)} className="rounded-lg border border-line px-3 text-sm font-semibold text-navy">Skip</button>}
            <button aria-label="Send" className="grid w-12 place-items-center rounded-lg bg-brand text-white"><Send size={18} /></button>
          </form>
        )}
      </div>
    </div>
  );
}
