import L from 'leaflet'

const STYLE = { color: '#ff8a1f', weight: 2, fillOpacity: 0.08, dashArray: '6 4', interactive: false }

// Dessin tactile : cercle = tap centre puis tap bord ; polygone = taps successifs puis "Terminer"
export const createZoneDraw = (map, onChange, onPoint = () => {}) => {
  let mode = null
  let layer = null
  let points = []
  let center = null
  let preview = null

  const clearLayers = () => {
    if (layer) map.removeLayer(layer)
    if (preview) map.removeLayer(preview)
    layer = preview = null
  }

  const onClick = (e) => {
    const p = [e.latlng.lat, e.latlng.lng]
    if (mode === 'circle') {
      if (!center) {
        center = p
        preview = L.circleMarker(p, { ...STYLE, radius: 4, fillOpacity: 1 }).addTo(map)
        return
      }
      const radius = map.distance(center, p)
      clearLayers()
      layer = L.circle(center, { ...STYLE, radius }).addTo(map)
      finish({ type: 'circle', lat: center[0], lon: center[1], radius })
    } else if (mode === 'polygon') {
      points.push(p)
      if (preview) map.removeLayer(preview)
      preview = L.polyline(points, STYLE).addTo(map)
      onPoint(points.length)
    }
  }

  const onMove = (e) => {
    if (mode !== 'circle' || !center) return
    const radius = map.distance(center, e.latlng)
    if (layer) layer.setRadius(radius)
    else layer = L.circle(center, { ...STYLE, radius }).addTo(map)
  }

  const finish = (zone) => {
    stopListening()
    mode = null
    onChange(zone)
  }

  const stopListening = () => {
    map.off('click', onClick)
    map.off('mousemove', onMove)
    map.getContainer().classList.remove('map-drawing')
  }

  return {
    start(m) {
      this.clear(false)
      mode = m
      points = []
      center = null
      map.on('click', onClick)
      map.on('mousemove', onMove)
      map.getContainer().classList.add('map-drawing')
    },
    // polygone : valide la forme en cours
    close() {
      if (mode !== 'polygon' || points.length < 3) return false
      clearLayers()
      layer = L.polygon(points, STYLE).addTo(map)
      finish({ type: 'polygon', points })
      return true
    },
    clear(notify = true) {
      stopListening()
      clearLayers()
      mode = null
      if (notify) onChange(null)
    },
    get mode() {
      return mode
    },
    get pointCount() {
      return points.length
    },
  }
}
