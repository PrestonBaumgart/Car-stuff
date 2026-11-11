"use client";

import { useEffect, useRef } from "react";
import type { Hologram, HologramVehicle } from "@/lib/hologram";
import { titleCase } from "@/lib/format";
import { partHealth } from "@/lib/part-health";
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
    drive: car.drive,
    doors: car.doors ?? null,
    wheelbase: car.wheelbase ?? null,
  };
}

// One body color for every car: the hologram's signature blue.
const PAINT = "#1f3f78";

/** The interactive 3D car: engine bay, engine internals, underside and body parts, each with prices and order links. Same module the landing page demos. */
export function CarHologram({ car }: { car: Car }) {
  const ref = useRef<HTMLDivElement>(null);
  const holo = useRef<Hologram | null>(null);
  const vehicle = toVehicle(car);
  const key = JSON.stringify(vehicle);
  // Part health colors come from the service log; recomputed whenever the log or odometer changes.
  const health = partHealth(car);
  const healthKey = JSON.stringify(health);

  useEffect(() => {
    let alive = true;
    // three.js is large and browser-only, so load it after the page renders.
    import("@/lib/hologram").then(({ createHologram }) => {
      if (!alive || !ref.current) return;
      holo.current = createHologram(ref.current, { vehicle, paint: PAINT, health });
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
    holo.current?.setHealth?.(health);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [healthKey]);

  return (
    <section className="panel" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "20px 20px 0" }}>
        <h2>Parts bay</h2>
        <p className="sub">
          Use the tabs to open the engine bay, go inside the engine, put the car on the lift to see underneath, or check body panels and lights. Tap any part to compare prices and order it. Health colors show what was just serviced (green), what&apos;s getting old (orange), what&apos;s overdue (red) and what has no record (gray); turn them off with the Health button. Prices are typical ranges; the buttons open live listings for your car.
        </p>
      </div>
      <div ref={ref} className="holo-host" />
    </section>
  );
}
