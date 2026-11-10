"use client";

import { useEffect, useRef } from "react";
import type { Hologram, HologramVehicle } from "@/lib/hologram";
import { titleCase } from "@/lib/format";
import { savePaint } from "@/lib/garage-store";
import type { Car } from "@/lib/types";

function toVehicle(car: Car): HologramVehicle {
  const { displacement, cylinders, fuel } = car.engine;
  return {
    year: car.year,
    make: titleCase(car.make),
    model: car.model,
    trim: car.trim,
    engine: [displacement, cylinders && `${cylinders}-cyl`].filter(Boolean).join(" ") || null,
    cylinders,
    fuel,
    bodyClass: car.bodyClass,
  };
}

// Common factory colors. Anything else goes through the custom picker.
const PAINTS: [string, string][] = [
  ["White", "#e9ebee"], ["Silver", "#b8bdc4"], ["Gray", "#5c6168"], ["Black", "#121418"], ["Red", "#a3121c"],
  ["Blue", "#1f3f78"], ["Dark blue", "#17223b"], ["Orange", "#d0581b"], ["Green", "#3b5a3c"], ["Yellow", "#d9b51f"],
];
const DEFAULT_PAINT = "#1f3f78";

/** The interactive 3D car: whole car → engine bay → part with prices and order links. Same module the landing page demos. */
export function CarHologram({ car }: { car: Car }) {
  const ref = useRef<HTMLDivElement>(null);
  const holo = useRef<Hologram | null>(null);
  const vehicle = toVehicle(car);
  const key = JSON.stringify(vehicle);
  const paint = car.paint ?? DEFAULT_PAINT;

  useEffect(() => {
    let alive = true;
    // three.js is large and browser-only, so load it after the page renders.
    import("@/lib/hologram").then(({ createHologram }) => {
      if (!alive || !ref.current) return;
      holo.current = createHologram(ref.current, { vehicle, paint });
    });
    return () => {
      alive = false;
      holo.current?.destroy();
      holo.current = null;
    };
    // Created once per car; vehicle changes are pushed below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [car.vin]);

  useEffect(() => {
    holo.current?.setVehicle(vehicle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    holo.current?.setPaint(paint);
  }, [paint]);

  return (
    <section className="panel" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "20px 20px 0" }}>
        <h2>Parts bay</h2>
        <p className="sub">
          Tap the engine to open the bay, then any part to compare prices and order it. Prices are typical ranges; the buttons open live listings for your car.
        </p>
        <div className="paints" role="group" aria-label="Paint color">
          <span className="hud">Paint</span>
          {PAINTS.map(([name, hex]) => (
            <button
              key={hex}
              type="button"
              className="swatch"
              style={{ background: hex }}
              title={name}
              aria-label={name}
              aria-pressed={paint.toLowerCase() === hex}
              onClick={() => savePaint(car.vin, hex)}
            />
          ))}
          <label className="swatch custom" title="Custom color">
            <span className="sr-only">Custom color</span>
            <input type="color" value={paint} onChange={(e) => savePaint(car.vin, e.target.value)} />
          </label>
        </div>
      </div>
      <div ref={ref} className="holo-host" />
    </section>
  );
}
