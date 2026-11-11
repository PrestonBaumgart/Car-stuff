// Plain-English help for NHTSA complaint categories: what the system is, and how problems with it usually get
// diagnosed and fixed. Plus a symptom finder that reads owner complaint text for the most common symptoms.
// General guidance for owners, not a diagnosis: the steps start with what's free (recalls, warranty, codes).

export interface ProblemGuide {
  /** What the system is and does. */
  what: string;
  /** How problems are usually checked and fixed, cheapest and most likely first. */
  how: string[];
}

const FREE_FIRST = "Check for open recalls and technical service bulletins (TSBs) first: recall repairs are free at any dealer, and a TSB tells the shop the known fix.";

// First match wins, so specific categories come before broad ones.
const GUIDES: [RegExp, ProblemGuide][] = [
  [/^AIR ?BAGS?/i, {
    what: "The airbags, their crash sensors and the control module that decides when to fire them. An airbag warning light means the system may not deploy in a crash.",
    how: [FREE_FIRST, "An airbag light stores a code: a shop or dealer reads it with a scan tool that talks to the airbag module (basic code readers can't).", "Common causes are the clock spring in the steering wheel, seat-belt buckle sensors and connectors under the front seats.", "Don't repair airbags yourself: they can deploy with force while you work."],
  }],
  [/^SEAT ?BELTS?/i, {
    what: "Belts, buckles, retractors and pretensioners that tighten the belt in a crash.",
    how: [FREE_FIRST, "A belt that won't retract or latch usually needs a new retractor or buckle, which bolt in.", "After any crash where the pretensioners fired, they must be replaced."],
  }],
  [/HYBRID/i, {
    what: "The high-voltage battery, electric motor, inverter and the controls that blend electric and gas power.",
    how: [FREE_FIRST, "Hybrid parts carry a longer federal warranty: 8 years or 100,000 miles (10 years / 150,000 in some states).", "Warning messages store codes that a dealer or hybrid-capable shop can read.", "Never open high-voltage parts yourself: orange cables carry hundreds of volts."],
  }],
  [/ENGINE AND ENGINE COOLING|COOLING/i, {
    what: "The engine plus its cooling system: radiator, water pump, thermostat, hoses and coolant.",
    how: [FREE_FIRST, "Overheating or coolant loss: check the coolant level cold, look for drips and crusty white or green residue at hoses and the radiator.", "A pressure test finds slow leaks; a combustion-gas test checks for a head gasket.", "Stop driving if the temperature gauge climbs: overheating can ruin the engine."],
  }],
  [/^ENGINE/i, {
    what: "The engine itself: pistons, rings, bearings, valvetrain, and the sensors and computer that run it.",
    how: [FREE_FIRST, "Read the check-engine codes: many parts stores do it free. The code points to the system at fault.", "Burning oil or knocking: check the dipstick every fill-up; an oil-consumption test at the dealer documents it for warranty.", "Many engine defects have extended warranties: ask the dealer to look up your VIN.", "Stalling or no-start can be electrical, so the battery and charging system are worth testing first."],
  }],
  [/POWER ?TRAIN|TRANSMISSION|DRIVE ?LINE|DRIVETRAIN/i, {
    what: "The transmission and the parts that carry power to the wheels: torque converter or clutch, axles, differential, and the transmission computer.",
    how: [FREE_FIRST, "Shifting problems often store codes; a software update from the dealer fixes many of them.", "Check the fluid if your car has a dipstick: dark or burnt-smelling fluid means service is overdue.", "A drain-and-fill with the exact fluid your manual names is safer than a flush on high-mileage cars."],
  }],
  [/FUEL/i, {
    what: "Fuel tank, pump, lines, injectors and the evaporative-emissions system that traps fuel vapor.",
    how: [FREE_FIRST, "A fuel smell is never normal: have it checked before driving far.", "Hard starts or stalling can be a weak fuel pump; a shop checks fuel pressure.", "Evap check-engine codes often trace back to a loose or cracked gas cap."],
  }],
  [/SPEED CONTROL|ACCELERAT/i, {
    what: "Cruise control, the throttle and pedal sensors, and how the engine responds to the gas pedal.",
    how: [FREE_FIRST, "Surging or unwanted acceleration: shift to neutral and brake firmly, then have codes read.", "Floor mats stacked or out of place can hold the pedal down: use only the hooked factory mat.", "Throttle-body cleaning and pedal-sensor replacement fix many hesitation problems."],
  }],
  [/SERVICE BRAKES|BRAKE/i, {
    what: "Pads, rotors, calipers, brake lines and the ABS system that keeps wheels from locking.",
    how: [FREE_FIRST, "A soft pedal, pulling or grinding means stop driving and have the brakes inspected.", "An ABS light usually points to a wheel-speed sensor: the code names which wheel.", "Pads and rotors are a common DIY job; brake lines and ABS units are best left to a shop."],
  }],
  [/STEERING/i, {
    what: "The steering rack, tie rods, and the electric power-steering motor and sensors.",
    how: [FREE_FIRST, "Heavy steering or a steering warning light: restart the car once, then have the codes read.", "Clunks or play in the wheel usually mean worn tie rod ends; an alignment follows any repair.", "Electric power-steering faults are often covered by extended warranties or recalls."],
  }],
  [/SUSPENSION/i, {
    what: "Struts, springs, control arms, sway bar links and bushings that hold the wheels and soak up bumps.",
    how: [FREE_FIRST, "Clunks over bumps: worn sway-bar links are the cheapest, most common cause.", "Bouncing or nose-diving under braking means worn struts; replace them in pairs.", "Get an alignment after suspension work so the tires don't wear unevenly."],
  }],
  [/ELECTRICAL/i, {
    what: "Battery, alternator, wiring, fuses and the computers and screens that run the car's features.",
    how: [FREE_FIRST, "Test the battery and charging system first: many parts stores do it free in a few minutes.", "Warning lights and glitches often clear with a software update at the dealer.", "A battery that keeps dying with nothing obviously on can be a parasitic drain a shop measures fuse by fuse."],
  }],
  [/LIGHTING|LIGHTS?$/i, {
    what: "Headlights, taillights, turn signals and their bulbs, sockets and wiring.",
    how: [FREE_FIRST, "Check the bulb and fuse first; both are cheap.", "Water inside a lamp housing burns out bulbs: the housing or its seal needs replacing.", "Melted sockets or connectors point to a wiring fault worth fixing before it spreads."],
  }],
  [/VISIBILITY|WIPER|WINDSHIELD|GLASS/i, {
    what: "Windshield, wipers, washers, defrosters, mirrors and cameras that help you see.",
    how: [FREE_FIRST, "Streaking or chatter: new wiper blades.", "Wipers that stop: check the fuse, then the wiper motor and linkage.", "Fogging that won't clear can be a clogged cabin air filter or a heater-core leak (sweet smell, damp carpet)."],
  }],
  [/STRUCTURE|BODY|LATCH|LOCK|DOOR|HOOD|TRUNK|LIFTGATE/i, {
    what: "The body and frame, plus doors, hood, trunk or liftgate, and their latches and locks.",
    how: [FREE_FIRST, "A door, hood or liftgate that won't latch is a safety issue: get the latch checked.", "Rust through the floor, frame or subframe needs a body shop inspection.", "Liftgates that won't stay up usually need new gas struts, a quick DIY."],
  }],
  [/TIRES?|WHEELS?/i, {
    what: "Tires, wheels, lug nuts and the tire-pressure monitoring system (TPMS).",
    how: [FREE_FIRST, "Check pressure cold against the door-jamb sticker, not the tire sidewall.", "Uneven wear means alignment or suspension trouble.", "A TPMS light that stays on after filling the tires can be a dead sensor battery."],
  }],
  [/SEATS?/i, {
    what: "Seats, their tracks, recliners and heaters, and the sensors that tell the airbags who is sitting there.",
    how: [FREE_FIRST, "A seat that won't lock in place is a safety issue: don't drive with it loose.", "Heated seats that quit usually have a broken heater element or connector under the seat."],
  }],
  [/FORWARD COLLISION|LANE|BACK ?OVER|STABILITY|ELECTRONIC STABILITY|ADAS|CAMERA|PARKING/i, {
    what: "Driver-assist systems: automatic emergency braking, lane keeping, backup cameras and stability control.",
    how: [FREE_FIRST, "Sensors behind the grille or windshield need to be clean: dirt, snow and stickers confuse them.", "After a windshield replacement or front-end repair, these cameras and radars must be recalibrated.", "False braking or warnings are often fixed with a software update at the dealer."],
  }],
  [/EQUIPMENT|COMMUNICATION/i, {
    what: "Built-in equipment: infotainment, phone connectivity, climate controls and accessories.",
    how: [FREE_FIRST, "Most screen and connectivity glitches are fixed by a software update.", "Try a full reset: turn the car off, open and close the driver door, wait a few minutes, restart."],
  }],
];

const FALLBACK: ProblemGuide = {
  what: "Owners didn't name a specific system, or picked \"other\". The reports below show what they ran into.",
  how: [FREE_FIRST, "Have any warning-light codes read: many parts stores do it free.", "Write down when it happens (speed, temperature, weather): it helps a shop reproduce it."],
};

export function guideFor(component: string): ProblemGuide {
  return GUIDES.find(([re]) => re.test(component))?.[1] ?? FALLBACK;
}

// Symptoms owners describe, found by phrases in the complaint text.
export const SYMPTOMS: [string, RegExp][] = [
  ["Burning or losing oil", /burn(s|ing|ed)? (oil|through oil)|oil consumption|low oil|out of oil|add(ing|ed)? oil|consum(es|ing) oil/i],
  ["Engine failure or replacement", /engine (failure|failed|seized|blew|blown)|seized|new engine|replace(d|ment of)? (the )?engine|rod (knock|bearing)|piston/i],
  ["Stalling", /stall/i],
  ["Won't start", /won'?t start|would not start|wouldn'?t start|no start|fail(ed|s)? to start|did not start/i],
  ["Knocking or ticking", /knock|tick(ing)?|tapping|rattl/i],
  ["Check-engine or warning light", /check engine|engine light|warning light|malfunction indicator|dash(board)? lights/i],
  ["Loss of power", /los(s|t|ing) (of )?power|reduced power|limp mode|no power/i],
  ["Hesitation, jerking or slipping", /hesitat|jerk|lurch|surg|shudder|slip/i],
  ["Transmission or shifting", /transmission|shift|gear|cvt|ivt|clutch/i],
  ["Fire, smoke or burning smell", /fire|smoke|burning smell|smell(s|ed)? (of )?burn|melt/i],
  ["Leaks", /leak/i],
  ["Overheating", /overheat|temperature gauge|coolant/i],
  ["Battery or electrical", /battery|dead|alternator|electrical|fuse|short(ed)?/i],
  ["Vibration or shaking", /vibrat|shak/i],
  ["Noise", /noise|grind|squeal|whin(e|ing)|clunk|hum(ming)?/i],
  ["Braking", /brak(e|es|ing)/i],
  ["Steering", /steer/i],
  ["Air bags", /air ?bag/i],
  ["Speed control or unintended acceleration", /sudden(ly)? accelerat|unintended accel|accelerated on its own|cruise control/i],
  ["Mentions a recall", /recall/i],
];

/** Count how many complaints mention each symptom; returns the top few with counts. */
export function topSymptoms(texts: string[], limit = 5) {
  return SYMPTOMS.map(([label, re]) => ({ label, count: texts.filter((t) => re.test(t)).length }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/** Complaint text cleaned for display: no FOIA redaction notices or "XXX" placeholders. */
export function cleanComplaint(text: string) {
  return text
    .replace(/\*?\s*INFORMATION REDACTED PURSUANT TO THE FREEDOM OF INFORMATION ACT \(FOIA\), 5 U\.S\.C\. 552\(B\)\(6\)\.?\s*\*?/gi, "")
    .replace(/\[?\bXXX\b\]?/g, "…")
    .replace(/\*[A-Z]{1,3}\*?/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
