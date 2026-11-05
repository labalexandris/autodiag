/** Τιμή του VehiclePicker: υπάρχον όχημα (vehicle_id) ή στοιχεία νέου. Ταιριάζει με το intakeSchema του API. */
export interface IntakeValue {
  vehicle_id: string | null
  plate: string
  make: string
  model: string
  full_name: string
  phone: string
}

export const emptyIntake = (): IntakeValue => ({ vehicle_id: null, plate: '', make: '', model: '', full_name: '', phone: '' })

export const intakeReady = (v: IntakeValue) => !!v.vehicle_id || v.plate.trim().length >= 2
