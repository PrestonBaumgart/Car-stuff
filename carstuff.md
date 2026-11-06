# Vinsight

**Your car, fully decoded.** Enter a VIN and Vinsight builds a holographic 3D map of your exact vehicle. It tells you when service is due, which oil and tire pressure it takes, what you can fix yourself, which problems are common for your model, and where to buy the cheapest part that actually fits.

> Status: landing page + live VIN/recall/complaint demo. The full app is planned below.

---

## What's in this repo today

| Path | What it is |
|---|---|
| `index.html` | Maximalist 3D landing page. Three.js hologram car with 16 clickable parts, live VIN decoding, recalls and complaints from NHTSA, part-price links. |
| `src/lib/nhtsa.js` | Reusable, dependency-free NHTSA client (decode VIN, recalls, complaints, check-digit validation). |
| `.github/workflows/pages.yml` | Deploys the site to GitHub Pages on every push to `main`. |

Run it locally: open `index.html` in a browser. No build step.

---

## Features (product scope)

1. **VIN onboarding** – decode year, make, model, trim, engine, transmission, plant. Validate the check digit (9th character) before calling any API.
2. **Health dashboard** – health score, service queue (overdue / due soon / OK), odometer log, reminders by mileage *and* time.
3. **Specs** – oil grade and capacity, coolant, ATF, brake fluid, tire pressure (from the door placard spec), bulb and wiper sizes.
4. **DIY guide** – jobs ranked by difficulty (1–5 wrenches), time, tools, torque specs, shop cost vs. DIY cost, linked videos.
5. **Known issues** – open recalls and owner-complaint hot spots for the exact year/make/model.
6. **Parts bay (3D)** – "Jarvis-style" holographic car; tap a part to see service info and live prices, sorted cheapest first with fitment checks.
7. **Alerts** – push/email when something is due, a new recall appears, or a part drops in price.

---

## APIs

| Need | Provider | Cost | Notes |
|---|---|---|---|
| VIN decode | **NHTSA vPIC** `vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/{vin}?format=json` | Free, no key | ~150 fields. Batch endpoint takes 50 VINs. |
| Recalls | **NHTSA** `api.nhtsa.gov/recalls/recallsByVehicle?make=&model=&modelYear=` | Free, no key | By year/make/model, not VIN-specific. Link users to nhtsa.gov/recalls to confirm open status for their VIN. |
| Complaints | **NHTSA** `api.nhtsa.gov/complaints/complaintsByVehicle?make=&model=&modelYear=` | Free, no key | Tally `components` to find common failures. Unverified owner reports. |
| Maintenance schedule, repair costs, OBD-II codes | **CarMD API** (`api.carmd.com/v3.0/...`) or Vehicle Databases / CarsXE | Paid, key | OEM schedule by mileage, parts + labor estimates, check-engine diagnostics. |
| Parts prices + fitment | **eBay Browse API** (`item_summary/search`, category 6030) + `check_compatibility` | Free dev key | Sort by price; fitment depends on seller data, so show it as a signal, not a guarantee. |
| Parts (affiliate) | Amazon Product Advertising API, RockAuto (links only, no public API) | Affiliate | Revenue path via affiliate commissions. |
| Live car data (later) | Smartcar API or an OBD-II Bluetooth dongle | Paid / hardware | Real odometer, fuel, tire pressure, check-engine codes. |

**Never call paid APIs from the browser.** Keys live in the backend (serverless functions); the frontend calls your own `/api/*` routes.

---

## Architecture

```
┌──────────── Frontend (Next.js + React Three Fiber) ────────────┐
│ Landing · Garage · Dashboard · Parts Bay 3D · DIY · Alerts     │
└───────────────┬────────────────────────────────────────────────┘
                │  /api/*
┌───────────────▼──────────── Backend (serverless) ──────────────┐
│ vehicle.decode   → NHTSA vPIC                                  │
│ safety.issues    → NHTSA recalls + complaints (cache 24h)      │
│ maint.schedule   → MaintenanceProvider (CarMD adapter)         │
│ parts.search     → PartsProvider[] (eBay, Amazon) → rank       │
│ alerts.cron      → daily job: due items, new recalls, prices   │
└───────────────┬────────────────────────────────────────────────┘
                │
        Postgres (Supabase) + Auth
        users · vehicles · odometer_logs · service_events · alerts · part_cache
```

Provider adapters keep the app independent of any one vendor:

```ts
interface PartsProvider {
  search(vehicle: Vehicle, partType: string): Promise<PartOffer[]>; // price, shipping, brand, fitment
}
interface MaintenanceProvider {
  schedule(vin: string, mileage: number): Promise<ServiceItem[]>;
}
```

**Ranking "best and cheapest":** filter to `fitment = COMPATIBLE`, drop sellers under ~97% feedback, then sort by total price (item + shipping) within a brand tier (OE → Premium → Mid → Budget) so users can trade quality for price.

### 3D model plan
- Today: procedural Three.js primitives (works for every car, zero assets).
- Next: a few generic body GLB models (sedan, SUV, truck, coupe) chosen from vPIC `BodyClass`, with named nodes (`engine`, `battery`, `brake_FL`…) mapped to part types.
- Later: exploded views per system (brakes, cooling, suspension) and hotspot → part-diagram drill-down.

---

## Roadmap

- [x] Landing page with live VIN decode, recalls, complaints
- [ ] Next.js app scaffold, Supabase auth, "My garage"
- [ ] Maintenance provider adapter + service queue
- [ ] Odometer log + reminder engine (mileage and months, whichever first)
- [ ] eBay parts search with fitment + ranking
- [ ] DIY job library (difficulty, tools, torque specs, videos)
- [ ] React Three Fiber parts bay with GLB body types
- [ ] Alerts (email/push) + daily cron
- [ ] Mobile app (React Native / Expo) and OBD-II integration

---

## Deploy on GitHub

```bash
git init && git add . && git commit -m "Vinsight landing page"
git branch -M main
git remote add origin https://github.com/levimackay/Carthing.git
git push -u origin main
```

Then in the repo: **Settings → Pages → Source: GitHub Actions**. The included workflow publishes the site; live NHTSA lookups work from the hosted page.

---

## Disclaimer

Vehicle data comes from NHTSA public APIs. Vinsight is not affiliated with NHTSA or any retailer. Cost figures on the landing page are typical estimates. Always confirm part numbers and torque specs for your exact vehicle.

## License

MIT
