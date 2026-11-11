export interface Vehicle {
  vin: string;
  year: string | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  bodyClass: string | null;
  engine: { displacement: string | null; cylinders: string | null; fuel: string | null };
  drive: string | null;
  transmission: string | null;
  /** NHTSA often leaves these blank. Wheelbase is in inches. */
  doors?: string | null;
  wheelbase?: string | null;
}

export interface OdometerEntry {
  date: string; // ISO date, yyyy-mm-dd
  miles: number;
}

export interface ServiceEntry {
  itemId: string;
  date: string; // ISO date, yyyy-mm-dd
  miles: number;
  note?: string;
}

/** Owner-entered specs. Free APIs don't publish these, so the owner fills them in from the manual or door sticker. */
export interface Specs {
  oilGrade?: string;
  oilCapacityQt?: string;
  tirePsiFront?: string;
  tirePsiRear?: string;
  tireSize?: string;
}

export interface Car extends Vehicle {
  nickname?: string;
  addedAt: string;
  odometer: OdometerEntry[];
  serviceLog: ServiceEntry[];
  specs: Specs;
  insurance?: Insurance;
  registration?: Registration;
}

/** Owner-entered insurance details. Saved only in this browser. */
export interface Insurance {
  company?: string;
  policy?: string;
  phone?: string;
  expires?: string; // ISO date, yyyy-mm-dd
}

/** Owner-entered registration (tag) details. Saved only in this browser. */
export interface Registration {
  plate?: string;
  state?: string;
  expires?: string; // ISO date, yyyy-mm-dd
}
