import type { Car } from "./types";

export const fmtMiles = (n: number) => `${Math.round(n).toLocaleString("en-US")} mi`;

export function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export function carTitle(car: Pick<Car, "year" | "make" | "model" | "nickname">) {
  return car.nickname || [car.year, titleCase(car.make), car.model].filter(Boolean).join(" ");
}

export function titleCase(s: string | null) {
  if (!s) return "";
  // NHTSA returns makes in caps ("HONDA"); keep short brand acronyms like BMW and GMC.
  return s.length <= 3 ? s : s.charAt(0) + s.slice(1).toLowerCase();
}

export function carHref(vin: string) {
  return `/car/?vin=${encodeURIComponent(vin)}`;
}
