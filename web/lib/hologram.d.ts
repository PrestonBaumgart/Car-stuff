export interface HologramVehicle {
  year?: string | null;
  make?: string | null;
  model?: string | null;
  trim?: string | null;
  /** Shown in the part panel and used in part searches, e.g. "3.0L 6-cyl". */
  engine?: string | null;
  cylinders?: string | number | null;
  fuel?: string | null;
}

export interface Hologram {
  setVehicle(vehicle: HologramVehicle): void;
  destroy(): void;
  play?(): void;
  pause?(): void;
}

export function createHologram(
  root: HTMLElement,
  options?: { vehicle?: HologramVehicle; demo?: boolean; onSelect?: (partId: string) => void },
): Hologram;
