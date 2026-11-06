"use client";

import { useState } from "react";
import { addCar } from "@/lib/garage-store";
import { decodeVin, validateVin } from "@/lib/nhtsa";

export function AddCarForm({ existingVins, onAdded }: { existingVins: string[]; onAdded?: (vin: string) => void }) {
  const [vin, setVin] = useState("");
  const [miles, setMiles] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const check = vin.length === 17 ? validateVin(vin) : null;
  const badCheckDigit = check?.ok && !check.checkDigitValid;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const v = validateVin(vin);
    if (!v.ok) return setError(v.reason);
    if (existingVins.includes(v.vin)) return setError("That car is already in your garage.");
    const odo = miles.trim() ? Number(miles.replace(/,/g, "")) : undefined;
    if (odo != null && (!Number.isFinite(odo) || odo < 0)) return setError("Mileage should be a number.");

    setBusy(true);
    try {
      const vehicle = await decodeVin(v.vin);
      addCar(vehicle, odo);
      setVin("");
      setMiles("");
      onAdded?.(v.vin);
    } catch (err) {
      setError(err instanceof Error && err.message.includes("identify")
        ? "NHTSA couldn't identify this VIN. Double-check it on your registration or windshield."
        : "Couldn't reach NHTSA. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="panel">
      <h2>Add a car</h2>
      <p className="sub">Your VIN is on the driver-side windshield corner, the door jamb, or your registration.</p>
      <div className="row">
        <label style={{ flexBasis: 300, flexGrow: 3 }}>
          VIN
          <input
            className="vin-input"
            value={vin}
            onChange={(e) => setVin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 17))}
            placeholder="1HGCM82633A004352"
            autoComplete="off"
            spellCheck={false}
            aria-describedby="vin-count"
            required
          />
        </label>
        <label>
          Current miles <span className="muted">(optional)</span>
          <input value={miles} onChange={(e) => setMiles(e.target.value)} inputMode="numeric" placeholder="84,500" />
        </label>
        <button className="btn" disabled={busy}>
          {busy ? "Decoding…" : "Decode & add"}
        </button>
      </div>
      <p id="vin-count" className="hud" style={{ margin: "8px 0 0" }}>{vin.length}/17</p>
      {badCheckDigit && <p className="field-warn">The check digit doesn't match. That's normal for some non-US cars; otherwise look for a typo.</p>}
      {error && <p className="field-error" role="alert">{error}</p>}
    </form>
  );
}
