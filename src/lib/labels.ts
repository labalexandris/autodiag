import type { AppointmentSource, AppointmentStatus, ReminderKind } from "./types";

/*
 * Οι καταστάσεις ακολουθούν τον χρωματικό κώδικα των ασφαλειών (blade fuses):
 * 20A κίτρινη, 15A μπλε, 40A πορτοκαλί, 30A πράσινη, 10A κόκκινη.
 */
export const statusMeta: Record<AppointmentStatus, { label: string; fuse: string; amp: string }> = {
  pending: { label: "Προς έγκριση", fuse: "var(--fuse-yellow)", amp: "20" },
  confirmed: { label: "Επιβεβαιωμένο", fuse: "var(--fuse-blue)", amp: "15" },
  in_progress: { label: "Σε εξέλιξη", fuse: "var(--fuse-orange)", amp: "40" },
  done: { label: "Ολοκληρώθηκε", fuse: "var(--fuse-green)", amp: "30" },
  no_show: { label: "Δεν ήρθε", fuse: "var(--fuse-red)", amp: "10" },
  cancelled: { label: "Ακυρώθηκε", fuse: "var(--fuse-grey)", amp: "—" },
};

export const sourceLabel: Record<AppointmentSource, string> = {
  online: "Online",
  phone: "Τηλέφωνο",
  walk_in: "Επί τόπου",
};

export const reminderLabel: Record<ReminderKind, string> = {
  oil: "Αλλαγή λαδιών",
  kteo: "ΚΤΕΟ",
  ac: "Service A/C",
  battery: "Έλεγχος μπαταρίας",
  timing: "Ιμάντας χρονισμού",
};
