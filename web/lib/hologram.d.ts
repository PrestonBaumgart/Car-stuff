export interface HologramVehicle {
  year?: string | null;
  make?: string | null;
  model?: string | null;
  trim?: string | null;
  /** Shown in the part panel and used in part searches, e.g. "3.0L 6-cyl". */
  engine?: string | null;
  cylinders?: string | number | null;
  fuel?: string | null;
  /** NHTSA body class; SUVs, crossovers, wagons and hatchbacks get the crossover body. */
  bodyClass?: string | null;
  /** NHTSA drive type. AWD and RWD cars get a driveshaft, rear differential and rear axles. */
  drive?: string | null;
  /** NHTSA door count and wheelbase (inches): pick 2- vs 4-door bodies and compact vs midsize SUVs. */
  doors?: string | number | null;
  wheelbase?: string | number | null;
}

export interface Hologram {
  setVehicle(vehicle: HologramVehicle): void;
  /** Body color as "#rrggbb". */
  setPaint(color: string): void;
  destroy(): void;
  play?(): void;
  pause?(): void;
}

export function createHologram(
  root: HTMLElement,
  options?: { vehicle?: HologramVehicle; demo?: boolean; paint?: string; partsUrl?: string; onSelect?: (partId: string) => void },
): Hologram;
