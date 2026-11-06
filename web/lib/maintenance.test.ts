import { describe, expect, it } from "vitest";
import { addMonths, healthScore, itemStatus, scheduleFor, serviceQueue, DEFAULT_SCHEDULE } from "./maintenance";
import { validateVin } from "./nhtsa";
import type { Car } from "./types";

const oil = DEFAULT_SCHEDULE.find((i) => i.id === "oil")!;

function car(overrides: Partial<Car> = {}): Car {
  return {
    vin: "1HGCM82633A004352",
    year: "2003", make: "HONDA", model: "Accord", trim: null, bodyClass: null,
    engine: { displacement: "3.0L", cylinders: "6", fuel: "Gasoline" },
    drive: null, transmission: null,
    addedAt: "2026-01-01", odometer: [], serviceLog: [], specs: {},
    ...overrides,
  };
}

describe("addMonths", () => {
  it("clamps to the end of shorter months", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2028-01-31", 1)).toBe("2028-02-29");
  });
  it("rolls over years", () => {
    expect(addMonths("2026-09-15", 6)).toBe("2027-03-15");
  });
});

describe("itemStatus", () => {
  it("has no record until the service is logged", () => {
    expect(itemStatus(car(), oil, "2026-06-01").status).toBe("no-record");
  });

  it("is due when miles run out first", () => {
    const c = car({ serviceLog: [{ itemId: "oil", date: "2026-05-01", miles: 50000 }], odometer: [{ date: "2026-06-01", miles: 55200 }] });
    const s = itemStatus(c, oil, "2026-06-01");
    expect(s.status).toBe("overdue");
    expect(s.milesLeft).toBe(-200);
  });

  it("is due when months run out first", () => {
    const c = car({ serviceLog: [{ itemId: "oil", date: "2026-01-01", miles: 50000 }], odometer: [{ date: "2026-07-02", miles: 51000 }] });
    expect(itemStatus(c, oil, "2026-07-02").status).toBe("overdue");
  });

  it("is due soon inside the warning window", () => {
    const c = car({ serviceLog: [{ itemId: "oil", date: "2026-05-01", miles: 50000 }], odometer: [{ date: "2026-06-01", miles: 54600 }] });
    expect(itemStatus(c, oil, "2026-06-01").status).toBe("due-soon");
  });

  it("uses the most recent service", () => {
    const c = car({
      serviceLog: [
        { itemId: "oil", date: "2026-05-01", miles: 55000 },
        { itemId: "oil", date: "2025-11-01", miles: 50000 },
      ],
      odometer: [{ date: "2026-06-01", miles: 56000 }],
    });
    expect(itemStatus(c, oil, "2026-06-01")).toMatchObject({ status: "ok", dueMiles: 60000 });
  });
});

describe("schedule", () => {
  it("drops oil and plugs for electric cars", () => {
    const ids = scheduleFor(car({ engine: { displacement: null, cylinders: null, fuel: "Electric" } })).map((i) => i.id);
    expect(ids).not.toContain("oil");
    expect(ids).not.toContain("spark-plugs");
    expect(ids).toContain("tire-rotation");
  });

  it("puts overdue items first and lowers the score", () => {
    const c = car({ serviceLog: [{ itemId: "oil", date: "2025-01-01", miles: 40000 }], odometer: [{ date: "2026-06-01", miles: 60000 }] });
    const q = serviceQueue(c, "2026-06-01");
    expect(q[0].item.id).toBe("oil");
    expect(q[0].status).toBe("overdue");
    expect(healthScore(q)).toBeLessThan(healthScore(serviceQueue(car(), "2026-06-01")));
  });
});

describe("validateVin", () => {
  it("accepts a valid VIN", () => {
    expect(validateVin("1hgcm82633a004352")).toEqual({ ok: true, vin: "1HGCM82633A004352", checkDigitValid: true });
  });
  it("flags a bad check digit", () => {
    expect(validateVin("1HGCM82643A004352")).toMatchObject({ ok: true, checkDigitValid: false });
  });
  it("rejects I, O and Q", () => {
    expect(validateVin("1HGCM8263OA004352").ok).toBe(false);
  });
});
