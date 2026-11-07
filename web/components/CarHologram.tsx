"use client";

import { useEffect, useRef } from "react";
import type { Hologram, HologramVehicle } from "@/lib/hologram";
import { titleCase } from "@/lib/format";
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
  };
}

/** The interactive 3D car: whole car → engine bay → part with prices and order links. Same module the landing page demos. */
export function CarHologram({ car }: { car: Car }) {
  const ref = useRef<HTMLDivElement>(null);
  const holo = useRef<Hologram | null>(null);
  const vehicle = toVehicle(car);
  const key = JSON.stringify(vehicle);

  useEffect(() => {
    let alive = true;
    // three.js is large and browser-only, so load it after the page renders.
    import("@/lib/hologram").then(({ createHologram }) => {
      if (!alive || !ref.current) return;
      holo.current = createHologram(ref.current, { vehicle });
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

  return (
    <section className="panel" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "20px 20px 0" }}>
        <h2>Parts bay</h2>
        <p className="sub">
          Tap the engine to open the bay, then any part to compare prices and order it. Prices are typical ranges; the buttons open live listings for your car.
        </p>
      </div>
      <div ref={ref} className="holo-host" />
    </section>
  );
}
