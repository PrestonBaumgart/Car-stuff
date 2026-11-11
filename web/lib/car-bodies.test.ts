import { describe, expect, it } from "vitest";
import { CAR_BODIES, bodyFor } from "./car-bodies.js";

function keyFor(make: string, model: string, year?: string | number | null) {
  return bodyFor({ make, model, year })?.key ?? null;
}

describe("bodyFor", () => {
  it("finds common cars by make, model and year", () => {
    expect(keyFor("FORD", "F-150", "2018")).toBe("f150");
    expect(keyFor("TOYOTA", "RAV4", 2021)).toBe("rav4");
    expect(keyFor("TOYOTA", "Camry", "2020")).toBe("camry");
    expect(keyFor("CHEVROLET", "Silverado", "2022")).toBe("silverado");
    expect(keyFor("GMC", "Sierra 1500", "2024")).toBe("sierra");
    expect(keyFor("JEEP", "Grand Cherokee", "2015")).toBe("grandcherokee");
    expect(keyFor("MAZDA", "CX-5", "2019")).toBe("cx5");
  });

  it("ignores case, spaces and punctuation", () => {
    expect(keyFor("ford", "F150", "2018")).toBe("f150");
    expect(keyFor("Ford", "f-150 supercrew", "2018")).toBe("f150");
    expect(keyFor("HONDA", "CR-V", "2020")).toBe("crv2022");
    expect(keyFor("honda", "crv", "2020")).toBe("crv2022");
  });

  it("accepts the longer model names vPIC returns", () => {
    expect(keyFor("CHEVROLET", "Silverado 1500 LT", "2021")).toBe("silverado");
    expect(keyFor("TESLA", "Model 3 Long Range", "2020")).toBe("model3");
  });

  it("splits the CR-V generations at 2023", () => {
    expect(keyFor("HONDA", "CR-V", "2022")).toBe("crv2022");
    expect(keyFor("HONDA", "CR-V", "2023")).toBe("crv2025");
  });

  it("finds Ram trucks by model number, under RAM or DODGE", () => {
    expect(keyFor("RAM", "1500", "2021")).toBe("ram1500");
    expect(keyFor("RAM", "Ram 2500", "2020")).toBe("ram1500");
    expect(keyFor("DODGE", "Ram 1500", "2019")).toBe("ram1500");
  });

  it("does not match a Ram model number under another make", () => {
    expect(keyFor("CHEVROLET", "1500", "2021")).toBeNull();
  });

  it("uses the nearest generation within four years, and nothing beyond", () => {
    expect(keyFor("HYUNDAI", "Tucson", "2025")).toBe("tucson");
    expect(keyFor("HYUNDAI", "Tucson", "2026")).toBeNull();
    expect(keyFor("HONDA", "CR-V", "2013")).toBe("crv2022");
    expect(keyFor("HONDA", "CR-V", "2012")).toBeNull();
  });

  it("uses the newest generation when the year is missing or invalid", () => {
    expect(keyFor("HONDA", "CR-V")).toBe("crv2025");
    expect(keyFor("HONDA", "CR-V", "")).toBe("crv2025");
    expect(keyFor("HONDA", "CR-V", "unknown")).toBe("crv2025");
  });

  it("returns null for cars it has no model for", () => {
    expect(keyFor("KIA", "Soul", "2021")).toBeNull();
    expect(keyFor("FORD", "Mustang", "2020")).toBeNull();
    expect(keyFor("", "", "2020")).toBeNull();
    expect(bodyFor(null)).toBeNull();
  });

  it("does not confuse the Model 3 with the Model Y", () => {
    expect(keyFor("TESLA", "Model 3", "2021")).toBe("model3");
    expect(keyFor("TESLA", "Model Y", "2021")).toBe("modely");
  });
});

describe("CAR_BODIES", () => {
  it("names each file after its key and credits a source", () => {
    for (const entry of CAR_BODIES) {
      expect(entry.file).toBe(entry.key + ".glb");
      expect(entry.url).toMatch(/^https:\/\/sketchfab\.com\/3d-models\//);
      expect(entry.author).not.toBe("");
      expect(entry.years[0]).toBeLessThanOrEqual(entry.years[1]);
    }
  });

  it("uses each key once", () => {
    const keys = CAR_BODIES.map((entry) => entry.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("bodyFor, versions with a different body", () => {
  it("skips heavy-duty, electric and Classic versions of a matched name", () => {
    expect(bodyFor({ year: 2022, make: "CHEVROLET", model: "Silverado 2500HD" })).toBeNull();
    expect(bodyFor({ year: 2024, make: "CHEVROLET", model: "Silverado EV" })).toBeNull();
    expect(bodyFor({ year: 2022, make: "GMC", model: "Sierra 3500HD" })).toBeNull();
    expect(bodyFor({ year: 2022, make: "FORD", model: "F-150 Lightning" })).toBeNull();
    expect(bodyFor({ year: 2021, make: "RAM", model: "1500 Classic" })).toBeNull();
  });

  it("still matches the regular versions", () => {
    expect(bodyFor({ year: 2022, make: "CHEVROLET", model: "Silverado 1500" })?.key).toBe("silverado");
    expect(bodyFor({ year: 2021, make: "RAM", model: "1500" })?.key).toBe("ram1500");
    expect(bodyFor({ year: 2020, make: "TESLA", model: "Model Y" })?.key).toBe("modely");
  });
});
