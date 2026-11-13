// Swaps a few code-built parts for real scanned/modelled parts (CC BY, credits in public/parts/ATTRIBUTION.md),
// fitted to where the code put them. The code-built part stays as the pick target (its own material is hidden),
// so tapping still works. If a file fails to load, the code-built part simply stays visible.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder); // the engine models are meshopt-compressed
const cache = {};
export function load(url) {
  if (!cache[url]) cache[url] = loader.loadAsync(url).then((g) => { g.scene.updateMatrixWorld(true); return g.scene; });
  return cache[url];
}

// The viewer fades and highlights parts through userData.base on each material, like the code-built ones.
function viewerMaterial(src) {
  const m = new THREE.MeshStandardMaterial({
    color: src.color ? src.color.clone() : new THREE.Color(0xaaaaaa),
    map: src.map || null, normalMap: src.normalMap || null,
    roughnessMap: src.roughnessMap || null, metalnessMap: src.metalnessMap || null,
    roughness: src.roughness == null ? 0.5 : src.roughness, metalness: src.metalness == null ? 0.5 : src.metalness,
    vertexColors: !!src.vertexColors, // scanned parts carry their colour per vertex
  });
  m.transparent = true;
  m.side = THREE.DoubleSide;
  m.userData.base = { opacity: 1, emissive: 0x000000, emissiveIntensity: 1 };
  return m;
}

// Copies of the model's meshes chosen by `keep`, baked into the model's own frame, as one group.
export function pick(scene, keep, recolor) {
  const out = new THREE.Group();
  scene.traverse(function (o) {
    // some files ship a hidden display stand; it would throw off the fit
    if (!o.isMesh || !keep(o) || (o.material.transparent && o.material.opacity === 0)) return;
    const m = new THREE.Mesh(o.geometry, viewerMaterial(o.material));
    if (recolor) recolor(m, o);
    o.matrixWorld.decompose(m.position, m.quaternion, m.scale);
    m.castShadow = true; m.receiveShadow = true;
    out.add(m);
  });
  return out;
}

// Put `model` (in its own frame) under `holder` so it lands at `world` (a matrix in the holder's parent frame).
export function attach(holder, model, world, id) {
  holder.updateMatrix();
  const local = new THREE.Matrix4().copy(holder.matrix).invert().multiply(world);
  const wrap = new THREE.Group();
  local.decompose(wrap.position, wrap.quaternion, wrap.scale);
  wrap.add(model);
  wrap.traverse((o) => { o.userData.id = id; });
  holder.add(wrap);
}
export function hide(obj) { obj.traverse((o) => { if (o.isMesh && !o.userData.hero) o.material.visible = false; }); }

/** Brake corners: the downloaded disc on each rotor and its caliper on the matching caliper part. */
async function brakes(parts, url) {
  const scene = await load(url);
  const isDisc = (o) => /polySurface/.test(o.name + (o.parent && o.parent.name));
  const disc = pick(scene, isDisc), caliper = pick(scene, (o) => !isDisc(o));
  const discBox = new THREE.Box3().setFromObject(disc), caliperBox = new THREE.Box3().setFromObject(caliper);
  const size = discBox.getSize(new THREE.Vector3()), center = discBox.getCenter(new THREE.Vector3());
  // the disc's thinnest extent is its axle
  const axis = size.x < size.y && size.x < size.z ? "x" : size.y < size.z ? "y" : "z";
  const modelR = Math.max(...["x", "y", "z"].filter((a) => a !== axis).map((a) => size[a] / 2));
  const axle = new THREE.Vector3(axis === "x" ? 1 : 0, axis === "y" ? 1 : 0, axis === "z" ? 1 : 0);
  const toZ = new THREE.Quaternion().setFromUnitVectors(axle, new THREE.Vector3(0, 0, 1));
  // where the caliper sits around the disc, once the axle points along z
  const off = caliperBox.getCenter(new THREE.Vector3()).sub(center).applyQuaternion(toZ);
  const caliperAngle = Math.atan2(off.y, off.x);

  (parts.rotors || []).forEach(function (rotor) {
    const ring = rotor.children.find((c) => c.isMesh) || rotor;
    const box = new THREE.Box3().setFromObject(ring);
    rotor.parent.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(rotor.parent.matrixWorld).invert();
    box.applyMatrix4(inv);
    const c = box.getCenter(new THREE.Vector3()), r = Math.max(box.max.x - box.min.x, box.max.y - box.min.y) / 2, side = Math.sign(c.z) || 1;
    // the same angle the code put its caliper at, behind the front axle
    const want = Math.PI * 0.72;
    const turn = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), want - caliperAngle);
    const outward = side < 0 ? new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI) : new THREE.Quaternion();
    const q = outward.multiply(turn).multiply(toZ), s = r / modelR;
    const world = new THREE.Matrix4().compose(c, q, new THREE.Vector3(s, s, s)).multiply(new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z));
    const d = disc.clone(); d.traverse((o) => { o.userData.hero = true; if (o.isMesh) o.material = o.material.clone(); });
    hide(rotor); attach(rotor, d, world, "rotors");
    // the caliper part nearest this wheel
    const cal = (parts.calipers || []).map((k) => ({ k, dist: new THREE.Box3().setFromObject(k).applyMatrix4(inv).getCenter(new THREE.Vector3()).distanceTo(c) })).sort((a, b) => a.dist - b.dist)[0];
    if (cal) {
      const k = caliper.clone(); k.traverse((o) => { o.userData.hero = true; if (o.isMesh) o.material = o.material.clone(); });
      hide(cal.k); attach(cal.k, k, world, "calipers");
      (parts.pads || []).forEach((p) => { if (new THREE.Box3().setFromObject(p).applyMatrix4(inv).getCenter(new THREE.Vector3()).distanceTo(c) < r * 1.5) hide(p); });
    }
  });
}

/**
 * Any other part: line the model's longest, middle and shortest extents up with the part's, and scale it to
 * the part's size. Good for things that read the same either way round (struts, mufflers, plugs, radiators).
 */
async function fitByShape(parts, id, url, opts) {
  const o = opts || {};
  const scene = await load(url);
  const model = pick(scene, () => true, o.recolor);
  const box = new THREE.Box3().setFromObject(model), mc = box.getCenter(new THREE.Vector3()), ms = box.getSize(new THREE.Vector3());
  const order = (v) => ["x", "y", "z"].sort((a, b) => v[b] - v[a]);
  const unit = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) };
  (parts[id] || []).forEach(function (part) {
    part.parent.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(part.parent.matrixWorld).invert();
    const pb = new THREE.Box3();
    part.traverse((m) => { if (m.isMesh && !m.userData.hero) pb.union(new THREE.Box3().setFromObject(m).applyMatrix4(inv)); });
    // neighbours the model also stands in for (a wheel model brings its own tire) are hidden, and the model is sized to cover them too
    const reach = Math.max(...pb.getSize(new THREE.Vector3()).toArray()), near = pb.getCenter(new THREE.Vector3());
    const covered = (o.alsoHide || []).flatMap((other) => (parts[other] || []).filter((p2) => new THREE.Box3().setFromObject(p2).applyMatrix4(inv).getCenter(new THREE.Vector3()).distanceTo(near) < reach));
    covered.forEach((p2) => pb.union(new THREE.Box3().setFromObject(p2).applyMatrix4(inv)));
    const pc = pb.getCenter(new THREE.Vector3()), ps = pb.getSize(new THREE.Vector3());
    const from = order(ms), to = order(ps);
    // a rotation taking the model's longest axis to the part's longest, and so on
    const fromBasis = new THREE.Matrix4().makeBasis(unit[from[0]], unit[from[1]], unit[from[2]]);
    let basis = new THREE.Matrix4().makeBasis(unit[to[0]], unit[to[1]], unit[to[2]]).multiply(fromBasis.clone().invert());
    // keep it a rotation, not a mirror image
    if (basis.determinant() < 0) basis = new THREE.Matrix4().makeBasis(unit[to[0]], unit[to[1]], unit[to[2]].clone().negate()).multiply(fromBasis.invert());
    const q = new THREE.Quaternion().setFromRotationMatrix(basis);
    const s = Math.min(ps[to[0]] / ms[from[0]], ps[to[1]] / ms[from[1]]) * (o.grow || 1);
    const world = new THREE.Matrix4().compose(pc, q, new THREE.Vector3(s, s, s)).multiply(new THREE.Matrix4().makeTranslation(-mc.x, -mc.y, -mc.z));
    const copy = model.clone(); copy.traverse((x) => { x.userData.hero = true; if (x.isMesh) x.material = x.material.clone(); });
    hide(part); covered.forEach(hide);
    attach(part, copy, world, id);
  });
}

/** Fit the part models onto the parts they replace. partMeshes: { id: [objects] }; base: URL of the folder holding the .glb files. */
export function applyPartModels(partMeshes, base) {
  const jobs = [
    brakes(partMeshes, base + "brake.glb"),
    fitByShape(partMeshes, "struts", base + "coilover.glb"),
    fitByShape(partMeshes, "rad", base + "radiator.glb"),
    fitByShape(partMeshes, "plugs", base + "spark-plug.glb"),
    fitByShape(partMeshes, "muffler", base + "muffler.glb"),
    fitByShape(partMeshes, "exhaust", base + "catalytic-converter.glb"),
    fitByShape(partMeshes, "wheels", base + "wheel.glb", { alsoHide: ["tires"] }),
  ];
  return Promise.all(jobs.map((j) => j.catch((e) => console.warn("part model", e))));
}
