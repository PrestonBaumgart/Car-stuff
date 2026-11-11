/** Real size in meters. Any field may be missing. */
export interface CarDims { length?: number; width?: number; height?: number; wheelbase?: number }

/** Real dimensions for a known make/model/year (wheelbase in inches from NHTSA overrides the table's). */
export function dimsFor(vehicle: {
  make?: string | null; model?: string | null; year?: string | number | null; wheelbase?: string | number | null;
  bodyClass?: string | null; body?: string | null;
}): CarDims | null;
