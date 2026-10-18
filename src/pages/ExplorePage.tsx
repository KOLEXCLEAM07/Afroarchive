import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Crown, Landmark, Loader2, MapPin, Search, User, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatYear, yearSpan } from '@/lib/knowledge'
import { fetchAllRows } from '@/lib/knowledgeQuery'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/utils'

type Kind = 'people' | 'places' | 'states' | 'peoples'

interface Entry {
  key: string
  name: string
  slug: string
  meta: string | null
  detail: string | null
  sortYear: number | null
}

interface LinkedItem { slug: string | null; summary: string | null; verification_status: string | null }

interface PeopleRow { id: string; name: string; birth_year: number | null; death_year: number | null; is_approximate_dates: boolean | null; era: string | null; occupations: string[] | null; item: LinkedItem | null }
interface PlaceRow { id: string; name: string; modern_country: string | null; historical_region: string | null; item: LinkedItem | null }
interface StateRow { id: string; name: string; founding_year: number | null; dissolution_year: number | null; modern_countries: string[] | null; item: LinkedItem | null }
interface CultureRow { id: string; name: string; historical_period: string | null; geographic_distribution: string[] | null; item: LinkedItem | null }

const KINDS: Array<{ key: Kind; label: string; icon: typeof User; empty: string }> = [
  { key: 'people', label: 'People', icon: User, empty: 'No people have been added yet.' },
  { key: 'places', label: 'Places', icon: MapPin, empty: 'No places have been added yet.' },
  { key: 'states', label: 'States & kingdoms', icon: Crown, empty: 'No states or kingdoms have been added yet.' },
  { key: 'peoples', label: 'Peoples & cultures', icon: Users, empty: 'No peoples or cultures have been added yet.' },
]

const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

function usable(item: LinkedItem | null): item is LinkedItem & { slug: string } {
  return !!item?.slug && item.verification_status !== 'flagged'
}

async function load(kind: Kind): Promise<Entry[]> {
  const item = 'item:knowledge_items(slug, summary, verification_status)'
  switch (kind) {
    case 'people': {
      const { data, error } = await fetchAllRows<PeopleRow>((from, to) =>
        supabase.from('people').select(`id, name, birth_year, death_year, is_approximate_dates, era, occupations, ${item}`).order('name').order('id').range(from, to))
      if (error) throw new Error(error.message)
      return data.flatMap(r => {
        if (!usable(r.item)) return []
        const approx = !!r.is_approximate_dates
        return [{ key: r.id, name: r.name, slug: r.item.slug, sortYear: r.birth_year ?? r.death_year,
          meta: yearSpan(formatYear(r.birth_year, approx), formatYear(r.death_year, approx)) ?? r.era,
          detail: r.occupations?.slice(0, 3).join(', ') || r.item.summary }]
      })
    }
    case 'places': {
      const { data, error } = await fetchAllRows<PlaceRow>((from, to) =>
        supabase.from('places').select(`id, name, modern_country, historical_region, ${item}`).order('name').order('id').range(from, to))
      if (error) throw new Error(error.message)
      return data.flatMap(r => {
        if (!usable(r.item)) return []
        return [{ key: r.id, name: r.name, slug: r.item.slug, sortYear: null,
          meta: [r.modern_country, r.historical_region].filter(Boolean).join(' · ') || null, detail: r.item.summary }]
      })
    }
    case 'states': {
      const { data, error } = await fetchAllRows<StateRow>((from, to) =>
        supabase.from('kingdoms_or_states').select(`id, name, founding_year, dissolution_year, modern_countries, ${item}`).order('name').order('id').range(from, to))
      if (error) throw new Error(error.message)
      return data.flatMap(r => {
        if (!usable(r.item)) return []
        return [{ key: r.id, name: r.name, slug: r.item.slug, sortYear: r.founding_year,
          meta: yearSpan(formatYear(r.founding_year), formatYear(r.dissolution_year)),
          detail: r.modern_countries?.length ? `Today: ${r.modern_countries.join(', ')}` : r.item.summary }]
      })
    }
    case 'peoples': {
      const { data, error } = await fetchAllRows<CultureRow>((from, to) =>
        supabase.from('cultures').select(`id, name, historical_period, geographic_distribution, ${item}`).order('name').order('id').range(from, to))
      if (error) throw new Error(error.message)
      return data.flatMap(r => {
        if (!usable(r.item)) return []
        return [{ key: r.id, name: r.name, slug: r.item.slug, sortYear: null,
          meta: r.geographic_distribution?.join(', ') || r.historical_period, detail: r.item.summary }]
      })
    }
  }
}

export default function ExplorePage() {
  const [params, setParams] = useSearchParams()
  const kind = (KINDS.some(k => k.key === params.get('type')) ? params.get('type') : 'people') as Kind
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'name' | 'date'>('name')
  const [error, setError] = useState(false)
  useDocumentTitle('People, places & states')

  useEffect(() => {
    let cancelled = false
    setEntries(null)
    setError(false)
    load(kind)
      .then(e => { if (!cancelled) setEntries(e) })
      .catch(() => { if (!cancelled) { setEntries([]); setError(true) } })
    return () => { cancelled = true }
  }, [kind])

  const shown = useMemo(() => {
    const q = fold(query.trim())
    const list = (entries ?? []).filter(e => !q || fold(`${e.name} ${e.meta ?? ''} ${e.detail ?? ''}`).includes(q))
    return list.sort((a, b) => sort === 'date' && (a.sortYear !== null || b.sortYear !== null)
      ? (a.sortYear ?? Infinity) - (b.sortYear ?? Infinity)
      : a.name.localeCompare(b.name))
  }, [entries, query, sort])

  const active = KINDS.find(k => k.key === kind)!
  const datable = kind === 'people' || kind === 'states'

  return (
    <div className="min-h-screen bg-sand-50 dark:bg-dark-bg py-10">
      <div className="container-app">
        <h1 className="heading-xl text-3xl sm:text-4xl text-gray-900 dark:text-white mb-2">People, places & states</h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mb-8">
          Reference entries for the people, places and polities that appear across the archive. <Link to="/atlas" className="text-primary-600 dark:text-primary-400 hover:underline">See them on the atlas</Link>.
        </p>

        <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between mb-8">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar" role="tablist" aria-label="Entry type">
            {KINDS.map(k => (
              <button key={k.key} type="button" role="tab" aria-selected={kind === k.key}
                onClick={() => setParams({ type: k.key }, { replace: true })}
                className={cn('inline-flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold border transition-colors',
                  kind === k.key ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-dark-surface border-sand-200 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:border-primary-400')}>
                <k.icon className="w-3.5 h-3.5" aria-hidden="true" /> {k.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1 lg:w-72">
              <label htmlFor="explore-search" className="sr-only">Filter entries</label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input id="explore-search" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={`Filter ${active.label.toLowerCase()}…`} className="input pl-9 text-sm bg-white dark:bg-dark-surface" />
            </div>
            {datable && (
              <select aria-label="Sort" value={sort} onChange={e => setSort(e.target.value as 'name' | 'date')} className="input text-sm w-auto bg-white dark:bg-dark-surface">
                <option value="name">A–Z</option>
                <option value="date">Oldest first</option>
              </select>
            )}
          </div>
        </div>

        {entries === null ? (
          <div className="flex justify-center py-16" role="status"><Loader2 className="w-7 h-7 animate-spin text-primary-500" /></div>
        ) : error ? (
          <div className="card p-10 text-center max-w-lg mx-auto">
            <Landmark className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Could not load these entries. Please try again.</p>
          </div>
        ) : shown.length === 0 ? (
          <div className="card p-10 text-center max-w-lg mx-auto">
            <Landmark className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">{query ? `Nothing matches “${query}”.` : active.empty}</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shown.map(e => (
              <li key={e.key}>
                <Link to={`/article/${e.slug}`} className="card-hover block h-full p-5 bg-white dark:bg-dark-surface rounded-2xl border border-sand-200 dark:border-dark-border">
                  <h2 className="font-serif font-bold text-lg text-gray-900 dark:text-white">{e.name}</h2>
                  {e.meta && <p className="text-xs font-medium text-primary-600 dark:text-primary-400 mt-0.5">{e.meta}</p>}
                  {e.detail && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-3">{e.detail}</p>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
