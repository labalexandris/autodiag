import type { Appointment, AppointmentSource, AppointmentStatus, Customer, Fuel, ServiceRecord, Vehicle, VehicleReminder } from "../types";
import { bays, services, shop } from "../config";
import { dayHours } from "../hours";

/*
 * Ψεύτικα αλλά ρεαλιστικά δεδομένα για demo, σχετικά με τη μέρα που
 * τρέχει: ένας χρόνος ιστορικού (για αναφορές και βιβλιάρια), το σημερινό
 * πρόγραμμα και τέσσερις εβδομάδες μπροστά. Οι εργασίες του παρελθόντος
 * είναι δεμένες με εγγραφές στο βιβλιάριο και τα χιλιόμετρα ανεβαίνουν
 * λογικά. Ντετερμινιστικό για τα δεδομένα, τυχαίο μόνο για τα tokens.
 */

export interface DemoData {
  customers: Customer[];
  vehicles: Vehicle[];
  appointments: Appointment[];
  records: ServiceRecord[];
  reminders: VehicleReminder[];
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

const token = () => crypto.randomUUID().replace(/-/g, "");

export function generateDemo(now = new Date()): DemoData {
  const rand = rng(20261110);
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
  const between = (a: number, b: number) => Math.floor(a + rand() * (b - a + 1));
  const chance = (p: number) => rand() < p;
  const weighted = <T,>(items: [T, number][]) => {
    const total = items.reduce((s, [, w]) => s + w, 0);
    let r = rand() * total;
    for (const [v, w] of items) if ((r -= w) <= 0) return v;
    return items[items.length - 1][0];
  };

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const at = (dayOffset: number, minutes = 10 * 60) => {
    const d = new Date(today);
    d.setDate(d.getDate() + dayOffset);
    d.setMinutes(minutes);
    return d;
  };
  const iso = (d: Date) => d.toISOString();

  /* ---------- Πελάτες ---------- */

  const maleFirst = ["Γιώργος", "Νίκος", "Δημήτρης", "Κώστας", "Γιάννης", "Παναγιώτης", "Βασίλης", "Χρήστος", "Αντώνης", "Θανάσης", "Μιχάλης", "Σπύρος", "Στέλιος", "Λευτέρης", "Ηλίας", "Μανώλης", "Τάσος", "Φώτης", "Άρης", "Πέτρος", "Λάμπρος", "Κυριάκος", "Σταύρος", "Αλέξανδρος", "Θοδωρής", "Μάρκος", "Παύλος", "Ορέστης"];
  const maleLast = ["Παπαδόπουλος", "Οικονόμου", "Μακρής", "Αναστασίου", "Ζαφειρίου", "Κουτσός", "Λιάπης", "Πολυχρόνης", "Σιδέρης", "Φραγκιαδάκης", "Χριστοδούλου", "Μπαλτάς", "Ρούσσος", "Αλεξίου", "Βλάχος", "Ρήγας", "Καραγιάννης", "Μαυρίδης", "Τσακίρης", "Ζαχαρίου", "Χατζής", "Γεωργίου", "Νικολάου", "Δημητρίου", "Αθανασίου", "Πετρόπουλος", "Κωνσταντίνου", "Σταθόπουλος", "Μιχαηλίδης", "Λαμπράκης", "Καλλέργης", "Ξενάκης", "Τζαννετάκης", "Μαρκόπουλος"];
  const femaleFirst = ["Μαρία", "Ελένη", "Κατερίνα", "Σοφία", "Αγγελική", "Ιωάννα", "Χριστίνα", "Ευαγγελία", "Δέσποινα", "Άννα", "Βάσω", "Γεωργία", "Δήμητρα", "Ειρήνη", "Θεοδώρα", "Λίνα", "Νατάσα", "Ρένα", "Φωτεινή", "Αλεξάνδρα", "Μυρτώ", "Στέλλα", "Κωνσταντίνα"];
  const femaleLast = ["Παπαδοπούλου", "Οικονόμου", "Μακρή", "Αναστασίου", "Κουτσού", "Λιάπη", "Σιδέρη", "Χριστοδούλου", "Ρούσσου", "Παππά", "Τζαννή", "Αλεξίου", "Βλάχου", "Καραγιάννη", "Μαυρίδου", "Ζαχαρίου", "Γεωργίου", "Νικολάου", "Δημητρίου", "Αθανασίου", "Πετροπούλου", "Κωνσταντίνου", "Σταθοπούλου", "Μιχαηλίδου", "Λαμπράκη", "Ξενάκη"];
  const latin: Record<string, string> = {
    Γιώργος: "giorgos", Νίκος: "nikos", Δημήτρης: "dimitris", Κώστας: "kostas", Γιάννης: "giannis", Μαρία: "maria", Ελένη: "eleni", Κατερίνα: "katerina", Σοφία: "sofia", Χρήστος: "christos", Αντώνης: "antonis", Άννα: "anna", Ειρήνη: "eirini", Πέτρος: "petros", Στέλλα: "stella",
  };
  const domains = ["gmail.com", "gmail.com", "gmail.com", "yahoo.gr", "hotmail.com", "otenet.gr"];

  const companies: { name: string; fleet: number; note: string }[] = [
    { name: "Courier Express ΙΚΕ", fleet: 5, note: "Εταιρικός στόλος. Τιμολόγιο στο ΑΦΜ της εταιρείας." },
    { name: "Ταξί Γλυφάδας – Ρ. Μπαλτάς", fleet: 3, note: "Ταξί: προτεραιότητα, δουλεύει βάρδιες." },
    { name: "Ανθοπωλείο Λιάπη", fleet: 2, note: "Van διανομών. Προτιμά πρωινά ραντεβού." },
    { name: "Τεχνική Κατασκευαστική ΑΕ", fleet: 4, note: "Στόλος εργοταξίου. Επικοινωνία με τον κ. Σιδέρη." },
  ];

  const customers: Customer[] = [];
  const usedPhones = new Set<string>();
  const usedNames = new Set<string>();
  const phone = () => {
    let p: string;
    do p = `69${between(30, 98)} ${between(100, 999)} ${between(100, 999)}`;
    while (usedPhones.has(p));
    usedPhones.add(p);
    return p;
  };
  const customerNotes = [
    "Προτιμά επικοινωνία μετά τις 15:00.",
    "Θέλει πάντα προσφορά πριν την επισκευή.",
    "Φέρνει δικά του ανταλλακτικά κάποιες φορές.",
    "Πληρώνει με κάρτα.",
    "Παλιός πελάτης, από το 2015.",
    "Χρειάζεται αυτοκίνητο αντικατάστασης για μεγάλες δουλειές.",
    "Ενημέρωση μόνο με SMS, όχι κλήσεις στη δουλειά.",
  ];

  for (const c of companies) {
    customers.push({
      id: `c${customers.length + 1}`,
      name: c.name,
      phone: `210 ${between(400, 999)} ${between(1000, 9999)}`,
      email: `info@${["courierexpress", "taxi-glyfada", "liapis-flowers", "texniki-ae"][customers.length]}.gr`,
      createdAt: "",
      smsConsent: true,
      marketingConsent: false,
      notes: c.note,
    });
  }
  while (customers.length < 150) {
    const female = chance(0.38);
    const first = female ? pick(femaleFirst) : pick(maleFirst);
    const last = female ? pick(femaleLast) : pick(maleLast);
    const name = `${first} ${last}`;
    if (usedNames.has(name)) continue;
    usedNames.add(name);
    const l = latin[first];
    customers.push({
      id: `c${customers.length + 1}`,
      name,
      phone: phone(),
      email: l && chance(0.6) ? `${l}.${between(70, 99)}@${pick(domains)}` : chance(0.15) ? `client${customers.length}@${pick(domains)}` : undefined,
      createdAt: "",
      smsConsent: chance(0.93),
      marketingConsent: chance(0.65),
      notes: chance(0.12) ? pick(customerNotes) : undefined,
    });
  }

  /* ---------- Οχήματα ---------- */

  type Model = [make: string, model: string, engine: string, fuel: Fuel, fromYear: number, toYear: number, wmi: string];
  const models: Model[] = [
    ["Toyota", "Yaris", "1.0 VVT-i", "Βενζίνη", 2008, 2020, "VNK"],
    ["Toyota", "Yaris Hybrid", "1.5 Hybrid", "Υβριδικό", 2014, 2024, "VNK"],
    ["Toyota", "Corolla", "1.8 Hybrid", "Υβριδικό", 2019, 2024, "SB1"],
    ["Toyota", "C-HR", "1.8 Hybrid", "Υβριδικό", 2017, 2024, "NMT"],
    ["Toyota", "Aygo", "1.0", "Βενζίνη", 2010, 2021, "JTD"],
    ["Volkswagen", "Golf VII", "1.6 TDI", "Diesel", 2013, 2019, "WVW"],
    ["Volkswagen", "Golf VIII", "1.5 eTSI", "Βενζίνη", 2020, 2024, "WVW"],
    ["Volkswagen", "Polo", "1.0 TSI", "Βενζίνη", 2014, 2024, "WVW"],
    ["Volkswagen", "Caddy", "2.0 TDI", "Diesel", 2012, 2022, "WV1"],
    ["Peugeot", "208", "1.2 PureTech", "Βενζίνη", 2013, 2024, "VF3"],
    ["Peugeot", "308", "1.6 BlueHDi", "Diesel", 2014, 2021, "VF3"],
    ["Peugeot", "2008", "1.2 PureTech", "Βενζίνη", 2016, 2024, "VF3"],
    ["Opel", "Corsa E", "1.4", "LPG", 2015, 2019, "W0L"],
    ["Opel", "Astra K", "1.6 CDTI", "Diesel", 2016, 2021, "W0L"],
    ["Fiat", "Panda", "1.2", "Βενζίνη", 2008, 2024, "ZFA"],
    ["Fiat", "500", "1.2", "Βενζίνη", 2009, 2022, "ZFA"],
    ["Fiat", "Doblo", "1.6 Multijet", "Diesel", 2011, 2021, "ZFA"],
    ["Hyundai", "i20", "1.2", "Βενζίνη", 2012, 2024, "NLH"],
    ["Hyundai", "i10", "1.0", "Βενζίνη", 2011, 2023, "MAL"],
    ["Hyundai", "Tucson", "1.6 CRDi", "Diesel", 2016, 2023, "TMA"],
    ["Kia", "Picanto", "1.0", "Βενζίνη", 2011, 2023, "KNA"],
    ["Kia", "Sportage", "1.6 CRDi", "Diesel", 2016, 2023, "U5Y"],
    ["Nissan", "Qashqai", "1.5 dCi", "Diesel", 2014, 2021, "SJN"],
    ["Nissan", "Micra", "1.0", "Βενζίνη", 2011, 2022, "VNV"],
    ["Skoda", "Octavia", "1.6 TDI", "Diesel", 2013, 2021, "TMB"],
    ["Skoda", "Fabia", "1.0 TSI", "Βενζίνη", 2015, 2024, "TMB"],
    ["Citroën", "C3", "1.2 PureTech", "Βενζίνη", 2013, 2024, "VF7"],
    ["Citroën", "Berlingo", "1.6 HDi", "Diesel", 2010, 2020, "VF7"],
    ["Suzuki", "Swift", "1.2", "Βενζίνη", 2011, 2024, "TSM"],
    ["Suzuki", "Vitara", "1.6", "Βενζίνη", 2015, 2023, "TSM"],
    ["Renault", "Clio IV", "0.9 TCe", "Βενζίνη", 2013, 2019, "VF1"],
    ["Renault", "Captur", "1.5 dCi", "Diesel", 2014, 2022, "VF1"],
    ["Dacia", "Duster", "1.5 dCi", "Diesel", 2012, 2024, "UU1"],
    ["Dacia", "Sandero", "1.0 LPG", "LPG", 2014, 2024, "UU1"],
    ["Mercedes-Benz", "A 180", "1.5 d", "Diesel", 2013, 2022, "WDD"],
    ["Mercedes-Benz", "Vito", "2.2 CDI", "Diesel", 2012, 2022, "WDF"],
    ["BMW", "Σειρά 1 (F20)", "116d", "Diesel", 2012, 2019, "WBA"],
    ["BMW", "Σειρά 3 (F30)", "318d", "Diesel", 2012, 2019, "WBA"],
    ["Ford", "Fiesta", "1.0 EcoBoost", "Βενζίνη", 2013, 2022, "WF0"],
    ["Ford", "Transit Custom", "2.0 TDCi", "Diesel", 2014, 2023, "WF0"],
    ["Mazda", "2", "1.5 Skyactiv", "Βενζίνη", 2015, 2024, "JMZ"],
    ["Honda", "Jazz", "1.3 i-VTEC", "Βενζίνη", 2009, 2020, "JHM"],
    ["Seat", "Ibiza", "1.0 TSI", "Βενζίνη", 2014, 2024, "VSS"],
    ["Mini", "Cooper", "1.5", "Βενζίνη", 2014, 2023, "WMW"],
    ["Tesla", "Model 3", "Long Range", "Ηλεκτρικό", 2019, 2024, "5YJ"],
  ];
  const vans = models.filter((m) => /Caddy|Doblo|Berlingo|Vito|Transit/.test(m[1]));

  const plateLetters = "ΑΒΕΖΗΙΚΜΝΟΡΤΥΧ";
  const prefixes = ["Ι", "Υ", "Ζ", "Ρ", "Η", "Τ", "Χ", "Κ", "Ι", "Υ"];
  const usedPlates = new Set<string>();
  const makePlate = () => {
    let p: string;
    do p = `${pick(prefixes)}${plateLetters[between(0, 13)]}${plateLetters[between(0, 13)]}-${between(1000, 9999)}`;
    while (usedPlates.has(p));
    usedPlates.add(p);
    return p;
  };
  const vinChars = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789";
  const makeVin = (wmi: string) => wmi + Array.from({ length: 14 }, () => vinChars[between(0, vinChars.length - 1)]).join("");

  const vehicles: Vehicle[] = [];
  /** Χιλιόμετρα ανά ημέρα για κάθε όχημα, για λογική εξέλιξη στο βιβλιάριο */
  const dailyKm = new Map<string, number>();
  const nowYear = now.getFullYear();
  customers.forEach((c, i) => {
    const company = companies[i];
    const count = company ? company.fleet : chance(0.12) ? 2 : 1;
    for (let k = 0; k < count; k++) {
      const m = company && k < 2 && i !== 1 ? pick(vans) : pick(models);
      const [make, model, engine, fuel, from, to, wmi] = m;
      const year = between(from, Math.min(to, nowYear));
      const perDay = company ? between(70, 160) : fuel === "Diesel" ? between(35, 70) : between(20, 45);
      const id = `v${vehicles.length + 1}`;
      dailyKm.set(id, perDay);
      const age = Math.max(0.3, nowYear - year + 0.5);
      vehicles.push({
        id,
        plate: makePlate(),
        make,
        model,
        engine,
        fuel,
        year: chance(0.92) ? year : undefined,
        vin: chance(0.7) ? makeVin(wmi) : undefined,
        ownerId: c.id,
        km: Math.round((age * 365 * perDay) / 100) * 100 + between(0, 99),
        shareToken: token(),
      });
    }
  });
  // Σταθερή πινακίδα για να δείχνεις την αναζήτηση στο demo
  usedPlates.delete(vehicles[4].plate);
  vehicles[4].plate = "ΙΚΒ-4821";

  /** Χιλιόμετρα του οχήματος σε μια ημερομηνία του παρελθόντος */
  const kmAt = (v: Vehicle, d: Date) => {
    const days = (now.getTime() - d.getTime()) / 86400000;
    return Math.max(500, Math.round(v.km - days * dailyKm.get(v.id)!));
  };

  /* ---------- Πρότυπα εργασιών ---------- */

  type Tpl = { title: string; description: string; dtcs?: string[]; items: [string, number, number?][]; labor: number };
  const tpl: Record<string, Tpl[]> = {
    diag: [
      { title: "Λυχνία check engine", description: "Ανάγνωση κωδικών: αστοχία ανάφλεξης στον κύλινδρο 1. Αντικατάσταση πολλαπλασιαστή, σβήσιμο κωδικών, δοκιμή.", dtcs: ["P0301", "P0300"], items: [["Πολλαπλασιαστής", 68]], labor: 35 },
      { title: "Δεν παίρνει μπροστά", description: "Πτώση τάσης στη μίζα. Οξειδωμένος ακροδέκτης γείωσης κινητήρα. Καθαρισμός και νέο καλώδιο γείωσης.", items: [["Καλώδιο γείωσης", 12]], labor: 30 },
      { title: "Λυχνία ABS", description: "Αισθητήρας ABS εμπρός δεξιά εκτός ορίων. Αντικατάσταση αισθητήρα, έλεγχος καλωδίωσης.", dtcs: ["C0035"], items: [["Αισθητήρας ABS", 54]], labor: 40 },
      { title: "Αισθητήρας λάμδα", description: "Αργή απόκριση αισθητήρα οξυγόνου πριν τον καταλύτη. Αντικατάσταση και έλεγχος καυσίμου.", dtcs: ["P0133"], items: [["Αισθητήρας λάμδα", 89]], labor: 35 },
      { title: "Βαλβίδα EGR", description: "Ανεπαρκής ροή EGR. Καθαρισμός βαλβίδας και πολλαπλής, προσαρμογή με διαγνωστικό.", dtcs: ["P0401"], items: [["Σπρέι καθαρισμού", 9], ["Φλάντζα EGR", 7]], labor: 70 },
      { title: "Λυχνία αερόσακου", description: "Ανοιχτό κύκλωμα στο σπιράλ τιμονιού. Αντικατάσταση σπιράλ και σβήσιμο κωδικών.", dtcs: ["B0001"], items: [["Σπιράλ τιμονιού", 62]], labor: 45 },
      { title: "Διαρροή ρεύματος", description: "Αδειάζει η μπαταρία σε 3 μέρες. Διαρροή 380 mA από το ρελέ του ηχοσυστήματος. Αντικατάσταση ρελέ.", items: [["Ρελέ", 14]], labor: 50 },
      { title: "Αισθητήρας στροφάλου", description: "Σβήνει εν κινήσει. Διακοπτόμενο σήμα αισθητήρα στροφάλου. Αντικατάσταση.", dtcs: ["P0335"], items: [["Αισθητήρας στροφάλου", 46]], labor: 40 },
      { title: "Μπεκ AdBlue", description: "Μειωμένη απόδοση: σφάλμα δοσομέτρησης AdBlue. Καθαρισμός μπεκ και αρχικοποίηση.", dtcs: ["P20EE"], items: [], labor: 60 },
      { title: "Διαγνωστικός έλεγχος", description: "Πλήρες scan όλων των μονάδων πριν από αγορά μεταχειρισμένου. Χωρίς ενεργά σφάλματα.", items: [], labor: 30 },
    ],
    ac: [
      { title: "Service A/C", description: "Αναρρόφηση, κενό 30′, έλεγχος διαρροών με UV, πλήρωση R134a 520 g.", items: [["Ψυκτικό υγρό R134a (520 g)", 38], ["Λάδι συμπιεστή", 9]], labor: 25 },
      { title: "Service A/C & φίλτρο καμπίνας", description: "Πλήρης κύκλος service A/C και νέο φίλτρο καμπίνας άνθρακα.", items: [["Ψυκτικό υγρό (480 g)", 35], ["Φίλτρο καμπίνας", 18]], labor: 25 },
      { title: "Service A/C R1234yf", description: "Πλήρωση με R1234yf 450 g, έλεγχος πιέσεων και θερμοκρασίας εξόδου 6 °C.", items: [["Ψυκτικό R1234yf (450 g)", 85], ["Λάδι PAG", 12]], labor: 30 },
      { title: "Διαρροή στο ψυγείο A/C", description: "Διαρροή στο συμπυκνωτή από πέτρα. Αντικατάσταση συμπυκνωτή, κενό και πλήρωση.", items: [["Συμπυκνωτής A/C", 145], ["Ψυκτικό υγρό", 38], ["O-rings", 6]], labor: 90 },
      { title: "Βεντιλατέρ καλοριφέρ", description: "Δουλεύει μόνο στη 4η ταχύτητα. Καμένη αντίσταση βεντιλατέρ, αντικατάσταση.", items: [["Αντίσταση βεντιλατέρ", 32]], labor: 30 },
    ],
    starter: [
      { title: "Ανακατασκευή δυναμό", description: "Νέος αυτόματος, ψήκτρες και ρουλεμάν. Έλεγχος φόρτισης 14,2 V.", items: [["Αυτόματος δυναμό", 42], ["Ρουλεμάν (2)", 16], ["Ψήκτρες", 8]], labor: 70 },
      { title: "Ανακατασκευή μίζας", description: "Νέο μπεντίξ και πηνία. Δοκιμή εκκίνησης σε κρύο κινητήρα.", items: [["Μπεντίξ", 38], ["Πηνία", 45]], labor: 65 },
      { title: "Νέος δυναμό", description: "Κομμένα τυλίγματα στάτη. Τοποθέτηση νέου δυναμό και ιμάντα.", items: [["Δυναμό", 210], ["Ιμάντας poly-V", 22]], labor: 60 },
      { title: "Τροχαλία δυναμό", description: "Θόρυβος στο ρελαντί: φθαρμένη ελεύθερη τροχαλία δυναμό. Αντικατάσταση.", items: [["Τροχαλία δυναμό", 58]], labor: 45 },
    ],
    battery: [
      { title: "Νέα μπαταρία", description: "Μέτρηση CCA 210 A (από 480 A). Νέα μπαταρία και reset συστήματος start-stop.", items: [["Μπαταρία 60Ah 540A", 95]], labor: 0 },
      { title: "Μπαταρία AGM", description: "Αυτοκίνητο με start-stop: τοποθέτηση AGM 70Ah και καταχώρηση στη μονάδα BMS.", items: [["Μπαταρία AGM 70Ah 760A", 185]], labor: 15 },
      { title: "Έλεγχος μπαταρίας", description: "Έλεγχος μπαταρίας και φόρτισης. Μπαταρία σε καλή κατάσταση, φόρτιση 14,1 V.", items: [], labor: 0 },
    ],
    lights: [
      { title: "Ρύθμιση φώτων", description: "Έλεγχος και ρύθμιση σκοπευτικής δέσμης για ΚΤΕΟ.", items: [], labor: 15 },
      { title: "Λαμπτήρες LED", description: "Τοποθέτηση LED H7 με canbus decoder. Ρύθμιση δέσμης.", items: [["LED H7 (ζεύγος)", 48]], labor: 20 },
      { title: "Xenon", description: "Αναβοσβήνει το αριστερό φανάρι. Νέα λάμπα D1S και έλεγχος ballast.", items: [["Λάμπα Xenon D1S", 65]], labor: 25 },
      { title: "Φώτα ομίχλης", description: "Δεν ανάβουν τα φώτα ομίχλης: καμένη ασφάλεια και οξειδωμένο φις. Επισκευή.", items: [["Ασφάλεια 15A", 1], ["Φις", 8]], labor: 25 },
    ],
    windows: [
      { title: "Μοτέρ παραθύρου οδηγού", description: "Καμένο μοτέρ γρύλου. Αντικατάσταση και αρχικοποίηση auto up/down.", items: [["Μοτέρ γρύλου", 72]], labor: 45 },
      { title: "Γρύλος παραθύρου", description: "Κομμένο συρματόσχοινο γρύλου εμπρός δεξιά. Νέος γρύλος.", items: [["Γρύλος παραθύρου", 58]], labor: 50 },
      { title: "Κεντρικό κλείδωμα", description: "Δεν κλειδώνει η πόρτα συνοδηγού. Νέα κλειδαριά με μοτέρ.", items: [["Κλειδαριά πόρτας", 85]], labor: 55 },
      { title: "Διακόπτης παραθύρων", description: "Δεν δουλεύουν τα πίσω παράθυρα από τον οδηγό. Νέος κεντρικός διακόπτης.", items: [["Διακόπτης παραθύρων", 46]], labor: 20 },
    ],
    immo: [
      { title: "Προγραμματισμός κλειδιού", description: "Νέο κλειδί με transponder, προγραμματισμός στο immobilizer.", items: [["Κλειδί με transponder", 55]], labor: 40 },
      { title: "Κλειδί keyless", description: "Χαμένο κλειδί keyless. Νέο κλειδί, διαγραφή του παλιού από τη μονάδα.", items: [["Κλειδί keyless", 165]], labor: 60 },
      { title: "Μπαταρία τηλεχειριστηρίου", description: "Δεν ανοίγει από απόσταση. Νέα μπαταρία CR2032 και συγχρονισμός.", items: [["Μπαταρία CR2032", 3]], labor: 5 },
    ],
    service: [
      { title: "Μικρό service", description: "Λάδια 5W-30, φίλτρο λαδιού, φίλτρο αέρα. Έλεγχος μπαταρίας και φώτων.", items: [["Λάδι 5W-30 (4 L)", 36], ["Φίλτρο λαδιού", 9], ["Φίλτρο αέρα", 14]], labor: 25 },
      { title: "Μεγάλο service", description: "Λάδια, όλα τα φίλτρα, μπουζί, υγρά φρένων. Διαγνωστικός έλεγχος.", items: [["Λάδι 5W-30 (4,5 L)", 40], ["Σετ φίλτρων", 46], ["Μπουζί (4)", 32], ["Υγρά φρένων", 12]], labor: 60 },
      { title: "Service diesel", description: "Λάδια 5W-30 C3, φίλτρο λαδιού, πετρελαίου και καμπίνας. Reset υπενθύμισης.", items: [["Λάδι 5W-30 C3 (5 L)", 48], ["Φίλτρο λαδιού", 11], ["Φίλτρο πετρελαίου", 29], ["Φίλτρο καμπίνας", 16]], labor: 35 },
      { title: "Service υβριδικού", description: "Λάδια 0W-16, φίλτρα και έλεγχος υβριδικής μπαταρίας και ψύξης inverter.", items: [["Λάδι 0W-16 (4 L)", 44], ["Φίλτρο λαδιού", 12], ["Φίλτρο αέρα", 18]], labor: 40 },
    ],
  };
  const notesFor: Record<string, string[]> = {
    diag: ["Ανάβει η λυχνία κινητήρα μετά από 10′ οδήγηση.", "Τρεμοπαίζουν τα φώτα στο ρελαντί.", "Δεν δουλεύει το ταμπλό κατά διαστήματα.", "Κόβει όταν πατάω γκάζι.", "Αδειάζει η μπαταρία αν μείνει 2-3 μέρες.", "Βγάζει μήνυμα «Μειωμένη απόδοση»."],
    ac: ["Δεν κρυώνει καλά.", "Μυρίζει μούχλα όταν ανοίγω το A/C.", "Βγάζει ζεστό αέρα στη μία πλευρά."],
    starter: ["Δυσκολεύεται να πάρει μπροστά τα πρωινά.", "Ανάβει η λυχνία μπαταρίας ενώ οδηγώ.", "Κάνει «κλικ» και δεν γυρίζει η μίζα."],
    battery: ["Το πρωί δεν πήρε μπροστά.", "Η μπαταρία είναι 5 ετών."],
    lights: ["Για ΚΤΕΟ.", "Θέλω LED στα μεσαία."],
    windows: ["Το παράθυρο του οδηγού κατεβαίνει αργά.", "Δεν κλειδώνει η πίσω πόρτα."],
    immo: ["Θέλω ένα εφεδρικό κλειδί.", "Έχασα το ένα κλειδί."],
    service: ["Πέρασε τα 15.000 από το προηγούμενο.", "Πριν τις διακοπές."],
  };

  const vary = (price: number) => Math.round(price * (0.9 + rand() * 0.25));
  const technicians = shop.technicians;
  const serviceById = Object.fromEntries(services.map((s) => [s.id, s]));

  /** Ποια υπηρεσία, ανάλογα με τον μήνα (A/C το καλοκαίρι, μπαταρίες τον χειμώνα) */
  const pickService = (d: Date) => {
    const m = d.getMonth();
    const summer = m >= 4 && m <= 8;
    const winter = m === 11 || m <= 1;
    return weighted<string>([
      ["diag", 22],
      ["service", 20],
      ["ac", summer ? 26 : 4],
      ["battery", winter ? 18 : 6],
      ["starter", winter ? 10 : 6],
      ["lights", 7],
      ["windows", 5],
      ["immo", 4],
    ]);
  };
  const pickTpl = (serviceId: string, v: Vehicle) => {
    const list = tpl[serviceId];
    if (serviceId === "service") {
      if (v.fuel === "Diesel") return list[2];
      if (v.fuel === "Υβριδικό") return list[3];
      return chance(0.7) ? list[0] : list[1];
    }
    if (serviceId === "ac") return v.year && v.year >= 2017 && chance(0.5) ? list[2] : pick(list.filter((_, i) => i !== 2));
    return pick(list);
  };

  /** Πιστοί πελάτες έρχονται πιο συχνά: βάρη ανά όχημα */
  const vehicleWeight = vehicles.map((v, i) => (i < 13 ? 5 : chance(0.25) ? 3 : 1) as number);
  const totalW = vehicleWeight.reduce((a, b) => a + b, 0);
  const pickVehicle = () => {
    let r = rand() * totalW;
    for (let i = 0; i < vehicles.length; i++) if ((r -= vehicleWeight[i]) <= 0) return vehicles[i];
    return vehicles[vehicles.length - 1];
  };
  const pickSource = (): AppointmentSource => weighted([["online", 45], ["phone", 40], ["walk_in", 15]]);

  const appointments: Appointment[] = [];
  const records: ServiceRecord[] = [];
  const firstSeen = new Map<string, Date>();
  const markSeen = (customerId: string, d: Date) => {
    const prev = firstSeen.get(customerId);
    if (!prev || d < prev) firstSeen.set(customerId, d);
  };

  const addRecord = (v: Vehicle, serviceId: string, date: Date, appointmentId?: string) => {
    const t = pickTpl(serviceId, v);
    records.push({
      id: `r${records.length + 1}`,
      vehicleId: v.id,
      appointmentId,
      serviceId,
      date: iso(date),
      km: kmAt(v, date),
      title: t.title,
      description: t.description,
      dtcs: t.dtcs,
      items: t.items.map(([name, price, qty]) => ({ name, qty: qty ?? 1, price: vary(price) })),
      labor: t.labor ? vary(t.labor) : 0,
      technician: pick(technicians),
    });
  };

  const addAppt = (
    v: Vehicle,
    serviceId: string,
    bayId: string,
    start: Date,
    status: AppointmentStatus,
    opts: { source?: AppointmentSource; customerId?: string; notes?: string } = {},
  ) => {
    const s = serviceById[serviceId];
    const end = new Date(start.getTime() + s.durationMin * 60000);
    const source = opts.source ?? pickSource();
    const id = `a${appointments.length + 1}`;
    const isPast = end.getTime() < now.getTime();
    appointments.push({
      id,
      customerId: opts.customerId ?? v.ownerId,
      vehicleId: v.id,
      serviceId,
      bayId,
      start: iso(start),
      end: iso(end),
      status,
      source,
      notes: opts.notes ?? (chance(source === "online" ? 0.55 : 0.2) ? pick(notesFor[serviceId]) : undefined),
      reminder: isPast || start.getTime() - now.getTime() < 86400000 ? "sent" : "scheduled",
      token: token(),
    });
    markSeen(opts.customerId ?? v.ownerId, start);
    return id;
  };

  /** Γεμίζει μια μέρα: κάθε θέση από το άνοιγμα, με κενά, χωρίς επικαλύψεις */
  const fillDay = (dayOffset: number, density: number, statusFor: (start: Date, end: Date, serviceId: string) => AppointmentStatus | null) => {
    const day = at(dayOffset, 0);
    const h = dayHours(shop, day.getDay());
    if (!h) return;
    for (const bay of bays) {
      let cursor = h.open + (chance(0.5) ? 0 : 30);
      while (cursor < h.close) {
        if (!chance(density)) {
          cursor += pick([30, 60, 90]);
          continue;
        }
        const d = at(dayOffset, cursor);
        let serviceId = pickService(d);
        // Το διαγνωστικό παίρνει κυρίως διαγνώσεις και A/C
        if (bay.id === "b3" && !["diag", "ac", "immo", "lights"].includes(serviceId)) serviceId = pick(["diag", "diag", "ac", "immo"]);
        const dur = serviceById[serviceId].durationMin;
        if (cursor + dur > h.close) break;
        const end = at(dayOffset, cursor + dur);
        const status = statusFor(d, end, serviceId);
        if (status) {
          const v = pickVehicle();
          const id = addAppt(v, serviceId, bay.id, d, status);
          if (status === "done" && chance(0.94)) addRecord(v, serviceId, new Date(end.getTime() - 15 * 60000), id);
        }
        cursor += dur + pick([0, 0, 30, 30, 60]);
      }
    }
  };

  // Παρελθόν: 12 μήνες, πιο πυκνά τους τελευταίους μήνες (η δουλειά μεγαλώνει)
  for (let d = -365; d < 0; d++) {
    const density = 0.42 + 0.2 * ((d + 365) / 365);
    fillDay(d, density, () => {
      const r = rand();
      return r < 0.86 ? "done" : r < 0.92 ? "no_show" : "cancelled";
    });
  }

  // Σήμερα: γεμάτη μέρα, με κατάσταση ανάλογα με την ώρα
  fillDay(0, 0.8, (start, end) => {
    if (end.getTime() <= now.getTime()) return chance(0.93) ? "done" : "no_show";
    if (start.getTime() <= now.getTime()) return "in_progress";
    return "confirmed";
  });

  // Επόμενες 4 εβδομάδες: πιο αραιά όσο απομακρύνεται, αιτήματα online στις επόμενες μέρες
  for (let d = 1; d <= 28; d++) {
    const density = Math.max(0.12, 0.62 - d * 0.018);
    fillDay(d, density, (_s, _e, serviceId) => (serviceById[serviceId].requiresApproval && d <= 10 && chance(0.55) ? "pending" : "confirmed"));
  }
  // Τα «pending» είναι online κρατήσεις
  for (const a of appointments) if (a.status === "pending") a.source = "online";

  // Ένα αίτημα από νέο ιδιοκτήτη (το αυτοκίνητο άλλαξε χέρια): δείχνει την προειδοποίηση
  const sold = vehicles[20];
  const buyer = customers[customers.length - 1];
  const soldDay = [1, 2, 3, 4, 5].map((d) => at(d, 0)).find((d) => dayHours(shop, d.getDay()));
  if (soldDay) {
    const offset = Math.round((soldDay.getTime() - today.getTime()) / 86400000);
    addAppt(sold, "immo", "b3", at(offset, 16 * 60), "pending", { source: "online", customerId: buyer.id, notes: "Το αγόρασα πρόσφατα, θέλω δεύτερο κλειδί." });
  }

  // Παλαιότερο ιστορικό (1–4 χρόνια πριν), χωρίς ραντεβού στο σύστημα
  for (const v of vehicles) {
    const n = between(0, 4);
    for (let i = 0; i < n; i++) {
      const d = at(-between(370, 1400), between(9, 15) * 60);
      if (v.year && d.getFullYear() < v.year) continue;
      addRecord(v, pickService(d), d);
      markSeen(v.ownerId, d);
    }
  }
  records.sort((a, b) => a.date.localeCompare(b.date));
  records.forEach((r, i) => (r.id = `r${i + 1}`));

  // Πελάτης από την πρώτη του επίσκεψη (ή πρόσφατα, αν δεν έχει έρθει ακόμα)
  for (const c of customers) {
    const first = firstSeen.get(c.id);
    c.createdAt = iso(first ? new Date(first.getTime() - between(0, 20) * 86400000) : at(-between(1, 40)));
  }

  /* ---------- Υπενθυμίσεις ---------- */

  const reminders: VehicleReminder[] = [];
  vehicles.forEach((v, i) => {
    const lastService = [...records].reverse().find((r) => r.vehicleId === v.id && r.serviceId === "service");
    const interval = v.fuel === "Ηλεκτρικό" ? 0 : v.fuel === "Diesel" ? 20000 : 15000;
    if (interval) {
      const lastKm = lastService?.km ?? v.km - between(2000, 16000);
      reminders.push({
        id: `rm${reminders.length + 1}`,
        vehicleId: v.id,
        kind: "oil",
        lastKm,
        dueKm: lastKm + interval,
        lastDate: lastService?.date ?? iso(at(-between(60, 400))),
      });
    }
    reminders.push({ id: `rm${reminders.length + 1}`, vehicleId: v.id, kind: "kteo", dueDate: iso(at(between(-15, 720))) });
    const lastAc = [...records].reverse().find((r) => r.vehicleId === v.id && r.serviceId === "ac");
    if (i % 2 === 0 || lastAc) {
      const last = lastAc ? new Date(lastAc.date) : at(-between(200, 500));
      const due = new Date(last);
      due.setFullYear(due.getFullYear() + 1);
      reminders.push({ id: `rm${reminders.length + 1}`, vehicleId: v.id, kind: "ac", lastDate: iso(last), dueDate: iso(due) });
    }
    if (i % 3 === 0) reminders.push({ id: `rm${reminders.length + 1}`, vehicleId: v.id, kind: "battery", dueDate: iso(at(between(5, 500))) });
    if (v.fuel === "Diesel" && i % 4 === 0) {
      const lastKm = Math.max(0, v.km - between(20000, 115000));
      reminders.push({ id: `rm${reminders.length + 1}`, vehicleId: v.id, kind: "timing", lastKm, dueKm: lastKm + 120000 });
    }
  });

  return { customers, vehicles, appointments, records, reminders };
}
