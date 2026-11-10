import type { Bay, Service, Shop, SmsTemplate } from "./types";

/*
 * Ρυθμίσεις του συνεργείου που δεν αλλάζουν από την εφαρμογή: στοιχεία,
 * ωράριο, υπηρεσίες, θέσεις, πρότυπα SMS. Τα δεδομένα που αλλάζουν
 * (πελάτες, οχήματα, ραντεβού, βιβλιάρια) είναι στο Neon (src/lib/db.ts).
 */

export const shop: Shop = {
  name: "AutoDiag",
  legalName: "Παπουτσάκης & Κώτσας ΟΕ",
  tagline: "Ηλεκτρολογείο Αυτοκινήτων",
  phone: "210 639 8145",
  email: "autodiag.pk@gmail.com",
  address: "Αθήνα",
  technicians: ["Μ. Παπουτσάκης", "Δ. Κώτσας", "Ν. Σαββίδης"],
  hours: [
    { day: 1, open: "08:00", close: "17:00" },
    { day: 2, open: "08:00", close: "17:00" },
    { day: 3, open: "08:00", close: "17:00" },
    { day: 4, open: "08:00", close: "17:00" },
    { day: 5, open: "08:00", close: "17:00" },
    { day: 6 },
    { day: 0 },
  ],
};

export const services: Service[] = [
  {
    id: "diag",
    name: "Διάγνωση βλαβών",
    category: "diagnostics",
    description: "Διαγνωστικός έλεγχος με σύγχρονα μηχανήματα, από αναμμένη λυχνία μέχρι καμένη ασφάλεια.",
    durationMin: 60,
    priceFrom: 30,
    requiresApproval: false,
  },
  {
    id: "immo",
    name: "Immobilizer & κλειδιά",
    category: "diagnostics",
    description: "Προγραμματισμός κλειδιών, βλάβες immobilizer και κεντρικού κλειδώματος.",
    durationMin: 90,
    requiresApproval: true,
  },
  {
    id: "ac",
    name: "Service A/C – Καλοριφέρ",
    category: "ac",
    description: "Αναρρόφηση φρέον, λάδια συμπιεστή, κενό, έλεγχος διαρροών και νέα πλήρωση.",
    durationMin: 60,
    priceFrom: 45,
    requiresApproval: false,
  },
  {
    id: "starter",
    name: "Μίζα – Δυναμό",
    category: "starter",
    description: "Έλεγχος φόρτισης, επισκευή ή ανακατασκευή μίζας και δυναμό.",
    durationMin: 120,
    requiresApproval: true,
  },
  {
    id: "battery",
    name: "Μπαταρία",
    category: "battery",
    description: "Έλεγχος και αντικατάσταση μπαταρίας με δωρεάν τοποθέτηση.",
    durationMin: 30,
    priceFrom: 0,
    requiresApproval: false,
  },
  {
    id: "lights",
    name: "Φωτισμός, LED & Xenon",
    category: "lighting",
    description: "Έλεγχος και ρύθμιση φώτων, τοποθέτηση λαμπτήρων LED και Xenon.",
    durationMin: 45,
    priceFrom: 15,
    requiresApproval: false,
  },
  {
    id: "windows",
    name: "Παράθυρα & κλειδαριές",
    category: "comfort",
    description: "Γρύλοι, μοτέρ παραθύρων, κλειδαριές και κεντρικό κλείδωμα.",
    durationMin: 90,
    requiresApproval: true,
  },
  {
    id: "service",
    name: "Service",
    category: "service",
    description: "Περιοδικό service με λάδια, φίλτρα και έλεγχο ηλεκτρικού συστήματος.",
    durationMin: 90,
    priceFrom: 70,
    requiresApproval: false,
  },
];

export const bays: Bay[] = [
  { id: "b1", name: "Θέση 1" },
  { id: "b2", name: "Θέση 2" },
  { id: "b3", name: "Διαγνωστικό" },
];

export const smsTemplates: SmsTemplate[] = [
  {
    id: "confirm",
    name: "Επιβεβαίωση ραντεβού",
    when: "Μόλις επιβεβαιωθεί το ραντεβού",
    body: "AutoDiag: Το ραντεβού σας για {υπηρεσία} κλείστηκε για {ημέρα} στις {ώρα}. Αλλαγή ή ακύρωση: {σύνδεσμος}",
    enabled: true,
  },
  {
    id: "reminder",
    name: "Υπενθύμιση",
    when: "24 ώρες πριν",
    body: "AutoDiag: Σας περιμένουμε αύριο στις {ώρα} για {υπηρεσία} ({πινακίδα}). Αλλαγή ή ακύρωση: {σύνδεσμος}",
    enabled: true,
  },
  {
    id: "ready",
    name: "Το όχημα είναι έτοιμο",
    when: "Όταν ολοκληρωθεί η εργασία",
    body: "AutoDiag: Το {πινακίδα} είναι έτοιμο για παραλαβή. Ωράριο έως {κλείσιμο}.",
    enabled: true,
  },
  {
    id: "service_due",
    name: "Υπενθύμιση service",
    when: "15 μέρες πριν τη λήξη",
    body: "AutoDiag: Πλησιάζει {εργασία} για το {πινακίδα}. Κλείστε ραντεβού: autodiag.gr/book",
    enabled: false,
  },
];
