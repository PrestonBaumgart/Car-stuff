// NHTSA client for the app. Free public APIs, no key needed, CORS-enabled.
// Same logic as src/lib/nhtsa.js (used by the landing page), typed for the app.
import { cleanComplaint, topSymptoms } from "./problem-guide";
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

export interface ComplaintDetail {
  component: string;
  count: number;
  crashes: number;
  fires: number;
  injuries: number;
  /** Most-mentioned symptoms in this component's complaints, with how many complaints mention each. */
  symptoms: { label: string; count: number }[];
  /** Recent owner reports, newest first, cleaned for display. */
  reports: { date: string; text: string }[];
}

export interface ComplaintSummary {
  total: number;
  topComponents: ComplaintDetail[];
}

interface RawComplaint {
  components?: string;
  summary?: string;
  dateOfIncident?: string;
  dateComplaintFiled?: string;
  crash?: boolean;
  fire?: boolean;
  numberOfInjuries?: number;
}

/** NHTSA complaint dates are mm/dd/yyyy; returns yyyy-mm-dd (or "" if unparseable). */
function complaintDate(raw?: string) {
  const m = String(raw || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[1]}-${m[2]}` : "";
}

/** Owner complaints, grouped by component: counts, symptoms and sample reports for the common problems. */
export async function getComplaints(vehicle: YMM, top = 6): Promise<ComplaintSummary> {
  const data = await getJson(`${SAFETY}/complaints/complaintsByVehicle?${ymm(vehicle)}`);
  const results: RawComplaint[] = data.results || [];
  const groups: Record<string, RawComplaint[]> = {};
  for (const c of results) {
    for (const comp of String(c.components || "UNKNOWN OR OTHER").split(",")) {
      const k = comp.trim() || "UNKNOWN OR OTHER";
      (groups[k] = groups[k] || []).push(c);
    }
  }
  const topComponents = Object.entries(groups)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, top)
    .map(([component, list]) => {
      const texts = list.map((c) => cleanComplaint(String(c.summary || "")));
      const reports = list
        .map((c, i) => ({ date: complaintDate(c.dateOfIncident) || complaintDate(c.dateComplaintFiled), text: texts[i] }))
        .filter((r) => r.text.length > 40)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5);
      return {
        component,
        count: list.length,
        crashes: list.filter((c) => c.crash).length,
        fires: list.filter((c) => c.fire).length,
        injuries: list.reduce((n, c) => n + (c.numberOfInjuries || 0), 0),
        symptoms: topSymptoms(texts),
        reports,
      };
    });
  return { total: data.count ?? results.length, topComponents };
}
