// NHTSA client for the app. Free public APIs, no key needed, CORS-enabled.
// Same logic as src/lib/nhtsa.js (used by the landing page), typed for the app.
import type { Vehicle } from "./types";

const VPIC = "https://vpic.nhtsa.dot.gov/api/vehicles";
const SAFETY = "https://api.nhtsa.gov";

const TRANSLIT: Record<string, number> = { A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,J:1,K:2,L:3,M:4,N:5,P:7,R:9,S:2,T:3,U:4,V:5,W:6,X:7,Y:8,Z:9 };
const WEIGHTS = [8,7,6,5,4,3,2,10,0,9,8,7,6,5,4,3,2];

export type VinCheck =
  | { ok: false; vin: string; reason: string }
  | { ok: true; vin: string; checkDigitValid: boolean };

/** Validate a 17-character VIN, including the 9th-position check digit (North American VINs). */
export function validateVin(raw: string): VinCheck {
  const vin = String(raw || "").toUpperCase().replace(/\s/g, "");
  if (vin.length !== 17) return { ok: false, vin, reason: "VIN must be 17 characters" };
  if (/[IOQ]/.test(vin)) return { ok: false, vin, reason: "VINs never use I, O or Q" };
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) return { ok: false, vin, reason: "Letters and numbers only" };
  let sum = 0;
  for (let i = 0; i < 17; i++) sum += (/\d/.test(vin[i]) ? +vin[i] : TRANSLIT[vin[i]]) * WEIGHTS[i];
  const r = sum % 11;
  const expected = r === 10 ? "X" : String(r);
  return { ok: true, vin, checkDigitValid: vin[8] === expected };
}

async function getJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`NHTSA ${res.status}`);
  return res.json();
}

/** Decode a VIN. Throws if NHTSA can't identify the make, model and year. */
export async function decodeVin(vin: string): Promise<Vehicle> {
  const data = await getJson(`${VPIC}/DecodeVinValues/${encodeURIComponent(vin)}?format=json`);
  const d = data.Results?.[0] || {};
  if (!d.Make || !d.Model || !d.ModelYear) throw new Error("NHTSA couldn't identify this VIN");
  return {
    vin,
    year: d.ModelYear || null,
    make: d.Make || null,
    model: d.Model || null,
    trim: d.Trim || null,
    bodyClass: d.BodyClass || null,
    engine: {
      displacement: d.DisplacementL ? `${(+d.DisplacementL).toFixed(1)}L` : null,
      cylinders: d.EngineCylinders || null,
      fuel: d.FuelTypePrimary || null,
    },
    drive: d.DriveType || null,
    transmission: d.TransmissionStyle || null,
    doors: d.Doors || null,
    wheelbase: d.WheelBaseShort || null,
  };
}

type YMM = Pick<Vehicle, "year" | "make" | "model">;

function ymm({ year, make, model }: YMM) {
  return `make=${encodeURIComponent(make ?? "")}&model=${encodeURIComponent(model ?? "")}&modelYear=${encodeURIComponent(year ?? "")}`;
}

export interface Recall {
  campaign: string;
  component: string;
  summary: string;
  consequence: string;
  remedy: string;
  reportDate: string;
  parkIt: boolean;
}

/** Recalls for a year/make/model (not VIN-specific). */
export async function getRecalls(vehicle: YMM): Promise<Recall[]> {
  const data = await getJson(`${SAFETY}/recalls/recallsByVehicle?${ymm(vehicle)}`);
  return (data.results || []).map((r: Record<string, unknown>) => ({
    campaign: String(r.NHTSACampaignNumber ?? ""),
    component: String(r.Component ?? ""),
    summary: String(r.Summary ?? ""),
    consequence: String(r.Consequence ?? ""),
    remedy: String(r.Remedy ?? ""),
    reportDate: String(r.ReportReceivedDate ?? ""),
    parkIt: !!r.parkIt,
  }));
}

export interface ComplaintSummary {
  total: number;
  topComponents: { component: string; count: number }[];
}

/** Owner complaints, tallied by component to surface common problems. */
export async function getComplaints(vehicle: YMM, top = 6): Promise<ComplaintSummary> {
  const data = await getJson(`${SAFETY}/complaints/complaintsByVehicle?${ymm(vehicle)}`);
  const results: { components?: string }[] = data.results || [];
  const tally: Record<string, number> = {};
  for (const c of results) {
    for (const comp of String(c.components || "UNKNOWN").split(",")) {
      const k = comp.trim();
      tally[k] = (tally[k] || 0) + 1;
    }
  }
  const topComponents = Object.entries(tally)
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([component, count]) => ({ component, count }));
  return { total: data.count ?? results.length, topComponents };
}
