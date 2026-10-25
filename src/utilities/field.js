export const RATINGS = [
  { key: 'amazing', emoji: '😍', label: 'Amazing' },
  { key: 'nice', emoji: '🙂', label: 'Nice' },
  { key: 'meh', emoji: '😐', label: 'Meh' },
  { key: 'empty', emoji: '🙁', label: 'Empty' },
]

// Motifs proposés. « Bullshit » masque le point pour tout le monde, tout de suite.
export const REASONS = [
  { key: 'bullshit', emoji: '💩', label: 'Bullshit' },
  { key: 'no_access', emoji: '🚧', label: 'No access' },
  { key: 'demolished', emoji: '💥', label: 'Demolished' },
  { key: 'guarded', emoji: '👮', label: 'Guarded' },
  { key: 'reused', emoji: '🏠', label: 'Reused / inhabited' },
  { key: 'not_found', emoji: '❓', label: 'Not found' },
]

// Anciens motifs, encore affichés sur les points déjà marqués
const LEGACY_REASONS = [{ key: 'walled', emoji: '🧱', label: 'Walled' }]
export const reasonOf = (key) => REASONS.find((r) => r.key === key) || LEGACY_REASONS.find((r) => r.key === key)

export const statusEmoji = (item) => {
  if (item?.status === 'valid') return RATINGS.find((r) => r.key === item.rating)?.emoji || '✅'
  if (item?.status === 'invalid') return reasonOf(item.invalidReason)?.emoji || '❌'
  return ''
}

export const distanceM = (a, b) => {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b[0] - a[0])
  const dLon = toRad(b[1] - a[1])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export const formatDistance = (m) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`)
