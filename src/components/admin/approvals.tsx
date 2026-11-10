"use client";

import { useOptimistic, useTransition } from "react";
import { Check, X, MessageSquareText, TriangleAlert } from "lucide-react";
import { updateStatus } from "@/app/admin/actions";
import { Plate } from "@/components/plate";
import { toast } from "@/components/toast";
import { fmtDayLong, fmtTime } from "@/lib/format";

export interface PendingItem {
  id: string;
  start: string;
  plate: string;
  vehicle: string;
  customer: string;
  service: string;
  notes?: string;
  ownerMismatch?: boolean;
}

export function Approvals({ items }: { items: PendingItem[] }) {
  const [list, remove] = useOptimistic(items, (s, id: string) => s.filter((x) => x.id !== id));
  const [, start] = useTransition();

  const act = (it: PendingItem, ok: boolean) =>
    start(async () => {
      remove(it.id);
      await updateStatus(it.id, ok ? "confirmed" : "cancelled");
      toast(ok ? `Επιβεβαιώθηκε. Στάλθηκε SMS στον/στην ${it.customer.split(" ")[0]}.` : "Το αίτημα απορρίφθηκε.");
    });

  if (list.length === 0) {
    return <p className="px-5 py-6 text-[15px] text-ink-2">Δεν υπάρχουν αιτήματα σε αναμονή.</p>;
  }

  return (
    <ul className="divide-y divide-line-2">
      {list.map((it) => (
        <li key={it.id} className="px-5 py-4">
          <div className="flex items-start gap-3">
            <Plate plate={it.plate} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium leading-tight">{it.service}</p>
              <p className="mt-0.5 text-[13px] text-ink-3">
                {it.customer}, {it.vehicle}
              </p>
            </div>
          </div>
          <p className="mt-2.5 text-[14px] first-letter:uppercase">
            {fmtDayLong(it.start)}, <span className="font-semibold tnum">{fmtTime(it.start)}</span>
          </p>
          {it.notes && (
            <p className="mt-1.5 flex gap-2 text-[13px] text-ink-2">
              <MessageSquareText size={14} className="mt-0.5 shrink-0 text-ink-3" />
              {it.notes}
            </p>
          )}
          {it.ownerMismatch && (
            <p className="mt-1.5 flex gap-2 text-[13px] text-[#8a6700]">
              <TriangleAlert size={14} className="mt-0.5 shrink-0" />
              Το έκλεισε άλλος από τον ιδιοκτήτη που έχουμε για αυτή την πινακίδα.
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <button className="btn btn-primary btn-sm" onClick={() => act(it, true)}>
              <Check size={15} /> Επιβεβαίωση
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => act(it, false)}>
              <X size={15} /> Απόρριψη
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
