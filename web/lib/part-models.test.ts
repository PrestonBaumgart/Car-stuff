import { describe, expect, it, vi } from "vitest";
import { applyPartModels } from "./part-models.js";

type Mesh = { isMesh: true; material: { visible: boolean } };
function part() {
  const mesh: Mesh = { isMesh: true, material: { visible: true } };
  return { mesh, traverse: (fn: (o: Mesh) => void) => fn(mesh) };
}

describe("applyPartModels", () => {
  it("leaves the code-built parts showing when the model files can't be loaded", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const parts = { struts: [part()], rotors: [part()], plugs: [part()] };
    await applyPartModels(parts, "http://127.0.0.1:9/nowhere/");
    for (const list of Object.values(parts)) for (const p of list) expect(p.mesh.material.visible).toBe(true);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("does nothing for a car without the parts", async () => {
    await expect(applyPartModels({}, "http://127.0.0.1:9/nowhere/")).resolves.toBeDefined();
  });
});
