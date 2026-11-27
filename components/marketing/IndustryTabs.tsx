"use client";

import { useState } from "react";
import { INDUSTRY_SCENES } from "@/lib/marketing";
import { Chat, PhoneFrame } from "./ui";

export function IndustryTabs() {
  const [i, setI] = useState(0);
  const s = INDUSTRY_SCENES[i];
  return (
    <div>
      <div role="tablist" aria-label="Industries" className="mb-8 flex flex-wrap justify-center gap-2">
        {INDUSTRY_SCENES.map((x, k) => (
          <button key={x.name} role="tab" aria-selected={k === i} onClick={() => setI(k)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${k === i ? "border-brand bg-brand text-white" : "border-line bg-white text-navy hover:bg-surface"}`}>{x.name}</button>
        ))}
      </div>
      <div role="tabpanel" className="grid items-center gap-8 rounded-3xl bg-brand-soft p-6 sm:p-10 md:grid-cols-2">
        <div>
          <h3 className="font-heading text-2xl font-extrabold text-navy sm:text-3xl">{s.title}</h3>
          <p className="mt-3 text-ink-muted">{s.note}</p>
        </div>
        <PhoneFrame title={s.name}><Chat items={s.chat} /></PhoneFrame>
      </div>
      <p className="mt-3 text-center text-xs text-ink-muted">Illustrative conversations</p>
    </div>
  );
}
