// Types for body-model.js. The 3D side is only used from hologram.js; tests use these.

/** An axis-aligned box, like a three.js Box3. */
export interface BoxLike {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
}

/** Scale and position that put a body model over the code-built body. */
export function fitBody(
  modelBox: BoxLike,
  targetBox: BoxLike,
  kz?: number,
): { scale: [number, number, number]; position: [number, number, number] };

/** The code-built body's bounds in the car group's frame, with every panel at rest. */
export function codeBox(car: Object3DLike, parts: Object3DLike[]): BoxLike;

/** Fit model over the code-built body and add it to the car group. */
export function placeBody(model: Object3DLike, car: Object3DLike, parts: Object3DLike[]): void;

/** Load a body .glb as a group with materials the viewer can fade. */
export function loadBody(url: string): Promise<Object3DLike>;

/** Load, fit and add a body; null when it failed to load or the car was rebuilt meanwhile. */
export function addBody(
  car: Object3DLike,
  parts: Object3DLike[],
  url: string,
  isCurrent?: () => boolean,
): Promise<Object3DLike | null>;

/** Show or hide a code-built part's own look; it stays a pick target. */
export function showCode(obj: Object3DLike, on: boolean): void;

/** three.js objects (three has no TypeScript types installed here). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Object3DLike = any;

/** How many panel regions each of the real body's looks can light at once. */
export const HI_MAX: number;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Region = { box: any; plane: any; lo: number; hi: number; depth?: number; looks?: string[] };
/** Swap every material in body for the see-through look its name asks for, each able to light up panel regions. */
export function applyLooks<T extends Object3DLike>(body: T): T;
/** The spot on the real body a code-built panel stands for, in the car group's frame; null for an empty panel. */
export function panelRegion(car: Object3DLike, obj: Object3DLike, pad?: number[]): Region | null;
/** Move a region's depth band onto the real body's outer skin (of the region's looks when it has any there). */
export function fitRegionToBody<R extends Region | null>(region: R, model: Object3DLike, car: Object3DLike, margin?: number): R;
/** A region carried into world space by the car group's matrix. */
export function regionInWorld(region: Region, matrix: unknown): Region;
/** Light up the real body in the given world-space regions (none switches it off). */
export function highlightBody(model: Object3DLike, regions: Region[], color: number, amount: number): void;

/** The real body's paint: solid gloss white. */
export const BODY_PAINT: { color: number; opacity: number; metalness: number; roughness: number; clearcoat: number; clearcoatRoughness: number };
