"use client";

import { useRef, useState } from "react";
import { logOdometer, logService, saveInsurance, saveRegistration } from "@/lib/garage-store";
import { currentMiles, scheduleFor, todayIso } from "@/lib/maintenance";
import { readPhoto } from "@/lib/ocr";
import { detectKind, findVins, parseInsurance, parseReceipt, parseRegistration, type ScanKind } from "@/lib/scan";
import type { Car } from "@/lib/types";

const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];
const KIND_NAME: Record<ScanKind, string> = { receipt: "Service receipt", insurance: "Insurance card", registration: "Registration card" };

type Fields = Record<string, string>;
type Step =
  | { step: "idle" }
  | { step: "reading"; preview: string; progress: number; status: string }
  | { step: "review"; preview: string; text: string; kind: ScanKind; fields: Fields; services: string[] }
  | { step: "done"; message: string }
  | { step: "error"; message: string };

/** Fields to prefill for a document type, from the text read off the photo. */
function fill(kind: ScanKind, text: string, car: Car): { fields: Fields; services: string[] } {
  if (kind === "insurance") return { fields: { ...(car.insurance as Fields), ...(parseInsurance(text) as Fields) }, services: [] };
  if (kind === "registration") return { fields: { ...(car.registration as Fields), ...(parseRegistration(text) as Fields) }, services: [] };
  const r = parseReceipt(text);
  return {
    fields: {
      date: r.date ?? todayIso(),
      miles: String(r.miles ?? currentMiles(car) ?? ""),
      note: [r.shop, r.total].filter(Boolean).join(" · "),
    },
    services: r.services,
  };
}

/** Photograph a service receipt, insurance card or registration and fill in the garage from it. */
export function ScanCard({ car }: { car: Car }) {
  const [s, setS] = useState<Step>({ step: "idle" });
  const camera = useRef<HTMLInputElement>(null), library = useRef<HTMLInputElement>(null);
  const items = scheduleFor(car);

  async function onFile(file: File | undefined) {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setS({ step: "reading", preview, progress: 0, status: "Starting" });
    try {
      const text = await readPhoto(file, (progress, status) =>
        setS((cur) => (cur.step === "reading" ? { ...cur, progress, status } : cur)));
      if (text.replace(/\s/g, "").length < 15) throw new Error("No text found");
      const kind = detectKind(text);
      setS({ step: "review", preview, text, kind, ...fill(kind, text, car) });
    } catch {
      URL.revokeObjectURL(preview);
      setS({ step: "error", message: "Couldn't read any text in that photo. Try again in good light, with the document flat and filling the frame." });
    }
  }

  function reset() {
    if (s.step === "reading" || s.step === "review") URL.revokeObjectURL(s.preview);
    setS({ step: "idle" });
    [camera, library].forEach((r) => { if (r.current) r.current.value = ""; });
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (s.step !== "review") return;
    const f = Object.fromEntries(Object.entries(s.fields).map(([k, v]) => [k, v?.trim()]).filter(([, v]) => v)) as Fields;
    let message = "";
    if (s.kind === "insurance") {
      saveInsurance(car.vin, { company: f.company, policy: f.policy, phone: f.phone, expires: f.expires });
      message = "Insurance saved.";
    } else if (s.kind === "registration") {
      saveRegistration(car.vin, { plate: f.plate, state: f.state, expires: f.expires });
      message = "Registration saved.";
    } else {
      const miles = Number(String(f.miles || "").replace(/,/g, ""));
      const date = f.date || todayIso();
      s.services.forEach((itemId) => logService(car.vin, { itemId, date, miles, note: f.note }));
      if (!s.services.length && miles) logOdometer(car.vin, { date, miles });
      message = s.services.length
        ? `Logged ${s.services.length} service${s.services.length === 1 ? "" : "s"} on ${date}${miles ? ` at ${miles.toLocaleString("en-US")} mi` : ""}.`
        : "Saved the odometer reading.";
    }
    URL.revokeObjectURL(s.preview);
    setS({ step: "done", message });
  }

  const set = (k: string, v: string) => setS((cur) => (cur.step === "review" ? { ...cur, fields: { ...cur.fields, [k]: v } } : cur));
  const input = (k: string, label: string, type = "text", extra: Partial<React.InputHTMLAttributes<HTMLInputElement>> = {}) => (
    <label key={k}>
      {label}
      <input type={type} value={s.step === "review" ? s.fields[k] ?? "" : ""} onChange={(e) => set(k, e.target.value)} {...extra} />
    </label>
  );

  return (
    <section className="panel scan">
      <h2>Scan a document</h2>
      <p className="sub">
        Photograph a service receipt, insurance card or registration and the app fills in your garage. You check everything before it&apos;s saved.
        Photos are read on this device and never uploaded.
      </p>

      <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      <input ref={library} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />

      {(s.step === "idle" || s.step === "done" || s.step === "error") && (
        <>
          {s.step === "done" && <p className="pill ok" style={{ display: "inline-block", marginTop: 0 }}>{s.message}</p>}
          {s.step === "error" && <p className="field-error" style={{ marginTop: 0 }}>{s.message}</p>}
          <div className="row">
            <button className="btn" onClick={() => camera.current?.click()}>Take a photo</button>
            <button className="btn ghost" onClick={() => library.current?.click()}>Choose a photo</button>
          </div>
        </>
      )}

      {s.step === "reading" && (
        <div className="scan-work">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.preview} alt="The photo being read" className="scan-preview" />
          <div style={{ flex: 1 }}>
            <p className="hud" style={{ marginTop: 0 }}>
              {s.status.startsWith("recognizing") ? "Reading the text" : "Loading the reader (first time only)"}… {Math.round(s.progress * 100)}%
            </p>
            <div className="track scan-track"><span className="fill" style={{ display: "block", width: `${Math.round(s.progress * 100)}%` }} /></div>
          </div>
        </div>
      )}

      {s.step === "review" && (
        <form className="scan-work" onSubmit={save}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.preview} alt="The scanned document" className="scan-preview" />
          <div className="stack" style={{ flex: 1, minWidth: 0 }}>
            <label>
              This looks like a
              <select value={s.kind} onChange={(e) => { const kind = e.target.value as ScanKind; setS({ ...s, kind, ...fill(kind, s.text, car) }); }}>
                {(Object.keys(KIND_NAME) as ScanKind[]).map((k) => <option key={k} value={k}>{KIND_NAME[k]}</option>)}
              </select>
            </label>
            <VinCheck text={s.text} car={car} />

            {s.kind === "insurance" && (
              <div className="specs">
                {input("company", "Insurance company")}
                {input("policy", "Policy number", "text", { autoComplete: "off" })}
                {input("phone", "Claims or agent phone", "tel")}
                {input("expires", "Policy expires", "date")}
              </div>
            )}
            {s.kind === "registration" && (
              <div className="specs">
                {input("plate", "License plate", "text", { autoComplete: "off" })}
                <label>
                  State
                  <select value={s.fields.state ?? ""} onChange={(e) => set("state", e.target.value)}>
                    <option value="">Choose…</option>
                    {STATES.map((st) => <option key={st}>{st}</option>)}
                  </select>
                </label>
                {input("expires", "Tag expires", "date")}
              </div>
            )}
            {s.kind === "receipt" && (
              <>
                <div className="specs">
                  {input("date", "Service date", "date")}
                  {input("miles", "Mileage", "number", { min: 0, required: true, inputMode: "numeric" })}
                  {input("note", "Shop and total (note)")}
                </div>
                <fieldset className="scan-services">
                  <legend className="hud">Services done ({s.services.length} found)</legend>
                  {items.map((it) => (
                    <label key={it.id} className="check">
                      <input
                        type="checkbox"
                        checked={s.services.includes(it.id)}
                        onChange={(e) => setS({ ...s, services: e.target.checked ? [...s.services, it.id] : s.services.filter((x) => x !== it.id) })}
                      />
                      {it.name}
                    </label>
                  ))}
                </fieldset>
              </>
            )}

            <details className="scan-text">
              <summary className="hud">What the app read</summary>
              <pre>{s.text.trim()}</pre>
            </details>
            <div className="row">
              <button className="btn small">Save to my garage</button>
              <button type="button" className="btn ghost small" onClick={reset}>Cancel</button>
            </div>
          </div>
        </form>
      )}
    </section>
  );
}

function VinCheck({ text, car }: { text: string; car: Car }) {
  const vins = findVins(text);
  if (!vins.length) return null;
  if (vins.includes(car.vin.toUpperCase())) return <p className="pill ok" style={{ display: "inline-block", margin: 0 }}>VIN matches this car</p>;
  return <p className="field-warn" style={{ margin: 0 }}>This document shows VIN {vins[0]}, which doesn&apos;t match this car ({car.vin}). Make sure it&apos;s the right car before saving.</p>;
}
