"use client";

import { useEffect, useState } from "react";
import { getComplaints, getRecalls, type ComplaintSummary, type Recall } from "@/lib/nhtsa";
import { fmtDate } from "@/lib/format";
import type { Car } from "@/lib/types";

type Load<T> = { state: "loading" } | { state: "error" } | { state: "ready"; data: T };

function useNhtsa<T>(fn: () => Promise<T>, deps: unknown[]): Load<T> {
  const [result, setResult] = useState<Load<T>>({ state: "loading" });
  useEffect(() => {
    let live = true;
    setResult({ state: "loading" });
    fn().then(
      (data) => live && setResult({ state: "ready", data }),
      () => live && setResult({ state: "error" }),
    );
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return result;
}

/** NHTSA dates look like "26/08/2023" (dd/mm/yyyy). */
function recallDate(raw: string) {
  const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? fmtDate(`${m[3]}-${m[2]}-${m[1]}`) : raw;
}

export function KnownIssues({ car }: { car: Car }) {
  const ymm = { year: car.year, make: car.make, model: car.model };
  const key = [car.year, car.make, car.model];
  const recalls = useNhtsa(() => getRecalls(ymm), key);
  const complaints = useNhtsa(() => getComplaints(ymm), key);

  return (
    <div className="grid two">
      <section className="panel">
        <h2>Recalls</h2>
        <p className="sub">
          Recalls for every {car.year} {car.model}. Check whether yours is still open at{" "}
          <a href={`https://www.nhtsa.gov/recalls?vin=${car.vin}`} target="_blank" rel="noopener">nhtsa.gov/recalls</a>.
        </p>
        {recalls.state === "loading" && <p className="muted">Checking NHTSA…</p>}
        {recalls.state === "error" && <p className="field-error">Couldn't load recalls from NHTSA. Try again later.</p>}
        {recalls.state === "ready" && (recalls.data.length === 0
          ? <p className="pill ok" style={{ display: "inline-block" }}>No recalls on file</p>
          : <RecallList recalls={recalls.data} />)}
      </section>

      <section className="panel">
        <h2>Common problems</h2>
        <p className="sub">What owners report most to NHTSA. These are unverified owner complaints, but patterns are worth watching.</p>
        {complaints.state === "loading" && <p className="muted">Checking NHTSA…</p>}
        {complaints.state === "error" && <p className="field-error">Couldn't load complaints from NHTSA. Try again later.</p>}
        {complaints.state === "ready" && <ComplaintBars summary={complaints.data} />}
      </section>
    </div>
  );
}

function RecallList({ recalls }: { recalls: Recall[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? recalls : recalls.slice(0, 4);
  return (
    <>
      {shown.map((r) => (
        <div key={r.campaign} className="issue">
          <h3>
            {r.parkIt && <span className="pill overdue" style={{ marginRight: 8 }}>Park it</span>}
            {r.component}
          </h3>
          <p>{r.summary}</p>
          <p className="hud" style={{ marginTop: 6 }}>Campaign {r.campaign} · {recallDate(r.reportDate)}</p>
        </div>
      ))}
      {recalls.length > 4 && (
        <button className="btn ghost small" onClick={() => setAll(!all)}>
          {all ? "Show fewer" : `Show all ${recalls.length}`}
        </button>
      )}
    </>
  );
}

function ComplaintBars({ summary }: { summary: ComplaintSummary }) {
  if (summary.total === 0) return <p className="pill ok" style={{ display: "inline-block" }}>No complaints on file</p>;
  const max = summary.topComponents[0]?.count || 1;
  return (
    <>
      <p className="hud" style={{ marginTop: 0 }}>{summary.total.toLocaleString("en-US")} complaints</p>
      {summary.topComponents.map((c) => (
        <div key={c.component} className="bar">
          <span className="label" title={c.component}>{c.component.toLowerCase()}</span>
          <span className="track"><span className="fill" style={{ display: "block", width: `${(c.count / max) * 100}%` }} /></span>
          <span className="hud">{c.count}</span>
        </div>
      ))}
    </>
  );
}
