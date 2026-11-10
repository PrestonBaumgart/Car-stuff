// Vinsight 3D parts bay: whole car → exploded engine bay → inside the engine → one part with prices and order links.
// Shared by the landing page (as an auto-playing demo) and the app's car page (interactive).
// Plain JavaScript so the landing page can load it as a browser module through an import map.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { PARTS, byId, buyLinks, carLabel, esc, money, tiers, wrenches } from "./parts.js";
import { buildCar, buildEngine, buildGarage, repaint, setVisibility, styleFor } from "./car-model.js";

const CSS = `
.holo { position: relative; overflow: hidden; }
.holo [hidden] { display: none !important; }
.holo-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; cursor: crosshair; touch-action: pan-y; }
.holo.is-demo .holo-canvas, .holo.is-demo .holo-panel, .holo.is-demo .holo-panel *, .holo.is-demo .holo-crumbs * { pointer-events: none !important; }
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
.holo-actions { position: absolute; right: 14px; bottom: 12px; z-index: 4; display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
.holo-actions[hidden], .holo-actions [hidden] { display: none; }
.holo-cartoggle { position: absolute; right: 14px; top: 40px; z-index: 4; font-family: var(--f-hud, ui-monospace, monospace); text-transform: uppercase; font-size: 12px; letter-spacing: .12em; background: rgba(3,6,12,.8); border: 1px solid var(--line); color: var(--holo); padding: 5px 9px; cursor: pointer; }
.holo-cartoggle:hover { border-color: var(--holo); }
.holo-cartoggle[aria-pressed="false"] { color: var(--steel); }
.holo-strip { position: absolute; left: 0; right: 0; bottom: 0; z-index: 4; display: flex; gap: 6px; overflow-x: auto; padding: 18px 14px 12px; background: linear-gradient(transparent, rgba(7,11,20,.92) 45%); scrollbar-width: thin; }
.holo-strip button { flex: none; font-size: 12px; letter-spacing: .08em; background: var(--bay-2, #0d1424); border: 1px solid var(--line); color: var(--ink); padding: 7px 10px; cursor: pointer; }
.holo-strip button:hover, .holo-strip button:focus-visible { border-color: var(--amber); color: var(--amber); }
.holo-strip button.go { background: var(--amber); border-color: var(--amber); color: #021018; font-weight: 600; }
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

const AMBER = 0xffb02e;
const CAR_T = new THREE.Vector3(0.1, 0.7, 0);
const CAR_DIR = new THREE.Vector3(5.4, 3.1, 5.6).sub(CAR_T).normalize();
const BAY_DIR = new THREE.Vector3(1.0, 0.9, 0.8).normalize();
const INSIDE_DIR = new THREE.Vector3(1.0, 0.5, 0.75).normalize();
const TOUR = ["alt", "plugs", "batt", "coils", "rad", "wpump", "thermo"];
const INSIDE_TOUR = ["pistons", "rings", "crank", "cam", "valves", "rods", "hgasket"];

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
 * options.vehicle: { year, make, model, trim, engine, cylinders, fuel, bodyClass }
 * options.demo: play a looping guided tour instead of taking input.
 * options.onSelect(id): called when the viewer opens a part.
 * options.paint: body color, a hex number or "#rrggbb" (change it later with setPaint).
 */
export function createHologram(root, options = {}) {
  const demo = !!options.demo;
  const onSelect = options.onSelect || function () {};
  let vehicle = Object.assign({}, options.vehicle);
  let paint = options.paint || 0x1f3f78;
  injectCss();
  root.classList.add("holo");
  root.classList.toggle("is-demo", demo);
  root.innerHTML =
    '<canvas class="holo-canvas"></canvas>' +
    '<div class="holo-hud"><span>Scan <span class="v" data-car></span></span><span><span class="v">' + PARTS.length + "</span> parts mapped</span></div>" +
    '<nav class="holo-crumbs" aria-label="3D view"></nav>' +
    '<div class="holo-hint"></div>' +
    '<div class="holo-actions"><button type="button" class="holo-btn warm holo-insidebtn">Inside the engine ›</button><button type="button" class="holo-btn holo-baybtn">Open engine bay</button></div>' +
    '<button type="button" class="holo-cartoggle" aria-pressed="true" hidden>Car: shown</button>' +
    '<div class="holo-strip" role="group" aria-label="Engine bay parts" hidden></div>' +
    '<aside class="holo-panel" aria-label="Part details" hidden></aside>' +
    '<div class="holo-tip" hidden></div>' +
    '<span class="holo-corner tl"></span><span class="holo-corner tr"></span><span class="holo-corner bl"></span><span class="holo-corner br"></span>' +
    (demo ? '<div class="holo-cursor" aria-hidden="true">' + CURSOR + '</div><div class="holo-caption" aria-hidden="true"><b></b><strong></strong><span></span></div><button type="button" class="holo-pause"></button>' : "");
  const $ = (s) => root.querySelector(s);
  const canvas = $(".holo-canvas"), crumbs = $(".holo-crumbs"), hint = $(".holo-hint"), bayBtn = $(".holo-baybtn"), insideBtn = $(".holo-insidebtn"), actions = $(".holo-actions");
  const strip = $(".holo-strip"), panel = $(".holo-panel"), tip = $(".holo-tip"), carToggle = $(".holo-cartoggle");
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
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.copy(CAR_T).addScaledVector(CAR_DIR, 8.4);
  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(CAR_T);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.enablePan = false; controls.enableZoom = false;
  controls.enableRotate = !demo;
  controls.minPolarAngle = 0.35; controls.maxPolarAngle = 1.45;
  controls.autoRotate = !reduce; controls.autoRotateSpeed = 0.7;

  const env = buildGarage(scene, renderer);
  function disposeTree(o) {
    o.traverse(function (n) { if (n.geometry) n.geometry.dispose(); if (n.material) [].concat(n.material).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); }); });
  }

  // the car body, rebuilt when the body style changes
  let car = null, bodyParts = [], pickables = [], style = null, bayTarget = new THREE.Vector3();
  function buildBody() {
    if (car) { scene.remove(car); disposeTree(car); }
    style = styleFor(vehicle.bodyClass || vehicle.body);
    const built = buildCar({ style });
    repaint(built.group, paint);
    car = built.group; bodyParts = built.body; pickables = built.parts;
    bayTarget = built.engineAt.clone().add(new THREE.Vector3(0.3, 0.3, 0));
    car.userData.engineAt = built.engineAt;
    scene.add(car);
  }

  // the engine bay and its internals, rebuilt with the body or when the engine changes
  let engine = null, bayPick = [], bayDecor = [], insidePick = [], partMeshes = {}, BAY = [], INSIDE = [];
  function buildBay() {
    if (engine && engine.parent) engine.parent.remove(engine);
    if (engine) disposeTree(engine);
    bayPick = []; bayDecor = []; insidePick = []; partMeshes = {}; BAY = []; INSIDE = [];
    engine = new THREE.Group();
    if (!isElectric(vehicle)) {
      const e = buildEngine({ cylinders: vehicle.cylinders, year: vehicle.year });
      engine = e.group; bayPick = e.parts; bayDecor = e.decor; insidePick = e.inside;
      bayPick.concat(insidePick).forEach((o) => { (partMeshes[o.userData.id] = partMeshes[o.userData.id] || []).push(o); });
      BAY = PARTS.filter((p) => p.bay && partMeshes[p.id]);
      INSIDE = PARTS.filter((p) => p.inside && partMeshes[p.id]);
    }
    engine.position.copy(car.userData.engineAt); engine.visible = false; car.add(engine);
  }

  /* ---- overlay: strip, panel, breadcrumbs, car toggle ---- */
  // mode: "car" | "bay" | "inside" | "part". A part opens from the bay or from inside the engine (its level).
  let mode = "car", partId = null, selected = null, showCar = true;
  const levelOf = (id) => (byId[id] && byId[id].inside ? "inside" : "bay");
  const LEVEL_NAME = { bay: "Engine bay", inside: "Inside the engine" };
  function renderStrip() {
    if (mode === "bay") {
      strip.setAttribute("aria-label", "Engine bay parts");
      strip.innerHTML = (INSIDE.length ? '<button type="button" class="go" data-go="inside">Inside the engine ›</button>' : "") +
        BAY.map((p) => '<button type="button" data-id="' + p.id + '">' + esc(p.name) + "</button>").join("");
    } else if (mode === "inside") {
      strip.setAttribute("aria-label", "Engine internals");
      strip.innerHTML = INSIDE.map((p) => '<button type="button" data-id="' + p.id + '">' + esc(p.name) + "</button>").join("");
    }
  }
  strip.addEventListener("click", function (e) {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.go) setMode(b.dataset.go); else openPart(b.dataset.id, true);
  });
  carToggle.addEventListener("click", function () { showCar = !showCar; renderUI(); });

  function renderPanel(p) {
    const save = Math.max(0, p.shop - p.diy);
    panel.innerHTML =
      '<button type="button" class="back" data-back>‹ ' + LEVEL_NAME[levelOf(p.id)] + "</button>" +
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
  panel.addEventListener("click", function (e) { if (e.target.closest("[data-back]")) setMode(levelOf(partId)); });

  function renderUI() {
    root.dataset.mode = mode;
    $("[data-car]").textContent = carLabel(vehicle);
    const level = mode === "part" ? levelOf(partId) : mode;
    const step = (key, label) => (mode === key ? '<span class="here">' + label + "</span>" : '<button type="button" data-go="' + key + '">' + label + "</button>");
    let h = step("car", "Whole car");
    if (mode !== "car") h += "<span>›</span>" + step("bay", "Engine bay");
    if (level === "inside") h += "<span>›</span>" + step("inside", "Inside the engine");
    if (mode === "part") h += '<span>›</span><span class="here">' + esc(byId[partId].name) + "</span>";
    crumbs.innerHTML = mode === "car" ? "" : h;
    bayBtn.hidden = !BAY.length;
    insideBtn.hidden = !INSIDE.length;
    actions.hidden = demo || mode !== "car" || (!BAY.length && !INSIDE.length);
    strip.hidden = demo || (mode !== "bay" && mode !== "inside");
    if (!strip.hidden) renderStrip();
    panel.hidden = mode !== "part";
    carToggle.hidden = demo || (mode !== "bay" && mode !== "inside");
    carToggle.setAttribute("aria-pressed", String(showCar));
    carToggle.textContent = showCar ? "Car: shown" : "Car: hidden";
    carToggle.title = showCar ? "Fade the car out" : "Show the car for reference";
    hint.textContent = mode === "car" ? (BAY.length ? "Drag to orbit · Tap the hood" : "Drag to orbit") : "Drag to orbit · Hover a part for its name · Esc to go back";
  }
  crumbs.addEventListener("click", function (e) { const b = e.target.closest("[data-go]"); if (b) setMode(b.dataset.go); });
  bayBtn.addEventListener("click", function () { setMode("bay"); });
  insideBtn.addEventListener("click", function () { setMode("inside"); });
  function onKey(e) {
    if (demo || e.key !== "Escape" || mode === "car") return;
    const r = root.getBoundingClientRect(); if (r.bottom < 0 || r.top > window.innerHeight) return;
    setMode(mode === "part" ? levelOf(partId) : mode === "inside" ? "bay" : "car");
  }
  document.addEventListener("keydown", onKey);

  /* ---- camera flights ---- */
  const narrow = () => root.clientWidth < 560;
  function goal(m, id) {
    if (m === "car") return { t: CAR_T.clone(), p: CAR_T.clone().addScaledVector(CAR_DIR, narrow() ? 9.6 : 8.4) };
    if (m === "bay") return { t: bayTarget.clone(), p: bayTarget.clone().addScaledVector(BAY_DIR, narrow() ? 5.4 : 4.4) };
    if (m === "inside") {
      const t = car.userData.engineAt.clone().add(new THREE.Vector3(0, 0.38, 0));
      return { t, p: t.clone().addScaledVector(INSIDE_DIR, narrow() ? 3.0 : 2.4) };
    }
    // part: frame the exploded piece(s), keeping roughly the current viewing angle
    const box = new THREE.Box3();
    car.updateMatrixWorld(true);
    partMeshes[id].forEach(function (m) {
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
    if (m === "inside" && !INSIDE.length) return;
    if (m === "part" && !partMeshes[id]) return;
    mode = m; partId = m === "part" ? id : null;
    tip.hidden = true; hoverId = null; // a name from the previous view shouldn't linger
    controls.autoRotate = !reduce && m !== "part"; controls.autoRotateSpeed = m === "car" ? 0.7 : 0.35;
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
    const level = mode === "part" ? levelOf(partId) : mode;
    const list = mode === "car" ? pickables.concat(bodyParts) : level === "inside" ? insidePick : bayPick.concat(bayDecor);
    const hit = ray.intersectObjects(list, true)[0];
    return hit && hit.object.userData.id ? { id: hit.object.userData.id, x: ev.clientX - r.left, y: ev.clientY - r.top } : null;
  }
  function tipText(id) {
    if (mode !== "car" || !byId[id].bay || !BAY.length) return byId[id].name;
    return id === "engine" ? "Hood · open the engine bay" : byId[id].name + " · open the bay";
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

  // where a part is on screen (the demo's cursor aims here)
  function screenPoint(id) {
    const meshes = mode === "car" ? pickables.filter((m) => m.userData.id === id) : partMeshes[id] || [];
    const v = new THREE.Vector3();
    meshes.forEach((m) => v.add(m.getWorldPosition(new THREE.Vector3())));
    v.divideScalar(Math.max(1, meshes.length)).project(camera);
    return { x: (v.x + 1) / 2 * root.clientWidth, y: (1 - v.y) / 2 * root.clientHeight };
  }

  /* ---- render loop ---- */
  let carVis = 1, bayVis = 0, explode = 0, insideVis = 0, insideExplode = 0, last = 0, raf = 0, onScreen = true;
  const io = new IntersectionObserver((e) => { onScreen = e[0].isIntersecting; });
  io.observe(root);
  const approach = (v, g, dt, speed) => v + (g - v) * Math.min(1, dt * speed);
  function loop() {
    raf = requestAnimationFrame(loop);
    const t = clock.getElapsedTime(), dt = Math.min(0.1, t - last); last = t;
    if (!onScreen) return;
    const level = mode === "part" ? levelOf(partId) : mode, focus = mode === "part";
    // The car ghosts out in the engine views (or disappears if the viewer hid it) and nearly vanishes behind a close-up.
    // Inside the engine the camera sits close, so the reference car stays fainter there.
    const carGoal = mode === "car" ? 1 : !showCar ? 0 : focus ? 0.025 : level === "inside" ? 0.05 : 0.14;
    const go = (v, g, speed) => (reduce ? g : approach(v, g, dt, speed));
    carVis = go(carVis, carGoal, 3);
    bayVis = go(bayVis, mode === "car" ? 0 : 1, 3);
    explode = go(explode, level === "bay" ? 1 : 0, 2.2);
    insideVis = go(insideVis, level === "inside" ? 1 : 0, 3);
    insideExplode = go(insideExplode, level === "inside" ? 1 : 0, 1.8);

    const pulse = reduce ? 0 : Math.sin(t * 5) * 0.12;
    bodyParts.forEach((o) => setVisibility(o, carVis, 0));
    pickables.forEach(function (o) {
      const id = o.userData.id, glow = mode !== "car" ? 0 : id === selected ? 0.45 + pulse : id === hoverId ? 0.3 : 0;
      setVisibility(o, id === "engine" ? 1 : carVis, glow, AMBER); // the hood target stays pickable (it's invisible)
    });
    engine.visible = bayVis > 0.02;
    // engine bay parts: shown in the bay; inside the engine only the block stays, as a see-through shell
    bayPick.forEach(function (o) {
      const id = o.userData.id, on = focus ? id === partId : id === hoverId;
      o.position.copy(o.userData.rest).addScaledVector(o.userData.ex, explode);
      const shell = id === "engine" ? 0.14 : 0;
      const vis = bayVis * ((1 - insideVis) * (focus && level === "bay" && !on ? 0.12 : 1) + insideVis * shell);
      setVisibility(o, vis, on && level === "bay" ? (focus ? 0.25 + pulse : 0.3) : 0, AMBER);
    });
    bayDecor.forEach(function (o) {
      o.position.copy(o.userData.rest).addScaledVector(o.userData.ex, explode);
      setVisibility(o, bayVis * (1 - insideVis) * (focus ? 0.1 : 1), 0);
    });
    insidePick.forEach(function (o) {
      const id = o.userData.id, on = focus ? id === partId : id === hoverId;
      o.position.copy(o.userData.rest).addScaledVector(o.userData.ex, insideExplode);
      setVisibility(o, bayVis * insideVis * (focus && !on ? 0.12 : 1), on && level === "inside" ? (focus ? 0.25 + pulse : 0.3) : 0, AMBER);
    });

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
  async function moveCursor(token, p, name) {
    tip.hidden = true;
    cursor.style.opacity = 1;
    cursor.style.transform = "translate(" + p.x + "px," + p.y + "px)";
    await sleep(token, 950);
    if (name) { tip.textContent = name; tip.style.left = p.x + "px"; tip.style.top = p.y + "px"; tip.hidden = false; await sleep(token, 700); }
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
      say("02 / Explore", "Open the engine bay", BAY.length + " engine parts, pulled apart. Hover any part for its name.");
      await sleep(token, 3400);
      const deep = n % 2 === 1 && INSIDE.length;
      if (deep) {
        await moveCursor(token, screenPoint("engine"), "Engine block");
        setMode("inside");
        say("03 / Go deeper", "Inside the engine", "Pistons, rings, rods, crankshaft, cams and valves.");
        await sleep(token, 3600);
      }
      const id = deep ? INSIDE_TOUR[Math.floor(n / 2) % INSIDE_TOUR.length] : TOUR[Math.floor(n / 2) % TOUR.length];
      n++;
      await moveCursor(token, screenPoint(id), byId[id].name);
      tip.hidden = true;
      openPart(id);
      say(deep ? "04 / Price" : "03 / Price", "Compare every price", "Economy, OE-quality and genuine OEM for " + byId[id].name.toLowerCase() + ".");
      await sleep(token, 3000);
      const buy = panel.querySelector(".holo-buy-main");
      await moveCursor(token, elementPoint(buy));
      buy.classList.add("pressed");
      say(deep ? "05 / Order" : "04 / Order", "Order the cheapest fit", "Live listings for your year, make, model and engine.");
      await sleep(token, 2800);
      setMode(deep ? "inside" : "bay");
      await sleep(token, 1600);
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
    const newStyle = styleFor(v.bodyClass || v.body) !== style;
    const newEngine = String(v.cylinders || "") !== String(vehicle.cylinders || "") || String(v.year || "") !== String(vehicle.year || "") || isElectric(v) !== isElectric(vehicle);
    vehicle = Object.assign({}, v);
    if (newStyle || newEngine) {
      if (mode !== "car") setMode("car");
      if (newStyle) buildBody();
      buildBay();
    }
    if (mode === "part") renderPanel(byId[partId]);
    renderUI();
  }
  function setPaint(color) {
    paint = color || 0x1f3f78;
    if (car) repaint(car, paint);
  }
  function destroy() {
    pause();
    cancelAnimationFrame(raf);
    ro.disconnect(); io.disconnect();
    document.removeEventListener("keydown", onKey);
    controls.dispose();
    disposeTree(scene);
    env.dispose();
    renderer.dispose();
    root.innerHTML = "";
    root.classList.remove("holo", "is-demo", "is-stacked", "is-narrow");
  }

  buildBody();
  buildBay();
  resize();
  renderUI();
  loop();
  // A demo starts itself unless the viewer prefers reduced motion; then it waits for Play.
  if (demo && !reduce) play();
  return { setVehicle, setPaint, destroy, play, pause };
}
