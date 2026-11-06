"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AddCarForm } from "@/components/AddCarForm";
import { HealthRing } from "@/components/HealthRing";
import { useGarage } from "@/lib/garage-store";
import { carHref, carTitle, fmtMiles } from "@/lib/format";
import { currentMiles, healthScore, serviceQueue } from "@/lib/maintenance";

export default function GaragePage() {
  const cars = useGarage();
  const router = useRouter();

  return (
    <>
      <div className="page-head">
        <div>
          <p className="hud">Vinsight / garage</p>
          <h1 className="display">My garage</h1>
        </div>
        {cars.length > 0 && <p className="muted">{cars.length} {cars.length === 1 ? "car" : "cars"}</p>}
      </div>

      <div className="stack">
        {cars.length > 0 ? (
          <div className="cars">
            {cars.map((car) => {
              const queue = serviceQueue(car);
              const overdue = queue.filter((q) => q.status === "overdue").length;
              const soon = queue.filter((q) => q.status === "due-soon").length;
              const miles = currentMiles(car);
              return (
                <Link key={car.vin} href={carHref(car.vin)} className="panel car-card">
                  <div className="meta">
                    <div>
                      <p className="hud" style={{ margin: "0 0 6px" }}>{car.vin}</p>
                      <div className="name">{carTitle(car)}</div>
                      <p className="muted" style={{ margin: "6px 0 0", fontSize: 14 }}>
                        {[car.trim, car.engine.displacement, miles != null && fmtMiles(miles)].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <HealthRing score={healthScore(queue)} />
                  </div>
                  <div className="counts">
                    {overdue > 0 && <span className="pill overdue">{overdue} overdue</span>}
                    {soon > 0 && <span className="pill due-soon">{soon} due soon</span>}
                    {overdue + soon === 0 && <span className="pill ok">Nothing due</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="panel empty">
            <h2>Your garage is empty</h2>
            <p className="sub">Add a car by VIN to get its service queue, recalls and common problems.</p>
          </div>
        )}

        <AddCarForm existingVins={cars.map((c) => c.vin)} onAdded={(vin) => router.push(carHref(vin))} />

        <p className="notice">
          Your garage is saved in this browser only. Accounts and syncing across devices are coming next.
        </p>
      </div>
    </>
  );
}
