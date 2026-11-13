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
  const made = {};
  body.traverse(function (o) {
    if (!o.isMesh) return;
    const name = o.material.name || "";
    made[name] = made[name] || look(name);
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
