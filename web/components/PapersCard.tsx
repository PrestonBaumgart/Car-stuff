"use client";

import { useState } from "react";
import { saveInsurance, saveRegistration } from "@/lib/garage-store";
import { fmtDate } from "@/lib/format";
import { docLabel, docState, downloadIcs, WARN_DAYS, type DocKind } from "@/lib/reminders";
import type { Car, Insurance, Registration } from "@/lib/types";

const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

type Field = { key: string; label: string; placeholder?: string; type?: "text" | "date" | "tel" | "state"; autoComplete?: string };

const DOCS: Record<DocKind, { title: string; empty: string; fields: Field[] }> = {
  insurance: {
    title: "Insurance",
    empty: "Add your policy and its renewal date to get a reminder before it lapses.",
    fields: [
      { key: "company", label: "Insurance company", placeholder: "State Farm" },
      { key: "policy", label: "Policy number", placeholder: "On your insurance card", autoComplete: "off" },
      { key: "phone", label: "Claims or agent phone", placeholder: "(800) 555-0100", type: "tel" },
      { key: "expires", label: "Policy expires", type: "date" },
    ],
  },
  registration: {
    title: "Registration",
    empty: "Add your plate and tag expiration to get a reminder before it runs out.",
    fields: [
      { key: "plate", label: "License plate", placeholder: "ABC1234", autoComplete: "off" },
      { key: "state", label: "State", type: "state" },
      { key: "expires", label: "Tag expires", type: "date" },
    ],
  },
};

/** Insurance and registration (tag): details, expiry countdowns and calendar reminders. */
export function PapersCard({ car }: { car: Car }) {
  return (
    <section className="panel">
      <h2>Insurance &amp; registration</h2>
      <p className="sub">
        The app warns you {WARN_DAYS} days before either one expires. Add a reminder to your calendar to get alerts even when the app is closed.
        Saved in this browser only.
      </p>
      <div className="grid two papers">
        <Doc car={car} kind="insurance" />
        <Doc car={car} kind="registration" />
      </div>
    </section>
  );
}

function Doc({ car, kind }: { car: Car; kind: DocKind }) {
  const spec = DOCS[kind];
  const saved = (car[kind] ?? {}) as Record<string, string | undefined>;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string | undefined>>(saved);
  const state = docState(saved.expires);
  const hasAny = Object.values(saved).some(Boolean);

  function save(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, v?.trim() || undefined]).filter(([, v]) => v));
    const value = Object.keys(cleaned).length ? cleaned : undefined;
    if (kind === "insurance") saveInsurance(car.vin, value as Insurance | undefined);
    else saveRegistration(car.vin, value as Registration | undefined);
    setEditing(false);
  }

  if (editing) {
    return (
      <form className={`doc ${state.status}`} onSubmit={save}>
        <h3>{spec.title}</h3>
        {spec.fields.map((f) => (
          <label key={f.key}>
            {f.label}
            {f.type === "state" ? (
              <select value={draft[f.key] ?? ""} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}>
                <option value="">Choose…</option>
                {STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
            ) : (
              <input
                type={f.type ?? "text"}
                value={draft[f.key] ?? ""}
                placeholder={f.placeholder}
                autoComplete={f.autoComplete}
                onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
              />
            )}
          </label>
        ))}
        <div className="row">
          <button className="btn small">Save</button>
          <button type="button" className="btn ghost small" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </form>
    );
  }

  const shown = spec.fields.filter((f) => f.key !== "expires" && saved[f.key]);
  return (
    <div className={`doc ${state.status}`}>
      <div className="doc-head">
        <h3>{spec.title}</h3>
        {state.status !== "none" && (
          <span className={`pill ${state.status === "expired" ? "overdue" : state.status}`}>
            {state.status === "expired" ? "Expired" : state.status === "due-soon" ? "Renew soon" : "Current"}
          </span>
        )}
      </div>
      {hasAny ? (
        <>
          {state.expires && (
            <p className="doc-when">
              <b>{docLabel(state)}</b>
              <span className="muted"> · {fmtDate(state.expires)}</span>
            </p>
          )}
          {shown.length > 0 && (
            <dl className="facts">
              {shown.map((f) => (
                <div key={f.key}>
                  <dt>{f.label}</dt>
                  <dd>{f.type === "tel" ? <a href={`tel:${saved[f.key]!.replace(/[^\d+]/g, "")}`}>{saved[f.key]}</a> : saved[f.key]}</dd>
                </div>
              ))}
            </dl>
          )}
          {!state.expires && <p className="field-warn">Add the expiration date to get reminders.</p>}
        </>
      ) : (
        <p className="muted" style={{ fontSize: 14, margin: "4px 0 0" }}>{spec.empty}</p>
      )}
      <div className="row">
        <button className="btn ghost small" onClick={() => { setDraft(saved); setEditing(true); }}>
          {hasAny ? "Edit" : `Add ${spec.title.toLowerCase()}`}
        </button>
        {state.expires && (
          <button className="btn ghost small" onClick={() => downloadIcs(car, kind)} title="Adds an event with alerts 30, 7 and 1 day before">
            Add to calendar
          </button>
        )}
      </div>
    </div>
  );
}
