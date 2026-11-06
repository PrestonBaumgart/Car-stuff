"use client";

// One page for every car, keyed by ?vin=. Static export can't pre-render a route per VIN,
// and the garage lives in the browser anyway.
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { HealthRing } from "@/components/HealthRing";
import { KnownIssues } from "@/components/KnownIssues";
import { OdometerCard } from "@/components/OdometerCard";
import { ServiceQueue } from "@/components/ServiceQueue";
import { SpecsCard } from "@/components/SpecsCard";
import { removeCar, removeService, renameCar, useCar } from "@/lib/garage-store";
import { carTitle, fmtDate, fmtMiles } from "@/lib/format";
import { DEFAULT_SCHEDULE, healthScore, serviceQueue } from "@/lib/maintenance";
import type { Car } from "@/lib/types";

export default function CarPage() {
  return (
    <Suspense fallback={<p className="muted">Loading…</p>}>
      <CarView />
    </Suspense>
  );
}

function CarView() {
  const vin = useSearchParams().get("vin");
  const car = useCar(vin);

  if (!car) {
    return (
      <div className="panel empty">
        <h2>Car not found</h2>
        <p className="sub">It isn't in this browser's garage. It may have been added on another device.</p>
        <Link className="btn" href="/">Back to my garage</Link>
      </div>
    );
  }

  const queue = serviceQueue(car);
  const score = healthScore(queue);

  return (
    <div className="stack">
      <Header car={car} score={score} />
      <div className="grid two">
        <ServiceQueue car={car} queue={queue} />
        <div className="stack">
          <OdometerCard car={car} />
          <SpecsCard key={car.vin} car={car} />
        </div>
      </div>
      <KnownIssues car={car} />
      <History car={car} />
      <Danger car={car} />
    </div>
  );
}

function Header({ car, score }: { car: Car; score: number }) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(car.nickname ?? "");
  const facts: [string, string | null][] = [
    ["Trim", car.trim],
    ["Engine", [car.engine.displacement, car.engine.cylinders && `${car.engine.cylinders} cyl`].filter(Boolean).join(" ") || null],
    ["Fuel", car.engine.fuel],
    ["Drive", car.drive],
    ["Transmission", car.transmission],
    ["Body", car.bodyClass],
  ];

  return (
    <section className="panel" style={{ display: "grid", gap: 20 }}>
      <div className="page-head" style={{ margin: 0, alignItems: "center" }}>
        <div style={{ minWidth: 0 }}>
          <p className="hud" style={{ margin: "0 0 8px" }}>
            <Link href="/" style={{ color: "inherit" }}>Garage</Link> / {car.vin}
          </p>
          {renaming ? (
            <form className="row" onSubmit={(e) => { e.preventDefault(); renameCar(car.vin, name); setRenaming(false); }}>
              <label>
                Nickname
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder={carTitle({ ...car, nickname: undefined })} autoFocus />
              </label>
              <button className="btn small">Save</button>
            </form>
          ) : (
            <h1 className="display" style={{ fontSize: "clamp(34px, 6vw, 56px)", lineHeight: 0.95 }}>
              {carTitle(car)}{" "}
              <button className="btn ghost small" onClick={() => setRenaming(true)} style={{ verticalAlign: "middle" }}>
                Rename
              </button>
            </h1>
          )}
          {car.nickname && <p className="muted" style={{ margin: "6px 0 0" }}>{carTitle({ ...car, nickname: undefined })}</p>}
        </div>
        <HealthRing score={score} big />
      </div>
      <dl className="facts">
        {facts.filter(([, v]) => v).map(([k, v]) => (
          <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
        ))}
      </dl>
    </section>
  );
}

function History({ car }: { car: Car }) {
  if (!car.serviceLog.length) return null;
  const names = Object.fromEntries(DEFAULT_SCHEDULE.map((i) => [i.id, i.name]));
  const rows = car.serviceLog.map((s, index) => ({ ...s, index })).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <section className="panel">
      <h2>Service history</h2>
      <div className="table-scroll">
        <table>
          <thead>
            <tr><th>Date</th><th>Service</th><th>Miles</th><th /></tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.index}>
                <td>{fmtDate(s.date)}</td>
                <td>{names[s.itemId] ?? s.itemId}</td>
                <td>{fmtMiles(s.miles)}</td>
                <td style={{ textAlign: "right" }}>
                  <button className="btn ghost small" onClick={() => removeService(car.vin, s.index)} aria-label={`Delete ${names[s.itemId]} on ${s.date}`}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Danger({ car }: { car: Car }) {
  const router = useRouter();
  return (
    <div className="row" style={{ justifyContent: "flex-end" }}>
      <button
        className="btn danger small"
        onClick={() => {
          if (confirm(`Remove ${carTitle(car)} and its service history from your garage?`)) {
            removeCar(car.vin);
            router.push("/");
          }
        }}
      >
        Remove car
      </button>
    </div>
  );
}
