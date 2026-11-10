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
// Body styles. The VIN's body class picks one (styleFor). Coordinates are meters; x forward, y up.
const STYLES = {
  sedan: {
    half: 2.33, wheelX: 1.45, axle: 0.34, wheelScale: 1, width: 0.88, arch: 0.43, endStart: 2.08, endLen: 0.25,
    top: [[-2.33, 0.6], [-2.24, 0.84], [-2.0, 0.97], [-1.55, 1.02], [-1.2, 1.0], [0.9, 0.98], [1.5, 0.95], [2.0, 0.9], [2.24, 0.78], [2.33, 0.58]],
    bot: [[-2.33, 0.46], [-2.15, 0.31], [2.1, 0.29], [2.33, 0.44]],
    cabin: { x0: -1.52, x1: 0.95, base: 0.95, wBottom: 0.78, wTopDrop: 0.22, bPillar: [-0.36, -0.25],
      top: [[-1.52, 0.99], [-0.98, 1.34], [-0.62, 1.42], [0.02, 1.42], [0.95, 0.97]] },
    interior: { size: [1.3, 0.3, 1.2], pos: [-0.45, 1.1, 0] },
    grille: { x: 2.275, y: 0.62, h: 0.15, w: 0.74 }, intake: { x: 2.27, y: 0.45, w: 1.1 },
    plates: { front: [2.315, 0.5], rear: [-2.318, 0.62] },
    headlight: { pos: [2.2, 0.8, 0.58], size: [0.12, 0.07, 0.3] },
    taillight: { pos: [-2.22, 0.9, 0.6], size: [0.1, 0.09, 0.32], rotY: 0.35 },
    mirror: [0.8, 1.05, 0.87], seams: [0.9, -0.3, -1.3], handles: [0.38, -0.78], handleY: 0.87, sideZ: 0.866,
    wipers: [0.93, 1.0], exhaust: [-2.31, 0.36, 0.5],
    engineAt: [1.45, 0.78, 0], hood: { pos: [1.58, 0.95, 0], size: [1.25, 0.14, 1.5] },
    rails: null, cladding: false,
  },
  // Small crossover / tall hatch (Soul, Seltos, Niro and similar): shorter, taller, upright tailgate.
  crossover: {
    half: 2.13, wheelX: 1.3, axle: 0.36, wheelScale: 1.07, width: 0.9, arch: 0.46, endStart: 1.9, endLen: 0.23,
    top: [[-2.13, 0.72], [-2.08, 1.0], [-1.95, 1.08], [-1.4, 1.1], [0.75, 1.06], [1.35, 1.02], [1.85, 0.97], [2.06, 0.86], [2.13, 0.66]],
    bot: [[-2.13, 0.52], [-1.98, 0.37], [1.92, 0.36], [2.13, 0.52]],
    cabin: { x0: -2.04, x1: 0.8, base: 1.03, wBottom: 0.8, wTopDrop: 0.18, bPillar: [-0.55, -0.45],
      top: [[-2.04, 1.08], [-1.98, 1.48], [-1.86, 1.6], [-0.3, 1.63], [0.12, 1.6], [0.8, 1.05]] },
    interior: { size: [1.7, 0.32, 1.25], pos: [-0.7, 1.22, 0] },
    grille: { x: 2.1, y: 0.72, h: 0.13, w: 0.86 }, intake: { x: 2.1, y: 0.53, w: 1.15 },
    plates: { front: [2.135, 0.58], rear: [-2.135, 0.78] },
    headlight: { pos: [2.03, 0.9, 0.6], size: [0.11, 0.07, 0.32] },
    taillight: { pos: [-2.06, 1.18, 0.68], size: [0.08, 0.32, 0.12], rotY: 0.2 },
    mirror: [0.62, 1.13, 0.9], seams: [0.72, -0.38, -1.4], handles: [0.22, -0.9], handleY: 0.98, sideZ: 0.886,
    wipers: [0.78, 1.08], exhaust: [-2.12, 0.42, 0.5],
    engineAt: [1.3, 0.85, 0], hood: { pos: [1.42, 1.04, 0], size: [1.15, 0.14, 1.55] },
    rails: { y: 1.665, x0: -1.75, x1: 0.05, z: 0.56 }, cladding: true,
  },
};

/** NHTSA body class → body style. */
export function styleFor(bodyClass) {
  return /sport utility|suv|crossover|cuv|wagon|hatch|mpv|minivan|van/i.test(String(bodyClass || "")) ? "crossover" : "sedan";
}

function wheel(side, scale) {
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
  g.scale.set(scale, scale, 1);
  if (side < 0) g.rotation.y = Math.PI;
  return g;
}
function brake(side, scale) {
  const disc = mesh(cyl(0.19, 0.022, 48), "steel", [0, 0, 0.0], RX);
  const hat = mesh(cyl(0.07, 0.03, 32), "darkSteel", [0, 0, 0.012], RX);
  const a = Math.PI * 0.72;
  const caliper = mesh(rbox(0.075, 0.13, 0.06, 0.015), "caliper", [Math.cos(a) * 0.165, Math.sin(a) * 0.165, 0.01], [0, 0, a]);
  const g = group([disc, hat, caliper]);
  g.scale.set(scale, scale, 1);
  if (side < 0) g.rotation.y = Math.PI;
  return g;
}

/**
 * options.style: "sedan" or "crossover". Returns { group, body: [faded in the engine views],
 * parts: [pickable, tagged with part ids], engineAt: where the engine sits }.
 */
export function buildCar(options) {
  const S = STYLES[(options && options.style) || "sedan"] || STYLES.sedan;
  const paintColor = (options && options.paint) || 0x1f3f78;
  const car = new THREE.Group(), body = [], parts = [];
  const add = (obj, list) => { car.add(obj); list.push(obj); return obj; };
  const paint = () => ({ color: paintColor });

  // lower body: hood, doors, trunk or tailgate. Wheel arches are cut by raising the bottom edge over each axle.
  const topL = profile(S.top), botBase = profile(S.bot);
  const bot = function (x) {
    let b = botBase(x);
    [S.wheelX, -S.wheelX].forEach(function (wx) { const d = Math.abs(x - wx); if (d < S.arch) b = Math.max(b, S.axle - 0.06 + Math.sqrt(S.arch * S.arch - d * d)); });
    return b;
  };
  const ends = (x) => { const t = Math.max(0, (Math.abs(x) - S.endStart) / S.endLen); return Math.pow(Math.max(0, 1 - Math.pow(t, 2.6)), 1 / 2.6); };
  const N = 48;
  const lower = loft(range(-S.half, S.half, 150), function (x) {
    const w = S.width * ends(x) + 0.001, b = bot(x), t = topL(x), mid = (b + t) / 2, h = (t - b) / 2, ring = [];
    for (let k = 0; k < N; k++) {
      const a = (k / N) * Math.PI * 2, ye = sexp(Math.sin(a), 0.3), ze = sexp(Math.cos(a), 0.22);
      ring.push([mid + h * ye, w * ze * (1 - 0.08 * Math.max(0, ye))]);
    }
    return ring;
  });
  add(new THREE.Mesh(lower, material("paint", paint())), body);

  // greenhouse: tinted glass with painted roof and pillars
  const C0 = S.cabin, topC = profile(C0.top), roofY = Math.max.apply(null, C0.top.map((p) => p[1]));
  const cabin = loft(range(C0.x0, C0.x1, 90), function (x) {
    const b = C0.base, t = Math.max(b + 0.004, topC(x)), mid = (b + t) / 2, h = (t - b) / 2, ring = [];
    for (let k = 0; k < N; k++) {
      const a = (k / N) * Math.PI * 2, ye = sexp(Math.sin(a), 0.42), y = mid + h * ye;
      const half = C0.wBottom - C0.wTopDrop * Math.max(0, (y - b) / 0.5);
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
    const roof = cy > roofY - 0.06, pillar = cz > 0.46 && Math.abs(nrm.x) > 0.45 && cy > C0.base + 0.05;
    const bPillar = cx > C0.bPillar[0] && cx < C0.bPillar[1];
    (roof || pillar || bPillar ? paintTris : glassTris).push(index[i], index[i + 1], index[i + 2]);
  }
  cabin.setIndex(paintTris.concat(glassTris));
  cabin.addGroup(0, paintTris.length, 0);
  cabin.addGroup(paintTris.length, glassTris.length, 1);
  add(new THREE.Mesh(cabin, [material("paint", paint()), material("glass")]), body);
  add(mesh(rbox(S.interior.size[0], S.interior.size[1], S.interior.size[2], 0.1), "interior", S.interior.pos), body);

  // front and rear details
  add(mesh(rbox(0.05, S.grille.h, S.grille.w, 0.02), "trim", [S.grille.x, S.grille.y, 0]), body);
  add(mesh(rbox(0.05, 0.08, S.intake.w, 0.02), "trim", [S.intake.x, S.intake.y, 0]), body);
  add(mesh(rbox(0.012, 0.1, 0.32, 0.005), "plate", [S.plates.front[0], S.plates.front[1], 0]), body);
  add(mesh(rbox(0.012, 0.1, 0.32, 0.005), "plate", [S.plates.rear[0], S.plates.rear[1], 0]), body);
  [-1, 1].forEach(function (s) {
    const hl = S.headlight, tl = S.taillight;
    parts.push(tag(add(mesh(rbox(hl.size[0], hl.size[1], hl.size[2], 0.025), "headlight", [hl.pos[0], hl.pos[1], s * hl.pos[2]], [0, s * 0.4, -0.25]), []), "lights"));
    add(mesh(rbox(tl.size[0], tl.size[1], tl.size[2], 0.03), "taillight", [tl.pos[0], tl.pos[1], s * tl.pos[2]], [0, -s * tl.rotY, 0]), body);
    add(group([mesh(rbox(0.04, 0.03, 0.08, 0.01), "trim", [0, -0.02, -s * 0.05]), mesh(rbox(0.11, 0.075, 0.13, 0.03), "paint", [0, 0.01, 0], null, paint())], [S.mirror[0], S.mirror[1], s * S.mirror[2]]), body);
    // door seams and handles, following the body side
    S.seams.forEach(function (x) {
      const yb = Math.max(bot(x) + 0.03, S.axle + 0.02), yt = topL(x) - 0.03;
      add(mesh(new THREE.BoxGeometry(0.006, yt - yb, 0.004), "trim", [x, (yb + yt) / 2, s * S.sideZ]), body);
    });
    S.handles.forEach((x) => add(mesh(rbox(0.11, 0.022, 0.02, 0.008), "chrome", [x, S.handleY, s * (S.sideZ + 0.006)]), body));
    parts.push(tag(add(mesh(rbox(0.025, 0.012, 0.56, 0.005), "trim", [S.wipers[0], S.wipers[1], s * 0.24], [0, 0.18 * s, -0.5]), []), "wipers"));
    if (S.rails) add(mesh(rbox(S.rails.x1 - S.rails.x0, 0.025, 0.035, 0.01), "trim", [(S.rails.x0 + S.rails.x1) / 2, S.rails.y, s * S.rails.z]), body);
    if (S.cladding) {
      // black wheel-arch trim, a crossover cue
      [S.wheelX, -S.wheelX].forEach((wx) => add(mesh(new THREE.TorusGeometry(S.arch + 0.01, 0.03, 8, 32, Math.PI), "trim", [wx, S.axle - 0.06, s * (S.sideZ - 0.005)]), body));
    }
  });
  parts.push(tag(add(mesh(cyl(0.038, 0.14, 24), "chrome", S.exhaust, RZ), []), "exhaust"));

  // wheels and brakes
  [[S.wheelX, 1], [S.wheelX, -1], [-S.wheelX, 1], [-S.wheelX, -1]].forEach(function ([x, s]) {
    const w = wheel(s, S.wheelScale); w.position.set(x, S.axle, s * 0.78); parts.push(tag(add(w, []), "tires"));
    const b = brake(s, S.wheelScale); b.position.set(x, S.axle, s * 0.7); parts.push(tag(add(b, []), x > 0 ? "brakesF" : "brakesR"));
  });

  // the hood opens the engine bay: an invisible pick target over it
  const hood = new THREE.Mesh(new THREE.BoxGeometry(S.hood.size[0], S.hood.size[1], S.hood.size[2]), new THREE.MeshBasicMaterial({ visible: false }));
  hood.position.set(S.hood.pos[0], S.hood.pos[1], S.hood.pos[2]);
  parts.push(tag(add(hood, []), "engine"));

  car.traverse((o) => { if (o.isMesh) { o.castShadow = o.material.visible !== false; o.receiveShadow = true; } });
  return { group: car, body, parts, engineAt: new THREE.Vector3().fromArray(S.engineAt) };
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

let gasketTextures = {};
function gasketTexture(bores) {
  if (gasketTextures[bores]) return gasketTextures[bores];
  return (gasketTextures[bores] = canvasTexture(128, 512, function (g, w, h) {
    g.fillStyle = "#8d949b"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "#5c636a"; g.lineWidth = 6; g.strokeRect(4, 4, w - 8, h - 8);
    for (let i = 0; i < bores; i++) {
      const cy = (h / bores) * (i + 0.5);
      g.fillStyle = "#1b1e22"; g.beginPath(); g.arc(w / 2, cy, w * 0.33, 0, Math.PI * 2); g.fill();
      g.strokeStyle = "#c4cad0"; g.lineWidth = 4; g.beginPath(); g.arc(w / 2, cy, w * 0.36, 0, Math.PI * 2); g.stroke();
      g.fillStyle = "#2a2e33";
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([dx, dy]) => { g.beginPath(); g.arc(w / 2 + dx * w * 0.42, cy + dy * (h / bores) * 0.42, 5, 0, Math.PI * 2); g.fill(); });
    }
  }));
}

// Mesh stretched between two points (for connecting rods).
function between(a, b, thickness, look) {
  const dir = new THREE.Vector3().subVectors(b, a), len = dir.length();
  const m = mesh(rbox(thickness, len, thickness * 0.6, thickness * 0.25), look);
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return m;
}

/**
 * spec: { cylinders, year }. Returns { group, parts, decor, inside }.
 * parts/decor sit in the engine bay; inside holds the internals (pistons, rings, rods, crankshaft, cams, valves,
 * head gasket). Every object carries userData.rest and userData.ex: its resting position and its "exploded" offset
 * in engine-local coordinates. The crankshaft runs along z (the engine is mounted sideways) and the front of the
 * engine faces the radiator (+x).
 *
 * Inline engines follow the layout of modern front-drive inline-4s such as Kia's: intake at the front, exhaust
 * toward the firewall, accessory belt and timing chain on the passenger side (-z). V engines put the accessory
 * belt at +z and the timing drive at -z.
 */
export function buildEngine(spec) {
  const engine = new THREE.Group(), parts = [], decor = [], inside = [];
  function place(id, obj, rest, ex, list) {
    obj.userData.rest = new THREE.Vector3().fromArray(rest);
    obj.userData.ex = new THREE.Vector3().fromArray(ex);
    obj.position.copy(obj.userData.rest);
    engine.add(obj);
    if (list) list.push(tag(obj, id)); else if (id) parts.push(tag(obj, id)); else decor.push(obj);
  }
  const cylinders = Math.max(3, Math.min(12, parseInt(spec && spec.cylinders, 10) || 6));
  const year = parseInt(spec && spec.year, 10) || 2020;
  const banks = cylinders >= 6 ? [-1, 1] : [0];
  const vee = banks.length > 1;
  const perBank = Math.ceil(cylinders / banks.length);
  const zs = Array.from({ length: perBank }, (_, i) => perBank === 1 ? 0 : -0.21 + (0.42 * i) / (perBank - 1));
  const chain = year >= 2010 || (!vee && year >= 2006);
  const az = vee ? 1 : -1; // accessory drive end

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

  // intake: plenum and runners (decor), throttle body, air box. Inline engines breathe from the front.
  const plenumPos = vee ? [0, 0.42, 0] : [0.29, 0.27, 0];
  const intake = [mesh(rbox(0.15, 0.1, 0.46, 0.03), "plastic", plenumPos)];
  banks.forEach(function (s) {
    zs.forEach(function (z) {
      const from = vee ? [0, 0.4, z] : [0.27, 0.29, z], to = vee ? [s * 0.13, 0.3, z] : [0.11, 0.3, z];
      const mid = vee ? [s * 0.08, 0.45, z] : [0.2, 0.37, z];
      intake.push(mesh(tube([from, mid, to], 0.02, false, 16), "plastic"));
    });
  });
  place(null, group(intake), [0, 0, 0], [0, 0.12, 0]);
  place("tbody", group([
    mesh(cyl(0.055, 0.07, 32), "aluminum", null, RX),
    mesh(cyl(0.04, 0.072, 32), "darkSteel", null, RX),
    mesh(rbox(0.04, 0.05, 0.02, 0.006), "steel", [0.06, 0, 0]),
  ]), vee ? [0, 0.42, -0.29] : [0.29, 0.27, 0.29], vee ? [0, 0.26, -0.36] : [0.02, 0.26, 0.36]);
  place("airf", group([
    mesh(rbox(0.26, 0.08, 0.22, 0.02), "plastic"),
    mesh(rbox(0.27, 0.05, 0.23, 0.02), "trim", [0, 0.06, 0]),
    mesh(rbox(0.02, 0.03, 0.012, 0.004), "steel", [0.08, 0.035, 0.118]),
    mesh(rbox(0.02, 0.03, 0.012, 0.004), "steel", [-0.08, 0.035, 0.118]),
    mesh(tube([[0.13, 0.0, 0], [0.22, 0.0, 0.04], [0.28, -0.04, 0.1]], 0.04, false, 16), "rubber"),
  ], null, vee ? null : [0, Math.PI / 2, 0]), vee ? [0.3, 0.3, -0.55] : [0.02, 0.33, 0.58], vee ? [0.25, 0.3, -0.22] : [0.02, 0.3, 0.24]);

  // accessory drive: crank damper, alternator, water pump, idler and the serpentine belt around them
  const crank = { x: 0, y: -0.1, r: 0.085 }, alt = { x: 0.15, y: 0.13, r: 0.045 }, wp = { x: -0.13, y: 0.1, r: 0.05 }, idler = { x: 0.02, y: 0.21, r: 0.035 };
  const facing = az > 0 ? null : [0, Math.PI, 0]; // pulleys face outward
  place(null, group([mesh(cyl(crank.r, 0.04, 48), "darkSteel", null, RX), mesh(cyl(0.05, 0.045, 32), "steel", null, RX)]), [crank.x, crank.y, az * 0.37], [0, 0, az * 0.4]);
  place(null, mesh(cyl(idler.r, 0.025, 32), "steel", null, RX), [idler.x, idler.y, az * 0.38], [0, 0.04, az * 0.44]);
  place("belt", mesh(tube(beltPath([crank, alt, idler, wp], 0), 0.009, true, 200), "rubber", null, null, { roughness: 0.75 }), [0, 0, az * 0.385], [0, 0, az * 0.62]);
  const altParts = [
    mesh(cyl(0.065, 0.11, 32), "aluminum", null, RX),
    mesh(cyl(0.06, 0.03, 32), "darkSteel", [0, 0, -0.07], RX),
    mesh(cyl(alt.r, 0.025, 32), "steel", [0, 0, 0.07], RX),
    mesh(cyl(0.008, 0.02, 8), "steel", [0.04, 0.04, -0.08], RX),
  ];
  [-0.03, 0, 0.03].forEach((z) => altParts.push(mesh(new THREE.TorusGeometry(0.066, 0.004, 6, 32), "aluminum", [0, 0, z])));
  place("alt", group(altParts, null, facing), [alt.x, alt.y, az * 0.31], [0.24, 0.22, az * 0.4]);
  place("wpump", group([
    mesh(cyl(0.045, 0.06, 32), "aluminum", null, RX),
    mesh(cyl(wp.r, 0.02, 32), "steel", [0, 0, 0.055], RX),
  ], null, facing), [wp.x, wp.y, az * 0.32], [-0.24, 0.16, az * 0.4]);

  // timing drive at -z: cam and crank sprockets (decor), tensioner and either a toothed belt or a chain
  const camY = 0.3, cams = vee ? [{ x: -0.17, y: camY, r: 0.07 }, { x: 0.17, y: camY, r: 0.07 }] : [{ x: -0.05, y: camY, r: 0.06 }, { x: 0.05, y: camY, r: 0.06 }];
  const tensioner = { x: 0.12, y: 0.02, r: 0.035 };
  const crankSprocket = { x: 0, y: -0.1, r: chain ? 0.045 : 0.06 };
  const tz = vee ? -0.35 : -0.335;
  cams.concat([crankSprocket]).forEach((sp) => place(null, mesh(cyl(sp.r, 0.025, 40), "darkSteel", null, RX), [sp.x, sp.y, tz], [0, 0, -0.22]));
  const drive = [
    mesh(tube(beltPath(cams.concat([crankSprocket, tensioner]), 0), chain ? 0.008 : 0.011, true, 220), chain ? "steel" : "rubber", null, null, chain ? { roughness: 0.3 } : null),
    mesh(cyl(tensioner.r, 0.025, 32), "steel", [tensioner.x, tensioner.y, 0], RX),
  ];
  if (chain) drive.push(mesh(rbox(0.02, 0.3, 0.02, 0.006), "plastic", [-0.11, 0.1, 0], [0, 0, 0.12])); // chain guide
  place(chain ? "tchain" : "tbelt", group(drive), [0, 0, tz - 0.02], [0, -0.04, vee ? -0.5 : -0.3]);

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

  // underside and electrical: oil filter, exhaust manifold + O2 sensor, starter, battery, PCV.
  // Inline engines exhaust toward the firewall (-x); V engines here run the front bank's manifold at +x.
  const ex = vee ? 1 : -1;
  place("oil", group([
    mesh(cyl(0.05, 0.1, 40), "filter"),
    mesh(cyl(0.052, 0.014, 40), "darkSteel", [0, 0.055, 0]),
    mesh(new THREE.TorusGeometry(0.05, 0.004, 6, 40), "darkSteel", [0, -0.05, 0], RX),
  ], null, [0, 0, 0.5]), [0.3, -0.16, -0.15], [0.32, -0.16, -0.12]);
  const manifold = [mesh(cyl(0.035, 0.5, 24), "exhaust", [ex * 0.37, -0.05, 0], RX)];
  zs.forEach((z) => manifold.push(mesh(tube([[ex * (vee ? 0.27 : 0.15), 0.2, z], [ex * 0.33, 0.1, z], [ex * 0.37, -0.03, z * 0.9]], 0.022, false, 16), "exhaust")));
  place(null, group(manifold), [0, 0, 0], [ex * 0.12, -0.04, 0]);
  place("o2", group([
    mesh(cyl(0.012, 0.07, 16), "steel"),
    mesh(cyl(0.018, 0.02, 6), "steel", [0, -0.02, 0]),
    mesh(tube([[0, 0.035, 0], [0, 0.08, 0.02], [0.03, 0.12, 0.06]], 0.005, false, 12), "trim"),
  ], null, [0, 0, -ex * 0.4]), [ex * 0.42, -0.1, 0.12], [ex * 0.38, -0.28, 0.12]);
  place("starter", group([
    mesh(cyl(0.045, 0.15, 32), "darkSteel", null, RZ),
    mesh(cyl(0.026, 0.1, 24), "steel", [0.01, 0.06, 0], RZ),
    mesh(cyl(0.02, 0.04, 12), "steel", [0.095, 0, 0], RZ),
  ]), vee ? [-0.32, -0.15, -0.2] : [-0.24, -0.15, 0.3], vee ? [-0.32, -0.16, -0.14] : [-0.3, -0.16, 0.22]);
  place("batt", group([
    mesh(rbox(0.3, 0.2, 0.2, 0.012), "battery"),
    mesh(rbox(0.305, 0.03, 0.205, 0.01), "plastic", [0, 0.11, 0]),
    mesh(cyl(0.015, 0.03, 16), "terminal", [0.1, 0.14, 0.05]),
    mesh(cyl(0.015, 0.03, 16), "darkSteel", [-0.1, 0.14, 0.05]),
    mesh(new THREE.PlaneGeometry(0.16, 0.08), "plate", [0, 0.02, 0.101], null, { map: getTextures().battery }),
  ]), vee ? [0.35, 0.05, 0.62] : [0.42, 0.04, 0.62], [0.18, 0.24, 0.24]);
  place("pcv", group([
    mesh(cyl(0.016, 0.04, 16), "trim"),
    mesh(tube([[0, 0.02, 0], [0.04, 0.06, 0], [0.1, 0.06, -0.05]], 0.008, false, 12), "hose"),
  ]), [vee ? -0.2 : -0.1, 0.37, 0.22], [-0.28, 0.4, 0.22]);

  /* ---- internals: the rotating assembly and valvetrain, hidden inside the block until the engine is opened ---- */
  const crankC = new THREE.Vector3(0, -0.12, 0), throwR = 0.04, rodLen = 0.19;
  const crankParts = [mesh(cyl(0.022, 0.62, 24), "steel", [0, crankC.y, 0], RX)];
  crankParts.push(mesh(cyl(0.09, 0.02, 48), "darkSteel", [0, crankC.y, az > 0 ? -0.32 : 0.32], RX)); // flywheel flange (transmission end)
  banks.forEach(function (s, bi) {
    const lean = vee ? s * 0.3 : 0;
    const u = new THREE.Vector3(Math.sin(lean), Math.cos(lean), 0); // cylinder axis
    const v = new THREE.Vector3(u.y, -u.x, 0); // across the bore
    const rot = [0, 0, -lean];
    zs.forEach(function (z, i) {
      // crank throw angle: inline-4 runs 1&4 up, 2&3 down; V engines spread evenly with the banks offset
      const phase = vee ? (i * 2 * Math.PI) / perBank + bi * (Math.PI / 3) : (i === 0 || i === perBank - 1 ? 0 : Math.PI);
      const zc = z + (vee ? bi * 0.03 - 0.015 : 0);
      const C = crankC.clone().setZ(zc);
      const pin = C.clone().addScaledVector(u, throwR * Math.cos(phase)).addScaledVector(v, throwR * Math.sin(phase));
      const along = throwR * Math.cos(phase) + Math.sqrt(rodLen * rodLen - Math.pow(throwR * Math.sin(phase), 2));
      const wrist = C.clone().addScaledVector(u, along);

      // crankshaft throw: rod journal and two counterweights opposite it
      const cwAngle = Math.atan2(-(pin.y - C.y), -(pin.x - C.x)); // half-disc faces +x before rotating
      crankParts.push(mesh(cyl(0.02, 0.04, 20), "steel", [pin.x, pin.y, zc], RX));
      [-0.026, 0.026].forEach((dz) => {
        const cw = mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.014, 32, 1, false, 0, Math.PI), "darkSteel", [C.x, C.y, zc + dz], [Math.PI / 2, 0, 0]);
        cw.rotation.order = "ZXY"; cw.rotation.z = cwAngle;
        crankParts.push(cw);
      });

      // connecting rod: beam, big end around the crank pin, small end on the wrist pin
      const rodObj = group([
        between(pin, wrist, 0.026, "darkSteel"),
        mesh(new THREE.TorusGeometry(0.024, 0.008, 10, 24), "darkSteel", [pin.x, pin.y, zc]),
        mesh(new THREE.TorusGeometry(0.013, 0.006, 10, 20), "darkSteel", [wrist.x, wrist.y, zc]),
      ]);
      place("rods", rodObj, [0, 0, 0], [u.x * 0.02, -0.08, 0], inside);

      // piston with wrist pin; rings ride in its grooves
      const pistonAt = wrist.clone();
      place("pistons", group([
        mesh(cyl(0.038, 0.05, 40), "aluminum", [0, 0.012, 0]),
        mesh(cyl(0.036, 0.006, 40), "alloy", [0, 0.04, 0]),
        mesh(cyl(0.009, 0.08, 16), "steel", null, RX),
      ], null, rot), [pistonAt.x, pistonAt.y, zc], [u.x * 0.14, u.y * 0.14, 0], inside);
      place("rings", group([0.03, 0.022, 0.014].map((h) => mesh(new THREE.TorusGeometry(0.0385, 0.0022, 6, 40), "darkSteel", [0, h, 0], RX)), null, rot),
        [pistonAt.x, pistonAt.y, zc], [u.x * 0.26, u.y * 0.26, 0], inside);

      // valves: two intake and two exhaust, each with its spring
      const deck = crankC.clone().setZ(zc).addScaledVector(u, 0.32);
      const valves = [];
      [-1, 1].forEach(function (side) {
        [-1, 1].forEach(function (dz) {
          const helix = [];
          for (let k = 0; k <= 60; k++) { const a = (k / 60) * Math.PI * 2 * 5; helix.push([Math.cos(a) * 0.009, 0.05 + (k / 60) * 0.03, Math.sin(a) * 0.009]); }
          valves.push(group([
            mesh(cyl(0.0035, 0.085, 10), "steel", [0, 0.045, 0]),
            mesh(cyl(0.013, 0.003, 24, 0.009), "steel", [0, 0.003, 0]),
            mesh(tube(helix, 0.0016, false, 120), "steel"),
          ], [side * 0.018, 0, dz * 0.012]));
        });
      });
      place("valves", group(valves, null, rot), [deck.x, deck.y + 0.005, zc], [u.x * 0.46, u.y * 0.46, 0], inside);
    });

    // head gasket for this bank, between block and head
    const deck = crankC.clone().addScaledVector(u, 0.32);
    place("hgasket", mesh(new THREE.BoxGeometry(vee ? 0.16 : 0.22, 0.005, 0.6), "steel", null, rot, { map: gasketTexture(perBank), roughness: 0.5 }),
      [deck.x, deck.y, 0], [u.x * 0.34, u.y * 0.34, 0], inside);

    // double overhead cams: intake and exhaust, a pair of lobes per cylinder each
    [-1, 1].forEach(function (side) {
      const camParts = [mesh(cyl(0.011, 0.58, 16), "steel", null, RX)];
      zs.forEach((z) => [-0.012, 0.012].forEach((dz) => camParts.push(mesh(rbox(0.03, 0.022, 0.01, 0.009), "steel", [0.006, 0, z + dz], [0, 0, side * 0.6 + dz * 40]))));
      const at = deck.clone().addScaledVector(u, 0.12).addScaledVector(v, side * 0.022);
      place("cam", group(camParts, null, rot), [at.x, at.y, 0], [u.x * 0.6 + v.x * side * 0.05, u.y * 0.6, 0], inside);
    });
  });
  place("crank", group(crankParts), [0, 0, 0], [0, -0.22, 0], inside);

  return { group: engine, parts, decor, inside };
}
