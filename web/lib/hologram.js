// Vinsight 3D hologram: whole car → exploded engine bay → one part with prices and order links.
// Shared by the landing page (as an auto-playing demo) and the app's car page (interactive).
// Plain JavaScript so the landing page can load it as a browser module through an import map.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { PARTS, byId, buyLinks, carLabel, esc, money, tiers, wrenches } from "./parts.js";

const CSS = `
.holo { position: relative; overflow: hidden; }
.holo [hidden] { display: none !important; }
.holo-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; cursor: crosshair; touch-action: pan-y; }
.holo.is-demo .holo-canvas, .holo.is-demo .holo-labels, .holo.is-demo .holo-panel, .holo.is-demo .holo-panel *, .holo.is-demo .holo-crumbs * { pointer-events: none !important; }
.holo-hud, .holo-hint, .holo-crumbs, .holo-tip, .holo-chip, .holo-strip button, .holo-panel .back, .holo .hud, .holo-pause { font-family: var(--f-hud, ui-monospace, monospace); text-transform: uppercase; }
.holo-hud { position: absolute; left: 14px; top: 12px; right: 14px; display: flex; justify-content: space-between; gap: 10px; pointer-events: none; z-index: 2; letter-spacing: .14em; font-size: 12px; color: var(--steel); }
.holo-hud .v { color: var(--holo); }
.holo.is-narrow .holo-hud > span:last-child { display: none; }
.holo-corner { position: absolute; width: 34px; height: 34px; border: 2px solid var(--holo); pointer-events: none; opacity: .8; z-index: 2; }
.holo-corner.tl { top: 0; left: 0; border-right: 0; border-bottom: 0; }
.holo-corner.tr { top: 0; right: 0; border-left: 0; border-bottom: 0; }
.holo-corner.bl { bottom: 0; left: 0; border-right: 0; border-top: 0; }
.holo-corner.br { bottom: 0; right: 0; border-left: 0; border-top: 0; }
.holo-hint { position: absolute; left: 14px; bottom: 12px; pointer-events: none; color: var(--holo); z-index: 2; letter-spacing: .14em; font-size: 12px; }
.holo[data-mode="bay"] .holo-hint, .holo.is-demo .holo-hint { display: none; }
.holo-tip { position: absolute; pointer-events: none; z-index: 7; padding: 4px 8px; background: rgba(3,6,12,.9); border: 1px solid var(--holo); color: var(--holo); font-size: 12px; letter-spacing: .1em; white-space: nowrap; transform: translate(12px, -50%); }
.holo-btn { font-family: var(--f-hud, ui-monospace, monospace); font-weight: 600; text-transform: uppercase; letter-spacing: .12em; font-size: 13px; padding: 11px 16px; border: 1px solid var(--holo); background: var(--holo); color: #021018; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 8px; transition: box-shadow .2s, transform .2s; }
.holo-btn:hover { box-shadow: 0 0 22px rgba(61,224,255,.5); }
.holo-btn.warm { background: var(--amber); border-color: var(--amber); }
.holo-btn.ghost { background: transparent; color: var(--holo); }
.holo-btn.pressed { box-shadow: 0 0 0 4px rgba(255,176,46,.45), 0 0 34px var(--amber); transform: scale(.97); }
.holo-crumbs { position: absolute; left: 14px; top: 40px; z-index: 4; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: 12px; letter-spacing: .12em; color: var(--steel); }
.holo-crumbs button { font: inherit; letter-spacing: inherit; text-transform: inherit; background: rgba(3,6,12,.8); border: 1px solid var(--line); color: var(--holo); padding: 5px 9px; cursor: pointer; }
.holo-crumbs button:hover { border-color: var(--holo); }
.holo-crumbs .here { color: var(--amber); }
.holo-baybtn { position: absolute; right: 14px; bottom: 12px; z-index: 4; }
.holo-labels { position: absolute; inset: 0; pointer-events: none; z-index: 3; overflow: hidden; transition: opacity .3s; }
.holo-lines { position: absolute; inset: 0; width: 100%; height: 100%; }
.holo-lines line { stroke: rgba(255,176,46,.55); stroke-width: 1; }
.holo-dot { position: absolute; left: 0; top: 0; width: 8px; height: 8px; margin: -4px 0 0 -4px; border-radius: 50%; background: var(--amber); box-shadow: 0 0 8px var(--amber); }
.holo-chip { position: absolute; left: 0; top: 0; pointer-events: auto; font-size: 11px; letter-spacing: .08em; white-space: nowrap; background: rgba(3,6,12,.88); border: 1px solid var(--line); color: var(--ink); padding: 3px 7px; cursor: pointer; }
.holo-chip:hover, .holo-chip.on { border-color: var(--amber); color: var(--amber); }
.holo.is-narrow .holo-chip, .holo.is-narrow .holo-lines { display: none; }
.holo-strip { position: absolute; left: 0; right: 0; bottom: 0; z-index: 4; display: flex; gap: 6px; overflow-x: auto; padding: 18px 14px 12px; background: linear-gradient(transparent, rgba(7,11,20,.92) 45%); scrollbar-width: thin; }
.holo-strip button { flex: none; font-size: 12px; letter-spacing: .08em; background: var(--bay-2, #0d1424); border: 1px solid var(--line); color: var(--ink); padding: 7px 10px; cursor: pointer; }
.holo-strip button:hover, .holo-strip button:focus-visible { border-color: var(--amber); color: var(--amber); }
.holo-panel { position: absolute; z-index: 5; right: 14px; top: 72px; bottom: 14px; width: min(340px, 50%); overflow-y: auto; background: rgba(9,14,26,.95); border: 1px solid var(--amber); padding: 16px; box-shadow: 0 0 40px rgba(255,176,46,.15); color: var(--ink); }
.holo-panel .back { font-size: 12px; letter-spacing: .12em; background: none; border: 0; color: var(--holo); padding: 0; cursor: pointer; }
.holo-panel h3 { font-family: var(--f-display, Impact, sans-serif); font-weight: 800; text-transform: uppercase; font-size: 34px; line-height: .95; color: var(--holo); margin: 10px 0 4px; }
.holo-panel .sys { color: var(--amber); font-size: 12px; letter-spacing: .12em; }
.holo-panel p { font-size: 14px; color: #c3cee6; margin: 10px 0; }
.holo-panel .fine { font-size: 13px; color: var(--steel); }
.holo-panel .buy { display: grid; gap: 8px; margin-top: 12px; }
.holo .tiers { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin: 14px 0 0; }
.holo .tier { border: 1px solid var(--line); padding: 8px; background: rgba(3,6,12,.5); min-width: 0; }
.holo .tier .hud { font-size: 10px; letter-spacing: .1em; color: var(--steel); }
.holo .tier .val { font-family: var(--f-display, Impact, sans-serif); font-weight: 800; font-size: 28px; line-height: 1; margin-top: 4px; font-variant-numeric: tabular-nums; }
.holo .tier.low { border-color: var(--ok); }
.holo .tier.low .val { color: var(--ok); }
.holo .minis { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin: 14px 0 0; }
.holo .minis div { border-top: 2px solid var(--line); padding-top: 6px; font-size: 14px; min-width: 0; }
.holo .minis .hud { font-size: 11px; letter-spacing: .1em; color: var(--steel); }
.holo .minis .save { color: var(--ok); font-weight: 600; }
.holo .wrench { display: inline-flex; gap: 3px; vertical-align: middle; }
.holo .wrench i { width: 12px; height: 6px; background: var(--line); transform: skewX(-20deg); }
.holo .wrench i.on { background: var(--amber); box-shadow: 0 0 6px var(--amber); }
.holo.is-stacked[data-mode="part"]:not(.is-demo) { min-height: 680px; }
.holo.is-stacked .holo-panel { left: 10px; right: 10px; top: auto; bottom: 10px; width: auto; max-height: 58%; }
.holo.is-demo .holo-panel .minis, .holo.is-demo .holo-panel p, .holo.is-demo .holo-panel .back { display: none; }
.holo.is-demo.is-stacked .holo-panel { max-height: 66%; padding: 12px; }
.holo.is-demo.is-stacked .holo-panel h3 { font-size: 26px; }
.holo.is-demo.is-stacked .holo-panel .buy a:not(.holo-buy-main) { display: none; }
.holo-cursor { position: absolute; left: 0; top: 0; z-index: 8; width: 24px; height: 24px; pointer-events: none; transition: transform .9s cubic-bezier(.6,0,.3,1), opacity .3s; filter: drop-shadow(0 0 6px rgba(61,224,255,.7)); }
.holo-cursor svg { display: block; }
.holo-cursor.tap::after { content: ""; position: absolute; left: -12px; top: -12px; width: 24px; height: 24px; border: 2px solid var(--amber); border-radius: 50%; animation: holo-tap .5s ease-out forwards; }
@keyframes holo-tap { from { transform: scale(.3); opacity: 1; } to { transform: scale(1.9); opacity: 0; } }
.holo-caption { position: absolute; left: 14px; bottom: 14px; z-index: 6; max-width: min(360px, 62%); background: rgba(3,6,12,.85); border-left: 3px solid var(--amber); padding: 8px 12px; transition: opacity .35s; }
.holo-caption b { display: block; font-family: var(--f-hud, ui-monospace, monospace); font-size: 11px; letter-spacing: .14em; color: var(--amber); }
.holo-caption strong { display: block; font-family: var(--f-display, Impact, sans-serif); font-size: 22px; text-transform: uppercase; line-height: 1.05; color: var(--ink); }
.holo-caption span { font-size: 13px; color: var(--steel); }
.holo.is-stacked[data-mode="part"] .holo-caption { bottom: auto; top: 70px; }
.holo-pause { position: absolute; right: 12px; bottom: 12px; z-index: 7; font-size: 11px; letter-spacing: .12em; background: rgba(3,6,12,.8); border: 1px solid var(--line); color: var(--holo); padding: 6px 10px; cursor: pointer; }
.holo.is-demo[data-mode="part"]:not(.is-stacked) .holo-pause { right: auto; left: 50%; transform: translateX(-50%); }
.holo-nogl { position: absolute; inset: 0; display: grid; place-items: center; text-align: center; color: var(--steel); padding: 24px; font-family: var(--f-hud, ui-monospace, monospace); text-transform: uppercase; font-size: 12px; letter-spacing: .14em; }
@media (prefers-reduced-motion: reduce) { .holo-cursor { transition: none; } }
`;

const CURSOR = '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 2 L3 19 L8 14.5 L11.5 22 L14.5 20.6 L11 13.3 L17.5 13.3 Z" fill="#e8eefb" stroke="#070b14" stroke-width="1.5" stroke-linejoin="round"/></svg>';

const HOLO = 0x3de0ff, AMBER = 0xffb02e, CORAL = 0xff4d6d;
const CAR_T = new THREE.Vector3(0.1, 0.7, 0);
const CAR_DIR = new THREE.Vector3(5.4, 3.1, 5.6).sub(CAR_T).normalize();
const BAY_T = new THREE.Vector3(1.75, 1.08, 0);
const BAY_DIR = new THREE.Vector3(1.0, 0.9, 0.8).normalize();
const TOUR = ["alt", "plugs", "tbelt", "batt", "coils", "rad", "wpump", "thermo"];

function injectCss() {
  if (document.getElementById("holo-css")) return;
  const s = document.createElement("style");
  s.id = "holo-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

function isElectric(v) { return /^electric$/i.test(String(v.fuel || "").trim()); }

/**
 * root: an empty, sized element (give it a height or min-height).
 * options.vehicle: { year, make, model, trim, engine, cylinders, fuel }
 * options.demo: play a looping guided tour instead of taking input.
 * options.onSelect(id): called when the viewer opens a part.
 */
export function createHologram(root, options = {}) {
  const demo = !!options.demo;
  const onSelect = options.onSelect || function () {};
  let vehicle = Object.assign({}, options.vehicle);
  injectCss();
  root.classList.add("holo");
  root.classList.toggle("is-demo", demo);
  root.innerHTML =
    '<canvas class="holo-canvas"></canvas>' +
    '<div class="holo-hud"><span>Scan <span class="v" data-car></span></span><span><span class="v">' + PARTS.length + "</span> parts mapped</span></div>" +
    '<nav class="holo-crumbs" aria-label="3D view"></nav>' +
    '<div class="holo-labels" aria-hidden="true"><svg class="holo-lines"></svg></div>' +
    '<div class="holo-hint"></div>' +
    '<button type="button" class="holo-btn holo-baybtn">Open engine bay</button>' +
    '<div class="holo-strip" role="group" aria-label="Engine bay parts" hidden></div>' +
    '<aside class="holo-panel" aria-label="Part details" hidden></aside>' +
    '<div class="holo-tip" hidden></div>' +
    '<span class="holo-corner tl"></span><span class="holo-corner tr"></span><span class="holo-corner bl"></span><span class="holo-corner br"></span>' +
    (demo ? '<div class="holo-cursor" aria-hidden="true">' + CURSOR + '</div><div class="holo-caption" aria-hidden="true"><b></b><strong></strong><span></span></div><button type="button" class="holo-pause"></button>' : "");
  const $ = (s) => root.querySelector(s);
  const canvas = $(".holo-canvas"), crumbs = $(".holo-crumbs"), hint = $(".holo-hint"), bayBtn = $(".holo-baybtn");
  const strip = $(".holo-strip"), panel = $(".holo-panel"), tip = $(".holo-tip"), labelsEl = $(".holo-labels"), linesEl = $(".holo-lines");
  canvas.setAttribute("aria-label", demo
    ? "Demo: the 3D car opens its engine bay, zooms into a part and shows its prices."
    : "Interactive 3D model of your car. Use the engine bay part buttons for keyboard access.");
  if (demo) canvas.setAttribute("role", "img");

  const stub = { setVehicle() {}, destroy() { root.innerHTML = ""; } };
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
  catch (e) {
    root.insertAdjacentHTML("beforeend", '<div class="holo-nogl">3D view needs WebGL.</div>');
    return stub;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x070b14, 9, 20);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.copy(CAR_T).addScaledVector(CAR_DIR, 8.4);
  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(CAR_T);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.enablePan = false; controls.enableZoom = false;
  controls.enableRotate = !demo;
  controls.minPolarAngle = 0.35; controls.maxPolarAngle = 1.45;
  controls.autoRotate = !reduce; controls.autoRotateSpeed = 0.7;

  scene.add(new THREE.AmbientLight(0x6688aa, 1.6));
  const key = new THREE.PointLight(HOLO, 4, 20, 0); key.position.set(3, 5, 3); scene.add(key);

  // floor grid + rings
  const grid = new THREE.GridHelper(16, 40, HOLO, 0x123047); grid.material.transparent = true; grid.material.opacity = 0.35; scene.add(grid);
  const rings = [2.9, 3.4, 4.2].map(function (r, i) {
    const g = new THREE.RingGeometry(r, r + (i === 1 ? 0.06 : 0.02), 128, 1, 0, Math.PI * (i === 1 ? 1.4 : 2));
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: i === 1 ? AMBER : HOLO, transparent: true, opacity: i === 1 ? 0.55 : 0.3, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2; m.position.y = 0.01; scene.add(m);
    return m;
  });

  // body shell (edges only, not clickable). Its materials fade when the engine bay opens.
  const car = new THREE.Group(); scene.add(car);
  const shellMats = [];
  function fadeable(mat) { shellMats.push({ m: mat, base: mat.opacity }); return mat; }
  function shell(geo) {
    car.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 18), fadeable(new THREE.LineBasicMaterial({ color: HOLO, transparent: true, opacity: 0.75 }))));
    car.add(new THREE.Mesh(geo, fadeable(new THREE.MeshBasicMaterial({ color: HOLO, transparent: true, opacity: 0.045, depthWrite: false, side: THREE.DoubleSide }))));
  }
  const side = new THREE.Shape();
  side.moveTo(-2.3, 0.35); side.lineTo(2.15, 0.35); side.lineTo(2.3, 0.62); side.lineTo(2.2, 0.95);
  side.lineTo(0.95, 1.08); side.lineTo(0.35, 1.62); side.lineTo(-1.2, 1.62); side.lineTo(-1.85, 1.12);
  side.lineTo(-2.3, 1.02); side.lineTo(-2.3, 0.35);
  const bodyGeo = new THREE.ExtrudeGeometry(side, { depth: 1.76, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2, steps: 1 });
  bodyGeo.translate(0, 0, -0.88);
  shell(bodyGeo);
  const win = new THREE.Shape(); win.moveTo(0.8, 1.12); win.lineTo(0.32, 1.55); win.lineTo(-1.15, 1.55); win.lineTo(-1.7, 1.14); win.lineTo(0.8, 1.12);
  [-0.95, 0.95].forEach(function (z) {
    const l = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(win.getPoints()), fadeable(new THREE.LineBasicMaterial({ color: HOLO, transparent: true, opacity: 0.5 })));
    l.position.z = z; car.add(l);
  });

  function partMat(c) { return new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.55, transparent: true, opacity: 0.78, roughness: 0.4, metalness: 0.2 }); }
  function makePart(id, geo, rot, color) {
    const m = new THREE.Mesh(geo, partMat(color || HOLO));
    if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
    m.userData.id = id; m.userData.base = color || HOLO;
    m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 })));
    return m;
  }
  const cyl = (r, h, s) => new THREE.CylinderGeometry(r, r, h, s || 24);
  const RX = [Math.PI / 2, 0, 0], RZ = [0, 0, Math.PI / 2];

  // whole-car parts (simplified; the engine bay ones are swapped for the detailed engine)
  const pickables = [];
  function addPart(id, geo, pos, rot, color) {
    const m = makePart(id, geo, rot, color);
    m.position.set(pos[0], pos[1], pos[2]);
    m.userData.inBay = !!byId[id].bay;
    car.add(m); pickables.push(m);
  }
  addPart("engine", new THREE.BoxGeometry(0.85, 0.5, 0.8), [1.45, 0.78, 0], null, 0x2aa8c8);
  for (let i = 0; i < 3; i++) { addPart("plugs", cyl(0.035, 0.18, 8), [1.2 + i * 0.25, 1.1, 0.22], null, AMBER); addPart("plugs", cyl(0.035, 0.18, 8), [1.2 + i * 0.25, 1.1, -0.22], null, AMBER); }
  addPart("batt", new THREE.BoxGeometry(0.32, 0.26, 0.22), [1.7, 0.86, 0.62], null, 0x5dffa8);
  addPart("oil", cyl(0.08, 0.16), [1.15, 0.5, -0.32], null, AMBER);
  addPart("airf", new THREE.BoxGeometry(0.42, 0.12, 0.3), [1.55, 1.1, -0.56], null, 0x9ad7ff);
  addPart("rad", new THREE.BoxGeometry(0.07, 0.48, 1.25), [2.1, 0.68, 0], null, 0x4f8cff);
  addPart("alt", cyl(0.1, 0.16), [1.9, 0.95, 0.3], RX, 0xffd166);
  addPart("trans", new THREE.CylinderGeometry(0.22, 0.16, 0.7, 16), [0.68, 0.6, 0], RZ, 0x2aa8c8);
  addPart("cabin", new THREE.BoxGeometry(0.3, 0.06, 0.26), [0.8, 0.92, 0.42], null, 0x9ad7ff);
  addPart("exhaust", new THREE.BoxGeometry(0.45, 0.16, 0.22), [0.0, 0.33, 0.3], null, CORAL);
  addPart("exhaust", cyl(0.045, 2.1, 10), [-1.25, 0.33, 0.35], RZ, CORAL);
  [-0.84, 0.84].forEach(function (z) {
    addPart("lights", new THREE.BoxGeometry(0.1, 0.12, 0.3), [2.24, 0.8, z * 0.82], null, 0xffffff);
    addPart("wipers", new THREE.BoxGeometry(0.03, 0.03, 0.62), [0.88, 1.12, z * 0.42], [0, 0, 0.3], 0x9ad7ff);
  });
  [[1.45, 1], [1.45, -1], [-1.45, 1], [-1.45, -1]].forEach(function (w) {
    const x = w[0], s = w[1];
    addPart("tires", new THREE.TorusGeometry(0.31, 0.11, 12, 32), [x, 0.42, s * 0.86], null, 0x1d3a55);
    addPart(x > 0 ? "brakesF" : "brakesR", cyl(0.22, 0.05, 28), [x, 0.42, s * 0.74], RX, CORAL);
    addPart("struts", cyl(0.05, 0.55, 10), [x, 0.85, s * 0.66], null, 0x9b8cff);
  });

  // detailed engine bay. Each piece has a rest position and an "exploded" offset (engine-local coordinates):
  // the crankshaft runs along z, the front bank faces the radiator (+x), accessory belt at +z, timing belt at -z.
  let engine = null, bayPick = [], bayDecor = [], bayMeshes = {}, BAY = [];
  function buildEngine() {
    if (engine) {
      car.remove(engine);
      engine.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    }
    engine = new THREE.Group(); engine.position.set(1.45, 0.78, 0); engine.visible = false; car.add(engine);
    bayPick = []; bayDecor = []; bayMeshes = {};
    if (isElectric(vehicle)) { BAY = []; return; }
    function bay(id, geo, rest, ex, rot, color) {
      const m = makePart(id, geo, rot, color);
      m.userData.rest = new THREE.Vector3().fromArray(rest);
      m.userData.ex = new THREE.Vector3().fromArray(ex);
      m.position.copy(m.userData.rest);
      engine.add(m);
      if (id) { bayPick.push(m); (bayMeshes[id] = bayMeshes[id] || []).push(m); } else bayDecor.push(m);
    }
    const tube = (pts, r) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3().fromArray(p))), 24, r, 8);
    const BLOCK = 0x2aa8c8, METAL = 0x7fb6d6;
    // V engines get two banks; inline engines one upright bank
    const cylinders = Math.max(3, Math.min(12, parseInt(vehicle.cylinders, 10) || 6));
    const banks = cylinders >= 6 ? [-1, 1] : [0];
    const perBank = Math.ceil(cylinders / banks.length);
    const zs = Array.from({ length: perBank }, (_, i) => perBank === 1 ? 0 : -0.21 + (0.42 * i) / (perBank - 1));
    // block, heads, oil pan and mounts all count as "engine" (engine mounts)
    bay("engine", new THREE.BoxGeometry(0.56, 0.4, 0.64), [0, 0, 0], [0, 0, 0], null, BLOCK);
    bay("engine", new THREE.BoxGeometry(0.5, 0.08, 0.58), [0, -0.25, 0], [0, -0.08, 0], null, 0x1f7f99);
    [-1, 1].forEach(function (s) { bay("engine", new THREE.BoxGeometry(0.1, 0.08, 0.1), [0, -0.12, s * 0.38], [0, -0.1, s * 0.12], null, 0x9b8cff); });
    banks.forEach(function (s) {
      const x = s * 0.2, tilt = -s * 0.3;
      bay("engine", new THREE.BoxGeometry(s ? 0.2 : 0.3, 0.12, 0.56), [s * 0.17, 0.24, 0], [s * 0.04, 0.05, 0], [0, 0, tilt], BLOCK);
      bay("vcg", new THREE.BoxGeometry(s ? 0.19 : 0.28, 0.04, 0.54), [x, 0.32, 0], [s * 0.12, 0.26, 0], [0, 0, tilt], 0x9ad7ff);
      zs.forEach(function (z) {
        bay("coils", new THREE.BoxGeometry(0.05, 0.1, 0.05), [x, 0.38, z], [s * 0.2, 0.52, 0], null, 0xffd166);
        bay("plugs", cyl(0.018, 0.13, 8), [x, 0.3, z], [s * 0.3, 0.8, 0], null, AMBER);
      });
    });
    const back = banks.length > 1 ? -0.2 : -0.1;
    bay("pcv", cyl(0.02, 0.06, 10), [back, 0.36, 0.22], [-0.28, 0.4, 0.22], null, 0xff8fa3);
    bay(null, new THREE.BoxGeometry(0.14, 0.1, 0.5), banks.length > 1 ? [0, 0.34, 0] : [-0.26, 0.2, 0], [0, 0.12, 0], null, METAL); // intake manifold
    bay("tbody", cyl(0.06, 0.08), [0, 0.34, -0.3], [0, 0.26, -0.36], RX, 0x9ad7ff);
    bay("airf", new THREE.BoxGeometry(0.26, 0.12, 0.22), [0.3, 0.3, -0.55], [0.25, 0.3, -0.22], null, 0x9ad7ff);
    // accessory drive at +z
    bay("belt", new THREE.TorusGeometry(0.19, 0.012, 6, 48), [0.01, 0.03, 0.37], [0, 0, 0.58], null, 0xe8eefb);
    bay(null, cyl(0.08, 0.04), [0, -0.1, 0.34], [0, 0, 0.36], RX, METAL); // crank pulley
    bay("alt", cyl(0.07, 0.14), [0.15, 0.13, 0.31], [0.24, 0.22, 0.38], RX, 0xffd166);
    bay("wpump", cyl(0.055, 0.08), [-0.13, 0.1, 0.33], [-0.24, 0.16, 0.38], RX, 0x4f8cff);
    // timing belt at -z
    bay("tbelt", new THREE.TorusGeometry(0.2, 0.014, 6, 48), [0, 0.08, -0.36], [0, -0.08, -0.5], null, 0xff8fa3);
    // cooling
    bay("thermo", cyl(0.035, 0.06, 16), [0.22, 0.2, 0.2], [0.26, 0.24, 0.16], null, 0x4f8cff);
    bay("hoses", tube([[0.22, 0.2, 0.22], [0.42, 0.26, 0.34], [0.62, 0.14, 0.44]], 0.022), [0, 0, 0], [0.22, 0.04, 0.24], null, 0x1d6fb8);
    bay("hoses", tube([[-0.05, -0.16, 0.3], [0.3, -0.26, 0.42], [0.62, -0.2, 0.44]], 0.022), [0, 0, 0], [0.22, -0.04, 0.24], null, 0x1d6fb8);
    bay("rad", new THREE.BoxGeometry(0.06, 0.46, 1.1), [0.66, -0.05, 0], [0.5, 0, 0], null, 0x4f8cff);
    // underside and electrical
    bay("oil", cyl(0.05, 0.1), [0.3, -0.16, -0.15], [0.32, -0.16, -0.12], [0, 0, 0.5], AMBER);
    bay(null, cyl(0.035, 0.5, 12), [0.32, -0.02, 0], [0.12, -0.04, 0], RX, CORAL); // exhaust manifold
    bay("o2", cyl(0.018, 0.1, 8), [0.36, -0.08, 0.12], [0.38, -0.28, 0.12], RZ, CORAL);
    bay("starter", cyl(0.05, 0.18), [-0.32, -0.15, -0.2], [-0.32, -0.16, -0.14], RZ, 0xffd166);
    bay("batt", new THREE.BoxGeometry(0.3, 0.24, 0.2), [0.35, 0.05, 0.62], [0.18, 0.24, 0.24], null, 0x5dffa8);
    BAY = PARTS.filter((p) => p.bay && bayMeshes[p.id]);
  }

  // scanning plane + dust
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.9), fadeable(new THREE.MeshBasicMaterial({ color: HOLO, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false })));
  scan.rotation.y = Math.PI / 2; scan.position.y = 0.95; car.add(scan);
  const pts = [];
  for (let k = 0; k < 500; k++) pts.push((Math.random() - 0.5) * 14, Math.random() * 5, (Math.random() - 0.5) * 14);
  const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  const dust = new THREE.Points(pg, new THREE.PointsMaterial({ color: HOLO, size: 0.025, transparent: true, opacity: 0.6 }));
  scene.add(dust);

  /* ---- overlay: labels, strip, panel, breadcrumbs ---- */
  let mode = "car", partId = null, selected = null, labels = [];
  function buildLabels() {
    labelsEl.querySelectorAll(".holo-dot, .holo-chip").forEach((n) => n.remove());
    linesEl.innerHTML = "";
    labels = BAY.map(function (p) {
      const dot = document.createElement("span"); dot.className = "holo-dot";
      const chip = document.createElement("button"); chip.type = "button"; chip.className = "holo-chip"; chip.tabIndex = -1;
      chip.textContent = p.name; chip.dataset.id = p.id;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      labelsEl.appendChild(dot); labelsEl.appendChild(chip); linesEl.appendChild(line);
      return { id: p.id, dot, chip, line, w: 0, h: 0 };
    });
    strip.innerHTML = BAY.map((p) => '<button type="button" data-id="' + p.id + '">' + esc(p.name) + "</button>").join("");
  }
  labelsEl.addEventListener("click", function (e) { const c = e.target.closest(".holo-chip"); if (c) openPart(c.dataset.id); });
  strip.addEventListener("click", function (e) { const b = e.target.closest("button"); if (b) openPart(b.dataset.id, true); });

  function renderPanel(p) {
    const save = Math.max(0, p.shop - p.diy);
    panel.innerHTML =
      '<button type="button" class="back" data-back>‹ Engine bay</button>' +
      '<h3 tabindex="-1">' + esc(p.name) + "</h3>" +
      '<div class="sys">' + esc(p.sys) + " · fits " + esc(carLabel(vehicle)) + (vehicle.engine ? " " + esc(vehicle.engine) : "") + "</div>" +
      tiers(p) +
      '<div class="buy">' + buyLinks(p, vehicle, { primary: "holo-btn warm holo-buy-main", secondary: "holo-btn ghost" }) + "</div>" +
      '<div class="minis">' +
        '<div><span class="hud">Service</span><br>' + esc(p.every) + "</div>" +
        '<div><span class="hud">DIY</span><br>' + wrenches(p.diff) + "</div>" +
        '<div><span class="hud">You save</span><br><span class="save">' + money(save) + "</span></div>" +
      "</div>" +
      "<p>" + esc(p.tip) + "</p>";
  }
  panel.addEventListener("click", function (e) { if (e.target.closest("[data-back]")) setMode("bay"); });

  function renderUI() {
    root.dataset.mode = mode;
    $("[data-car]").textContent = carLabel(vehicle);
    let h = '<button type="button" data-go="car">Whole car</button>';
    if (mode !== "car") h += "<span>›</span>" + (mode === "bay" ? '<span class="here">Engine bay</span>' : '<button type="button" data-go="bay">Engine bay</button>');
    if (mode === "part") h += '<span>›</span><span class="here">' + esc(byId[partId].name) + "</span>";
    crumbs.innerHTML = mode === "car" ? "" : h;
    bayBtn.hidden = demo || mode !== "car" || !BAY.length;
    strip.hidden = demo || mode !== "bay";
    panel.hidden = mode !== "part";
    hint.textContent = mode === "car" ? (BAY.length ? "Drag to orbit · Tap the engine" : "Drag to orbit") : "Drag to orbit · Esc to go back";
    labels.forEach((l) => l.chip.classList.toggle("on", l.id === partId));
  }
  crumbs.addEventListener("click", function (e) { const b = e.target.closest("[data-go]"); if (b) setMode(b.dataset.go); });
  bayBtn.addEventListener("click", function () { setMode("bay"); });
  function onKey(e) {
    if (demo || e.key !== "Escape" || mode === "car") return;
    const r = root.getBoundingClientRect(); if (r.bottom < 0 || r.top > window.innerHeight) return;
    setMode(mode === "part" ? "bay" : "car");
  }
  document.addEventListener("keydown", onKey);

  /* ---- camera flights ---- */
  const narrow = () => root.clientWidth < 560;
  function goal(m, id) {
    if (m === "car") return { t: CAR_T.clone(), p: CAR_T.clone().addScaledVector(CAR_DIR, narrow() ? 9.6 : 8.4) };
    if (m === "bay") return { t: BAY_T.clone(), p: BAY_T.clone().addScaledVector(BAY_DIR, narrow() ? 5.4 : 4.4) };
    // part: frame the exploded piece(s), keeping roughly the current viewing angle
    const box = new THREE.Box3();
    car.updateMatrixWorld(true);
    bayMeshes[id].forEach(function (m) {
      const saved = m.position.clone();
      m.position.copy(m.userData.rest).add(m.userData.ex); m.updateMatrixWorld(true);
      box.expandByObject(m);
      m.position.copy(saved); m.updateMatrixWorld(true);
    });
    const c = box.getCenter(new THREE.Vector3()), r = box.getSize(new THREE.Vector3()).length() / 2;
    const dir = camera.position.clone().sub(controls.target).normalize();
    dir.y = Math.max(dir.y, 0.4); dir.normalize();
    const d = Math.min(3.2, Math.max(1.5, r * 6)) * (narrow() ? 1.3 : 1);
    return { t: c, p: c.clone().addScaledVector(dir, d) };
  }
  const clock = new THREE.Clock();
  let flight = null;
  function fly(g, instant) {
    if (reduce || instant) { flight = null; camera.position.copy(g.p); controls.target.copy(g.t); return; }
    flight = { p0: camera.position.clone(), t0: controls.target.clone(), p1: g.p, t1: g.t, start: clock.getElapsedTime(), dur: 1.25 };
    controls.enabled = false;
  }
  const ease = (k) => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;

  // shift the rendered view so the part isn't hidden behind the panel
  let shift = { x: 0, y: 0 }, shiftGoal = { x: 0, y: 0 };
  function updateShift() {
    shiftGoal = { x: 0, y: 0 };
    if (mode !== "part") return;
    if (root.classList.contains("is-stacked")) shiftGoal.y = (panel.offsetHeight + 10) / 2;
    else shiftGoal.x = (panel.offsetWidth + 14) / 2;
  }

  function setMode(m, id, focusPanel) {
    if (m !== "car" && !BAY.length) return;
    if (m === "part" && !bayMeshes[id]) return;
    mode = m; partId = m === "part" ? id : null;
    controls.autoRotate = !reduce && m !== "part"; controls.autoRotateSpeed = m === "bay" ? 0.35 : 0.7;
    if (m === "part") renderPanel(byId[id]);
    renderUI();
    resize(true);
    if (m === "part" && focusPanel) panel.querySelector("h3").focus({ preventScroll: true });
    updateShift();
    fly(goal(m, id));
  }
  function openPart(id, focusPanel) { selected = id; onSelect(id); setMode("part", id, focusPanel); }

  /* ---- picking ---- */
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
  let hoverId = null, downAt = null;
  function pick(ev) {
    const r = canvas.getBoundingClientRect();
    mouse.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    mouse.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
    ray.setFromCamera(mouse, camera);
    const hit = ray.intersectObjects(mode === "car" ? pickables : bayPick, false)[0];
    return hit ? { id: hit.object.userData.id, x: ev.clientX - r.left, y: ev.clientY - r.top } : null;
  }
  function tipText(id) {
    if (mode !== "car" || !byId[id].bay || !BAY.length) return byId[id].name;
    return id === "engine" ? "Engine · open the bay" : byId[id].name + " · open the bay";
  }
  canvas.addEventListener("pointermove", function (ev) {
    if (demo) return;
    const h = pick(ev); hoverId = h ? h.id : null;
    if (h) { tip.hidden = false; tip.textContent = tipText(h.id); tip.style.left = h.x + "px"; tip.style.top = h.y + "px"; canvas.style.cursor = "pointer"; }
    else { tip.hidden = true; canvas.style.cursor = "crosshair"; }
  });
  canvas.addEventListener("pointerleave", function () { hoverId = null; tip.hidden = true; });
  canvas.addEventListener("pointerdown", function (ev) { downAt = [ev.clientX, ev.clientY]; });
  canvas.addEventListener("pointerup", function (ev) {
    if (demo || !downAt || Math.hypot(ev.clientX - downAt[0], ev.clientY - downAt[1]) > 6) return;
    const h = pick(ev); if (!h) return;
    tip.hidden = true;
    if (mode === "car") { selected = h.id; onSelect(h.id); if (byId[h.id].bay) setMode("bay"); }
    else openPart(h.id);
  });

  // keepCamera: the caller is about to fly somewhere itself, so don't snap the camera first.
  function resize(keepCamera) {
    const w = root.clientWidth, h = root.clientHeight;
    root.classList.toggle("is-stacked", w < 700);
    root.classList.toggle("is-narrow", w < 560);
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.updateProjectionMatrix();
    updateShift();
    if (!flight && keepCamera !== true) fly(goal(mode, partId), true);
  }
  const ro = new ResizeObserver(() => resize());
  ro.observe(root);

  /* ---- labels: project each bay part to the screen, then nudge chips so they don't overlap ---- */
  function screenPoint(id) {
    const meshes = mode === "car" ? pickables.filter((m) => m.userData.id === id) : bayMeshes[id] || [];
    const v = new THREE.Vector3();
    meshes.forEach((m) => v.add(m.getWorldPosition(new THREE.Vector3())));
    v.divideScalar(Math.max(1, meshes.length)).project(camera);
    return { x: (v.x + 1) / 2 * root.clientWidth, y: (1 - v.y) / 2 * root.clientHeight, z: v.z };
  }
  function placeLabels(show) {
    labelsEl.style.opacity = show ? 1 : 0;
    if (!show) return;
    const w = root.clientWidth, placed = [];
    labels.map((l) => Object.assign({ l }, screenPoint(l.id))).sort((a, b) => a.y - b.y).forEach(function (it) {
      const l = it.l;
      if (!l.w) { l.w = l.chip.offsetWidth; l.h = l.chip.offsetHeight; }
      const left = it.x > w * 0.62;
      let cx = Math.max(4, Math.min(w - l.w - 4, left ? it.x - 14 - l.w : it.x + 14)), cy = it.y - l.h / 2;
      for (let n = 0; n < 12 && placed.some((r) => cx < r.x + r.w && cx + l.w > r.x && cy < r.y + r.h + 2 && cy + l.h + 2 > r.y); n++) cy += l.h + 3;
      placed.push({ x: cx, y: cy, w: l.w, h: l.h });
      const hide = it.z > 1;
      l.dot.style.display = l.chip.style.display = hide ? "none" : "";
      l.dot.style.transform = "translate(" + it.x + "px," + it.y + "px)";
      l.chip.style.transform = "translate(" + cx + "px," + cy + "px)";
      l.line.setAttribute("x1", it.x); l.line.setAttribute("y1", it.y);
      l.line.setAttribute("x2", left ? cx + l.w : cx); l.line.setAttribute("y2", cy + l.h / 2);
    });
  }

  /* ---- render loop ---- */
  let carVis = 1, bayVis = 0, explode = 0, last = 0, raf = 0, onScreen = true;
  const io = new IntersectionObserver((e) => { onScreen = e[0].isIntersecting; });
  io.observe(root);
  const approach = (v, g, dt, speed) => v + (g - v) * Math.min(1, dt * speed);
  function paint(m, vis, on, hov, t) {
    m.visible = vis > 0.02;
    m.material.emissive.setHex(on ? AMBER : m.userData.base);
    m.material.color.setHex(on ? AMBER : m.userData.base);
    m.material.emissiveIntensity = on ? (mode === "part" ? 0.7 : 1.1) + (reduce ? 0 : Math.sin(t * 5) * 0.3) : hov ? 1.0 : 0.5;
    m.material.opacity = (on || hov ? 0.95 : 0.7) * vis;
    m.children[0].material.opacity = 0.35 * vis;
  }
  function loop() {
    raf = requestAnimationFrame(loop);
    const t = clock.getElapsedTime(), dt = Math.min(0.1, t - last); last = t;
    if (!onScreen) return;
    const inBay = mode !== "car";
    carVis = reduce ? (inBay ? 0.12 : 1) : approach(carVis, inBay ? 0.12 : 1, dt, 3);
    bayVis = reduce ? (inBay ? 1 : 0) : approach(bayVis, inBay ? 1 : 0, dt, 3);
    explode = reduce ? (inBay ? 1 : 0) : approach(explode, inBay ? 1 : 0, dt, 2.2);

    scan.position.x = reduce ? 0 : Math.sin(t * 0.8) * 2.2;
    rings[1].rotation.z = reduce ? 0 : t * 0.4; rings[2].rotation.z = reduce ? 0 : -t * 0.15;
    if (!reduce) dust.rotation.y = t * 0.02;
    shellMats.forEach((s) => { s.m.opacity = s.base * carVis; });
    pickables.forEach(function (m) {
      const id = m.userData.id, swap = m.userData.inBay && BAY.length;
      paint(m, swap ? 1 - bayVis : Math.max(0.08, carVis), mode === "car" && id === selected, mode === "car" && id === hoverId, t);
    });
    engine.visible = bayVis > 0.02;
    bayPick.forEach(function (m) {
      const id = m.userData.id, on = mode === "part" ? id === partId : id === hoverId;
      m.position.copy(m.userData.rest).addScaledVector(m.userData.ex, explode);
      paint(m, bayVis * (mode === "part" && !on ? 0.22 : 1), mode === "part" && on, mode === "bay" && on, t);
    });
    bayDecor.forEach(function (m) { m.position.copy(m.userData.rest).addScaledVector(m.userData.ex, explode); paint(m, bayVis * (mode === "part" ? 0.12 : 0.5), false, false, t); });

    if (flight) {
      const k = ease(Math.min(1, (t - flight.start) / flight.dur));
      camera.position.lerpVectors(flight.p0, flight.p1, k);
      controls.target.lerpVectors(flight.t0, flight.t1, k);
      if (k >= 1) { flight = null; controls.enabled = true; }
    }
    shift.x = reduce ? shiftGoal.x : approach(shift.x, shiftGoal.x, dt, 4);
    shift.y = reduce ? shiftGoal.y : approach(shift.y, shiftGoal.y, dt, 4);
    const w = root.clientWidth, h = root.clientHeight;
    if (Math.abs(shift.x) + Math.abs(shift.y) > 0.5) camera.setViewOffset(w, h, shift.x, shift.y, w, h);
    else camera.clearViewOffset();
    if (flight) camera.lookAt(controls.target); else controls.update();
    renderer.render(scene, camera);
    placeLabels(mode === "bay" && !flight && bayVis > 0.9);
  }

  /* ---- demo tour (landing page) ---- */
  let tour = null;
  const cursor = $(".holo-cursor"), caption = $(".holo-caption"), pauseBtn = $(".holo-pause");
  function sleep(token, ms) {
    return new Promise(function (resolve, reject) {
      const id = setTimeout(function () { token.stopped ? reject(token) : resolve(); }, reduce ? Math.max(ms, 1200) : ms);
      token.timers.push(id);
    });
  }
  async function moveCursor(token, p) {
    cursor.style.opacity = 1;
    cursor.style.transform = "translate(" + p.x + "px," + p.y + "px)";
    await sleep(token, 950);
    cursor.classList.remove("tap"); void cursor.offsetWidth; cursor.classList.add("tap");
    await sleep(token, 250);
  }
  function say(step, title, text) {
    caption.querySelector("b").textContent = step;
    caption.querySelector("strong").textContent = title;
    caption.querySelector("span").textContent = text;
  }
  function elementPoint(el) {
    const a = el.getBoundingClientRect(), b = root.getBoundingClientRect();
    return { x: a.left - b.left + a.width / 2, y: a.top - b.top + a.height / 2 };
  }
  async function runTour(token) {
    let n = 0;
    cursor.style.transform = "translate(" + root.clientWidth * 0.75 + "px," + root.clientHeight * 0.85 + "px)";
    for (;;) {
      setMode("car");
      say("01 / Scan", "Decode any VIN", "Vinsight maps your exact car in 3D.");
      await sleep(token, 2600);
      await moveCursor(token, screenPoint("engine"));
      setMode("bay");
      say("02 / Explore", "Open the engine bay", BAY.length + " engine parts, pulled apart and labeled.");
      await sleep(token, 3600);
      const id = TOUR[n++ % TOUR.length];
      await moveCursor(token, screenPoint(id));
      openPart(id);
      say("03 / Price", "Compare every price", "Economy, OE-quality and genuine OEM for " + byId[id].name.toLowerCase() + ".");
      await sleep(token, 3000);
      const buy = panel.querySelector(".holo-buy-main");
      await moveCursor(token, elementPoint(buy));
      buy.classList.add("pressed");
      say("04 / Order", "Order the cheapest fit", "Live listings for your year, make, model and engine.");
      await sleep(token, 2800);
      setMode("bay");
      await sleep(token, 1800);
    }
  }
  function play() {
    if (!demo || tour) return;
    tour = { stopped: false, timers: [] };
    pauseBtn.textContent = "❚❚ Pause demo";
    caption.style.opacity = 1;
    runTour(tour).catch(function () {});
  }
  function pause() {
    if (!tour) return;
    tour.stopped = true; tour.timers.forEach(clearTimeout); tour = null;
    pauseBtn.textContent = "▶ Play demo";
  }
  if (demo) {
    pauseBtn.addEventListener("click", () => (tour ? pause() : play()));
    pauseBtn.textContent = "▶ Play demo";
    cursor.style.opacity = 0;
    say("Demo", "See it in action", "Press play for a quick tour.");
  }

  /* ---- public API ---- */
  function setVehicle(v) {
    const rebuild = String(v.cylinders || "") !== String(vehicle.cylinders || "") || isElectric(v) !== isElectric(vehicle);
    vehicle = Object.assign({}, v);
    if (rebuild) { if (mode !== "car") setMode("car"); buildEngine(); buildLabels(); }
    if (mode === "part") renderPanel(byId[partId]);
    renderUI();
  }
  function destroy() {
    pause();
    cancelAnimationFrame(raf);
    ro.disconnect(); io.disconnect();
    document.removeEventListener("keydown", onKey);
    controls.dispose();
    scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    renderer.dispose();
    root.innerHTML = "";
    root.classList.remove("holo", "is-demo", "is-stacked", "is-narrow");
  }

  buildEngine();
  buildLabels();
  resize();
  renderUI();
  loop();
  // A demo starts itself unless the viewer prefers reduced motion; then it waits for Play.
  if (demo && !reduce) play();
  return { setVehicle, destroy, play, pause };
}
