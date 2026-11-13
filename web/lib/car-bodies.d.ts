/** One generic body type. `file` is `generic/${key}.glb`, relative to the parts folder's cars/. Credits are filled in from the model's source page. */
export interface CarBody {
  key: string;
  file: string;
  title: string;
  author: string;
  url: string;
}

/** The line the UI shows next to a generic body. */
export const BODY_NOTE: string;

/** Every generic body type. */
export const CAR_BODIES: CarBody[];

/** The generic body that best matches a decoded vehicle: by NHTSA body class, refined by the car's size. Never null; "sedan" when unknown. */
export function bodyFor(vehicle: {
  bodyClass?: string | null; body?: string | null; make?: string | null; model?: string | null;
  year?: string | number | null; doors?: string | number | null; wheelbase?: string | number | null;
  [field: string]: unknown;
} | null | undefined): CarBody;
