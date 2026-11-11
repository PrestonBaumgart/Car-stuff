// Real car body models for common vehicles, so a decoded VIN can show its actual shape instead of the
// code-built body. Each model is CC BY 4.0 and credited in public/parts/ATTRIBUTION.md.
// Plain JavaScript with no dependencies so the landing page can load it too.

// One catalog row. The .glb file is always named after the key.
function body(key, make, models, years, title, author, url) {
  return { key, file: key + ".glb", make, models, years, title, author, url };
}

// Makes and models are spelled the way NHTSA's vPIC decoder spells them. Years are [first, last], inclusive.
export const CAR_BODIES = [
  body("f150", "FORD", ["F-150"], [2015, 2020], "Ford F-150 Raptor", "Vehsource | VHS Mods",
    "https://sketchfab.com/3d-models/ford-f-150-raptor-1a7eae85629f4749b494fb1709682f0e"),
  body("silverado", "CHEVROLET", ["Silverado", "Silverado 1500"], [2019, 2025], "2020 Chevrolet Silverado 1500 RST", "Ddiaz Design",
    "https://sketchfab.com/3d-models/2020-chevrolet-silverado-1500-rst-6a0be94fec824513bffe48df57d0b17a"),
  body("ram1500", "RAM", ["1500", "2500", "3500", "Ram 1500", "Ram 2500"], [2019, 2025], "Dodge Ram 2500", "VanuaG",
    "https://sketchfab.com/3d-models/dodge-ram-2500-b4259af6d85d472b8fde9517bcd38154"),
  body("rav4", "TOYOTA", ["RAV4"], [2019, 2025], "2021 Toyota RAV4 Hybrid", "tonielpro520",
    "https://sketchfab.com/3d-models/2021-toyota-rav4-hybrid-de74fe4e98004c92b1103947597d1b53"),
  body("crv2022", "HONDA", ["CR-V"], [2017, 2022], "2022 Honda CR-V", "tonielpro520",
    "https://sketchfab.com/3d-models/2022-honda-cr-v-cf55df17d2154cbbb157c2e1b062ac23"),
  body("crv2025", "HONDA", ["CR-V"], [2023, 2026], "2025 Honda CR-V 1.5 VTEC Turbo CVT", "Palma123 JAAT",
    "https://sketchfab.com/3d-models/2025-honda-cr-v-15-vtec-turbo-cvt-91c6673859444597bf006a0ef8570005"),
  body("modely", "TESLA", ["Model Y"], [2020, 2025], "2021 Tesla Model Y", "tonielpro520",
    "https://sketchfab.com/3d-models/2021-tesla-model-y-59e2ead369984b1a85c800ff6cf6789d"),
  body("camry", "TOYOTA", ["Camry"], [2018, 2024], "Toyota Camry 2020", "ItsDiyor",
    "https://sketchfab.com/3d-models/toyota-camry-2020-236a5a6e2fa6420fbdf641f4800cd544"),
  body("equinox", "CHEVROLET", ["Equinox"], [2018, 2024], "Chevrolet Equinox 2021", "UZBEK 3D",
    "https://sketchfab.com/3d-models/chevrolet-equinox-2021-95b533e8d76e448885f60977aaff03f7"),
  body("rogue", "NISSAN", ["Rogue"], [2021, 2025], "2022 Nissan Rogue", "tonielpro520",
    "https://sketchfab.com/3d-models/2022-nissan-rogue-48fa53c7743745949b9cb518b7b67579"),
  body("tacoma", "TOYOTA", ["Tacoma"], [2016, 2023], "2019 Toyota Tacoma", "David_Holiday",
    "https://sketchfab.com/3d-models/2019-toyota-tacoma-8bb91f037ec64151ba72279c50ce5c20"),
  body("civic", "HONDA", ["Civic"], [2022, 2025], "Honda Civic 2022 (Free Download)", "Ricy",
    "https://sketchfab.com/3d-models/honda-civic-2022-free-download-d5ca29a5d2f341b691118ffb5560b19b"),
  body("corolla", "TOYOTA", ["Corolla"], [2019, 2025], "Toyota Corolla 2020", "ItsDiyor",
    "https://sketchfab.com/3d-models/toyota-corolla-2020-6d7d34ee42734d1ab28a6b1f1c5fc4fc"),
  body("grandcherokee", "JEEP", ["Grand Cherokee"], [2011, 2021], "Jeep Grand Cherokee Trackhawk", "David_Holiday",
    "https://sketchfab.com/3d-models/jeep-grand-cherokee-trackhawk-f8024595e11c48119877c9c7cc554abc"),
  body("explorer", "FORD", ["Explorer"], [2020, 2025], "2020 Ford Explorer XLT", "blarg",
    "https://sketchfab.com/3d-models/2020-ford-explorer-xlt-ba986f9f9c44426ca7d5e91831b2c98d"),
  body("accord", "HONDA", ["Accord"], [2018, 2022], "2018 Honda Accord", "roflowhale",
    "https://sketchfab.com/3d-models/2018-honda-accord-54c227442c4b42dfbaa25e474ad9d736"),
  body("highlander", "TOYOTA", ["Highlander"], [2020, 2025], "Toyota Highlander 2020", "ItsDiyor",
    "https://sketchfab.com/3d-models/toyota-highlander-2020-ff144d062f244a3ebfae71bc2a41564b"),
  body("sierra", "GMC", ["Sierra", "Sierra 1500"], [2019, 2025], "2024 GMC Sierra 1500 AT4X", "Car design",
    "https://sketchfab.com/3d-models/2024-gmc-sierra-1500-at4x-f1c33f582f184e50857be2e832c74c20"),
  body("tucson", "HYUNDAI", ["Tucson"], [2016, 2021], "2015 Hyundai Tucson", "razor24",
    "https://sketchfab.com/3d-models/2015-hyundai-tucson-7674a3bd168a451daf73fc0a33d39589"),
  body("cx5", "MAZDA", ["CX-5"], [2017, 2025], "Mazda CX-5 2020", "ItsDiyor",
    "https://sketchfab.com/3d-models/mazda-cx-5-2020-ea176c6ebe814be3b06641bf038f8642"),
  body("model3", "TESLA", ["Model 3"], [2017, 2023], "Tesla 2018 Model 3", "Ameer Studio",
    "https://sketchfab.com/3d-models/tesla-2018-model-3-5ef9b845aaf44203b6d04e2c677e444f"),
];

// Other names a make goes by. Older Ram trucks decode as DODGE.
const MAKE_ALIASES = { DODGE: "RAM" };

// How far outside a model's years we still use it, for a generation we don't have.
const MAX_YEAR_GAP = 4;

// Words after the model name that mean a different body: "Silverado 2500HD", "Silverado EV", "F-150 Lightning", "1500 Classic".
const OTHER_BODY = /HD|EV|LIGHTNING|CLASSIC/;

// Upper case, letters and digits only, so "F-150", "f150" and "F 150" all compare equal.
function normalize(text) {
  return String(text == null ? "" : text).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// The length of the longest alias the vehicle's model starts with, or 0 if none match.
// vPIC often adds a trim or cab ("F-150 SuperCrew", "Silverado 1500 LT"), so a prefix counts.
function aliasMatchLength(entry, model) {
  let best = 0;
  for (const alias of entry.models) {
    const name = normalize(alias);
    if (model.startsWith(name) && name.length > best) best = name.length;
  }
  return best;
}

// How many years `year` falls outside an entry's range (0 when inside).
function yearGap(entry, year) {
  const [first, last] = entry.years;
  if (year < first) return first - year;
  if (year > last) return year - last;
  return 0;
}

/** The body model for a decoded vehicle, or null. vehicle: { year, make, model, ... } (strings or numbers from NHTSA vPIC). */
export function bodyFor(vehicle) {
  if (!vehicle) return null;
  let make = normalize(vehicle.make);
  if (MAKE_ALIASES[make]) make = MAKE_ALIASES[make];
  const model = normalize(vehicle.model);
  if (!make || !model) return null;

  // Every entry for this make whose alias the model matches, keeping only the longest alias match.
  let candidates = [];
  let bestLength = 0;
  for (const entry of CAR_BODIES) {
    if (normalize(entry.make) !== make) continue;
    const length = aliasMatchLength(entry, model);
    if (length === 0) continue;
    if (length > bestLength) {
      bestLength = length;
      candidates = [entry];
    } else if (length === bestLength) {
      candidates.push(entry);
    }
  }
  if (candidates.length === 0) return null;
  // Heavy-duty, electric and carry-over "Classic" versions share the name but not the body.
  if (OTHER_BODY.test(model.slice(bestLength))) return null;

  // No usable year: show the newest generation we have.
  const year = parseInt(String(vehicle.year), 10);
  if (!Number.isInteger(year) || year <= 0) {
    let newest = candidates[0];
    for (const entry of candidates) {
      if (entry.years[1] > newest.years[1]) newest = entry;
    }
    return newest;
  }

  // The generation covering the year, or else the closest one if it is near enough.
  let closest = null;
  for (const entry of candidates) {
    if (closest === null || yearGap(entry, year) < yearGap(closest, year)) closest = entry;
  }
  if (yearGap(closest, year) > MAX_YEAR_GAP) return null;
  return closest;
}
