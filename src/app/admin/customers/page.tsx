import { getCustomerStats, getCustomers, getVehicles } from "@/lib/data";
import { CustomerTable, type CustomerRow } from "@/components/admin/customer-table";

export const metadata = { title: "Πελάτες" };
export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const [customers, vehicles, stats] = await Promise.all([getCustomers(), getVehicles(), getCustomerStats()]);

  const rows: CustomerRow[] = customers.map((c) => {
    const vs = vehicles.filter((v) => v.ownerId === c.id);
    const st = stats.get(c.id);
    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      plates: vs.map((v) => v.plate),
      vehicles: vs.map((v) => `${v.make} ${v.model}`).join(", "),
      lastVisit: st?.lastVisit,
      visits: st?.visits ?? 0,
      spent: st?.spent ?? 0,
    };
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-cond text-[32px] font-semibold leading-none sm:text-[38px]">Πελάτες</h1>
        <p className="mt-2.5 text-[15px] text-ink-2">
          {customers.length} πελάτες με {vehicles.length} οχήματα. Πάτα σε πελάτη για τα οχήματα και το ιστορικό του.
        </p>
      </header>
      <CustomerTable rows={rows} />
    </div>
  );
}
