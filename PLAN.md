# Landing page plan

The landing page has one job: get a visitor to type their VIN and see their own car come alive in 3D. Everything else on the page backs up that moment.

A checked box below means `index.html` already does it. An empty box means it's still to do.

## 1. Goals

| Goal | How we'll measure it |
|---|---|
| Visitors try the demo | Share of visitors who submit a VIN. Target: 25% or more. |
| Visitors explore the 3D car | Share who tap at least one part. Target: 40% or more of those who decoded a VIN. |
| Visitors join the waitlist | Email sign-ups per visit. Target: 5% or more. |
| The page loads fast | Largest contentful paint under 2.5 s on a mid-range phone over 4G. |

## 2. Who it's for

- **DIY owners.** They do their own oil changes and brakes. They want the right part at the lowest price, plus torque specs.
- **"I just drive it" owners.** They want to know what's due and whether the shop is overcharging.
- **Used-car shoppers.** They want to check a VIN for recalls and common problems before buying.

## 3. Message

- **Headline:** "Your car, fully decoded."
- **One-line pitch:** Type your VIN to get your service schedule, fluids, tire pressure, the DIY jobs that save money, known problems, and the cheapest parts that fit, all on a 3D map of your car.
- **Proof points:**
  - Real government data from NHTSA.
  - Exact fit for your VIN.
  - Shows what you keep by doing a job yourself.

## 4. Page structure

| # | Section | Content | Interaction | Status |
|---|---|---|---|---|
| 0 | Top bar | Logo and anchor links | Sticky, with a blurred background | [x] |
| 1 | Hero | Headline, pitch, VIN input with a sample VIN, and the 3D hologram car | Check digit validated as you type; decode on submit; orbit and tap the car | [x] |
| 2 | Status ticker | Scrolling dashboard readouts (tire pressure, recalls, items due) | Ambient motion; stops when reduced motion is on | [x] |
| 3 | Parts bay | Grid of 16 parts and a detail card for the selected part | Tapping a part on the car or in the list highlights both. The card shows service interval, difficulty, savings and buy links. | [x] |
| 4 | Health | Health score gauge, service queue, tire pressures, fluids | Static example, clearly labeled | [x] |
| 5 | DIY savings | Table of jobs with difficulty, time, shop cost, DIY cost and savings | Sorting by savings | [ ] |
| 6 | Known issues | Complaint bar chart and recall list | Updates live after a VIN is decoded | [x] |
| 7 | How it works | Three steps: enter VIN, get your map, fix or buy | Steps animate in on scroll, starting from a visible state | [ ] |
| 8 | Waitlist | Email sign-up with the decoded car name filled in | Form with inline validation and a success state | [ ] |
| 9 | Open source / build | Data source cards and a clone command | Copy button on the command | [ ] |
| 10 | FAQ | Is my VIN private? Where does the data come from? Is it free? | Expand and collapse | [ ] |
| 11 | Footer | Data credits, disclaimer, GitHub link | — | [x] |

## 5. Visual direction: maximalist, 3D, immersive

- **World:** a garage bay at night, with a hologram projected over a lift.
- **Palette:**
  - Night blue-black background.
  - Hologram cyan for anything live or interactive.
  - Dash-lamp amber for "due soon" and calls to action.
  - Coral for recalls and critical items.
  - Green for items in spec.
- **Type:**
  - Big Shoulders Display, a tall condensed face, for huge headlines (one line outlined, one in a gradient).
  - Chakra Petch for HUD labels and data readouts.
  - IBM Plex Sans for body text.
- **Texture:**
  - Scanlines, radial light glows, and corner brackets around the 3D view.
  - Large outlined section numbers (01–05) that map to real page sections.
- **Motion:**
  - One standout moment: the scan plane sweeping across the car.
  - Ambient extras: slow auto-rotate, spinning floor rings, drifting particles.
  - Everything stops when the visitor's system asks for reduced motion.
- **Single theme:** dark only, chosen on purpose. The hologram depends on a dark ground.

## 6. 3D scene

| Element | Now | Next |
|---|---|---|
| Body | Wireframe car body built in code (works for any car) | Low-poly models for sedan, SUV, truck and coupe, picked from the body type NHTSA returns |
| Parts | 16 tappable shapes: engine, plugs, battery, oil filter, air filter, cabin filter, radiator, alternator, transmission, front and rear brakes, tires, struts, exhaust, headlights, wipers | Named parts in each model, plus an exploded view per system |
| Camera | Orbit with damping and auto-rotate; zoom and pan off | Smooth fly-to when a part is chosen |
| Feedback | Hover label; selected part pulses amber | Callout line from the part to its card |
| Fallback | Message when WebGL is missing; the parts list covers everything | Static poster image for slow devices |

**Performance budget:**
- Three.js about 600 KB, loaded from a CDN.
- Under 300 draw calls.
- Pixel ratio capped at 2.
- Pause rendering when the canvas is off-screen.

## 7. Data and demo behavior

1. The visitor types a VIN. The page checks length, blocks the letters I, O and Q, and checks the 9th-character check digit as they type.
2. On submit, the page decodes the VIN with NHTSA vPIC. The car name in the hero, the parts card and the buy links all update.
3. The page then fetches recalls and complaints for that year, make and model, and redraws the known-issues section.
4. If the network fails, the sample VIN falls back to a saved NHTSA snapshot. Any other VIN shows a clear message.
5. Buy links search eBay Motors (sorted by lowest total price), RockAuto and Amazon using year, make, model and engine. Real pricing comes later from the parts API on the backend.

**Labels:** every example number is marked "Example" until it comes from the user's real data.

## 8. Accessibility and mobile

- [x] Every part can be reached from the keyboard through the parts list, not only on the canvas.
- [x] Visible focus states and a live region for VIN status.
- [x] Reduced-motion support.
- [x] Layout works down to 400 px wide with no sideways scrolling.
- [ ] Check contrast on the outlined headline text.
- [ ] Make touch targets at least 44 px on the parts grid.

## 9. SEO and sharing

- [x] Title and meta description
- [ ] Open Graph and Twitter card image: a render of the hologram car
- [ ] Favicon and app icons
- [ ] Structured data for a software application

## 10. Analytics events

`vin_submit`, `vin_decode_ok`, `vin_decode_fail`, `part_select` (with part id), `buy_click` (with retailer and part), `waitlist_submit`.

Use a privacy-friendly tool such as Plausible, and never log full VINs.

## 11. Milestones

| Milestone | Scope | Estimate |
|---|---|---|
| M1: Ship v1 | Current page live on GitHub Pages with a custom domain | 1 day |
| M2: Convert | Waitlist form, How it works, FAQ, Open Graph image, analytics | 2–3 days |
| M3: Polish 3D | Body-type models, camera fly-to, callout lines, pause when off-screen | 1 week |
| M4: Real data | Backend routes for maintenance and parts, so live prices replace search links | 1–2 weeks |

## 12. Open questions

- **Product name:** keep "Vinsight," or brand the product to match the repo?
- **Waitlist:** where do sign-ups go (Supabase, Formspree or Buttondown)?
- **Domain:** which custom domain should the page use?
- **Revenue:** which affiliate programs (eBay Partner Network, Amazon Associates)? Affiliate links need a disclosure line on the page.
