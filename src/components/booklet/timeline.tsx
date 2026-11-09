import type { ServiceRecord } from "@/lib/types";
import { fmtDate, fmtEUR, fmtNum, cn } from "@/lib/format";

function total(r: ServiceRecord) {
  return r.labor + r.items.reduce((s, i) => s + i.qty * i.price, 0);
}

/**
 * Οι εγγραφές του βιβλιαρίου, νεότερη πρώτη. Κάθε εγγραφή κλείνει με τη
 * «σφραγίδα» του συνεργείου, όπως στο χάρτινο βιβλιάριο service.
 */
export function Timeline({ records, showPrices = true, highlightId }: { records: ServiceRecord[]; showPrices?: boolean; highlightId?: string }) {
  if (records.length === 0) {
    return (
      <div className="panel px-6 py-10 text-center">
        <p className="text-[16px] font-medium">Το βιβλιάριο είναι άδειο</p>
        <p className="mt-1 text-[14px] text-ink-2">Η πρώτη εργασία που θα καταχωρήσεις θα εμφανιστεί εδώ.</p>
      </div>
    );
  }
  return (
    <ol className="relative">
      <span className="absolute bottom-6 left-[7px] top-3 w-px bg-line sm:left-[119px]" aria-hidden />
      {records.map((r) => (
        <li key={r.id} className={cn("relative grid gap-x-8 pb-6 pl-8 sm:grid-cols-[96px_1fr] sm:pl-0", r.id === highlightId && "animate-rise")}>
          <span className="absolute left-0 top-[18px] size-[15px] rounded-full border-[3px] border-bg bg-ink-3 sm:left-[112px]" aria-hidden />
          <div className="pb-2 pt-3 sm:text-right">
            <p className="text-[14px] font-semibold tnum">{fmtDate(r.date)}</p>
            <p className="text-[13px] text-ink-3 tnum">{fmtNum(r.km)} km</p>
          </div>
          <article className="panel relative overflow-hidden sm:ml-4">
            <div className="px-5 pb-4 pt-4">
              <h3 className="font-cond text-[19px] font-semibold leading-tight">{r.title}</h3>
              <p className="mt-1.5 max-w-[68ch] text-[14.5px] leading-relaxed text-ink-2">{r.description}</p>
              {r.dtcs && r.dtcs.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-[12px] text-ink-3">Κωδικοί βλάβης</span>
                  {r.dtcs.map((c) => (
                    <span key={c} className="rounded-[4px] border border-fuse-red/30 bg-[#fcecec] px-1.5 py-0.5 font-cond text-[13px] font-semibold text-[#a3312e] tnum">
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {(r.items.length > 0 || showPrices) && (
              <div className="border-t border-dashed border-line bg-sunk/70 px-5 py-3">
                {r.items.length > 0 && (
                  <ul className="space-y-1 text-[14px]">
                    {r.items.map((it, i) => (
                      <li key={i} className="flex justify-between gap-4">
                        <span className="text-ink-2">
                          {it.name}
                          {it.qty > 1 && <span className="text-ink-3"> × {it.qty}</span>}
                        </span>
                        {showPrices && <span className="tnum">{fmtEUR(it.qty * it.price, 2)}</span>}
                      </li>
                    ))}
                    {showPrices && r.labor > 0 && (
                      <li className="flex justify-between gap-4">
                        <span className="text-ink-2">Εργασία</span>
                        <span className="tnum">{fmtEUR(r.labor, 2)}</span>
                      </li>
                    )}
                  </ul>
                )}
                <div className="mt-2 flex items-end justify-between gap-4">
                  <span className="text-[13px] text-ink-3">{r.technician}</span>
                  <span className="flex items-center gap-4">
                    {showPrices && <span className="text-[15px] font-semibold tnum">{fmtEUR(total(r), 2)}</span>}
                    <Stamp date={r.date} />
                  </span>
                </div>
              </div>
            )}
          </article>
        </li>
      ))}
    </ol>
  );
}

function Stamp({ date }: { date: string }) {
  const d = new Date(date);
  return (
    <span
      className="hidden -rotate-[4deg] flex-col items-center rounded-[5px] border-[1.5px] border-brand/55 px-2 py-0.5 leading-none text-brand/75 sm:flex"
      aria-hidden
    >
      <span className="font-cond text-[10px] font-bold tracking-[0.08em]">AUTODIAG</span>
      <span className="font-cond text-[10px] tnum">
        {String(d.getDate()).padStart(2, "0")}.{String(d.getMonth() + 1).padStart(2, "0")}.{String(d.getFullYear()).slice(2)}
      </span>
    </span>
  );
}
