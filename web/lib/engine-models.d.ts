// three has no TypeScript types in this project
type Box3 = any; type Matrix4 = any; type Vector3 = any; // eslint-disable-line @typescript-eslint/no-explicit-any
export function isInline4(spec: { cylinders?: unknown } | null | undefined): boolean;
export function fitPiston(modelBox: Box3, targetBox: Box3): Matrix4;
export function fitStanding(modelBox: Box3, targetBox: Box3): Matrix4;
export function fitAligned(modelBox: Box3, targetBox: Box3, axis: "x" | "y" | "z"): Matrix4;
export function fitOrigin(at: number[], size: number): Matrix4;
export function fitCrank(model: { spacing: number; throw: number }, code: { spacing: number; throw: number; axisY: number; flywheelZ: number }): Matrix4;
export function fitCam(model: { spacing: number; radius: number }, code: { spacing: number; radius: number }): Matrix4;
export function fitManifold(model: { spacing: number }, code: { at: number[]; head: number; spacing: number }): Matrix4;
export function fitRod(modelBox: Box3, pin: Vector3, wrist: Vector3): Matrix4;
export function enginePlan(spec: { cylinders?: unknown } | null | undefined): { id: string; file: string; kind: string; at?: number[]; size?: number; axis?: "x" | "y" | "z" }[];
/** Fit the detailed engine models. Resolves once every model has loaded or failed; a missing file leaves the code-built part showing. */
export function applyEngineModels(partMeshes: Record<string, unknown[]>, base: string, spec: { cylinders?: unknown; year?: unknown }, current?: () => boolean): Promise<unknown[]>;
