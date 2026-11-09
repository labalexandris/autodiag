"use client";

import Link from "next/link";
import { useState } from "react";
import { Send } from "lucide-react";
import { Plate } from "@/components/plate";
import { toast } from "@/components/toast";
import { cn } from "@/lib/format";

export interface DueItem {
  id: string;
  plate: string;
  plateKey: string;
  label: string;
  detail: string;
  owner: string;
  overdue: boolean;
}

export function DueList({ items }: { items: DueItem[] }) {
  const [sent, setSent] = useState<Set<string>>(new Set());
  if (items.length === 0) return <p className="px-5 py-6 text-[15px] text-ink-2">Τίποτα δεν λήγει τις επόμενες 30 μέρες.</p>;
  return (
    <ul className="divide-y divide-line-2">
      {items.map((it) => (
        <li key={it.id} className="flex items-center gap-3 px-5 py-3">
          <Link href={`/admin/vehicles/${it.plateKey}`} className="flex min-w-0 flex-1 items-center gap-3">
            <Plate plate={it.plate} size="xs" />
            <span className="min-w-0">
              <span className="block truncate text-[14px] font-medium">{it.label}</span>
              <span className={cn("block truncate text-[13px]", it.overdue ? "text-fuse-red" : "text-ink-3")}>
                {it.detail}, {it.owner}
              </span>
            </span>
          </Link>
          <button
            className="btn btn-outline btn-sm shrink-0"
            disabled={sent.has(it.id)}
            onClick={() => {
              setSent((s) => new Set(s).add(it.id));
              toast(`Στάλθηκε υπενθύμιση στο ${it.plate}`);
            }}
          >
            <Send size={14} />
            <span className="hidden sm:inline">{sent.has(it.id) ? "Στάλθηκε" : "SMS"}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
