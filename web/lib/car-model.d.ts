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
