import { describe, expect, it } from "vitest";
import { docLabel, docState, dueDocs, expiryIcs } from "./reminders";
import type { Car } from "./types";

const car = (extra: Partial<Car> = {}): Car => ({
  vin: "KNDJ23AU0L7000001", year: "2020", make: "KIA", model: "Soul", trim: null, bodyClass: null,
  engine: { displacement: null, cylinders: null, fuel: null }, drive: null, transmission: null,
  addedAt: "2026-01-01", odometer: [], serviceLog: [], specs: {}, ...extra,
});

describe("docState", () => {
  it("is none without a date", () => expect(docState(undefined).status).toBe("none"));
  it("is ok more than 30 days out", () => expect(docState("2027-01-15", "2026-11-11")).toMatchObject({ status: "ok", daysLeft: 65 }));
  it("warns within 30 days", () => expect(docState("2026-12-11", "2026-11-11")).toMatchObject({ status: "due-soon", daysLeft: 30 }));
  it("is expired after the date", () => expect(docState("2026-11-08", "2026-11-11")).toMatchObject({ status: "expired", daysLeft: -3 }));
  it("labels days", () => {
    expect(docLabel(docState("2026-11-12", "2026-11-11"))).toBe("Expires in 1 day");
    expect(docLabel(docState("2026-11-11", "2026-11-11"))).toBe("Expires today");
    expect(docLabel(docState("2026-11-08", "2026-11-11"))).toBe("Expired 3 days ago");
  });
});

describe("dueDocs", () => {
  it("lists only expired and soon-due documents, soonest first", () => {
    const cars = [
      car({ vin: "A", insurance: { expires: "2026-11-30" }, registration: { expires: "2027-06-01" } }),
      car({ vin: "B", registration: { expires: "2026-11-01" } }),
    ];
    expect(dueDocs(cars, "2026-11-11").map((d) => `${d.car.vin}:${d.kind}`)).toEqual(["B:registration", "A:insurance"]);
  });
});

describe("expiryIcs", () => {
  it("makes an all-day event with 30, 7 and 1 day alarms", () => {
    const ics = expiryIcs(car({ registration: { plate: "ABC123", state: "WA", expires: "2027-03-31" } }), "registration")!;
    expect(ics).toContain("DTSTART;VALUE=DATE:20270331");
    expect(ics).toContain("DTEND;VALUE=DATE:20270401");
    expect(ics).toContain("SUMMARY:Registration (ABC123) expires: 2020 KIA Soul");
    for (const d of [30, 7, 1]) expect(ics).toContain(`TRIGGER:-P${d}D`);
  });
  it("is null without a date", () => expect(expiryIcs(car(), "insurance")).toBeNull());
});
