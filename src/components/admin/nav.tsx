"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { CalendarDays, ChartColumn, Gauge, Settings, Users, ExternalLink, LogOut, Plus, Search, X } from "lucide-react";
import { logout } from "@/app/login/actions";
import { Logo } from "@/components/logo";
import { PlateSearch, type SearchEntry } from "@/components/plate-search";
import { cn } from "@/lib/format";

const items = [
  { href: "/admin", label: "Σήμερα", icon: Gauge, exact: true },
  { href: "/admin/calendar", label: "Ημερολόγιο", icon: CalendarDays },
  { href: "/admin/customers", label: "Πελάτες", icon: Users },
  { href: "/admin/reports", label: "Αναφορές", icon: ChartColumn, ownerOnly: true },
  { href: "/admin/settings", label: "Ρυθμίσεις", icon: Settings },
];

export interface Me {
  name: string;
  roleLabel: string;
  isOwner: boolean;
}

const visibleItems = (isOwner: boolean) => items.filter((i) => isOwner || !i.ownerOnly);

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

function useActive() {
  const path = usePathname();
  return (href: string, exact?: boolean) =>
    exact ? path === href : path === href || path.startsWith(href + "/") || (href === "/admin/customers" && path.startsWith("/admin/vehicles"));
}

export function Sidebar({ pending, me }: { pending: number; me: Me }) {
  const isActive = useActive();
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line-2 bg-panel px-3 py-5 lg:flex">
      <Link href="/admin" className="px-2">
        <Logo height={56} />
      </Link>
      <nav className="mt-7 flex flex-col gap-0.5" aria-label="Κύρια πλοήγηση">
        {visibleItems(me.isOwner).map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-10 items-center gap-3 rounded-lg px-3 text-[15px] transition-colors",
                active ? "bg-brand-soft font-medium text-brand-ink" : "text-ink-2 hover:bg-sunk hover:text-ink",
              )}
            >
              <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
              {label}
              {href === "/admin" && pending > 0 && (
                <span
                  className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-signal px-1.5 text-[12px] font-semibold text-ink tnum"
                  title={`${pending} αιτήματα προς έγκριση`}
                >
                  {pending}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-3 px-2">
        <Link href="/book" target="_blank" className="flex items-center gap-2 text-[13px] text-ink-2 hover:text-brand">
          <ExternalLink size={14} /> Σελίδα κρατήσεων
        </Link>
        <form action={logout}>
          <button className="flex items-center gap-2 text-[13px] text-ink-2 hover:text-brand">
            <LogOut size={14} /> Αποσύνδεση
          </button>
        </form>
        <Link href="/admin/settings#account" className="flex items-center gap-2.5 border-t border-line-2 pt-4" title="Ο λογαριασμός μου">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-[12px] font-semibold text-white">{initials(me.name)}</span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[14px] font-medium">{me.name}</span>
            <span className="block text-[12px] text-ink-3">{me.roleLabel}</span>
          </span>
        </Link>
      </div>
    </aside>
  );
}

/** Κεφαλίδα κινητού: λογότυπο και αναζήτηση πινακίδας από κάθε σελίδα. */
export function MobileHeader({ entries }: { entries: SearchEntry[] }) {
  const [searching, setSearching] = useState(false);
  return (
    <header className="sticky top-0 z-30 border-b border-line-2 bg-panel/95 backdrop-blur lg:hidden">
      <div className="flex h-14 items-center justify-between gap-2 px-4">
        <Link href="/admin">
          <Logo />
        </Link>
        <div className="flex items-center">
          <button className="btn btn-ghost w-11 px-0" onClick={() => setSearching((s) => !s)} aria-label={searching ? "Κλείσιμο αναζήτησης" : "Αναζήτηση πινακίδας"} aria-expanded={searching}>
            {searching ? <X size={20} /> : <Search size={20} />}
          </button>
          <form action={logout}>
            <button className="btn btn-ghost w-11 px-0" aria-label="Αποσύνδεση">
              <LogOut size={19} />
            </button>
          </form>
        </div>
      </div>
      {searching && (
        <div className="px-4 pb-3">
          <PlateSearch entries={entries} autoFocus onNavigate={() => setSearching(false)} />
        </div>
      )}
    </header>
  );
}

export function MobileNav({ pending, isOwner }: { pending: number; isOwner: boolean }) {
  const isActive = useActive();
  const path = usePathname();
  const navItems = visibleItems(isOwner);
  return (
    <>
      {/* Νέο ραντεβού με τον αντίχειρα, από κάθε σελίδα εκτός του ημερολογίου που έχει το δικό του κουμπί */}
      {!path.startsWith("/admin/calendar") && (
        <Link
          href="/admin/calendar?new=1"
          aria-label="Νέο ραντεβού"
          className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 grid size-14 place-items-center rounded-full bg-brand text-white shadow-[0_10px_24px_-8px_rgba(30,95,184,0.7)] active:bg-brand-ink lg:hidden"
        >
          <Plus size={26} />
        </Link>
      )}
      <nav
        className={cn("fixed inset-x-0 bottom-0 z-40 grid border-t border-line-2 bg-panel/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden", navItems.length === 5 ? "grid-cols-5" : "grid-cols-4")}
        aria-label="Κύρια πλοήγηση"
      >
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn("relative flex h-16 flex-col items-center justify-center gap-1 text-[11px]", active ? "font-medium text-brand" : "text-ink-2")}
            >
              <Icon size={21} strokeWidth={active ? 2.2 : 1.8} />
              {label}
              {href === "/admin" && pending > 0 && (
                <span
                  className="absolute left-[calc(50%+4px)] top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-signal px-1 text-[11px] font-semibold text-ink ring-2 ring-panel tnum"
                  aria-label={`${pending} αιτήματα προς έγκριση`}
                >
                  {pending}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
