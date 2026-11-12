// Repair quotes: parts + labor + the extras a shop adds, for the 3D view's Quote button.
// Plain JavaScript with no dependencies, shared by the landing page and the app (web/).
//
// Labor hours are typical "book" times for a midsize 4-cylinder car, rounded to the tenth the way shops bill
// (flat rate: the shop charges the book hours whatever the job really takes). The real books (MOTOR, Mitchell 1,
// ALLDATA, Chilton) are licensed per shop and have no free API, so these are our own estimates: close enough to
// sanity-check a shop's quote, not a replacement for one.

import { byId } from "./parts.js";

// [hours for a 4-cylinder, hours for a V6/V8 when it's more work there]
export const LABOR = {
  oil: [0.5], airf: [0.2], cabin: [0.3], plugs: [1.2, 2.6], coils: [0.5, 1.4], vcg: [1.5, 3.2], pcv: [0.3, 0.8],
  tbody: [0.8], belt: [0.6, 0.8], tbelt: [4.0, 5.5], wpump: [2.0, 3.5], thermo: [1.0, 1.4], hoses: [1.0], batt: [0.4],
  alt: [1.6, 2.4], starter: [1.5, 2.5], o2: [0.6, 0.9], rad: [2.0, 2.4], engine: [1.5], tchain: [7.0, 10.0],
  pistons: [18.0, 22.0], rings: [16.0, 20.0], rods: [17.0, 21.0], crank: [16.0, 20.0], cam: [4.5, 7.0],
  valves: [9.0, 13.0], hgasket: [7.0, 10.0], injectors: [1.8, 3.0], manifold: [2.0, 3.5],
  trans: [1.0], brakesF: [1.6], brakesR: [1.8], tires: [0.3], struts: [2.5], exhaust: [1.5, 2.2], lights: [0.3],
  wipers: [0.1], pads: [1.2], rotors: [0.5], calipers: [1.0], blines: [0.8], bearings: [1.6], springs: [2.5],
  carms: [1.3], swaybar: [0.5], rbeam: [3.0], subframe: [6.0], tierods: [1.0], rack: [4.0], cv: [1.3], dshaft: [1.0],
  rdiff: [0.5], flex: [1.2], xpipe: [1.2], resonator: [0.8], muffler: [0.8], tailpipe: [0.5], hangers: [0.3],
  ftank: [3.0], fpump: [2.0], flines: [2.5], ffilter: [0.6], fneck: [1.5], evap: [1.2],
  headlamp: [1.2], taillamp: [0.4], fog: [0.6], brake3: [0.6], mirrors: [0.8], doorF: [4.0], doorR: [3.5],
  handles: [0.8], hoodpanel: [1.0], fender: [1.5], bumperF: [1.8], bumperR: [1.6], trunk: [1.8], quarter: [14.0],
  grille: [0.6], bed: [4.0], softtop: [6.0], rails: [1.0], flares: [0.4], antenna: [0.8], windshield: [2.0],
  sideglass: [1.3], rearglass: [2.0], wheels: [0.3],
};

// Body panels come unpainted: refinish hours to paint and blend them, billed at the body shop's paint rate plus materials.
export const PAINT_HRS = { doorF: 3.0, doorR: 2.8, hoodpanel: 3.5, fender: 2.5, bumperF: 3.0, bumperR: 2.8, trunk: 3.2, quarter: 3.5, bed: 4.5 };
export const PAINT_MATERIALS = 45; // dollars per refinish hour
// Jobs that knock the wheels out of alignment.
export const NEEDS_ALIGNMENT = ["tierods", "rack", "carms", "struts", "springs", "subframe"];
export const ALIGNMENT = 1.0; // hours

// Each extra unit of the same job is quicker than the first: the car is already up and apart.
export const EXTRA_UNIT = 0.6;
export const SUPPLIES = { share: 0.08, cap: 45 }; // shop supplies: 8% of labor, capped

export const RATES = [
  { key: "indie", label: "Independent", rate: 140 },
  { key: "dealer", label: "Dealer", rate: 185 },
  { key: "budget", label: "Budget", rate: 100 },
];
export const DEFAULTS = { rate: 140, tax: 7, tier: 1 };
export const TIER_NAMES = ["Economy", "OE-quality", "Genuine OEM"];

const big = (v) => Number(v && v.cylinders) > 4;
const round1 = (n) => Math.round(n * 10) / 10;
const cents = (n) => Math.round(n * 100) / 100;

/** Book hours for one unit of a part's job on this vehicle. */
export function laborHours(id, vehicle) {
  const h = LABOR[id];
  if (!h) return 1.0;
  return big(vehicle) && h[1] ? h[1] : h[0];
}

/** Hours for qty units: the first at full book time, each extra at EXTRA_UNIT of it. */
export function jobHours(id, qty, vehicle) {
  const one = laborHours(id, vehicle);
  return round1(one * (1 + Math.max(0, qty - 1) * EXTRA_UNIT));
}

/**
 * One line of a quote.
 * item: { id, qty, tier } (tier 0 economy, 1 OE-quality, 2 genuine OEM)
 * opts: { rate, vehicle }
 */
export function quoteLine(item, opts) {
  const p = byId[item.id];
  const qty = Math.max(1, Math.round(item.qty || 1));
  const tier = item.tier ?? DEFAULTS.tier;
  const rate = opts.rate;
  const hours = jobHours(item.id, qty, opts.vehicle);
  const parts = p.price[tier] * qty;
  const extras = [];
  if (PAINT_HRS[item.id]) {
    const ph = round1(PAINT_HRS[item.id] * (1 + (qty - 1) * 0.8));
    extras.push({ label: "Paint and blend (" + ph + " h + materials)", hours: ph, amount: cents(ph * rate + ph * PAINT_MATERIALS) });
  }
  if (NEEDS_ALIGNMENT.includes(item.id)) extras.push({ label: "Wheel alignment", hours: ALIGNMENT, amount: cents(ALIGNMENT * rate) });
  return {
    id: item.id, name: p.name, unit: p.unit || "", qty, tier,
    parts: cents(parts), hours, labor: cents(hours * rate), extras,
    total: cents(parts + hours * rate + extras.reduce((s, e) => s + e.amount, 0)),
  };
}

/**
 * A full quote. Extras (alignment) are charged once even if several lines need them.
 * opts: { rate, tax (percent, on parts), vehicle }
 */
export function quote(items, opts) {
  const lines = items.filter((i) => byId[i.id]).map((i) => quoteLine(i, opts));
  let aligned = false;
  lines.forEach((l) => {
    l.extras = l.extras.filter((e) => {
      if (e.label !== "Wheel alignment") return true;
      if (aligned) return false;
      aligned = true; return true;
    });
    l.total = cents(l.parts + l.labor + l.extras.reduce((s, e) => s + e.amount, 0));
  });
  const parts = cents(lines.reduce((s, l) => s + l.parts, 0));
  const hours = round1(lines.reduce((s, l) => s + l.hours + l.extras.reduce((t, e) => t + (e.hours || 0), 0), 0));
  const labor = cents(lines.reduce((s, l) => s + l.labor + l.extras.reduce((t, e) => t + e.amount, 0), 0));
  const supplies = lines.length ? cents(Math.min(SUPPLIES.cap, lines.reduce((s, l) => s + l.labor, 0) * SUPPLIES.share)) : 0;
  const tax = cents(parts * (Number(opts.tax) || 0) / 100);
  const total = cents(parts + labor + supplies + tax);
  // shops vary: most quotes land within this range
  return { lines, parts, hours, labor, supplies, tax, total, low: cents(total * 0.85), high: cents(total * 1.2) };
}
