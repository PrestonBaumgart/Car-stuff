// Realistic car, engine and garage for the 3D parts bay (web/lib/hologram.js), modeled in code:
// no model files to download or license, and the engine adapts to the car's cylinder count.
// Units are meters. The car faces +x, the floor is y = 0, and z is across the car.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

/* ---------------- materials ---------------- */
// Every mesh gets its own material so it can be highlighted or faded on its own.
// All are transparent so they can fade; depthWrite is switched off only while faded (see setVisibility).
const LOOK = {
  paint: { kind: "physical", color: 0x1f3f78, metalness: 0.55, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.08 },
  glass: { kind: "physical", color: 0x0b1118, metalness: 0.2, roughness: 0.04, clearcoat: 1, opacity: 0.6 },
  trim: { color: 0x15171b, metalness: 0.1, roughness: 0.55 },
  plastic: { color: 0x24272c, metalness: 0.05, roughness: 0.6 },
  rubber: { color: 0x141518, metalness: 0, roughness: 0.92 },
  chrome: { color: 0xe1e6eb, metalness: 1, roughness: 0.08 },
  alloy: { color: 0xbfc6ce, metalness: 0.9, roughness: 0.26 },
  aluminum: { color: 0xa7aeb6, metalness: 0.8, roughness: 0.4 },
  iron: { color: 0x50565d, metalness: 0.6, roughness: 0.58 },
  steel: { color: 0x7d848c, metalness: 0.85, roughness: 0.32 },
  darkSteel: { color: 0x3a3f46, metalness: 0.7, roughness: 0.45 },
  exhaust: { color: 0x6d5a4b, metalness: 0.7, roughness: 0.55 },
  ceramic: { color: 0xeeeeea, metalness: 0, roughness: 0.35 },
  caliper: { color: 0xc4202d, metalness: 0.3, roughness: 0.4 },
  filter: { color: 0x1f5fbf, metalness: 0.35, roughness: 0.38 },
  battery: { color: 0x1c1e22, metalness: 0.05, roughness: 0.55 },
  terminal: { color: 0xc62828, metalness: 0.2, roughness: 0.45 },
  hose: { color: 0x1a1b1e, metalness: 0, roughness: 0.8 },
  headlight: { kind: "physical", color: 0xb9c3cc, metalness: 0.4, roughness: 0.06, clearcoat: 1, emissive: 0xcfe6ff, emissiveIntensity: 0.12 },
  taillight: { kind: "physical", color: 0x7a0d14, metalness: 0.1, roughness: 0.1, clearcoat: 1, emissive: 0xff2a3a, emissiveIntensity: 0.35 },
  plate: { color: 0xe6e6df, metalness: 0, roughness: 0.5 },
  interior: { color: 0x0c0d10, metalness: 0, roughness: 0.9 },
};

let textures = null;
function canvasTexture(w, h, draw, repeat) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  t.anisotropy = 4;
  return t;
}
function getTextures() {
  if (textures) return textures;
  textures = {
    concrete: canvasTexture(512, 512, function (g, w, h) {
      g.fillStyle = "#2b2f36"; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 9000; i++) {
        const v = 30 + Math.random() * 40;
        g.fillStyle = "rgba(" + v + "," + (v + 3) + "," + (v + 8) + "," + (0.25 + Math.random() * 0.35) + ")";
        g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2);
      }
      g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = 2; g.strokeRect(0, 0, w, h); // slab joints
    }, [7, 7]),
    fins: canvasTexture(64, 256, function (g, w, h) {
      g.fillStyle = "#9aa1a8"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#3d4247"; for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 2);
      g.fillStyle = "#5f666d"; for (let x = 0; x < w; x += 16) g.fillRect(x, 0, 3, h);
    }, [6, 8]),
    battery: canvasTexture(256, 128, function (g, w, h) {
      g.fillStyle = "#e9e9e4"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#15171b"; g.font = "bold 64px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText("12V", w / 2, h / 2 + 4);
      g.fillStyle = "#c62828"; g.fillRect(0, h - 14, w, 14);
    }),
  };
  return textures;
}

export function material(key, extra) {
  const spec = Object.assign({}, LOOK[key], extra);
  const kind = spec.kind; delete spec.kind;
  const m = kind === "physical" ? new THREE.MeshPhysicalMaterial(spec) : new THREE.MeshStandardMaterial(spec);
  m.transparent = true;
  m.side = THREE.DoubleSide;
  m.userData.base = { opacity: m.opacity, emissive: m.emissive.getHex(), emissiveIntensity: m.emissiveIntensity };
  return m;
}

/** Fade (vis 0–1) and highlight (glow > 0, amber) everything inside obj. */
export function setVisibility(obj, vis, glow, glowColor) {
  obj.visible = vis > 0.02;
  if (!obj.visible) return;
  obj.traverse(function (m) {
    if (!m.isMesh) return;
    [].concat(m.material).forEach(function (mt) {
      const b = mt.userData.base;
      if (!b) return;
      mt.opacity = b.opacity * vis;
      mt.depthWrite = vis > 0.6;
      m.castShadow = vis > 0.5;
      if (glow > 0) { mt.emissive.setHex(glowColor); mt.emissiveIntensity = glow; }
      else { mt.emissive.setHex(b.emissive); mt.emissiveIntensity = b.emissiveIntensity; }
    });
  });
}

/* ---------------- geometry helpers ---------------- */
const rbox = (w, h, d, r) => new RoundedBoxGeometry(w, h, d, 3, Math.min(r == null ? 0.01 : r, w / 2, h / 2, d / 2));
const cyl = (r, h, seg, r2) => new THREE.CylinderGeometry(r, r2 == null ? r : r2, h, seg || 32);
const tube = (pts, r, closed, seg) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3().fromArray(p)), !!closed, "centripetal"), seg || 32, r, 10, !!closed);
const RX = [Math.PI / 2, 0, 0], RZ = [0, 0, Math.PI / 2];

function mesh(geo, look, pos, rot, extra) {
  const m = new THREE.Mesh(geo, material(look, extra));
  if (pos) m.position.set(pos[0], pos[1], pos[2]);
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function group(children, pos, rot) {
  const g = new THREE.Group();
  children.forEach((c) => g.add(c));
  if (pos) g.position.set(pos[0], pos[1], pos[2]);
  if (rot) g.rotation.set(rot[0], rot[1], rot[2]);
  return g;
}
/** Tag an object and everything inside it with a part id, for picking. */
function tag(obj, id) { obj.userData.id = id; obj.traverse((o) => { o.userData.id = id; }); return obj; }

// Piecewise curve through [x, y] points with smoothstep easing between them.
function profile(points) {
  return function (x) {
    if (x <= points[0][0]) return points[0][1];
    for (let i = 1; i < points.length; i++) {
      const [x1, y1] = points[i];
      if (x <= x1) {
        const [x0, y0] = points[i - 1];
        let t = (x - x0) / (x1 - x0); t = t * t * (3 - 2 * t);
        return y0 + (y1 - y0) * t;
      }
    }
    return points[points.length - 1][1];
  };
}
const sexp = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), e);

// Skin a surface through cross-sections taken at each x. section(x) returns [y, z] points around a closed ring.
function loft(xs, section) {
  const rings = xs.map(section), n = rings[0].length, pos = [], idx = [];
  rings.forEach((ring, i) => ring.forEach(([y, z]) => pos.push(xs[i], y, z)));
  for (let i = 0; i < xs.length - 1; i++) {
    for (let j = 0; j < n; j++) {
      const a = i * n + j, b = i * n + ((j + 1) % n), c = a + n, d = b + n;
      idx.push(a, b, c, b, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
const range = (a, b, n) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));

/* ---------------- garage ---------------- */
export function buildGarage(scene, renderer) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  scene.environment = env;
  scene.environmentIntensity = 0.75;
  scene.fog = new THREE.Fog(0x070b14, 10, 22);

  scene.add(new THREE.HemisphereLight(0xc4d6ff, 0x1a1d24, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(4, 8, 3.5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -4; key.shadow.camera.right = 4; key.shadow.camera.top = 4; key.shadow.camera.bottom = -4;
  key.shadow.camera.near = 1; key.shadow.camera.far = 20;
  key.shadow.bias = -0.0004; key.shadow.radius = 4;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x8fdcff, 0.9); rim.position.set(-5, 3, -4); scene.add(rim);

  const floor = new THREE.Mesh(new THREE.CircleGeometry(12, 64), new THREE.MeshStandardMaterial({ map: getTextures().concrete, roughness: 0.82, metalness: 0.05 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
  scene.add(floor);
  // painted service-bay lines
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xd8a425, roughness: 0.7 });
  [-1.55, 1.55].forEach((z) => { const l = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 0.08), lineMat); l.rotation.x = -Math.PI / 2; l.position.set(0, 0.003, z); l.receiveShadow = true; scene.add(l); });
  return env;
}

/* ---------------- car ---------------- */
const WHEEL_X = 1.45, AXLE_Y = 0.34;

function wheel(side) {
  // Tire: a lathed rounded cross-section, axis along z.
  const tireProfile = [[0.215, -0.1], [0.3, -0.112], [0.322, -0.095], [0.332, -0.05], [0.332, 0.05], [0.322, 0.095], [0.3, 0.112], [0.215, 0.1]].map((p) => new THREE.Vector2(p[0], p[1]));
  const tire = mesh(new THREE.LatheGeometry(tireProfile, 64), "rubber", null, RX);
  const barrel = mesh(new THREE.CylinderGeometry(0.218, 0.218, 0.19, 48, 1, true), "alloy", null, RX);
  const lip = mesh(new THREE.TorusGeometry(0.218, 0.008, 8, 48), "alloy", [0, 0, 0.09]);
  const hub = mesh(cyl(0.055, 0.03, 32), "alloy", [0, 0, 0.08], RX);
  const cap = mesh(cyl(0.03, 0.012, 24), "darkSteel", [0, 0, 0.096], RX);
  const parts = [tire, barrel, lip, hub, cap];
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2;
    const spoke = mesh(rbox(0.17, 0.036, 0.025, 0.008), "alloy", [Math.cos(a) * 0.13, Math.sin(a) * 0.13, 0.078], [0, 0, a]);
    const lug = mesh(cyl(0.008, 0.012, 6), "chrome", [Math.cos(a + 0.63) * 0.038, Math.sin(a + 0.63) * 0.038, 0.096], RX);
    parts.push(spoke, lug);
  }
  const g = group(parts);
  if (side < 0) g.rotation.y = Math.PI;
  return g;
}
function brake(side) {
  const disc = mesh(cyl(0.19, 0.022, 48), "steel", [0, 0, 0.0], RX);
  const hat = mesh(cyl(0.07, 0.03, 32), "darkSteel", [0, 0, 0.012], RX);
  const a = Math.PI * 0.72;
  const caliper = mesh(rbox(0.075, 0.13, 0.06, 0.015), "caliper", [Math.cos(a) * 0.165, Math.sin(a) * 0.165, 0.01], [0, 0, a]);
  const g = group([disc, hat, caliper]);
  if (side < 0) g.rotation.y = Math.PI;
  return g;
}

/** Returns { group, body: [faded in the engine bay], parts: [pickable, tagged with part ids] }. */
export function buildCar(options) {
  const paintColor = (options && options.paint) || 0x1f3f78;
  const car = new THREE.Group(), body = [], parts = [];
  const add = (obj, list) => { car.add(obj); list.push(obj); return obj; };

  // lower body: hood, doors, trunk. Wheel arches are cut by raising the bottom edge over each axle.
  const topL = profile([[-2.33, 0.6], [-2.24, 0.84], [-2.0, 0.97], [-1.55, 1.02], [-1.2, 1.0], [0.9, 0.98], [1.5, 0.95], [2.0, 0.9], [2.24, 0.78], [2.33, 0.58]]);
  const botBase = profile([[-2.33, 0.46], [-2.15, 0.31], [2.1, 0.29], [2.33, 0.44]]);
  const ARCH = 0.43;
  const bot = function (x) {
    let b = botBase(x);
    [WHEEL_X, -WHEEL_X].forEach(function (wx) { const d = Math.abs(x - wx); if (d < ARCH) b = Math.max(b, 0.28 + Math.sqrt(ARCH * ARCH - d * d)); });
    return b;
  };
  const ends = (x) => { const t = Math.max(0, (Math.abs(x) - 2.08) / 0.25); return Math.pow(Math.max(0, 1 - Math.pow(t, 2.6)), 1 / 2.6); };
  const N = 48;
  const lower = loft(range(-2.33, 2.33, 150), function (x) {
    const w = 0.88 * ends(x) + 0.001, b = bot(x), t = topL(x), mid = (b + t) / 2, h = (t - b) / 2, ring = [];
    for (let k = 0; k < N; k++) {
      const a = (k / N) * Math.PI * 2, ye = sexp(Math.sin(a), 0.3), ze = sexp(Math.cos(a), 0.22);
      ring.push([mid + h * ye, w * ze * (1 - 0.08 * Math.max(0, ye))]);
    }
    return ring;
  });
  add(new THREE.Mesh(lower, material("paint", { color: paintColor })), body);

  // greenhouse: tinted glass with painted roof and pillars
  const topC = profile([[-1.52, 0.99], [-0.98, 1.34], [-0.62, 1.42], [0.02, 1.42], [0.95, 0.97]]);
  const cabin = loft(range(-1.52, 0.95, 90), function (x) {
    const b = 0.95, t = Math.max(b + 0.004, topC(x)), mid = (b + t) / 2, h = (t - b) / 2, ring = [];
    for (let k = 0; k < N; k++) {
      const a = (k / N) * Math.PI * 2, ye = sexp(Math.sin(a), 0.42), y = mid + h * ye;
      const half = 0.78 - 0.22 * Math.max(0, (y - b) / 0.5);
      ring.push([y, half * sexp(Math.cos(a), 0.3)]);
    }
    return ring;
  });
  // split triangles: roof and pillars get paint, the rest is glass
  const p = cabin.attributes.position, nrm = new THREE.Vector3(), A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3();
  const index = cabin.index.array, paintTris = [], glassTris = [];
  for (let i = 0; i < index.length; i += 3) {
    A.fromBufferAttribute(p, index[i]); B.fromBufferAttribute(p, index[i + 1]); C.fromBufferAttribute(p, index[i + 2]);
    nrm.subVectors(C, B).cross(new THREE.Vector3().subVectors(A, B)).normalize();
    const cx = (A.x + B.x + C.x) / 3, cy = (A.y + B.y + C.y) / 3, cz = Math.abs(A.z + B.z + C.z) / 3;
    const roof = cy > 1.37, pillar = cz > 0.46 && Math.abs(nrm.x) > 0.45 && cy > 1.0, bPillar = cx > -0.36 && cx < -0.25;
    (roof || pillar || bPillar ? paintTris : glassTris).push(index[i], index[i + 1], index[i + 2]);
  }
  cabin.setIndex(paintTris.concat(glassTris));
  cabin.addGroup(0, paintTris.length, 0);
  cabin.addGroup(paintTris.length, glassTris.length, 1);
  const cabinMesh = new THREE.Mesh(cabin, [material("paint", { color: paintColor }), material("glass")]);
  add(cabinMesh, body);
  add(mesh(rbox(1.3, 0.3, 1.2, 0.1), "interior", [-0.45, 1.1, 0]), body);

  // front and rear details
  add(mesh(rbox(0.05, 0.15, 0.74, 0.02), "trim", [2.275, 0.62, 0]), body); // grille
  add(mesh(rbox(0.05, 0.08, 1.1, 0.02), "trim", [2.27, 0.45, 0]), body); // lower intake
  add(mesh(rbox(0.012, 0.1, 0.32, 0.005), "plate", [2.315, 0.5, 0]), body);
  add(mesh(rbox(0.012, 0.1, 0.32, 0.005), "plate", [-2.318, 0.62, 0]), body);
  [-1, 1].forEach(function (s) {
    parts.push(tag(add(mesh(rbox(0.12, 0.07, 0.3, 0.025), "headlight", [2.2, 0.8, s * 0.58], [0, s * 0.4, -0.25]), []), "lights"));
    add(mesh(rbox(0.1, 0.09, 0.32, 0.03), "taillight", [-2.22, 0.9, s * 0.6], [0, -s * 0.35, 0]), body);
    // mirrors
    add(group([mesh(rbox(0.04, 0.03, 0.08, 0.01), "trim", [0, -0.02, -s * 0.05]), mesh(rbox(0.11, 0.075, 0.13, 0.03), "paint", [0, 0.01, 0], null, { color: paintColor })], [0.8, 1.05, s * 0.87]), body);
    // door seams and handles, following the body side
    [0.9, -0.3, -1.3].forEach(function (x) {
      const yb = Math.max(bot(x) + 0.03, 0.36), yt = topL(x) - 0.03;
      add(mesh(new THREE.BoxGeometry(0.006, yt - yb, 0.004), "trim", [x, (yb + yt) / 2, s * 0.866]), body);
    });
    [0.38, -0.78].forEach((x) => add(mesh(rbox(0.11, 0.022, 0.02, 0.008), "chrome", [x, 0.87, s * 0.872]), body));
    // wipers
    parts.push(tag(add(mesh(rbox(0.025, 0.012, 0.56, 0.005), "trim", [0.93, 1.0, s * 0.24], [0, 0.18 * s, -0.5]), []), "wipers"));
  });
  parts.push(tag(add(mesh(cyl(0.038, 0.14, 24), "chrome", [-2.31, 0.36, 0.5], RZ), []), "exhaust"));

  // wheels and brakes
  [[WHEEL_X, 1], [WHEEL_X, -1], [-WHEEL_X, 1], [-WHEEL_X, -1]].forEach(function ([x, s]) {
    const w = wheel(s); w.position.set(x, AXLE_Y, s * 0.78); parts.push(tag(add(w, []), "tires"));
    const b = brake(s); b.position.set(x, AXLE_Y, s * 0.7); parts.push(tag(add(b, []), x > 0 ? "brakesF" : "brakesR"));
  });

  // the hood opens the engine bay: an invisible pick target over it
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.14, 1.5), new THREE.MeshBasicMaterial({ visible: false }));
  hood.position.set(1.58, 0.95, 0);
  parts.push(tag(add(hood, []), "engine"));

  car.traverse((o) => { if (o.isMesh) { o.castShadow = o.material.visible !== false; o.receiveShadow = true; } });
  return { group: car, body, parts };
}

/* ---------------- engine ---------------- */
// Closed belt path wrapped around pulleys ({ x, y, r }) in the plane z.
function beltPath(pulleys, z) {
  const cx = pulleys.reduce((s, p) => s + p.x, 0) / pulleys.length, cy = pulleys.reduce((s, p) => s + p.y, 0) / pulleys.length;
  const sorted = pulleys.slice().sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
  const pts = [];
  sorted.forEach(function (p) {
    const out = Math.atan2(p.y - cy, p.x - cx);
    for (let k = -2; k <= 2; k++) { const a = out + k * 0.55; pts.push([p.x + Math.cos(a) * (p.r + 0.008), p.y + Math.sin(a) * (p.r + 0.008), z]); }
  });
  return pts;
}

/**
 * Returns { group, parts, decor }. Each part/decor object carries userData.rest and userData.ex: its resting
 * position and its "exploded" offset in engine-local coordinates. The crankshaft runs along z, the front bank
 * faces the radiator (+x), the accessory belt is at +z and the timing belt at -z.
 */
export function buildEngine(cylinderCount) {
  const engine = new THREE.Group(), parts = [], decor = [];
  function place(id, obj, rest, ex) {
    obj.userData.rest = new THREE.Vector3().fromArray(rest);
    obj.userData.ex = new THREE.Vector3().fromArray(ex);
    obj.position.copy(obj.userData.rest);
    engine.add(obj);
    if (id) parts.push(tag(obj, id)); else decor.push(obj);
  }
  const cylinders = Math.max(3, Math.min(12, parseInt(cylinderCount, 10) || 6));
  const banks = cylinders >= 6 ? [-1, 1] : [0];
  const perBank = Math.ceil(cylinders / banks.length);
  const zs = Array.from({ length: perBank }, (_, i) => perBank === 1 ? 0 : -0.21 + (0.42 * i) / (perBank - 1));
  const vee = banks.length > 1;

  // block, heads, oil pan and mounts: "engine" (engine mounts)
  const blockParts = [
    mesh(rbox(0.56, 0.4, 0.64, 0.035), "iron"),
    mesh(rbox(0.5, 0.09, 0.58, 0.02), "darkSteel", [0, -0.25, 0]),
  ];
  [-1, 1].forEach(function (s) {
    blockParts.push(mesh(cyl(0.045, 0.06, 24), "rubber", [0, -0.14, s * 0.37], RX));
    blockParts.push(mesh(rbox(0.12, 0.03, 0.05, 0.008), "steel", [0, -0.18, s * 0.37]));
  });
  banks.forEach(function (s) {
    blockParts.push(mesh(rbox(vee ? 0.2 : 0.3, 0.12, 0.58, 0.02), "aluminum", [s * 0.17, 0.24, 0], [0, 0, -s * 0.3]));
  });
  place("engine", group(blockParts), [0, 0, 0], [0, 0, 0]);

  banks.forEach(function (s) {
    const x = s * 0.2, tilt = -s * 0.3, w = vee ? 0.19 : 0.28;
    // valve cover with cast ribs (and the oil filler cap on one bank)
    const vc = [mesh(rbox(w, 0.05, 0.54, 0.02), "aluminum")];
    [-0.05, 0, 0.05].forEach((rx) => vc.push(mesh(rbox(0.012, 0.014, 0.46, 0.004), "aluminum", [rx * (w / 0.19), 0.03, 0])));
    if (s <= 0) vc.push(mesh(cyl(0.025, 0.02, 24), "trim", [0, 0.035, 0.2]));
    place("vcg", group(vc, null, [0, 0, tilt]), [x, 0.32, 0], [s * 0.12, 0.26, 0]);
    zs.forEach(function (z) {
      place("coils", group([
        mesh(rbox(0.045, 0.09, 0.045, 0.008), "trim"),
        mesh(rbox(0.02, 0.022, 0.03, 0.004), "darkSteel", [0.03, 0.025, 0]),
        mesh(cyl(0.012, 0.03, 16), "rubber", [0, -0.055, 0]),
      ]), [x, 0.39, z], [s * 0.2, 0.52, 0]);
      place("plugs", group([
        mesh(cyl(0.011, 0.05, 16), "ceramic", [0, 0.03, 0]),
        mesh(cyl(0.017, 0.02, 6), "steel", [0, -0.005, 0]),
        mesh(cyl(0.008, 0.035, 12), "steel", [0, -0.03, 0]),
        mesh(cyl(0.005, 0.012, 8), "steel", [0, 0.062, 0]),
      ]), [x, 0.3, z], [s * 0.3, 0.8, 0]);
    });
  });

  // intake: plenum and runners (decor), throttle body, air box
  const plenumPos = vee ? [0, 0.42, 0] : [-0.28, 0.26, 0];
  const intake = [mesh(rbox(0.15, 0.1, 0.46, 0.03), "plastic", plenumPos)];
  banks.forEach(function (s) {
    zs.forEach(function (z) {
      const from = vee ? [0, 0.4, z] : [-0.26, 0.28, z], to = vee ? [s * 0.13, 0.3, z] : [-0.12, 0.3, z];
      const mid = vee ? [s * 0.08, 0.45, z] : [-0.2, 0.36, z];
      intake.push(mesh(tube([from, mid, to], 0.02, false, 16), "plastic"));
    });
  });
  place(null, group(intake), [0, 0, 0], [0, 0.12, 0]);
  place("tbody", group([
    mesh(cyl(0.055, 0.07, 32), "aluminum", null, RX),
    mesh(cyl(0.04, 0.072, 32), "darkSteel", null, RX),
    mesh(rbox(0.04, 0.05, 0.02, 0.006), "steel", [0.06, 0, 0]),
  ]), vee ? [0, 0.42, -0.29] : [-0.28, 0.26, -0.29], [0, 0.26, -0.36]);
  place("airf", group([
    mesh(rbox(0.26, 0.08, 0.22, 0.02), "plastic"),
    mesh(rbox(0.27, 0.05, 0.23, 0.02), "trim", [0, 0.06, 0]),
    mesh(rbox(0.02, 0.03, 0.012, 0.004), "steel", [0.08, 0.035, 0.118]),
    mesh(rbox(0.02, 0.03, 0.012, 0.004), "steel", [-0.08, 0.035, 0.118]),
    mesh(tube([[0.13, 0.0, 0], [0.22, 0.0, 0.04], [0.28, -0.04, 0.1]], 0.04, false, 16), "rubber"),
  ]), [0.3, 0.3, -0.55], [0.25, 0.3, -0.22]);

  // accessory drive at +z: crank damper, alternator, water pump, idler and the serpentine belt around them
  const crank = { x: 0, y: -0.1, r: 0.085 }, alt = { x: 0.15, y: 0.13, r: 0.045 }, wp = { x: -0.13, y: 0.1, r: 0.05 }, idler = { x: 0.02, y: 0.21, r: 0.035 };
  place(null, group([mesh(cyl(crank.r, 0.04, 48), "darkSteel", null, RX), mesh(cyl(0.05, 0.045, 32), "steel", null, RX)]), [crank.x, crank.y, 0.35], [0, 0, 0.36]);
  place(null, mesh(cyl(idler.r, 0.025, 32), "steel", null, RX), [idler.x, idler.y, 0.36], [0, 0.04, 0.4]);
  place("belt", mesh(tube(beltPath([crank, alt, idler, wp], 0), 0.009, true, 200), "rubber", null, null, { roughness: 0.75 }), [0, 0, 0.365], [0, 0, 0.58]);
  const altParts = [
    mesh(cyl(0.065, 0.11, 32), "aluminum", null, RX),
    mesh(cyl(0.06, 0.03, 32), "darkSteel", [0, 0, -0.07], RX),
    mesh(cyl(alt.r, 0.025, 32), "steel", [0, 0, 0.07], RX),
    mesh(cyl(0.008, 0.02, 8), "steel", [0.04, 0.04, -0.08], RX),
  ];
  [-0.03, 0, 0.03].forEach((z) => altParts.push(mesh(new THREE.TorusGeometry(0.066, 0.004, 6, 32), "aluminum", [0, 0, z])));
  place("alt", group(altParts), [alt.x, alt.y, 0.29], [0.24, 0.22, 0.38]);
  place("wpump", group([
    mesh(cyl(0.045, 0.06, 32), "aluminum", null, RX),
    mesh(cyl(wp.r, 0.02, 32), "steel", [0, 0, 0.055], RX),
  ]), [wp.x, wp.y, 0.3], [-0.24, 0.16, 0.38]);

  // timing drive at -z: sprockets (decor), tensioner and toothed belt
  const camY = 0.3, cams = vee ? [{ x: -0.17, y: camY, r: 0.07 }, { x: 0.17, y: camY, r: 0.07 }] : [{ x: 0, y: camY, r: 0.075 }];
  const tensioner = { x: 0.12, y: 0.02, r: 0.035 };
  const crankSprocket = { x: 0, y: -0.1, r: 0.06 };
  cams.concat([crankSprocket]).forEach((sp) => place(null, mesh(cyl(sp.r, 0.03, 40), "darkSteel", null, RX), [sp.x, sp.y, -0.35], [0, 0, -0.25]));
  place("tbelt", group([
    mesh(tube(beltPath(cams.concat([crankSprocket, tensioner]), 0), 0.011, true, 220), "rubber"),
    mesh(cyl(tensioner.r, 0.03, 32), "steel", [tensioner.x, tensioner.y, 0], RX),
  ]), [0, 0, -0.37], [0, -0.04, -0.5]);

  // cooling: thermostat housing, hoses, radiator
  place("thermo", group([
    mesh(cyl(0.035, 0.05, 32), "aluminum"),
    mesh(cyl(0.045, 0.01, 32), "aluminum", [0, -0.028, 0]),
    mesh(cyl(0.022, 0.06, 24), "aluminum", [0.03, 0.01, 0.02], [0, 0.6, Math.PI / 2]),
  ]), [0.22, 0.2, 0.2], [0.26, 0.24, 0.16]);
  [[[0.24, 0.2, 0.23], [0.42, 0.26, 0.34], [0.62, 0.14, 0.44]], [[-0.05, -0.16, 0.3], [0.3, -0.26, 0.42], [0.62, -0.2, 0.44]]].forEach(function (pts, i) {
    const ends = [pts[0], pts[pts.length - 1]].map((p) => mesh(new THREE.TorusGeometry(0.026, 0.005, 8, 24), "steel", p, [0, Math.PI / 2, 0]));
    place("hoses", group([mesh(tube(pts, 0.022, false, 40), "hose")].concat(ends)), [0, 0, 0], [0.22, i ? -0.04 : 0.04, 0.24]);
  });
  place("rad", group([
    mesh(new THREE.BoxGeometry(0.045, 0.42, 1.0), "aluminum", null, null, { map: getTextures().fins, roughness: 0.55 }),
    mesh(rbox(0.07, 0.46, 0.06, 0.012), "plastic", [0, 0, 0.53]),
    mesh(rbox(0.07, 0.46, 0.06, 0.012), "plastic", [0, 0, -0.53]),
    mesh(cyl(0.022, 0.02, 24), "chrome", [0, 0.24, 0.53]),
  ]), [0.66, -0.05, 0], [0.5, 0, 0]);

  // underside and electrical: oil filter, exhaust manifold + O2 sensor, starter, battery, PCV
  place("oil", group([
    mesh(cyl(0.05, 0.1, 40), "filter"),
    mesh(cyl(0.052, 0.014, 40), "darkSteel", [0, 0.055, 0]),
    mesh(new THREE.TorusGeometry(0.05, 0.004, 6, 40), "darkSteel", [0, -0.05, 0], RX),
  ], null, [0, 0, 0.5]), [0.3, -0.16, -0.15], [0.32, -0.16, -0.12]);
  const manifold = [mesh(cyl(0.035, 0.5, 24), "exhaust", [0.37, -0.05, 0], RX)];
  zs.forEach((z) => manifold.push(mesh(tube([[vee ? 0.27 : 0.15, 0.2, z], [0.36, 0.1, z], [0.37, -0.03, z * 0.9]], 0.022, false, 16), "exhaust")));
  place(null, group(manifold), [0, 0, 0], [0.12, -0.04, 0]);
  place("o2", group([
    mesh(cyl(0.012, 0.07, 16), "steel"),
    mesh(cyl(0.018, 0.02, 6), "steel", [0, -0.02, 0]),
    mesh(tube([[0, 0.035, 0], [0, 0.08, 0.02], [0.03, 0.12, 0.06]], 0.005, false, 12), "trim"),
  ], null, [0, 0, -0.4]), [0.42, -0.1, 0.12], [0.38, -0.28, 0.12]);
  place("starter", group([
    mesh(cyl(0.045, 0.15, 32), "darkSteel", null, RZ),
    mesh(cyl(0.026, 0.1, 24), "steel", [0.01, 0.06, 0], RZ),
    mesh(cyl(0.02, 0.04, 12), "steel", [0.095, 0, 0], RZ),
  ]), [-0.32, -0.15, -0.2], [-0.32, -0.16, -0.14]);
  place("batt", group([
    mesh(rbox(0.3, 0.2, 0.2, 0.012), "battery"),
    mesh(rbox(0.305, 0.03, 0.205, 0.01), "plastic", [0, 0.11, 0]),
    mesh(cyl(0.015, 0.03, 16), "terminal", [0.1, 0.14, 0.05]),
    mesh(cyl(0.015, 0.03, 16), "darkSteel", [-0.1, 0.14, 0.05]),
    mesh(new THREE.PlaneGeometry(0.16, 0.08), "plate", [0, 0.02, 0.101], null, { map: getTextures().battery }),
  ]), [0.35, 0.05, 0.62], [0.18, 0.24, 0.24]);
  const pcvBack = vee ? -0.2 : -0.1;
  place("pcv", group([
    mesh(cyl(0.016, 0.04, 16), "trim"),
    mesh(tube([[0, 0.02, 0], [0.04, 0.06, 0], [0.1, 0.06, -0.05]], 0.008, false, 12), "hose"),
  ]), [pcvBack, 0.37, 0.22], [-0.28, 0.4, 0.22]);

  return { group: engine, parts, decor };
}
