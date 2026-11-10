import type {
  Appointment,
  AppointmentStatus,
  Bay,
  Customer,
  Service,
  ServiceRecord,
  Shop,
  SmsTemplate,
  Vehicle,
  VehicleReminder,
} from "../types";

/*
 * Mock δεδομένα. Οι ημερομηνίες υπολογίζονται σχετικά με τη σημερινή μέρα,
 * ώστε το demo να δείχνει πάντα «ζωντανό». Ο γεννήτορας είναι ντετερμινιστικός
 * (ίδια δεδομένα σε κάθε εκκίνηση).
 */

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}
const rand = rng(20261109);
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
const between = (a: number, b: number) => Math.floor(a + rand() * (b - a + 1));

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function at(dayOffset: number, hour: number, minute = 0) {
  const d = startOfToday();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}
const iso = (d: Date) => d.toISOString();

export const shop: Shop = {
  name: "AutoDiag",
  legalName: "Παπουτσάκης & Κώτσας ΟΕ",
  tagline: "Ηλεκτρολογείο Αυτοκινήτων",
  phone: "210 639 8145",
  email: "autodiag.pk@gmail.com",
  address: "Αθήνα",
  technicians: ["Γ. Παπουτσάκης", "Α. Κώτσας", "Μ. Σαββίδης"],
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

const people = [
  ["Γιώργος Παπαδόπουλος", "6944 123 456"],
  ["Μαρία Κωνσταντίνου", "6973 222 118"],
  ["Νίκος Αλεξίου", "6907 554 210"],
  ["Ελένη Σταθοπούλου", "6945 780 332"],
  ["Δημήτρης Βλάχος", "6932 091 447"],
  ["Κατερίνα Μιχαηλίδου", "6984 615 029"],
  ["Παναγιώτης Ρήγας", "6948 302 776"],
  ["Σοφία Αθανασίου", "6971 448 905"],
  ["Θανάσης Καραγιάννης", "6955 120 683"],
  ["Αγγελική Δημητρίου", "6942 907 314"],
  ["Κώστας Μαυρίδης", "6936 271 590"],
  ["Ιωάννα Πετροπούλου", "6987 033 862"],
  ["Βασίλης Τσακίρης", "6949 516 247"],
  ["Χριστίνα Λαμπράκη", "6978 664 105"],
  ["Μιχάλης Ζαχαρίου", "6905 389 721"],
  ["Ευαγγελία Ντόκου", "6946 852 430"],
  ["Στέλιος Χατζής", "6939 147 068"],
  ["Δέσποινα Γεωργίου", "6982 710 553"],
] as const;

const maleFirst = ["Αντώνης", "Σπύρος", "Χρήστος", "Λευτέρης", "Γιάννης", "Ηλίας", "Μανώλης", "Τάσος", "Φώτης", "Άρης", "Πέτρος", "Σάκης", "Λάμπρος", "Νίκος", "Κυριάκος"];
const maleLast = ["Οικονόμου", "Μακρής", "Αναστασίου", "Ζαφειρίου", "Κουτσός", "Λιάπης", "Πολυχρόνης", "Σιδέρης", "Φραγκιαδάκης", "Χριστοδούλου", "Μπαλτάς", "Ρούσσος"];
const femaleFirst = ["Άννα", "Βάσω", "Γεωργία", "Δήμητρα", "Ειρήνη", "Θεοδώρα", "Λίνα", "Νατάσα", "Ρένα", "Φωτεινή"];
const femaleLast = ["Οικονόμου", "Μακρή", "Αναστασίου", "Κουτσού", "Λιάπη", "Σιδέρη", "Χριστοδούλου", "Ρούσσου", "Παππά", "Τζαννή"];
const extraPeople: [string, string][] = [];
for (let i = 0; i < 46; i++) {
  const female = i % 3 === 1;
  const name = female ? `${pick(femaleFirst)} ${pick(femaleLast)}` : `${pick(maleFirst)} ${pick(maleLast)}`;
  if (extraPeople.some(([n]) => n === name) || people.some(([n]) => n === name)) continue;
  extraPeople.push([name, `69${between(30, 98)} ${between(100, 999)} ${between(100, 999)}`]);
}

export const customers: Customer[] = [...people, ...extraPeople].map(([name, phone], i) => ({
  id: `c${i + 1}`,
  name,
  phone,
  email: i % 3 === 0 ? `${["giorgos", "nikos", "dimitris", "panos", "thanasis", "kostas"][i / 3] ?? "client"}@example.gr` : undefined,
  createdAt: iso(at(-between(40, 900), 10)),
  smsConsent: i !== 6,
  marketingConsent: i % 4 !== 1,
  notes: i === 0 ? "Προτιμά επικοινωνία μετά τις 15:00." : i === 4 ? "Στόλος 2 οχημάτων εταιρείας." : undefined,
}));

const carModels: [string, string, string, Vehicle["fuel"]][] = [
  ["Toyota", "Yaris", "1.0 VVT-i", "Βενζίνη"],
  ["Volkswagen", "Golf VII", "1.6 TDI", "Diesel"],
  ["Peugeot", "208", "1.2 PureTech", "Βενζίνη"],
  ["Opel", "Corsa E", "1.4", "LPG"],
  ["Fiat", "Panda", "1.2", "Βενζίνη"],
  ["Hyundai", "i20", "1.2", "Βενζίνη"],
  ["Toyota", "C-HR", "1.8 Hybrid", "Υβριδικό"],
  ["Nissan", "Qashqai", "1.5 dCi", "Diesel"],
  ["Skoda", "Octavia", "1.6 TDI", "Diesel"],
  ["Citroën", "C3", "1.2 PureTech", "Βενζίνη"],
  ["Suzuki", "Swift", "1.2", "Βενζίνη"],
  ["Kia", "Sportage", "1.6 CRDi", "Diesel"],
  ["Renault", "Clio IV", "0.9 TCe", "Βενζίνη"],
  ["Mercedes-Benz", "A 180", "1.5 d", "Diesel"],
  ["BMW", "Σειρά 1 (F20)", "116d", "Diesel"],
  ["Ford", "Fiesta", "1.0 EcoBoost", "Βενζίνη"],
  ["Mazda", "2", "1.5 Skyactiv", "Βενζίνη"],
  ["Volkswagen", "Polo", "1.0 TSI", "Βενζίνη"],
  ["Tesla", "Model 3", "Long Range", "Ηλεκτρικό"],
  ["Dacia", "Duster", "1.5 dCi", "Diesel"],
  ["Honda", "Jazz", "1.3 i-VTEC", "Βενζίνη"],
  ["Seat", "Ibiza", "1.0 TSI", "Βενζίνη"],
];

// Ελληνικές πινακίδες: μόνο γράμματα που υπάρχουν και στο λατινικό αλφάβητο.
const plateLetters = "ΑΒΕΖΗΙΚΜΝΟΡΤΥΧ";
const prefixes = ["Ι", "Υ", "Ζ", "Ρ", "Η", "Τ", "Χ", "Κ"];
function makePlate() {
  const l = pick(prefixes) + plateLetters[between(0, 13)] + plateLetters[between(0, 13)];
  return `${l}-${between(1000, 9999)}`;
}

export const vehicles: Vehicle[] = [];
customers.forEach((c, i) => {
  const count = i === 4 ? 2 : i === 9 ? 2 : 1;
  for (let k = 0; k < count; k++) {
    const [make, model, engine, fuel] = carModels[(i + k * 7) % carModels.length];
    const year = between(2009, 2023);
    vehicles.push({
      id: `v${vehicles.length + 1}`,
      plate: makePlate(),
      make,
      model,
      engine,
      fuel,
      year,
      vin: rand() > 0.35 ? `WVW${between(100000, 999999)}ZZ${between(10000000, 99999999)}`.slice(0, 17) : undefined,
      ownerId: c.id,
      km: (2026 - year) * between(9000, 17000) + between(0, 9000),
      shareToken: Math.floor(rand() * 2 ** 40).toString(36),
    });
  }
});
// Σταθερή πινακίδα για demo αναζήτησης
vehicles[0].plate = "ΙΚΒ-4821";

const technicians = shop.technicians;

const recordTemplates: Record<string, { title: string; description: string; dtcs?: string[]; items: [string, number][]; labor: number }[]> = {
  diag: [
    { title: "Λυχνία check engine", description: "Ανάγνωση κωδικών. Αστοχία ανάφλεξης στον κύλινδρο 1. Αντικατάσταση πολλαπλασιαστή.", dtcs: ["P0301", "P0300"], items: [["Πολλαπλασιαστής", 68]], labor: 35 },
    { title: "Δεν παίρνει μπροστά", description: "Πτώση τάσης στη μίζα. Οξειδωμένος ακροδέκτης γείωσης. Καθαρισμός και νέα γείωση.", items: [["Καλώδιο γείωσης", 12]], labor: 30 },
    { title: "Λυχνία ABS", description: "Αισθητήρας ABS εμπρός δεξιά εκτός ορίων. Αντικατάσταση αισθητήρα.", dtcs: ["C0035"], items: [["Αισθητήρας ABS", 54]], labor: 40 },
  ],
  ac: [
    { title: "Service A/C", description: "Αναρρόφηση, κενό 30′, έλεγχος διαρροών με UV, πλήρωση R134a 520 g.", items: [["Ψυκτικό υγρό (520 g)", 38], ["Λάδι συμπιεστή", 9]], labor: 25 },
    { title: "Service A/C & φίλτρο καμπίνας", description: "Πλήρης κύκλος service A/C και νέο φίλτρο καμπίνας άνθρακα.", items: [["Ψυκτικό υγρό (480 g)", 35], ["Φίλτρο καμπίνας", 18]], labor: 25 },
  ],
  starter: [
    { title: "Ανακατασκευή δυναμό", description: "Νέος αυτόματος, ψήκτρες και ρουλεμάν. Έλεγχος φόρτισης 14,2 V.", items: [["Αυτόματος δυναμό", 42], ["Ρουλεμάν (2)", 16], ["Ψήκτρες", 8]], labor: 70 },
    { title: "Ανακατασκευή μίζας", description: "Νέο μπεντίξ και πηνία. Δοκιμή εκκίνησης σε κρύο κινητήρα.", items: [["Μπεντίξ", 38], ["Πηνία", 45]], labor: 65 },
  ],
  battery: [
    { title: "Νέα μπαταρία", description: "Μέτρηση CCA 210 A (από 480 A). Τοποθέτηση νέας μπαταρίας και reset συστήματος start-stop.", items: [["Μπαταρία 60Ah 540A", 95]], labor: 0 },
  ],
  lights: [
    { title: "Ρύθμιση φώτων", description: "Έλεγχος και ρύθμιση σκοπευτικής δέσμης για ΚΤΕΟ.", items: [], labor: 15 },
    { title: "Λαμπτήρες LED", description: "Τοποθέτηση LED H7 με canbus decoder. Ρύθμιση δέσμης.", items: [["LED H7 (ζεύγος)", 48]], labor: 20 },
  ],
  windows: [
    { title: "Μοτέρ παραθύρου οδηγού", description: "Καμένο μοτέρ γρύλου. Αντικατάσταση και αρχικοποίηση auto up/down.", items: [["Μοτέρ γρύλου", 72]], labor: 45 },
  ],
  immo: [
    { title: "Προγραμματισμός κλειδιού", description: "Νέο κλειδί με transponder, προγραμματισμός στο immobilizer.", items: [["Κλειδί με transponder", 55]], labor: 40 },
  ],
  service: [
    { title: "Μικρό service", description: "Λάδια 5W-30, φίλτρο λαδιού, φίλτρο αέρα. Έλεγχος μπαταρίας και φώτων.", items: [["Λάδι 5W-30 (4 L)", 36], ["Φίλτρο λαδιού", 9], ["Φίλτρο αέρα", 14]], labor: 25 },
    { title: "Μεγάλο service", description: "Λάδια, όλα τα φίλτρα, μπουζί, υγρά φρένων. Διαγνωστικός έλεγχος.", items: [["Λάδι 5W-30 (4,5 L)", 40], ["Σετ φίλτρων", 46], ["Μπουζί (4)", 32], ["Υγρά φρένων", 12]], labor: 60 },
  ],
};

export const records: ServiceRecord[] = [];
vehicles.forEach((v) => {
  const n = between(1, 5);
  let km = Math.max(5000, v.km - n * between(8000, 15000));
  const days: number[] = [];
  for (let i = 0; i < n; i++) days.push(between(3, 720));
  days.sort((a, b) => b - a);
  days.forEach((d) => {
    const serviceId = pick(Object.keys(recordTemplates));
    const t = pick(recordTemplates[serviceId]);
    km += between(4000, 12000);
    records.push({
      id: `r${records.length + 1}`,
      vehicleId: v.id,
      serviceId,
      date: iso(at(-d, between(9, 15))),
      km: Math.min(km, v.km),
      title: t.title,
      description: t.description,
      dtcs: t.dtcs,
      items: t.items.map(([name, price]) => ({ name, qty: 1, price })),
      labor: t.labor,
      technician: pick(technicians),
    });
  });
});

export const reminders: VehicleReminder[] = [];
vehicles.forEach((v, i) => {
  const lastKm = v.km - between(1000, 14000);
  reminders.push({ id: `rm${reminders.length + 1}`, vehicleId: v.id, kind: "oil", lastKm, dueKm: lastKm + 15000, lastDate: iso(at(-between(60, 320), 10)) });
  reminders.push({ id: `rm${reminders.length + 1}`, vehicleId: v.id, kind: "kteo", dueDate: iso(at(between(-10, 500), 10)) });
  if (i % 2 === 0) reminders.push({ id: `rm${reminders.length + 1}`, vehicleId: v.id, kind: "ac", dueDate: iso(at(between(-30, 300), 10)), lastDate: iso(at(-between(200, 400), 10)) });
  if (i % 3 === 0) reminders.push({ id: `rm${reminders.length + 1}`, vehicleId: v.id, kind: "battery", dueDate: iso(at(between(5, 400), 10)) });
});

/* Ραντεβού: παρελθόν (για αναφορές) + αυτή η εβδομάδα + επόμενες */
export const appointments: Appointment[] = [];
// Ξεχωριστός γεννήτορας, ώστε τα tokens να μην αλλάζουν τα υπόλοιπα mock δεδομένα
const tokenRand = rng(4821);
const mockToken = () => Math.floor(tokenRand() * 2 ** 40).toString(36) + Math.floor(tokenRand() * 2 ** 40).toString(36);
function addAppt(dayOffset: number, hour: number, minute: number, bayId: string, status: AppointmentStatus, vIdx?: number, serviceId?: string) {
  const v = vehicles[vIdx ?? between(0, vehicles.length - 1)];
  const sid = serviceId ?? pick(services).id;
  const s = services.find((x) => x.id === sid)!;
  const start = at(dayOffset, hour, minute);
  const end = new Date(start.getTime() + s.durationMin * 60000);
  appointments.push({
    id: `a${appointments.length + 1}`,
    customerId: v.ownerId,
    vehicleId: v.id,
    serviceId: s.id,
    bayId,
    start: iso(start),
    end: iso(end),
    status,
    source: pick(["online", "online", "phone", "walk_in"] as const),
    reminder: dayOffset < 0 ? "sent" : dayOffset <= 1 ? "sent" : "scheduled",
    token: mockToken(),
    notes:
      s.id === "diag" ? pick(["Ανάβει η λυχνία κινητήρα μετά από 10′ οδήγηση.", "Τρεμοπαίζουν τα φώτα στο ρελαντί.", "Δεν δουλεύει το ταμπλό κατά διαστήματα."]) : undefined,
  });
}

// Παρελθόν: ~6 μήνες για τις αναφορές
for (let d = -180; d < 0; d++) {
  const wd = at(d, 0).getDay();
  if (wd === 0 || wd === 6) continue;
  const n = wd === 6 ? between(1, 3) : between(3, 6);
  const used: Record<string, number> = {};
  for (let k = 0; k < n; k++) {
    const bay = bays[k % bays.length].id;
    const h = (used[bay] ?? 8) + (k >= bays.length ? 2 : 0) + between(0, 1);
    used[bay] = h + 2;
    if (h > 15) continue;
    const r = rand();
    addAppt(d, h, pick([0, 30]), bay, r < 0.86 ? "done" : r < 0.93 ? "no_show" : "cancelled");
  }
}

// Σήμερα: σενάριο για το day board
const nowH = new Date().getHours();
const todayPlan: [number, number, string, string, number][] = [
  [8, 0, "b1", "service", 0],
  [8, 30, "b3", "diag", 3],
  [10, 0, "b2", "ac", 5],
  [10, 0, "b3", "immo", 8],
  [11, 30, "b1", "starter", 2],
  [13, 0, "b2", "battery", 11],
  [13, 30, "b3", "diag", 14],
  [14, 30, "b2", "lights", 7],
  [15, 0, "b1", "windows", 17],
];
todayPlan.forEach(([h, m, bay, svc, v]) => {
  const dur = services.find((s) => s.id === svc)!.durationMin / 60;
  const status: AppointmentStatus = h + dur <= nowH ? "done" : h <= nowH ? "in_progress" : "confirmed";
  addAppt(0, h, m, bay, status, v, svc);
});

// Επόμενες μέρες
for (let d = 1; d <= 21; d++) {
  const wd = at(d, 0).getDay();
  if (wd === 0 || wd === 6) continue;
  const n = wd === 6 ? between(1, 2) : between(2, 5) - Math.floor(d / 8);
  for (let k = 0; k < n; k++) {
    const bay = bays[k % bays.length].id;
    const h = 8 + Math.floor(k / bays.length) * 3 + between(0, 3);
    addAppt(d, h, pick([0, 30]), bay, rand() < 0.25 && d < 8 ? "pending" : "confirmed");
  }
}

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
