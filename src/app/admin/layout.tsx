import { Sidebar, MobileHeader, MobileNav } from "@/components/admin/nav";
import { getAppointments } from "@/lib/data";
import { getSearchEntries } from "@/lib/views";
import { authEnabled } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [all, entries] = await Promise.all([getAppointments(), getSearchEntries()]);
  const pending = all.filter((a) => a.status === "pending").length;
  const canLogout = authEnabled();
  return (
    <div className="flex min-h-dvh">
      <Sidebar pending={pending} canLogout={canLogout} />
      <div className="min-w-0 flex-1">
        <MobileHeader entries={entries} canLogout={canLogout} />
        <main className="mx-auto w-full max-w-[1280px] px-4 pb-40 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">{children}</main>
      </div>
      <MobileNav pending={pending} />
    </div>
  );
}
