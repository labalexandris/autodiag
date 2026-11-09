export type ServiceCategory =
  | "diagnostics"
  | "ac"
  | "starter"
  | "battery"
  | "lighting"
  | "comfort"
  | "service";

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  durationMin: number;
  priceFrom?: number;
  /** Χρειάζεται έγκριση από το συνεργείο πριν επιβεβαιωθεί */
  requiresApproval: boolean;
}

export interface Bay {
  id: string;
  name: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  createdAt: string;
  smsConsent: boolean;
  marketingConsent: boolean;
  notes?: string;
}

export type Fuel = "Βενζίνη" | "Diesel" | "Υβριδικό" | "Ηλεκτρικό" | "LPG";

export interface Vehicle {
  id: string;
  plate: string;
  make: string;
  model: string;
  year: number;
  fuel: Fuel;
  engine?: string;
  vin?: string;
  ownerId: string;
  km: number;
  /** Δημόσιο token για το βιβλιάριο του πελάτη */
  shareToken: string;
}

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "done"
  | "no_show"
  | "cancelled";

export type AppointmentSource = "online" | "phone" | "walk_in";

export interface Appointment {
  id: string;
  customerId: string;
  vehicleId: string;
  serviceId: string;
  bayId: string;
  start: string;
  end: string;
  status: AppointmentStatus;
  source: AppointmentSource;
  notes?: string;
  reminder: "sent" | "scheduled" | "off";
}

export interface RecordItem {
  name: string;
  qty: number;
  price: number;
}

export interface ServiceRecord {
  id: string;
  vehicleId: string;
  appointmentId?: string;
  serviceId: string;
  date: string;
  km: number;
  title: string;
  description: string;
  dtcs?: string[];
  items: RecordItem[];
  labor: number;
  technician: string;
}

export type ReminderKind = "oil" | "kteo" | "ac" | "battery" | "timing";

export interface VehicleReminder {
  id: string;
  vehicleId: string;
  kind: ReminderKind;
  dueDate?: string;
  dueKm?: number;
  lastKm?: number;
  lastDate?: string;
}

export interface SmsTemplate {
  id: "confirm" | "reminder" | "ready" | "service_due";
  name: string;
  when: string;
  body: string;
  enabled: boolean;
}

export interface Shop {
  name: string;
  legalName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  hours: { day: number; open?: string; close?: string }[];
}
