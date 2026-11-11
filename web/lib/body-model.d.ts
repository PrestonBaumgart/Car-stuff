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
