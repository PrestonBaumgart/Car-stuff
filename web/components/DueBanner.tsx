"use client";

import Link from "next/link";
import { carHref, carTitle, fmtDate } from "@/lib/format";
import { DOC_NAME, docLabel, dueDocs } from "@/lib/reminders";
import type { Car } from "@/lib/types";

/** A warning across the top of the page when any insurance or registration is expired or about to be.
 * named: show which car each line is about (the garage page). */
export function DueBanner({ cars, named = false }: { cars: Car[]; named?: boolean }) {
  const due = dueDocs(cars);
  if (!due.length) return null;
  const expired = due.some((d) => d.state.status === "expired");
  return (
    <div className={`due-banner${expired ? " expired" : ""}`} role="status">
      <b className="hud">{expired ? "Action needed" : "Coming up"}</b>
      <ul>
        {due.map(({ car, kind, state }) => (
          <li key={car.vin + kind}>
            {named && <><Link href={carHref(car.vin)}>{carTitle(car)}</Link>{" · "}</>}
            <strong>{DOC_NAME[kind]}</strong>: {docLabel(state).toLowerCase()} ({fmtDate(state.expires!)})
          </li>
        ))}
      </ul>
    </div>
  );
}
