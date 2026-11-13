// Vinsight 3D parts bay: whole car, engine bay, inside the engine, underside (on a lift) and body & lights;
// tap any part for prices and order links.
// Shared by the landing page (as an auto-playing demo) and the app's car page (interactive).
// Plain JavaScript so the landing page can load it as a browser module through an import map.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { PARTS, byId, buyLinks, carLabel, esc, money, tiers, wrenches } from "./parts.js";
import { DEFAULTS, RATES, TIER_NAMES, quote, quoteLine } from "./quote.js";
import { dimsFor } from "./car-dims.js";
import { applyPartModels } from "./part-models.js";
import { applyEngineModels } from "./engine-models.js";
import { addBody, showCode } from "./body-model.js";
import { bodyFor, BODY_NOTE } from "./car-bodies.js";
import { buildCar, buildEngine, buildGarage, buildLift, repaint, setVisibility, styleFor } from "./car-model.js";

const CSS = `
.holo { position: relative; overflow: hidden; }
.holo [hidden] { display: none !important; }
.holo-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; cursor: crosshair; touch-action: pan-y; }
.holo.is-demo .holo-canvas, .holo.is-demo .holo-panel, .holo.is-demo .holo-panel *, .holo.is-demo .holo-top * { pointer-events: none !important; }
.holo-hud, .holo-hint, .holo-top, .holo-tip, .holo-chip, .holo-strip button, .holo-panel .back, .holo .hud, .holo-pause { font-family: var(--f-hud, ui-monospace, monospace); text-transform: uppercase; }
.holo-hud { position: absolute; left: 14px; top: 12px; right: 14px; display: flex; justify-content: space-between; gap: 10px; pointer-events: none; z-index: 2; letter-spacing: .14em; font-size: 12px; color: var(--steel); }
.holo-hud .v { color: var(--holo); }
.holo.is-narrow .holo-hud > span:last-child { display: none; }
.holo-corner { position: absolute; width: 34px; height: 34px; border: 2px solid var(--holo); pointer-events: none; opacity: .8; z-index: 2; }
.holo-corner.tl { top: 0; left: 0; border-right: 0; border-bottom: 0; }
.holo-corner.tr { top: 0; right: 0; border-left: 0; border-bottom: 0; }
.holo-corner.bl { bottom: 0; left: 0; border-right: 0; border-top: 0; }
.holo-corner.br { bottom: 0; right: 0; border-left: 0; border-top: 0; }
.holo-note { position: absolute; left: 14px; bottom: 32px; pointer-events: none; z-index: 2; color: var(--steel); letter-spacing: .1em; font-size: 11px; }
.holo-hint { position: absolute; left: 14px; bottom: 12px; right: 14px; pointer-events: none; color: var(--holo); z-index: 2; letter-spacing: .14em; font-size: 12px; }
.holo[data-mode="bay"] .holo-hint, .holo[data-mode="inside"] .holo-hint, .holo[data-mode="under"] .holo-hint, .holo[data-mode="body"] .holo-hint, .holo.is-demo .holo-hint { display: none; }
.holo-tip { position: absolute; pointer-events: none; z-index: 7; padding: 4px 8px; background: rgba(3,6,12,.9); border: 1px solid var(--holo); color: var(--holo); font-size: 12px; letter-spacing: .1em; white-space: nowrap; transform: translate(12px, -50%); }
.holo-btn { font-family: var(--f-hud, ui-monospace, monospace); font-weight: 600; text-transform: uppercase; letter-spacing: .12em; font-size: 13px; padding: 11px 16px; border: 1px solid var(--holo); background: var(--holo); color: #021018; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 8px; transition: box-shadow .2s, transform .2s; }
.holo-btn:hover { box-shadow: 0 0 22px rgba(61,224,255,.5); }
.holo-btn.warm { background: var(--amber); border-color: var(--amber); }
.holo-btn.ghost { background: transparent; color: var(--holo); }
.holo-btn.pressed { box-shadow: 0 0 0 4px rgba(255,176,46,.45), 0 0 34px var(--amber); transform: scale(.97); }
.holo-top { position: absolute; left: 14px; right: 14px; top: 38px; z-index: 6; display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; font-size: 12px; letter-spacing: .12em; color: var(--steel); pointer-events: none; }
.holo-top > * { pointer-events: auto; }
.holo-top button { font: inherit; letter-spacing: inherit; text-transform: inherit; cursor: pointer; }
.holo-views { position: relative; }
.holo-viewbtn { display: inline-flex; align-items: center; gap: 10px; background: var(--amber); border: 1px solid var(--amber); color: #021018; font-weight: 600; padding: 7px 12px; }
.holo-viewbtn .lbl { color: rgba(2,16,24,.65); font-weight: 400; }
.holo-viewbtn .car { transition: transform .15s; font-size: 10px; }
.holo-viewbtn[aria-expanded="true"] .car { transform: rotate(180deg); }
.holo-menu { position: absolute; left: 0; top: calc(100% + 4px); min-width: 210px; display: grid; background: rgba(6,10,20,.97); border: 1px solid var(--amber); box-shadow: 0 10px 30px rgba(0,0,0,.5); padding: 4px; }
.holo-menu[hidden] { display: none; }
.holo-menu button { display: flex; align-items: center; gap: 10px; text-align: left; background: none; border: 0; color: var(--holo); padding: 9px 10px; }
.holo-menu button:hover, .holo-menu button:focus-visible { background: rgba(61,224,255,.1); outline: none; }
.holo-menu button .tick { width: 10px; color: var(--amber); }
.holo-menu button[aria-checked="true"] { color: var(--amber); }
.holo-menu button .n { margin-left: auto; color: var(--steel); font-size: 10px; }
.holo-quotebtn { background: rgba(3,6,12,.85); border: 1px solid var(--amber); color: var(--amber); padding: 7px 12px; font-weight: 600; }
.holo-quotebtn:hover, .holo-quotebtn[aria-pressed="true"] { background: var(--amber); color: #021018; }
.holo-panel .q-add { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 12px; padding: 10px 12px; border: 1px dashed var(--amber); }
.holo-panel .q-add .q-est { font-size: 13px; color: var(--ink); }
.holo-panel .q-add .q-est b { color: var(--amber); font-size: 18px; display: block; }
.holo-panel .q-add .q-est span { color: var(--steel); font-size: 12px; }
.holo-panel .q-row { display: grid; grid-template-columns: 1fr auto; gap: 4px 10px; padding: 10px 0; border-bottom: 1px solid var(--line); font-size: 13px; }
.holo-panel .q-row .nm { font-weight: 600; color: var(--holo); }
.holo-panel .q-row .amt { text-align: right; font-variant-numeric: tabular-nums; }
.holo-panel .q-row .sub { color: var(--steel); font-size: 12px; grid-column: 1 / -1; display: grid; grid-template-columns: 1fr auto; gap: 2px 10px; }
.holo-panel .q-row .ctl { grid-column: 1 / -1; display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.holo-panel .q-row select, .holo-panel .q-set select, .holo-panel .q-set input { font: inherit; font-size: 12px; background: #050912; color: var(--ink); border: 1px solid var(--line); padding: 4px 6px; }
.holo-panel .q-row .ctl select { width: auto; }
.holo-panel .q-step { display: inline-flex; align-items: center; border: 1px solid var(--line); }
.holo-panel .q-step button { background: none; border: 0; color: var(--holo); width: 26px; height: 26px; cursor: pointer; font-size: 15px; }
.holo-panel .q-step span { min-width: 22px; text-align: center; }
.holo-panel .q-x { margin-left: auto; background: none; border: 0; color: var(--steel); cursor: pointer; font-size: 12px; text-decoration: underline; }
.holo-panel .q-set { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 12px 0 4px; font-size: 12px; color: var(--steel); }
.holo-panel .q-set label { display: grid; gap: 4px; }
.holo-panel .q-tot { display: grid; grid-template-columns: 1fr auto; gap: 4px 10px; margin-top: 12px; font-size: 13px; font-variant-numeric: tabular-nums; }
.holo-panel .q-tot .big { font-size: 22px; color: var(--amber); font-weight: 700; border-top: 1px solid var(--amber); padding-top: 6px; margin-top: 4px; }
.holo-panel .q-acts { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
.holo-panel .q-empty { font-size: 14px; color: #c3cee6; }
.holo-ctrls { position: absolute; right: 14px; top: 76px; z-index: 4; display: flex; flex-direction: column; align-items: flex-end; gap: 6px; pointer-events: none; }
.holo-ctrls > * { pointer-events: auto; }
.holo-healthtoggle { font-family: var(--f-hud, ui-monospace, monospace); text-transform: uppercase; font-size: 12px; letter-spacing: .12em; background: rgba(3,6,12,.8); border: 1px solid var(--line); color: var(--holo); padding: 5px 9px; cursor: pointer; }
.holo-healthtoggle:hover { border-color: var(--holo); }
.holo-healthtoggle[aria-pressed="false"] { color: var(--steel); }
.holo-legend { display: grid; gap: 3px; background: rgba(3,6,12,.82); border: 1px solid var(--line); padding: 7px 9px; font-family: var(--f-hud, ui-monospace, monospace); text-transform: uppercase; font-size: 10px; letter-spacing: .1em; color: var(--ink); }
.holo-legend span, .holo-panel .health, .holo-strip .dot { display: inline-flex; align-items: center; gap: 6px; }
.holo .hdot { width: 9px; height: 9px; border-radius: 50%; flex: none; display: inline-block; }
.holo .h-good .hdot, .holo .hdot.h-good { background: #22c55e; box-shadow: 0 0 6px #22c55e; }
.holo .h-watch .hdot, .holo .hdot.h-watch { background: #ff8a1f; box-shadow: 0 0 6px #ff8a1f; }
.holo .h-replace .hdot, .holo .hdot.h-replace { background: #ef2b3a; box-shadow: 0 0 6px #ef2b3a; }
.holo .h-unknown .hdot, .holo .hdot.h-unknown { background: #8b95a5; }
.holo-panel .health { margin-top: 10px; font-size: 13px; color: var(--ink); align-items: flex-start; }
.holo-panel .health b { font-family: var(--f-hud, ui-monospace, monospace); text-transform: uppercase; letter-spacing: .1em; font-size: 11px; }
.holo-panel .health .hdot { margin-top: 3px; }
.holo.is-narrow .holo-legend { font-size: 9px; padding: 5px 7px; }
.holo-cartoggle { z-index: 4; font-family: var(--f-hud, ui-monospace, monospace); text-transform: uppercase; font-size: 12px; letter-spacing: .12em; background: rgba(3,6,12,.8); border: 1px solid var(--line); color: var(--holo); padding: 5px 9px; cursor: pointer; }
.holo-cartoggle:hover { border-color: var(--holo); }
.holo-cartoggle[aria-pressed="false"] { color: var(--steel); }
.holo-strip { position: absolute; left: 0; right: 0; bottom: 0; z-index: 4; display: flex; gap: 6px; overflow-x: auto; padding: 18px 14px 12px; background: linear-gradient(transparent, rgba(7,11,20,.92) 45%); scrollbar-width: thin; }
.holo-strip button { flex: none; font-size: 12px; letter-spacing: .08em; background: var(--bay-2, #0d1424); border: 1px solid var(--line); color: var(--ink); padding: 7px 10px; cursor: pointer; }
.holo-strip button:hover, .holo-strip button:focus-visible { border-color: var(--amber); color: var(--amber); }
.holo-strip button.go { background: var(--amber); border-color: var(--amber); color: #021018; font-weight: 600; }
.holo-strip .grp { flex: none; align-self: center; font-family: var(--f-hud, ui-monospace, monospace); text-transform: uppercase; font-size: 10px; letter-spacing: .14em; color: var(--steel); padding: 0 2px 0 10px; }
.holo-strip .grp:first-child { padding-left: 0; }
.holo-panel { position: absolute; z-index: 5; right: 14px; top: 76px; bottom: 14px; width: min(340px, 50%); overflow-y: auto; background: rgba(9,14,26,.95); border: 1px solid var(--amber); padding: 16px; box-shadow: 0 0 40px rgba(255,176,46,.15); color: var(--ink); }
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
// Part health colors (see web/lib/part-health.ts) and the viewer's on/off choice, remembered in this browser.
const HEALTH_COLOR = { good: 0x22c55e, watch: 0xff8a1f, replace: 0xef2b3a, unknown: 0x8b95a5 };
const HEALTH_LABEL = { good: "Recently serviced", watch: "Getting old: take a look", replace: "Replace soon", unknown: "No record" };
const HEALTH_PREF = "vinsight.healthColors";
function readHealthPref() {
  try { return localStorage.getItem(HEALTH_PREF) !== "off"; } catch (e) { return true; }
}
const CAR_T = new THREE.Vector3(0.1, 0.7, 0);
const CAR_DIR = new THREE.Vector3(5.4, 3.1, 5.6).sub(CAR_T).normalize();
const BAY_DIR = new THREE.Vector3(1.0, 0.9, 0.8).normalize();
const INSIDE_DIR = new THREE.Vector3(1.0, 0.5, 0.75).normalize();
// Underside: the car rises on the lift and the camera looks up at it from below.
const LIFT_H = 1.9;
const UNDER_DIR = new THREE.Vector3(1.0, -0.5, 0.95).normalize();
const TOUR = ["alt", "plugs", "batt", "coils", "rad", "wpump", "thermo"];
const INSIDE_TOUR = ["pistons", "rings", "crank", "cam", "valves", "rods", "hgasket"];
const UNDER_TOUR = ["pads", "muffler", "ftank", "struts", "exhaust", "calipers", "cv"];
// Tabs across the top of the view. car is the whole car; the others are levels a part can live on.
const TABS = [["car", "Whole car"], ["bay", "Engine bay"], ["inside", "Inside engine"], ["under", "Underside"], ["body", "Body & lights"]];
const LEVEL_NAME = { bay: "Engine bay", inside: "Inside the engine", under: "Underside", body: "Body & lights" };
// Strip grouping order for the underside and body lists.
const SYS_ORDER = ["Braking", "Wheels", "Suspension", "Steering", "Drivetrain", "Power train", "Exhaust", "Fuel", "Emissions", "Lighting", "Body", "Glass", "Visibility"];

function injectCss() {
  if (document.getElementById("holo-css")) return;
  const s = document.createElement("style");
  s.id = "holo-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

// Body style from the VIN's body class, door count and wheelbase.
function styleOf(v) { return styleFor(v.bodyClass || v.body, { doors: v.doors, wheelbase: v.wheelbase }); }
function isElectric(v) { return /^electric$/i.test(String(v.fuel || "").trim()); }

/**
 * root: an empty, sized element (give it a height or min-height).
 * options.vehicle: { year, make, model, trim, engine, cylinders, fuel, bodyClass, drive, doors, wheelbase }
 * options.demo: play a looping guided tour instead of taking input.
 * options.onSelect(id): called when the viewer opens a part.
 * options.paint: body color, a hex number or "#rrggbb" (change it later with setPaint).
 * options.partsUrl: folder holding the part .glb files (ending in "/"), and generic car bodies under "cars/generic/";
 *   without it every part and body stays code-built.
 * options.health: { partId: { status: "good" | "watch" | "replace" | "unknown", note } } from the service log
 *   (change it later with setHealth). Parts are tinted by it while the viewer has health colors on.
 */
export function createHologram(root, options = {}) {
  const demo = !!options.demo;
  const onSelect = options.onSelect || function () {};
  let vehicle = Object.assign({}, options.vehicle);
  let paint = options.paint || 0x1f3f78;
  let health = options.health || null;
  let healthOn = readHealthPref();
  injectCss();
  root.classList.add("holo");
  root.classList.toggle("is-demo", demo);
  const uid = "holo" + Math.random().toString(36).slice(2, 8);
  root.innerHTML =
    '<canvas class="holo-canvas"></canvas>' +
    '<div class="holo-hud"><span>Scan <span class="v" data-car></span></span><span><span class="v" data-count></span> parts mapped</span></div>' +
    '<div class="holo-top"><div class="holo-views">' +
      '<button type="button" class="holo-viewbtn" aria-haspopup="true" aria-expanded="false" aria-controls="' + uid + '-views"><span class="lbl">View</span><span data-view></span><span class="car" aria-hidden="true">▼</span></button>' +
      '<div class="holo-menu" id="' + uid + '-views" role="menu" aria-label="3D views" hidden></div></div>' +
      '<button type="button" class="holo-quotebtn" aria-pressed="false" hidden>Quote</button></div>' +
    '<div class="holo-hint"></div>' +
    '<div class="holo-note" hidden>' + BODY_NOTE + '</div>' +
    '<div class="holo-ctrls"><button type="button" class="holo-cartoggle" aria-pressed="true" hidden>Car: shown</button>' +
    '<button type="button" class="holo-healthtoggle" aria-pressed="true" hidden>Health: on</button>' +
    '<div class="holo-legend" hidden>' + ["good", "watch", "replace", "unknown"].map((h) => '<span class="h-' + h + '"><i class="hdot"></i>' + HEALTH_LABEL[h] + "</span>").join("") + "</div></div>" +
    '<div class="holo-strip" role="group" aria-label="Engine bay parts" hidden></div>' +
    '<aside class="holo-panel" aria-label="Part details" hidden></aside>' +
    '<div class="holo-tip" hidden></div>' +
    '<span class="holo-corner tl"></span><span class="holo-corner tr"></span><span class="holo-corner bl"></span><span class="holo-corner br"></span>' +
    (demo ? '<div class="holo-cursor" aria-hidden="true">' + CURSOR + '</div><div class="holo-caption" aria-hidden="true"><b></b><strong></strong><span></span></div><button type="button" class="holo-pause"></button>' : "");
  const $ = (s) => root.querySelector(s);
  const canvas = $(".holo-canvas"), viewBtn = $(".holo-viewbtn"), menu = $(".holo-menu"), quoteBtn = $(".holo-quotebtn"), hint = $(".holo-hint"), bodyNote = $(".holo-note");
  const strip = $(".holo-strip"), panel = $(".holo-panel"), tip = $(".holo-tip"), carToggle = $(".holo-cartoggle");
  const healthToggle = $(".holo-healthtoggle"), legend = $(".holo-legend");
  canvas.setAttribute("aria-label", demo
    ? "Demo: the 3D car opens its engine bay, goes up on the lift, zooms into a part and shows its prices."
    : "Interactive 3D model of your car. Use the view menu and part buttons for keyboard access.");
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

  // The car (body panels, underside parts), its engine and internals, and the lift. Rebuilt when the vehicle changes.
  let carView = [0.7, 1], car = null, lift = null, bodyParts = [], panels = [], chassis = [], hood = null, bayTarget = new THREE.Vector3();
  let engine = null, bayPick = [], bayDecor = [], insidePick = [], partMeshes = {};
  // the generic body model over the code-built one, once it has loaded (null until then, or if there isn't one)
  let realBody = null, destroyed = false;
  let BAY = [], INSIDE = [], UNDER = [], BODY = [];
  function buildAll() {
    [car, lift && lift.group].forEach(function (o) { if (o) { scene.remove(o); disposeTree(o); } });
    const style = styleOf(vehicle);
    const built = buildCar({ style, dims: dimsFor(vehicle), cylinders: vehicle.cylinders, drive: vehicle.drive, electric: isElectric(vehicle) });
    repaint(built.group, paint);
    carView = built.view;
    car = built.group; bodyParts = built.body; panels = built.panels; chassis = built.chassis; hood = built.hood;
    bayTarget = built.engineAt.clone().add(new THREE.Vector3(0.3, 0.3, 0));
    car.userData.engineAt = built.engineAt;
    scene.add(car);
    lift = buildLift(built.floorY); lift.group.visible = false; scene.add(lift.group);

    bayPick = []; bayDecor = []; insidePick = [];
    engine = new THREE.Group();
    if (!isElectric(vehicle)) {
      const e = buildEngine({ cylinders: vehicle.cylinders, year: vehicle.year });
      engine = e.group; bayPick = e.parts; bayDecor = e.decor; insidePick = e.inside;
    }
    engine.position.copy(built.engineAt); engine.visible = false; car.add(engine);

    partMeshes = {};
    bayPick.concat(insidePick, chassis, panels).forEach((o) => { (partMeshes[o.userData.id] = partMeshes[o.userData.id] || []).push(o); });
    const mapped = (flag) => PARTS.filter((p) => p[flag] && partMeshes[p.id]);
    BAY = mapped("bay"); INSIDE = mapped("inside"); UNDER = mapped("under"); BODY = mapped("body");
    if (options.partsUrl) applyPartModels(partMeshes, options.partsUrl);

    realBody = null;
    bodyNote.hidden = true;
    const real = options.partsUrl ? bodyFor(vehicle) : null;
    if (real) {
      const forCar = car;
      const current = () => !destroyed && car === forCar; // a vehicle change rebuilds the car while this loads
      addBody(car, bodyParts.concat(panels), options.partsUrl + "cars/" + real.file, current).then(function (model) {
        if (model && current()) { realBody = model; bodyNote.hidden = false; }
      });
    }
  }
  // the detailed engine models load the first time the engine bay or the inside of the engine is opened for this car
  let engineFitted = null;
  function loadEngineModels() {
    if (!options.partsUrl || !car || engineFitted === car || isElectric(vehicle)) return;
    const forCar = engineFitted = car;
    applyEngineModels(partMeshes, options.partsUrl + "engine/", { cylinders: vehicle.cylinders, year: vehicle.year }, () => !destroyed && car === forCar);
  }
  const LISTS = () => ({ bay: BAY, inside: INSIDE, under: UNDER, body: BODY });
  const has = (level) => level === "car" || LISTS()[level].length > 0;

  /* ---- overlay: tabs, strip, panel, car toggle ---- */
  // mode: "car" | "bay" | "inside" | "under" | "body" | "part". A part opens on its level.
  let mode = "car", partId = null, showCar = true;
  const levelOf = (id) => { const p = byId[id] || {}; return p.inside ? "inside" : p.bay ? "bay" : p.under ? "under" : "body"; };
  const levelNow = () => (mode === "part" ? levelOf(partId) : mode);

  function renderStrip() {
    const level = levelNow(), list = LISTS()[level];
    const dot = (p) => (health && healthOn ? '<i class="hdot h-' + healthFor(p.id).status + '"></i> ' : "");
    const btn = (p) => '<button type="button" data-id="' + p.id + '">' + dot(p) + esc(p.name) + "</button>";
    strip.setAttribute("aria-label", LEVEL_NAME[level] + " parts");
    if (level === "under" || level === "body") {
      // grouped by system: Braking, Suspension, Exhaust, Fuel…
      const rank = (s) => { const i = SYS_ORDER.indexOf(s); return i < 0 ? 99 : i; };
      const sorted = list.slice().sort((a, b) => rank(a.sys) - rank(b.sys));
      let last = null, h = "";
      sorted.forEach(function (p) { if (p.sys !== last) { h += '<span class="grp">' + esc(p.sys) + "</span>"; last = p.sys; } h += btn(p); });
      strip.innerHTML = h;
    } else {
      strip.innerHTML = (level === "bay" && INSIDE.length ? '<button type="button" class="go" data-go="inside">Inside the engine ›</button>' : "") + list.map(btn).join("");
    }
  }
  strip.addEventListener("click", function (e) {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.go) setMode(b.dataset.go); else openPart(b.dataset.id, true);
  });
  carToggle.addEventListener("click", function () { showCar = !showCar; renderUI(); });
  healthToggle.addEventListener("click", function () {
    healthOn = !healthOn;
    try { localStorage.setItem(HEALTH_PREF, healthOn ? "on" : "off"); } catch (e) { /* storage blocked: still toggles for this visit */ }
    renderUI();
    if (mode === "part") renderPanel(byId[partId]);
  });
  const healthFor = (id) => (health && health[id]) || { status: "unknown", note: "" };

  function renderPanel(p) {
    if (quoteOpen) return; // the quote is showing in the panel
    const save = Math.max(0, p.shop - p.diy);
    panel.innerHTML =
      '<button type="button" class="back" data-back>‹ ' + LEVEL_NAME[levelOf(p.id)] + "</button>" +
      '<h3 tabindex="-1">' + esc(p.name) + "</h3>" +
      '<div class="sys">' + esc(p.sys) + " · fits " + esc(carLabel(vehicle)) + (vehicle.engine ? " " + esc(vehicle.engine) : "") + "</div>" +
      (health ? healthLine(p.id) : "") +
      tiers(p) +
      (demo ? "" : quoteBox(p)) +
      '<div class="buy">' + buyLinks(p, vehicle, { primary: "holo-btn warm holo-buy-main", secondary: "holo-btn ghost" }) + "</div>" +
      '<div class="minis">' +
        '<div><span class="hud">Service</span><br>' + esc(p.every) + "</div>" +
        '<div><span class="hud">DIY</span><br>' + wrenches(p.diff) + "</div>" +
        '<div><span class="hud">You save</span><br><span class="save">' + money(save) + "</span></div>" +
      "</div>" +
      "<p>" + esc(p.tip) + "</p>";
  }
  function healthLine(id) {
    const h = healthFor(id);
    const note = h.note || "No service on record. Log it in the service queue (or scan a receipt) to track this part.";
    return '<div class="health h-' + h.status + '"><i class="hdot"></i><span><b>' + HEALTH_LABEL[h.status] + "</b><br>" + esc(note) + "</span></div>";
  }
  panel.addEventListener("click", function (e) { if (e.target.closest("[data-back]")) setMode(levelOf(partId)); });

  function renderUI() {
    const level = levelNow();
    root.dataset.mode = mode;
    $("[data-car]").textContent = carLabel(vehicle);
    $("[data-count]").textContent = Object.keys(partMeshes).length;
    $("[data-view]").textContent = (TABS.find(([key]) => key === level) || TABS[0])[1];
    menu.innerHTML = TABS.filter(([key]) => has(key)).map(([key, label]) =>
      '<button type="button" role="menuitemradio" data-go="' + key + '" aria-checked="' + (key === level) + '"><span class="tick" aria-hidden="true">' + (key === level ? "●" : "") + "</span>" + label +
      (key === "car" ? "" : '<span class="n">' + LISTS()[key].length + "</span>") + "</button>").join("");
    const nq = quoteItems.length;
    quoteBtn.hidden = demo;
    quoteBtn.textContent = nq ? "Quote · " + nq + " · " + money(Math.round(currentQuote().total)) : "Quote";
    quoteBtn.setAttribute("aria-pressed", String(quoteOpen));
    strip.hidden = demo || mode === "car" || mode === "part" || quoteOpen;
    if (!strip.hidden) renderStrip();
    panel.hidden = mode !== "part" && !quoteOpen;
    if (quoteOpen) renderQuote();
    carToggle.hidden = demo || mode === "part" || mode === "car" || mode === "body";
    carToggle.setAttribute("aria-pressed", String(showCar));
    carToggle.textContent = showCar ? "Car: shown" : "Car: hidden";
    carToggle.title = showCar ? "Fade the car out" : "Show the car for reference";
    healthToggle.hidden = demo || !health || mode === "part";
    healthToggle.setAttribute("aria-pressed", String(healthOn));
    healthToggle.textContent = healthOn ? "Health: on" : "Health: off";
    healthToggle.title = healthOn ? "Turn off part health colors" : "Color parts by how recently they were serviced";
    legend.hidden = healthToggle.hidden || !healthOn;
    hint.textContent = "Drag to orbit · Tap any part · Pick a view above";
  }

  /* ---- view menu ---- */
  function openMenu(focusFirst) {
    menu.hidden = false; viewBtn.setAttribute("aria-expanded", "true");
    if (focusFirst) (menu.querySelector('[aria-checked="true"]') || menu.querySelector("button")).focus();
  }
  function closeMenu(focusBtn) {
    if (menu.hidden) return;
    menu.hidden = true; viewBtn.setAttribute("aria-expanded", "false");
    if (focusBtn) viewBtn.focus();
  }
  viewBtn.addEventListener("click", function () { if (menu.hidden) openMenu(false); else closeMenu(false); });
  viewBtn.addEventListener("keydown", function (e) { if (e.key === "ArrowDown") { e.preventDefault(); openMenu(true); } });
  menu.addEventListener("click", function (e) {
    const b = e.target.closest("[data-go]"); if (!b) return;
    closeMenu(true);
    if (quoteOpen) { quoteOpen = false; }
    setMode(b.dataset.go);
  });
  menu.addEventListener("keydown", function (e) {
    const items = [...menu.querySelectorAll("button")], i = items.indexOf(document.activeElement);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length].focus(); }
    else if (e.key === "Home" || e.key === "End") { e.preventDefault(); items[e.key === "Home" ? 0 : items.length - 1].focus(); }
    else if (e.key === "Tab") closeMenu(false);
  });
  function onDocDown(e) { if (!menu.hidden && !e.target.closest(".holo-views")) closeMenu(false); }
  document.addEventListener("pointerdown", onDocDown);

  /* ---- repair quote ---- */
  // Items are kept per car in this browser; the rate, tax and part grade are remembered for every car.
  const QUOTE_SETTINGS = "vinsight.quote.settings", quoteKey = () => "vinsight.quote." + carLabel(vehicle);
  const readJson = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch (e) { return d; } };
  const writeJson = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked: quote lasts this visit */ } };
  let qset = Object.assign({}, DEFAULTS, readJson(QUOTE_SETTINGS, {}));
  let quoteItems = demo ? [] : readJson(quoteKey(), []).filter((i) => byId[i.id]);
  let quoteOpen = false;
  const qopts = () => ({ rate: Number(qset.rate) || DEFAULTS.rate, tax: qset.tax, vehicle });
  const currentQuote = () => quote(quoteItems, qopts());
  function saveQuote() { writeJson(quoteKey(), quoteItems); writeJson(QUOTE_SETTINGS, qset); }
  const inQuote = (id) => quoteItems.find((i) => i.id === id);

  function quoteAdd(id) {
    const p = byId[id];
    if (!inQuote(id)) quoteItems.push({ id, qty: 1, tier: qset.tier });
    saveQuote(); renderUI();
    if (mode === "part" && !quoteOpen) renderPanel(p);
  }
  function quoteBox(p) {
    const l = quoteLine({ id: p.id, qty: 1, tier: qset.tier }, qopts()), added = inQuote(p.id);
    return '<div class="q-add"><div class="q-est">Shop estimate<b>' + money(Math.round(l.total)) + "</b>" +
      "<span>" + money(Math.round(l.parts)) + " part + " + l.hours + " h labor" + (l.extras.length ? " + " + l.extras.map((e) => e.label.replace(/ \(.*/, "").toLowerCase()).join(", ") : "") + " at $" + qopts().rate + "/h</span></div>" +
      (added ? '<button type="button" class="holo-btn ghost" data-quote-open>In quote ›</button>'
             : '<button type="button" class="holo-btn warm" data-quote-add="' + p.id + '">Add to quote</button>') + "</div>";
  }
  function renderQuote() {
    const q = currentQuote(), r = qopts().rate;
    const rateOpts = RATES.map((x) => '<option value="' + x.rate + '"' + (x.rate === r ? " selected" : "") + ">" + x.label + " · $" + x.rate + "/h</option>").join("") +
      (RATES.some((x) => x.rate === r) ? "" : '<option value="' + r + '" selected>Custom · $' + r + "/h</option>");
    let h = '<button type="button" class="back" data-quote-close>‹ ' + (mode === "part" ? "Back to " + esc(byId[partId].name) : "Close quote") + "</button>" +
      '<h3 tabindex="-1">Repair quote</h3><div class="sys">' + esc(carLabel(vehicle)) + (vehicle.engine ? " " + esc(vehicle.engine) : "") + "</div>";
    if (!q.lines.length) {
      return (panel.innerHTML = h + '<p class="q-empty">Open any part and tap <b>Add to quote</b>. The quote adds up parts, book labor hours at your shop\'s rate, and the extras shops charge.</p>');
    }
    h += '<div class="q-set"><label>Shop labor rate<select data-q="rate">' + rateOpts + '<option value="custom">Custom rate…</option></select></label>' +
      '<label>Sales tax on parts (%)<input data-q="tax" type="number" inputmode="decimal" min="0" max="15" step="0.25" value="' + esc(qset.tax) + '"></label></div>';
    q.lines.forEach((l) => {
      h += '<div class="q-row"><span class="nm">' + esc(l.name) + '</span><span class="amt">' + money(Math.round(l.total)) + "</span>" +
        '<div class="sub"><span>Parts: ' + TIER_NAMES[l.tier] + " × " + l.qty + (l.unit ? " " + esc(l.unit) : "") + "</span><span>" + money(Math.round(l.parts)) + "</span>" +
        "<span>Labor: " + l.hours + " h × $" + r + "</span><span>" + money(Math.round(l.labor)) + "</span>" +
        l.extras.map((e) => "<span>" + esc(e.label) + "</span><span>" + money(Math.round(e.amount)) + "</span>").join("") + "</div>" +
        '<div class="ctl"><span class="q-step"><button type="button" data-qty="' + l.id + '" data-d="-1" aria-label="One fewer ' + esc(l.name) + '">−</button><span>' + l.qty + '</span><button type="button" data-qty="' + l.id + '" data-d="1" aria-label="One more ' + esc(l.name) + '">+</button></span>' +
        '<select data-tier="' + l.id + '" aria-label="Part grade for ' + esc(l.name) + '">' + TIER_NAMES.map((n, i) => '<option value="' + i + '"' + (i === l.tier ? " selected" : "") + ">" + n + "</option>").join("") + "</select>" +
        '<button type="button" class="q-x" data-remove="' + l.id + '">Remove</button></div></div>';
    });
    h += '<div class="q-tot"><span>Parts</span><span>' + money(Math.round(q.parts)) + "</span>" +
      "<span>Labor (" + q.hours + " h)</span><span>" + money(Math.round(q.labor)) + "</span>" +
      "<span>Shop supplies</span><span>" + money(Math.round(q.supplies)) + "</span>" +
      "<span>Tax on parts</span><span>" + money(Math.round(q.tax)) + "</span>" +
      '<span class="big">Estimated total</span><span class="big">' + money(Math.round(q.total)) + "</span></div>" +
      '<p class="fine">Most shops will land between ' + money(Math.round(q.low)) + " and " + money(Math.round(q.high)) + ". Labor uses typical book hours for your engine; ask a shop to quote with their labor guide before you approve work.</p>" +
      '<div class="q-acts"><button type="button" class="holo-btn warm" data-quote-copy>Copy quote</button><button type="button" class="holo-btn ghost" data-quote-clear>Clear</button></div>';
    panel.innerHTML = h;
  }
  function quoteText() {
    const q = currentQuote(), r = qopts().rate;
    return ["Repair quote: " + carLabel(vehicle) + (vehicle.engine ? " " + vehicle.engine : ""), ""].concat(
      q.lines.map((l) => l.name + " (" + TIER_NAMES[l.tier] + " × " + l.qty + "): parts " + money(Math.round(l.parts)) + ", labor " + l.hours + " h " + money(Math.round(l.labor)) +
        l.extras.map((e) => ", " + e.label.toLowerCase() + " " + money(Math.round(e.amount))).join("") + " = " + money(Math.round(l.total))),
      ["", "Parts " + money(Math.round(q.parts)), "Labor " + q.hours + " h at $" + r + "/h " + money(Math.round(q.labor)), "Shop supplies " + money(Math.round(q.supplies)),
       "Tax " + money(Math.round(q.tax)), "Estimated total " + money(Math.round(q.total)) + " (likely " + money(Math.round(q.low)) + "–" + money(Math.round(q.high)) + ")"]).join("\n");
  }
  function setQuoteOpen(on) {
    quoteOpen = on; closeMenu(false);
    if (!on && mode === "part") renderPanel(byId[partId]);
    renderUI(); resize(true); updateShift();
    if (on || mode === "part") panel.querySelector("h3").focus({ preventScroll: true });
    else quoteBtn.focus();
  }
  quoteBtn.addEventListener("click", function () { setQuoteOpen(!quoteOpen); });
  panel.addEventListener("click", function (e) {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.quoteAdd) quoteAdd(t.dataset.quoteAdd);
    else if (t.hasAttribute("data-quote-open")) setQuoteOpen(true);
    else if (t.hasAttribute("data-quote-close")) setQuoteOpen(false);
    else if (t.dataset.qty) {
      const it = inQuote(t.dataset.qty); it.qty = Math.min(20, Math.max(1, (it.qty || 1) + Number(t.dataset.d)));
      saveQuote(); renderUI();
    } else if (t.dataset.remove) {
      quoteItems = quoteItems.filter((i) => i.id !== t.dataset.remove); saveQuote(); renderUI(); panel.querySelector("h3").focus();
    } else if (t.hasAttribute("data-quote-clear")) {
      quoteItems = []; saveQuote(); renderUI();
    } else if (t.hasAttribute("data-quote-copy")) {
      const done = () => { t.textContent = "Copied"; setTimeout(() => { t.textContent = "Copy quote"; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(quoteText()).then(done, () => { t.textContent = "Copy failed"; });
    }
  });
  panel.addEventListener("change", function (e) {
    const t = e.target;
    if (t.dataset.tier) { inQuote(t.dataset.tier).tier = Number(t.value); qset.tier = Number(t.value); }
    else if (t.dataset.q === "rate") {
      if (t.value === "custom") {
        const v = Number(window.prompt("Your shop's hourly labor rate in dollars", String(qopts().rate)));
        if (v > 0 && v < 1000) qset.rate = Math.round(v);
      } else qset.rate = Number(t.value);
    } else if (t.dataset.q === "tax") { const v = Number(t.value); qset.tax = v >= 0 && v <= 15 ? v : DEFAULTS.tax; }
    else return;
    saveQuote(); renderUI();
  });

  function onKey(e) {
    if (demo || e.key !== "Escape") return;
    if (!menu.hidden) { closeMenu(true); return; }
    if (quoteOpen) { setQuoteOpen(false); return; }
    if (mode === "car") return;
    const r = root.getBoundingClientRect(); if (r.bottom < 0 || r.top > window.innerHeight) return;
    setMode(mode === "part" ? levelOf(partId) : mode === "inside" ? "bay" : "car");
  }
  document.addEventListener("keydown", onKey);

  /* ---- camera flights ---- */
  const narrow = () => root.clientWidth < 560;
  function goal(m, id) {
    if (m === "car" || m === "body") {
      // bigger bodies (vans, pickups, limos) sit higher and need the camera further back
      const t = CAR_T.clone().setY(carView[0]);
      return { t, p: t.clone().addScaledVector(CAR_DIR, (narrow() ? 9.6 : 8.4) * carView[1] * (m === "body" ? 0.9 : 1)) };
    }
    if (m === "bay") return { t: bayTarget.clone(), p: bayTarget.clone().addScaledVector(BAY_DIR, narrow() ? 5.4 : 4.4) };
    if (m === "inside") {
      const t = car.userData.engineAt.clone().add(new THREE.Vector3(0, 0.38, 0));
      return { t, p: t.clone().addScaledVector(INSIDE_DIR, narrow() ? 3.0 : 2.4) };
    }
    if (m === "under") {
      const t = new THREE.Vector3(-0.1, LIFT_H + 0.6, 0);
      return { t, p: t.clone().addScaledVector(UNDER_DIR, (narrow() ? 6.0 : 5.6) * Math.min(carView[1], 1.15)) };
    }
    // part: frame the pulled-out piece(s) as they'll sit, on the side of the car facing the camera
    const level = levelOf(id), savedY = car.position.y;
    car.position.y = level === "under" ? LIFT_H : 0;
    car.updateMatrixWorld(true);
    const boxes = partMeshes[id].map(function (m) {
      const saved = m.position.clone();
      m.position.copy(m.userData.rest).add(m.userData.ex); m.updateMatrixWorld(true);
      const b = new THREE.Box3().expandByObject(m);
      m.position.copy(saved); m.updateMatrixWorld(true);
      return b;
    });
    car.position.y = savedY; car.updateMatrixWorld(true);
    const camSide = Math.sign(camera.position.z - controls.target.z) || 1;
    const near = boxes.filter((b) => { const z = b.getCenter(new THREE.Vector3()).z; return Math.abs(z) < 0.25 || Math.sign(z) === camSide; });
    let box = new THREE.Box3();
    (near.length ? near : boxes).forEach((b) => box.union(b));
    // a part at every wheel (pads, struts…) spans the car: zoom on the copy nearest the camera instead
    if (box.getSize(new THREE.Vector3()).length() > 1.4) {
      const from = camera.position.clone();
      if (level === "under") from.y -= car.position.y - LIFT_H; // camera may still be on its way up
      box = boxes.slice().sort((p, q) => p.distanceToPoint(from) - q.distanceToPoint(from))[0];
    }
    const c = box.getCenter(new THREE.Vector3()), r = box.getSize(new THREE.Vector3()).length() / 2;
    const dir = camera.position.clone().sub(controls.target).normalize();
    if (level === "under") dir.y = Math.min(-0.12, Math.max(dir.y, -0.34));
    else if (level === "body") dir.y = Math.min(0.6, Math.max(dir.y, 0.15));
    else dir.y = Math.max(dir.y, 0.4);
    dir.normalize();
    // engine parts are small and detailed: the camera may come closer to them than to the rest of the car
    const nearest = level === "bay" || level === "inside" ? 0.8 : 1.5;
    const d = Math.min(3.2, Math.max(nearest, r * 6)) * (narrow() ? 1.3 : 1);
    return { t: c, p: c.clone().addScaledVector(dir, d) };
  }
  // Looking up from under the lift needs the camera below its target; everywhere else it stays above.
  function orbitLimits(level) {
    if (level === "under") { controls.minPolarAngle = 1.62; controls.maxPolarAngle = 1.94; }
    else { controls.minPolarAngle = 0.35; controls.maxPolarAngle = 1.45; }
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
    if (mode !== "part" && !quoteOpen) return;
    if (root.classList.contains("is-stacked")) shiftGoal.y = (panel.offsetHeight + 10) / 2;
    else shiftGoal.x = (panel.offsetWidth + 14) / 2;
  }

  function setMode(m, id, focusPanel) {
    if (m === "part" ? !partMeshes[id] || !has(levelOf(id)) : !has(m)) return;
    mode = m; partId = m === "part" ? id : null; quoteOpen = false; closeMenu(false);
    const lvl = m === "part" ? levelOf(id) : m;
    if (lvl === "bay" || lvl === "inside") loadEngineModels();
    tip.hidden = true; hoverId = null; // a name from the previous view shouldn't linger
    controls.autoRotate = !reduce && m !== "part"; controls.autoRotateSpeed = m === "car" || m === "body" ? 0.7 : 0.35;
    orbitLimits(levelNow());
    if (m === "part") renderPanel(byId[id]);
    renderUI();
    resize(true);
    if (m === "part" && focusPanel) panel.querySelector("h3").focus({ preventScroll: true });
    updateShift();
    fly(goal(m, id));
  }
  function openPart(id, focusPanel) { onSelect(id); setMode("part", id, focusPanel); }

  /* ---- picking ---- */
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
  let hoverId = null, downAt = null;
  function pickList() {
    const level = levelNow();
    if (mode === "car") return [hood].concat(panels, chassis);
    return level === "inside" ? insidePick : level === "under" ? chassis : level === "body" ? panels : bayPick.concat(bayDecor);
  }
  function pick(ev) {
    const r = canvas.getBoundingClientRect();
    mouse.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    mouse.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
    ray.setFromCamera(mouse, camera);
    const hit = ray.intersectObjects(pickList(), true).find((h) => h.object.visible && h.object.userData.id);
    return hit ? { id: hit.object.userData.id, x: ev.clientX - r.left, y: ev.clientY - r.top } : null;
  }
  function tipText(id) {
    if (mode === "car" && id === "engine") return BAY.length ? "Hood · open the engine bay" : byId.hoodpanel.name;
    return byId[id].name;
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
    if (mode === "car" && h.id === "engine") { if (BAY.length) setMode("bay"); else openPart("hoodpanel"); }
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
    const meshes = mode === "car" && id === "engine" ? [hood] : partMeshes[id] || [];
    const box = new THREE.Box3();
    meshes.forEach((m) => box.expandByObject(m));
    const v = box.isEmpty() ? new THREE.Vector3() : box.getCenter(new THREE.Vector3());
    v.project(camera);
    return { x: (v.x + 1) / 2 * root.clientWidth, y: (1 - v.y) / 2 * root.clientHeight };
  }

  /* ---- render loop ---- */
  let shell = 1, bayVis = 0, explode = 0, insideVis = 0, insideExplode = 0, underVis = 0, underExplode = 0, liftK = 0, last = 0, raf = 0, onScreen = true;
  const io = new IntersectionObserver((e) => { onScreen = e[0].isIntersecting; });
  io.observe(root);
  const approach = (v, g, dt, speed) => v + (g - v) * Math.min(1, dt * speed);
  // How much of the car body stays as a see-through reference in each view: [browsing, part close-up].
  const GHOST = { bay: [0.14, 0.025], inside: [0.05, 0.025], under: [0.3, 0.1] };
  const isWheel = (id) => id === "wheels" || id === "tires";
  function loop() {
    raf = requestAnimationFrame(loop);
    const t = clock.getElapsedTime(), dt = Math.min(0.1, t - last); last = t;
    if (!onScreen) return;
    const level = levelNow(), focus = mode === "part";
    const go = (v, g, speed) => (reduce ? g : approach(v, g, dt, speed));
    const shellGoal = mode === "car" ? 1 : level === "body" ? (focus ? 0.3 : 1) : showCar ? GHOST[level][focus ? 1 : 0] : 0;
    shell = go(shell, shellGoal, 3);
    bayVis = go(bayVis, mode !== "car" && level !== "body" ? 1 : 0, 3);
    explode = go(explode, level === "bay" ? 1 : 0, 2.2);
    insideVis = go(insideVis, level === "inside" ? 1 : 0, 3);
    insideExplode = go(insideExplode, level === "inside" ? 1 : 0, 1.8);
    underVis = go(underVis, level === "under" ? 1 : 0, 3);
    underExplode = go(underExplode, level === "under" ? 1 : 0, 2);
    liftK = go(liftK, level === "under" ? 1 : 0, 1.6);

    // the lift raises the car; it stays see-through so it never blocks the parts
    car.position.y = liftK * LIFT_H;
    lift.carriage.position.y = car.position.y;
    setVisibility(lift.group, Math.min(1, liftK * 2.5) * 0.2, 0);

    const pulse = reduce ? 0 : Math.sin(t * 5) * 0.12;
    // hot: the part under the pointer (in this view or on the whole car) or the part in close-up
    const hot = (id, lvl) => (focus ? level === lvl && id === partId : id === hoverId && (mode === lvl || mode === "car"));
    const glow = (on) => (on ? (focus ? 0.25 + pulse : 0.3) : 0);
    // Health colors: green/orange/red by service record, gray when unknown. Hover and close-up stay amber.
    const tinted = !!(health && healthOn);
    const paintBy = (o, vis, id, on, always) => {
      if (on || !tinted || !(always || health[id])) return setVisibility(o, vis, glow(on), AMBER);
      const st = healthFor(id).status;
      setVisibility(o, vis, st === "unknown" ? 0.14 : 0.55, HEALTH_COLOR[st]);
    };
    // a real body stands in for the code-built shell, which stays only as invisible pick targets
    bodyParts.forEach((o) => setVisibility(o, realBody ? 0 : shell, 0));
    if (realBody) setVisibility(realBody, shell, 0);
    setVisibility(hood, 1, 0); // invisible pick target
    panels.forEach(function (o) {
      const id = o.userData.id, mine = focus && level === "body" && id === partId, on = hot(id, "body");
      o.userData.pop = go(o.userData.pop || 0, mine ? 1 : 0, 3);
      o.position.copy(o.userData.rest).addScaledVector(o.userData.ex, o.userData.pop);
      let vis = mine ? 1 : shell;
      if (realBody) {
        if (isWheel(id)) {
          // the real body has its own wheels: the code ones (and the wheel model on them) show from underneath,
          // or while either wheel part is picked, since one wheel model stands in for both
          const picked = (focus && level === "body" && isWheel(partId)) || isWheel(hoverId);
          if (picked) vis = focus ? 1 : vis;
          else if (level !== "under") vis = 0;
        } else if (o.userData.codeOn !== (mine || on)) {
          // a code panel shows only while picked; only touch its materials when that changes
          o.userData.codeOn = mine || on;
          showCode(o, o.userData.codeOn);
        }
      }
      paintBy(o, vis, id, on, false); // body panels only when the log covers them (tires, wipers)
    });
    chassis.forEach(function (o) {
      const id = o.userData.id, on = hot(id, "under");
      o.position.copy(o.userData.rest).addScaledVector(o.userData.ex, underExplode);
      let vis = level === "under" ? (focus && !on ? 0.15 : 1) : shell;
      // the code-built underside would poke through a real body: it only shows from underneath
      if (realBody && level !== "under" && !on) vis = 0;
      paintBy(o, vis, id, on, true);
    });
    engine.visible = bayVis > 0.02;
    // engine bay parts: pulled apart in the bay; a see-through shell inside the engine; dimmed and assembled from underneath
    const fromBelow = 1 - 0.6 * underVis;
    bayPick.forEach(function (o) {
      const id = o.userData.id, on = hot(id, "bay");
      o.position.copy(o.userData.rest).addScaledVector(o.userData.ex, explode);
      const vis = bayVis * fromBelow * ((1 - insideVis) * (focus && level === "bay" && !on ? 0.12 : 1) + insideVis * (id === "engine" ? 0.14 : 0));
      paintBy(o, vis, id, on, true);
    });
    bayDecor.forEach(function (o) {
      o.position.copy(o.userData.rest).addScaledVector(o.userData.ex, explode);
      setVisibility(o, bayVis * fromBelow * (1 - insideVis) * (focus ? 0.1 : 1), 0);
    });
    insidePick.forEach(function (o) {
      const id = o.userData.id, on = hot(id, "inside");
      o.position.copy(o.userData.rest).addScaledVector(o.userData.ex, insideExplode);
      paintBy(o, bayVis * insideVis * (focus && !on ? 0.12 : 1), id, on, true);
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
  function viewPoint(key) { const el = menu.querySelector('[data-go="' + key + '"]'); return el ? elementPoint(el) : { x: 60, y: 120 }; }
  // Each loop shows one of: the engine bay, inside the engine, or the underside on the lift.
  async function runTour(token) {
    let n = 0;
    cursor.style.transform = "translate(" + root.clientWidth * 0.75 + "px," + root.clientHeight * 0.85 + "px)";
    for (;;) {
      const kinds = ["bay"].concat(INSIDE.length ? ["inside"] : [], UNDER.length ? ["under"] : []);
      const kind = kinds[n % kinds.length], round = Math.floor(n / kinds.length);
      setMode("car");
      say("01 / Scan", "Decode any VIN", "Vinsight maps your exact car in 3D: " + Object.keys(partMeshes).length + " parts.");
      await sleep(token, 2600);
      let id, s = 2;
      if (kind === "under") {
        await moveCursor(token, elementPoint(viewBtn));
        openMenu(false);
        await sleep(token, 500);
        await moveCursor(token, viewPoint("under"));
        setMode("under");
        say("02 / Lift it", "Look underneath", "Brakes, suspension, exhaust and the fuel system.");
        await sleep(token, 3800);
        id = UNDER_TOUR.filter((x) => partMeshes[x])[round % UNDER_TOUR.length] || UNDER[0].id;
        s = 3;
      } else {
        await moveCursor(token, screenPoint("engine"));
        setMode("bay");
        say("02 / Explore", "Open the engine bay", BAY.length + " engine parts, pulled apart. Hover any part for its name.");
        await sleep(token, 3400);
        s = 3;
        if (kind === "inside") {
          await moveCursor(token, screenPoint("engine"), "Engine block");
          setMode("inside");
          say("03 / Go deeper", "Inside the engine", "Pistons, rings, rods, crankshaft, cams and valves.");
          await sleep(token, 3600);
          s = 4;
        }
        const list = kind === "inside" ? INSIDE_TOUR : TOUR;
        id = list[round % list.length];
      }
      n++;
      await moveCursor(token, screenPoint(id), byId[id].name);
      tip.hidden = true;
      openPart(id);
      say("0" + s + " / Price", "Compare every price", "Economy, OE-quality and genuine OEM for " + byId[id].name.toLowerCase() + ".");
      await sleep(token, 3000);
      const buy = panel.querySelector(".holo-buy-main");
      await moveCursor(token, elementPoint(buy));
      buy.classList.add("pressed");
      say("0" + (s + 1) + " / Order", "Order the cheapest fit", "Live listings for your year, make, model and engine.");
      await sleep(token, 2800);
      setMode(levelOf(id));
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
  const shape = (v) => [styleOf(v), JSON.stringify(dimsFor(v)), v.cylinders || "", v.year || "", v.drive || "", isElectric(v)].join("|");
  function setVehicle(v) {
    const rebuild = shape(v) !== shape(vehicle);
    const sameCar = carLabel(v) === carLabel(vehicle);
    vehicle = Object.assign({}, v);
    if (!sameCar && !demo) { quoteItems = readJson(quoteKey(), []).filter((i) => byId[i.id]); quoteOpen = false; }
    if (rebuild) {
      if (mode !== "car") setMode("car");
      buildAll();
    }
    if (mode === "part") renderPanel(byId[partId]);
    renderUI();
  }
  function setHealth(map) {
    health = map || null;
    renderUI();
    if (mode === "part") renderPanel(byId[partId]);
  }
  function setPaint(color) {
    paint = color || 0x1f3f78;
    if (car) repaint(car, paint);
  }
  function destroy() {
    destroyed = true;
    pause();
    cancelAnimationFrame(raf);
    ro.disconnect(); io.disconnect();
    document.removeEventListener("keydown", onKey);
    document.removeEventListener("pointerdown", onDocDown);
    controls.dispose();
    disposeTree(scene);
    env.dispose();
    renderer.dispose();
    root.innerHTML = "";
    root.classList.remove("holo", "is-demo", "is-stacked", "is-narrow");
  }

  buildAll();
  resize();
  renderUI();
  loop();
  // A demo starts itself unless the viewer prefers reduced motion; then it waits for Play.
  if (demo && !reduce) play();
  return { setVehicle, setPaint, setHealth, destroy, play, pause };
}
