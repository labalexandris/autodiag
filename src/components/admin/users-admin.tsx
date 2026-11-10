"use client";

import { useState, useTransition } from "react";
import { Pencil, UserPlus } from "lucide-react";
import { addUser, editUser } from "@/app/admin/settings/actions";
import { Sheet } from "@/components/sheet";
import { toast } from "@/components/toast";
import { cn } from "@/lib/format";

type Role = "owner" | "staff";
export interface UserRow {
  id: string;
  username: string;
  name: string;
  role: Role;
  active: boolean;
}

const roles: { value: Role; label: string; desc: string }[] = [
  { value: "owner", label: "Ιδιοκτήτης", desc: "Όλα, μαζί με αναφορές και χρήστες" },
  { value: "staff", label: "Υπάλληλος", desc: "Χωρίς αναφορές, χωρίς ακύρωση ραντεβού" },
];
const roleName = (r: Role) => roles.find((x) => x.value === r)!.label;

/** Λίστα χρηστών με προσθήκη και επεξεργασία. Μόνο για ιδιοκτήτες. */
export function UsersAdmin({ users, meId }: { users: UserRow[]; meId: string }) {
  const [editing, setEditing] = useState<UserRow | "new" | null>(null);
  return (
    <div className="panel overflow-hidden">
      <ul className="divide-y divide-line-2">
        {users.map((u) => (
          <li key={u.id} className={cn("flex items-center gap-3 px-5 py-3", !u.active && "opacity-60")}>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-medium">
                {u.name}
                {u.id === meId && <span className="ml-2 text-[12px] font-normal text-ink-3">(εσύ)</span>}
              </p>
              <p className="text-[13px] text-ink-3">
                {u.username}, {roleName(u.role)}
                {!u.active && <span className="text-fuse-red">, ανενεργός</span>}
              </p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(u)} aria-label={`Επεξεργασία ${u.name}`}>
              <Pencil size={15} /> Επεξεργασία
            </button>
          </li>
        ))}
      </ul>
      <div className="border-t border-line-2 px-5 py-3">
        <button className="btn btn-outline btn-sm" onClick={() => setEditing("new")}>
          <UserPlus size={15} /> Νέος χρήστης
        </button>
      </div>
      {editing && <UserForm user={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function UserForm({ user, onClose }: { user?: UserRow; onClose: () => void }) {
  const [name, setName] = useState(user?.name ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [role, setRole] = useState<Role>(user?.role ?? "staff");
  const [active, setActive] = useState(user?.active ?? true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      setError(null);
      const r = user ? await editUser(user.id, { name, role, active, password }) : await addUser({ name, username, role, password });
      if (!r.ok) return setError(r.error);
      toast(user ? "Ο χρήστης αποθηκεύτηκε" : `Ο χρήστης ${username.trim().toLowerCase()} δημιουργήθηκε`);
      onClose();
    });
  };

  return (
    <Sheet
      title={user ? "Επεξεργασία χρήστη" : "Νέος χρήστης"}
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
        <label className="block">
          <span className="mb-1.5 block text-[14px] font-medium">Όνομα χρήστη</span>
          <input
            className="field disabled:bg-sunk disabled:text-ink-3"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={!!user}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="π.χ. nikos"
            required
          />
          {!user && <span className="mt-1 block text-[12px] text-ink-3">Λατινικά, χωρίς κενά. Με αυτό συνδέεται.</span>}
        </label>
        <fieldset>
          <legend className="mb-1.5 text-[14px] font-medium">Ρόλος</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {roles.map((r) => (
              <label
                key={r.value}
                className={cn("flex cursor-pointer gap-3 rounded-lg border px-3 py-2.5", role === r.value ? "border-brand bg-brand-soft" : "border-line-2")}
              >
                <input type="radio" name="role" checked={role === r.value} onChange={() => setRole(r.value)} className="mt-1 accent-[var(--brand)]" />
                <span>
                  <span className="block text-[14px] font-medium">{r.label}</span>
                  <span className="block text-[12px] text-ink-3">{r.desc}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block">
          <span className="mb-1.5 block text-[14px] font-medium">
            {user ? (
              <>
                Νέος κωδικός <span className="font-normal text-ink-3">(άφησέ το κενό για να μείνει ο ίδιος)</span>
              </>
            ) : (
              "Κωδικός"
            )}
          </span>
          <input className="field" type="text" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} required={!user} />
        </label>
        {user && (
          <label className="flex items-center gap-3 text-[14px]">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="size-[18px] accent-[var(--brand)]" />
            Ενεργός (αν το βγάλεις, αποσυνδέεται αμέσως)
          </label>
        )}
      </div>
    </Sheet>
  );
}
