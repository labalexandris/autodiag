"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, ArrowUpDown } from "lucide-react";
import { Plate } from "@/components/plate";
import { normalizePlate } from "@/lib/plate";
import { fmtEUR, relativeDays, cn } from "@/lib/format";

export interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  plates: string[];
  vehicles: string;
  lastVisit?: string;
  visits: number;
  spent: number;
}

type SortKey = "name" | "lastVisit" | "spent";

export function CustomerTable({ rows }: { rows: CustomerRow[] }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("lastVisit");

  const list = useMemo(() => {
    const lower = q.trim().toLowerCase();
    const np = normalizePlate(q);
    const digits = q.replace(/\D/g, "");
    const filtered = lower
      ? rows.filter(
          (r) =>
            r.name.toLowerCase().includes(lower) ||
            (np.length >= 2 && r.plates.some((p) => normalizePlate(p).includes(np))) ||
            (digits.length >= 3 && r.phone.replace(/\D/g, "").includes(digits)),
        )
      : rows;
    return [...filtered].sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name, "el") : sort === "spent" ? b.spent - a.spent : (b.lastVisit ?? "").localeCompare(a.lastVisit ?? ""),
    );
  }, [q, rows, sort]);

  return (
    <div className="space-y-4">
      <label className="flex h-11 max-w-md items-center gap-2.5 rounded-lg border border-line bg-panel px-3.5 focus-within:border-brand focus-within:shadow-[0_0_0_3px_var(--brand-soft)]">
        <Search size={17} className="text-ink-3" />
        <span className="sr-only">Φίλτρο πελατών</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Όνομα, πινακίδα ή τηλέφωνο" className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink-3" />
      </label>

      <div className="panel overflow-hidden">
        <div className="hidden grid-cols-[1.4fr_1.3fr_1fr_0.8fr] gap-4 border-b border-line-2 px-5 py-2.5 text-[13px] text-ink-3 md:grid">
          <SortBtn sort={sort} setSort={setSort} k="name">Πελάτης</SortBtn>
          <span>Οχήματα</span>
          <SortBtn sort={sort} setSort={setSort} k="lastVisit">Τελευταία επίσκεψη</SortBtn>
          <SortBtn sort={sort} setSort={setSort} k="spent" className="justify-self-end">
            Σύνολο
          </SortBtn>
        </div>
        {list.length === 0 && <p className="px-5 py-8 text-[15px] text-ink-2">Κανένας πελάτης δεν ταιριάζει με «{q}».</p>}
        <ul className="divide-y divide-line-2">
          {list.map((r) => (
            <li key={r.id}>
              <Link href={`/admin/customers/${r.id}`} className="grid gap-x-4 gap-y-2 px-5 py-3.5 transition-colors hover:bg-sunk md:grid-cols-[1.4fr_1.3fr_1fr_0.8fr] md:items-center">
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-medium">{r.name}</span>
                  <span className="block text-[13px] text-ink-3 tnum">{r.phone}</span>
                </span>
                <span className="flex min-w-0 flex-wrap items-center gap-2">
                  {r.plates.map((p) => (
                    <Plate key={p} plate={p} size="xs" />
                  ))}
                  <span className="truncate text-[13px] text-ink-3">{r.vehicles}</span>
                </span>
                <span className="text-[14px] text-ink-2">
                  {r.lastVisit ? relativeDays(r.lastVisit) : "—"}
                  <span className="text-ink-3">, {r.visits} {r.visits === 1 ? "επίσκεψη" : "επισκέψεις"}</span>
                </span>
                <span className="text-[14px] font-medium tnum md:text-right">{fmtEUR(r.spent)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-[13px] text-ink-3">{list.length} από {rows.length} πελάτες</p>
    </div>
  );
}

function SortBtn({
  k,
  sort,
  setSort,
  children,
  className,
}: {
  k: SortKey;
  sort: SortKey;
  setSort: (k: SortKey) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button onClick={() => setSort(k)} className={cn("inline-flex items-center gap-1 hover:text-ink", sort === k && "text-ink", className)}>
      {children}
      <ArrowUpDown size={12} className={sort === k ? "opacity-100" : "opacity-40"} />
    </button>
  );
}
