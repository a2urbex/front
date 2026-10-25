// Backend simulé de la démo : mêmes routes et mêmes formats que l'API, tout en mémoire.
// Les écritures « jouables » (statut terrain, exploration, ajout à une liste) restent locales ;
// toutes les autres sont bloquées (DemoBlocked). Rien ne quitte le navigateur.
import { generate, CATEGORIES, COUNTRIES } from './data';
import { DemoBlocked } from './session';

const PAGE = 50;
const db = generate();
let exploration = null;
let countrySetting = null;

const clone = (v) => JSON.parse(JSON.stringify(v));
const publicUser = (u) => ({ id: u.id, username: u.username, image: u.image });
const publicLoc = ({ _n, _countryId, _categoryId, ...l }) => l;
const findLoc = (id) => db.locations.find((l) => l.id === id);
const findFav = (id) => db.favorites.find((f) => f.id === id);

const R = 6371000;
const rad = (d) => (d * Math.PI) / 180;
const inZone = (z, lat, lon) => {
  if (z.type === 'circle') {
    const h = Math.sin(rad(lat - z.lat) / 2) ** 2 + Math.cos(rad(z.lat)) * Math.cos(rad(lat)) * Math.sin(rad(lon - z.lon) / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h)) <= z.radius;
  }
  let inside = false;
  const p = z.points;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [yi, xi] = p[i], [yj, xj] = p[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

const filterLocations = (f = {}, base = db.locations) => {
  const cats = (f.categories || []).map(Number);
  const countries = (f.countries || []).map(Number);
  const str = (f.string || '').toLowerCase();
  const from = f.dateFrom ? Date.parse(f.dateFrom) : null;
  const to = f.dateTo ? Date.parse(f.dateTo) : null;
  return base.filter((l) =>
    (!str || l.name.toLowerCase().includes(str)) &&
    (!cats.length || cats.includes(l._categoryId)) &&
    (!countries.length || countries.includes(l._countryId)) &&
    (!f.statuses?.length || f.statuses.includes(l.status)) &&
    (!f.ratings?.length || f.ratings.includes(l.rating)) &&
    (f.showInvalid || l.status !== 'invalid') &&
    (!from || Date.parse(l.dateAdd) >= from) &&
    (!to || Date.parse(l.dateAdd) <= to) &&
    (!f.zone || inZone(f.zone, l.lat, l.lon)),
  );
};

const favList = () =>
  db.favorites.map((f) => ({ id: f.id, name: f.name, share: f.share, disabled: f.disabled, status: f.status, count: f.ids.size, users: f.users.map(publicUser) }));

const routes = [
  // Compte
  ['GET', /^\/account$/, () => ({ id: db.me.id, username: db.me.username, image: db.me.image, isAdmin: false, isDemo: true })],
  ['GET', /^\/account\/country/, () => {
    const code = countrySetting || 'FR';
    return { setting: countrySetting, code, countryId: COUNTRIES.find((c) => c.code === code)?.id ?? 1, source: countrySetting ? 'account' : 'default', countries: COUNTRIES.map(({ code, name }) => ({ code, name })) };
  }],
  ['PUT', /^\/account\/country$/, (_m, b) => { countrySetting = b?.code || null; return { setting: countrySetting }; }],
  ['GET', /^\/account\/([0-9a-z]{24,})$/, ([, uid]) => {
    const u = [db.me, ...db.people].find((p) => p.id === uid) || db.me;
    const owned = db.locations.filter((l) => l.userId === u.id);
    return {
      username: u.username, about: 'Fake demo profile. This person does not exist.', youtube: null, tiktok: null, instagram: null,
      image: u.image, banner: null, urbexCount: owned.length, friendCount: db.friends.length,
      friendStatus: db.friends.some((f) => f.id === u.id) ? 1 : 0, images: owned.filter((l) => l.image).slice(0, 12).map((l) => l.image), roles: u.roles,
    };
  }],

  // Points
  ['GET', /^\/location\/filter$/, () => ({
    categories: Object.fromEntries(CATEGORIES.map((c) => [c.id, c.name])),
    countries: Object.fromEntries(COUNTRIES.map((c) => [c.id, c.name])),
  })],
  ['GET', /^\/location\/count$/, () => ({ total: db.locations.length })],
  ['POST', /^\/location\/p\/(\d+)$/, ([, page], b) => {
    const list = filterLocations(b).sort((a, z) => z._n - a._n);
    return { count: list.length, list: list.slice((page - 1) * PAGE, page * PAGE).map(publicLoc) };
  }],
  ['POST', /^\/location\/map$/, (_m, b) => {
    const list = filterLocations(b);
    return { count: list.length, list: list.map(publicLoc) };
  }],
  ['POST', /^\/location\/histogram$/, (_m, b) => {
    const weeks = new Map();
    for (const l of filterLocations({ ...b, dateFrom: null, dateTo: null })) {
      const d = new Date(l.dateAdd);
      d.setUTCHours(0, 0, 0, 0);
      d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
      const k = d.toISOString().slice(0, 10);
      weeks.set(k, (weeks.get(k) || 0) + 1);
    }
    return [...weeks].sort().map(([week, total]) => ({ week, total }));
  }],
  ['GET', /^\/location\/([0-9a-z]{24,})$/, ([, lid]) => publicLoc(findLoc(lid) || db.locations[0])],
  ['POST', /^\/location\/([0-9a-z]{24,})\/visit$/, ([, lid], b) => {
    const l = findLoc(lid);
    if (!l) return {};
    l.status = b.status;
    l.rating = b.status === 'valid' ? b.rating || null : null;
    l.invalidReason = b.status === 'invalid' ? b.reason || 'not_found' : null;
    l.danger = b.danger ? 1 : 0;
    l.visitedAt = new Date().toISOString();
    // « Bullshit » : le point disparaît, comme sur le vrai serveur
    if (l.invalidReason === 'bullshit') {
      db.locations = db.locations.filter((x) => x !== l);
      return { removed: true };
    }
    return publicLoc(l);
  }],

  // Listes
  ['GET', /^\/favorite$/, favList],
  ['GET', /^\/favorite\/summary$/, () => favList().filter((f) => !f.disabled)],
  ['GET', /^\/favorite\/([0-9a-z]{24,})\/search/, () => db.people.map(publicUser)],
  ['GET', /^\/favorite\/([0-9a-z]{24,})$/, ([, fid], _b, q) => {
    const f = findFav(fid);
    if (!f) return { name: 'Unknown list', status: 'upcoming', count: 0, list: [] };
    const list = filterLocations({ showInvalid: q.get('showInvalid') === '1' }, db.locations.filter((l) => f.ids.has(l.id)));
    return { name: f.name, status: f.status, count: list.length, list: list.map(publicLoc) };
  }],
  ['PUT', /^\/favorite\/([0-9a-z]{24,})\/location\/([0-9a-z]{24,})$/, ([, fid, lid]) => {
    const f = findFav(fid), l = findLoc(lid);
    if (!f || !l) return {};
    if (f.ids.has(lid)) { f.ids.delete(lid); l.fids = l.fids.filter((x) => x !== fid); }
    else { f.ids.add(lid); l.fids.push(fid); }
    return {};
  }],
  ['POST', /^\/favorite\/([0-9a-z]{24,})\/locations$/, ([, fid], b) => {
    const f = findFav(fid);
    let added = 0;
    for (const lid of b?.ids || []) if (f && !f.ids.has(lid) && findLoc(lid)) { f.ids.add(lid); findLoc(lid).fids.push(fid); added++; }
    return { added };
  }],

  // Exploration (une à la fois, en mémoire)
  ['GET', /^\/exploration$/, () => exploration],
  ['POST', /^\/exploration$/, (_m, b) => {
    const f = findFav(b?.favoriteId);
    if (!f) return null;
    if (exploration && exploration.favoriteId !== f.id) throw new Error(`"${exploration.name}" is already being explored`);
    f.status = 'in_progress';
    const now = Date.now();
    exploration = { favoriteId: f.id, name: f.name, startedAt: new Date(now).toISOString(), expiresAt: new Date(now + 12 * 3600000).toISOString() };
    return exploration;
  }],
  ['DELETE', /^\/exploration$/, (_m, _b, q) => {
    if (exploration) findFav(exploration.favoriteId).status = q.get('reset') === '1' ? 'upcoming' : 'finished';
    exploration = null;
    return null;
  }],

  // Amis
  ['GET', /^\/friend$/, () => ({ friends: db.friends.map(publicUser), pending: db.pending.map(publicUser), waiting: db.waiting.map(publicUser) })],
  ['GET', /^\/friend\/search/, (_m, _b, q) => {
    const s = (q.get('string') || '').toLowerCase();
    return db.people.filter((p) => p.username.toLowerCase().includes(s)).map(publicUser);
  }],

  // Notifications : indisponibles en démo
  ['GET', /^\/push\/key$/, () => ({ key: null })],
  ['GET', /^\/push\/preferences$/, () => []],
];

export const demoRequest = async (method, route, body) => {
  const url = new URL(route, 'http://demo.local');
  for (const [m, re, handler] of routes) {
    if (m !== method) continue;
    const match = url.pathname.match(re);
    if (match) return clone(handler(match, body, url.searchParams) ?? null);
  }
  // Toute autre écriture (ajout de point, création de liste, profil, amis…) est désactivée
  if (method !== 'GET') throw new DemoBlocked();
  return null;
};
