import { existsSync, readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
// three ships without TypeScript types in this project
// @ts-expect-error untyped module
import * as THREE from "three";
import { applyEngineModels, enginePlan, fitAligned, fitCam, fitCrank, fitManifold, fitOrigin, fitPiston, fitRod, fitStanding, isInline4 } from "./engine-models.js";
import { buildEngine } from "./car-model.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const box = (min: number[], max: number[]) => new THREE.Box3(new THREE.Vector3(...min), new THREE.Vector3(...max));
const at = (m: THREE.Matrix4, v: THREE.Vector3) => v.clone().applyMatrix4(m);
const close = (a: THREE.Vector3, b: THREE.Vector3) => expect(a.distanceTo(b)).toBeLessThan(1e-6);
// buildEngine draws the head gasket on a canvas
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildEngineQuiet(spec: any) {
  const ctx: unknown = new Proxy(function () {}, { get: () => ctx, apply: () => ctx, set: () => true });
  vi.stubGlobal("document", { createElement: () => ({ getContext: () => ctx }) });
  try { return buildEngine(spec); } finally { vi.unstubAllGlobals(); }
}

describe("fitPiston", () => {
  const model = box([-1, -1.2, -0.9], [1, 1.2, 0.9]); // diameter 2 along X
  const target = box([-0.038, -0.013, -0.04], [0.038, 0.043, 0.04]);
  it("matches the code piston diameter, uniformly, centred on it", () => {
    const m = fitPiston(model, target);
    const s = new THREE.Vector3().setFromMatrixScale(m);
    expect(s.x).toBeCloseTo(0.038);
    expect(s.y).toBeCloseTo(s.x);
    expect(s.z).toBeCloseTo(s.x);
    close(at(m, model.getCenter(new THREE.Vector3())), target.getCenter(new THREE.Vector3()));
  });
  it("adds no rotation, so the part's own lean carries through", () => {
    const m = fitPiston(model, target);
    const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().extractRotation(m));
    expect(q.angleTo(new THREE.Quaternion())).toBeCloseTo(0);
    const lean = 0.3, holder = new THREE.Group();
    holder.rotation.z = -lean; holder.updateMatrixWorld(true);
    const crownWorld = new THREE.Vector3(0, 1, 0).transformDirection(m).transformDirection(holder.matrixWorld);
    expect(Math.atan2(crownWorld.x, crownWorld.y)).toBeCloseTo(lean);
  });
});

describe("fitRod", () => {
  const model = box([-0.3, 0, -0.1], [0.3, 4, 0.1]); // big end 0.6 wide at the bottom, long axis +Y
  const pin = new THREE.Vector3(0.02, -0.1, 0.1), wrist = new THREE.Vector3(0.03, 0.07, 0.1);
  it("puts the big end on the pin and the small end on the wrist pin", () => {
    const m = fitRod(model, pin, wrist);
    const big = new THREE.Vector3(0, 0.3, 0), small = new THREE.Vector3(0, 4 - 0.18, 0);
    close(at(m, big), pin);
    close(at(m, small), wrist);
    expect(at(m, small).distanceTo(at(m, big))).toBeCloseTo(pin.distanceTo(wrist));
  });
  it("keeps the crank pin axis along Z", () => {
    const m = fitRod(model, pin, wrist);
    const z = new THREE.Vector3(0, 0, 1).transformDirection(m);
    expect(Math.abs(z.z)).toBeCloseTo(1);
  });
});

describe("fitStanding", () => {
  it("stands a valve on the code valve's bottom, scaled to its height", () => {
    const model = box([-0.5, -1, -0.5], [0.5, 9, 0.5]), target = box([-0.013, 0.0015, -0.013], [0.013, 0.0875, 0.013]);
    const m = fitStanding(model, target);
    close(at(m, new THREE.Vector3(0, -1, 0)), new THREE.Vector3(0, 0.0015, 0));
    close(at(m, new THREE.Vector3(0, 9, 0)), new THREE.Vector3(0, 0.0875, 0));
  });
});

describe("fitCrank", () => {
  const model = { spacing: 1, throw: 0.32 }, code = { spacing: 0.14, throw: 0.04, axisY: -0.12, flywheelZ: 1 };
  // the model's crank pins: cylinders 1 and 4 up, 2 and 3 down
  const pins = [-1.5, -0.5, 0.5, 1.5].map((z, i) => new THREE.Vector3(0, i === 0 || i === 3 ? 0.32 : -0.32, z));
  it("lands every crank pin where buildEngine put that cylinder's rod journal", () => {
    const m = fitCrank(model, code);
    const want = [-0.21, -0.07, 0.07, 0.21].map((z, i) => new THREE.Vector3(0, -0.12 + (i === 0 || i === 3 ? 0.04 : -0.04), z));
    pins.forEach((p, i) => close(at(m, p), want[i]));
  });
  it("turns the flywheel to the other end without moving the pins off their cylinders", () => {
    const m = fitCrank(model, { ...code, flywheelZ: -1 });
    expect(at(m, new THREE.Vector3(0, 0, 2.4)).z).toBeLessThan(0);
    const got = pins.map((p) => at(m, p)).sort((a, b) => a.z - b.z);
    expect(got.map((p) => Math.round(p.y * 1000))).toEqual([-80, -160, -160, -80]);
  });
  it("matches the real build: an inline 4's crank record lines up with its rods", () => {
    const e = buildEngineQuiet({ cylinders: 4, year: 2020 });
    const crank = e.inside.find((o: any) => o.userData.id === "crank");
    const rods = e.inside.filter((o: any) => o.userData.id === "rods");
    const m = fitCrank(model, crank.userData.crank);
    const pinsWorld = pins.map((p) => at(m, p));
    rods.forEach((r: any) => { const pin = r.userData.pin.clone().applyMatrix4(r.matrix); expect(Math.min(...pinsWorld.map((p) => p.distanceTo(pin)))).toBeLessThan(1e-6); });
  });
});

describe("fitCam, fitManifold, fitOrigin, fitAligned", () => {
  it("spaces a cam's lobe groups one cylinder apart and keeps it no fatter than the code cam", () => {
    const m = fitCam({ spacing: 1, radius: 0.2256 }, { spacing: 0.14, radius: 0.022 });
    close(at(m, new THREE.Vector3(0, 0, 1.5)), new THREE.Vector3(0, 0, 0.21));
    expect(at(m, new THREE.Vector3(0, 0.2256, 0)).y).toBeCloseTo(0.022);
  });
  it("puts the manifold flanges on the head ports and turns them toward the head", () => {
    const m = fitManifold({ spacing: 1 }, { at: [-0.15, 0.2, 0], head: 1, spacing: 0.14 });
    close(at(m, new THREE.Vector3(0, 0, 1.5)), new THREE.Vector3(-0.15, 0.2, 0.21));
    const flip = fitManifold({ spacing: 1 }, { at: [0.27, 0.2, 0], head: -1, spacing: 0.14 });
    expect(new THREE.Vector3(1, 0, 0).transformDirection(flip).x).toBeCloseTo(-1);
  });
  it("lands a model anchor on the code anchor at the given size", () => {
    const m = fitOrigin([0, 0, 0.07], 0.15);
    close(at(m, new THREE.Vector3(0, 0, 0)), new THREE.Vector3(0, 0, 0.07));
    close(at(m, new THREE.Vector3(0.5, 0, 0)), new THREE.Vector3(0.075, 0, 0.07));
  });
  it("sizes a part along one axis, centred", () => {
    const m = fitAligned(box([-1, -0.5, -0.5], [1, 0.5, 0.5]), box([-0.075, -0.045, -0.045], [0.115, 0.085, 0.045]), "x");
    close(at(m, new THREE.Vector3(1, 0, 0)), new THREE.Vector3(0.115, 0.02, 0));
  });
});

describe("engine files", () => {
  const credits = readFileSync(new URL("../public/parts/ATTRIBUTION.md", import.meta.url), "utf8");
  const files = [...new Set([4, 6].flatMap((n) => enginePlan({ cylinders: n }).map((p) => p.file)))];
  it.each(files)("%s is shipped and credited", (file) => {
    expect(existsSync(new URL(`../public/parts/engine/${file}`, import.meta.url))).toBe(true);
    expect(credits).toContain(file);
  });
});

describe("inline-4-only rules", () => {
  const only = ["crank", "cam", "manifold"];
  it("fits them for an inline 4", () => {
    const ids = enginePlan({ cylinders: 4 }).map((p) => p.id);
    only.forEach((id) => expect(ids).toContain(id));
  });
  it.each([3, 5, 6, 8, 12])("skips them for %i cylinders", (n) => {
    expect(isInline4({ cylinders: n })).toBe(false);
    const ids = enginePlan({ cylinders: n }).map((p) => p.id);
    only.forEach((id) => expect(ids).not.toContain(id));
    expect(ids).toContain("pistons");
  });
});

describe("buildEngine and applyEngineModels", () => {
  // the gasket texture draws on a canvas
  const ctx: unknown = new Proxy(function () {}, { get: () => ctx, apply: () => ctx, set: () => true });
  beforeAll(() => { vi.stubGlobal("document", { createElement: () => ({ getContext: () => ctx }) }); });
  afterAll(() => { vi.unstubAllGlobals(); });
  it("records pin and wrist on every rod", () => {
    const e = buildEngine({ cylinders: 6, year: 2020 });
    const rods = e.inside.filter((o: any) => o.userData.id === "rods");
    expect(rods).toHaveLength(6);
    rods.forEach((r: any) => { expect(r.userData.pin).toBeInstanceOf(THREE.Vector3); expect(r.userData.wrist).toBeInstanceOf(THREE.Vector3); });
  });
  it("leaves the code-built parts showing when the files are missing", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const e = buildEngine({ cylinders: 4, year: 2020 });
    const parts: Record<string, any[]> = {};
    e.parts.concat(e.inside).forEach((o: any) => { (parts[o.userData.id] = parts[o.userData.id] || []).push(o); });
    await applyEngineModels(parts, "http://127.0.0.1:9/nowhere/", { cylinders: 4 });
    let hidden = 0;
    Object.values(parts).flat().forEach((o) => o.traverse((m: any) => { if (m.isMesh && !m.material.visible) hidden++; }));
    expect(hidden).toBe(0);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
