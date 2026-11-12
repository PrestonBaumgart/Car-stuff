// Generic, unbranded car bodies by type, so a decoded VIN shows a shape that "kinda looks like my car"
// without copying any maker's design. The body type comes from NHTSA's body class, refined by the car's size.
// Each model's credit is in public/parts/ATTRIBUTION.md.
// Plain JavaScript apart from the car-dims import, so the landing page can load it too.
import { dimsFor } from "./car-dims.js";

/** The small line the UI shows next to a generic body. */
export const BODY_NOTE = "Shown on a car like yours";

// Where each generic model came from (all CC BY 4.0, credited in public/parts/ATTRIBUTION.md). The .glb file lives in
// generic/ and is named after the key.
const PACK = ["Generic passenger car pack", "Comrade1280", "https://sketchfab.com/3d-models/generic-passenger-car-pack-20f9af9b8a404d5cb022ac6fe87f21f5"];
const CREDITS = {
  compact: PACK,
  sedan: ["Medium sized sedan", "MaG80", "https://sketchfab.com/3d-models/medium-sized-sedan-cb8fdecbc30d4618a6109d1de0e30a9e"],
  "large-sedan": PACK,
  hatchback: PACK,
  coupe: PACK,
  sports: PACK,
  wagon: PACK,
  "compact-suv": ["2010s Compact SUV", "MaG80", "https://sketchfab.com/3d-models/2010s-compact-suv-4d5566ec52ec4385a0d2d2754c189490"],
  suv: PACK,
  offroad: PACK,
  minivan: PACK,
  pickup: PACK,
  van: ["Traffic Car Pack", "MaG80", "https://sketchfab.com/3d-models/traffic-car-pack-5e795b0adcda455d9f64cb02b83f8f90"],
};

function body(key) {
  const [title, author, url] = CREDITS[key];
  return { key, file: "generic/" + key + ".glb", title, author, url };
}

export const CAR_BODIES = Object.keys(CREDITS).map(body);

const BY_KEY = Object.fromEntries(CAR_BODIES.map((entry) => [entry.key, entry]));

// Size cut-offs, in meters.
const COMPACT_SEDAN_MAX_LENGTH = 4.5; // a sedan shorter than this is a compact (Rio, Accent)
const LARGE_SEDAN_MIN_LENGTH = 4.95; // a sedan this long is a full-size one (Charger, Impala)
const SPORTS_MAX_HEIGHT = 1.38; // a coupe or convertible this low is a sports car
const COMPACT_SUV_MAX_LENGTH = 4.7; // an SUV shorter than this is a compact one (RAV4, CR-V, Tucson)
const MID_SUV_MIN_WHEELBASE = 2.77; // with no length, a wheelbase of 109 in or more is a midsize SUV
const OFFROAD_MIN_HEIGHT = 1.75, OFFROAD_MAX_LENGTH = 4.9, OFFROAD_MIN_BOXINESS = 0.37; // height / length of a boxy off-roader

function offroad(dims) {
  return !!(dims.length && dims.height && dims.height >= OFFROAD_MIN_HEIGHT && dims.length <= OFFROAD_MAX_LENGTH
    && dims.height / dims.length >= OFFROAD_MIN_BOXINESS);
}

function suvKey(cls, dims) {
  if (offroad(dims)) return "offroad";
  if (dims.length) return dims.length < COMPACT_SUV_MAX_LENGTH ? "compact-suv" : "suv";
  if (dims.wheelbase) return dims.wheelbase >= MID_SUV_MIN_WHEELBASE ? "suv" : "compact-suv";
  return /crossover|cuv/.test(cls) ? "compact-suv" : "suv";
}

function sedanKey(dims) {
  if (!dims.length) return "sedan";
  if (dims.length < COMPACT_SEDAN_MAX_LENGTH) return "compact";
  if (dims.length >= LARGE_SEDAN_MIN_LENGTH) return "large-sedan";
  return "sedan";
}

/**
 * The generic body that best matches a decoded vehicle. Always returns one: "sedan" when the body class is
 * missing or unknown. vehicle: { bodyClass, make, model, year, doors, wheelbase } (strings or numbers from NHTSA vPIC).
 * The size comes from car-dims.js when the model is in its table; without it the body class alone decides.
 */
export function bodyFor(vehicle) {
  const v = vehicle || {};
  const cls = String(v.bodyClass || v.body || "").toLowerCase();
  const dims = dimsFor(v) || {};
  const low = !!(dims.height && dims.height <= SPORTS_MAX_HEIGHT);

  let key = "sedan";
  if (/pickup|sport utility truck|\bsut\b|\btruck\b/.test(cls)) key = "pickup";
  else if (/minivan/.test(cls)) key = "minivan";
  else if (/\bvan\b/.test(cls)) key = "van";
  else if (/roadster/.test(cls)) key = "sports";
  else if (/convertible|cabriolet|coupe/.test(cls)) key = low ? "sports" : "coupe";
  else if (/wagon/.test(cls)) key = "wagon";
  else if (/hatch|liftback|notchback/.test(cls)) key = "hatchback";
  else if (/sport utility|suv|mpv|crossover|cuv/.test(cls)) key = suvKey(cls, dims);
  else if (/limousine/.test(cls)) key = "large-sedan";
  else if (/sedan|saloon/.test(cls) && parseInt(v.doors, 10) === 2) key = "coupe";
  else if (/sedan|saloon/.test(cls)) key = sedanKey(dims);
  return BY_KEY[key];
}
