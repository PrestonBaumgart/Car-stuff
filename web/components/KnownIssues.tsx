"use client";

import { useEffect, useState } from "react";
import { getComplaints, getRecalls, type ComplaintDetail, type ComplaintSummary, type Recall } from "@/lib/nhtsa";
import { guideFor } from "@/lib/problem-guide";
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
        <p className="sub">What owners report most to NHTSA, with what each problem is and how it&apos;s usually fixed. These are unverified owner complaints, but patterns are worth watching.</p>
        {complaints.state === "loading" && <p className="muted">Checking NHTSA…</p>}
        {complaints.state === "error" && <p className="field-error">Couldn't load complaints from NHTSA. Try again later.</p>}
        {complaints.state === "ready" && <ComplaintList summary={complaints.data} recalls={recalls.state === "ready" ? recalls.data : []} />}
      </section>
    </div>
  );
}

// A recall's component reads like "ENGINE AND ENGINE COOLING:ENGINE"; complaints use "ENGINE". Match on the first word.
const area = (component: string) => component.split(/[:,/ ]/)[0].toUpperCase();

function RecallList({ recalls }: { recalls: Recall[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? recalls : recalls.slice(0, 4);
  return (
    <>
      {shown.map((r) => (
        <details key={r.campaign} className="issue recall">
          <summary>
            <h3>
              {r.parkIt && <span className="pill overdue" style={{ marginRight: 8 }}>Park it</span>}
              {r.component}
            </h3>
            <p>{r.summary}</p>
            <span className="more hud">What can happen · The fix</span>
          </summary>
          {r.consequence && (
            <div className="what"><b className="hud">What can happen</b><p>{r.consequence}</p></div>
          )}
          {r.remedy && (
            <div className="how"><b className="hud">The fix</b><p>{r.remedy}</p></div>
          )}
          <p className="fine">Recall repairs are free at any authorized dealer. Call with your VIN to check whether yours is done and book it.</p>
          <p className="hud" style={{ marginTop: 6 }}>Campaign {r.campaign} · {recallDate(r.reportDate)}</p>
        </details>
      ))}
      {recalls.length > 4 && (
        <button className="btn ghost small" onClick={() => setAll(!all)}>
          {all ? "Show fewer" : `Show all ${recalls.length}`}
        </button>
      )}
    </>
  );
}

function ComplaintList({ summary, recalls }: { summary: ComplaintSummary; recalls: Recall[] }) {
  if (summary.total === 0) return <p className="pill ok" style={{ display: "inline-block" }}>No complaints on file</p>;
  const max = summary.topComponents[0]?.count || 1;
  return (
    <>
      <p className="hud" style={{ marginTop: 0 }}>{summary.total.toLocaleString("en-US")} complaints · tap a problem for what owners report and how it&apos;s fixed</p>
      {summary.topComponents.map((c) => (
        <Problem key={c.component} c={c} max={max} recalls={recalls.filter((r) => area(r.component) === area(c.component))} />
      ))}
    </>
  );
}

function Problem({ c, max, recalls }: { c: ComplaintDetail; max: number; recalls: Recall[] }) {
  const guide = guideFor(c.component);
  const [more, setMore] = useState(false);
  const reports = more ? c.reports : c.reports.slice(0, 2);
  const flags = [
    c.crashes && `${c.crashes} crash${c.crashes === 1 ? "" : "es"}`,
    c.fires && `${c.fires} fire${c.fires === 1 ? "" : "s"}`,
    c.injuries && `${c.injuries} injur${c.injuries === 1 ? "y" : "ies"}`,
  ].filter(Boolean);
  return (
    <details className="problem">
      <summary className="bar">
        <span className="label" title={c.component}>{c.component.toLowerCase()}</span>
        <span className="track"><span className="fill" style={{ display: "block", width: `${(c.count / max) * 100}%` }} /></span>
        <span className="hud">{c.count}</span>
      </summary>
      <div className="problem-body">
        <div className="what">
          <b className="hud">What it is</b>
          <p>{guide.what}</p>
        </div>
        {(c.symptoms.length > 0 || flags.length > 0) && (
          <div className="what">
            <b className="hud">What owners report</b>
            {flags.length > 0 && <p className="field-error" style={{ margin: "4px 0 0" }}>Reported with {flags.join(", ")}.</p>}
            <ul className="symptoms">
              {c.symptoms.map((s) => (
                <li key={s.label}>
                  <span>{s.label}</span>
                  <span className="hud">{s.count} of {c.count}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {reports.length > 0 && (
          <div className="what">
            <b className="hud">In owners&apos; words</b>
            {reports.map((r, i) => (
              <blockquote key={i}>
                {r.text.length > 320 ? r.text.slice(0, 320).replace(/\s+\S*$/, "") + "…" : r.text}
                {r.date && <cite>{fmtDate(r.date)}</cite>}
              </blockquote>
            ))}
            {c.reports.length > 2 && (
              <button className="btn ghost small" onClick={() => setMore(!more)}>{more ? "Fewer reports" : `More reports (${c.reports.length})`}</button>
            )}
          </div>
        )}
        <div className="how">
          <b className="hud">How it&apos;s handled</b>
          {recalls.length > 0 && (
            <p className="field-warn" style={{ margin: "4px 0 0" }}>
              {recalls.length} recall{recalls.length === 1 ? "" : "s"} on this system for your model year: see Recalls.
            </p>
          )}
          <ol>{guide.how.map((h) => <li key={h}>{h}</li>)}</ol>
        </div>
      </div>
    </details>
  );
}
