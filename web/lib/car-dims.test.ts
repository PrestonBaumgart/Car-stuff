import { describe, expect, it } from "vitest";
// three ships without TypeScript types in this project
// @ts-expect-error untyped module
import { Box3, Vector3 } from "three";
import { dimsFor } from "./car-dims.js";
import { buildCar, styleFor } from "./car-model.js";

const SUV = "Sport Utility Vehicle [SUV]/Multipurpose Vehicle [MPV]";

describe("dimsFor", () => {
  it("finds the owner's cars by make, model and year", () => {
    expect(dimsFor({ make: "KIA", model: "Soul", year: "2021" })).toMatchObject({ length: 4.195, width: 1.8, height: 1.615, wheelbase: 2.6 });
    expect(dimsFor({ make: "KIA", model: "Forte", year: "2016" })).toMatchObject({ length: 4.56, wheelbase: 2.7 });
  });
  it("picks the right generation", () => {
    expect(dimsFor({ make: "Kia", model: "Soul", year: "2016" })?.length).toBe(4.14);
  });
  it("uses NHTSA's wheelbase (inches) when it has one", () => {
    expect(dimsFor({ make: "Kia", model: "Niro", year: "2020", wheelbase: "106.30" })?.wheelbase).toBeCloseTo(2.7, 2);
    expect(dimsFor({ make: "Nobody", model: "Unknown", year: "2020", wheelbase: "110" })).toEqual({ wheelbase: 2.794 });
  });
  it("returns null for unknown cars", () => {
    expect(dimsFor({ make: "Nobody", model: "Unknown", year: "2020" })).toBeNull();
  });
});

describe("fitted bodies match the real size", () => {
  it.each([
    ["Kia", "Soul", "2021", SUV],
    ["Kia", "Forte", "2016", "Sedan/Saloon"],
    ["Ford", "F-150", "2020", "Pickup"],
    ["Honda", "Odyssey", "2020", "Minivan"],
  ])("%s %s %s", (make, model, year, bodyClass) => {
    const dims = dimsFor({ make, model, year })!;
    const built = buildCar({ style: styleFor(bodyClass), dims, cylinders: 4 });
    built.group.updateMatrixWorld(true);
    const box = new Box3();
    built.body.concat(built.panels.filter((p) => !["mirrors", "tires", "wheels", "antenna", "rails"].includes(p.userData.id))).forEach((o) => box.expandByObject(o));
    const size = box.getSize(new Vector3());
    expect(size.x / dims.length!).toBeCloseTo(1, 1);
    expect(size.z / dims.width!).toBeCloseTo(1, 1);
    expect(box.max.y / dims.height!).toBeCloseTo(1, 1);
  });
});
