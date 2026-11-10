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

/**
 * Χρώμα ανά εργασία, για να ξεχωρίζει με μια ματιά στο ημερολόγιο.
 * Σκούρο κείμενο πάνω σε απαλό φόντο του ίδιου χρώματος (αντίθεση ≥ 4,5:1).
 */
export const serviceColor: Record<string, { fg: string; bg: string }> = {
  diag: { fg: "#5b3db5", bg: "#efeafc" },
  immo: { fg: "#0f6b63", bg: "#e2f4f1" },
  ac: { fg: "#0369a1", bg: "#e0f2fe" },
  starter: { fg: "#b4400d", bg: "#fdeee4" },
  battery: { fg: "#15703a", bg: "#e5f5ea" },
  lights: { fg: "#8a5a00", bg: "#fbf1d6" },
  windows: { fg: "#a8195a", bg: "#fce8f1" },
  service: { fg: "#1d4fb8", bg: "#e6edfb" },
};
export const serviceColorOf = (id: string) => serviceColor[id] ?? { fg: "var(--ink-2)", bg: "var(--sunk)" };
