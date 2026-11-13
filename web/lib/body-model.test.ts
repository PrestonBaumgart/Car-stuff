import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
// three ships without TypeScript types in this project
// @ts-expect-error untyped module
import { Box3, BoxGeometry, Group, Mesh, MeshBasicMaterial, PlaneGeometry, Vector3 } from "three";
import { HI_MAX, addBody, applyLooks, codeBox, fitBody, fitRegionToBody, highlightBody, panelRegion, placeBody, regionInWorld } from "./body-model.js";
import { dimsFor } from "./car-dims.js";
import { buildCar, setVisibility } from "./car-model.js";

const box = (min: number[], max: number[]) => ({
  min: { x: min[0], y: min[1], z: min[2] },
  max: { x: max[0], y: max[1], z: max[2] },
});

// Where a model's box lands once fitted: its own box scaled and moved, in the car group's frame.
function placed(model: ReturnType<typeof box>, fit: ReturnType<typeof fitBody>) {
  const [sx, sy, sz] = fit.scale, [px, py, pz] = fit.position;
  return box(
    [model.min.x * sx + px, model.min.y * sy + py, model.min.z * sz + pz],
    [model.max.x * sx + px, model.max.y * sy + py, model.max.z * sz + pz],
  );
}

describe("fitBody", () => {
  // a 4 m model sitting on y = 0, a little off centre, fitted to a 4.8 m code body standing on y = 0.05
  const model = box([-2.1, 0, -0.95], [1.9, 1.5, 0.85]);
  const target = box([-2.3, 0.05, -0.9], [2.5, 1.7, 0.9]);

  it("matches the code body's length", () => {
    const p = placed(model, fitBody(model, target, 1));
    expect(p.max.x - p.min.x).toBeCloseTo(4.8, 6);
  });
  it("scales evenly so the model keeps its own shape", () => {
    const fit = fitBody(model, target, 1);
    expect(fit.scale[0]).toBeCloseTo(1.2, 6);
    expect(fit.scale[1]).toBe(fit.scale[0]);
    expect(fit.scale[2]).toBe(fit.scale[0]);
  });
  it("undoes the car group's sideways scale", () => {
    const fit = fitBody(model, target, 1.25);
    expect(fit.scale[2] * 1.25).toBeCloseTo(fit.scale[0], 6);
    // once the car group's own kz is applied, the width is the model's width times the even scale
    const p = placed(model, fit);
    expect((p.max.z - p.min.z) * 1.25).toBeCloseTo(1.8 * fit.scale[0], 6);
  });
  it("stands on the code body's ground", () => {
    expect(placed(model, fitBody(model, target, 1.1)).min.y).toBeCloseTo(0.05, 6);
  });
  it("centres on the code body lengthwise and on the car across", () => {
    const p = placed(model, fitBody(model, target, 1.1));
    expect((p.min.x + p.max.x) / 2).toBeCloseTo(0.1, 6);
    expect((p.min.z + p.max.z) / 2).toBeCloseTo(0, 6);
  });
});

describe("placeBody", () => {
  it("covers the code-built body inside the car group", () => {
    const built = buildCar({ style: "sedan", dims: dimsFor({ make: "Kia", model: "Forte", year: "2016" }) });
    const parts = built.body.concat(built.panels);
    const kz = built.group.scale.z;
    expect(kz).not.toBe(1);
    const target = codeBox(built.group, parts);

    // a stand-in model: a 3 x 1.2 x 1.4 block resting on y = 0
    const model = new Group();
    const block = new Mesh(new BoxGeometry(3, 1.2, 1.4), new MeshBasicMaterial());
    block.position.set(0.2, 0.6, 0);
    model.add(block);
    placeBody(model, built.group, parts);

    expect(model.parent).toBe(built.group);
    const got = codeBox(built.group, [model]);
    expect(got.max.x - got.min.x).toBeCloseTo(target.max.x - target.min.x, 5);
    expect(got.min.x).toBeCloseTo(target.min.x, 5);
    expect(got.min.y).toBeCloseTo(target.min.y, 5);
    expect(got.min.z + got.max.z).toBeCloseTo(0, 5);
    // in the world the block keeps its own proportions
    built.group.updateMatrixWorld(true);
    const size = new Box3().setFromObject(model).getSize(new Vector3());
    expect(size.z / size.x).toBeCloseTo(1.4 / 3, 5);
    expect(size.y / size.x).toBeCloseTo(1.2 / 3, 5);
  });

  it("measures panels at rest, not pulled out", () => {
    const built = buildCar({ style: "sedan" });
    const parts = built.body.concat(built.panels);
    const before = codeBox(built.group, parts);
    const door = built.panels[0];
    const at = door.position.clone();
    door.position.add(new Vector3(5, 5, 5));
    expect(codeBox(built.group, parts).max.x).toBeCloseTo(before.max.x, 6);
    expect(door.position.x).toBeCloseTo(at.x + 5, 6);
  });
});

describe("addBody", () => {
  it("leaves the car as it was when the body file can't be loaded", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const built = buildCar({ style: "pickup" });
    const children = built.group.children.length;
    const result = await addBody(built.group, built.body.concat(built.panels), "http://127.0.0.1:9/nowhere/cars/f150.glb", () => true);
    expect(result).toBeNull();
    expect(built.group.children.length).toBe(children);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

// A one-triangle glTF (2 m long, 1 m tall, front +x, on y = 0) with a "paint" and a "glass" material, as a data: URL.
function tinyBody() {
  const positions = new Float32Array([-1, 0, -0.4, 1, 0, 0.4, 0, 1, 0]);
  const data = Buffer.from(positions.buffer).toString("base64");
  const prim = (material: number) => ({ attributes: { POSITION: 0 }, material });
  const gltf = {
    asset: { version: "2.0" },
    scene: 0,
    scenes: [{ nodes: [0, 1] }],
    nodes: [{ mesh: 0 }, { mesh: 1 }],
    meshes: [{ primitives: [prim(0)] }, { primitives: [prim(1)] }],
    materials: [{ name: "paint" }, { name: "glass" }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3", min: [-1, 0, -0.4], max: [1, 1, 0.4] }],
    bufferViews: [{ buffer: 0, byteLength: 36 }],
    buffers: [{ byteLength: 36, uri: "data:application/octet-stream;base64," + data }],
  };
  return "data:application/json;base64," + Buffer.from(JSON.stringify(gltf)).toString("base64");
}

describe("addBody with a body file", () => {
  // three's file loader reports download progress with the browser's ProgressEvent, which Node lacks
  beforeAll(() => { vi.stubGlobal("ProgressEvent", class { constructor(public type: string) {} }); });
  afterAll(() => { vi.unstubAllGlobals(); });

  it("fits the body over the car with fadeable materials, white and not repainted", async () => {
    const built = buildCar({ style: "sedan" });
    const parts = built.body.concat(built.panels);
    const model = await addBody(built.group, parts, tinyBody(), () => true);
    expect(model.parent).toBe(built.group);
    const got = codeBox(built.group, [model]), target = codeBox(built.group, parts);
    expect(got.max.x - got.min.x).toBeCloseTo(target.max.x - target.min.x, 5);
    type Look = { color: { getHex(): number }; transparent: boolean; opacity: number; depthWrite: boolean; userData: { base?: object; paint?: boolean } };
    const materials = new Set<Look>();
    model.traverse((o: { isMesh?: boolean; material: Look }) => {
      if (o.isMesh) materials.add(o.material);
    });
    expect(materials.size).toBe(2);
    for (const m of materials) {
      expect(m.transparent).toBe(true);
      expect(m.userData.base).toBeDefined();
      expect(m.userData.paint).toBeFalsy();
    }
    // white and see-through, never writing depth, so the parts inside read through the shell
    const paint = [...materials].find((m) => m.color.getHex() === 0xffffff)!;
    expect(paint.opacity).toBeGreaterThanOrEqual(0.35);
    expect(paint.opacity).toBeLessThanOrEqual(0.45);
    const glass = [...materials].find((m) => m !== paint)!;
    expect(glass.opacity).toBeLessThan(paint.opacity);
    for (const m of materials) expect(m.depthWrite).toBe(false);
  });

  it("keeps fading with the shell and still never writes depth", async () => {
    const built = buildCar({ style: "sedan" });
    const model = await addBody(built.group, built.body.concat(built.panels), tinyBody(), () => true);
    setVisibility(model, 1, 0);
    model.traverse((o: { isMesh?: boolean; material: { opacity: number; depthWrite: boolean; userData: { base: { opacity: number } } } }) => {
      if (o.isMesh) { expect(o.material.opacity).toBeCloseTo(o.material.userData.base.opacity, 6); expect(o.material.depthWrite).toBe(false); }
    });
    setVisibility(model, 0.5, 0);
    model.traverse((o: { isMesh?: boolean; material: { opacity: number; userData: { base: { opacity: number } } } }) => {
      if (o.isMesh) expect(o.material.opacity).toBeCloseTo(o.material.userData.base.opacity * 0.5, 6);
    });
    setVisibility(model, 0, 0);
    expect(model.visible).toBe(false);
  });

  it("drops the body when the car was rebuilt while it loaded", async () => {
    const built = buildCar({ style: "sedan" });
    const children = built.group.children.length;
    expect(await addBody(built.group, built.body.concat(built.panels), tinyBody(), () => false)).toBeNull();
    expect(built.group.children.length).toBe(children);
  });
});

describe("panel highlights on the real body", () => {
  // a code-built door: a 1 x 0.5 m sheet at z = 0.8, its triangles wound either way
  function door(facing: number) {
    const g = new PlaneGeometry(1, 0.5);
    if (facing < 0) g.rotateY(Math.PI);
    const m = new Mesh(g, new MeshBasicMaterial());
    m.position.set(0.2, 0.6, 0.8);
    m.userData.rest = m.position.clone();
    return m;
  }
  // a real body: an outer skin at z = 0.86 and, behind it, an inner trim sheet facing the same way
  function realBody(skinLook = "paint") {
    const sheet = (z: number, name: string) => { const m = new Mesh(new PlaneGeometry(1.2, 0.6), new MeshBasicMaterial()); m.material.name = name; m.position.set(0.2, 0.6, z); return m; };
    const g = new Group();
    g.add(sheet(0.86, skinLook === "paint" ? "" : skinLook), sheet(0.62, ""));
    return applyLooks(g);
  }
  const car = () => { const c = new Group(); c.updateMatrixWorld(true); return c; };

  it.each([1, -1])("faces the region away from the car whichever way the panel is wound (%i)", (facing) => {
    const c = car(), d = door(facing); c.add(d);
    const r = panelRegion(c, d)!;
    expect(r.plane.normal.z).toBeCloseTo(1, 6);
    expect(r.box.containsPoint(new Vector3(0.2, 0.6, 0.95))).toBe(true);
  });

  it("moves the band onto the real skin and leaves the trim behind it out", () => {
    const c = car(), d = door(1); c.add(d);
    const body = realBody(); c.add(body);
    const r = fitRegionToBody(Object.assign(panelRegion(c, d)!, { looks: ["paint"] }), body, c);
    const skin = r.plane.distanceToPoint(new Vector3(0.2, 0.6, 0.86)), trim = r.plane.distanceToPoint(new Vector3(0.2, 0.6, 0.62));
    expect(skin).toBeGreaterThanOrEqual(r.lo);
    expect(skin).toBeLessThanOrEqual(r.hi);
    expect(trim).toBeLessThan(r.lo);
  });

  it("falls back to any look when the body has none of the region's own there", () => {
    const c = car(), d = door(1); c.add(d);
    const body = realBody(); c.add(body);
    const r = fitRegionToBody(Object.assign(panelRegion(c, d)!, { looks: ["lamp"] }), body, c);
    expect(r.hi).toBeCloseTo(0.06 + 0.03, 6);
  });

  it("lights only the looks a region names, and switches off with no regions", () => {
    const body = realBody("glass");
    const c = car(), d = door(1); c.add(d);
    const region = regionInWorld(Object.assign(panelRegion(c, d)!, { looks: ["glass"] }), c.matrixWorld);
    highlightBody(body, [region], 0xffb02e, 0.6);
    expect(body.userData.hi.glass.amount.value).toBe(0.6);
    expect(body.userData.hi.paint.amount.value).toBe(0);
    expect(body.userData.hi.glass.min[0].z).toBeCloseTo(region.box.min.z, 6);
    highlightBody(body, [], 0xffb02e, 0.6);
    expect(body.userData.hi.glass.amount.value).toBe(0);
  });

  it(`takes at most ${HI_MAX} regions per look`, () => {
    const body = realBody(), c = car(), d = door(1); c.add(d);
    const r = regionInWorld(Object.assign(panelRegion(c, d)!, { looks: ["paint"] }), c.matrixWorld);
    expect(() => highlightBody(body, Array(HI_MAX + 2).fill(r), 0xffb02e, 0.5)).not.toThrow();
    expect(body.userData.hi.paint.min).toHaveLength(HI_MAX);
  });
});
