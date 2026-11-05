# AutoDiag: ψηφιακό συνεργείο

PWA για συνεργεία αυτοκινήτων: **πελάτες, οχήματα (με πινακίδα), ραντεβού, κάρτες εργασίας** με κωδικούς βλάβης, εργασίες/ανταλλακτικά, ΦΠΑ και φωτογραφίες. Ανοίγει στο iPhone σαν εφαρμογή χωρίς App Store (Safari → Κοινοποίηση → «Προσθήκη στην οθόνη αφετηρίας»).

## Stack

| | |
|---|---|
| `apps/web` | Vue 3 + Vite + TypeScript, Tailwind v4, vite-plugin-pwa (offline cache), lucide icons |
| `apps/api` | Fastify 5 + PostgreSQL (raw SQL, `pg`), zod validation, cookie sessions, bcrypt |
| DB (dev) | Αν δεν οριστεί `DATABASE_URL`, χρησιμοποιείται **PGlite** (ενσωματωμένος Postgres) στο `apps/api/.data/` |

Multi-tenant από την αρχή: κάθε πίνακας έχει `shop_id`, οπότε μπορεί να γίνει SaaS για πολλά συνεργεία.

## Τοπικά

```bash
npm install
npm run seed        # δημιουργεί demo συνεργείο + δείγμα δεδομένων
npm run dev         # API :3000 + web :5180
```

Άνοιξε http://127.0.0.1:5180. Τα demo στοιχεία σύνδεσης είναι στο `apps/api/src/seed.ts` (μόνο για τοπική δοκιμή).

Για δοκιμή από το κινητό στο ίδιο Wi-Fi: `http://<IP-υπολογιστή>:5180`. Η εγκατάσταση ως PWA και το service worker θέλουν **HTTPS**, άρα σε κανονικό server.

### Με κανονικό Postgres

```bash
createdb autodiag
# στο .env (βλ. .env.example)
DATABASE_URL=postgres://postgres:ΚΩΔΙΚΟΣ@localhost:5432/autodiag
npm run seed
```

Τα migrations (`apps/api/migrations/*.sql`) τρέχουν αυτόματα στην εκκίνηση.

## Production

```bash
npm run build       # χτίζει το web στο apps/web/dist
npm start           # το API σερβίρει και το web app στο ίδιο port
```

Πρώτος πραγματικός λογαριασμός:

```bash
SEED_EMAIL=owner@autodiag.gr SEED_PASSWORD='...' SEED_NAME='Όνομα' SEED_DEMO=0 npm run seed
```

Ορίσε `PUBLIC_URL=https://...` ώστε τα cookies να είναι `Secure` και το link ημερολογίου να είναι σωστό. Πρόταση: Hetzner VPS + Caddy (αυτόματο HTTPS) + Postgres, ή Railway/Render + Neon.

## Τι υπάρχει (Φάση 1)

- **Σήμερα:** αναζήτηση με πινακίδα/όνομα/τηλέφωνο (χωρίς τόνους, ελληνικά = λατινικά γράμματα πινακίδας), μετρητές, σημερινά ραντεβού, οχήματα στο συνεργείο
- **Ραντεβού:** εβδομαδιαία προβολή, γρήγορη καταχώρηση με νέο ή υπάρχον όχημα, κατάσταση, «Ήρθε → άνοιξε κάρτα»
- **Κάρτα εργασίας:** κατάσταση (Ανοιχτή → Σε εξέλιξη → Έτοιμο → Παραδόθηκε), χιλιόμετρα, παράπονο, DTC, διάγνωση, εργασίες/ανταλλακτικά με ΦΠΑ, φωτογραφίες (σμίκρυνση πριν το upload), εκτύπωση δελτίου
- **Πελάτες / Οχήματα:** καρτέλες, ιστορικό επισκέψεων, κλήση & Viber με ένα tap
- **Ημερολόγιο iPhone/Google:** συνδρομή webcal (`/api/ics/<token>.ics`) από τις Ρυθμίσεις

## Επόμενα (Φάση 2+)

- SMS/Viber ειδοποιήσεις (ραντεβού αύριο, «το αυτοκίνητο είναι έτοιμο»), π.χ. Apifon/Yuboto
- Υπενθυμίσεις service/ΚΤΕΟ ανά χλμ/μήνες
- Import υπαρχόντων ραντεβού από Google/Apple Calendar (.ics)
- PDF προσφοράς με link για τον πελάτη
- **Ψηφιακό Πελατολόγιο ΑΑΔΕ** (επιβεβαίωση υποχρέωσης με λογιστή), διασύνδεση με πάροχο myDATA
- Χρήστες-τεχνικοί, εγγραφή νέων συνεργείων, συνδρομές
