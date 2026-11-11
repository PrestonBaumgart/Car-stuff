/** Fit the part models onto the parts they replace. Resolves once every model has loaded or failed. */
export function applyPartModels(partMeshes: Record<string, unknown[]>, base: string): Promise<unknown[]>;
