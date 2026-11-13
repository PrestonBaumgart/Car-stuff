import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BODY_NOTE, CAR_BODIES, bodyFor } from "./car-bodies.js";

const SUV = "Sport Utility Vehicle (SUV)/Multi-Purpose Vehicle (MPV)";
const CUV = "Crossover Utility Vehicle (CUV)";

function key(vehicle: Parameters<typeof bodyFor>[0]) {
  return bodyFor(vehicle).key;
}

describe("bodyFor, by body class", () => {
  it.each([
    ["Sedan/Saloon", "sedan"],
    ["Hatchback/Liftback/Notchback", "hatchback"],
    ["Coupe", "coupe"],
    ["Convertible/Cabriolet", "coupe"],
    ["Roadster", "sports"],
    ["Wagon", "wagon"],
    [SUV, "suv"],
    [CUV, "compact-suv"],
    ["Pickup", "pickup"],
    ["Sport Utility Truck (SUT)", "pickup"],
    ["Truck", "pickup"],
    ["Minivan", "minivan"],
    ["Van", "van"],
    ["Cargo Van", "van"],
    ["Step Van/Walk-in Van", "van"],
    ["Limousine", "large-sedan"],
  ])("%s with no size data -> %s", (bodyClass, expected) => {
    expect(key({ bodyClass, make: "NOBODY", model: "Unknown", year: "2020" })).toBe(expected);
  });

  it("treats a two-door sedan as a coupe", () => {
    expect(key({ bodyClass: "Sedan/Saloon", doors: "2" })).toBe("coupe");
  });

  it("ignores case", () => {
    expect(key({ bodyClass: "PICKUP" })).toBe("pickup");
  });
});

describe("bodyFor, fallbacks", () => {
  it("uses the sedan when the body class is null, empty or missing", () => {
    expect(key({ bodyClass: null })).toBe("sedan");
    expect(key({ bodyClass: "" })).toBe("sedan");
    expect(key({ make: "TOYOTA", model: "Camry" })).toBe("sedan");
  });

  it("uses the sedan for values it does not know, or no vehicle at all", () => {
    expect(key({ bodyClass: "Bus" })).toBe("sedan");
    expect(key({ bodyClass: "Something New" })).toBe("sedan");
    expect(key(null)).toBe("sedan");
    expect(key(undefined)).toBe("sedan");
  });
});

describe("bodyFor, size splits", () => {
  it("splits sedans by length", () => {
    expect(key({ bodyClass: "Sedan/Saloon", make: "KIA", model: "Rio", year: "2020" })).toBe("compact"); // 4.42 m
    expect(key({ bodyClass: "Sedan/Saloon", make: "TOYOTA", model: "Corolla", year: "2020" })).toBe("sedan"); // 4.63 m
    expect(key({ bodyClass: "Sedan/Saloon", make: "TOYOTA", model: "Camry", year: "2020" })).toBe("sedan"); // 4.885 m
  });

  it("calls a very long sedan a large sedan", () => {
    expect(key({ bodyClass: "Sedan/Saloon", make: "KIA", model: "Stinger", year: "2020" })).toBe("sedan"); // 4.83 m
    expect(key({ bodyClass: "Sedan/Saloon", make: "NOBODY", model: "Unknown", year: "2020", wheelbase: "125" })).toBe("sedan"); // no length: stays sedan
    expect(key({ bodyClass: "Sedan/Saloon", make: "FORD", model: "F-150", year: "2020" })).toBe("large-sedan"); // 5.89 m, only to exercise the cut-off
  });

  it("splits SUVs by length", () => {
    expect(key({ bodyClass: CUV, make: "TOYOTA", model: "RAV4", year: "2021" })).toBe("compact-suv"); // 4.6 m
    expect(key({ bodyClass: SUV, make: "HONDA", model: "CR-V", year: "2020" })).toBe("compact-suv"); // 4.585 m
    expect(key({ bodyClass: SUV, make: "TOYOTA", model: "Highlander", year: "2021" })).toBe("suv"); // 4.95 m
    expect(key({ bodyClass: SUV, make: "KIA", model: "Telluride", year: "2021" })).toBe("suv"); // 5.0 m
  });

  it("falls back to wheelbase for an SUV of unknown length", () => {
    expect(key({ bodyClass: SUV, make: "NOBODY", model: "Unknown", wheelbase: "114.2" })).toBe("suv");
    expect(key({ bodyClass: SUV, make: "NOBODY", model: "Unknown", wheelbase: "104" })).toBe("compact-suv");
  });

  it("calls a short, tall, boxy SUV an off-roader", () => {
    expect(key({ bodyClass: SUV, make: "TOYOTA", model: "4Runner", year: "2020" })).toBe("offroad"); // 4.83 x 1.795 m
    expect(key({ bodyClass: SUV, make: "KIA", model: "Soul", year: "2021" })).toBe("compact-suv"); // short but only 1.6 m tall
  });

  it("calls a low coupe a sports car", () => {
    expect(key({ bodyClass: "Coupe", make: "KIA", model: "Forte Koup", year: "2015" })).toBe("coupe"); // 1.42 m
    expect(key({ bodyClass: "Coupe", make: "HONDA", model: "Accord", year: "2005" })).toBe("coupe"); // 1.417 m
    expect(key({ bodyClass: "Coupe", make: "CHEVROLET", model: "Camaro", year: "2020" })).toBe("sports"); // 1.349 m
    expect(key({ bodyClass: "Coupe", make: "FORD", model: "Mustang", year: "2018" })).toBe("coupe"); // 1.387 m is just over the cut-off
  });
});

describe("CAR_BODIES", () => {
  it("has the thirteen types, each with a generic file, a credit and a model file on disk", () => {
    expect(CAR_BODIES.map((e) => e.key)).toEqual([
      "compact", "sedan", "large-sedan", "hatchback", "coupe", "sports", "wagon",
      "compact-suv", "suv", "offroad", "minivan", "pickup", "van",
    ]);
    for (const entry of CAR_BODIES) {
      expect(entry.file).toBe(`generic/${entry.key}.glb`);
      expect(entry.title && entry.author).toBeTruthy();
      expect(entry.url).toMatch(/^https:\/\/sketchfab\.com\/3d-models\//);
      expect(existsSync(new URL(`../public/parts/cars/${entry.file}`, import.meta.url))).toBe(true);
    }
  });

  it("has a plain label for the UI", () => {
    expect(BODY_NOTE).toBe("Shown on a car like yours");
  });
});
