// Part health for the 3D view: which parts were just serviced, which are getting old, which are overdue,
// and which have no record. Built from the service log and schedule (lib/maintenance.ts).
import { fmtDate, fmtMiles } from "./format";
import { serviceQueue, todayIso, type ItemStatus } from "./maintenance";
import type { Car } from "./types";

/** good: recently serviced · watch: getting old, worth a look · replace: overdue · unknown: no record. */
export type Health = "good" | "watch" | "replace" | "unknown";

export interface PartHealth {
  status: Health;
  /** One line explaining it, e.g. "Engine oil & filter: overdue by 1,200 mi". */
  note: string;
}

// Which 3D parts (ids in parts.js) each service item covers.
const PARTS_FOR: Record<string, string[]> = {
  oil: ["oil"],
  "air-filter": ["airf"],
  "spark-plugs": ["plugs"],
  battery: ["batt"],
  coolant: ["rad", "hoses", "thermo"],
  "trans-fluid": ["trans"],
  "brake-inspect": ["pads", "rotors"],
  "brake-fluid": ["blines", "calipers"],
  "tire-rotation": ["tires"],
  "tire-pressure": ["tires"],
  wipers: ["wipers"],
};

/** How far through its service interval an item is (0 = just done, 1 = due), by miles or time, whichever is further. */
function used(s: ItemStatus) {
  const byMiles = s.item.everyMiles && s.milesLeft != null ? 1 - s.milesLeft / s.item.everyMiles : 0;
  const byTime = s.item.everyMonths && s.daysLeft != null ? 1 - s.daysLeft / (s.item.everyMonths * 30.44) : 0;
  return Math.max(byMiles, byTime);
}

/** Past this share of the interval a part turns from green to orange. */
export const WATCH_AT = 0.6;

function healthOf(s: ItemStatus): PartHealth {
  const name = s.item.name;
  if (s.status === "no-record") return { status: "unknown", note: `${name}: no service on record` };
  const last = s.lastDone ? `last done ${fmtDate(s.lastDone.date)} at ${fmtMiles(s.lastDone.miles)}` : "";
  if (s.status === "overdue") {
    const over = s.milesLeft != null && s.milesLeft <= 0 ? `overdue by ${fmtMiles(-s.milesLeft)}` : "overdue";
    return { status: "replace", note: `${name}: ${over} (${last})` };
  }
  if (s.status === "due-soon" || used(s) >= WATCH_AT) {
    const left = s.milesLeft != null ? `${fmtMiles(s.milesLeft)} left` : s.daysLeft != null ? `${s.daysLeft} days left` : "due soon";
    return { status: "watch", note: `${name}: ${left} (${last})` };
  }
  return { status: "good", note: `${name}: ${last}` };
}

const RANK: Record<Health, number> = { replace: 3, watch: 2, good: 1, unknown: 0 };

/** Health for every 3D part the schedule covers (worst status wins). Parts not listed have no record. */
export function partHealth(car: Car, today = todayIso()): Record<string, PartHealth> {
  const out: Record<string, PartHealth> = {};
  for (const s of serviceQueue(car, today)) {
    const h = healthOf(s);
    for (const id of PARTS_FOR[s.item.id] ?? []) {
      const cur = out[id];
      // worst wins; between two unknowns or equals keep the first note
      if (!cur || RANK[h.status] > RANK[cur.status]) out[id] = h;
    }
  }
  return out;
}
