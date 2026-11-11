// Real exterior dimensions for common models, so the 3D body matches the car's actual size.
// NHTSA's VIN decode doesn't publish length, width or height (and often not wheelbase), so these come from
// manufacturer spec sheets as summarized on Wikipedia (each row notes its article). Values are millimeters: [length, width without mirrors, height, wheelbase].
// Figures are for the most common trim of each generation; body kits and roof racks vary a little.
// Plain JavaScript with no dependencies so the landing page can load it too.

// [make, model pattern, first year, last year, dims, body class pattern (optional)]
// Checked against each model's Wikipedia infobox (which cites the manufacturer's figures) in November 2026.
// Where Wikipedia gives a range, the US-market or most common figure is used. W = Wikipedia article title.
const TABLE = [
  // Kia
  ["kia", /^soul\b/i, 2020, 2026, [4195, 1800, 1600, 2600]], // W: Kia Soul (SK3)
  ["kia", /^soul\b/i, 2014, 2019, [4140, 1800, 1600, 2570]], // W: Kia Soul (PS)
  ["kia", /^soul\b/i, 2010, 2013, [4105, 1785, 1610, 2550]], // W: Kia Soul (AM)
  ["kia", /^seltos/i, 2024, 2026, [4390, 1800, 1615, 2630]], // W: Kia Seltos (facelift)
  ["kia", /^seltos/i, 2021, 2023, [4370, 1800, 1615, 2630]], // W: Kia Seltos (SP2)
  ["kia", /^niro/i, 2023, 2026, [4420, 1825, 1545, 2720]], // W: Kia Niro (SG2)
  ["kia", /^niro/i, 2017, 2022, [4355, 1805, 1545, 2700]], // W: Kia Niro (DE)
  ["kia", /koup/i, 2014, 2016, [4530, 1780, 1420, 2700]], // W: Kia Forte (YD coupe)
  ["kia", /koup/i, 2010, 2013, [4480, 1765, 1400, 2650]], // W: Kia Forte (TD coupe)
  ["kia", /forte\s*5/i, 2019, 2026, [4510, 1800, 1440, 2700]], // W: Kia Forte (BD hatchback)
  ["kia", /forte\s*5/i, 2014, 2018, [4350, 1780, 1460, 2700]], // W: Kia Forte (YD hatchback)
  ["kia", /forte\s*5/i, 2011, 2013, [4340, 1775, 1460, 2650]], // W: Kia Forte (TD hatchback)
  ["kia", /^forte/i, 2019, 2026, [4510, 1800, 1440, 2700], /hatch/i], // Forte5 decoded as "Forte"
  ["kia", /^forte/i, 2014, 2018, [4350, 1780, 1460, 2700], /hatch/i],
  ["kia", /^forte/i, 2014, 2016, [4530, 1780, 1420, 2700], /coupe/i],
  ["kia", /^forte/i, 2019, 2026, [4640, 1800, 1440, 2700]], // W: Kia Forte (BD sedan)
  ["kia", /^forte/i, 2014, 2018, [4560, 1780, 1445, 2700]], // W: Kia Forte (YD sedan)
  ["kia", /^forte/i, 2010, 2013, [4530, 1775, 1460, 2650]], // W: Kia Forte (TD sedan)
  ["kia", /^(k5|optima)/i, 2021, 2026, [4905, 1860, 1445, 2850]], // W: Kia K5 (DL3)
  ["kia", /^optima/i, 2016, 2020, [4855, 1860, 1465, 2805]], // W: Kia Optima (JF)
  ["kia", /^rio/i, 2018, 2023, [4420, 1725, 1460, 2580]], // W: Kia Rio (YB sedan)
  ["kia", /^sportage/i, 2023, 2026, [4660, 1865, 1660, 2755]], // W: Kia Sportage (NQ5 LWB, US)
  ["kia", /^sportage/i, 2017, 2022, [4480, 1855, 1645, 2670]], // W: Kia Sportage (QL)
  ["kia", /^sorento/i, 2021, 2026, [4810, 1900, 1700, 2815]], // W: Kia Sorento (MQ4)
  ["kia", /^telluride/i, 2020, 2026, [5001, 1998, 1760, 2900]], // W: Kia Telluride
  ["kia", /^(carnival|sedona)/i, 2022, 2026, [5155, 1995, 1775, 3090]], // W: Kia Carnival (KA4)
  ["kia", /^stinger/i, 2018, 2023, [4830, 1870, 1400, 2905]], // W: Kia Stinger
  ["kia", /^ev6/i, 2022, 2026, [4680, 1880, 1550, 2900]], // W: Kia EV6
  ["kia", /^ev9/i, 2024, 2026, [5010, 1980, 1755, 3100]], // W: Kia EV9
  // Hyundai
  ["hyundai", /^elantra/i, 2021, 2026, [4675, 1825, 1420, 2720]], // W: Hyundai Elantra (CN7)
  ["hyundai", /^elantra/i, 2017, 2020, [4570, 1800, 1435, 2700]], // W: Hyundai Elantra (AD)
  ["hyundai", /^sonata/i, 2020, 2026, [4900, 1860, 1445, 2840]], // W: Hyundai Sonata (DN8)
  ["hyundai", /^tucson/i, 2022, 2026, [4630, 1865, 1665, 2755]], // W: Hyundai Tucson (NX4 LWB)
  ["hyundai", /^santa fe/i, 2021, 2023, [4785, 1900, 1685, 2765]], // W: Hyundai Santa Fe (TM facelift)
  ["hyundai", /^santa fe/i, 2019, 2020, [4770, 1890, 1680, 2765]], // W: Hyundai Santa Fe (TM)
  ["hyundai", /^kona/i, 2018, 2023, [4165, 1800, 1550, 2600]], // W: Hyundai Kona (OS)
  ["hyundai", /^palisade/i, 2023, 2026, [4995, 1975, 1750, 2900]], // W: Hyundai Palisade (facelift)
  ["hyundai", /^palisade/i, 2020, 2022, [4980, 1975, 1750, 2900]], // W: Hyundai Palisade (LX2)
  // Toyota
  ["toyota", /^camry/i, 2018, 2026, [4885, 1840, 1445, 2820]], // W: Toyota Camry (XV70)
  ["toyota", /^corolla cross/i, 2022, 2026, [4460, 1825, 1620, 2640]], // W: Toyota Corolla Cross
  ["toyota", /^corolla/i, 2019, 2026, [4630, 1780, 1435, 2700]], // W: Toyota Corolla (E210 sedan)
  ["toyota", /^corolla/i, 2014, 2018, [4639, 1775, 1455, 2700]], // W: Toyota Corolla (E170, North America)
  ["toyota", /^rav4/i, 2019, 2026, [4595, 1855, 1660, 2690]], // W: Toyota RAV4 (XA50)
  ["toyota", /^rav4/i, 2013, 2018, [4570, 1845, 1660, 2660]], // W: Toyota RAV4 (XA40)
  ["toyota", /^highlander/i, 2020, 2026, [4950, 1930, 1730, 2850]], // W: Toyota Highlander (XU70)
  ["toyota", /^4runner/i, 2010, 2024, [4830, 1925, 1795, 2790]], // W: Toyota 4Runner (N280)
  ["toyota", /^tacoma/i, 2016, 2023, [5392, 1890, 1793, 3236]], // W: Toyota Tacoma (N300, Double Cab short bed)
  ["toyota", /^tundra/i, 2022, 2026, [5933, 2032, 1980, 3701]], // W: Toyota Tundra (XK70 CrewMax 5.5 ft)
  ["toyota", /^sienna/i, 2021, 2026, [5175, 1990, 1765, 3060]], // W: Toyota Sienna (XL40)
  ["toyota", /^prius/i, 2016, 2022, [4570, 1760, 1470, 2700]], // W: Toyota Prius (XW50)
  // Honda
  ["honda", /^civic/i, 2022, 2026, [4674, 1801, 1415, 2736]], // W: Honda Civic (eleventh generation, sedan)
  ["honda", /^civic/i, 2016, 2021, [4630, 1799, 1416, 2700]], // W: Honda Civic (tenth generation, sedan)
  ["honda", /^accord/i, 2018, 2022, [4900, 1860, 1450, 2830]], // W: Honda Accord (tenth generation)
  ["honda", /^accord/i, 2013, 2017, [4862, 1849, 1466, 2776]], // W: Honda Accord (ninth generation)
  ["honda", /^accord/i, 2003, 2007, [4770, 1811, 1417, 2670], /coupe/i], // W: Honda Accord (North America seventh generation, coupe)
  ["honda", /^accord/i, 2003, 2007, [4813, 1816, 1450, 2741]], // same article, sedan
  ["honda", /^cr-?v/i, 2023, 2026, [4694, 1866, 1690, 2700]], // W: Honda CR-V (sixth generation)
  ["honda", /^cr-?v/i, 2017, 2022, [4585, 1855, 1680, 2660]], // W: Honda CR-V (fifth generation)
  ["honda", /^hr-?v/i, 2023, 2026, [4567, 1839, 1620, 2654]], // W: Honda ZR-V (sold as the HR-V in North America)
  ["honda", /^pilot/i, 2023, 2026, [5077, 1994, 1803, 2891]], // W: Honda Pilot (fourth generation)
  ["honda", /^odyssey/i, 2018, 2026, [5161, 1994, 1765, 3000]], // W: Honda Odyssey (North America, RL6)
  ["honda", /^ridgeline/i, 2017, 2026, [5334, 1996, 1790, 3180]], // W: Honda Ridgeline (second generation)
  // Ford
  ["ford", /^f-?150/i, 2021, 2026, [5885, 2029, 1960, 3693]], // W: Ford F-Series (fourteenth generation, SuperCrew 5.5 ft)
  ["ford", /^f-?150/i, 2015, 2020, [5890, 2029, 1940, 3683]], // W: Ford F-Series (thirteenth generation; generation-wide ranges)
  ["ford", /^ranger/i, 2019, 2023, [5354, 1862, 1806, 3226]], // W: Ford Ranger (T6): US wheelbase; L/W/H from the generation's ranges
  ["ford", /^maverick/i, 2022, 2026, [5072, 1844, 1745, 3076]], // W: Ford Maverick (2022)
  ["ford", /^escape/i, 2020, 2026, [4585, 1882, 1679, 2710]], // W: Ford Escape (fourth generation)
  ["ford", /^explorer/i, 2020, 2026, [5050, 2004, 1775, 3025]], // W: Ford Explorer (U625)
  ["ford", /^explorer/i, 2011, 2019, [5006, 2004, 1788, 2860]], // W: Ford Explorer (U502)
  ["ford", /^mustang mach/i, 2021, 2026, [4739, 1881, 1621, 2984]], // W: Ford Mustang Mach-E
  ["ford", /^mustang/i, 2024, 2026, [4810, 1915, 1397, 2720]], // W: Ford Mustang (seventh generation)
  ["ford", /^mustang/i, 2015, 2023, [4788, 1915, 1387, 2720]], // W: Ford Mustang (sixth generation)
  ["ford", /^bronco sport/i, 2021, 2026, [4387, 1887, 1800, 2670]], // W: Ford Bronco Sport
  ["ford", /^transit connect/i, 2014, 2023, [4820, 1830, 1830, 3060]], // W: Ford Transit Connect (LWB)
  ["ford", /^transit/i, 2015, 2026, [5981, 2065, 2573, 3750]], // Ford spec, 148 in WB medium roof (Wikipedia has no figures)
  // Chevrolet / GMC
  ["chevrolet", /^silverado/i, 2019, 2026, [5885, 2062, 1925, 3744]], // W: Chevrolet Silverado (fourth generation, Crew Cab 5'8")
  ["chevrolet", /^colorado/i, 2023, 2026, [5410, 1902, 2001, 3337]], // W: Chevrolet Colorado (third generation)
  ["chevrolet", /^colorado/i, 2015, 2022, [5403, 1885, 1790, 3258]], // W: Chevrolet Colorado (second generation; ranges)
  ["chevrolet", /^equinox/i, 2018, 2024, [4652, 1843, 1661, 2725]], // W: Chevrolet Equinox (third generation)
  ["chevrolet", /^malibu/i, 2016, 2025, [4923, 1854, 1455, 2830]], // W: Chevrolet Malibu (ninth generation)
  ["chevrolet", /^tahoe/i, 2021, 2026, [5352, 2060, 1923, 3071]], // W: Chevrolet Tahoe (fifth generation)
  ["chevrolet", /^camaro/i, 2016, 2024, [4783, 1897, 1349, 2812]], // W: Chevrolet Camaro (sixth generation)
  ["chevrolet", /^corvette/i, 2020, 2026, [4630, 1933, 1234, 2723]], // W: Chevrolet Corvette (C8)
  ["chevrolet", /^bolt/i, 2017, 2023, [4166, 1765, 1595, 2601]], // W: Chevrolet Bolt
  ["gmc", /^sierra/i, 2019, 2026, [5885, 2062, 1925, 3744]], // W: GMC Sierra (shared T1XX figures, Crew Cab 5'8")
  // Ram / Jeep / Dodge / Chrysler
  ["ram", /^1500/i, 2019, 2026, [5916, 2085, 1990, 3673]], // W: Ram 1500 (DT, Crew Cab)
  ["jeep", /^wrangler/i, 2018, 2026, [4785, 1877, 1801, 3007]], // W: Jeep Wrangler (JL, Unlimited)
  ["jeep", /^grand cherokee/i, 2022, 2026, [4915, 1979, 1816, 2964]], // W: Jeep Grand Cherokee (WL)
  ["jeep", /^cherokee/i, 2014, 2023, [4623, 1859, 1700, 2700]], // W: Jeep Cherokee (KL)
  ["dodge", /^charger/i, 2011, 2023, [5084, 1905, 1485, 3053]], // W: Dodge Charger (LX/LD)
  ["chrysler", /^pacifica/i, 2017, 2026, [5171, 2022, 1775, 3089]], // W: Chrysler Pacifica (minivan)
  // Nissan / Subaru / Mazda / VW
  ["nissan", /^altima/i, 2019, 2026, [4901, 1850, 1447, 2825]], // W: Nissan Altima (L34)
  ["nissan", /^sentra/i, 2020, 2026, [4641, 1815, 1450, 2712]], // W: Nissan Sentra (B18)
  ["nissan", /^rogue/i, 2021, 2026, [4648, 1839, 1699, 2705]], // W: Nissan Rogue (T33)
  ["subaru", /^outback/i, 2020, 2026, [4860, 1855, 1680, 2745]], // W: Subaru Outback (BT)
  ["subaru", /^forester/i, 2025, 2026, [4655, 1828, 1730, 2670]], // W: Subaru Forester (SL)
  ["subaru", /^forester/i, 2019, 2024, [4625, 1815, 1730, 2670]], // W: Subaru Forester (SK)
  ["subaru", /^crosstrek/i, 2024, 2026, [4480, 1800, 1580, 2670]], // W: Subaru Crosstrek (GU)
  ["subaru", /^crosstrek/i, 2018, 2023, [4465, 1800, 1615, 2670]], // W: Subaru Crosstrek (GT)
  ["mazda", /^(mx-?5|miata)/i, 2016, 2026, [3915, 1730, 1235, 2310]], // W: Mazda MX-5 (ND)
  ["mazda", /^cx-?5/i, 2017, 2026, [4550, 1840, 1680, 2700]], // W: Mazda CX-5 (KF)
  ["mazda", /^(3|mazda3)\b/i, 2019, 2026, [4460, 1795, 1440, 2725], /hatch/i], // W: Mazda3 (BP hatchback)
  ["mazda", /^(3|mazda3)\b/i, 2019, 2026, [4660, 1795, 1445, 2725]], // W: Mazda3 (BP sedan)
  ["volkswagen", /^jetta/i, 2019, 2026, [4702, 1799, 1459, 2686]], // W: Volkswagen Jetta (A7)
  ["volkswagen", /^golf/i, 2015, 2021, [4255, 1799, 1452, 2631]], // W: Volkswagen Golf Mk7 (hatchback)
  ["volkswagen", /^tiguan/i, 2018, 2024, [4712, 1859, 1673, 2791]], // W: Volkswagen Tiguan (second generation, LWB)
  // Tesla / BMW
  ["tesla", /^model 3/i, 2024, 2026, [4720, 1849, 1441, 2875]], // W: Tesla Model 3 (Highland)
  ["tesla", /^model 3/i, 2017, 2023, [4694, 1849, 1443, 2875]], // W: Tesla Model 3
  ["tesla", /^model y/i, 2020, 2025, [4751, 1920, 1624, 2890]], // W: Tesla Model Y
  ["tesla", /^model y/i, 2026, 2026, [4790, 1920, 1624, 2890]], // W: Tesla Model Y (2025 refresh)
  ["tesla", /^model s/i, 2012, 2026, [4980, 1960, 1440, 2960]], // W: Tesla Model S
  ["bmw", /^3 series|^3\d\d/i, 2019, 2026, [4709, 1827, 1442, 2851]], // W: BMW 3 Series (G20)
];

/**
 * vehicle: { make, model, year, wheelbase, bodyClass } (wheelbase in inches, from NHTSA when it has it).
 * The body class picks between body styles of one model (coupe vs sedan, hatchback vs sedan).
 * Returns { length, width, height, wheelbase } in meters, or null if the model isn't in the table.
 * A NHTSA wheelbase overrides the table's, and alone (with no table match) still sets the wheelbase.
 */
export function dimsFor(vehicle) {
  const v = vehicle || {};
  const make = String(v.make || "").trim().toLowerCase(), model = String(v.model || "").trim(), year = parseInt(v.year, 10) || 0;
  const body = String(v.bodyClass || v.body || "");
  const row = TABLE.find(([mk, re, y0, y1, , bodyRe]) => mk === make && re.test(model) && (!year || (year >= y0 && year <= y1)) && (!bodyRe || bodyRe.test(body)));
  const nhtsaWb = parseFloat(v.wheelbase) > 60 ? parseFloat(v.wheelbase) * 0.0254 : null;
  if (!row) return nhtsaWb ? { wheelbase: nhtsaWb } : null;
  const [L, W, H, WB] = row[4];
  return { length: L / 1000, width: W / 1000, height: H / 1000, wheelbase: nhtsaWb || WB / 1000 };
}
