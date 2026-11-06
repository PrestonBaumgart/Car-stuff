"use client";

import { useState } from "react";
import { logService } from "@/lib/garage-store";
import { fmtDate, fmtMiles } from "@/lib/format";
import { currentMiles, todayIso, type ItemStatus } from "@/lib/maintenance";
import type { Car } from "@/lib/types";

const LABEL = { overdue: "Overdue", "due-soon": "Due soon", ok: "OK", "no-record": "No record" } as const;

function dueText(s: ItemStatus) {
  if (s.status === "no-record") return "Log when this was last done to start tracking it.";
  const parts: string[] = [];
  if (s.milesLeft != null) parts.push(s.milesLeft <= 0 ? `${fmtMiles(-s.milesLeft)} over` : `${fmtMiles(s.milesLeft)} left`);
  if (s.daysLeft != null) parts.push(s.daysLeft <= 0 ? `${-s.daysLeft} days late` : `due ${fmtDate(s.dueDate!)}`);
  return `${parts.join(" · ")}. Last done ${fmtDate(s.lastDone!.date)} at ${fmtMiles(s.lastDone!.miles)}.`;
}

function every(s: ItemStatus) {
  const { everyMiles, everyMonths } = s.item;
  return [everyMiles && fmtMiles(everyMiles), everyMonths && `${everyMonths} mo`].filter(Boolean).join(" or ");
}

export function ServiceQueue({ car, queue }: { car: Car; queue: ItemStatus[] }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section className="panel">
      <h2>Service queue</h2>
      <p className="sub">Due by miles or months, whichever comes first. Intervals are general defaults; your owner's manual wins.</p>
      <ul className="queue">
        {queue.map((s) => (
          <li key={s.item.id} className={s.status}>
            <span className="title">{s.item.name}</span>
            <span className={`pill ${s.status}`}>{LABEL[s.status]}</span>
            <span className="detail">
              {dueText(s)} <span className="muted">Every {every(s)}.</span>
            </span>
            <span className="detail">
              <span className="wrenches" title={`DIY difficulty ${s.item.diy} of 5`}>
                {"▮".repeat(s.item.diy)}{"▯".repeat(5 - s.item.diy)} DIY
              </span>{" "}
              {s.item.tip}
            </span>
            <div className="actions">
              {open === s.item.id ? (
                <MarkDone car={car} itemId={s.item.id} onClose={() => setOpen(null)} />
              ) : (
                <button className="btn ghost small" onClick={() => setOpen(s.item.id)}>
                  Log service
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function MarkDone({ car, itemId, onClose }: { car: Car; itemId: string; onClose: () => void }) {
  const [date, setDate] = useState(todayIso());
  const [miles, setMiles] = useState(String(currentMiles(car) ?? ""));
  const [error, setError] = useState<string | null>(null);

  function save(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(miles.replace(/,/g, ""));
    if (!miles.trim() || !Number.isFinite(n) || n < 0) return setError("Enter the odometer reading.");
    if (!date) return setError("Pick a date.");
    logService(car.vin, { itemId, date, miles: n });
    onClose();
  }

  return (
    <form className="row" onSubmit={save} style={{ width: "100%" }}>
      <label>
        Date
        <input type="date" value={date} max={todayIso()} onChange={(e) => setDate(e.target.value)} />
      </label>
      <label>
        Odometer
        <input value={miles} onChange={(e) => setMiles(e.target.value)} inputMode="numeric" autoFocus />
      </label>
      <button className="btn small">Save</button>
      <button type="button" className="btn ghost small" onClick={onClose}>
        Cancel
      </button>
      {error && <p className="field-error" role="alert" style={{ width: "100%" }}>{error}</p>}
    </form>
  );
}
