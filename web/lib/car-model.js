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
  glass: { kind: "physical", color: 0x070b10, metalness: 0.35, roughness: 0.03, clearcoat: 1, opacity: 0.86 },
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
  gloss: { kind: "physical", color: 0x08090b, metalness: 0.2, roughness: 0.12, clearcoat: 1 },
  liner: { color: 0x101114, metalness: 0, roughness: 0.95 },
  spring: { color: 0x2c4f8a, metalness: 0.5, roughness: 0.4 },
  pad: { color: 0x2b2927, metalness: 0.05, roughness: 0.92 },
  cast: { color: 0x8f959c, metalness: 0.55, roughness: 0.55 },
  liftPost: { color: 0xc99a22, metalness: 0.3, roughness: 0.5 },
  liftArm: { color: 0x2f3439, metalness: 0.6, roughness: 0.45 },
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
  if (typeof document === "undefined") return {}; // no canvas (tests): plain materials
  textures = {
    // honeycomb grille mesh
    grille: canvasTexture(128, 128, function (g, w, h) {
      g.fillStyle = "#050607"; g.fillRect(0, 0, w, h);
      g.strokeStyle = "#3a3e45"; g.lineWidth = 5;
      const r = 16, dx = r * Math.sqrt(3);
      for (let row = -1; row < 6; row++) {
        for (let col = -1; col < 6; col++) {
          const cx = col * dx + (row % 2 ? dx / 2 : 0), cy = row * r * 1.5;
          g.beginPath();
          for (let k = 0; k <= 6; k++) { const a = Math.PI / 6 + (k * Math.PI) / 3; g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
          g.stroke();
        }
      }
    }, [6, 2]),
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
  Object.keys(spec).forEach((k) => { if (spec[k] === undefined) delete spec[k]; });
  const m = kind === "physical" ? new THREE.MeshPhysicalMaterial(spec) : new THREE.MeshStandardMaterial(spec);
  m.transparent = true;
  m.side = THREE.DoubleSide;
  m.userData.base = { opacity: m.opacity, emissive: m.emissive.getHex(), emissiveIntensity: m.emissiveIntensity };
  if (key === "paint") m.userData.paint = true;
  return m;
}

/** Repaint the body (every "paint" material inside obj). color: hex number or "#rrggbb". */
export function repaint(obj, color) {
  obj.traverse(function (m) {
    if (m.isMesh) [].concat(m.material).forEach((mt) => { if (mt.userData.paint) mt.color.set(color); });
  });
}

/** Fade (vis 0–1) and highlight (glow > 0, amber) everything inside obj. */
export function setVisibility(obj, vis, glow, glowColor) {
  obj.visible = vis > 0.02;
  if (!obj.visible) return;
  obj.traverse(function (m) {
    if (!m.isMesh && !m.isLine) return;
    [].concat(m.material).forEach(function (mt) {
      const b = mt.userData.base;
      if (!b) return;
      mt.opacity = b.opacity * vis;
      mt.depthWrite = vis > 0.6 && !mt.userData.noDepth; // a see-through shell never writes depth
      if (m.isMesh) m.castShadow = vis > 0.5;
      if (!mt.emissive) return;
      if (glow > 0) { mt.emissive.setHex(glowColor); mt.emissiveIntensity = glow; }
      else { mt.emissive.setHex(b.emissive); mt.emissiveIntensity = b.emissiveIntensity; }
    });
  });
}

/* ---------------- geometry helpers ---------------- */
const rbox = (w, h, d, r) => new RoundedBoxGeometry(w, h, d, 3, Math.min(r == null ? 0.01 : r, w / 2, h / 2, d / 2));
const cyl = (r, h, seg, r2) => new THREE.CylinderGeometry(r, r2 == null ? r : r2, h, seg || 32);
const tube = (pts, r, closed, seg) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3().fromArray(p)), !!closed, "centripetal"), seg || 32, r, 16, !!closed);
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
    bumpers: [0.68, 0.56], brake3: [-1.0, 1.33],
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
    bumpers: [0.78, 0.66], brake3: [-1.99, 1.47],
    rails: { y: 1.665, x0: -1.75, x1: 0.05, z: 0.56 }, cladding: true,
  },
  // Midsize / three-row SUV (Sorento, Telluride, Highlander): longer, taller, bigger wheels.
  suv: {
    half: 2.42, wheelX: 1.42, axle: 0.4, wheelScale: 1.18, width: 0.95, arch: 0.52, endStart: 2.15, endLen: 0.27,
    top: [[-2.42, 0.82], [-2.37, 1.12], [-2.25, 1.2], [-1.6, 1.22], [0.8, 1.19], [1.45, 1.16], [2.05, 1.1], [2.33, 0.98], [2.42, 0.76]],
    bot: [[-2.42, 0.58], [-2.25, 0.42], [2.2, 0.42], [2.42, 0.58]],
    cabin: { x0: -2.32, x1: 0.85, base: 1.15, wBottom: 0.86, wTopDrop: 0.2, bPillar: [-0.37, -0.27],
      top: [[-2.32, 1.2], [-2.27, 1.62], [-2.12, 1.74], [-0.2, 1.77], [0.2, 1.74], [0.85, 1.17]] },
    interior: { size: [2.0, 0.34, 1.35], pos: [-0.75, 1.33, 0] },
    grille: { x: 2.385, y: 0.86, h: 0.2, w: 0.95 }, intake: { x: 2.38, y: 0.64, w: 1.2 },
    plates: { front: [2.42, 0.68], rear: [-2.42, 0.9] },
    headlight: { pos: [2.3, 1.03, 0.66], size: [0.12, 0.08, 0.32] },
    taillight: { pos: [-2.36, 1.3, 0.74], size: [0.08, 0.3, 0.12], rotY: 0.2 },
    mirror: [0.68, 1.27, 0.97], seams: [0.78, -0.32, -1.45], handles: [0.28, -0.85], handleY: 1.11, sideZ: 0.936,
    wipers: [0.83, 1.2], exhaust: [-2.41, 0.5, 0.55],
    engineAt: [1.42, 0.96, 0], hood: { pos: [1.6, 1.16, 0], size: [1.3, 0.14, 1.65] },
    bumpers: [0.92, 0.78], brake3: [-2.26, 1.64],
    rails: { y: 1.795, x0: -1.95, x1: 0.0, z: 0.62 }, cladding: true, view: [0.85, 1.08],
  },
  // Five-door hatchback (Forte5, Rio 5-door, Golf).
  hatchback: {
    half: 2.15, wheelX: 1.35, axle: 0.34, wheelScale: 1, width: 0.88, arch: 0.43, endStart: 1.9, endLen: 0.25,
    top: [[-2.15, 0.62], [-2.1, 0.88], [-2.0, 0.97], [-1.6, 1.0], [0.8, 0.98], [1.35, 0.95], [1.85, 0.9], [2.06, 0.78], [2.15, 0.58]],
    bot: [[-2.15, 0.46], [-1.97, 0.31], [1.92, 0.29], [2.15, 0.44]],
    cabin: { x0: -2.0, x1: 0.85, base: 0.95, wBottom: 0.78, wTopDrop: 0.2, bPillar: [-0.45, -0.35],
      top: [[-2.0, 0.99], [-1.9, 1.3], [-1.7, 1.44], [-0.3, 1.46], [0.1, 1.44], [0.85, 0.97]] },
    interior: { size: [1.5, 0.3, 1.2], pos: [-0.6, 1.1, 0] },
    grille: { x: 2.11, y: 0.62, h: 0.14, w: 0.72 }, intake: { x: 2.1, y: 0.45, w: 1.05 },
    plates: { front: [2.145, 0.5], rear: [-2.145, 0.7] },
    headlight: { pos: [2.03, 0.8, 0.58], size: [0.12, 0.07, 0.3] },
    taillight: { pos: [-2.08, 1.0, 0.62], size: [0.08, 0.14, 0.2], rotY: 0.25 },
    mirror: [0.72, 1.05, 0.87], seams: [0.8, -0.4, -1.45], handles: [0.28, -0.85], handleY: 0.87, sideZ: 0.866,
    wipers: [0.83, 1.0], exhaust: [-2.13, 0.36, 0.5],
    engineAt: [1.35, 0.78, 0], hood: { pos: [1.48, 0.95, 0], size: [1.15, 0.14, 1.5] },
    bumpers: [0.68, 0.58], brake3: [-1.88, 1.33],
    rails: null, cladding: false,
  },
  // Station wagon: sedan length with the roof carried to an upright tailgate.
  wagon: {
    half: 2.35, wheelX: 1.4, axle: 0.35, wheelScale: 1.02, width: 0.89, arch: 0.44, endStart: 2.1, endLen: 0.25,
    top: [[-2.35, 0.62], [-2.3, 0.88], [-2.2, 0.98], [-1.6, 1.0], [0.9, 0.98], [1.5, 0.95], [2.0, 0.9], [2.26, 0.78], [2.35, 0.58]],
    bot: [[-2.35, 0.47], [-2.17, 0.32], [2.12, 0.3], [2.35, 0.44]],
    cabin: { x0: -2.18, x1: 0.95, base: 0.95, wBottom: 0.79, wTopDrop: 0.2, bPillar: [-0.37, -0.27],
      top: [[-2.18, 1.0], [-2.12, 1.32], [-1.95, 1.42], [-0.3, 1.45], [0.1, 1.43], [0.95, 0.97]] },
    interior: { size: [1.8, 0.3, 1.2], pos: [-0.7, 1.1, 0] },
    grille: { x: 2.295, y: 0.62, h: 0.15, w: 0.74 }, intake: { x: 2.29, y: 0.45, w: 1.1 },
    plates: { front: [2.335, 0.5], rear: [-2.35, 0.68] },
    headlight: { pos: [2.22, 0.8, 0.58], size: [0.12, 0.07, 0.3] },
    taillight: { pos: [-2.28, 0.95, 0.6], size: [0.08, 0.16, 0.22], rotY: 0.25 },
    mirror: [0.82, 1.05, 0.87], seams: [0.88, -0.32, -1.38], handles: [0.36, -0.8], handleY: 0.87, sideZ: 0.876,
    wipers: [0.93, 1.0], exhaust: [-2.33, 0.37, 0.5],
    engineAt: [1.4, 0.78, 0], hood: { pos: [1.55, 0.95, 0], size: [1.25, 0.14, 1.5] },
    bumpers: [0.68, 0.58], brake3: [-2.12, 1.33],
    rails: { y: 1.475, x0: -1.9, x1: -0.1, z: 0.56 }, cladding: false,
  },
  // Two-door coupe: shorter cabin, lower roof, one long door.
  coupe: {
    half: 2.25, wheelX: 1.38, axle: 0.34, wheelScale: 1, width: 0.89, arch: 0.43, endStart: 2.0, endLen: 0.25,
    top: [[-2.25, 0.6], [-2.17, 0.83], [-1.95, 0.95], [-1.5, 0.99], [-1.15, 0.98], [0.85, 0.96], [1.45, 0.93], [1.95, 0.88], [2.17, 0.76], [2.25, 0.56]],
    bot: [[-2.25, 0.45], [-2.07, 0.3], [2.02, 0.28], [2.25, 0.43]],
    cabin: { x0: -1.45, x1: 0.9, base: 0.93, wBottom: 0.78, wTopDrop: 0.24, bPillar: [0, 0],
      top: [[-1.45, 0.97], [-0.85, 1.26], [-0.45, 1.33], [0.05, 1.33], [0.9, 0.95]] },
    interior: { size: [1.2, 0.28, 1.2], pos: [-0.4, 1.07, 0] },
    grille: { x: 2.195, y: 0.6, h: 0.14, w: 0.72 }, intake: { x: 2.19, y: 0.44, w: 1.08 },
    plates: { front: [2.235, 0.49], rear: [-2.24, 0.6] },
    headlight: { pos: [2.12, 0.78, 0.58], size: [0.12, 0.07, 0.3] },
    taillight: { pos: [-2.15, 0.88, 0.6], size: [0.1, 0.08, 0.32], rotY: 0.35 },
    mirror: [0.75, 1.02, 0.88], seams: [0.85, -0.55], handles: [-0.38], handleY: 0.85, sideZ: 0.876,
    wipers: [0.88, 0.98], exhaust: [-2.23, 0.35, 0.5],
    engineAt: [1.38, 0.76, 0], hood: { pos: [1.5, 0.93, 0], size: [1.25, 0.14, 1.5] },
    bumpers: [0.66, 0.55], brake3: [-1.9, 0.98],
    rails: null, cladding: false,
  },
  // Long-wheelbase minivan (Carnival, Odyssey, Sienna): sloped nose, tall flat roof, sliding rear door.
  minivan: {
    half: 2.57, wheelX: 1.52, axle: 0.37, wheelScale: 1.1, width: 0.99, arch: 0.48, endStart: 2.25, endLen: 0.32,
    top: [[-2.57, 0.75], [-2.53, 1.05], [-2.4, 1.12], [-1.6, 1.14], [0.9, 1.12], [1.55, 1.05], [2.15, 0.95], [2.45, 0.82], [2.57, 0.62]],
    bot: [[-2.57, 0.52], [-2.4, 0.36], [2.3, 0.35], [2.57, 0.5]],
    cabin: { x0: -2.47, x1: 1.2, base: 1.08, wBottom: 0.9, wTopDrop: 0.2, bPillar: [0.25, 0.35],
      top: [[-2.47, 1.12], [-2.42, 1.62], [-2.28, 1.76], [-0.2, 1.78], [0.35, 1.74], [1.2, 1.1]] },
    interior: { size: [2.6, 0.35, 1.45], pos: [-0.75, 1.3, 0] },
    grille: { x: 2.53, y: 0.72, h: 0.12, w: 0.8 }, intake: { x: 2.52, y: 0.52, w: 1.2 },
    plates: { front: [2.565, 0.58], rear: [-2.57, 0.9] },
    headlight: { pos: [2.42, 0.85, 0.68], size: [0.14, 0.08, 0.34] },
    taillight: { pos: [-2.5, 1.25, 0.8], size: [0.08, 0.36, 0.12], rotY: 0.15 },
    mirror: [1.05, 1.17, 1.0], seams: [1.1, 0.3, -1.05], handles: [0.45, -0.2], handleY: 1.04, sideZ: 0.976,
    wipers: [1.15, 1.13], exhaust: [-2.56, 0.45, 0.55],
    engineAt: [1.6, 0.82, 0], hood: { pos: [1.85, 1.0, 0], size: [1.0, 0.14, 1.6] },
    bumpers: [0.78, 0.7], brake3: [-2.38, 1.72],
    rails: { y: 1.805, x0: -2.0, x1: 0.0, z: 0.65 }, cladding: false, view: [0.85, 1.12],
  },
  // Full-size cargo van (Transit, Sprinter, ProMaster): short nose, tall boxy body, windows only up front.
  van: {
    half: 2.75, wheelX: 1.75, axle: 0.38, wheelScale: 1.15, width: 1.0, arch: 0.5, endStart: 2.35, endLen: 0.4,
    top: [[-2.75, 1.15], [-2.72, 1.25], [-2.6, 1.28], [1.5, 1.25], [2.0, 1.2], [2.4, 1.05], [2.62, 0.9], [2.75, 0.7]],
    bot: [[-2.75, 0.55], [-2.6, 0.42], [2.45, 0.42], [2.75, 0.55]],
    cabin: { x0: -2.72, x1: 1.75, base: 1.22, wBottom: 0.97, wTopDrop: 0.08, bPillar: [0.6, 0.72],
      top: [[-2.72, 1.26], [-2.7, 2.3], [-2.6, 2.42], [0.9, 2.45], [1.25, 2.35], [1.75, 1.22]] },
    interior: { size: [1.4, 0.4, 1.5], pos: [0.4, 1.45, 0] },
    grille: { x: 2.69, y: 0.92, h: 0.18, w: 0.9 }, intake: { x: 2.72, y: 0.62, w: 1.3 },
    plates: { front: [2.75, 0.66], rear: [-2.75, 0.85] },
    headlight: { pos: [2.55, 1.02, 0.72], size: [0.14, 0.12, 0.3] },
    taillight: { pos: [-2.73, 1.3, 0.88], size: [0.06, 0.5, 0.12], rotY: 0.05 },
    mirror: [1.55, 1.55, 1.05], seams: [1.7, 0.75, -0.3], handles: [1.0, 0.05], handleY: 1.15, sideZ: 0.996,
    wipers: [1.7, 1.27], exhaust: [-2.6, 0.45, 0.6],
    engineAt: [2.0, 0.9, 0], hood: { pos: [2.2, 1.1, 0], size: [0.9, 0.16, 1.7] },
    bumpers: [0.85, 0.85], brake3: [-2.7, 2.32],
    rails: null, cladding: false, cargo: true, view: [1.2, 1.28],
  },
  // Crew-cab pickup (F-150, Tacoma, Santa Cruz): tall hood, four-door cab, open bed with a tailgate.
  pickup: {
    half: 2.75, wheelX: 1.75, axle: 0.42, wheelScale: 1.28, width: 0.99, arch: 0.55, endStart: 2.45, endLen: 0.3,
    top: [[-2.75, 1.25], [-2.72, 1.3], [1.0, 1.3], [1.6, 1.27], [2.3, 1.2], [2.62, 1.05], [2.75, 0.82]],
    bot: [[-2.75, 0.62], [-2.6, 0.55], [2.5, 0.52], [2.75, 0.62]],
    cabin: { x0: -0.45, x1: 1.0, base: 1.28, wBottom: 0.9, wTopDrop: 0.14, bPillar: [0.25, 0.35],
      top: [[-0.45, 1.3], [-0.43, 1.82], [-0.35, 1.9], [0.4, 1.92], [0.6, 1.88], [1.0, 1.28]] },
    bed: { x0: -2.7, x1: -0.5 },
    interior: { size: [1.3, 0.35, 1.5], pos: [0.3, 1.45, 0] },
    grille: { x: 2.72, y: 1.0, h: 0.3, w: 1.1 }, intake: { x: 2.75, y: 0.72, w: 1.5 },
    plates: { front: [2.76, 0.72], rear: [-2.76, 0.82] },
    headlight: { pos: [2.6, 1.13, 0.7], size: [0.14, 0.1, 0.3] },
    taillight: { pos: [-2.73, 1.12, 0.9], size: [0.06, 0.32, 0.1], rotY: 0 },
    mirror: [0.85, 1.45, 1.05], seams: [0.98, 0.3, -0.42], handles: [0.55, -0.15], handleY: 1.24, sideZ: 0.976,
    wipers: [0.95, 1.33], exhaust: [-2.6, 0.55, 0.6],
    engineAt: [1.85, 1.0, 0], hood: { pos: [1.9, 1.27, 0], size: [1.4, 0.14, 1.7] },
    bumpers: [0.95, 0.82], brake3: [-0.47, 1.86],
    rails: null, cladding: false, view: [1.05, 1.25],
  },
  // Stretch limousine: a sedan with a long middle section.
  limo: {
    half: 3.28, wheelX: 2.4, axle: 0.34, wheelScale: 1, width: 0.9, arch: 0.43, endStart: 3.03, endLen: 0.25,
    top: [[-3.28, 0.6], [-3.19, 0.84], [-2.95, 0.97], [-2.5, 1.02], [-2.15, 1.0], [1.85, 0.98], [2.45, 0.95], [2.95, 0.9], [3.19, 0.78], [3.28, 0.58]],
    bot: [[-3.28, 0.46], [-3.1, 0.31], [3.05, 0.29], [3.28, 0.44]],
    cabin: { x0: -2.47, x1: 1.9, base: 0.95, wBottom: 0.8, wTopDrop: 0.22, bPillar: [0.55, 0.65],
      top: [[-2.47, 0.99], [-1.93, 1.34], [-1.57, 1.44], [0.97, 1.44], [1.9, 0.97]] },
    interior: { size: [3.6, 0.3, 1.2], pos: [-0.3, 1.1, 0] },
    grille: { x: 3.225, y: 0.62, h: 0.15, w: 0.74 }, intake: { x: 3.22, y: 0.45, w: 1.1 },
    plates: { front: [3.265, 0.5], rear: [-3.268, 0.62] },
    headlight: { pos: [3.15, 0.8, 0.58], size: [0.12, 0.07, 0.3] },
    taillight: { pos: [-3.17, 0.9, 0.6], size: [0.1, 0.09, 0.32], rotY: 0.35 },
    mirror: [1.75, 1.05, 0.89], seams: [1.85, 0.6, -1.4], handles: [1.33, 0.1, -0.9], handleY: 0.87, sideZ: 0.886,
    wipers: [1.88, 1.0], exhaust: [-3.26, 0.36, 0.5],
    engineAt: [2.4, 0.78, 0], hood: { pos: [2.53, 0.95, 0], size: [1.25, 0.14, 1.5] },
    bumpers: [0.68, 0.56], brake3: [-1.95, 1.33],
    rails: null, cladding: false, view: [0.7, 1.35],
  },
  // Two-seat roadster (Miata, Z4): short, low, open top.
  roadster: {
    half: 1.98, wheelX: 1.15, axle: 0.32, wheelScale: 0.95, width: 0.86, arch: 0.41, endStart: 1.75, endLen: 0.23,
    top: [[-1.98, 0.58], [-1.9, 0.8], [-1.7, 0.88], [-1.2, 0.9], [0.6, 0.88], [1.2, 0.82], [1.7, 0.74], [1.9, 0.65], [1.98, 0.5]],
    bot: [[-1.98, 0.42], [-1.82, 0.27], [1.78, 0.25], [1.98, 0.4]],
    cabin: { x0: -0.6, x1: 0.55, base: 0.86, wBottom: 0.72, wTopDrop: 0.2, bPillar: [0, 0],
      top: [[-0.6, 0.88], [-0.05, 1.12], [0.55, 0.86]] },
    interior: { size: [0.9, 0.25, 1.1], pos: [-0.3, 0.95, 0] },
    grille: { x: 1.95, y: 0.52, h: 0.1, w: 0.6 }, intake: { x: 1.94, y: 0.4, w: 0.9 },
    plates: { front: [1.975, 0.45], rear: [-1.98, 0.55] },
    headlight: { pos: [1.82, 0.7, 0.55], size: [0.14, 0.06, 0.28] },
    taillight: { pos: [-1.92, 0.8, 0.58], size: [0.08, 0.07, 0.3], rotY: 0.35 },
    mirror: [0.4, 0.95, 0.84], seams: [0.55, -0.45], handles: [-0.3], handleY: 0.8, sideZ: 0.846,
    wipers: [0.6, 0.9], exhaust: [-1.96, 0.33, 0.45],
    engineAt: [1.15, 0.68, 0], hood: { pos: [1.2, 0.84, 0], size: [1.2, 0.12, 1.4] },
    bumpers: [0.58, 0.55], brake3: [-1.9, 0.86],
    rails: null, cladding: false, openTop: true, view: [0.6, 0.92],
  },
};
// Two-door variants: the convertible is the coupe with its top down; the 3-door hatch loses its rear doors.
STYLES.convertible = Object.assign({}, STYLES.coupe, {
  cabin: { x0: -0.9, x1: 0.9, base: 0.93, wBottom: 0.78, wTopDrop: 0.24, bPillar: [0, 0], top: [[-0.9, 0.95], [0.0, 1.24], [0.9, 0.95]] },
  openTop: true, brake3: [-1.95, 0.97],
});
STYLES.hatch3 = Object.assign({}, STYLES.hatchback, { seams: [0.8, -0.75], handles: [-0.62], cabin: Object.assign({}, STYLES.hatchback.cabin, { bPillar: [0, 0] }) });

/**
 * NHTSA body class → body style. extra: { doors, wheelbase } from the same decode, when NHTSA has them
 * (wheelbase in inches). Compact SUVs like the Soul, Seltos and Niro come back as "Sport Utility Vehicle", so the
 * wheelbase splits them from midsize ones; with no wheelbase they get the compact body.
 */
export function styleFor(bodyClass, extra) {
  const b = String(bodyClass || "").toLowerCase(), e = extra || {};
  const doors = parseInt(e.doors, 10) || 0, wheelbase = parseFloat(e.wheelbase) || 0;
  if (/pickup|sport utility truck|\bsut\b/.test(b)) return "pickup";
  if (/minivan/.test(b)) return "minivan";
  if (/\bvan\b/.test(b)) return "van";
  if (/limousine/.test(b)) return "limo";
  if (/roadster/.test(b)) return "roadster";
  if (/convertible|cabriolet/.test(b)) return "convertible";
  if (/coupe/.test(b)) return "coupe";
  if (/wagon/.test(b)) return "wagon";
  if (/hatch|liftback|notchback/.test(b)) return doors && doors <= 3 ? "hatch3" : "hatchback";
  if (/sport utility|suv|mpv|crossover|cuv/.test(b)) return wheelbase >= 109 ? "suv" : "crossover";
  if (doors === 2) return "coupe";
  return "sedan";
}
export const BODY_STYLES = Object.keys(STYLES);

/**
 * Fit a body style to a car's real size. dims: { length, width, height, wheelbase } in meters (any may be
 * missing). The wheelbase stretches the middle of the body, the overhangs take up the rest of the length,
 * height scales everything vertically (wheels included) and width is applied as a sideways scale on the
 * finished car (kz). Factors are clamped so a model in the wrong body class can't distort the shape badly.
 */
function fitStyle(S, dims) {
  if (!dims) return S;
  const clamp = (v) => Math.min(1.35, Math.max(0.75, v));
  const H0 = Math.max.apply(null, S.cabin.top.map((p) => p[1]));
  const kIn = clamp(dims.wheelbase ? dims.wheelbase / (S.wheelX * 2) : dims.length ? dims.length / (S.half * 2) : 1);
  const kOut = clamp(dims.length ? (dims.length / 2 - S.wheelX * kIn) / (S.half - S.wheelX) : kIn);
  const ky = clamp(dims.height ? dims.height / H0 : 1), kz = clamp(dims.width ? dims.width / (S.width * 2) : 1);
  const X = (x) => (Math.abs(x) <= S.wheelX ? x * kIn : Math.sign(x) * (S.wheelX * kIn + (Math.abs(x) - S.wheelX) * kOut));
  const Y = (y) => y * ky, DX = (d) => (d * (kIn + kOut)) / 2;
  const P = (p) => [X(p[0]), Y(p[1])];
  const XYZ = (p) => [X(p[0]), Y(p[1]), p[2]];
  const T = Object.assign({}, S, {
    half: X(S.half), wheelX: S.wheelX * kIn, endStart: X(S.endStart), axle: Y(S.axle), wheelScale: S.wheelScale * ky, arch: S.arch * ky,
    top: S.top.map(P), bot: S.bot.map(P),
    cabin: Object.assign({}, S.cabin, { x0: X(S.cabin.x0), x1: X(S.cabin.x1), base: Y(S.cabin.base), bPillar: S.cabin.bPillar.map(X), top: S.cabin.top.map(P) }),
    interior: { size: [DX(S.interior.size[0]), Y(S.interior.size[1]), S.interior.size[2]], pos: XYZ(S.interior.pos) },
    grille: Object.assign({}, S.grille, { x: X(S.grille.x), y: Y(S.grille.y), h: Y(S.grille.h) }),
    intake: Object.assign({}, S.intake, { x: X(S.intake.x), y: Y(S.intake.y) }),
    plates: { front: P(S.plates.front), rear: P(S.plates.rear) },
    headlight: { pos: XYZ(S.headlight.pos), size: [S.headlight.size[0], Y(S.headlight.size[1]), S.headlight.size[2]] },
    taillight: Object.assign({}, S.taillight, { pos: XYZ(S.taillight.pos), size: [S.taillight.size[0], Y(S.taillight.size[1]), S.taillight.size[2]] }),
    mirror: XYZ(S.mirror), seams: S.seams.map(X), handles: S.handles.map(X), handleY: Y(S.handleY),
    wipers: P(S.wipers), exhaust: XYZ(S.exhaust), engineAt: XYZ(S.engineAt),
    hood: { pos: XYZ(S.hood.pos), size: [DX(S.hood.size[0]), S.hood.size[1], S.hood.size[2]] },
    bumpers: S.bumpers.map(Y), brake3: P(S.brake3),
    rails: S.rails && Object.assign({}, S.rails, { y: Y(S.rails.y), x0: X(S.rails.x0), x1: X(S.rails.x1) }),
    bed: S.bed && { x0: X(S.bed.x0), x1: X(S.bed.x1) },
    kz,
  });
  T.endLen = T.half - T.endStart;
  const v = S.view || [0.7, 1];
  T.view = [v[0] * ky, v[1] * Math.max(1, T.half / S.half)];
  return T;
}

// Tire and rim, axis along z, built facing +z (the outside). Separate so each can be picked and priced.
function wheel() {
  const tread = [];
  [-0.05, -0.028, -0.022, -0.003, 0.003, 0.022, 0.028, 0.05].forEach((z, i) => tread.push([i % 4 === 1 || i % 4 === 2 ? 0.323 : 0.332, z]));
  const tireProfile = [[0.215, -0.1], [0.3, -0.112], [0.322, -0.095]].concat(tread, [[0.322, 0.095], [0.3, 0.112], [0.215, 0.1]]).map((p) => new THREE.Vector2(p[0], p[1]));
  const tire = mesh(new THREE.LatheGeometry(tireProfile, 64), "rubber", null, RX);
  const rim = [
    mesh(new THREE.CylinderGeometry(0.218, 0.218, 0.19, 48, 1, true), "alloy", null, RX),
    mesh(new THREE.TorusGeometry(0.218, 0.008, 8, 48), "alloy", [0, 0, 0.09]),
    mesh(cyl(0.055, 0.03, 32), "alloy", [0, 0, 0.08], RX),
    mesh(cyl(0.03, 0.012, 24), "darkSteel", [0, 0, 0.096], RX),
  ];
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2;
    rim.push(mesh(rbox(0.17, 0.036, 0.025, 0.008), "alloy", [Math.cos(a) * 0.13, Math.sin(a) * 0.13, 0.078], [0, 0, a]));
    rim.push(mesh(cyl(0.008, 0.012, 6), "chrome", [Math.cos(a + 0.63) * 0.038, Math.sin(a + 0.63) * 0.038, 0.096], RX));
  }
  return { tire: group([tire]), rim: group(rim) };
}

// Cylinder from point a to point b (radius r, or tapering to r2 at b).
function rod(a, b, r, look, r2) {
  const A = new THREE.Vector3().fromArray(a), dir = new THREE.Vector3().fromArray(b).sub(A);
  const m = mesh(cyl(r, dir.length(), 24, r2), look);
  m.position.copy(A).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return m;
}

// A flat bar with rounded ends from point a to b, w0 wide at a and w1 at b, t thick along `normal`: forged arms, brackets, links.
function slab(a, b, w0, w1, t, normal, look) {
  const A = new THREE.Vector3().fromArray(a), B = new THREE.Vector3().fromArray(b), L = A.distanceTo(B);
  const sh = new THREE.Shape();
  sh.absarc(0, 0, w0 / 2, Math.PI / 2, Math.PI * 1.5, false);
  sh.lineTo(L, -w1 / 2);
  sh.absarc(L, 0, w1 / 2, -Math.PI / 2, Math.PI / 2, false);
  sh.lineTo(0, w0 / 2);
  const bev = Math.min(t * 0.3, 0.005), depth = Math.max(t - 2 * bev, 0.001);
  const geo = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: bev, bevelSize: bev * 0.8, bevelSegments: 2, curveSegments: 12 });
  geo.translate(0, 0, -depth / 2);
  const x = B.clone().sub(A).normalize(), z = new THREE.Vector3().fromArray(normal);
  z.addScaledVector(x, -z.dot(x)).normalize();
  const m = mesh(geo, look);
  m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, z.clone().cross(x), z));
  m.position.copy(A);
  return m;
}
// A solid of revolution around y from [radius, y] points; a closed outline makes a solid ring or dish.
function lathe(points, look, pos, rot, seg) {
  return mesh(new THREE.LatheGeometry(points.map((p) => new THREE.Vector2(p[0], p[1])), seg || 40), look, pos, rot);
}
// Rubber bellows along y from 0 to len, radius r0 at the bottom to r1 at the top, with `folds` ridges: CV, rack and strut boots.
function bellows(r0, r1, len, folds) {
  const pts = [], n = folds * 10;
  for (let i = 0; i <= n; i++) { const t = i / n; pts.push(new THREE.Vector2((r0 + (r1 - r0) * t) * (0.87 + 0.13 * Math.cos(t * folds * Math.PI * 2)), t * len)); }
  return new THREE.LatheGeometry(pts, 32);
}
// Coil spring along y from 0 to len: coil radius r, wire thickness w, `turns` working coils plus a closed, flat coil at each end.
function springGeo(r, len, turns, w) {
  const total = turns + 1.5, n = Math.round(total * 36), pts = [];
  for (let i = 0; i <= n; i++) {
    const u = (i / n) * total, a = u * Math.PI * 2;
    const h = u < 0.75 ? w / 2 + (w * u) / 0.75 : u > total - 0.75 ? len - w / 2 - (w * (total - u)) / 0.75 : 1.5 * w + ((len - 3 * w) * (u - 0.75)) / (total - 1.5);
    pts.push(new THREE.Vector3(Math.cos(a) * r, h, Math.sin(a) * r));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, w / 2, 12, false);
}
// Turn obj so its local +y runs from a toward b, and put it at a.
function along(obj, a, b) {
  obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3().fromArray(b).sub(new THREE.Vector3().fromArray(a)).normalize());
  obj.position.fromArray(a);
  return obj;
}
// An annular sector (radius r0 to r1, half-angle h either side of +x) lying in the x-z plane, extruded t thick along +y: brake pads.
function sectorGeo(r0, r1, h, t) {
  const sh = new THREE.Shape();
  sh.absarc(0, 0, r1, -h, h, false);
  sh.absarc(0, 0, r0, h, -h, true);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false, curveSegments: 18 });
  geo.rotateX(-Math.PI / 2);
  return geo;
}
function roundedRect(path, x0, y0, x1, y1, r) {
  path.moveTo(x0 + r, y0); path.lineTo(x1 - r, y0); path.quadraticCurveTo(x1, y0, x1, y0 + r);
  path.lineTo(x1, y1 - r); path.quadraticCurveTo(x1, y1, x1 - r, y1);
  path.lineTo(x0 + r, y1); path.quadraticCurveTo(x0, y1, x0, y1 - r);
  path.lineTo(x0, y0 + r); path.quadraticCurveTo(x0, y0, x0 + r, y0);
  return path;
}

// Brake parts in the wheel's brake frame: origin on the rotor's centre plane, +y outboard along the axle, +x toward the caliper.
// Vented rotor: two friction plates joined by vanes, and the hat the wheel bolts to.
function rotorParts(rOut, rIn, rHat) {
  const plate = (y0, y1) => lathe([[rIn, y0], [rOut, y0], [rOut, y1], [rIn, y1], [rIn, y0]], "steel", null, null, 72);
  const parts = [plate(-0.013, -0.005), plate(0.005, 0.013)];
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2, rm = (rIn + rOut) / 2;
    parts.push(mesh(new THREE.BoxGeometry(rOut - rIn - 0.004, 0.01, 0.0045), "iron", [Math.cos(a) * rm, 0, Math.sin(a) * rm], [0, -a, 0]));
  }
  parts.push(lathe([[rHat, 0.005], [rHat, 0.035], [0.034, 0.035], [0.034, 0.029], [rHat - 0.006, 0.029], [rHat - 0.006, 0.005], [rHat, 0.005]], "iron", null, null, 56));
  parts.push(lathe([[rHat - 0.006, 0.005], [rIn + 0.002, 0.005], [rIn + 0.002, 0.012], [rHat - 0.006, 0.012], [rHat - 0.006, 0.005]], "iron", null, null, 56));
  return parts;
}
// Single-piston sliding caliper: piston body inboard, bridge over the rotor edge, fingers outboard, slide pins, bracket, bleeder.
function caliperParts(rOut, r0, r1) {
  const mid = (r0 + r1) / 2, top = rOut + 0.024;
  const parts = [
    mesh(rbox(top - r0 + 0.004, 0.042, 0.098, 0.014), "iron", [(top + r0 - 0.004) / 2, -0.049, 0]),
    mesh(cyl(0.034, 0.03, 40), "iron", [mid, -0.072, 0]),
    mesh(rbox(0.022, 0.1, 0.092, 0.009), "iron", [rOut + 0.013, -0.014, 0]),
    mesh(rbox(rOut + 0.012 - r0, 0.014, 0.084, 0.006), "iron", [(rOut + 0.012 + r0) / 2, 0.034, 0]),
    mesh(cyl(0.005, 0.022, 12), "steel", [top - 0.004, -0.06, 0.022], RZ),
    mesh(cyl(0.0065, 0.006, 12), "rubber", [top + 0.008, -0.06, 0.022], RZ),
  ];
  [-1, 1].forEach(function (d) {
    parts.push(mesh(cyl(0.011, 0.05, 16), "iron", [mid + 0.012, -0.047, d * 0.063]));
    parts.push(mesh(bellows(0.011, 0.008, 0.024, 3), "rubber", [mid + 0.012, -0.022, d * 0.063]));
    parts.push(mesh(rbox(r1 - r0 + 0.03, 0.016, 0.02, 0.005), "darkSteel", [mid, -0.03, d * 0.056]));
  });
  return parts;
}
// Inner and outer pads: friction material on a steel backing plate with ears that sit in the bracket.
function padParts(r0, r1, h) {
  const fric = (y) => mesh(sectorGeo(r0, r1, h, 0.009), "pad", [0, y, 0]);
  const back = (y) => mesh(sectorGeo(r0 - 0.004, r1 + 0.003, h + 0.06, 0.005), "steel", [0, y, 0]);
  return [fric(-0.022), back(-0.027), fric(0.013), back(0.022)];
}

// A mesh drawing some of the triangles of a shared geometry: one panel cut from the lofted body shell.
function subMesh(geo, tris, mat) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", geo.attributes.position);
  g.setAttribute("normal", geo.attributes.normal);
  g.setIndex(tris);
  // bounds of this panel only (computeBoundingBox would measure the whole shell)
  const box = new THREE.Box3(), v = new THREE.Vector3(), P = geo.attributes.position;
  tris.forEach((i) => box.expandByPoint(v.fromBufferAttribute(P, i)));
  g.boundingBox = box;
  g.boundingSphere = box.getBoundingSphere(new THREE.Sphere());
  const m = new THREE.Mesh(g, mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

/**
 * options: { style (see BODY_STYLES), dims (real size, see car-dims.js), paint, cylinders, drive, electric }.
 * Returns { group, body, panels, chassis, hood, engineAt }:
 *   body     shell pieces that are not parts (underbody, roof, interior, seams): they fade in the other views
 *   panels   body-and-lights parts (doors, lights, glass, wheels…), tagged with part ids
 *   chassis  underside parts (brakes, suspension, exhaust, fuel…), tagged with part ids
 *   hood     invisible pick target over the hood that opens the engine bay
 * Every panel and chassis part carries userData.rest and userData.ex: its resting position and how far it moves
 * when pulled out for a close-up.
 */
export function buildCar(options) {
  const o = options || {};
  const S = fitStyle(STYLES[o.style] || STYLES.sedan, o.dims);
  const paintColor = o.paint || 0x1f3f78;
  const vee = (parseInt(o.cylinders, 10) || 6) >= 6, electric = !!o.electric;
  const drive = String(o.drive || "");
  const awd = /awd|4wd|4x4|all.?wheel|four/i.test(drive), rwd = !awd && /rwd|rear/i.test(drive);
  const car = new THREE.Group(), body = [], panels = [], chassis = [];
  const deco = (obj) => { car.add(obj); body.push(obj); return obj; };
  function place(list, id, obj, ex) {
    obj.userData.rest = obj.position.clone();
    obj.userData.ex = new THREE.Vector3().fromArray(ex || [0, 0, 0]);
    car.add(obj); list.push(tag(obj, id)); return obj;
  }
  const panel = (id, obj, ex) => place(panels, id, obj, ex);
  const under = (id, obj, ex) => place(chassis, id, obj, ex);
  const paintMat = () => material("paint", { color: paintColor });
  const W = S.wheelX, R = -S.wheelX, A = S.axle, k = S.wheelScale;
  const E = new THREE.Vector3().fromArray(S.engineAt);

  // lower body: hood, doors, trunk or tailgate. Wheel arches are cut by raising the bottom edge over each axle.
  const topL = profile(S.top), botBase = profile(S.bot);
  const bot = function (x) {
    let b = botBase(x);
    [W, R].forEach(function (wx) { const d = Math.abs(x - wx); if (d < S.arch) b = Math.max(b, A - 0.06 + Math.sqrt(S.arch * S.arch - d * d)); });
    return b;
  };
  const ends = (x) => { const t = Math.max(0, (Math.abs(x) - S.endStart) / S.endLen); return Math.pow(Math.max(0, 1 - Math.pow(t, 2.6)), 1 / 2.6); };
  const N = 48;
  const lower = loft(range(-S.half, S.half, 150), function (x) {
    const w = S.width * ends(x) + 0.001, b = bot(x), t = topL(x), mid = (b + t) / 2, h = (t - b) / 2, ring = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2, ye = sexp(Math.sin(a), 0.2), ze = sexp(Math.cos(a), 0.15);
      ring.push([mid + h * ye, w * ze * (1 - 0.08 * Math.max(0, ye))]);
    }
    return ring;
  });

  // Lamps, grille, plates and handles are seated on the body surface (found by casting a ray at it)
  // instead of floating at fixed points, so they sit flush on every body style.
  const surfaces = [new THREE.Mesh(lower, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }))]; // the cabin joins below
  const caster = new THREE.Raycaster();
  function hitBody(from, dir) {
    caster.set(new THREE.Vector3().fromArray(from), new THREE.Vector3().fromArray(dir).normalize());
    const h = caster.intersectObjects(surfaces, false)[0];
    if (!h) return null;
    const n = h.face.normal.clone();
    if (n.dot(caster.ray.direction) > 0) n.negate();
    return { p: h.point, n };
  }
  // Place obj where a ray from `from` along `dir` meets the body, sunk in by `inset`; turn its local +x to face out.
  function stick(obj, from, dir, inset, orient) {
    const h = hitBody(from, dir);
    if (!h) return obj;
    obj.position.copy(h.p).addScaledVector(h.n, -(inset || 0));
    if (orient !== false) obj.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), h.n);
    return obj;
  }
  const FRONT = S.half + 1, BACK = -S.half - 1;

  // Cut the shell into panels by where each triangle sits: hood, fenders, doors, quarters, bumpers, trunk.
  const [bumpF, bumpR] = S.bumpers;
  // door seams: front edge, B-pillar (four-door bodies only), rear edge
  const seamF = S.seams[0], seamR = S.seams[S.seams.length - 1], seamB = S.seams.length > 2 ? S.seams[1] : null;
  // Panel borders follow the body's own grid lines (fixed positions around each cross-section, fixed x along
  // the car) so every shut line runs smooth, never as a stair-step across the mesh. ring: { ye, ze } is where
  // the triangle sits around the cross-section: ye -1 bottom … 1 top, ze -1 left … 1 right side.
  const ringYe = (x, y) => Math.max(-0.95, Math.min(0.95, (y - (bot(x) + topL(x)) / 2) / ((topL(x) - bot(x)) / 2)));
  const yeF = ringYe(S.half - 0.25, bumpF), yeR = ringYe(-S.half + 0.25, bumpR);
  function region(x, ring) {
    const { ye, ze } = ring, side = ze >= 0 ? 1 : -1;
    const sideFace = Math.abs(ze) > 0.86, top = !sideFace && ye > 0, bottom = !sideFace && ye < 0;
    if (bottom) return "shell"; // underbody
    if (x > seamF) {
      if (x > S.endStart - 0.05) return ye < yeF ? "bumperF" : top ? "hoodpanel" : "bumperF";
      if (top) return x > S.cabin.x1 - 0.02 ? "hoodpanel" : "shell";
      if (ye < yeF && x > W + S.arch * 0.5) return "bumperF";
      return "fender:" + side;
    }
    if (x < seamR) {
      if (S.bed && x < S.bed.x1) {
        // pickup: bed sides and tailgate; the top is left open so the bed can be seen into
        if (top) return "drop";
        if (ye < yeR && x < R - S.arch * 0.5) return "bumperR";
        return "bed";
      }
      if (x < -S.endStart + 0.05) return ye < yeR ? "bumperR" : "trunk";
      if (top) return x < S.cabin.x0 + 0.02 ? "trunk" : "shell";
      if (ye < yeR && x < R - S.arch * 0.5) return "bumperR";
      return "quarter:" + side;
    }
    if (top) return "shell";
    return (seamB === null || x > seamB ? "doorF:" : "doorR:") + side;
  }

  const a3 = new THREE.Vector3(), b3 = new THREE.Vector3(), c3 = new THREE.Vector3(), n3 = new THREE.Vector3(), t3 = new THREE.Vector3();
  function faces(geo, classify, triKeys) {
    const P = geo.attributes.position, I = geo.index.array, out = {};
    for (let i = 0; i < I.length; i += 3) {
      a3.fromBufferAttribute(P, I[i]); b3.fromBufferAttribute(P, I[i + 1]); c3.fromBufferAttribute(P, I[i + 2]);
      n3.subVectors(c3, b3).cross(t3.subVectors(a3, b3)).normalize();
      // position around the cross-section, from the loft's vertex order (N points per ring)
      const js = [I[i] % N, I[i + 1] % N, I[i + 2] % N], lo = Math.min.apply(null, js), hi = Math.max.apply(null, js);
      const a = (((hi - lo > 1 ? hi : lo) + 0.5) / N) * Math.PI * 2;
      const ring = { ye: sexp(Math.sin(a), 0.2), ze: sexp(Math.cos(a), 0.15) };
      const key = classify((a3.x + b3.x + c3.x) / 3, (a3.y + b3.y + c3.y) / 3, (a3.z + b3.z + c3.z) / 3, n3, ring);
      (out[key] = out[key] || []).push(I[i], I[i + 1], I[i + 2]);
      if (triKeys) triKeys.push(key);
    }
    return out;
  }
  // Panel gaps: thin dark lines along every edge where two panels meet (hood, doors, bumpers, glass frames).
  // Each line set rides on one of its panels, so it moves with that panel when it pops out.
  // center(x) gives the body's middle height at x; lines sit a few mm outside the surface from there.
  function gapLines(geo, triKeys, center, attach) {
    const I = geo.index.array, P = geo.attributes.position, seen = new Map(), out = new Map(), v = new THREE.Vector3(), o = new THREE.Vector3();
    for (let t = 0; t < triKeys.length; t++) {
      for (let e = 0; e < 3; e++) {
        const a = I[t * 3 + e], b = I[t * 3 + ((e + 1) % 3)], k = a < b ? a * 1e6 + b : b * 1e6 + a, prev = seen.get(k);
        if (prev === undefined) { seen.set(k, triKeys[t]); continue; }
        if (prev === triKeys[t]) continue;
        const target = attach(prev, triKeys[t]);
        if (!target) continue;
        if (!out.has(target)) out.set(target, []);
        [a, b].forEach(function (i) {
          v.fromBufferAttribute(P, i);
          o.set(Math.abs(v.x) > S.endStart ? Math.sign(v.x) * 0.5 : 0, v.y - center(v.x), v.z).normalize();
          out.get(target).push(v.x + o.x * 0.004, v.y + o.y * 0.004, v.z + o.z * 0.004);
        });
      }
    }
    out.forEach(function (pts, target) {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
      const mat = new THREE.LineBasicMaterial({ color: 0x030405, transparent: true, opacity: 0.9 });
      mat.userData.base = { opacity: 0.9 };
      const line = new THREE.LineSegments(g, mat);
      line.raycast = function () {}; // never steal a click from the panel
      target.add(line);
    });
  }
  const POP = { hoodpanel: [0.05, 0.32, 0], trunk: [-0.24, 0.2, 0], bed: [-0.16, 0.3, 0], bumperF: [0.34, 0, 0], bumperR: [-0.34, 0, 0],
    fender: [0.05, 0.02, 0.3], quarter: [-0.05, 0.02, 0.3], doorF: [0, 0, 0.34], doorR: [0, 0, 0.34] };
  const shellKeys = [], shellMesh = {};
  const shellParts = faces(lower, (x, y, z, n, ring) => region(x, ring), shellKeys);
  Object.keys(shellParts).forEach(function (key) {
    const [id, sd] = key.split(":"), side = sd ? +sd : 1;
    if (id === "drop") return;
    const m = subMesh(lower, shellParts[key], paintMat());
    shellMesh[key] = m;
    if (id === "shell") { deco(m); return; }
    const ex = POP[id].slice(); ex[2] *= side;
    panel(id, m, ex);
  });
  gapLines(lower, shellKeys, (x) => (bot(x) + topL(x)) / 2, function (k1, k2) {
    if (k1 === "drop" || k2 === "drop" || (k1 === "shell" && k2 === "shell")) return null;
    return shellMesh[k1 === "shell" ? k2 : k1];
  });

  // greenhouse: painted roof and pillars, then windshield, rear window and door glass
  const C0 = S.cabin, cabinW = Math.max(C0.wBottom, S.width - 0.05), topC = profile(C0.top), roofY = Math.max.apply(null, C0.top.map((p) => p[1])), cMid = (C0.x0 + C0.x1) / 2;
  const cabin = loft(range(C0.x0, C0.x1, 90), function (x) {
    const b = C0.base, t = Math.max(b + 0.004, topC(x)), mid = (b + t) / 2, h = (t - b) / 2, ring = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2, ye = sexp(Math.sin(a), 0.42), y = mid + h * ye;
      const half = cabinW - C0.wTopDrop * Math.max(0, (y - b) / 0.5);
      ring.push([y, half * sexp(Math.cos(a), 0.3)]);
    }
    return ring;
  });
  surfaces.push(new THREE.Mesh(cabin, surfaces[0].material));
  const cabinHalf = (y) => cabinW - C0.wTopDrop * Math.max(0, (y - C0.base) / 0.5);
  const cabinKeys = [], cabinMesh = {};
  const cabinParts = faces(cabin, function (x, y, z, n) {
    // pillars: the outer edges of the front and rear glass
    const roof = y > roofY - 0.06, pillar = Math.abs(z) > cabinHalf(y) * 0.86 && Math.abs(n.x) > 0.45 && y > C0.base + 0.05;
    const bPillar = x > C0.bPillar[0] && x < C0.bPillar[1];
    // open tops keep only the windshield and its frame; cargo vans are paneled behind the front doors
    if (S.openTop && x <= cMid) return "drop";
    if (bPillar && !roof && !S.openTop) return "bpillar";
    if (roof || pillar) return S.openTop ? "drop" : "roof";
    if (S.cargo && x < C0.bPillar[0] && !(Math.abs(n.x) > 0.35 && x < cMid)) return "roof";
    if (Math.abs(n.x) > 0.35) return x > cMid ? "windshield" : "rearglass";
    return "sideglass:" + (z >= 0 ? 1 : -1);
  }, cabinKeys);
  const GLASS_POP = { windshield: [0.22, 0.16, 0], rearglass: [-0.22, 0.12, 0], sideglass: [0, 0.06, 0.22] };
  Object.keys(cabinParts).forEach(function (key) {
    const [id, sd] = key.split(":"), side = sd ? +sd : 1;
    if (id === "drop") return;
    if (id === "roof") { deco(subMesh(cabin, cabinParts[key], paintMat())); return; }
    if (id === "bpillar") { deco(subMesh(cabin, cabinParts[key], material("gloss"))); return; }
    const ex = GLASS_POP[id].slice(); ex[2] *= side;
    cabinMesh[key] = panel(id, subMesh(cabin, cabinParts[key], material("glass")), ex);
  });
  gapLines(cabin, cabinKeys, (x) => (C0.base + topC(x)) / 2, (k1, k2) => cabinMesh[k1] || cabinMesh[k2] || null);
  deco(mesh(rbox(S.interior.size[0], S.interior.size[1], S.interior.size[2], 0.1), "interior", S.interior.pos));
  if (S.openTop) {
    // folded soft top behind the seats
    panel("softtop", mesh(rbox(0.42, 0.11, 1.3, 0.05), "trim", [C0.x0 - 0.3, C0.base + 0.07, 0]), [-0.12, 0.28, 0]);
  }
  if (S.bed) {
    // bed floor and the wall behind the cab
    const len = S.bed.x1 - S.bed.x0, floorH = topL((S.bed.x0 + S.bed.x1) / 2) - 0.45;
    panel("bed", group([
      mesh(rbox(len - 0.04, 0.03, S.width * 2 - 0.12, 0.01), "plastic", [(S.bed.x0 + S.bed.x1) / 2, floorH, 0]),
      mesh(rbox(0.035, 0.44, S.width * 2 - 0.1, 0.01), "paint", [S.bed.x1, floorH + 0.22, 0], null, { color: paintColor }),
    ]), POP.bed);
  }

  // lights, grille, mirrors, handles, wipers and trim
  panel("grille", group([
    stick(mesh(rbox(0.05, S.grille.h, S.grille.w, 0.02), "trim", null, null, { map: getTextures().grille }), [FRONT, S.grille.y, 0], [-1, 0, 0], 0.018, false),
    stick(mesh(rbox(0.05, 0.08, S.intake.w, 0.02), "trim", null, null, { map: getTextures().grille }), [FRONT, S.intake.y, 0], [-1, 0, 0], 0.018, false),
  ]), [0.26, 0, 0]);
  // unpainted lower lips: front splitter and rear diffuser
  const lipF = S.bot[S.bot.length - 1][1] + 0.03, lipR = S.bot[0][1] + 0.04;
  panel("bumperF", stick(mesh(rbox(0.06, 0.05, S.width * 1.55, 0.02), "trim"), [FRONT, lipF, 0], [-1, 0, 0], 0.03, false), POP.bumperF);
  panel("bumperR", stick(mesh(rbox(0.06, 0.07, S.width * 1.45, 0.02), "trim"), [BACK, lipR, 0], [1, 0, 0], 0.03, false), POP.bumperR);
  // dark wheel-well liners inside each arch
  [W, R].forEach((wx) => [-1, 1].forEach((s) => deco(mesh(new THREE.CylinderGeometry(S.arch - 0.006, S.arch - 0.006, 0.3, 32, 1, true, Math.PI / 2, Math.PI), "liner", [wx, A - 0.06, s * (S.width - 0.16)], RX))));
  deco(stick(mesh(rbox(0.012, 0.1, 0.32, 0.005), "plate"), [FRONT, S.plates.front[1], 0], [-1, 0, 0], -0.004));
  deco(stick(mesh(rbox(0.012, 0.1, 0.32, 0.005), "plate"), [BACK, S.plates.rear[1], 0], [1, 0, 0], -0.004));
  [-1, 1].forEach(function (s) {
    const hl = S.headlight, tl = S.taillight;
    // lamps: thin lenses set into the corners, following the body's curve
    panel("headlamp", stick(mesh(rbox(0.05, hl.size[1] * 1.4, hl.size[2] * 1.15, 0.02), "headlight"), [FRONT, hl.pos[1], s * hl.pos[2]], [-1, 0, 0], 0.016), [0.2, 0.02, s * 0.06]);
    panel("taillamp", stick(mesh(rbox(0.05, tl.size[1], tl.size[2], 0.02), "taillight"), [BACK, tl.pos[1], s * tl.pos[2]], [1, 0, 0], 0.016), [-0.2, 0, s * 0.05]);
    panel("fog", stick(mesh(cyl(0.032, 0.03, 24), "headlight", null, RZ), [FRONT, S.intake.y + 0.035, s * 0.55], [-1, 0, 0], 0.006, false), [0.22, 0, 0]);
    panel("mirrors", group([
      mesh(rbox(0.04, 0.03, 0.08, 0.01), "trim", [0, -0.02, -s * 0.05]),
      mesh(rbox(0.11, 0.075, 0.13, 0.03), "paint", [0, 0.01, 0], null, { color: paintColor }),
      mesh(rbox(0.01, 0.06, 0.11, 0.004), "chrome", [-0.056, 0.01, 0]),
      mesh(rbox(0.02, 0.012, 0.07, 0.004), "headlight", [0.01, -0.025, s * 0.02]), // turn-signal repeater
    ], [S.mirror[0], S.mirror[1], s * S.mirror[2]]), [0, 0.06, s * 0.2]);
    panel("handles", group(S.handles.map((x) => stick(mesh(rbox(0.11, 0.022, 0.02, 0.008), "chrome"), [x, S.handleY, s * 2], [0, 0, -s], 0.004, false))), [0, 0, s * 0.4]);
    panel("wipers", mesh(rbox(0.025, 0.012, 0.56, 0.005), "trim", [S.wipers[0], S.wipers[1], s * 0.24], [0, 0.18 * s, -0.5]), [0, 0.16, 0]);
    if (S.rails) {
      // roof rails on short feet, following the roofline
      const rx0 = S.rails.x0, rx1 = S.rails.x1, ry = Math.max(topC(rx0), topC(rx1)) + 0.035, rz = s * S.rails.z;
      panel("rails", group([
        mesh(rbox(rx1 - rx0, 0.022, 0.032, 0.01), "trim", [(rx0 + rx1) / 2, ry, rz]),
        mesh(rbox(0.07, 0.06, 0.03, 0.008), "trim", [rx0 + 0.06, ry - 0.025, rz]),
        mesh(rbox(0.07, 0.06, 0.03, 0.008), "trim", [rx1 - 0.06, ry - 0.025, rz]),
      ]), [0, 0.2, s * 0.05]);
    }
    // black wheel-arch trim, a crossover cue
    if (S.cladding) panel("flares", group([W, R].map((wx) => mesh(new THREE.TorusGeometry(S.arch + 0.01, 0.03, 8, 32, Math.PI), "trim", [wx, A - 0.06, s * (S.sideZ - 0.005)]))), [0, 0, s * 0.16]);
  });
  panel("brake3", mesh(rbox(0.03, 0.025, 0.26, 0.01), "taillight", [S.brake3[0], S.brake3[1], 0]), [-0.16, 0.1, 0]);
  const roofStart = C0.top.find((p) => p[1] >= roofY - 0.03)[0] + 0.08;
  panel("antenna", mesh(rbox(0.16, 0.06, 0.05, 0.02), "trim", [roofStart, topC(roofStart) + 0.02, 0], [0, 0, 0.12]), [0, 0.2, 0]);

  // ---- underside geometry for this car: x forward, y up, z outboard on side s; wheel centres at (W or R, A, s * 0.78) ----
  const rearDriven = awd || rwd, transSide = vee ? -1 : 1;
  // pickups carry a live rear axle on leaf springs; other driven rears are multi-link
  const solidAxle = rearDriven && !!S.bed;
  // place a brake part built in the wheel's brake frame (see rotorParts); `ang` turns its +x toward the caliper
  const brakeFrame = (obj, x, s, ang) => {
    const X = new THREE.Vector3(Math.cos(ang), Math.sin(ang), 0), Y = new THREE.Vector3(0, 0, s);
    obj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, X.clone().cross(Y)));
    obj.position.set(x, A, s * 0.7);
    return obj;
  };
  // front strut from its clamp on the knuckle to the top mount; strut tops stay under the fender line so they never poke through the hood
  const strutTop = Math.min(A + 0.62, topL(W) - 0.1);
  const strutAxis = (s) => [[W - 0.02, A + 0.16, s * 0.6], [W - 0.045, strutTop, s * 0.555]];
  const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  // a point `t` metres up the front strut, moved `dx` along x (negative is toward the rear)
  const strutPoint = (s, t, dx) => { const [a, b] = strutAxis(s), f = t / dist(a, b); return [a[0] + (b[0] - a[0]) * f + dx, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; };
  // hub: flange under the rotor hat, barrel through the bearing, five studs and the axle nut
  const hubParts = (x, s) => {
    const parts = [
      mesh(cyl(0.07, 0.012, 40), "steel", [x, A, s * 0.723], RX),
      mesh(cyl(0.042, 0.075, 32), "steel", [x, A, s * 0.68], RX),
      mesh(cyl(0.058, 0.05, 32), "aluminum", [x, A, s * 0.605], RX),
      mesh(cyl(0.016, 0.014, 6), "steel", [x, A, s * 0.742], RX),
    ];
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; parts.push(mesh(cyl(0.0055, 0.055, 10), "chrome", [x + Math.cos(a) * 0.05, A + Math.sin(a) * 0.05, s * 0.745], RX)); }
    return parts;
  };
  // cast knuckle: hub boss, arm up to the strut (or upper link), arm down to the ball joint, caliper bracket ears, steering arm in front
  const knuckleParts = (x, s, front, ang) => {
    const z = s * 0.6, n = [0, 0, 1], P = (dx, dy) => [x + dx, A + dy, z];
    const parts = [
      mesh(cyl(0.074, 0.05, 40), "iron", [x, A, z], RX),
      slab(P(0, 0.03), P(-0.02, front ? 0.2 : 0.17), 0.07, 0.05, 0.04, n, "iron"),
      slab(P(0, -0.03), P(0.01, -0.145), 0.07, 0.046, 0.04, n, "iron"),
    ];
    [-0.38, 0.38].forEach(function (d) {
      const a = ang + d, tip = P(Math.cos(a) * 0.125 * k, Math.sin(a) * 0.125 * k);
      parts.push(slab(P(Math.cos(a) * 0.05, Math.sin(a) * 0.05), tip, 0.036, 0.028, 0.03, n, "iron"));
      parts.push(mesh(cyl(0.0075, 0.085, 12), "steel", [tip[0], tip[1], s * 0.64], RX));
    });
    if (front) parts.push(slab(P(-0.03, 0.02), P(-0.15, 0.025), 0.05, 0.03, 0.03, n, "iron"));
    return parts;
  };
  // twist-beam rear: a flat spindle plate on the trailing arm instead of a knuckle
  const spindleParts = (x, s, ang) => {
    const z = s * 0.63, n = [0, 0, 1], P = (dx, dy) => [x + dx, A + dy, z];
    const parts = [mesh(rbox(0.13, 0.13, 0.018, 0.03), "iron", [x, A, z])];
    [-0.38, 0.38].forEach(function (d) {
      const a = ang + d, tip = P(Math.cos(a) * 0.12 * k, Math.sin(a) * 0.12 * k);
      parts.push(slab(P(Math.cos(a) * 0.05, Math.sin(a) * 0.05), tip, 0.034, 0.026, 0.024, n, "iron"), mesh(cyl(0.0075, 0.06, 12), "steel", [tip[0], tip[1], s * 0.655], RX));
    });
    return parts;
  };
  // CV axle from the transaxle (or differential) output at `inner` to the hub: inner joint cup, boots, shaft, outer joint into the knuckle
  const cvParts = (x, s, inner) => {
    const P = (z) => [x, A, s * z], rot = [s * Math.PI / 2, 0, 0];
    return [
      lathe([[0, 0], [0.041, 0], [0.048, 0.012], [0.048, 0.06], [0.031, 0.076]], "steel", P(inner), rot),
      mesh(bellows(0.031, 0.017, 0.085, 6), "rubber", P(inner + 0.075), rot),
      rod(P(inner + 0.15), P(0.505), 0.0135, "steel"),
      mesh(bellows(0.017, 0.035, 0.075, 6), "rubber", P(0.5), rot),
      lathe([[0.035, 0], [0.046, 0.012], [0.047, 0.03], [0.036, 0.046], [0.026, 0.052]], "steel", P(0.575), rot),
    ];
  };
  // strut (built along +y from its foot): clamp with bolts, body, spring perch, dust boot, rod, upper seat, isolator, top plate
  const strutParts = (p0, p1) => {
    const L = dist(p0, p1), body = 0.31;
    return [
      mesh(cyl(0.038, 0.1, 32), "darkSteel", [0, 0.045, 0]),
      mesh(rbox(0.032, 0.09, 0.05, 0.008), "darkSteel", [-0.045, 0.045, 0]),
      ...[0.02, 0.07].map((y) => mesh(cyl(0.007, 0.075, 12), "steel", [-0.05, y, 0], RX)),
      mesh(cyl(0.029, body, 32), "darkSteel", [0, body / 2, 0]),
      lathe([[0.029, 0], [0.074, 0.006], [0.077, 0.014], [0.07, 0.016], [0.029, 0.01], [0.029, 0]], "darkSteel", [0, 0.2, 0], null, 48),
      mesh(bellows(0.025, 0.027, L - body - 0.07, 8), "rubber", [0, body, 0]),
      mesh(cyl(0.01, L - body, 16), "chrome", [0, (L + body) / 2, 0]),
      lathe([[0.02, 0.008], [0.074, 0.006], [0.08, 0], [0.078, -0.008], [0.02, 0], [0.02, 0.008]], "darkSteel", [0, L - 0.05, 0], null, 48),
      mesh(cyl(0.06, 0.022, 36), "rubber", [0, L - 0.034, 0]),
      mesh(cyl(0.07, 0.008, 36), "steel", [0, L - 0.019, 0]),
      mesh(cyl(0.012, 0.014, 6), "steel", [0, L - 0.008, 0]),
      ...[0, 1, 2].map((i) => { const a = (i / 3) * Math.PI * 2 + 0.5; return mesh(cyl(0.005, 0.03, 8), "steel", [Math.cos(a) * 0.05, L - 0.005, Math.sin(a) * 0.05]); }),
    ];
  };
  // the front spring sits between the strut's perch and its upper seat
  const springParts = (p0, p1) => { const y0 = 0.216, y1 = dist(p0, p1) - 0.056; return [mesh(springGeo(0.064, y1 - y0, 5, 0.0105), "spring", [0, y0, 0])]; };
  // rear shock (built along +y from its lower eye)
  const shockParts = (q0, q1) => {
    const L = dist(q0, q1), body = Math.min(0.26, L * 0.55);
    return [
      mesh(cyl(0.02, 0.04, 24), "darkSteel", null, RZ), mesh(cyl(0.013, 0.044, 20), "rubber", null, RZ),
      mesh(cyl(0.026, body - 0.02, 32), "darkSteel", [0, 0.02 + (body - 0.02) / 2, 0]),
      mesh(bellows(0.022, 0.024, L - body - 0.04, 7), "rubber", [0, body, 0]),
      mesh(cyl(0.009, L - body, 16), "chrome", [0, (L + body) / 2, 0]),
      mesh(cyl(0.035, 0.02, 28), "rubber", [0, L - 0.03, 0]),
      mesh(cyl(0.045, 0.006, 28), "steel", [0, L - 0.017, 0]),
      mesh(cyl(0.011, 0.012, 6), "steel", [0, L - 0.008, 0]),
    ];
  };
  // front subframe: one stamped cradle with rounded corners and a rubber body mount at each corner
  const subframeParts = (x0, x1, zh, y) => {
    const rail = 0.07, t = 0.04, outline = roundedRect(new THREE.Shape(), x0, -zh, x1, zh, 0.07);
    outline.holes.push(roundedRect(new THREE.Path(), x0 + rail, -zh + rail, x1 - rail, zh - rail, 0.04));
    const geo = new THREE.ExtrudeGeometry(outline, { depth: t, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2, curveSegments: 10 });
    geo.rotateX(Math.PI / 2);
    geo.translate(0, y + t / 2, 0);
    const parts = [mesh(geo, "darkSteel")];
    [[x0 + 0.04, 1], [x0 + 0.04, -1], [x1 - 0.04, 1], [x1 - 0.04, -1]].forEach(function ([mx, s]) {
      parts.push(mesh(cyl(0.032, 0.05, 28), "rubber", [mx, y + 0.045, s * (zh - 0.035)]), mesh(cyl(0.04, 0.008, 28), "steel", [mx, y + 0.072, s * (zh - 0.035)]));
    });
    return parts;
  };
  // a leaf spring: a profile of width w and thickness t swept along points in the x-y plane
  const leafGeo = (pts, w, t) => {
    // along a curve in the x-y plane the sweep's normal is z, so the shape's x is the leaf's width and its y the thickness
    const sh = new THREE.Shape(); sh.moveTo(-w / 2, -t / 2); sh.lineTo(w / 2, -t / 2); sh.lineTo(w / 2, t / 2); sh.lineTo(-w / 2, t / 2); sh.closePath();
    return new THREE.ExtrudeGeometry(sh, { steps: 32, bevelEnabled: false, extrudePath: new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3().fromArray(p))) });
  };
  // leaf pack under the axle at side z: four leaves on one arc, eyes on a front hanger and a rear shackle, U-bolts and plate
  const leafParts = (z) => {
    const xc = R + 0.02, span = 0.6, eyeY = A + 0.07, sag = A - 0.064, arc = (x) => sag + (eyeY - sag) * Math.pow((x - xc) / span, 2);
    const parts = [];
    [0.6, 0.47, 0.34, 0.2].forEach(function (half, i) {
      const pts = [];
      for (let j = 0; j <= 16; j++) { const x = xc - half + (2 * half * j) / 16; pts.push([x, arc(x) - i * 0.0095, z]); }
      parts.push(mesh(leafGeo(pts, 0.06, 0.008), "darkSteel"));
    });
    [xc + span, xc - span].forEach(function (ex, i) {
      parts.push(mesh(cyl(0.021, 0.064, 24), "darkSteel", [ex, eyeY + 0.012, z], RX), mesh(cyl(0.013, 0.07, 20), "rubber", [ex, eyeY + 0.012, z], RX));
      [-0.036, 0.036].forEach(function (dz) {
        const top = i === 0 ? [ex, eyeY + 0.15, z + dz] : [ex - 0.04, eyeY + 0.13, z + dz];
        parts.push(slab([ex, eyeY + 0.012, z + dz], top, 0.042, 0.042, 0.008, [0, 0, 1], i === 0 ? "steel" : "darkSteel"));
      });
      if (i === 1) parts.push(mesh(cyl(0.018, 0.08, 20), "darkSteel", [ex - 0.04, eyeY + 0.13, z], RX));
    });
    parts.push(mesh(rbox(0.09, 0.014, 0.075, 0.004), "steel", [R, sag - 0.045, z]));
    [-0.035, 0.035].forEach(function (dx) {
      const x = R + dx;
      parts.push(mesh(tube([[x, sag - 0.05, z - 0.033], [x, A + 0.005, z - 0.033], [x, A + 0.043, z], [x, A + 0.005, z + 0.033], [x, sag - 0.05, z + 0.033]], 0.0055, false, 32), "steel"));
      [-0.033, 0.033].forEach((dz) => parts.push(mesh(cyl(0.01, 0.012, 6), "steel", [x, sag - 0.058, z + dz])));
    });
    return parts;
  };
  // live axle housing: tube across, hub flanges, perch pads on the leaf springs
  const axleHousingParts = () => [
    mesh(cyl(0.036, 1.2, 32), "iron", [R, A, 0], RX),
    ...[-1, 1].flatMap((s) => [mesh(cyl(0.062, 0.014, 32), "iron", [R, A, s * 0.6], RX), mesh(rbox(0.075, 0.024, 0.068, 0.005), "iron", [R, A - 0.048, s * 0.5])]),
  ];
  // twist beam: V-section cross beam, trailing arms on pivot bushings, spring seats
  const twistBeamParts = () => {
    const v = new THREE.Shape();
    v.moveTo(-0.055, 0.03); v.lineTo(0, -0.035); v.lineTo(0.055, 0.03); v.lineTo(0.045, 0.035); v.lineTo(0, -0.022); v.lineTo(-0.045, 0.035); v.closePath();
    const beam = new THREE.ExtrudeGeometry(v, { depth: 1.12, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 1 });
    beam.translate(0, 0, -0.56);
    const parts = [mesh(beam, "darkSteel", [R + 0.2, A + 0.01, 0])];
    [-1, 1].forEach(function (s) {
      const pivot = [R + 0.46, A + 0.045, s * 0.585], tail = [R - 0.11, A - 0.015, s * 0.6];
      parts.push(
        slab(pivot, tail, 0.06, 0.085, 0.035, [0, 0, 1], "darkSteel"),
        mesh(cyl(0.036, 0.07, 28), "darkSteel", pivot, RX), mesh(cyl(0.024, 0.076, 24), "rubber", pivot, RX),
        slab([pivot[0], pivot[1] + 0.03, pivot[2]], [pivot[0] + 0.02, pivot[1] + 0.14, pivot[2]], 0.05, 0.06, 0.01, [0, 0, 1], "steel"),
        mesh(cyl(0.066, 0.012, 36), "darkSteel", [R + 0.1, A - 0.004, s * 0.49]),
        slab([R + 0.1, A - 0.004, s * 0.49], [R + 0.1, A, s * 0.58], 0.05, 0.05, 0.01, [0, 1, 0], "darkSteel"),
      );
    });
    return parts;
  };
  // rear differential: housing, cover with bolts, pinion snout and flange, axle outputs
  const diffParts = (x, y) => {
    const toX = [0, 0, -Math.PI / 2];
    const parts = [
      lathe([[0, -0.1], [0.07, -0.09], [0.11, -0.05], [0.12, 0], [0.11, 0.04], [0.09, 0.07], [0, 0.07]], "iron", [x, y, 0], toX, 48),
      lathe([[0, 0], [0.1, 0], [0.105, -0.01], [0.09, -0.03], [0, -0.035]], "darkSteel", [x - 0.1, y, 0], toX, 48),
      mesh(cyl(0.045, 0.1, 28, 0.03), "iron", [x + 0.12, y, 0], toX),
      mesh(cyl(0.045, 0.012, 28), "darkSteel", [x + 0.175, y, 0], RZ),
    ];
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; parts.push(mesh(cyl(0.006, 0.012, 6), "steel", [x - 0.104, y + Math.cos(a) * 0.092, Math.sin(a) * 0.092], RZ)); }
    [-1, 1].forEach((d) => parts.push(mesh(cyl(0.04, 0.08, 28), "iron", [x, y, d * 0.12], RX)));
    return parts;
  };
  // two-piece driveshaft: tubes, universal joints, flanges and the centre support bearing
  const driveshaftParts = (a, b) => {
    const m = a.map((v, i) => (v + b[i]) / 2);
    return [
      rod(a, m, 0.033, "steel"), rod(m, b, 0.033, "steel"),
      mesh(cyl(0.045, 0.04, 28), "rubber", m, RZ),
      slab([m[0], m[1] + 0.03, m[2] - 0.07], [m[0], m[1] + 0.03, m[2] + 0.07], 0.03, 0.03, 0.008, [0, 1, 0], "steel"),
      ...[a, m, b].map((p) => mesh(new THREE.SphereGeometry(0.03, 16, 12), "darkSteel", p)),
      ...[a, b].map((p) => mesh(cyl(0.045, 0.012, 28), "darkSteel", p, RZ)),
    ];
  };

  // wheels and tires; the brakes, hubs and suspension behind them are underside parts
  [[W, 1], [W, -1], [R, 1], [R, -1]].forEach(function ([x, s]) {
    const w = wheel();
    [w.tire, w.rim].forEach((g) => { g.scale.set(k, k, 1); if (s < 0) g.rotation.y = Math.PI; g.position.set(x, A, s * 0.78); });
    panel("tires", w.tire, [0, 0, s * 0.36]);
    panel("wheels", w.rim, [0, 0, s * 0.36]);

    // brakes and hub, built in the wheel's frame: vented rotor, single-piston sliding caliper on its bracket, pads either side
    const front = x === W, ang = front ? Math.PI * 0.72 : Math.PI * 0.28, rOut = (front ? 0.19 : 0.172) * k;
    under("rotors", brakeFrame(group(rotorParts(rOut, 0.115 * k, 0.085 * k)), x, s, 0), [0, 0, s * 0.12]);
    under("calipers", brakeFrame(group(caliperParts(rOut, 0.122 * k, rOut - 0.006)), x, s, ang), [0, 0.03, s * 0.2]);
    under("pads", brakeFrame(group(padParts(0.122 * k, rOut - 0.006, 0.3)), x, s, ang), [0, 0.05, s * 0.3]);
    under("bearings", group(hubParts(x, s).concat(front || (rearDriven && !solidAxle) ? knuckleParts(x, s, front, ang) : spindleParts(x, s, ang))), [0, 0, s * 0.08]);
    // hose from the caliper to a bracket on the strut (front) or the body (rear), then the hard line inboard
    const banjo = [x + Math.cos(ang) * (rOut + 0.004), A + Math.sin(ang) * (rOut + 0.004), s * 0.64];
    const clip = front ? strutPoint(s, 0.1, -0.035) : [x + (x > 0 ? -1 : 1) * 0.1, A + 0.2, s * 0.52];
    under("blines", group([
      mesh(tube([banjo, [banjo[0], banjo[1] + 0.05, s * 0.6], clip], 0.0065, false, 32), "hose"),
      mesh(cyl(0.011, 0.02, 6), "steel", banjo, RZ),
      mesh(tube([clip, [clip[0], clip[1] + 0.06, s * 0.46], [x - 0.12 * (x > 0 ? 1 : -1), A + 0.26, s * 0.42]], 0.004, false, 24), "steel"),
    ]), [0, 0.06, 0]);
  });
  const floorY = botBase(0), py = floorY - 0.05;
  under("blines", rod([W - 0.25, floorY - 0.01, 0.45], [R + 0.3, floorY - 0.01, 0.45], 0.0045, "steel"), [0, -0.06, 0]);

  // front: MacPherson struts on cast knuckles, coil springs, L-shaped lower arms, tie rods to the rack, sway bar, subframe
  [-1, 1].forEach(function (s) {
    const [p0, p1] = strutAxis(s);
    under("struts", group([along(group(strutParts(p0, p1)), p0, p1), slab(strutPoint(s, 0.12, 0), strutPoint(s, 0.12, -0.045), 0.03, 0.026, 0.008, [0, 0, 1], "darkSteel")]), [0, -0.08, s * 0.14]);
    under("springs", along(group(springParts(p0, p1)), p0, p1), [0, -0.04, s * 0.24]);
    const bj = [W + 0.01, A - 0.155, s * 0.6], fb = [W + 0.08, A - 0.115, s * 0.33], rb = [W - 0.22, A - 0.11, s * 0.33];
    const mid = bj.map((v, i) => v + (rb[i] - v) * 0.55), up = [0, 1, 0];
    under("carms", group([
      slab(bj, fb, 0.056, 0.046, 0.022, up, "darkSteel"),
      slab(bj, rb, 0.05, 0.05, 0.022, up, "darkSteel"),
      slab(fb, mid, 0.036, 0.036, 0.016, up, "darkSteel"),
      mesh(cyl(0.032, 0.07, 28), "darkSteel", fb, RZ), mesh(cyl(0.021, 0.076, 20), "rubber", fb, RZ),
      mesh(cyl(0.043, 0.05, 32), "darkSteel", rb), mesh(cyl(0.03, 0.054, 24), "rubber", rb),
      mesh(cyl(0.027, 0.026, 28), "darkSteel", bj),
      lathe([[0.025, 0], [0.031, 0.008], [0.024, 0.02], [0.011, 0.027], [0.008, 0.032]], "rubber", [bj[0], bj[1] + 0.013, bj[2]]),
    ]), [0, -0.12, s * 0.06]);
    const te = [W - 0.15, A + 0.02, s * 0.565], ti = [W - 0.17, A + 0.03, s * 0.37], nut = ti.map((v, i) => v + (te[i] - v) * 0.72);
    under("tierods", group([
      rod(ti, te, 0.0105, "steel"),
      mesh(new THREE.SphereGeometry(0.019, 20, 14), "darkSteel", te),
      lathe([[0.017, 0], [0.019, 0.008], [0.012, 0.016], [0.007, 0.02]], "rubber", [te[0], te[1] + 0.012, te[2]]),
      rod(te, [W - 0.15, A + 0.022, s * 0.6], 0.006, "steel"),
      along(mesh(cyl(0.016, 0.02, 6), "steel"), nut, te),
    ]), [0, -0.08, s * 0.1]);
    // the axle on the transaxle side starts at its differential; the other one under the engine
    if (!rwd) under("cv", group(cvParts(W, s, s === transSide && !electric ? 0.3 : 0.12)), [0, -0.14, 0]);
  });
  const rackX = W - 0.17, rackY = A + 0.03;
  under("rack", group([
    mesh(cyl(0.024, 0.58, 32), "aluminum", [rackX, rackY, 0], RX),
    mesh(cyl(0.032, 0.12, 32), "aluminum", [rackX, rackY, -0.12], RX),
    rod([rackX, rackY + 0.02, -0.13], [rackX - 0.05, rackY + 0.18, -0.15], 0.018, "aluminum"),
    ...[-1, 1].flatMap((d) => [
      mesh(bellows(0.03, 0.016, 0.08, 6), "rubber", [rackX, rackY, d * 0.29], [d * Math.PI / 2, 0, 0]),
      mesh(rbox(0.062, 0.052, 0.036, 0.01), "darkSteel", [rackX, rackY - 0.004, d * 0.21]),
      slab([rackX, rackY - 0.022, d * 0.21], [W - 0.3, A - 0.05, d * 0.21], 0.032, 0.032, 0.012, [0, 0, 1], "darkSteel"),
    ]),
  ]), [0, -0.18, 0]);
  const barEnd = (s) => [W - 0.05, A - 0.03, s * 0.5];
  const barHalf = (s) => [barEnd(s), [W - 0.13, A - 0.034, s * 0.45], [W - 0.24, A - 0.036, s * 0.35], [W - 0.27, A - 0.036, s * 0.22]];
  under("swaybar", group([
    mesh(tube(barHalf(-1).concat(barHalf(1).reverse()), 0.0125, false, 160), "darkSteel"),
    ...[-1, 1].flatMap((s) => {
      const top = strutPoint(s, 0.12, -0.045);
      return [
        mesh(cyl(0.025, 0.042, 24), "rubber", [W - 0.27, A - 0.036, s * 0.25], RX),
        slab([W - 0.3, A - 0.05, s * 0.25], [W - 0.24, A - 0.05, s * 0.25], 0.05, 0.05, 0.006, [0, 1, 0], "steel"),
        rod(barEnd(s), top, 0.0068, "steel"),
        mesh(new THREE.SphereGeometry(0.013, 16, 12), "darkSteel", barEnd(s)),
        mesh(new THREE.SphereGeometry(0.013, 16, 12), "darkSteel", top),
      ];
    }),
  ]), [0, -0.22, 0]);
  under("subframe", group(subframeParts(W - 0.34, W + 0.2, 0.37, A - 0.07)), [0, -0.3, 0]);

  // rear: a twist beam with trailing arms (front-drive), or a multi-link with driven axles (AWD / RWD)
  [-1, 1].forEach(function (s) {
    if (solidAxle) {
      under("springs", group(leafParts(s * 0.5)), [0, -0.06, s * 0.2]);
      const q0 = [R + 0.1, A - 0.035, s * 0.42], q1 = [R + 0.2, A + 0.38, s * 0.46];
      under("struts", along(group(shockParts(q0, q1)), q0, q1), [0, -0.08, s * 0.14]);
    } else if (rearDriven) {
      const kb = [R + 0.01, A - 0.155, s * 0.6], lb = [R - 0.16, A - 0.1, s * 0.27], tl = [R + 0.42, A - 0.01, s * 0.55], ub = [R - 0.02, A + 0.18, s * 0.34];
      under("carms", group([
        slab(kb, lb, 0.07, 0.05, 0.022, [0, 1, 0], "darkSteel"),
        slab([R + 0.03, A - 0.02, s * 0.6], tl, 0.05, 0.04, 0.02, [0, 0, 1], "darkSteel"),
        slab([R - 0.02, A + 0.16, s * 0.6], ub, 0.035, 0.03, 0.016, [0, 1, 0], "darkSteel"),
        mesh(cyl(0.03, 0.06, 24), "rubber", lb, RZ), mesh(cyl(0.03, 0.05, 24), "rubber", tl, RX), mesh(cyl(0.024, 0.05, 24), "rubber", ub, RZ),
        mesh(cyl(0.065, 0.012, 32), "darkSteel", [R - 0.1, A - 0.12, s * 0.45]),
      ]), [0, -0.12, s * 0.06]);
      under("springs", group([mesh(springGeo(0.058, 0.3, 5, 0.0105), "spring", [R - 0.1, A - 0.114, s * 0.45]), mesh(cyl(0.06, 0.016, 32), "rubber", [R - 0.1, A + 0.194, s * 0.45])]), [0, -0.04, s * 0.24]);
      const q0 = [R + 0.08, A - 0.12, s * 0.5], q1 = [R + 0.06, A + 0.38, s * 0.48];
      under("struts", along(group(shockParts(q0, q1)), q0, q1), [0, -0.08, s * 0.14]);
      under("cv", group(cvParts(R, s, 0.12)), [0, -0.14, 0]);
    } else {
      const sp = [R + 0.1, A + 0.004, s * 0.49];
      under("springs", group([
        mesh(springGeo(0.058, 0.25, 4.5, 0.0105), "spring", sp),
        mesh(cyl(0.06, 0.014, 32), "rubber", [sp[0], sp[1] + 0.257, sp[2]]),
      ]), [0, -0.04, s * 0.24]);
      const q0 = [R - 0.09, A - 0.015, s * 0.575], q1 = [R - 0.12, A + 0.42, s * 0.53];
      under("struts", along(group(shockParts(q0, q1)), q0, q1), [0, -0.08, s * 0.14]);
    }
  });
  if (rearDriven) {
    under("rdiff", group(diffParts(R, A + 0.02)), [0, -0.2, 0]);
    under("dshaft", group(driveshaftParts([E.x - 0.3, A + 0.02, 0.06], [R + 0.16, A + 0.02, 0.02])), [0, -0.12, 0]);
    if (solidAxle) under("rbeam", group(axleHousingParts()), [0, -0.2, 0]);
  } else {
    under("rbeam", group(twistBeamParts(R, A)), [0, -0.2, 0]);
  }

  if (!electric) {
    // transaxle bolted to the engine's flywheel end: bell housing, ribbed case inboard of the strut, differential on the axle line, oil pan
    const tz = transSide, gx = E.x - 0.03, gy = E.y - 0.225; // case top stays under the strut's spring perch
    const pan = [mesh(rbox(0.24, 0.024, 0.11, 0.008), "darkSteel", [gx, gy - 0.142, tz * 0.43]), mesh(cyl(0.012, 0.012, 6), "steel", [gx + 0.09, gy - 0.158, tz * 0.43])];
    for (let i = 0; i < 6; i++) pan.push(mesh(cyl(0.005, 0.008, 6), "steel", [gx - 0.1 + i * 0.04, gy - 0.155, tz * (0.43 + (i % 2 ? 0.045 : -0.045))]));
    under("trans", group([
      lathe([[0.2, 0], [0.195, 0.025], [0.17, 0.06], [0.13, 0.085], [0, 0.09]], "cast", [E.x - 0.02, E.y - 0.12, tz * 0.325], [tz * Math.PI / 2, 0, 0], 56),
      mesh(rbox(0.32, 0.26, 0.13, 0.035), "cast", [gx, gy, tz * 0.43]),
      ...[0, 1, 2, 3, 4].map((i) => mesh(rbox(0.012, 0.22, 0.145, 0.004), "cast", [gx - 0.12 + i * 0.06, gy, tz * 0.43])),
      mesh(cyl(0.085, 0.14, 40), "cast", [E.x, A + 0.035, tz * 0.28], RX),
      mesh(cyl(0.055, 0.03, 32), "cast", [E.x, A + 0.035, tz * 0.36], RX),
      ...pan,
    ]), [0, -0.24, tz * 0.08]);

    // exhaust: front pipe and flex joint, catalytic converter, resonator, muffler, tailpipe, hangers.
    // Inline engines exhaust toward the firewall; V engines here start from the front bank.
    const Mx = E.x + (vee ? 0.37 : -0.37);
    const catFront = vee ? E.x - 0.45 : Mx - 0.18, catLen = 0.34, catBack = catFront - catLen;
    const p1 = vee ? [Mx + 0.06, A - 0.12, 0.12] : [Mx - 0.08, floorY - 0.02, 0.16];
    // a bolted pipe joint along x: flange pair and two bolts
    const flange = (p) => [mesh(cyl(0.048, 0.014, 32), "darkSteel", p, RZ), ...[-1, 1].map((d) => mesh(cyl(0.0065, 0.034, 8), "steel", [p[0], p[1] + d * 0.038, p[2]], RZ))];
    under("flex", group([
      mesh(tube([[Mx, E.y - 0.1, 0.05], p1, [catFront + 0.04, py, 0.28]], 0.03, false, 48), "exhaust"),
      mesh(cyl(0.037, 0.12, 24), "darkSteel", [(p1[0] + catFront) / 2, (p1[1] + py) / 2, 0.22], RZ),
      ...[-0.05, -0.025, 0, 0.025, 0.05].map((d) => mesh(new THREE.TorusGeometry(0.037, 0.003, 6, 24), "steel", [(p1[0] + catFront) / 2 + d, (p1[1] + py) / 2, 0.22], [0, Math.PI / 2, 0])),
      ...flange([catFront + 0.04, py, 0.28]),
    ]), [0, -0.12, 0]);
    under("exhaust", group([
      mesh(cyl(0.068, catLen - 0.1, 32), "steel", [catFront - catLen / 2, py, 0.28], RZ),
      mesh(cyl(0.03, 0.05, 24, 0.068), "steel", [catFront - 0.025, py, 0.28], [0, 0, -Math.PI / 2]),
      mesh(cyl(0.03, 0.05, 24, 0.068), "steel", [catBack + 0.025, py, 0.28], [0, 0, Math.PI / 2]),
    ]), [0, -0.16, 0]);
    const resC = (catBack + R + 0.45) / 2, mufX = R - 0.38, mufY = py + 0.03;
    under("resonator", group([
      lathe([[0.03, -0.17], [0.036, -0.158], [0.058, -0.132], [0.063, -0.11], [0.063, 0.11], [0.058, 0.132], [0.036, 0.158], [0.03, 0.17]], "steel", [resC, py, 0.28], RZ, 48),
      ...[-0.06, 0.06].map((d) => mesh(new THREE.TorusGeometry(0.063, 0.0025, 6, 40), "steel", [resC + d, py, 0.28], [0, Math.PI / 2, 0])),
    ]), [0, -0.16, 0]);
    under("xpipe", group([
      mesh(tube([[catBack, py, 0.28], [resC + 0.17, py, 0.28]], 0.03, false, 12), "exhaust"),
      mesh(tube([[resC - 0.17, py, 0.28], [R + 0.35, py, 0.28], [mufX + 0.12, mufY, 0.08]], 0.03, false, 56), "exhaust"),
      ...flange([catBack, py, 0.28]), ...flange([resC - 0.2, py, 0.28]),
    ]), [0, -0.1, 0]);
    const muffler = mesh(cyl(0.11, 0.46, 40), "steel", [mufX, mufY, 0.2], RX);
    muffler.scale.set(1, 1, 0.62);
    under("muffler", muffler, [0, -0.16, 0]);
    under("tailpipe", group([
      mesh(tube([[mufX - 0.05, mufY, 0.42], [mufX - 0.18, S.exhaust[1] - 0.02, S.exhaust[2]], [S.exhaust[0] + 0.1, S.exhaust[1], S.exhaust[2]]], 0.028, false, 30), "exhaust"),
      mesh(cyl(0.038, 0.14, 24), "chrome", S.exhaust, RZ),
    ]), [-0.16, 0, 0]);
    // rubber isolators on steel hooks: one rod from the pipe, one from the body
    under("hangers", group([[catBack - 0.08, py, 0.28], [resC - 0.24, py, 0.28], [R + 0.3, py, 0.28], [mufX, mufY + 0.06, 0.05]].flatMap(([x, y, z]) => [
      mesh(new THREE.TorusGeometry(0.022, 0.008, 10, 28), "rubber", [x, y + 0.075, z]),
      rod([x, y + 0.025, z], [x, y + 0.06, z], 0.0045, "steel"),
      rod([x, y + 0.09, z], [x, y + 0.14, z], 0.0045, "steel"),
    ])), [0, 0.12, 0]);

    // fuel: tank under the rear seat with the pump on top, lines forward to the engine, filler neck to the fuel door
    const tx = -W * 0.5 - 0.02, ty = floorY - 0.05, tz2 = -0.28;
    // molded plastic tank with ribs underneath, held up by two steel straps
    const tankShape = roundedRect(new THREE.Shape(), tx - 0.3, tz2 - 0.28, tx + 0.3, tz2 + 0.28, 0.09);
    const tankGeo = new THREE.ExtrudeGeometry(tankShape, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.022, bevelSize: 0.02, bevelSegments: 4, curveSegments: 12 });
    tankGeo.rotateX(Math.PI / 2);
    tankGeo.translate(0, ty + 0.06, 0);
    const strap = (x) => mesh(tube([[x, ty + 0.07, tz2 - 0.32], [x, ty - 0.06, tz2 - 0.305], [x, ty - 0.084, tz2 - 0.24], [x, ty - 0.086, tz2], [x, ty - 0.084, tz2 + 0.24], [x, ty - 0.06, tz2 + 0.305], [x, ty + 0.07, tz2 + 0.32]], 0.0065, false, 64), "steel");
    under("ftank", group([
      mesh(tankGeo, "plastic"),
      ...[-0.16, 0, 0.16].map((d) => mesh(rbox(0.42, 0.01, 0.03, 0.005), "plastic", [tx - 0.02, ty - 0.086, tz2 + d])),
      strap(tx + 0.18), strap(tx - 0.18),
    ]), [0, -0.32, 0]);
    const pumpAt = [tx + 0.1, ty + 0.084, tz2 + 0.08];
    under("fpump", group([
      lathe([[0.03, 0], [0.078, 0], [0.078, 0.012], [0.07, 0.016], [0.03, 0.016]], "darkSteel", pumpAt, null, 48),
      mesh(cyl(0.062, 0.03, 8), "plastic", [pumpAt[0], pumpAt[1] + 0.03, pumpAt[2]]),
      mesh(rbox(0.035, 0.022, 0.025, 0.005), "plastic", [pumpAt[0] - 0.03, pumpAt[1] + 0.055, pumpAt[2]]),
      ...[0.025, -0.01].map((d) => mesh(cyl(0.008, 0.035, 12), "steel", [pumpAt[0] + 0.03, pumpAt[1] + 0.06, pumpAt[2] + d])),
    ]), [0.32, -0.14, 0]);
    const filterAt = [tx + 0.62, py + 0.02, -0.42];
    under("ffilter", group([
      lathe([[0.012, -0.08], [0.02, -0.07], [0.029, -0.055], [0.03, 0.05], [0.022, 0.065], [0.012, 0.075]], "darkSteel", filterAt, RZ, 32),
      ...[-0.09, 0.085].map((d) => mesh(cyl(0.0075, 0.03, 12), "steel", [filterAt[0] + d, filterAt[1], filterAt[2]], RZ)),
      slab([filterAt[0], filterAt[1] + 0.03, filterAt[2]], [filterAt[0], filterAt[1] + 0.07, filterAt[2]], 0.04, 0.03, 0.006, [1, 0, 0], "steel"),
    ]), [0, -0.12, -0.04]);
    // the line climbs to the fuel rail but stays under the hood line
    const railX = E.x + (vee ? 0 : 0.19), rail = [railX, Math.min(E.y + (vee ? 0.33 : 0.23), topL(railX) - 0.1), -0.3];
    under("flines", group([
      mesh(tube([[tx + 0.1, ty + 0.1, tz2 + 0.08], [tx + 0.36, py + 0.02, -0.42], [tx + 0.55, py + 0.02, -0.42]], 0.006, false, 24), "steel"),
      mesh(tube([[tx + 0.69, py + 0.02, -0.42], [W - 0.5, py + 0.02, -0.42], [E.x - 0.32, E.y - 0.12, -0.42], [E.x - 0.1, Math.min(E.y + 0.3, topL(E.x - 0.1) - 0.12), -0.42], rail], 0.006, false, 80), "steel"),
      mesh(tube([[tx + 0.16, ty + 0.1, tz2 + 0.08], [tx + 0.3, py + 0.03, -0.55], [tx + 0.39, py, -0.62]], 0.005, false, 24), "hose"),
    ]), [0, -0.08, 0]);
    under("evap", group([
      mesh(rbox(0.22, 0.1, 0.12, 0.025), "plastic", [tx + 0.5, py, -0.62]),
      ...[-0.06, 0, 0.06].map((d) => mesh(cyl(0.008, 0.04, 12), "plastic", [tx + 0.62, py + d * 0.5, -0.62 + d], RZ)),
      ...[-1, 1].map((d) => slab([tx + 0.5 + d * 0.08, py + 0.05, -0.62], [tx + 0.5 + d * 0.08, py + 0.1, -0.62], 0.03, 0.03, 0.006, [1, 0, 0], "plastic")),
    ]), [0, -0.14, -0.05]);
    // fuel door behind the rear wheel; on a pickup, low on the bed side so the neck stays under the bed floor
    const fdX = S.bed ? R + 0.62 : R - 0.28, fdZ = -(S.sideZ - 0.02);
    const fdY = S.bed ? topL((S.bed.x0 + S.bed.x1) / 2) - 0.47 : topL(fdX) - 0.22;
    under("fneck", group([
      mesh(tube([[tx - 0.26, ty + 0.02, tz2 - 0.22], [(tx - 0.26 + fdX) / 2, ty + 0.12, -0.7], [fdX + 0.05, fdY - 0.06, fdZ + 0.06], [fdX, fdY, fdZ]], 0.022, false, 40), "darkSteel"),
      mesh(cyl(0.035, 0.02, 24), "trim", [fdX, fdY, fdZ + 0.01], RX),
    ]), [0, 0, -0.14]);
  }

  // the hood opens the engine bay: an invisible pick target over it
  const hood = new THREE.Mesh(new THREE.BoxGeometry(S.hood.size[0], S.hood.size[1], S.hood.size[2]), new THREE.MeshBasicMaterial({ visible: false }));
  hood.position.set(S.hood.pos[0], S.hood.pos[1], S.hood.pos[2]);
  tag(hood, "engine"); car.add(hood);

  car.traverse((m) => { if (m.isMesh) { m.castShadow = m.material.visible !== false; m.receiveShadow = true; } });
  car.scale.z = S.kz || 1; // real width
  return { group: car, body, panels, chassis, hood, engineAt: E.clone(), floorY, view: S.view || [0.7, 1] };
}

/** A two-post lift for the underside view. floorY: the car's underbody height (buildCar returns it).
 * carriage rides up with the car: set its y to the car's. */
export function buildLift(floorY) {
  const g = new THREE.Group(), carriage = new THREE.Group();
  [-1, 1].forEach(function (s) {
    g.add(mesh(rbox(0.2, 2.9, 0.2, 0.02), "liftPost", [-0.1, 1.45, s * 1.32]));
    g.add(mesh(rbox(0.5, 0.05, 0.4, 0.01), "darkSteel", [-0.1, 0.025, s * 1.32]));
    carriage.add(mesh(rbox(0.26, 0.3, 0.12, 0.02), "liftArm", [-0.1, floorY - 0.12, s * 1.18]));
    [-1, 1].forEach(function (f) {
      carriage.add(rod([-0.1, floorY - 0.1, s * 1.15], [-0.1 + f * 0.85, floorY - 0.06, s * 0.52], 0.035, "liftArm"));
      carriage.add(mesh(cyl(0.06, 0.05, 20), "rubber", [-0.1 + f * 0.85, floorY - 0.025, s * 0.52]));
    });
  });
  g.add(carriage);
  return { group: g, carriage };
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
  // fuel rail with one injector per cylinder, tucked under the runners
  const rail = [];
  banks.forEach(function (s) {
    const rx = vee ? s * 0.1 : 0.19, ry = vee ? 0.33 : 0.23;
    rail.push(mesh(cyl(0.011, 0.5, 16), "aluminum", [rx, ry, 0], RX));
    zs.forEach((z) => rail.push(group([mesh(cyl(0.009, 0.05, 12), "trim"), mesh(cyl(0.012, 0.014, 12), "plastic", [0, 0.028, 0])],
      [rx - (vee ? s * 0.02 : 0.025), ry - 0.02, z], [0, 0, vee ? -s * 0.5 : 0.6])));
  });
  place("injectors", group(rail), [0, 0, 0], vee ? [0, 0.36, 0] : [0.3, 0.02, 0]);
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
  const manifoldGroup = group(manifold);
  // for the detailed manifold: where the runners meet the head, which way the head is (+x when ex < 0), port spacing
  manifoldGroup.userData.port = { at: [ex * (vee ? 0.27 : 0.15), 0.2, 0], head: -ex, spacing: zs.length > 1 ? zs[1] - zs[0] : 0.14 };
  place("manifold", manifoldGroup, [0, 0, 0], [ex * 0.12, -0.04, 0]);
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
  const flange = mesh(cyl(0.09, 0.02, 48), "darkSteel", [0, crankC.y, az > 0 ? -0.32 : 0.32], RX); // flywheel flange (transmission end)
  flange.userData.flange = true; // stays when the detailed crank replaces the rest
  crankParts.push(flange);
  const spacing = zs.length > 1 ? zs[1] - zs[0] : 0.14;
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
      rodObj.userData.pin = pin.clone(); rodObj.userData.wrist = wrist.clone(); // in the group's frame, for the detailed rod model
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
      const cam = group(camParts, null, rot);
      cam.userData.cam = { spacing, radius: 0.022 }; // for the detailed cam model: lobe pairs one spacing apart
      place("cam", cam, [at.x, at.y, 0], [u.x * 0.6 + v.x * side * 0.05, u.y * 0.6, 0], inside);
    });
  });
  const crankGroup = group(crankParts);
  // for the detailed crank model: throws one spacing apart along z, pins throwR off the axis, flywheel at flywheelZ
  crankGroup.userData.crank = { spacing, throw: throwR, axisY: crankC.y, flywheelZ: az > 0 ? -1 : 1 };
  place("crank", crankGroup, [0, 0, 0], [0, -0.22, 0], inside);

  return { group: engine, parts, decor, inside };
}
