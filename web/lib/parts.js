// Vinsight parts catalog, shared by the landing page (index.html) and the app (web/).
// Plain JavaScript with no dependencies so the landing page can load it as a browser module.

// price: typical [economy, OE-quality, genuine OEM] part cost in USD. Estimates for a midsize car; live listings open on the buy links.
// bay: lives in the engine bay, so it shows in the engine bay close-up.
export const PARTS = [
  { id:"oil", name:"Oil filter", sys:"Lubrication", q:"oil filter", every:"5k–7.5k mi", diff:1, shop:95, diy:38, price:[22,38,55], unit:"filter + 5 qt oil", bay:true, tip:"Buy the filter and oil together. Check the drain plug washer: a fresh crush washer costs under a dollar and stops slow drips." },
  { id:"airf", name:"Engine air filter", sys:"Intake", q:"engine air filter", every:"15k–30k mi", diff:1, shop:60, diy:16, price:[9,16,32], bay:true, tip:"Usually four clips, no tools. Hold the old one up to a light: if you can't see through it, it's done." },
  { id:"cabin", name:"Cabin air filter", sys:"Climate", q:"cabin air filter", every:"15k–25k mi", diff:1, shop:75, diy:14, price:[8,14,30], tip:"Lives behind the glovebox on most cars. Note the airflow arrow before you pull the old one." },
  { id:"plugs", name:"Spark plugs", sys:"Ignition", q:"spark plugs", every:"60k–105k mi", diff:3, shop:340, diy:65, price:[24,48,72], unit:"set", bay:true, tip:"Change them with the engine cold and torque to spec. On a V6 the rear bank takes the most patience." },
  { id:"coils", name:"Ignition coils", sys:"Ignition", q:"ignition coil", every:"When misfiring", diff:2, shop:420, diy:180, price:[22,48,105], unit:"each", bay:true, tip:"A misfire code like P0302 names the cylinder. Swap that coil with a neighbor: if the misfire moves, the coil is bad." },
  { id:"vcg", name:"Valve cover gaskets", sys:"Engine", q:"valve cover gasket set", every:"When leaking oil", diff:3, shop:380, diy:45, price:[18,35,70], unit:"set", bay:true, tip:"Burning-oil smell after a drive often means oil seeping onto the exhaust. Clean the old sealant off fully and torque bolts in the factory pattern." },
  { id:"pcv", name:"PCV valve", sys:"Emissions", q:"PCV valve", every:"60k mi", diff:1, shop:90, diy:12, price:[6,12,25], bay:true, tip:"Shake it: a good one rattles. A stuck PCV valve can cause oil leaks and a rough idle for a few dollars of part." },
  { id:"tbody", name:"Throttle body", sys:"Intake", q:"throttle body", every:"Clean every 30k mi", diff:2, shop:120, diy:10, price:[70,150,320], bay:true, tip:"Try a can of throttle body cleaner before buying one. Carbon buildup causes most rough idles." },
  { id:"belt", name:"Serpentine belt", sys:"Accessory drive", q:"serpentine belt", every:"60k–100k mi", diff:2, shop:180, diy:35, price:[18,32,60], bay:true, tip:"Photograph the belt routing before you take it off. Cracks across the ribs mean it's time." },
  { id:"tbelt", name:"Timing belt kit", sys:"Power train", q:"timing belt kit water pump", every:"90k–105k mi", diff:5, shop:950, diy:260, price:[110,190,340], unit:"kit", bay:true, tip:"Many V6s are interference engines: a snapped belt can wreck the valves. Do the water pump and tensioner at the same time." },
  { id:"wpump", name:"Water pump", sys:"Cooling", q:"water pump", every:"With timing belt", diff:4, shop:550, diy:90, price:[45,85,160], bay:true, tip:"Coolant drips from the weep hole or a wobbly pulley are the early signs. If it's behind the timing belt, replace both together." },
  { id:"thermo", name:"Thermostat", sys:"Cooling", q:"thermostat gasket", every:"When the gauge acts up", diff:2, shop:220, diy:30, price:[12,25,45], bay:true, tip:"Slow warm-up or weak heat means it's stuck open. Overheating can mean stuck closed. Use the factory temperature rating." },
  { id:"hoses", name:"Radiator hoses", sys:"Cooling", q:"radiator hose upper lower", every:"5–7 yrs", diff:2, shop:260, diy:50, price:[20,40,75], unit:"pair", bay:true, tip:"Squeeze them cold: soft, swollen or crunchy hoses are due. Replace the clamps too." },
  { id:"batt", name:"Battery", sys:"Electrical", q:"car battery", every:"3–5 yrs", diff:2, shop:260, diy:170, price:[120,170,230], bay:true, tip:"Disconnect negative first, reconnect it last. Many parts stores test your old battery and charging system free." },
  { id:"alt", name:"Alternator", sys:"Electrical", q:"alternator", every:"When it fails", diff:3, shop:650, diy:220, price:[140,220,420], bay:true, tip:"Dim lights and a battery that keeps dying point here. Test charging voltage at idle: about 13.8–14.5 V is healthy." },
  { id:"starter", name:"Starter motor", sys:"Electrical", q:"starter motor", every:"When it fails", diff:3, shop:520, diy:160, price:[90,150,320], bay:true, tip:"A single click with a good battery points to the starter or its relay. Check the cables and ground strap first." },
  { id:"o2", name:"Oxygen sensor", sys:"Emissions", q:"oxygen sensor upstream", every:"About 100k mi", diff:2, shop:320, diy:70, price:[30,60,140], unit:"each", bay:true, tip:"A sensor socket makes this a 20-minute job. Upstream and downstream sensors are different parts." },
  { id:"rad", name:"Radiator", sys:"Cooling", q:"radiator", every:"Coolant every 5 yrs", diff:3, shop:700, diy:190, price:[95,190,380], bay:true, tip:"Plastic end tanks crack with age. A coolant smell or a crusty seam is your early warning." },
  { id:"engine", name:"Engine mounts", sys:"Power train", q:"engine mount", every:"100k+ mi", diff:4, shop:480, diy:120, price:[45,120,260], unit:"each", bay:true, tip:"Heavy vibration at idle in Drive often means a worn engine mount, not the engine itself." },
  { id:"trans", name:"Transmission", sys:"Power train", q:"transmission filter ATF", every:"Fluid 30k–60k mi", diff:2, shop:180, diy:55, price:[28,55,95], unit:"filter + fluid", tip:"Use only the fluid type your manufacturer names. A drain-and-fill is safer than a pressure flush on high-mileage cars." },
  { id:"brakesF", name:"Front brakes", sys:"Braking", q:"front brake pads rotors", every:"30k–70k mi", diff:2, shop:450, diy:130, price:[70,130,260], unit:"axle kit", tip:"Squeal from the wear tab means pads are low. Grinding means metal on metal: replace rotors too." },
  { id:"brakesR", name:"Rear brakes", sys:"Braking", q:"rear brake pads rotors", every:"40k–80k mi", diff:2, shop:400, diy:115, price:[60,115,230], unit:"axle kit", tip:"Rear pads wear slower than fronts. Some rear calipers need a wind-back tool instead of a C-clamp." },
  { id:"tires", name:"Tires", sys:"Wheels", q:"tires", every:"Rotate every 5k–7.5k mi", diff:2, shop:40, diy:0, price:[90,140,220], unit:"each", tip:"Rotate at every other oil change. A penny in the tread: if you see all of Lincoln's head, you're under 2/32\"." },
  { id:"struts", name:"Struts and shocks", sys:"Suspension", q:"strut assembly", every:"50k–100k mi", diff:4, shop:900, diy:320, price:[220,320,640], unit:"pair", tip:"Complete strut assemblies avoid compressing springs yourself. Plan on an alignment afterward." },
  { id:"exhaust", name:"Catalytic converter", sys:"Exhaust", q:"catalytic converter", every:"When it fails", diff:4, shop:1600, diy:450, price:[180,450,1400], tip:"Code P0420 can be a bad O2 sensor, not the cat. Rule out the cheap sensor first." },
  { id:"lights", name:"Headlight bulbs", sys:"Lighting", q:"headlight bulb", every:"When dim or out", diff:1, shop:80, diy:22, price:[12,22,40], unit:"pair", tip:"Replace in pairs so the color and brightness match. Don't touch halogen glass with bare fingers." },
  { id:"wipers", name:"Wiper blades", sys:"Visibility", q:"wiper blades", every:"6–12 months", diff:1, shop:55, diy:24, price:[16,24,40], unit:"pair", tip:"Streaks and chatter mean the rubber has hardened. Snow and ice chew through them; winter blades hold up better." }
];

export const byId = Object.fromEntries(PARTS.map((p) => [p.id, p]));

export function money(n) { return "$" + n.toLocaleString("en-US"); }

export function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}

export function wrenches(n) {
  let h = '<span class="wrench" aria-label="Difficulty ' + n + ' of 5">';
  for (let i = 1; i <= 5; i++) h += '<i class="' + (i <= n ? "on" : "") + '"></i>';
  return h + "</span>";
}

/** vehicle: { year, make, model, trim, engine } */
export function carLabel(v) { return [v.year, v.make, v.model, v.trim].filter(Boolean).join(" "); }

/** Search links for a part on this vehicle. eBay is sorted by lowest price plus shipping. */
export function buyLinks(p, v, cls = { primary: "btn warm", secondary: "btn ghost" }) {
  const q = [v.year, v.make, v.model, v.engine, p.q].filter(Boolean).join(" ");
  const ebay = "https://www.ebay.com/sch/6030/i.html?_nkw=" + encodeURIComponent(q) + "&_sop=15";
  const rock = "https://www.rockauto.com/en/catalog/" + [String(v.make || "").toLowerCase(), v.year, String(v.model || "").toLowerCase()].map(encodeURIComponent).join(",");
  const amz = "https://www.amazon.com/s?k=" + encodeURIComponent(q);
  return '<a class="' + cls.primary + '" href="' + ebay + '" target="_blank" rel="noopener">Cheapest on eBay Motors</a>' +
         '<a class="' + cls.secondary + '" href="' + rock + '" target="_blank" rel="noopener">RockAuto catalog</a>' +
         '<a class="' + cls.secondary + '" href="' + amz + '" target="_blank" rel="noopener">Amazon</a>';
}

/** Economy / OE-quality / genuine OEM price tiles. */
export function tiers(p) {
  const names = ["Economy", "OE-quality", "Genuine OEM"];
  return '<div class="tiers">' + p.price.map((n, i) =>
    '<div class="tier' + (i === 0 ? " low" : "") + '"><div class="hud">' + names[i] + '</div><div class="val">' + money(n) + "</div></div>"
  ).join("") + "</div>" +
  '<p class="fine">Typical part price' + (p.unit ? ", " + esc(p.unit) : "") + ". The buy links show live listings, cheapest first.</p>";
}
