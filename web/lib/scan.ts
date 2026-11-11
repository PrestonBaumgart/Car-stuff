// Turn the text read from a photo (OCR) into garage fields: an insurance card, a registration card, or a
// service receipt. Photos are read on the device (lib/ocr.ts); this file is plain text parsing, so it's testable.
// OCR text is messy, so every result is a suggestion the owner reviews before it's saved.
import type { Insurance, Registration } from "./types";

export type ScanKind = "receipt" | "insurance" | "registration";

/* ---------------- document type ---------------- */
const KIND_HINTS: Record<ScanKind, RegExp[]> = {
  insurance: [/insurance/i, /\bpolicy\b/i, /insured/i, /\bNAIC\b/i, /coverage/i, /identification card/i, /effective/i, /\bagent\b/i],
  registration: [/registration/i, /\bplate\b/i, /\btag\b/i, /\bDMV\b/i, /motor vehicles?/i, /department of (licensing|revenue|transportation)/i, /registered owner/i, /\btitle\b/i, /\bfees?\b/i],
  receipt: [/invoice/i, /repair order/i, /receipt/i, /\blabor\b/i, /subtotal/i, /\btotal\b/i, /oil change/i, /\bparts\b/i, /mileage|odometer/i, /technician|advisor/i],
};

/** Best guess at what kind of document the text came from. */
export function detectKind(text: string): ScanKind {
  const score = (k: ScanKind) => KIND_HINTS[k].reduce((n, re) => n + (re.test(text) ? 1 : 0), 0);
  return (["insurance", "registration", "receipt"] as ScanKind[]).sort((a, b) => score(b) - score(a))[0];
}

/* ---------------- dates ---------------- */
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const iso = (y: number, m: number, d: number) =>
  m >= 1 && m <= 12 && d >= 1 && d <= 31 ? `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}` : null;
const fullYear = (y: string) => (y.length === 2 ? 2000 + Number(y) : Number(y));

export interface FoundDate { date: string; index: number }

/** Every date in the text (US formats, ISO, and month names), with where it was found. */
export function findDates(text: string): FoundDate[] {
  const out: FoundDate[] = [];
  const push = (date: string | null, index: number) => { if (date) out.push({ date, index }); };
  let m: RegExpExecArray | null;
  const numeric = /\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4}|\d{2})\b/g; // 03/31/2027, 3-31-27
  while ((m = numeric.exec(text))) push(iso(fullYear(m[3]), +m[1], +m[2]), m.index);
  const isoRe = /\b(\d{4})-(\d{2})-(\d{2})\b/g;
  while ((m = isoRe.exec(text))) push(iso(+m[1], +m[2], +m[3]), m.index);
  const named = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/gi; // March 31, 2027
  while ((m = named.exec(text))) push(iso(+m[3], MONTHS.indexOf(m[1].slice(0, 3).toLowerCase()) + 1, +m[2]), m.index);
  const dayFirst = /\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?,?\s+(\d{4})\b/gi; // 31 MAR 2027
  while ((m = dayFirst.exec(text))) push(iso(+m[3], MONTHS.indexOf(m[2].slice(0, 3).toLowerCase()) + 1, +m[1]), m.index);
  const monthYear = /\b(?:exp(?:ires|iration)?\.?|valid (?:thru|through|until))\s*:?\s*(\d{1,2})[/\-](\d{4}|\d{2})\b/gi; // EXP 03/27 (month/year: last day)
  while ((m = monthYear.exec(text))) {
    const y = fullYear(m[2]), mo = +m[1];
    push(mo >= 1 && mo <= 12 ? iso(y, mo, new Date(Date.UTC(y, mo, 0)).getUTCDate()) : null, m.index + m[0].length - m[1].length - m[2].length - 1);
  }
  return out.sort((a, b) => a.index - b.index);
}

/** The date right after a label like "Expires" (within ~40 characters), if there is one. */
function dateAfter(text: string, label: RegExp, dates: FoundDate[]) {
  const re = new RegExp(label.source, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const end = m.index + m[0].length;
    const hit = dates.find((d) => d.index >= m!.index && d.index - end <= 40);
    if (hit) return hit.date;
  }
  return undefined;
}
const latest = (dates: FoundDate[]) => dates.map((d) => d.date).sort().pop();

/* ---------------- small fields ---------------- */
const PHONE = /(?:\+?1[\s.-]?)?\(?\b(\d{3})\)?[\s.-]?(\d{3})[\s.-]?(\d{4})\b/;
function phoneNear(text: string, label: RegExp) {
  const at = text.search(label);
  const from = at >= 0 ? text.slice(at) : text;
  const m = from.match(PHONE) || text.match(PHONE);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : undefined;
}

// OCR mixes up O/0, I/1 and friends; VINs never use I, O or Q, so those must be 1 and 0.
const VIN_RE = /\b[A-HJ-NPR-Z0-9IOQ]{17}\b/g;
/** VINs in the text, with OCR letter mix-ups fixed. */
export function findVins(text: string) {
  return (text.toUpperCase().match(VIN_RE) || []).map((v) => v.replace(/[OQ]/g, "0").replace(/I/g, "1")).filter((v) => /\d/.test(v) && /[A-Z]/.test(v));
}

const STATE_NAMES: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA", colorado: "CO", connecticut: "CT", delaware: "DE",
  "district of columbia": "DC", florida: "FL", georgia: "GA", hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
  kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD", massachusetts: "MA", michigan: "MI", minnesota: "MN",
  mississippi: "MS", missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV", "new hampshire": "NH", "new jersey": "NJ",
  "new mexico": "NM", "new york": "NY", "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK", oregon: "OR",
  pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC", "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT",
  vermont: "VT", virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI", wyoming: "WY",
};
function findState(text: string) {
  const lower = text.toLowerCase();
  // longest names first so "west virginia" wins over "virginia"
  const name = Object.keys(STATE_NAMES).sort((a, b) => b.length - a.length).find((n) => new RegExp(`\\b${n}\\b`).test(lower));
  if (name) return STATE_NAMES[name];
  const abbr = text.match(/\bstate\s*(?:of)?\s*:?\s*([A-Z]{2})\b/);
  return abbr && Object.values(STATE_NAMES).includes(abbr[1]) ? abbr[1] : undefined;
}

/* ---------------- insurance card ---------------- */
const INSURERS = [
  "State Farm", "GEICO", "Progressive", "Allstate", "USAA", "Liberty Mutual", "Farmers", "Nationwide", "American Family",
  "Travelers", "Erie", "Auto-Owners", "The Hartford", "Kemper", "Mercury", "Safeco", "Root", "Lemonade", "Esurance",
  "Country Financial", "Shelter", "Amica", "The General", "Dairyland", "Bristol West", "Infinity", "Direct Auto",
  "Elephant", "Wawanesa", "CSAA", "AAA", "Grange", "Westfield", "Cincinnati", "Hanover", "Plymouth Rock", "NJM",
  "Sentry", "Hagerty", "MetLife", "Foremost", "Mile Auto", "Clearcover", "Hugo", "Metromile", "Noblr", "Branch",
];

export function parseInsurance(text: string): Insurance {
  const dates = findDates(text);
  const company = INSURERS.find((n) => new RegExp(`\\b${n.replace(/[-]/g, "[- ]?")}\\b`, "i").test(text))
    ?? text.match(/^\s*([A-Z][A-Za-z&.' -]{2,40}(?:Insurance|Mutual|Casualty|Indemnity|Assurance)[A-Za-z ]{0,20})/m)?.[1]?.trim();
  const policy = firstWithDigit(text, /\bpolicy\s*(?:no\.?|number|num|#)?\s*[:#.]?\s*([A-Z0-9]+(?:[ -][A-Z0-9]+){0,4})/gi);
  // An insurance card shows "effective X to Y" or "expiration Y": the labeled date, or else the later date.
  const expires = dateAfter(text, /\bexp(?:iration|ires|\.)?\s*(?:date)?/, dates) ?? latest(dates);
  const phone = phoneNear(text, /claim|report|call|phone|agent/i);
  return clean({ company, policy, phone, expires });
}

/* ---------------- registration card ---------------- */
export function parseRegistration(text: string): Registration {
  const dates = findDates(text);
  const plate = firstWithDigit(text, /\b(?:plate|lic(?:ense)?\.?(?:\s*plate)?|tag)\b\s*(?:no\.?|number|num|#)?\s*[:#.]?\s*([A-Z0-9]{2,4}[ -]?[A-Z0-9]{2,5})\b/gi)?.replace(/[\s-]+/g, "").toUpperCase();
  const expires = dateAfter(text, /\bexp(?:iration|ires|\.)?\s*(?:date)?|valid\s*(?:thru|through|until)/, dates) ?? latest(dates);
  return clean({ plate, state: findState(text), expires });
}

/* ---------------- service receipt ---------------- */
// Schedule items a receipt line can mean (ids match lib/maintenance.ts).
export const SERVICE_WORDS: [string, RegExp][] = [
  ["oil", /oil\s*(?:and|&|\/)?\s*filter|oil change|\blof\b|lube oil|synthetic (?:blend )?oil|motor oil|oil service/i],
  ["tire-rotation", /rotat/i],
  ["cabin-filter", /cabin (?:air )?filter|pollen filter/i],
  ["air-filter", /(?:engine )?air (?:filter|cleaner)/i],
  ["wipers", /wiper/i],
  ["battery", /battery/i],
  ["brake-fluid", /brake fluid|brake (?:system )?flush|brake bleed/i],
  ["brake-inspect", /brake (?:pad|inspect|service|job|shoe)|\bpads?\b|rotors?/i],
  ["coolant", /coolant|antifreeze|radiator flush|cooling system service/i],
  ["trans-fluid", /transmission (?:fluid|service|flush)|\batf\b|cvt fluid|trans(?:mission)? drain/i],
  ["spark-plugs", /spark ?plug/i],
  ["tire-pressure", /tire pressure|\btpms\b/i],
];

export interface ReceiptScan {
  date?: string;
  miles?: number;
  /** Schedule item ids found on the receipt. */
  services: string[];
  shop?: string;
  total?: string;
}

export function parseReceipt(text: string): ReceiptScan {
  const dates = findDates(text);
  const date = dateAfter(text, /(?:invoice|service|repair|order|ro)?\s*date|date (?:in|out)/, dates) ?? dates[0]?.date;
  const mileRe = /(?:mileage|odometer|odo|miles?\s*(?:in|out)|mi\s*in|km\s*in)\s*(?:in|out)?\s*[:#.]?\s*([\d,]{3,8})|\b([\d,]{4,8})\s*(?:mi|miles)\b/i;
  const mm = text.match(mileRe);
  const miles = mm ? Number((mm[1] || mm[2]).replace(/,/g, "")) : undefined;
  // "Air filter" lines that are really the cabin filter shouldn't count twice.
  const services = SERVICE_WORDS.filter(([id, re]) => {
    if (id === "air-filter") return text.split(/\n/).some((line) => re.test(line) && !/cabin|pollen/i.test(line));
    return re.test(text);
  }).map(([id]) => id);
  const shop = text.split(/\n/).map((l) => l.trim()).find((l) => /[A-Za-z]{3,}/.test(l) && !/invoice|receipt|repair order|date|customer/i.test(l));
  // the last "Total" on the receipt (not "Subtotal") is what was paid
  const total = [...text.matchAll(/\b(?:grand\s*)?total(?:\s*due)?\s*[:$]?\s*\$?\s*([\d,]+\.\d{2})/gi)].pop()?.[1];
  return { date, miles: miles && miles > 0 && miles < 2_000_000 ? miles : undefined, services, shop, total: total ? `$${total}` : undefined };
}

/** First capture of a global regex that contains a digit (skips label words like "Number"). */
function firstWithDigit(text: string, re: RegExp) {
  for (const m of text.matchAll(re)) if (/\d/.test(m[1])) return m[1].trim();
  return undefined;
}

function clean<T extends object>(o: T): T {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v != null && v !== "")) as T;
}
