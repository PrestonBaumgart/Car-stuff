import { describe, expect, it } from "vitest";
import { styleFor } from "./car-model.js";

// NHTSA body class strings, as vPIC returns them.
const SUV = "Sport Utility Vehicle [SUV]/Multipurpose Vehicle [MPV]";
const HATCH = "Hatchback/Liftback/Notchback";

describe("styleFor", () => {
  it.each([
    ["Sedan/Saloon", {}, "sedan"],
    ["Sedan/Saloon", { doors: "2" }, "coupe"],
    ["Coupe", {}, "coupe"],
    ["Convertible/Cabriolet", {}, "convertible"],
    ["Roadster", {}, "roadster"],
    [HATCH, { doors: "5" }, "hatchback"],
    [HATCH, { doors: "3" }, "hatch3"],
    [HATCH, {}, "hatchback"],
    ["Wagon", {}, "wagon"],
    [SUV, {}, "crossover"], // Soul, Seltos: NHTSA leaves wheelbase blank
    [SUV, { wheelbase: "106.30" }, "crossover"], // Niro
    [SUV, { wheelbase: "114.2" }, "suv"], // Telluride-size
    ["Crossover Utility Vehicle [CUV]", {}, "crossover"],
    ["Minivan", {}, "minivan"],
    ["Van", {}, "van"],
    ["Cargo Van", {}, "van"],
    ["Step Van/Walk-in Van", {}, "van"],
    ["Pickup", {}, "pickup"],
    ["Sport Utility Truck [SUT]", {}, "pickup"],
    ["Limousine", {}, "limo"],
    ["", {}, "sedan"],
    [null, {}, "sedan"],
  ])("%s %j → %s", (bodyClass, extra, style) => {
    expect(styleFor(bodyClass, extra)).toBe(style);
  });
});
