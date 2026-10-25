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

// Zones intérieures approximatives (évite la mer) ; coordonnées tirées au hasard dedans
export const COUNTRIES = [
  { id: 1, code: 'FR', name: 'France', w: 5, boxes: [[44.0, 49.2, -0.3, 6.3]] },
  { id: 2, code: 'BE', name: 'Belgium', w: 1, boxes: [[50.2, 51.1, 3.6, 5.8]] },
  { id: 3, code: 'DE', name: 'Germany', w: 3, boxes: [[48.3, 53.3, 7.2, 13.5]] },
  { id: 4, code: 'IT', name: 'Italy', w: 2, boxes: [[44.0, 45.8, 7.6, 12.2], [40.8, 42.6, 13.6, 15.8]] },
  { id: 5, code: 'ES', name: 'Spain', w: 2, boxes: [[37.6, 42.4, -6.2, -0.8]] },
  { id: 6, code: 'PT', name: 'Portugal', w: 1, boxes: [[38.6, 41.7, -8.4, -7.1]] },
  { id: 7, code: 'CH', name: 'Switzerland', w: 1, boxes: [[46.3, 47.5, 6.7, 9.6]] },
];

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
  return svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${hue},25%,${int(22, 34)}%)"/><stop offset="1" stop-color="hsl(${hue},20%,6%)"/></linearGradient><filter id="b"><feGaussianBlur stdDeviation="${rand(1.5, 4).toFixed(1)}"/></filter></defs><rect width="${w}" height="${h}" fill="url(#g)"/><g filter="url(#b)">${bars}</g><rect x="${w / 2 - 44}" y="${h / 2 - 10}" width="88" height="20" fill="rgba(0,0,0,.4)"/><text x="${w / 2}" y="${h / 2 + 4}" text-anchor="middle" font-family="monospace" font-weight="700" font-size="12" letter-spacing="1.5" fill="rgba(255,190,120,.75)">FAKE DATA</text></svg>`);
};

const avatar = (name, hue) =>
  svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="hsl(${hue},28%,26%)"/><text x="32" y="41" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="26" fill="#f2eee6">${name.split(' ').map((p) => p[0]).join('')}</text></svg>`);

const pointIn = (country) => {
  const [la1, la2, lo1, lo2] = pick(country.boxes);
  return [+rand(la1, la2).toFixed(6), +rand(lo1, lo2).toFixed(6)];
};

const weightedCountry = () => {
  const total = COUNTRIES.reduce((s, c) => s + c.w, 0);
  let r = Math.random() * total;
  for (const c of COUNTRIES) if ((r -= c.w) <= 0) return c;
  return COUNTRIES[0];
};

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

  const count = int(1500, 2200);
  const locations = Array.from({ length: count }, (_, i) => {
    const cat = pick(CATEGORIES);
    const country = weightedCountry();
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
