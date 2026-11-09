"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ChartColumn, Gauge, Settings, Users, ExternalLink } from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/format";

const items = [
  { href: "/admin", label: "Σήμερα", icon: Gauge, exact: true },
  { href: "/admin/calendar", label: "Ημερολόγιο", icon: CalendarDays },
  { href: "/admin/customers", label: "Πελάτες", icon: Users },
  { href: "/admin/reports", label: "Αναφορές", icon: ChartColumn },
  { href: "/admin/settings", label: "Ρυθμίσεις", icon: Settings },
];

function useActive() {
  const path = usePathname();
  return (href: string, exact?: boolean) =>
    exact ? path === href : path === href || path.startsWith(href + "/") || (href === "/admin/customers" && path.startsWith("/admin/vehicles"));
}

export function Sidebar({ pending }: { pending: number }) {
  const isActive = useActive();
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line-2 bg-panel px-3 py-5 lg:flex">
      <Link href="/admin" className="px-2">
        <Logo />
      </Link>
      <nav className="mt-8 flex flex-col gap-0.5" aria-label="Κύρια πλοήγηση">
        {items.map(({ href, label, icon: Icon, exact }) => {
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
        <Link href="/book" target="_blank" className="flex items-center gap-2 text-[13px] text-ink-3 hover:text-brand">
          <ExternalLink size={14} /> Σελίδα κρατήσεων
        </Link>
        <div className="flex items-center gap-2.5 border-t border-line-2 pt-4">
          <span className="grid size-8 place-items-center rounded-full bg-ink text-[12px] font-semibold text-white">ΓΠ</span>
          <span className="leading-tight">
            <span className="block text-[14px] font-medium">Γιώργος</span>
            <span className="block text-[12px] text-ink-3">Διαχειριστής</span>
          </span>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav({ pending }: { pending: number }) {
  const isActive = useActive();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line-2 bg-panel/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      aria-label="Κύρια πλοήγηση"
    >
      {items.map(({ href, label, icon: Icon, exact }) => {
        const active = isActive(href, exact);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn("relative flex h-16 flex-col items-center justify-center gap-1 text-[11px]", active ? "text-brand" : "text-ink-3")}
          >
            <Icon size={21} strokeWidth={active ? 2.2 : 1.8} />
            {label}
            {href === "/admin" && pending > 0 && (
              <span className="absolute right-[calc(50%-20px)] top-2.5 size-2 rounded-full bg-signal ring-2 ring-panel" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
