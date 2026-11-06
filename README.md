# Vinsight

**Your car, fully decoded.** Enter your VIN and Vinsight shows a 3D holographic map of your exact vehicle. It tells you when service is due, which oil and tire pressure your car takes, which jobs you can do yourself, which problems are common for your model, and where to buy the cheapest part that fits.

**Status:** the landing page is built. It includes a live demo that decodes VINs and pulls recalls and complaints from NHTSA. The full app is in planning. See [PLAN.md](PLAN.md) for the landing page plan.

## Quick start

```bash
git clone https://github.com/PrestonBaumgart/Car-stuff.git
cd Car-stuff
```

To see the page, open `index.html` in a browser. There's no build step and nothing to install.

Live VIN lookups need the page to be served over the web, not opened as a local file. You can use GitHub Pages (below) or any static server, such as `npx serve .`.

## What's in the repo

```
.
├── index.html                  Landing page: 3D car, VIN decoder, health, DIY, known issues
├── src/lib/nhtsa.js            NHTSA client: VIN check digit, decode, recalls, complaints
├── .github/workflows/pages.yml Publishes the site to GitHub Pages on push to main
├── PLAN.md                     Landing page plan
├── README.md
└── LICENSE                     MIT
```

## What the app will do

| Feature | What the user gets |
|---|---|
| VIN onboarding | Year, make, model, trim, engine and transmission from 17 characters. The check digit is validated before any lookup. |
| Health dashboard | A health score and a service queue sorted into overdue, due soon and OK, driven by an odometer log. |
| Specs | Oil grade and capacity, coolant, transmission fluid, brake fluid, tire pressure, and bulb and wiper sizes. |
| DIY guide | Jobs rated by difficulty, with time, tools, torque specs, and shop cost vs. DIY cost. |
| Known issues | Recalls and the most-reported owner complaints for the year, make and model. |
| 3D parts bay | Tap any part on the holographic car to see its service info and the cheapest listing that fits. |
| Alerts | A notice when service is due, a new recall appears, or a part drops in price. |

## Data sources

| Need | Source | Cost |
|---|---|---|
| VIN decode | NHTSA vPIC: `vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/{vin}?format=json` | Free, no key |
| Recalls | NHTSA: `api.nhtsa.gov/recalls/recallsByVehicle?make=&model=&modelYear=` | Free, no key |
| Owner complaints | NHTSA: `api.nhtsa.gov/complaints/complaintsByVehicle?make=&model=&modelYear=` | Free, no key |
| Maintenance schedule and repair costs | CarMD API, or a similar provider such as Vehicle Databases or CarsXE | Paid key |
| Part prices and fitment | eBay Browse API, using item search plus its compatibility check | Free developer key |
| Affiliate part links | Amazon and RockAuto | Affiliate |

Some limits to keep in mind:

- **Recalls:** NHTSA lists recalls by year, make and model, not by VIN. Send users to nhtsa.gov/recalls to check whether a recall is still open on their car.
- **Complaints:** these are unverified reports from owners.
- **Fitment:** eBay's fitment comes from sellers and can be wrong, so show it as a guide, not a guarantee.
- **API keys:** keep paid keys on the server. The browser should call the app's own `/api/*` routes, never a paid API directly.

## Planned architecture

- **Frontend:** Next.js with React Three Fiber for the 3D parts bay.
- **Backend:** serverless `/api/*` routes:
  - `vehicle/decode`
  - `safety/issues` (cached for 24 hours)
  - `maintenance/schedule`
  - `parts/search`
  - a daily alerts job
- **Database:** Postgres with auth (Supabase), storing users, vehicles, odometer logs, service events, alerts, and cached part prices.
- **Provider adapters:** each maintenance and parts source sits behind one shared interface. That way you can swap vendors without touching the UI.

**How parts are ranked:**
1. Keep only parts that fit the car.
2. Drop sellers with low feedback.
3. Sort by total price (item plus shipping) within each quality tier: OE, premium, mid-range and budget.

## Roadmap

- [x] Landing page with live VIN decoding, recalls and complaints
- [ ] App scaffold, sign-in and "My garage"
- [ ] Maintenance schedule and service queue
- [ ] Odometer log and reminders, by miles or months, whichever comes first
- [ ] Parts search with fitment checks and ranking
- [ ] DIY job library
- [ ] 3D parts bay with body-type models: sedan, SUV, truck and coupe
- [ ] Email and push alerts
- [ ] Mobile app and OBD-II dongle support

## Deploy to GitHub Pages

1. Push to `main`:

   ```bash
   git add .
   git commit -m "Update site"
   git push -u origin main
   ```

2. In the repo on GitHub, open **Settings → Pages** and set **Source** to **GitHub Actions**.

After that, every push to `main` republishes the site.

## Disclaimer

Vehicle data comes from NHTSA's public APIs. This project isn't affiliated with NHTSA or with any parts retailer. Cost figures are typical estimates. Always confirm part numbers and torque specs for your exact vehicle.

## License

MIT
