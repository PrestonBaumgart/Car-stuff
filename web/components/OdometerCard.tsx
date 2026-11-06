"use client";

import { useState } from "react";
import { logOdometer } from "@/lib/garage-store";
import { fmtDate, fmtMiles } from "@/lib/format";
import { currentMiles, todayIso } from "@/lib/maintenance";
import type { Car } from "@/lib/types";

export function OdometerCard({ car }: { car: Car }) {
  const [miles, setMiles] = useState("");
  const [error, setError] = useState<string | null>(null);
  const now = currentMiles(car);
  const recent = [...car.odometer].reverse().slice(0, 5);

  function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const n = Number(miles.replace(/,/g, ""));
    if (!miles.trim() || !Number.isFinite(n) || n < 0) return setError("Enter a mileage number.");
    if (now != null && n < now) return setError(`That's lower than your last reading (${fmtMiles(now)}).`);
    logOdometer(car.vin, { date: todayIso(), miles: n });
    setMiles("");
  }

  return (
    <section className="panel">
      <h2>Odometer</h2>
      <p className="sub">Update this every few weeks so mileage-based reminders stay accurate.</p>
      <p className="display" style={{ fontSize: 44, margin: "0 0 12px", lineHeight: 1 }}>
        {now != null ? fmtMiles(now) : <span className="muted" style={{ fontSize: 22 }}>No reading yet</span>}
      </p>
      <form className="row" onSubmit={save}>
        <label>
          New reading
          <input value={miles} onChange={(e) => setMiles(e.target.value)} inputMode="numeric" placeholder="e.g. 85,120" />
        </label>
        <button className="btn">Update</button>
      </form>
      {error && <p className="field-error" role="alert">{error}</p>}
      {recent.length > 0 && (
        <table style={{ marginTop: 16 }}>
          <thead>
            <tr><th>Date</th><th>Miles</th></tr>
          </thead>
          <tbody>
            {recent.map((o, i) => (
              <tr key={i}><td>{fmtDate(o.date)}</td><td>{fmtMiles(o.miles)}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
