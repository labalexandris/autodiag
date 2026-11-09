"use client";

import { useState } from "react";
import { Copy, RefreshCw } from "lucide-react";
import { toast } from "@/components/toast";

export function CalendarConnect() {
  const [connected, setConnected] = useState(true);
  const ics = "https://app.autodiag.gr/cal/7f3k2q9x.ics";
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line-2 p-4">
        <div className="flex items-center gap-3">
          <GoogleCal />
          <div>
            <p className="text-[15px] font-medium">Google Calendar</p>
            <p className="text-[13px] text-ink-2">
              {connected ? (
                <>
                  Συνδεδεμένο ως <span className="text-ink">autodiag.pk@gmail.com</span>. Συγχρονίστηκε πριν από 2′.
                </>
              ) : (
                "Δεν είναι συνδεδεμένο"
              )}
            </p>
          </div>
        </div>
        {connected ? (
          <div className="flex gap-2">
            <button className="btn btn-outline btn-sm" onClick={() => toast("Ο συγχρονισμός ολοκληρώθηκε")}>
              <RefreshCw size={14} /> Συγχρονισμός
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setConnected(false)}>
              Αποσύνδεση
            </button>
          </div>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={() => setConnected(true)}>
            Σύνδεση με Google
          </button>
        )}
      </div>
      {connected && (
        <ul className="space-y-2 text-[14px] text-ink-2">
          <li>Κάθε επιβεβαιωμένο ραντεβού γράφεται αμέσως στο ημερολόγιο του κινητού.</li>
          <li>Τα προσωπικά σου events (π.χ. «Γιατρός 11:00») κλείνουν αυτόματα τις αντίστοιχες ώρες στις online κρατήσεις.</li>
        </ul>
      )}
      <div>
        <p className="text-[14px] font-medium">Για iPhone ή άλλο ημερολόγιο</p>
        <p className="mt-0.5 text-[13px] text-ink-3">Συνδρομή μόνο για ανάγνωση. Ανανεώνεται κάθε λίγες ώρες.</p>
        <div className="mt-2 flex max-w-xl gap-2">
          <input className="field h-10 text-[13px] text-ink-2" readOnly value={ics} aria-label="Σύνδεσμος ICS" onFocus={(e) => e.target.select()} />
          <button
            className="btn btn-outline h-10 shrink-0"
            onClick={() => {
              navigator.clipboard?.writeText(ics).catch(() => {});
              toast("Ο σύνδεσμος αντιγράφηκε");
            }}
          >
            <Copy size={15} /> Αντιγραφή
          </button>
        </div>
      </div>
    </div>
  );
}

function GoogleCal() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden>
      <rect x="3" y="5" width="30" height="28" rx="5" fill="#fff" stroke="var(--line)" />
      <rect x="3" y="5" width="30" height="8" rx="5" fill="#4285F4" />
      <rect x="3" y="10" width="30" height="3" fill="#4285F4" />
      <text x="18" y="28" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1e2226" fontFamily="var(--font-fira-cond)">
        31
      </text>
    </svg>
  );
}
