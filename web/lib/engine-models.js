// Swaps the code-built engine parts for detailed models (engine/*.glb under the parts folder), fitted in each part's
// own local frame so exploding and leaning V banks keep working. A missing file fails quietly and the code-built part
// stays visible. Conventions for the files are documented per helper below.
import * as THREE from "three";
import { load, pick, attach, hide } from "./part-models.js";

const UP = new THREE.Vector3(0, 1, 0);
const V = (x, y, z) => new THREE.Vector3(x, y, z);

/** An inline four: the only layout the crank, cam and manifold models are drawn for. */
export function isInline4(spec) {
  const n = parseInt(spec && spec.cylinders, 10);
  return n === 4; // buildEngine makes every engine under 6 cylinders inline
}

/** Matrix scaling `s` uniformly about the model box's `anchor`, landing that point on `to`. */
function place(anchor, to, s) {
  return new THREE.Matrix4().makeTranslation(to.x, to.y, to.z).multiply(new THREE.Matrix4().makeScale(s, s, s)).multiply(new THREE.Matrix4().makeTranslation(-anchor.x, -anchor.y, -anchor.z));
}
const centerOf = (b) => b.getCenter(new THREE.Vector3());
const sizeOf = (b) => b.getSize(new THREE.Vector3());

/** Piston: crown +Y, wrist pin along Z, uniform scale so the model's diameter (X) equals the code piston's; centred on the code box. No rotation: the part keeps its own. */
export function fitPiston(modelBox, targetBox) {
  return place(centerOf(modelBox), centerOf(targetBox), sizeOf(targetBox).x / sizeOf(modelBox).x);
}

/** Valve and coil: stem/tall axis +Y, head/boot at the bottom. Scaled to the code part's height, bottom centre on the code part's bottom centre. */
export function fitStanding(modelBox, targetBox) {
  const m = centerOf(modelBox), t = centerOf(targetBox);
  return place(V(m.x, modelBox.min.y, m.z), V(t.x, targetBox.min.y, t.z), sizeOf(targetBox).y / sizeOf(modelBox).y);
}

/** Scaled so the model's extent along `axis` matches the code part's, centred on it. The file is drawn in the code part's own frame. */
export function fitAligned(modelBox, targetBox, axis) {
  return place(centerOf(modelBox), centerOf(targetBox), sizeOf(targetBox)[axis] / sizeOf(modelBox)[axis]);
}

/** The model's origin (a chosen anchor, like a pulley centre) lands on `at`, scaled by `size` per model unit. */
export function fitOrigin(at, size) {
  return new THREE.Matrix4().makeTranslation(at[0], at[1], at[2]).multiply(new THREE.Matrix4().makeScale(size, size, size));
}

/**
 * Crankshaft. The file: main bearing axis on Z through the origin, throws `spacing` apart centred on z = 0, crank pins
 * `throw` off the axis with cylinders 1 and 4 up (+Y), flywheel end at +Z. Lengthwise it is scaled to the code's cylinder
 * spacing and across to the code's throw, so every pin lands under its rod.
 */
export function fitCrank(model, code) {
  const sz = code.spacing / model.spacing, sr = code.throw / model.throw;
  const m = new THREE.Matrix4().makeTranslation(0, code.axisY, 0);
  if (code.flywheelZ < 0) m.multiply(new THREE.Matrix4().makeRotationY(Math.PI)); // pins stay up, flywheel swaps ends
  return m.multiply(new THREE.Matrix4().makeScale(sr, sr, sz));
}

/** Camshaft. The file: shaft on Z through the origin, each cylinder's lobes `spacing` apart centred on z = 0, lobes `radius` off the axis. */
export function fitCam(model, code) {
  const sz = code.spacing / model.spacing, sr = Math.min(sz, code.radius / model.radius);
  return new THREE.Matrix4().makeScale(sr, sr, sz);
}

/** Exhaust manifold. The file: middle of the flange row at the origin, flanges facing +X toward the head, ports `spacing` apart along Z. */
export function fitManifold(model, code) {
  const s = code.spacing / model.spacing, m = new THREE.Matrix4().makeTranslation(code.at[0], code.at[1], code.at[2]);
  if (code.head < 0) m.multiply(new THREE.Matrix4().makeRotationY(Math.PI));
  return m.multiply(new THREE.Matrix4().makeScale(s, s, s));
}

/**
 * Connecting rod: long axis +Y, big end at the bottom (bbox min Y), crank pin axis along Z, big end the widest part
 * (its width is the X extent). The big-end centre is taken half that width above the bottom and the small-end centre
 * 0.3 of it below the top. The model's +Y is turned toward (wrist - pin), the big-end centre lands on `pin`, and the
 * scale makes the centre-to-centre distance equal |wrist - pin|. Turning about Z only (pin and wrist share a Z) keeps the pin axis along Z.
 */
export function fitRod(modelBox, pin, wrist) {
  const size = sizeOf(modelBox), c = centerOf(modelBox);
  const big = V(c.x, modelBox.min.y + size.x / 2, c.z), smallY = modelBox.max.y - size.x * 0.3;
  const dir = wrist.clone().sub(pin), dist = dir.length();
  const q = new THREE.Quaternion().setFromUnitVectors(UP, dir.normalize());
  const s = dist / (smallY - big.y);
  return new THREE.Matrix4().makeTranslation(pin.x, pin.y, pin.z).multiply(new THREE.Matrix4().makeRotationFromQuaternion(q)).multiply(new THREE.Matrix4().makeScale(s, s, s)).multiply(new THREE.Matrix4().makeTranslation(-big.x, -big.y, -big.z));
}

/**
 * What gets fitted for this engine, in order. `origin` files put their anchor at the model origin: the alternator its
 * pulley centre, the water pump its hub flange, the throttle body its bore centre. `at` is where buildEngine puts that
 * anchor and `size` is how big one model unit is (alternator body diameter, hub flange diameter, throttle body height).
 * `aligned` files are drawn in the code part's own frame and sized along `axis`.
 */
export function enginePlan(spec) {
  const plan = [
    { id: "pistons", file: "piston.glb", kind: "piston" },
    { id: "rods", file: "rod.glb", kind: "rod" },
    { id: "valves", file: "valve.glb", kind: "valve" },
    { id: "coils", file: "coil.glb", kind: "standing" },
    { id: "injectors", file: "injectors.glb", kind: "each" },
    { id: "alt", file: "alternator.glb", kind: "origin", at: [0, 0, 0.07], size: 0.15 },
    { id: "wpump", file: "water-pump.glb", kind: "origin", at: [0, 0, 0.055], size: 0.07 },
    { id: "tbody", file: "throttle-body.glb", kind: "origin", at: [0, 0, 0], size: 0.13 },
    { id: "starter", file: "starter.glb", kind: "aligned", axis: "x" },
    { id: "oil", file: "oil-filter.glb", kind: "aligned", axis: "x" },
  ];
  if (isInline4(spec)) {
    plan.push(
      { id: "crank", file: "crank-i4.glb", kind: "crank" },
      { id: "cam", file: "cam-i4.glb", kind: "cam" },
      { id: "manifold", file: "manifold-i4.glb", kind: "manifold" },
    );
  }
  return plan;
}

// Box of the code-built meshes under `holder`, in the holder's own local frame (so its rotation and position don't count).
function localBox(holder) {
  holder.updateWorldMatrix(true, true);
  const inv = holder.matrixWorld.clone().invert(), box = new THREE.Box3();
  holder.traverse((o) => {
    if (!o.isMesh || o.userData.hero || !o.geometry) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    box.union(o.geometry.boundingBox.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld)));
  });
  return box;
}

// Put a copy of `model` on `holder` using a matrix in the holder's own local frame.
function mount(holder, model, local, id) {
  const copy = model.clone();
  copy.traverse((x) => { x.userData.hero = true; if (x.isMesh) x.material = x.material.clone(); });
  holder.updateMatrix();
  attach(holder, copy, new THREE.Matrix4().multiplyMatrices(holder.matrix, local), id);
}

async function fitLocal(parts, plan, base, current, fit) {
  const model = pick((await load(base + plan.file)), () => true);
  const list = parts[plan.id] || [];
  if (!current()) return;
  const mb = new THREE.Box3().setFromObject(model);
  list.forEach((part) => fit(part, model, mb));
}

async function pistons(parts, plan, base, current) {
  await fitLocal(parts, plan, base, current, function (part, model, mb) {
    const local = fitPiston(mb, localBox(part));
    // the model has its own rings: hide the code rings of this cylinder (nearest rest position) but keep them pickable
    const ring = (parts.rings || []).map((r) => ({ r, d: r.userData.rest ? r.userData.rest.distanceTo(part.userData.rest) : 1e9 })).sort((a, b) => a.d - b.d)[0];
    hide(part); if (ring && ring.d < 1e-4) hide(ring.r);
    mount(part, model, local, "pistons");
  });
}

async function rods(parts, plan, base, current) {
  await fitLocal(parts, plan, base, current, function (part, model, mb) {
    const { pin, wrist } = part.userData;
    if (!pin || !wrist) return;
    hide(part); mount(part, model, fitRod(mb, pin, wrist), "rods");
  });
}

// valves: a group of four child valve groups, each fitted in its own frame
async function valves(parts, plan, base, current) {
  await fitLocal(parts, plan, base, current, function (part, model, mb) {
    part.children.forEach((child) => { const local = fitStanding(mb, localBox(child)); hide(child); mount(child, model, local, "valves"); });
  });
}

async function standing(parts, plan, base, current) {
  await fitLocal(parts, plan, base, current, function (part, model, mb) { const local = fitStanding(mb, localBox(part)); hide(part); mount(part, model, local, plan.id); });
}

// injectors: the rail stays, each injector group under it gets a standing model
async function each(parts, plan, base, current) {
  await fitLocal(parts, plan, base, current, function (part, model, mb) {
    part.children.filter((c) => c.isGroup).forEach((child) => { const local = fitStanding(mb, localBox(child)); hide(child); mount(child, model, local, plan.id); });
  });
}

async function aligned(parts, plan, base, current) {
  await fitLocal(parts, plan, base, current, function (part, model, mb) { const local = fitAligned(mb, localBox(part), plan.axis); hide(part); mount(part, model, local, plan.id); });
}

async function origin(parts, plan, base, current) {
  await fitLocal(parts, plan, base, current, function (part, model) { hide(part); mount(part, model, fitOrigin(plan.at, plan.size), plan.id); });
}

// crank, cam and manifold files carry their own measurements (glTF extras on the root node); buildEngine leaves its own on the part
function normalized(key, fit) {
  return async function (parts, plan, base, current) {
    const scene = await load(base + plan.file);
    let extras = null;
    scene.traverse((o) => { if (!extras && o.userData && o.userData.spacing) extras = o.userData; });
    if (!extras) throw new Error(plan.file + " has no measurements");
    await fitLocal(parts, plan, base, current, function (part, model) {
      const code = part.userData[key];
      if (!code) return;
      hide(part);
      part.traverse((o) => { if (o.isMesh && o.userData.flange) o.material.visible = true; }); // the flywheel flange is not in the crank model
      mount(part, model, fit(extras, code), plan.id);
    });
  };
}

const FITTERS = { piston: pistons, rod: rods, valve: valves, standing, each, aligned, origin, crank: normalized("crank", fitCrank), cam: normalized("cam", fitCam), manifold: normalized("port", fitManifold) };

/**
 * Fit the detailed engine models. partMeshes: { id: [objects] }; base: URL of the engine/ folder (with trailing slash);
 * spec: { cylinders }; current: optional, return false once the car has been rebuilt to stop fitting onto old parts.
 */
export function applyEngineModels(partMeshes, base, spec, current) {
  const live = current || (() => true);
  const jobs = enginePlan(spec).map((p) => FITTERS[p.kind](partMeshes, p, base, live));
  return Promise.all(jobs.map((j) => j.catch((e) => console.warn("engine model", e))));
}
