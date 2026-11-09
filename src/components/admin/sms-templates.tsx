"use client";

import { useState } from "react";
import type { SmsTemplate } from "@/lib/types";
import { smsInfo, toGreeklish } from "@/lib/sms";
import { toast } from "@/components/toast";
import { cn } from "@/lib/format";

const sample: Record<string, string> = {
  "{υπηρεσία}": "Service A/C",
  "{ημέρα}": "Τρ 12/11",
  "{ώρα}": "10:30",
  "{πινακίδα}": "ΙΚΒ-4821",
  "{τηλέφωνο}": "2106398145",
  "{κλείσιμο}": "17:00",
  "{εργασία}": "αλλαγή λαδιών",
};
const vars = Object.keys(sample);

function render(body: string) {
  return vars.reduce((s, v) => s.replaceAll(v, sample[v]), body);
}

export function SmsTemplates({ initial }: { initial: SmsTemplate[] }) {
  const [list, setList] = useState(initial);
  const [sel, setSel] = useState(initial[0].id);
  const [greeklish, setGreeklish] = useState(false);
  const t = list.find((x) => x.id === sel)!;
  const preview = greeklish ? toGreeklish(render(t.body)) : render(t.body);
  const info = smsInfo(preview);
  const greekInfo = smsInfo(render(t.body));
  const latinInfo = smsInfo(toGreeklish(render(t.body)));

  const update = (patch: Partial<SmsTemplate>) => setList((l) => l.map((x) => (x.id === sel ? { ...x, ...patch } : x)));

  return (
    <div className="grid gap-0 md:grid-cols-[240px_1fr]">
      <ul className="flex gap-1 overflow-x-auto border-b border-line-2 p-2 md:flex-col md:border-b-0 md:border-r">
        {list.map((x) => (
          <li key={x.id} className="shrink-0">
            <button
              onClick={() => setSel(x.id)}
              aria-current={x.id === sel}
              className={cn("w-full rounded-lg px-3 py-2.5 text-left", x.id === sel ? "bg-brand-soft" : "hover:bg-sunk")}
            >
              <span className={cn("flex items-center gap-2 text-[14px]", x.id === sel ? "font-medium text-brand-ink" : "")}>
                <span className={cn("size-1.5 rounded-full", x.enabled ? "bg-fuse-green" : "bg-line")} aria-hidden />
                {x.name}
              </span>
              <span className="mt-0.5 block pl-3.5 text-[12px] text-ink-3">{x.when}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="grid gap-6 p-5 lg:grid-cols-[1fr_260px]">
        <div className="space-y-3">
          <label className="flex items-center justify-between gap-3">
            <span className="text-[15px] font-medium">{t.name}</span>
            <span className="flex items-center gap-2 text-[13px] text-ink-2">
              {t.enabled ? "Ενεργό" : "Ανενεργό"}
              <button
                role="switch"
                aria-checked={t.enabled}
                aria-label={`${t.name}: ενεργό`}
                onClick={() => update({ enabled: !t.enabled })}
                className={cn("relative h-6 w-10 rounded-full transition-colors", t.enabled ? "bg-brand" : "bg-line")}
              >
                <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left]", t.enabled ? "left-[18px]" : "left-0.5")} />
              </button>
            </span>
          </label>
          <textarea className="field min-h-28 text-[15px]" value={t.body} onChange={(e) => update({ body: e.target.value })} aria-label="Κείμενο μηνύματος" />
          <div className="flex flex-wrap gap-1.5">
            {vars.map((v) => (
              <button key={v} onClick={() => update({ body: `${t.body}${t.body.endsWith(" ") ? "" : " "}${v}` })} className="rounded-md border border-line px-2 py-1 text-[12.5px] text-ink-2 hover:border-brand hover:text-brand">
                {v}
              </button>
            ))}
          </div>
          <label className="mt-2 flex items-start gap-2.5 rounded-lg bg-sunk px-3 py-2.5 text-[13.5px]">
            <input type="checkbox" className="mt-0.5 size-4 accent-[var(--brand)]" checked={greeklish} onChange={(e) => setGreeklish(e.target.checked)} />
            <span>
              Αποστολή σε Greeklish
              <span className="block text-[12.5px] text-ink-3">
                Ελληνικά: {greekInfo.segments} {greekInfo.segments === 1 ? "μήνυμα" : "μηνύματα"} ανά αποστολή. Greeklish: {latinInfo.segments}. Τα ελληνικά χωράνε 70 χαρακτήρες ανά SMS αντί για 160.
              </span>
            </span>
          </label>
          <button className="btn btn-primary btn-sm" onClick={() => toast("Το πρότυπο αποθηκεύτηκε")}>
            Αποθήκευση προτύπου
          </button>
        </div>

        <div>
          <p className="mb-2 text-[13px] text-ink-3">Προεπισκόπηση</p>
          <div className="rounded-[22px] border border-line bg-sunk p-3">
            <p className="mb-2 text-center text-[11.5px] font-medium text-ink-3">AUTODIAG</p>
            <div className="max-w-[92%] whitespace-pre-wrap break-words rounded-2xl rounded-bl-md bg-panel px-3.5 py-2.5 text-[14px] leading-snug shadow-[0_1px_0_var(--line)]">{preview}</div>
          </div>
          <p className={cn("mt-2 text-[12.5px] tnum", info.segments > 1 ? "text-[#9a7400]" : "text-ink-3")}>
            {info.length} χαρακτήρες, {info.segments} {info.segments === 1 ? "SMS" : "SMS (χρεώνεται κάθε ένα)"}, {info.encoding}
          </p>
        </div>
      </div>
    </div>
  );
}
