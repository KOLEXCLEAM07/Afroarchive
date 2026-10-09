import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { LAYER_COLOR, type AtlasItem } from './atlasData'

export interface AtlasMapHandle {
  focus: (key: string) => void
}

interface AtlasMapProps {
  items: AtlasItem[]
  className?: string
}

const AFRICA_CENTER: L.LatLngTuple = [2, 18]
const AFRICA_BOUNDS = L.latLngBounds([-48, -40], [48, 78])

const iconCache = new Map<string, L.DivIcon>()

function markerIcon(item: AtlasItem): L.DivIcon {
  const color = LAYER_COLOR[item.layer]
  const cacheKey = item.layer === 'countries' ? `countries:${item.count ?? 0}` : item.layer
  const cached = iconCache.get(cacheKey)
  if (cached) return cached

  let icon: L.DivIcon
  if (item.layer === 'countries') {
    const count = item.count ?? 0
    const size = Math.round(Math.min(56, 24 + Math.sqrt(count) * 6))
    icon = L.divIcon({
      className: 'atlas-marker',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
      html: `<span style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:9999px;background:${color}cc;border:2px solid #fff;color:#fff;font:600 12px/1 'Plus Jakarta Sans',system-ui,sans-serif;box-shadow:0 1px 4px rgba(0,0,0,.35)">${count}</span>`,
    })
  } else {
    const size = 16
    icon = L.divIcon({
      className: 'atlas-marker',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
      html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></span>`,
    })
  }
  iconCache.set(cacheKey, icon)
  return icon
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

function PopupBody({ item }: { item: AtlasItem }) {
  if (item.layer === 'countries') {
    const records = item.records ?? []
    return (
      <div className="min-w-[200px] max-w-[260px] text-gray-900">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{item.typeLabel}</div>
        <h3 className="font-serif font-bold text-base leading-snug mt-0.5">{item.name}</h3>
        <div className="text-xs text-gray-600 mt-1">
          {records.length} record{records.length === 1 ? '' : 's'} associated with this country.
        </div>
        <ul className="mt-2 max-h-48 overflow-y-auto space-y-1 pr-1">
          {records.map((r, i) => (
            <li key={`${r.slug ?? 'record'}-${i}`} className="text-xs leading-snug">
              {r.slug ? (
                <Link to={`/article/${r.slug}`} className="text-primary-700! hover:underline">{r.title}</Link>
              ) : (
                <span>{r.title}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="min-w-[200px] max-w-[260px] text-gray-900">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{item.typeLabel}</div>
      <h3 className="font-serif font-bold text-base leading-snug mt-0.5">{item.name}</h3>
      {(item.period || item.location) && (
        <div className="text-xs text-gray-600 mt-1">
          {[item.period, item.location].filter(Boolean).join(' · ')}
        </div>
      )}
      {item.summary && <div className="text-xs text-gray-700 mt-2 line-clamp-4">{item.summary}</div>}
      {item.slug && (
        <Link to={`/article/${item.slug}`} className="btn btn-primary btn-sm mt-3 text-white!">
          Open record
        </Link>
      )}
    </div>
  )
}

const AtlasMap = forwardRef<AtlasMapHandle, AtlasMapProps>(function AtlasMap({ items, className }, ref) {
  const [map, setMap] = useState<L.Map | null>(null)
  const markers = useRef(new Map<string, L.Marker>())

  useImperativeHandle(ref, () => ({
    focus(key: string) {
      const marker = markers.current.get(key)
      if (!map || !marker) return
      const target = marker.getLatLng()
      const zoom = Math.max(map.getZoom(), 6)
      map.closePopup()
      if (prefersReducedMotion()) {
        map.setView(target, zoom, { animate: false })
        marker.openPopup()
        return
      }
      map.once('moveend', () => marker.openPopup())
      map.flyTo(target, zoom, { duration: 0.8 })
    },
  }), [map])

  return (
    <MapContainer
      ref={setMap}
      center={AFRICA_CENTER}
      zoom={3}
      minZoom={2}
      maxZoom={12}
      maxBounds={AFRICA_BOUNDS}
      maxBoundsViscosity={0.8}
      worldCopyJump={false}
      scrollWheelZoom
      className={className}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {items.map(item => (
        <Marker
          key={item.key}
          position={[item.lat, item.lng]}
          icon={markerIcon(item)}
          title={item.layer === 'countries' ? `${item.name}: ${item.count} records` : item.name}
          alt={item.name}
          zIndexOffset={item.layer === 'countries' ? -100 : 0}
          ref={m => {
            if (m) markers.current.set(item.key, m)
            else markers.current.delete(item.key)
          }}
        >
          <Popup>
            <PopupBody item={item} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
})

export default AtlasMap
