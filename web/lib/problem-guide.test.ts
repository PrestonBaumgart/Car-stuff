import { describe, expect, it } from "vitest";
import { cleanComplaint, guideFor, topSymptoms } from "./problem-guide";

describe("guideFor", () => {
  it("matches NHTSA component names", () => {
    expect(guideFor("ENGINE").what).toMatch(/pistons/);
    expect(guideFor("ENGINE AND ENGINE COOLING").what).toMatch(/cooling/);
    expect(guideFor("POWER TRAIN").what).toMatch(/transmission/);
    expect(guideFor("SERVICE BRAKES, HYDRAULIC").what).toMatch(/Pads/);
    expect(guideFor("AIR BAGS").what).toMatch(/airbags/);
  });
  it("falls back for unknown categories, always leading with recalls", () => {
    expect(guideFor("UNKNOWN OR OTHER").how[0]).toMatch(/recalls/);
  });
});

describe("topSymptoms", () => {
  it("counts complaints that mention each symptom", () => {
    const s = topSymptoms(["Car is burning oil and stalled", "Stalling at lights", "Engine knocking then stall"]);
    expect(s[0]).toEqual({ label: "Stalling", count: 3 });
    expect(s.find((x) => x.label === "Burning or losing oil")?.count).toBe(1);
  });
});

describe("cleanComplaint", () => {
  it("drops FOIA notices and XXX placeholders", () => {
    expect(cleanComplaint("Since XXX it stalls.  INFORMATION REDACTED PURSUANT TO THE FREEDOM OF INFORMATION ACT (FOIA), 5 U.S.C. 552(B)(6)"))
      .toBe("Since … it stalls.");
  });
});
