// A generic car body (CC BY, credits in public/parts/ATTRIBUTION.md) fitted over the code-built one: same length,
// same spot, standing on the same ground. The code-built panels stay behind it as invisible pick targets.
// If the file fails to load, the code-built body simply stays.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { material } from "./car-model.js";

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);

// The files ship flat materials named for what they are; each name gets a see-through white look so the
// code-built parts inside read through the shell. Paint stays white on every car, so it isn't marked as paint
// and repaint() skips it. depthWrite stays off (userData.noDepth) so the shell never hides what is behind it.
export const BODY_PAINT = { color: 0xffffff, opacity: 0.4, metalness: 0, roughness: 0.6, clearcoat: 0 };
export const BODY_GLASS = { color: 0xdfe8f0, opacity: 0.22, metalness: 0, roughness: 0.1 };
const LOOKS = { glass: ["glass", BODY_GLASS], rubber: ["rubber", { opacity: 0.5 }], trim: ["trim", { opacity: 0.5 }], lamp: ["headlight", { opacity: 0.5 }] };
export function look(name) {
  const [key, extra] = LOOKS[name] || ["paint", BODY_PAINT];
  const m = material(key, extra);
  delete m.userData.paint;
  m.userData.noDepth = true;
  m.depthWrite = false;
  return m;
}

// Highlighting a panel on the real body: the body's outer skin inside up to HI_MAX regions takes the highlight colour,
// brightest along the region's edges where the panel's seams would be. A region is a world-space box plus a slab
// along the panel's facing direction; only surface facing that way counts, so the interior behind it stays dark.
// One set of regions per body, shared by its looks.
export const HI_MAX = 4;
function highlightState() {
  return {
    min: Array.from({ length: HI_MAX }, () => new THREE.Vector3(1e5, 1e5, 1e5)),
    max: Array.from({ length: HI_MAX }, () => new THREE.Vector3(-1e5, -1e5, -1e5)),
    n: Array.from({ length: HI_MAX }, () => new THREE.Vector3(0, 1, 0)),
    d: Array.from({ length: HI_MAX }, () => new THREE.Vector2(1, -1)),
    color: new THREE.Color(0xffb02e), amount: { value: 0 },
  };
}
function addHighlight(m, hi) {
  m.onBeforeCompile = function (shader) {
    Object.assign(shader.uniforms, { hiMin: { value: hi.min }, hiMax: { value: hi.max }, hiN: { value: hi.n }, hiD: { value: hi.d }, hiColor: { value: hi.color }, hiAmount: hi.amount });
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vHiPos;\nvarying vec3 vHiN;")
      .replace("#include <project_vertex>", "#include <project_vertex>\nvHiPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvHiN = (modelMatrix * vec4(objectNormal, 0.0)).xyz;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>
varying vec3 vHiPos;
varying vec3 vHiN;
uniform vec3 hiMin[${HI_MAX}];
uniform vec3 hiMax[${HI_MAX}];
uniform vec3 hiN[${HI_MAX}];
uniform vec2 hiD[${HI_MAX}];
uniform vec3 hiColor;
uniform float hiAmount;`)
      .replace("#include <dithering_fragment>", `#include <dithering_fragment>
if (hiAmount > 0.0) {
  float inside = 0.0, edge = 0.0;
  vec3 nrm = normalize(vHiN);
  for (int i = 0; i < ${HI_MAX}; i++) {
    vec3 a = vHiPos - hiMin[i], b = hiMax[i] - vHiPos;
    float d = min(min(min(a.x, a.y), a.z), min(min(b.x, b.y), b.z)), depth = dot(vHiPos, hiN[i]);
    if (d >= 0.0 && depth >= hiD[i].x && depth <= hiD[i].y && dot(nrm, hiN[i]) > 0.2) { inside = 1.0; edge = max(edge, 1.0 - smoothstep(0.0, 0.014, d)); }
  }
  gl_FragColor.rgb = mix(gl_FragColor.rgb, hiColor, inside * hiAmount * (0.6 + 0.4 * edge));
  gl_FragColor.a = mix(gl_FragColor.a, 0.92, inside * hiAmount);
}`);
  };
  m.customProgramCacheKey = () => "body-highlight";
}

/**
 * Light up the real body in `regions` (from panelRegion, moved to world space by regionInWorld), `amount` 0-1.
 * Each region lights only the looks it names (region.looks: paint, glass, lamp, trim…), at most HI_MAX per look.
 */
export function highlightBody(model, regions, color, amount) {
  const states = model.userData.hi;
  if (!states) return;
  Object.keys(states).forEach(function (key) {
    const hi = states[key], mine = regions.filter((r) => !r.looks || r.looks.includes(key));
    for (let i = 0; i < HI_MAX; i++) {
      const r = mine[i];
      if (r) { hi.min[i].copy(r.box.min); hi.max[i].copy(r.box.max); hi.n[i].copy(r.plane.normal); hi.d[i].set(r.lo - r.plane.constant, r.hi - r.plane.constant); }
      else { hi.min[i].setScalar(1e5); hi.max[i].setScalar(-1e5); hi.d[i].set(1, -1); }
    }
    hi.color.set(color);
    hi.amount.value = mine.length ? amount : 0;
  });
}

/** A region from panelRegion carried into world space by the car group's matrix (it only moves and stretches). */
export function regionInWorld(region, matrix) {
  return { box: region.box.clone().applyMatrix4(matrix), plane: region.plane.clone().applyMatrix4(matrix), lo: region.lo, hi: region.hi, looks: region.looks };
}

/**
 * The part of the real body a code-built panel stands for, in the car group's frame: { box, plane, lo, hi }.
 * The box is the panel's resting bounds, grown by `pad` ([x, y, z], default 3 cm each way) for parts the code draws
 * smaller than real bodies have them, and opened up along the way it mostly faces; the plane
 * faces the same way through the panel, and lo..hi is how far from it (in, then out) the real skin may sit.
 */
export function panelRegion(car, obj, pad) {
  const grow = 0.1, shrink = 0.06, around = pad || [0.03, 0.03, 0.03];
  const saved = obj.position.clone();
  if (obj.userData.rest) obj.position.copy(obj.userData.rest);
  car.updateMatrixWorld(true);
  const toCar = new THREE.Matrix4().copy(car.matrixWorld).invert(), m = new THREE.Matrix4(), box = new THREE.Box3(), pts = [];
  const facing = new THREE.Vector3(), centre = new THREE.Vector3(), n = new THREE.Vector3(), e = new THREE.Vector3();
  const tri = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  let area = 0;
  obj.traverse(function (o) {
    if (!o.isMesh || o.userData.hero) return;
    m.multiplyMatrices(toCar, o.matrixWorld);
    const P = o.geometry.attributes.position, I = o.geometry.index, count = I ? I.count : P.count;
    for (let t = 0; t + 2 < count; t += 3) {
      tri.forEach((v, j) => { v.fromBufferAttribute(P, I ? I.getX(t + j) : t + j).applyMatrix4(m); box.expandByPoint(v); pts.push(v.clone()); });
      n.subVectors(tri[2], tri[1]).cross(e.subVectors(tri[0], tri[1]));
      facing.add(n); // area-weighted; outward for the shell's winding
      const w = n.length();
      centre.addScaledVector(e.copy(tri[0]).add(tri[1]).add(tri[2]), w / 3);
      area += w;
    }
  });
  obj.position.copy(saved);
  car.updateMatrixWorld(true);
  if (!pts.length) return null;
  centre.divideScalar(area || 1);
  const normal = facing.normalize();
  // top panels face up; side, front and back panels face away from the car's middle
  if (Math.abs(normal.y) >= 0.7 ? normal.y < 0 : normal.dot(new THREE.Vector3(centre.x, 0, centre.z)) < 0) normal.negate();
  const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, centre);
  let lo = Infinity, hi = -Infinity;
  pts.forEach((p) => { const d = plane.distanceToPoint(p); lo = Math.min(lo, d); hi = Math.max(hi, d); });
  const ax = ["x", "y", "z"].sort((p, q) => Math.abs(normal[q]) - Math.abs(normal[p]))[0];
  box.expandByVector(new THREE.Vector3().fromArray(around));
  box.min[ax] -= 0.2; box.max[ax] += 0.2;
  return { box, plane, lo: lo - shrink, hi: hi + grow, depth: hi - lo };
}

/**
 * Move a region's depth band onto the real body: its outermost skin facing the panel's way inside the region's box
 * becomes the band's top, and the band reaches in by the code panel's own depth (its curve) plus `margin`.
 * Regions where the body has no such skin are left as they were.
 */
export function fitRegionToBody(region, model, car, margin) {
  if (!region) return region;
  const m = margin == null ? 0.05 : margin;
  car.updateMatrixWorld(true);
  const toCar = new THREE.Matrix4().copy(car.matrixWorld).invert(), mm = new THREE.Matrix4(), nm = new THREE.Matrix3(), n = region.plane.normal;
  const c = new THREE.Vector3(), v = new THREE.Vector3(), nrm = new THREE.Vector3(), w = new THREE.Vector3();
  let top = -Infinity;
  model.traverse(function (o) {
    if (!o.isMesh || (region.looks && !region.looks.includes(o.material.userData.look))) return;
    mm.multiplyMatrices(toCar, o.matrixWorld);
    nm.getNormalMatrix(mm);
    const P = o.geometry.attributes.position, N = o.geometry.attributes.normal, I = o.geometry.index, count = I ? I.count : P.count;
    if (!N) return;
    for (let t = 0; t + 2 < count; t += 3) {
      c.set(0, 0, 0); nrm.set(0, 0, 0);
      for (let j = 0; j < 3; j++) { const i = I ? I.getX(t + j) : t + j; c.add(v.fromBufferAttribute(P, i).applyMatrix4(mm)); nrm.add(w.fromBufferAttribute(N, i)); }
      c.divideScalar(3);
      if (!region.box.containsPoint(c) || nrm.applyMatrix3(nm).normalize().dot(n) < 0.3) continue;
      top = Math.max(top, region.plane.distanceToPoint(c));
    }
  });
  // no skin of those looks here (some files paint their taillights): try every look before giving up
  if (top === -Infinity) return region.looks ? fitRegionToBody(Object.assign({}, region, { looks: undefined }), model, car, margin) : region;
  return Object.assign({}, region, { lo: top - region.depth - m, hi: top + 0.03 });
}

function dispose(obj) {
  obj.traverse(function (o) {
    if (o.geometry) o.geometry.dispose();
    if (o.material) [].concat(o.material).forEach((m) => m.dispose());
  });
}

/** Load a body .glb as a group, its materials swapped for ones the viewer can fade. */
export async function loadBody(url) {
  const gltf = await loader.loadAsync(url);
  const body = new THREE.Group();
  body.add(gltf.scene);
  return applyLooks(body);
}

/** Swap every material in body for the see-through look its name asks for, each able to light up panel regions. */
export function applyLooks(body) {
  const made = {}, states = {};
  body.userData.hi = states;
  body.traverse(function (o) {
    if (!o.isMesh) return;
    const name = o.material.name || "";
    if (!made[name]) {
      const kind = LOOKS[name] ? name : "paint";
      made[name] = look(name);
      made[name].userData.look = kind;
      addHighlight(made[name], (states[kind] = states[kind] || highlightState()));
    }
    o.material.dispose();
    o.material = made[name];
    o.castShadow = true; o.receiveShadow = true;
  });
  return body;
}

/**
 * Where a body model goes so it covers the code-built body: scaled evenly to the same length, centred on it
 * lengthwise, centred across, its bottom on the code body's ground. Boxes are { min, max } ({ x, y, z } each) in
 * the car group's frame; the model box is in the model's own frame. kz is the car group's sideways scale,
 * undone on the model so it keeps its own width. Returns { scale: [x, y, z], position: [x, y, z] }.
 */
export function fitBody(modelBox, targetBox, kz) {
  const k = kz || 1;
  const s = (targetBox.max.x - targetBox.min.x) / (modelBox.max.x - modelBox.min.x);
  const modelMidX = (modelBox.min.x + modelBox.max.x) / 2, modelMidZ = (modelBox.min.z + modelBox.max.z) / 2;
  const targetMidX = (targetBox.min.x + targetBox.max.x) / 2;
  return {
    scale: [s, s, s / k],
    position: [targetMidX - modelMidX * s, targetBox.min.y - modelBox.min.y * s, (-modelMidZ * s) / k],
  };
}

/** The code-built body's bounds in the car group's frame, with every panel at rest (none pulled out). */
export function codeBox(car, parts) {
  const saved = parts.map((p) => p.position.clone());
  parts.forEach((p) => { if (p.userData.rest) p.position.copy(p.userData.rest); });
  car.updateMatrixWorld(true);
  const toCar = new THREE.Matrix4().copy(car.matrixWorld).invert();
  const box = new THREE.Box3(), piece = new THREE.Box3(), m = new THREE.Matrix4();
  parts.forEach(function (p) {
    p.traverse(function (o) {
      // a downloaded part model (a wheel) is a stand-in, not the body's shape
      if (!o.isMesh || o.userData.hero) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      piece.copy(o.geometry.boundingBox).applyMatrix4(m.multiplyMatrices(toCar, o.matrixWorld));
      box.union(piece);
    });
  });
  parts.forEach((p, i) => p.position.copy(saved[i]));
  car.updateMatrixWorld(true);
  return box;
}

/** Fit model over the code-built body (parts: its body and panel objects) and add it to the car group. */
export function placeBody(model, car, parts) {
  model.updateMatrixWorld(true);
  const fit = fitBody(new THREE.Box3().setFromObject(model), codeBox(car, parts), car.scale.z);
  model.scale.fromArray(fit.scale);
  model.position.fromArray(fit.position);
  car.add(model);
}

/**
 * Load the body at url and fit it over the code-built one. Resolves with the added model, or null when the file
 * failed to load or isCurrent() says the car was rebuilt while it loaded; either way the car is left as it was.
 */
export async function addBody(car, parts, url, isCurrent) {
  let model;
  try {
    model = await loadBody(url);
  } catch (e) {
    console.warn("car body", e);
    return null;
  }
  if (isCurrent && !isCurrent()) {
    dispose(model);
    return null;
  }
  placeBody(model, car, parts);
  return model;
}

/** Show or hide a code-built part's own look; it stays a pick target. Downloaded part models are left alone. */
export function showCode(obj, on) {
  obj.traverse(function (o) {
    // panels carry their seam lines as children
    if ((o.isMesh || o.isLine) && !o.userData.hero) [].concat(o.material).forEach((m) => { m.visible = on; });
  });
}
