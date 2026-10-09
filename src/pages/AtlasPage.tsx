import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import AtlasMap, { type AtlasMapHandle } from '@/components/atlas/AtlasMap'
import {
  fetchAtlasData,
  inPeriod,
  LAYERS,
  PERIODS,
  type AtlasItem,
  type AtlasLayer,
  type PeriodKey,
} from '@/components/atlas/atlasData'

type Status = 'loading' | 'ready' | 'error'

const ALL_LAYERS: Record<AtlasLayer, boolean> = { places: true, kingdoms: true, people: true, countries: true }

export default function AtlasPage() {
  useDocumentTitle('Atlas')

  const [items, setItems] = useState<AtlasItem[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [partial, setPartial] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [layers, setLayers] = useState(ALL_LAYERS)
  const [period, setPeriod] = useState<PeriodKey>('all')
  const [selected, setSelected] = useState<string | null>(null)

  const mapRef = useRef<AtlasMapHandle>(null)
  const mapWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    fetchAtlasData()
      .then(data => {
        if (cancelled) return
        setItems(data.items)
        setPartial(data.partial)
        setStatus('ready')
      })
      .catch(() => { if (!cancelled) setStatus('error') })
    return () => { cancelled = true }
  }, [attempt])

  const counts = useMemo(() => {
    const c: Record<AtlasLayer, number> = { places: 0, kingdoms: 0, people: 0, countries: 0 }
    for (const item of items) {
      if (item.layer === 'kingdoms' || item.layer === 'people') {
        if (inPeriod(item.year, period)) c[item.layer]++
      } else {
        c[item.layer]++
      }
    }
    return c
  }, [items, period])

  const visible = useMemo(
    () => items
      .filter(item => layers[item.layer])
      .filter(item => (item.layer === 'kingdoms' || item.layer === 'people') ? inPeriod(item.year, period) : true)
      .sort((a, b) => a.name.localeCompare(b.name)),
    [items, layers, period]
  )

  const toggleLayer = (layer: AtlasLayer) => setLayers(prev => ({ ...prev, [layer]: !prev[layer] }))

  const focusItem = useCallback((key: string) => {
    setSelected(key)
    const wrap = mapWrapRef.current
    if (wrap) {
      const rect = wrap.getBoundingClientRect()
      if (rect.top < 0 || rect.bottom > window.innerHeight) wrap.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    mapRef.current?.focus(key)
  }, [])

  // Deep link from record pages: /atlas?focus=<record slug>
  const [searchParams] = useSearchParams()
  const focusSlug = searchParams.get('focus')
  useEffect(() => {
    if (status !== 'ready' || !focusSlug) return
    const target = items.find(i => i.slug === focusSlug)
    if (!target) return
    // Give the map a moment to mount its markers before flying.
    const t = setTimeout(() => focusItem(target.key), 300)
    return () => clearTimeout(t)
  }, [status, focusSlug, items, focusItem])

  const layerLabel = (layer: AtlasLayer) => LAYERS.find(l => l.value === layer)?.label ?? ''
  const layerColor = (layer: AtlasLayer) => LAYERS.find(l => l.value === layer)?.color ?? '#999'

  return (
    <div className="min-h-screen bg-sand-50 dark:bg-dark-bg text-gray-900 dark:text-white transition-colors py-10">
      <div className="container-app">
        <header className="mb-8">
          <h1 className="heading-xl text-3xl sm:text-4xl lg:text-5xl text-gray-900 dark:text-white mb-3">Atlas</h1>
          <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
            Places, states and people from the archive, plotted where they happened.
          </p>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-y border-sand-200 dark:border-dark-border mb-6">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Map layers">
            {LAYERS.map(layer => {
              const on = layers[layer.value]
              return (
                <button
                  key={layer.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleLayer(layer.value)}
                  className={cn(
                    'btn btn-sm gap-2 border',
                    on
                      ? 'bg-white dark:bg-dark-surface border-gray-400 dark:border-gray-500 text-gray-900 dark:text-white'
                      : 'btn-ghost border-sand-200 dark:border-dark-border text-gray-500 dark:text-gray-400 opacity-70'
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="inline-block w-3 h-3 rounded-full border border-white shadow-xs"
                    style={{ backgroundColor: on ? layer.color : 'transparent', borderColor: layer.color }}
                  />
                  <span>{layer.label}</span>
                  {status === 'ready' && <span className="text-gray-400 font-normal">{counts[layer.value]}</span>}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="atlas-period" className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Period
            </label>
            <select
              id="atlas-period"
              value={period}
              onChange={e => setPeriod(e.target.value as PeriodKey)}
              className="input text-sm py-1.5 w-auto bg-white dark:bg-dark-surface"
              aria-describedby="atlas-period-note"
            >
              {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>
        <p id="atlas-period-note" className="sr-only">
          The period filter applies to states and kingdoms (by founding year) and people (by birth year).
        </p>

        {status === 'ready' && partial && (
          <p className="mb-4 text-sm text-amber-700 dark:text-amber-400">Some layers could not be loaded. Showing what is available.</p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
          <div ref={mapWrapRef} className="relative">
            <AtlasMap
              ref={mapRef}
              items={visible}
              className="h-[70vh] min-h-[360px] w-full rounded-xl border border-sand-200 dark:border-dark-border z-0"
            />
            {status === 'loading' && (
              <div className="absolute inset-0 z-[500] flex items-center justify-center rounded-xl bg-white/60 dark:bg-black/40" role="status">
                <span className="card px-4 py-2 text-sm text-gray-700 dark:text-gray-200">Loading the atlas…</span>
              </div>
            )}
            {status === 'error' && (
              <div className="absolute inset-0 z-[500] flex items-center justify-center rounded-xl bg-white/70 dark:bg-black/50" role="alert">
                <div className="card p-6 text-center max-w-sm">
                  <h2 className="heading-sm text-gray-900 dark:text-white mb-2">The atlas could not be loaded</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Check your connection and try again.</p>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setAttempt(a => a + 1)}>Try again</button>
                </div>
              </div>
            )}
          </div>

          <aside className="card p-4 flex flex-col lg:h-[70vh] lg:min-h-[360px]" aria-labelledby="atlas-list-heading">
            <div className="flex items-baseline justify-between pb-3 mb-2 border-b border-sand-200 dark:border-dark-border">
              <h2 id="atlas-list-heading" className="font-serif font-bold text-lg text-gray-900 dark:text-white">On the map</h2>
              <span className="text-xs text-gray-500 dark:text-gray-400" aria-live="polite">
                {status === 'ready' ? `${visible.length} item${visible.length === 1 ? '' : 's'}` : ''}
              </span>
            </div>

            {status === 'loading' ? (
              <ul className="space-y-2 animate-pulse" aria-hidden="true">
                {Array.from({ length: 6 }).map((_, i) => (
                  <li key={i} className="h-10 rounded-lg bg-sand-200 dark:bg-dark-card" />
                ))}
              </ul>
            ) : status === 'error' ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Nothing to list yet.</p>
            ) : visible.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 space-y-3">
                <p>
                  {items.length === 0
                    ? 'No records with locations have been added to the archive yet.'
                    : 'Nothing matches the selected layers and period.'}
                </p>
                {items.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => { setLayers(ALL_LAYERS); setPeriod('all') }}
                  >
                    Show everything
                  </button>
                )}
              </div>
            ) : (
              <ul className="overflow-y-auto -mx-2 flex-1 max-h-[60vh] lg:max-h-none">
                {visible.map(item => (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => focusItem(item.key)}
                      aria-current={selected === item.key ? 'true' : undefined}
                      className={cn(
                        'w-full text-left flex items-start gap-3 px-2 py-2 rounded-lg transition-colors',
                        selected === item.key
                          ? 'bg-sand-100 dark:bg-dark-card'
                          : 'hover:bg-sand-100 dark:hover:bg-dark-card'
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className="mt-1.5 inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: layerColor(item.layer) }}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.name}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400 truncate">
                          {item.layer === 'countries'
                            ? `${item.count} record${item.count === 1 ? '' : 's'}`
                            : [layerLabel(item.layer), item.period].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>

        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 max-w-3xl">
          States are shown at their capital and people at their birthplace. Records without their own coordinates are grouped at the
          centre of the African country they relate to. The period filter applies to states (founding year) and people (birth year);
          items without a known year appear only under “All periods”.
        </p>
      </div>
    </div>
  )
}
