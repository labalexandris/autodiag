"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Plus, Trash2, X } from "lucide-react";
import type { Service } from "@/lib/types";
import { saveRecord } from "@/app/admin/actions";
import { toast } from "@/components/toast";
import { fmtEUR, cn } from "@/lib/format";

type Row = { name: string; qty: string; price: string };

/**
 * Νέα εγγραφή στο βιβλιάριο. Ανοίγει σαν sheet από κάτω στο κινητό,
 * σαν πλαϊνό πάνελ στο desktop.
 */
export function RecordForm({ vehicleId, currentKm, services }: { vehicleId: string; currentKm: number; services: Service[] }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [serviceId, setServiceId] = useState(services[0].id);
  const [title, setTitle] = useState("");
  const [km, setKm] = useState(String(currentKm));
  const [desc, setDesc] = useState("");
  const [dtc, setDtc] = useState("");
  const [rows, setRows] = useState<Row[]>([{ name: "", qty: "1", price: "" }]);
  const [labor, setLabor] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);

  const items = rows
    .filter((r) => r.name.trim())
    .map((r) => ({ name: r.name.trim(), qty: Number(r.qty) || 1, price: Number(r.price.replace(",", ".")) || 0 }));
  const sum = items.reduce((s, i) => s + i.qty * i.price, 0) + (Number(labor.replace(",", ".")) || 0);
  const kmNum = Number(km.replace(/\D/g, ""));
  const kmWarn = kmNum > 0 && kmNum < currentKm;
  const valid = title.trim().length > 1 && kmNum > 0;

  const reset = () => {
    setTitle("");
    setDesc("");
    setDtc("");
    setRows([{ name: "", qty: "1", price: "" }]);
    setLabor("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    start(async () => {
      await saveRecord({
        vehicleId,
        serviceId,
        km: kmNum,
        title: title.trim(),
        description: desc.trim(),
        dtcs: dtc.split(/[\s,]+/).map((c) => c.trim().toUpperCase()).filter(Boolean),
        items,
        labor: Number(labor.replace(",", ".")) || 0,
      });
      setOpen(false);
      reset();
      toast("Η εργασία καταχωρήθηκε στο βιβλιάριο");
    });
  };

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        <Plus size={17} /> Νέα εργασία
      </button>
      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === dialog.current && setOpen(false)}
        className="m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-hidden rounded-t-2xl bg-panel p-0 text-ink backdrop:bg-ink/40 sm:ml-auto sm:mr-0 sm:mt-0 sm:h-dvh sm:max-h-none sm:w-[480px] sm:rounded-none"
        aria-labelledby="rf-title"
      >
        <form onSubmit={submit} className="flex h-full max-h-[92dvh] flex-col sm:max-h-none">
          <header className="flex items-center justify-between border-b border-line-2 px-5 py-4">
            <h2 id="rf-title" className="font-cond text-[21px] font-semibold">Νέα εργασία</h2>
            <button type="button" className="btn btn-ghost btn-sm -mr-2" onClick={() => setOpen(false)} aria-label="Κλείσιμο">
              <X size={18} />
            </button>
          </header>

          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
            <fieldset>
              <legend className="mb-2 text-[14px] font-medium">Κατηγορία</legend>
              <div className="flex flex-wrap gap-1.5">
                {services.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => setServiceId(s.id)}
                    aria-pressed={serviceId === s.id}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-[13px] transition-colors",
                      serviceId === s.id ? "border-brand bg-brand-soft font-medium text-brand-ink" : "border-line text-ink-2 hover:border-ink-3",
                    )}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium">Τίτλος</span>
              <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="π.χ. Αντικατάσταση δυναμό" required />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium">Χιλιόμετρα</span>
              <input className="field tnum" inputMode="numeric" value={km} onChange={(e) => setKm(e.target.value)} />
              {kmWarn && <span className="mt-1.5 block text-[13px] text-[#9a7400]">Λιγότερα από την τελευταία καταγραφή ({currentKm.toLocaleString("el-GR")} km). Έλεγξε τον αριθμό.</span>}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium">Τι έγινε</span>
              <textarea className="field" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Διάγνωση, ευρήματα, τι αντικαταστάθηκε" />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium">Κωδικοί βλάβης <span className="font-normal text-ink-3">(προαιρετικό)</span></span>
              <input className="field font-cond uppercase tnum" value={dtc} onChange={(e) => setDtc(e.target.value)} placeholder="P0301, P0300" />
            </label>

            <fieldset>
              <legend className="mb-2 text-[14px] font-medium">Ανταλλακτικά</legend>
              <div className="space-y-2">
                {rows.map((r, i) => (
                  <div key={i} className="grid grid-cols-[1fr_56px_84px_32px] gap-2">
                    <input className="field" aria-label="Ανταλλακτικό" placeholder="Περιγραφή" value={r.name} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                    <input className="field px-2 text-center tnum" aria-label="Ποσότητα" inputMode="numeric" value={r.qty} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, qty: e.target.value } : x)))} />
                    <input className="field px-2 text-right tnum" aria-label="Τιμή σε ευρώ" inputMode="decimal" placeholder="€" value={r.price} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))} />
                    <button type="button" className="grid place-items-center text-ink-3 hover:text-fuse-red disabled:opacity-30" disabled={rows.length === 1} onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label="Αφαίρεση γραμμής">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="mt-2 inline-flex items-center gap-1.5 text-[14px] font-medium text-brand" onClick={() => setRows([...rows, { name: "", qty: "1", price: "" }])}>
                <Plus size={15} /> Προσθήκη γραμμής
              </button>
            </fieldset>

            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium">Κόστος εργασίας</span>
              <input className="field w-36 text-right tnum" inputMode="decimal" placeholder="€" value={labor} onChange={(e) => setLabor(e.target.value)} />
            </label>
          </div>

          <footer className="flex items-center justify-between gap-3 border-t border-line-2 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <span className="text-[14px] text-ink-2">
              Σύνολο <span className="ml-1 text-[17px] font-semibold text-ink tnum">{fmtEUR(sum, 2)}</span>
            </span>
            <button className="btn btn-primary" disabled={!valid || pending}>
              {pending ? "Αποθήκευση…" : "Καταχώρηση"}
            </button>
          </footer>
        </form>
      </dialog>
    </>
  );
}
