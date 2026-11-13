// Types for the parts of car-model.js used from TypeScript. The 3D builders are only used from hologram.js.

/** Body style names, one per kind of body the 3D view can draw. */
export type BodyStyle =
  | "sedan" | "coupe" | "convertible" | "roadster" | "hatchback" | "hatch3" | "wagon"
  | "crossover" | "suv" | "minivan" | "van" | "pickup" | "limo";

/** NHTSA body class (plus door count and wheelbase in inches, when known) → body style. */
export function styleFor(
  bodyClass: string | null | undefined,
  extra?: { doors?: string | number | null; wheelbase?: string | number | null },
): BodyStyle;

export const BODY_STYLES: BodyStyle[];

/** Build the 3D car. Only used from tests in TypeScript; the app uses it through hologram.js. */
export function buildCar(options: {
  style?: BodyStyle; dims?: import("./car-dims.js").CarDims | null; paint?: number | string;
  cylinders?: string | number | null; drive?: string | null; electric?: boolean;
}): { group: Object3DLike; body: Object3DLike[]; panels: Object3DLike[]; chassis: Object3DLike[] };

/** Fade (vis 0-1) and highlight everything inside obj. */
export function setVisibility(obj: Object3DLike, vis: number, glow: number, glowColor?: number): void;

/** three.js objects (three has no TypeScript types installed here). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Object3DLike = any;
