// « En ligne » / « vu il y a … » à partir de lastActiveAt (l'API l'écrit au plus une fois par minute)
const ONLINE_MS = 5 * 60 * 1000;

export const isOnline = (at) => !!at && Date.now() - new Date(at).getTime() < ONLINE_MS;

export const activityLabel = (at) => {
  if (!at) return '';
  if (isOnline(at)) return 'Online';
  const min = Math.floor((Date.now() - new Date(at).getTime()) / 60000);
  if (min < 60) return `Active ${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Active ${h} h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Active yesterday';
  if (d < 30) return `Active ${d} days ago`;
  return `Active on ${new Date(at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
};
