import { describe, expect, it } from "vitest";
// three ships without TypeScript types in this project
// @ts-expect-error untyped module
import { Box3, Vector3 } from "three";
import { buildCar } from "./car-model.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Obj = any;
const CARS = [
  { name: "front-drive sedan", style: "sedan", cylinders: 4, drive: "FWD" },
  { name: "AWD SUV", style: "suv", cylinders: 6, drive: "AWD" },
  { name: "4WD pickup", style: "pickup", cylinders: 8, drive: "4WD" },
];
function underside(opts: Record<string, unknown>) {
  const car = buildCar(opts);
  car.group.updateMatrixWorld(true);
  const byId: Record<string, Obj[]> = {};
  car.chassis.forEach((o: Obj) => { (byId[o.userData.id] = byId[o.userData.id] || []).push(o); });
  return { car, byId };
}
const boxOf = (o: Obj) => new Box3().setFromObject(o);

describe.each(CARS)("the underside of a $name", (c) => {
  const { car, byId } = underside(c);

  it("has one rotor, caliper, pad set and hub at each wheel", () => {
    ["rotors", "calipers", "pads", "bearings"].forEach((id) => expect(byId[id]).toHaveLength(4));
  });

  it("keeps the pads inside their caliper", () => {
    byId.pads.forEach((pads: Obj) => {
      const p = boxOf(pads), centre = p.getCenter(new Vector3());
      const caliper = byId.calipers.map(boxOf).sort((a: Obj, b: Obj) => a.getCenter(new Vector3()).distanceTo(centre) - b.getCenter(new Vector3()).distanceTo(centre))[0];
      expect(caliper.clone().expandByScalar(0.015).containsBox(p)).toBe(true);
    });
  });

  it("puts each caliper on the rim side of its rotor, inside the wheel", () => {
    byId.calipers.forEach((cal: Obj) => {
      const b = boxOf(cal), side = Math.sign(b.getCenter(new Vector3()).z);
      expect(Math.abs(side * b.max.z) <= 0.78 || Math.abs(side * b.min.z) <= 0.78).toBe(true);
    });
  });

  it("stays inside the wheels: nothing pokes out past the wheel centres", () => {
    car.chassis.forEach((o: Obj) => {
      const b = boxOf(o);
      if (o.userData.id === "tailpipe" || o.userData.id === "fneck") return; // these reach the body's outside on purpose
      expect(Math.max(Math.abs(b.min.z), Math.abs(b.max.z))).toBeLessThanOrEqual(0.78);
    });
  });

  it("builds only finite geometry", () => {
    car.chassis.forEach((o: Obj) => {
      const b = boxOf(o);
      [b.min.x, b.min.y, b.min.z, b.max.x, b.max.y, b.max.z].forEach((v) => expect(Number.isFinite(v)).toBe(true));
    });
  });
});

describe("front corner", () => {
  const { byId } = underside(CARS[0]);
  const nearest = (list: Obj[], to: Obj) => list.map(boxOf).sort((a: Obj, b: Obj) => a.getCenter(new Vector3()).distanceTo(to) - b.getCenter(new Vector3()).distanceTo(to))[0];
  it("stands each strut on its knuckle", () => {
    byId.struts.filter((s: Obj) => boxOf(s).getCenter(new Vector3()).x > 0).forEach((strut: Obj) => {
      const s = boxOf(strut), hub = nearest(byId.bearings, s.getCenter(new Vector3()));
      expect(s.min.y).toBeLessThan(hub.max.y); // the clamp overlaps the knuckle's upper arm
      expect(s.intersectsBox(hub)).toBe(true);
    });
  });
  it("keeps the transaxle clear of the struts and springs, piece by piece", () => {
    const pieces = (o: Obj) => { const out: Obj[] = []; o.traverse((m: Obj) => { if (m.isMesh) out.push(boxOf(m)); }); return out; };
    const trans = pieces(byId.trans[0]);
    byId.struts.concat(byId.springs).flatMap(pieces).forEach((b: Obj) => trans.forEach((t: Obj) => expect(t.intersectsBox(b)).toBe(false)));
  });
});

describe("pickup rear", () => {
  const { byId } = underside(CARS[2]);
  it("rides on a live axle with leaf springs: no rear half-shafts", () => {
    expect(byId.cv.every((o: Obj) => boxOf(o).getCenter(new Vector3()).x > 0)).toBe(true);
    expect(byId.rbeam).toHaveLength(1);
    expect(byId.rdiff).toHaveLength(1);
  });
});
