import { describe, expect, it } from "vitest";
import { detectKind, findDates, findVins, parseInsurance, parseReceipt, parseRegistration } from "./scan";

// Text the way OCR returns it from photos of each document.
const INSURANCE = `STATE FARM
AUTOMOBILE INSURANCE IDENTIFICATION CARD
Company: State Farm Mutual Automobile Insurance Company NAIC 25178
Policy Number: 123 4567-B21-47
Effective 05/21/2026 Expiration 11/21/2026
Year Make Model 2020 KIA SOUL
VIN KNDJ23AU0L7012345
Insured: JORDAN SAMPLE
Report claims: 1-800-732-5246`;

const REGISTRATION = `WASHINGTON STATE
DEPARTMENT OF LICENSING
VEHICLE REGISTRATION
Plate No: CDE1234   Tab Exp: 03/31/2027
VIN: KNDJ23AU0L7O12345
Year 2020 Make KIA Model SOUL
Registered Owner JORDAN SAMPLE
Fees paid $95.75`;

const RECEIPT = `QUICK LUBE EXPRESS
123 Main St
Invoice # 44821    Date: 10/02/2026
Vehicle: 2020 Kia Soul   Mileage In: 41,250
Full Synthetic Oil & Filter Change   59.99
Tire Rotation                         19.99
Cabin Air Filter                      34.99
Wiper Blades (pair)                   29.98
Subtotal 144.95
Total $156.42`;

describe("detectKind", () => {
  it("tells documents apart", () => {
    expect(detectKind(INSURANCE)).toBe("insurance");
    expect(detectKind(REGISTRATION)).toBe("registration");
    expect(detectKind(RECEIPT)).toBe("receipt");
  });
});

describe("findDates", () => {
  it("reads common formats", () => {
    expect(findDates("Exp 03/31/2027").map((d) => d.date)).toContain("2027-03-31");
    expect(findDates("Valid thru March 31, 2027").map((d) => d.date)).toContain("2027-03-31");
    expect(findDates("31 MAR 2027").map((d) => d.date)).toContain("2027-03-31");
    expect(findDates("EXP 03/27").map((d) => d.date)).toContain("2027-03-31");
    expect(findDates("on 3-5-26").map((d) => d.date)).toContain("2026-03-05");
  });
});

describe("parseInsurance", () => {
  it("reads an insurance card", () => {
    expect(parseInsurance(INSURANCE)).toEqual({ company: "State Farm", policy: "123 4567-B21-47", phone: "(800) 732-5246", expires: "2026-11-21" });
  });
});

describe("parseRegistration", () => {
  it("reads a registration card", () => {
    expect(parseRegistration(REGISTRATION)).toEqual({ plate: "CDE1234", state: "WA", expires: "2027-03-31" });
  });
});

describe("parseReceipt", () => {
  it("reads a service receipt", () => {
    expect(parseReceipt(RECEIPT)).toEqual({
      date: "2026-10-02", miles: 41250, services: ["oil", "tire-rotation", "cabin-filter", "wipers"], shop: "QUICK LUBE EXPRESS", total: "$156.42",
    });
  });
});

describe("findVins", () => {
  it("fixes OCR letter mix-ups", () => {
    expect(findVins(REGISTRATION)).toEqual(["KNDJ23AU0L7012345"]);
  });
});
