"use client";

import { useState } from "react";
import { saveSpecs } from "@/lib/garage-store";
import { isElectric } from "@/lib/maintenance";
import type { Car, Specs } from "@/lib/types";

const FIELDS: { key: keyof Specs; label: string; placeholder: string; hint: string; combustionOnly?: boolean }[] = [
  { key: "oilGrade", label: "Oil grade", placeholder: "0W-20", hint: "Printed on the oil filler cap", combustionOnly: true },
  { key: "oilCapacityQt", label: "Oil capacity (qt)", placeholder: "4.4", hint: "Owner's manual, with filter", combustionOnly: true },
  { key: "tirePsiFront", label: "Tire PSI front", placeholder: "32", hint: "Door-jamb sticker" },
  { key: "tirePsiRear", label: "Tire PSI rear", placeholder: "30", hint: "Door-jamb sticker" },
  { key: "tireSize", label: "Tire size", placeholder: "215/60R16", hint: "Tire sidewall" },
];

export function SpecsCard({ car }: { car: Car }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Specs>(car.specs);
  const fields = FIELDS.filter((f) => !(f.combustionOnly && isElectric(car)));

  function save(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, v?.trim() || undefined])) as Specs;
    saveSpecs(car.vin, cleaned);
    setEditing(false);
  }

  return (
    <section className="panel">
      <div className="page-head" style={{ marginBottom: 12, alignItems: "start" }}>
        <div>
          <h2>Specs</h2>
          <p className="sub" style={{ margin: 0 }}>Fill these in once from your car; the hint says where to look.</p>
        </div>
        {!editing && (
          <button className="btn ghost small" onClick={() => { setDraft(car.specs); setEditing(true); }}>
            Edit
          </button>
        )}
      </div>
      {editing ? (
        <form onSubmit={save} className="stack">
          <div className="specs">
            {fields.map((f) => (
              <label key={f.key}>
                {f.label}
                <input
                  value={draft[f.key] ?? ""}
                  placeholder={f.placeholder}
                  onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                />
                <span style={{ fontSize: 12 }}>{f.hint}</span>
              </label>
            ))}
          </div>
          <div className="row">
            <button className="btn small">Save specs</button>
            <button type="button" className="btn ghost small" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <div className="specs">
          {fields.map((f) => (
            <div key={f.key} className="spec">
              <span className="hud">{f.label}</span>
              {car.specs[f.key] ? <b>{car.specs[f.key]}</b> : <b className="unset">{f.hint}</b>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
