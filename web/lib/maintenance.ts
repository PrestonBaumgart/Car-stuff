// Generic maintenance schedule and due-date logic.
// These intervals are common conservative defaults, not the OEM schedule for a specific car.
// When a maintenance API (CarMD, CarsXE) is wired in, its schedule replaces DEFAULT_SCHEDULE per vehicle.
import type { Car } from "./types";

export interface MaintenanceItem {
  id: string;
  name: string;
  everyMiles?: number;
  everyMonths?: number;
  /** 1 (anyone) to 5 (shop job). */
  diy: 1 | 2 | 3 | 4 | 5;
  tip: string;
  /** Skip for fully electric cars. */
  combustionOnly?: boolean;
}

export const DEFAULT_SCHEDULE: MaintenanceItem[] = [
  { id: "oil", name: "Engine oil & filter", everyMiles: 5000, everyMonths: 6, diy: 2, combustionOnly: true,
    tip: "Use the grade printed on the oil cap or in the manual. Drain plug, filter, refill, check the dipstick." },
  { id: "tire-rotation", name: "Tire rotation", everyMiles: 7500, everyMonths: 12, diy: 2,
    tip: "Check pressure against the door-jamb sticker while you're at it." },
  { id: "tire-pressure", name: "Tire pressure check", everyMonths: 1, diy: 1,
    tip: "Check cold, before driving. Use the door-jamb number, not the one on the tire sidewall." },
  { id: "air-filter", name: "Engine air filter", everyMiles: 15000, everyMonths: 24, diy: 1, combustionOnly: true,
    tip: "Usually a few clips on the airbox. No tools on most cars." },
  { id: "cabin-filter", name: "Cabin air filter", everyMiles: 15000, everyMonths: 12, diy: 1,
    tip: "Usually behind the glovebox. Shops charge a lot for a 5-minute job." },
  { id: "wipers", name: "Wiper blades", everyMonths: 12, diy: 1,
    tip: "Replace when they streak or chatter." },
  { id: "battery", name: "12V battery test", everyMonths: 12, diy: 1,
    tip: "Most parts stores test batteries for free. Typical life is 3–5 years." },
  { id: "brake-inspect", name: "Brake pad inspection", everyMiles: 12000, everyMonths: 12, diy: 3,
    tip: "Look through the wheel spokes at pad thickness. Replace under ~3 mm." },
  { id: "brake-fluid", name: "Brake fluid flush", everyMonths: 24, diy: 3,
    tip: "Brake fluid absorbs water over time. Needs a bleeder kit or a second person." },
  { id: "coolant", name: "Coolant flush", everyMiles: 60000, everyMonths: 60, diy: 3,
    tip: "Only open the radiator cap when the engine is cold. Use the coolant type in your manual." },
  { id: "trans-fluid", name: "Transmission fluid", everyMiles: 60000, diy: 4, combustionOnly: true,
    tip: "Intervals vary a lot by transmission. Check your manual before paying for a flush." },
  { id: "spark-plugs", name: "Spark plugs", everyMiles: 100000, diy: 3, combustionOnly: true,
    tip: "Iridium plugs last ~100k miles. Torque to spec and don't over-tighten." },
];

export function isElectric(car: Pick<Car, "engine">) {
  return /^electric$/i.test(car.engine.fuel?.trim() ?? "");
}

export function scheduleFor(car: Pick<Car, "engine">) {
  const ev = isElectric(car);
  return DEFAULT_SCHEDULE.filter((i) => !(ev && i.combustionOnly));
}

export type Status = "overdue" | "due-soon" | "ok" | "no-record";

export interface ItemStatus {
  item: MaintenanceItem;
  status: Status;
  lastDone?: { date: string; miles: number };
  dueMiles?: number;
  dueDate?: string;
  milesLeft?: number;
  daysLeft?: number;
}

const DAY = 86_400_000;

export function addMonths(isoDate: string, months: number) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  // Clamp to the last day of the target month (Jan 31 + 1 month = Feb 28/29).
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}

function daysBetween(fromIso: string, toIso: string) {
  return Math.round((Date.parse(toIso) - Date.parse(fromIso)) / DAY);
}

export function todayIso(now = new Date()) {
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())).toISOString().slice(0, 10);
}

/** Latest odometer reading, or undefined if none logged. */
export function currentMiles(car: Pick<Car, "odometer" | "serviceLog">) {
  const readings = [...car.odometer.map((o) => o.miles), ...car.serviceLog.map((s) => s.miles)];
  return readings.length ? Math.max(...readings) : undefined;
}

/** Due when miles OR months run out, whichever comes first. */
export function itemStatus(car: Car, item: MaintenanceItem, today = todayIso()): ItemStatus {
  const done = car.serviceLog
    .filter((s) => s.itemId === item.id)
    .sort((a, b) => b.date.localeCompare(a.date) || b.miles - a.miles)[0];
  if (!done) return { item, status: "no-record" };

  const miles = currentMiles(car) ?? done.miles;
  const out: ItemStatus = { item, status: "ok", lastDone: { date: done.date, miles: done.miles } };

  if (item.everyMiles) {
    out.dueMiles = done.miles + item.everyMiles;
    out.milesLeft = out.dueMiles - miles;
  }
  if (item.everyMonths) {
    out.dueDate = addMonths(done.date, item.everyMonths);
    out.daysLeft = daysBetween(today, out.dueDate);
  }

  const soonMiles = item.everyMiles ? Math.max(500, item.everyMiles * 0.1) : 0;
  const soonDays = item.everyMonths && item.everyMonths <= 1 ? 7 : 30;
  if ((out.milesLeft ?? 1) <= 0 || (out.daysLeft ?? 1) <= 0) out.status = "overdue";
  else if ((out.milesLeft ?? Infinity) <= soonMiles || (out.daysLeft ?? Infinity) <= soonDays) out.status = "due-soon";
  return out;
}

const ORDER: Record<Status, number> = { overdue: 0, "due-soon": 1, "no-record": 2, ok: 3 };

/** Every applicable item with its status, most urgent first. */
export function serviceQueue(car: Car, today = todayIso()) {
  return scheduleFor(car)
    .map((i) => itemStatus(car, i, today))
    .sort((a, b) => ORDER[a.status] - ORDER[b.status] || (a.milesLeft ?? a.daysLeft ?? 0) - (b.milesLeft ?? b.daysLeft ?? 0));
}

/** 0–100. Overdue items cost the most; unlogged items cost a little so the score nudges people to log history. */
export function healthScore(queue: ItemStatus[]) {
  if (!queue.length) return 100;
  const penalty = { overdue: 1, "due-soon": 0.35, "no-record": 0.2, ok: 0 } as const;
  const lost = queue.reduce((sum, s) => sum + penalty[s.status], 0);
  return Math.max(0, Math.round(100 - (lost / queue.length) * 100));
}
