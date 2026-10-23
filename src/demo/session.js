// Session démo : purement côté navigateur. En démo, aucune requête ne part vers l'API (voir services/api.js).
const KEY = 'a2-demo';
export const DEMO_TOKEN = 'demo';

export const isDemo = () => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};

export const startDemo = () => {
  localStorage.setItem(KEY, '1');
  localStorage.setItem('authToken', DEMO_TOKEN);
};

export const stopDemo = () => {
  localStorage.removeItem(KEY);
  if (localStorage.getItem('authToken') === DEMO_TOKEN) localStorage.removeItem('authToken');
};

export class DemoBlocked extends Error {
  constructor() {
    super('You are in demo mode. This action is disabled and nothing is saved.');
  }
}
