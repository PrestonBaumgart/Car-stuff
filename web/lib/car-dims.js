// Real exterior dimensions for common models, so the 3D body matches the car's actual size.
// NHTSA's VIN decode doesn't publish length, width or height (and often not wheelbase), so these come from
// manufacturer spec sheets. Values are millimeters: [length, width without mirrors, height, wheelbase].
// Figures are for the most common trim of each generation; body kits and roof racks vary a little.
// Plain JavaScript with no dependencies so the landing page can load it too.

// [make, model pattern, first year, last year, dims]
const TABLE = [
  // Kia
  ["kia", /^soul\b/i, 2020, 2026, [4195, 1800, 1615, 2600]],
  ["kia", /^soul\b/i, 2014, 2019, [4140, 1800, 1600, 2570]],
  ["kia", /^soul\b/i, 2010, 2013, [4105, 1785, 1610, 2550]],
  ["kia", /^seltos/i, 2021, 2026, [4370, 1800, 1620, 2630]],
  ["kia", /^niro/i, 2023, 2026, [4420, 1825, 1545, 2720]],
  ["kia", /^niro/i, 2017, 2022, [4355, 1805, 1545, 2700]],
  ["kia", /^forte\s*5|forte5/i, 2019, 2026, [4510, 1800, 1440, 2700]],
  ["kia", /^forte\s*5|forte5/i, 2014, 2018, [4350, 1780, 1450, 2700]],
  ["kia", /^forte\s*koup|koup/i, 2014, 2016, [4530, 1780, 1410, 2700]],
  ["kia", /^forte/i, 2019, 2026, [4640, 1800, 1440, 2700]],
  ["kia", /^forte/i, 2014, 2018, [4560, 1780, 1445, 2700]],
  ["kia", /^forte/i, 2010, 2013, [4530, 1775, 1460, 2650]],
  ["kia", /^(k5|optima)/i, 2021, 2026, [4905, 1860, 1445, 2850]],
  ["kia", /^optima/i, 2016, 2020, [4855, 1860, 1465, 2805]],
  ["kia", /^rio/i, 2018, 2023, [4385, 1725, 1460, 2580]],
  ["kia", /^sportage/i, 2023, 2026, [4660, 1865, 1660, 2755]],
  ["kia", /^sportage/i, 2017, 2022, [4480, 1855, 1645, 2670]],
  ["kia", /^sorento/i, 2021, 2026, [4810, 1900, 1700, 2815]],
  ["kia", /^telluride/i, 2020, 2026, [5000, 1990, 1750, 2900]],
  ["kia", /^(carnival|sedona)/i, 2022, 2026, [5155, 1995, 1775, 3090]],
  ["kia", /^stinger/i, 2018, 2023, [4830, 1870, 1400, 2905]],
  ["kia", /^ev6/i, 2022, 2026, [4680, 1880, 1550, 2900]],
  ["kia", /^ev9/i, 2024, 2026, [5010, 1980, 1755, 3100]],
  // Hyundai
  ["hyundai", /^elantra/i, 2021, 2026, [4675, 1825, 1420, 2720]],
  ["hyundai", /^elantra/i, 2017, 2020, [4570, 1800, 1450, 2700]],
  ["hyundai", /^sonata/i, 2020, 2026, [4900, 1860, 1445, 2840]],
  ["hyundai", /^tucson/i, 2022, 2026, [4630, 1865, 1665, 2755]],
  ["hyundai", /^santa fe/i, 2019, 2023, [4785, 1900, 1685, 2765]],
  ["hyundai", /^kona/i, 2018, 2023, [4165, 1800, 1550, 2600]],
  ["hyundai", /^palisade/i, 2020, 2026, [4980, 1975, 1750, 2900]],
  // Toyota
  ["toyota", /^camry/i, 2018, 2026, [4885, 1840, 1445, 2825]],
  ["toyota", /^corolla cross/i, 2022, 2026, [4460, 1825, 1620, 2640]],
  ["toyota", /^corolla/i, 2019, 2026, [4630, 1780, 1435, 2700]],
  ["toyota", /^corolla/i, 2014, 2018, [4640, 1775, 1460, 2700]],
  ["toyota", /^rav4/i, 2019, 2026, [4595, 1855, 1700, 2690]],
  ["toyota", /^rav4/i, 2013, 2018, [4570, 1845, 1660, 2660]],
  ["toyota", /^highlander/i, 2020, 2026, [4950, 1930, 1730, 2850]],
  ["toyota", /^4runner/i, 2010, 2024, [4830, 1925, 1780, 2790]],
  ["toyota", /^tacoma/i, 2016, 2023, [5390, 1890, 1790, 3240]],
  ["toyota", /^tundra/i, 2022, 2026, [5930, 2035, 1980, 3700]],
  ["toyota", /^sienna/i, 2021, 2026, [5175, 1995, 1775, 3060]],
  ["toyota", /^prius/i, 2016, 2022, [4575, 1760, 1470, 2700]],
  // Honda
  ["honda", /^civic/i, 2022, 2026, [4675, 1800, 1415, 2735]],
  ["honda", /^civic/i, 2016, 2021, [4630, 1800, 1415, 2700]],
  ["honda", /^accord/i, 2018, 2022, [4880, 1860, 1450, 2830]],
  ["honda", /^accord/i, 2013, 2017, [4860, 1850, 1465, 2775]],
  ["honda", /^accord/i, 2003, 2007, [4815, 1815, 1420, 2740]],
  ["honda", /^cr-?v/i, 2023, 2026, [4695, 1865, 1690, 2700]],
  ["honda", /^cr-?v/i, 2017, 2022, [4585, 1855, 1680, 2660]],
  ["honda", /^hr-?v/i, 2023, 2026, [4570, 1840, 1620, 2655]],
  ["honda", /^pilot/i, 2023, 2026, [5090, 1995, 1805, 2890]],
  ["honda", /^odyssey/i, 2018, 2026, [5160, 1995, 1735, 3000]],
  ["honda", /^ridgeline/i, 2017, 2026, [5335, 1995, 1800, 3180]],
  // Ford
  ["ford", /^f-?150/i, 2015, 2026, [5890, 2030, 1960, 3685]],
  ["ford", /^ranger/i, 2019, 2026, [5355, 1860, 1805, 3220]],
  ["ford", /^maverick/i, 2022, 2026, [5070, 1845, 1745, 3075]],
  ["ford", /^escape/i, 2020, 2026, [4585, 1880, 1680, 2710]],
  ["ford", /^explorer/i, 2020, 2026, [5050, 2005, 1775, 3025]],
  ["ford", /^mustang mach/i, 2021, 2026, [4715, 1880, 1625, 2985]],
  ["ford", /^mustang/i, 2015, 2026, [4790, 1915, 1380, 2720]],
  ["ford", /^bronco sport/i, 2021, 2026, [4390, 1890, 1785, 2670]],
  ["ford", /^transit connect/i, 2014, 2023, [4825, 1835, 1840, 3065]],
  ["ford", /^transit/i, 2015, 2026, [5980, 2065, 2530, 3750]],
  // Chevrolet / GMC
  ["chevrolet", /^silverado/i, 2019, 2026, [5885, 2065, 1915, 3745]],
  ["chevrolet", /^colorado/i, 2015, 2026, [5400, 1885, 1790, 3260]],
  ["chevrolet", /^equinox/i, 2018, 2024, [4650, 1845, 1690, 2725]],
  ["chevrolet", /^malibu/i, 2016, 2025, [4925, 1855, 1465, 2830]],
  ["chevrolet", /^tahoe/i, 2021, 2026, [5350, 2060, 1925, 3070]],
  ["chevrolet", /^camaro/i, 2016, 2024, [4785, 1895, 1350, 2810]],
  ["chevrolet", /^corvette/i, 2020, 2026, [4630, 1935, 1235, 2720]],
  ["chevrolet", /^bolt/i, 2017, 2023, [4165, 1765, 1595, 2600]],
  ["gmc", /^sierra/i, 2019, 2026, [5885, 2065, 1915, 3745]],
  // Ram / Jeep / Dodge
  ["ram", /^1500/i, 2019, 2026, [5915, 2085, 1970, 3670]],
  ["jeep", /^wrangler/i, 2018, 2026, [4785, 1895, 1840, 3010]],
  ["jeep", /^grand cherokee/i, 2022, 2026, [4915, 1975, 1795, 2965]],
  ["jeep", /^cherokee/i, 2014, 2023, [4625, 1860, 1670, 2705]],
  ["dodge", /^charger/i, 2011, 2023, [5040, 1905, 1480, 3050]],
  ["chrysler", /^pacifica/i, 2017, 2026, [5175, 2020, 1775, 3090]],
  // Nissan / Subaru / Mazda / VW
  ["nissan", /^altima/i, 2019, 2026, [4900, 1850, 1445, 2825]],
  ["nissan", /^sentra/i, 2020, 2026, [4640, 1815, 1445, 2710]],
  ["nissan", /^rogue/i, 2021, 2026, [4650, 1840, 1700, 2705]],
  ["subaru", /^outback/i, 2020, 2026, [4870, 1855, 1680, 2745]],
  ["subaru", /^forester/i, 2019, 2026, [4640, 1815, 1730, 2670]],
  ["subaru", /^crosstrek/i, 2018, 2026, [4480, 1800, 1615, 2665]],
  ["mazda", /^(mx-?5|miata)/i, 2016, 2026, [3915, 1735, 1235, 2310]],
  ["mazda", /^cx-?5/i, 2017, 2026, [4575, 1845, 1680, 2700]],
  ["mazda", /^(3|mazda3)\b/i, 2019, 2026, [4660, 1795, 1440, 2725]],
  ["volkswagen", /^jetta/i, 2019, 2026, [4700, 1800, 1460, 2685]],
  ["volkswagen", /^golf/i, 2015, 2021, [4255, 1800, 1450, 2620]],
  ["volkswagen", /^tiguan/i, 2018, 2026, [4700, 1840, 1680, 2790]],
  // Tesla / BMW
  ["tesla", /^model 3/i, 2017, 2026, [4720, 1850, 1440, 2875]],
  ["tesla", /^model y/i, 2020, 2026, [4750, 1920, 1625, 2890]],
  ["tesla", /^model s/i, 2012, 2026, [4970, 1965, 1445, 2960]],
  ["bmw", /^3 series|^3\d\d/i, 2019, 2026, [4710, 1825, 1440, 2850]],
];

/**
 * vehicle: { make, model, year, wheelbase } (wheelbase in inches, from NHTSA when it has it).
 * Returns { length, width, height, wheelbase } in meters, or null if the model isn't in the table.
 * A NHTSA wheelbase overrides the table's, and alone (with no table match) still sets the wheelbase.
 */
export function dimsFor(vehicle) {
  const v = vehicle || {};
  const make = String(v.make || "").trim().toLowerCase(), model = String(v.model || "").trim(), year = parseInt(v.year, 10) || 0;
  const row = TABLE.find(([mk, re, y0, y1]) => mk === make && re.test(model) && (!year || (year >= y0 && year <= y1)));
  const nhtsaWb = parseFloat(v.wheelbase) > 60 ? parseFloat(v.wheelbase) * 0.0254 : null;
  if (!row) return nhtsaWb ? { wheelbase: nhtsaWb } : null;
  const [L, W, H, WB] = row[4];
  return { length: L / 1000, width: W / 1000, height: H / 1000, wheelbase: nhtsaWb || WB / 1000 };
}
