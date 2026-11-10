// "My garage" storage. For now it lives in this browser's localStorage, so the app works with no account
// and no backend. When sign-in arrives, swap these functions for Supabase calls; the components only use this API.
"use client";

import { useSyncExternalStore } from "react";
import type { Car, OdometerEntry, ServiceEntry, Specs, Vehicle } from "./types";

const KEY = "vinsight.garage.v1";
const EMPTY: Car[] = [];

let cache: Car[] | null = null;
const listeners = new Set<() => void>();

function read(): Car[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Car[]) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(cars: Car[]) {
  cache = cars;
  try {
    localStorage.setItem(KEY, JSON.stringify(cars));
  } catch {
    // Storage full or blocked (private mode). Keep the in-memory copy so the session still works.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useGarage() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function useCar(vin: string | null) {
  const cars = useGarage();
  return vin ? cars.find((c) => c.vin === vin) : undefined;
}

function update(vin: string, fn: (car: Car) => Car) {
  write(read().map((c) => (c.vin === vin ? fn(c) : c)));
}

export function addCar(vehicle: Vehicle, miles?: number) {
  if (read().some((c) => c.vin === vehicle.vin)) return;
  const today = new Date().toISOString().slice(0, 10);
  const car: Car = {
    ...vehicle,
    addedAt: today,
    odometer: miles != null ? [{ date: today, miles }] : [],
    serviceLog: [],
    specs: {},
  };
  write([...read(), car]);
}

export function removeCar(vin: string) {
  write(read().filter((c) => c.vin !== vin));
}

export function renameCar(vin: string, nickname: string) {
  update(vin, (c) => ({ ...c, nickname: nickname.trim() || undefined }));
}

export function logOdometer(vin: string, entry: OdometerEntry) {
  update(vin, (c) => ({ ...c, odometer: [...c.odometer, entry].sort((a, b) => a.date.localeCompare(b.date)) }));
}

export function logService(vin: string, entry: ServiceEntry) {
  update(vin, (c) => ({ ...c, serviceLog: [...c.serviceLog, entry] }));
}

export function removeService(vin: string, index: number) {
  update(vin, (c) => ({ ...c, serviceLog: c.serviceLog.filter((_, i) => i !== index) }));
}

export function saveSpecs(vin: string, specs: Specs) {
  update(vin, (c) => ({ ...c, specs }));
}

export function savePaint(vin: string, paint: string) {
  update(vin, (c) => ({ ...c, paint }));
}
