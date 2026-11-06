// Vinsight NHTSA client. Free public APIs, no key needed. Works in browsers and Node 18+.
const VPIC = "https://vpic.nhtsa.dot.gov/api/vehicles";
const SAFETY = "https://api.nhtsa.gov";

const TRANSLIT = { A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,J:1,K:2,L:3,M:4,N:5,P:7,R:9,S:2,T:3,U:4,V:5,W:6,X:7,Y:8,Z:9 };
const WEIGHTS = [8,7,6,5,4,3,2,10,0,9,8,7,6,5,4,3,2];

/** Validate a 17-character VIN, including the 9th-position check digit (North American VINs). */
export function validateVin(raw) {
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

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`NHTSA ${res.status} for ${url}`);
  return res.json();
}

/** Decode a VIN into a compact vehicle object. */
export async function decodeVin(vin) {
  const data = await getJson(`${VPIC}/DecodeVinValues/${encodeURIComponent(vin)}?format=json`);
  const d = data.Results?.[0] || {};
  const displacement = d.DisplacementL ? `${(+d.DisplacementL).toFixed(1)}L` : null;
  return {
    vin,
    year: d.ModelYear || null,
    make: d.Make || null,
    model: d.Model || null,
    trim: d.Trim || null,
    bodyClass: d.BodyClass || null,
    engine: { displacement, cylinders: d.EngineCylinders || null, configuration: d.EngineConfiguration || null, fuel: d.FuelTypePrimary || null },
    drive: d.DriveType || null,
    transmission: d.TransmissionStyle || null,
    plant: { city: d.PlantCity || null, country: d.PlantCountry || null },
    errorCode: d.ErrorCode,
    raw: d,
  };
}

function ymm({ year, make, model }) {
  return `make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${encodeURIComponent(year)}`;
}

/** Recalls for a year/make/model. */
export async function getRecalls(vehicle) {
  const data = await getJson(`${SAFETY}/recalls/recallsByVehicle?${ymm(vehicle)}`);
  return (data.results || []).map((r) => ({
    campaign: r.NHTSACampaignNumber,
    component: r.Component,
    summary: r.Summary,
    consequence: r.Consequence,
    remedy: r.Remedy,
    reportDate: r.ReportReceivedDate,
    parkIt: !!r.parkIt,
  }));
}

/** Owner complaints, plus a tally of the most-reported components. */
export async function getComplaints(vehicle, top = 6) {
  const data = await getJson(`${SAFETY}/complaints/complaintsByVehicle?${ymm(vehicle)}`);
  const results = data.results || [];
  const tally = {};
  for (const c of results) {
    for (const comp of String(c.components || "UNKNOWN").split(",")) {
      const k = comp.trim();
      tally[k] = (tally[k] || 0) + 1;
    }
  }
  const topComponents = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, top).map(([component, count]) => ({ component, count }));
  return { total: data.count ?? results.length, topComponents, results };
}
