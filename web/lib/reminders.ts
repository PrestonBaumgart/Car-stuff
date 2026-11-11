// Expiration reminders for insurance and registration: status for the app, and calendar files (.ics) with
// alarms so the owner's own calendar reminds them even when the app is closed. There's no server yet, so the
// calendar is the reminder that works away from the app; the app shows the same dates whenever it's open.
import { carTitle, fmtDate } from "./format";
import { todayIso } from "./maintenance";
import type { Car } from "./types";

/** How many days before expiry the app starts warning. */
export const WARN_DAYS = 30;

export type DocStatus = "none" | "ok" | "due-soon" | "expired";

export interface DocState {
  status: DocStatus;
  /** Days until it expires (negative once expired). Undefined when there's no date. */
  daysLeft?: number;
  expires?: string;
}

const DAY = 86400000;

export function docState(expires: string | undefined, today = todayIso()): DocState {
  if (!expires || !/^\d{4}-\d{2}-\d{2}$/.test(expires)) return { status: "none" };
  const daysLeft = Math.round((Date.parse(expires) - Date.parse(today)) / DAY);
  const status: DocStatus = daysLeft < 0 ? "expired" : daysLeft <= WARN_DAYS ? "due-soon" : "ok";
  return { status, daysLeft, expires };
}

/** "Expires in 12 days", "Expires today", "Expired 3 days ago". */
export function docLabel(s: DocState) {
  if (s.daysLeft == null) return "No date set";
  const n = Math.abs(s.daysLeft), days = `${n} day${n === 1 ? "" : "s"}`;
  if (s.daysLeft === 0) return "Expires today";
  return s.daysLeft > 0 ? `Expires in ${days}` : `Expired ${days} ago`;
}

export type DocKind = "insurance" | "registration";
export const DOC_NAME: Record<DocKind, string> = { insurance: "Insurance", registration: "Registration" };

export interface DueDoc {
  car: Car;
  kind: DocKind;
  state: DocState;
}

/** Every insurance policy and registration that's expired or within WARN_DAYS, soonest first. */
export function dueDocs(cars: Car[], today = todayIso()): DueDoc[] {
  const out: DueDoc[] = [];
  for (const car of cars) {
    for (const kind of ["insurance", "registration"] as DocKind[]) {
      const state = docState(car[kind]?.expires, today);
      if (state.status === "due-soon" || state.status === "expired") out.push({ car, kind, state });
    }
  }
  return out.sort((a, b) => (a.state.daysLeft ?? 0) - (b.state.daysLeft ?? 0));
}

const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
const icsDate = (iso: string) => iso.replace(/-/g, "");

/**
 * A calendar file for one expiration: an all-day event on the expiry date with alarms 30 days, 7 days and
 * 1 day before. Opening it adds the event to Apple Calendar, Google Calendar or Outlook.
 */
export function expiryIcs(car: Car, kind: DocKind, now = new Date()) {
  const doc = car[kind];
  if (!doc?.expires) return null;
  const name = carTitle(car);
  const what = kind === "insurance" ? `Car insurance${car.insurance?.company ? ` (${car.insurance.company})` : ""}` : `Registration${car.registration?.plate ? ` (${car.registration.plate})` : ""}`;
  const title = `${what} expires: ${name}`;
  const details = kind === "insurance"
    ? `Your ${name} insurance${car.insurance?.policy ? ` policy ${car.insurance.policy}` : ""} expires ${fmtDate(doc.expires)}. Renew it or confirm it auto-renews.${car.insurance?.phone ? ` Insurer: ${car.insurance.phone}.` : ""}`
    : `Your ${name} registration${car.registration?.state ? ` in ${car.registration.state}` : ""} expires ${fmtDate(doc.expires)}. Renew it online or at the DMV; some states need an inspection or emissions test first.`;
  const end = new Date(Date.parse(doc.expires) + DAY).toISOString().slice(0, 10);
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const alarm = (days: number) => [
    "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${icsText(title)}`, `TRIGGER:-P${days}D`, "END:VALARM",
  ];
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Vinsight//Garage//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${kind}-${car.vin}-${icsDate(doc.expires)}@vinsight`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${icsDate(doc.expires)}`,
    `DTEND;VALUE=DATE:${icsDate(end)}`,
    `SUMMARY:${icsText(title)}`,
    `DESCRIPTION:${icsText(details)}`,
    ...alarm(30), ...alarm(7), ...alarm(1),
    "END:VEVENT", "END:VCALENDAR", "",
  ].join("\r\n");
}

/** Save the calendar file in the browser. */
export function downloadIcs(car: Car, kind: DocKind) {
  const ics = expiryIcs(car, kind);
  if (!ics) return;
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${kind}-${(car.registration?.plate || car.vin).replace(/\W+/g, "")}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
