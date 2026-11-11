import { describe, expect, it } from "vitest";
import { partHealth } from "./part-health";
import type { Car } from "./types";

const car = (log: Car["serviceLog"], miles: number): Car => ({
  vin: "V", year: "2020", make: "KIA", model: "Soul", trim: null, bodyClass: null,
  engine: { displacement: null, cylinders: "4", fuel: "Gasoline" }, drive: null, transmission: null,
  addedAt: "2026-01-01", odometer: [{ date: "2026-11-11", miles }], serviceLog: log, specs: {},
});

describe("partHealth", () => {
  it("is green right after a service", () => {
    const h = partHealth(car([{ itemId: "oil", date: "2026-11-01", miles: 40000 }], 40200), "2026-11-11");
    expect(h.oil.status).toBe("good");
  });
  it("turns orange past 60% of the interval", () => {
    const h = partHealth(car([{ itemId: "oil", date: "2026-08-01", miles: 40000 }], 43500), "2026-11-11");
    expect(h.oil.status).toBe("watch");
  });
  it("turns red when overdue", () => {
    const h = partHealth(car([{ itemId: "oil", date: "2026-01-01", miles: 40000 }], 46200), "2026-11-11");
    expect(h.oil).toMatchObject({ status: "replace" });
    expect(h.oil.note).toMatch(/overdue by 1,200 mi/);
  });
  it("is gray with no record", () => {
    expect(partHealth(car([], 40000), "2026-11-11").plugs.status).toBe("unknown");
  });
  it("uses the worst status when two services cover one part", () => {
    const h = partHealth(car([
      { itemId: "tire-rotation", date: "2026-11-01", miles: 40000 },
      { itemId: "tire-pressure", date: "2026-08-01", miles: 38000 },
    ], 40100), "2026-11-11");
    expect(h.tires.status).toBe("replace");
  });
});
