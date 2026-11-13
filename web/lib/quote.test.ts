import { describe, expect, it } from "vitest";
// @ts-expect-error plain JS module without types
import { PARTS } from "./parts.js";
import { LABOR, jobHours, laborHours, quote, quoteLine } from "./quote.js";

describe("labor times", () => {
  it("has a book time for every part", () => {
    const missing = (PARTS as { id: string }[]).filter((p) => !LABOR[p.id]).map((p) => p.id);
    expect(missing).toEqual([]);
  });
  it("uses the longer time on 6- and 8-cylinder engines where there is one", () => {
    expect(laborHours("plugs", { cylinders: 4 })).toBe(1.2);
    expect(laborHours("plugs", { cylinders: "6" })).toBe(2.6);
    expect(laborHours("oil", { cylinders: 8 })).toBe(0.5);
  });
  it("bills extra units of the same job at 60%", () => {
    expect(jobHours("rotors", 2, null)).toBe(0.8);
    expect(jobHours("coils", 4, { cylinders: 4 })).toBe(1.4);
  });
});

describe("quote", () => {
  it("adds parts and labor for one line", () => {
    const l = quoteLine({ id: "alt", qty: 1, tier: 1 }, { rate: 100 });
    expect(l.parts).toBe(220);
    expect(l.labor).toBe(160);
    expect(l.total).toBe(380);
  });
  it("adds paint for body panels and alignment for steering and suspension work", () => {
    expect(quoteLine({ id: "fender", tier: 1 }, { rate: 100 }).extras[0].amount).toBe(250 + 2.5 * 45);
    expect(quoteLine({ id: "tierods", tier: 1 }, { rate: 100 }).extras.map((e) => e.label)).toEqual(["Wheel alignment"]);
  });
  it("charges one alignment per visit, supplies capped, and tax on parts only", () => {
    const q = quote([{ id: "tierods", tier: 0 }, { id: "carms", tier: 0 }, { id: "rack", tier: 0 }], { rate: 150, tax: 10 });
    expect(q.lines.flatMap((l) => l.extras).length).toBe(1);
    expect(q.supplies).toBe(45);
    expect(q.tax).toBe(Math.round(q.parts * 10) / 100);
    expect(q.total).toBeCloseTo(q.parts + q.labor + q.supplies + q.tax, 2);
    expect(q.hours).toBe(1 + 1.3 + 4 + 1);
  });
  it("is empty for no items and skips unknown parts", () => {
    expect(quote([{ id: "nope" }], { rate: 140 }).total).toBe(0);
  });
});
