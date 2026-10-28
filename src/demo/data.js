// Données de démo : générées aléatoirement à chaque chargement, en mémoire, jamais persistées.
// Aucun lien avec les vrais points, images, utilisateurs ou listes.

const rand = (a, b) => a + Math.random() * (b - a);
const int = (a, b) => Math.floor(rand(a, b + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const id = (prefix, n) => `${prefix}${n.toString(16).padStart(6, '0')}${Math.random().toString(16).slice(2, 20)}`.padEnd(24, '0');

// Types d'urbex (taxonomie publique de l'app, pas des données)
export const CATEGORIES = [
  { id: 1, name: 'castle', icon: 'fa-chess-rook', words: ['Castle', 'Manor', 'Keep', 'Château'] },
  { id: 2, name: 'hostel', icon: 'fa-hotel', words: ['Hotel', 'Inn', 'Guesthouse'] },
  { id: 3, name: 'cinema', icon: 'fa-film', words: ['Cinema', 'Theatre', 'Picture house'] },
  { id: 4, name: 'train', icon: 'fa-train', words: ['Station', 'Depot', 'Railyard', 'Signal box'] },
  { id: 5, name: 'hospital', icon: 'fa-hospital', words: ['Sanatorium', 'Hospital', 'Asylum', 'Clinic'] },
  { id: 6, name: 'house', icon: 'fa-house', words: ['House', 'Villa', 'Farmhouse', 'Cottage'] },
  { id: 7, name: 'factory', icon: 'fa-industry', words: ['Factory', 'Mill', 'Foundry', 'Brickworks'] },
  { id: 8, name: 'building', icon: 'fa-building', words: ['School', 'Office block', 'Tower', 'Seminary'] },
  { id: 9, name: 'restaurant', icon: 'fa-utensils', words: ['Restaurant', 'Diner', 'Brasserie'] },
  { id: 10, name: 'military', icon: 'fa-jet-fighter-up', words: ['Bunker', 'Barracks', 'Airbase', 'Fort'] },
];

// Zones intérieures approximatives (évite la mer) ; coordonnées tirées au hasard dedans.
// [latMin, latMax, lonMin, lonMax]. Toute la planète : chaque pays est généré à la demande (voir ensureCountries).
const C = (id, code, name, ...boxes) => ({ id, code, name, boxes });
export const COUNTRIES = [
  C(1, 'FR', 'France', [44.0, 49.2, -0.3, 6.3]),
  C(2, 'BE', 'Belgium', [50.2, 51.1, 3.6, 5.8]),
  C(3, 'DE', 'Germany', [48.3, 53.3, 7.2, 13.5]),
  C(4, 'IT', 'Italy', [44.0, 45.8, 7.6, 12.2], [40.8, 42.6, 13.6, 15.8]),
  C(5, 'ES', 'Spain', [37.6, 42.4, -6.2, -0.8]),
  C(6, 'PT', 'Portugal', [38.6, 41.7, -8.4, -7.1]),
  C(7, 'CH', 'Switzerland', [46.3, 47.5, 6.7, 9.6]),
  C(8, 'PL', 'Poland', [50.3, 53.8, 15.5, 23.0]),
  C(9, 'NL', 'Netherlands', [51.5, 53.2, 4.8, 6.9]),
  C(10, 'GB', 'United Kingdom', [51.0, 54.5, -3.0, 0.8], [55.5, 57.8, -5.0, -2.5]),
  C(11, 'AT', 'Austria', [46.9, 48.3, 13.0, 16.4]),
  C(12, 'CZ', 'Czechia', [48.9, 50.8, 12.6, 18.2]),
  C(13, 'IE', 'Ireland', [52.2, 54.2, -9.2, -6.5]),
  C(14, 'DK', 'Denmark', [55.3, 57.2, 8.6, 10.2]),
  C(15, 'NO', 'Norway', [59.5, 63.5, 8.5, 11.5]),
  C(16, 'SE', 'Sweden', [56.5, 63.5, 13.5, 17.5]),
  C(17, 'FI', 'Finland', [61.0, 65.0, 23.0, 29.0]),
  C(18, 'IS', 'Iceland', [63.8, 65.8, -21.0, -15.0]),
  C(19, 'GR', 'Greece', [38.5, 41.0, 21.0, 23.5]),
  C(20, 'HU', 'Hungary', [46.3, 48.2, 17.0, 22.0]),
  C(21, 'RO', 'Romania', [44.5, 47.5, 22.5, 27.5]),
  C(22, 'BG', 'Bulgaria', [42.0, 43.8, 23.0, 27.0]),
  C(23, 'UA', 'Ukraine', [47.5, 51.0, 24.0, 38.0]),
  C(24, 'RS', 'Serbia', [43.0, 45.5, 19.5, 22.0]),
  C(25, 'HR', 'Croatia', [45.2, 46.2, 15.5, 18.5]),
  C(26, 'SK', 'Slovakia', [48.2, 49.2, 17.5, 21.5]),
  C(27, 'SI', 'Slovenia', [45.8, 46.6, 13.8, 16.0]),
  C(28, 'LT', 'Lithuania', [54.2, 56.0, 22.0, 26.0]),
  C(29, 'LV', 'Latvia', [56.2, 57.6, 22.0, 27.0]),
  C(30, 'EE', 'Estonia', [58.0, 59.3, 23.0, 27.5]),
  C(31, 'BY', 'Belarus', [52.0, 55.5, 24.5, 30.5]),
  C(32, 'RU', 'Russia', [52.0, 60.0, 32.0, 50.0], [52.0, 64.0, 60.0, 110.0]),
  C(33, 'TR', 'Türkiye', [37.5, 40.5, 28.0, 42.0]),
  C(34, 'JP', 'Japan', [34.5, 39.5, 132.5, 141.0]),
  C(35, 'KR', 'South Korea', [35.0, 37.8, 126.8, 129.0]),
  C(36, 'CN', 'China', [24.0, 40.0, 100.0, 118.0]),
  C(37, 'IN', 'India', [12.0, 28.0, 73.0, 86.0]),
  C(38, 'TH', 'Thailand', [13.5, 19.0, 99.0, 104.0]),
  C(39, 'ID', 'Indonesia', [-8.0, -6.5, 106.0, 114.0]),
  C(40, 'KZ', 'Kazakhstan', [43.0, 52.0, 55.0, 82.0]),
  C(41, 'MN', 'Mongolia', [44.0, 49.0, 95.0, 115.0]),
  C(42, 'IR', 'Iran', [28.0, 36.0, 48.0, 60.0]),
  C(43, 'SA', 'Saudi Arabia', [19.0, 28.0, 40.0, 50.0]),
  C(44, 'IL', 'Israel', [30.5, 33.0, 34.7, 35.4]),
  C(45, 'MA', 'Morocco', [30.0, 34.5, -8.0, -3.0]),
  C(46, 'DZ', 'Algeria', [26.0, 35.0, -2.0, 8.0]),
  C(47, 'EG', 'Egypt', [23.0, 30.5, 26.0, 32.0]),
  C(48, 'NG', 'Nigeria', [7.0, 12.5, 4.0, 12.0]),
  C(49, 'KE', 'Kenya', [-3.0, 3.0, 35.0, 40.0]),
  C(50, 'ZA', 'South Africa', [-33.0, -24.0, 18.0, 31.0]),
  C(51, 'ET', 'Ethiopia', [6.0, 13.0, 36.0, 42.0]),
  C(52, 'TZ', 'Tanzania', [-10.0, -2.0, 30.0, 38.0]),
  C(53, 'CD', 'DR Congo', [-10.0, 3.0, 18.0, 28.0]),
  C(54, 'US', 'United States', [32.0, 47.0, -120.0, -80.0]),
  C(55, 'CA', 'Canada', [45.0, 55.0, -115.0, -75.0]),
  C(56, 'MX', 'Mexico', [17.0, 28.0, -108.0, -97.0]),
  C(57, 'BR', 'Brazil', [-23.0, -3.0, -60.0, -40.0]),
  C(58, 'AR', 'Argentina', [-40.0, -25.0, -68.0, -58.0]),
  C(59, 'CL', 'Chile', [-40.0, -20.0, -72.0, -69.5]),
  C(60, 'CO', 'Colombia', [2.0, 10.0, -76.0, -70.0]),
  C(61, 'PE', 'Peru', [-15.0, -4.0, -79.0, -70.0]),
  C(62, 'AU', 'Australia', [-35.0, -19.0, 117.0, 151.0]),
  C(63, 'NZ', 'New Zealand', [-39.5, -37.5, 174.5, 177.0], [-45.0, -42.0, 169.0, 172.5]),
];

// Pays de la démo : déduit de la langue de l'appareil (la démo ne contacte jamais le serveur, donc pas d'IP).
// « pl-PL » → PL ; « pl » → PL ; « en » sans région → GB ; inconnu → France.
const LANG_TO_COUNTRY = { fr: 'FR', de: 'DE', it: 'IT', es: 'ES', pt: 'PT', pl: 'PL', nl: 'NL', en: 'GB', cs: 'CZ', sv: 'SE', da: 'DK', nb: 'NO', no: 'NO', fi: 'FI', el: 'GR', hu: 'HU', ro: 'RO', uk: 'UA', ru: 'RU', tr: 'TR', ja: 'JP', ko: 'KR', zh: 'CN', hi: 'IN', th: 'TH', id: 'ID', he: 'IL', ar: 'EG', is: 'IS', sk: 'SK', sl: 'SI', hr: 'HR', sr: 'RS', bg: 'BG', lt: 'LT', lv: 'LV', et: 'EE', be: 'BY' };
export const demoCountry = (() => {
  const langs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'fr']);
  for (const l of langs) {
    const [lang, region] = String(l).split('-');
    const code = (region && region.toUpperCase()) || LANG_TO_COUNTRY[lang?.toLowerCase()];
    const found = COUNTRIES.find((c) => c.code === code) || COUNTRIES.find((c) => c.code === LANG_TO_COUNTRY[lang?.toLowerCase()]);
    if (found) return found;
  }
  return COUNTRIES[0];
})();

// Pays d'une position (démo) : dans une zone d'un pays, sinon le pays dont une zone est la plus proche (≤ ~700 km)
export const countryAt = (lat, lon) => {
  let best = null, bestD = Infinity;
  for (const c of COUNTRIES) for (const [la1, la2, lo1, lo2] of c.boxes) {
    if (lat >= la1 && lat <= la2 && lon >= lo1 && lon <= lo2) return c;
    const dLat = Math.max(la1 - lat, 0, lat - la2), dLon = Math.max(lo1 - lon, 0, lon - lo2) * Math.cos((lat * Math.PI) / 180);
    const d = Math.hypot(dLat, dLon);
    if (d < bestD) [best, bestD] = [c, d];
  }
  return bestD < 6.5 ? best : null;
};

// Cadre de la carte pour un pays de la démo (union de ses zones)
export const boundsOf = (c) => {
  const b = c.boxes;
  return [[Math.min(...b.map((x) => x[0])), Math.min(...b.map((x) => x[2]))], [Math.max(...b.map((x) => x[1])), Math.max(...b.map((x) => x[3]))]];
};

// Noms de lieux inventés (syllabes), jamais de vraies villes
const SYL_A = ['Var', 'Kos', 'Bel', 'Mor', 'Tal', 'Ven', 'Dra', 'Sol', 'Grim', 'Hal', 'Lur', 'Ost', 'Pel', 'Rav', 'Sev', 'Tor', 'Ul', 'Wes'];
const SYL_B = ['ne', 'ra', 'li', 'mo', 'ten', 'ver', 'dor', 'sa', 'gan', 'bel', 'ri', 'lan'];
const SYL_C = ['lles', 'trau', 'mont', 'dal', 'ville', 'heim', 'stein', 'mar', 'court', 'bourg', 'ac', 'ona'];
const place = () => pick(SYL_A) + pick(SYL_B) + pick(SYL_C);
const ADJ = ['Old', 'Forgotten', 'Silent', 'Grey', 'Northern', 'Lower', 'Former', 'Abandoned', 'Hollow', 'Red'];

const FIRST = ['Nora', 'Theo', 'Lina', 'Malo', 'Iris', 'Jonas', 'Ada', 'Elio', 'Mira', 'Sven', 'Yara', 'Basile'];
const LAST = ['Vale', 'Marsh', 'Okafor', 'Lindqvist', 'Moreau', 'Kade', 'Ferro', 'Holt', 'Brand', 'Ruiz'];

const svg = (s) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`;

// Image abstraite (silhouette de bâtiment floue) : jamais une vraie photo
const fakeImage = (hue) => {
  const w = 600, h = 400;
  const bars = Array.from({ length: int(3, 7) }, () => {
    const bw = int(40, 140), bh = int(80, 260), x = int(0, w - bw);
    const win = Array.from({ length: int(2, 8) }, () => `<rect x="${x + int(6, bw - 16)}" y="${h - bh + int(10, bh - 30)}" width="8" height="12" fill="hsl(${hue},30%,8%)"/>`).join('');
    return `<rect x="${x}" y="${h - bh}" width="${bw}" height="${bh}" fill="hsl(${hue},12%,${int(14, 24)}%)"/>${win}`;
  }).join('');
  // pastille « Demo image » centrée en bas (visible même rognée en carte haute), typo système (plus de gros FAKE DATA au milieu)
  return svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${hue},14%,${int(24, 32)}%)"/><stop offset="1" stop-color="hsl(${hue},10%,7%)"/></linearGradient><filter id="b"><feGaussianBlur stdDeviation="${rand(2.5, 5).toFixed(1)}"/></filter></defs><rect width="${w}" height="${h}" fill="url(#g)"/><g filter="url(#b)" opacity=".85">${bars}</g></svg>`);
};

const avatar = (name, hue) =>
  svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="hsl(${hue},28%,26%)"/><text x="32" y="41" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="26" fill="#f2eee6">${name.split(' ').map((p) => p[0]).join('')}</text></svg>`);

const pointIn = (country) => {
  const [la1, la2, lo1, lo2] = pick(country.boxes);
  return [+rand(la1, la2).toFixed(6), +rand(lo1, lo2).toFixed(6)];
};

// Même densité partout : nombre de points proportionnel à la surface (bornée pour les très grands pays)
const DENSITY = 2.5 / 1000; // points par km²
const areaKm2 = (c) => c.boxes.reduce((sum, [la1, la2, lo1, lo2]) => sum + (la2 - la1) * 111 * (lo2 - lo1) * 111 * Math.cos(((la1 + la2) / 2) * Math.PI / 180), 0);
const countFor = (c) => Math.max(25, Math.min(700, Math.round(areaKm2(c) * DENSITY)));

const RATINGS = ['amazing', 'nice', 'meh', 'empty'];
const REASONS = ['no_access', 'demolished', 'guarded', 'reused', 'not_found'];

export const generate = () => {
  const DAY = 86400000;
  const now = Date.now();

  const me = { id: id('u', 0), username: 'Demo Explorer', roles: ['ROLE_USER', 'ROLE_DEMO'] };
  me.image = avatar(me.username, 25);

  const people = Array.from({ length: 7 }, (_, i) => {
    const username = `${pick(FIRST)} ${pick(LAST)}`;
    return { id: id('u', i + 1), username, image: avatar(username, int(0, 360)), roles: ['ROLE_USER'] };
  });
  const friends = people.slice(0, 5);
  const pending = people.slice(5, 6);
  const waiting = people.slice(6, 7);

  ctx = { me, friends, now, DAY, n: 0 };
  const locations = makeLocations(demoCountry);
  return finish({ me, people, friends, pending, waiting, locations });
};

// Contexte partagé avec la génération à la demande des autres pays
let ctx = null;
export const makeLocations = (country) => {
  const { me, friends, now, DAY } = ctx;
  return Array.from({ length: countFor(country) }, () => {
    const i = ctx.n++;
    const cat = pick(CATEGORIES);
    const [lat, lon] = pointIn(country);
    const owner = Math.random() < 0.35 ? pick([me, ...friends]) : null;
    const roll = Math.random();
    const status = roll < 0.72 ? 'unvisited' : roll < 0.9 ? 'valid' : 'invalid';
    // Imports plus denses récemment, pour que la frise des dates ait du relief
    const age = Math.pow(Math.random(), 1.8) * 420;
    const hue = int(0, 360);
    return {
      id: id('l', i),
      _n: i,
      _countryId: country.id,
      _categoryId: cat.id,
      userId: owner?.id ?? null,
      userUsername: owner?.username ?? null,
      userImage: owner?.image ?? null,
      userRoles: owner?.roles ?? [],
      disabled: null,
      image: Math.random() < 0.85 ? fakeImage(hue) : null,
      image_maps: null,
      lat,
      lon,
      name: `${Math.random() < 0.5 ? pick(ADJ) + ' ' : ''}${pick(cat.words)} of ${place()}`,
      description: 'Fake demo spot. This place does not exist.',
      status,
      rating: status === 'valid' ? pick(RATINGS) : null,
      invalidReason: status === 'invalid' ? pick(REASONS) : null,
      danger: Math.random() < 0.08 ? 1 : 0,
      visitedAt: status === 'unvisited' ? null : new Date(now - rand(1, 200) * DAY).toISOString(),
      dateAdd: new Date(now - age * DAY).toISOString(),
      categoryName: cat.name,
      categoryIcon: cat.icon,
      categoryColor: '#888888',
      fids: [],
      fake: true,
    };
  });
};

// Pays généré seulement quand on le demande (filtre pays) : toute la planète sans tout calculer d'avance
export const ensureCountries = (db, ids) => {
  db.generated = db.generated || new Set([demoCountry.id]);
  for (const cid of ids) {
    if (db.generated.has(cid)) continue;
    const country = COUNTRIES.find((c) => c.id === cid);
    if (!country) continue;
    db.generated.add(cid);
    db.locations.push(...makeLocations(country));
  }
};

const finish = ({ me, people, friends, pending, waiting, locations }) => {
  // Listes autour d'un point d'ancrage, pour qu'une liste ressemble à une vraie sortie de week-end
  const LIST_NAMES = ['Weekend — north loop', 'Rail ghosts', 'Sanatorium tour', 'Backlog'];
  const favorites = LIST_NAMES.map((name, i) => {
    const anchor = pick(locations);
    const near = locations
      .filter((l) => l.status !== 'invalid')
      .map((l) => [l, (l.lat - anchor.lat) ** 2 + (l.lon - anchor.lon) ** 2])
      .sort((a, b) => a[1] - b[1])
      .slice(0, int(6, 14))
      .map(([l]) => l.id);
    const fav = { id: id('f', i), name, share: i === 0 ? 1 : 0, disabled: 0, status: i === 3 ? 'finished' : 'upcoming', ids: new Set(near), users: [me, ...friends.slice(0, int(0, 2))] };
    near.forEach((lid) => locations.find((l) => l.id === lid).fids.push(fav.id));
    return fav;
  });

  return { me, people, friends, pending, waiting, locations, favorites };
};
