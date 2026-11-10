"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import type { Fuel, Vehicle } from "@/lib/types";
import { saveVehicle } from "@/app/admin/actions";
import { Sheet } from "@/components/sheet";
import { toast } from "@/components/toast";

const fuels: Fuel[] = ["Βενζίνη", "Diesel", "Υβριδικό", "Ηλεκτρικό", "LPG"];

export function EditVehicle({ vehicle, incomplete }: { vehicle: Vehicle; incomplete?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn btn-outline" onClick={() => setOpen(true)}>
        <Pencil size={15} /> {incomplete ? "Συμπλήρωση στοιχείων" : "Στοιχεία"}
      </button>
      {open && <Form vehicle={vehicle} onClose={() => setOpen(false)} />}
    </>
  );
}

function Form({ vehicle, onClose }: { vehicle: Vehicle; onClose: () => void }) {
  const [make, setMake] = useState(vehicle.make);
  const [model, setModel] = useState(vehicle.model);
  const [year, setYear] = useState(vehicle.year ? String(vehicle.year) : "");
  const [fuel, setFuel] = useState<Fuel | "">(vehicle.fuel ?? "");
  const [engine, setEngine] = useState(vehicle.engine ?? "");
  const [vin, setVin] = useState(vehicle.vin ?? "");
  const [km, setKm] = useState(String(vehicle.km));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      setError(null);
      const r = await saveVehicle(vehicle.id, {
        make,
        model,
        year: year.trim() ? Number(year) : undefined,
        fuel: fuel || undefined,
        engine,
        vin,
        km: Number(km.replace(/\D/g, "")) || 0,
      });
      if (!r.ok) return setError(r.error);
      toast("Τα στοιχεία του οχήματος αποθηκεύτηκαν");
      onClose();
    });
  };

  return (
    <Sheet
      title={`Στοιχεία ${vehicle.plate}`}
      onClose={onClose}
      onSubmit={submit}
      footer={
        <>
          <span className="text-[13px] text-fuse-red">{error}</span>
          <button className="btn btn-primary" disabled={pending}>
            {pending ? "Αποθήκευση…" : "Αποθήκευση"}
          </button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[14px] font-medium">Μάρκα</span>
          <input className="field" value={make} onChange={(e) => setMake(e.target.value)} required />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[14px] font-medium">Μοντέλο</span>
          <input className="field" value={model} onChange={(e) => setModel(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[14px] font-medium">Έτος</span>
          <input className="field tnum" inputMode="numeric" maxLength={4} value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))} placeholder="π.χ. 2017" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[14px] font-medium">Καύσιμο</span>
          <select className="field" value={fuel} onChange={(e) => setFuel(e.target.value as Fuel | "")}>
            <option value="">Άγνωστο</option>
            {fuels.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[14px] font-medium">Κινητήρας</span>
          <input className="field" value={engine} onChange={(e) => setEngine(e.target.value)} placeholder="π.χ. 1.6 TDI" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[14px] font-medium">Χιλιόμετρα</span>
          <input className="field tnum" inputMode="numeric" value={km} onChange={(e) => setKm(e.target.value)} />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-[14px] font-medium">Αριθμός πλαισίου (VIN)</span>
          <input className="field font-cond uppercase tracking-[0.04em]" maxLength={17} value={vin} onChange={(e) => setVin(e.target.value)} />
        </label>
      </div>
    </Sheet>
  );
}
