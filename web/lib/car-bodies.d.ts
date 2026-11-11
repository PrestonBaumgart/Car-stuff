/** One real car body model. `file` is `${key}.glb`; `years` is [first, last], inclusive. */
export interface CarBody {
  key: string;
  file: string;
  make: string;
  models: string[];
  years: [number, number];
  title: string;
  author: string;
  url: string;
}

/** Every car body we have a model for, with its credits. */
export const CAR_BODIES: CarBody[];

/** The body model for a decoded vehicle, or null. vehicle: { year, make, model, ... } (strings or numbers from NHTSA vPIC). */
export function bodyFor(vehicle: {
  year?: string | number | null; make?: string | null; model?: string | null; [field: string]: unknown;
} | null | undefined): CarBody | null;
