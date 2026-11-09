import { Sidebar, MobileNav } from "@/components/admin/nav";
import { getAppointments } from "@/lib/data";
import { Logo } from "@/components/logo";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const all = await getAppointments();
  const pending = all.filter((a) => a.status === "pending").length;
  return (
    <div className="flex min-h-dvh">
      <Sidebar pending={pending} />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-14 items-center border-b border-line-2 bg-panel/95 px-4 backdrop-blur lg:hidden">
          <Link href="/admin">
            <Logo />
          </Link>
        </header>
        <main className="mx-auto w-full max-w-[1280px] px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">{children}</main>
      </div>
      <MobileNav pending={pending} />
    </div>
  );
}
