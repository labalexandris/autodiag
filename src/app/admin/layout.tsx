import { Sidebar, MobileHeader, MobileNav } from "@/components/admin/nav";
import { getPendingCount } from "@/lib/data";
import { getSearchEntries } from "@/lib/views";
import { requireUser } from "@/lib/auth-server";
import { roleLabel } from "@/lib/users";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [pending, entries] = await Promise.all([getPendingCount(), getSearchEntries()]);
  const me = { name: user.name, roleLabel: roleLabel[user.role], isOwner: user.role === "owner" };
  return (
    <div className="flex min-h-dvh">
      <Sidebar pending={pending} me={me} />
      <div className="min-w-0 flex-1">
        <MobileHeader entries={entries} />
        <main className="mx-auto w-full max-w-[1280px] px-4 pb-40 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">{children}</main>
      </div>
      <MobileNav pending={pending} isOwner={me.isOwner} />
    </div>
  );
}
