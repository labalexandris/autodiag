"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import type { Customer } from "@/lib/types";
import { saveCustomer } from "@/app/admin/actions";
import { Sheet } from "@/components/sheet";
import { toast } from "@/components/toast";

export function EditCustomer({ customer }: { customer: Customer }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn btn-outline" onClick={() => setOpen(true)}>
        <Pencil size={15} /> Επεξεργασία
      </button>
      {open && <Form customer={customer} onClose={() => setOpen(false)} />}
    </>
  );
}

function Form({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [email, setEmail] = useState(customer.email ?? "");
  const [notes, setNotes] = useState(customer.notes ?? "");
  const [sms, setSms] = useState(customer.smsConsent);
  const [marketing, setMarketing] = useState(customer.marketingConsent);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      setError(null);
      const r = await saveCustomer(customer.id, { name, phone, email, notes, smsConsent: sms, marketingConsent: marketing });
      if (!r.ok) return setError(r.error);
      toast("Τα στοιχεία του πελάτη αποθηκεύτηκαν");
      onClose();
    });
  };

  return (
    <Sheet
      title="Στοιχεία πελάτη"
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
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-[14px] font-medium">Ονοματεπώνυμο</span>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[14px] font-medium">Τηλέφωνο</span>
            <input className="field tnum" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[14px] font-medium">
              Email <span className="font-normal text-ink-3">(προαιρετικό)</span>
            </span>
            <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-[14px] font-medium">
            Σημείωση <span className="font-normal text-ink-3">(τη βλέπει μόνο το συνεργείο)</span>
          </span>
          <textarea className="field" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="π.χ. προτιμά επικοινωνία μετά τις 15:00" />
        </label>
        <fieldset className="space-y-2.5">
          <legend className="mb-2 text-[14px] font-medium">Συγκαταθέσεις</legend>
          <label className="flex items-center gap-3 text-[14px]">
            <input type="checkbox" checked={sms} onChange={(e) => setSms(e.target.checked)} className="size-[18px] accent-[var(--brand)]" />
            SMS για ραντεβού
          </label>
          <label className="flex items-center gap-3 text-[14px]">
            <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="size-[18px] accent-[var(--brand)]" />
            Προσφορές και υπενθυμίσεις service
          </label>
        </fieldset>
      </div>
    </Sheet>
  );
}
