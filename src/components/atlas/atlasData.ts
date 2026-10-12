import { supabase } from '@/lib/supabase'
import { knowledgeTypeLabel } from '@/lib/knowledge'
import { AFRICAN_COUNTRIES } from './africanCountries'

export type AtlasLayer = 'places' | 'kingdoms' | 'people' | 'countries'

export interface AtlasRecordLink {
  slug: string | null
  title: string
}

export interface AtlasItem {
  /** Unique across layers, e.g. "places:<uuid>". */
  key: string
  layer: AtlasLayer
  name: string
  lat: number
  lng: number
  slug: string | null
  typeLabel: string
  /** Human-readable period, e.g. "c. 1235 – 1600". */
  period: string | null
  /** Year used for the period filter (founding or birth year). */
  year: number | null
  summary: string | null
  /** Extra context such as the capital or birthplace name. */
  location: string | null
  /** Country aggregates only. */
  count?: number
  records?: AtlasRecordLink[]
}

export const LAYERS: Array<{ value: AtlasLayer; label: string; color: string }> = [
  { value: 'places', label: 'Places', color: '#0F5132' },
  { value: 'kingdoms', label: 'States & kingdoms', color: '#B8860B' },
  { value: 'people', label: 'People', color: '#B5482A' },
  { value: 'countries', label: 'Records by country', color: '#3B5BA9' },
]

export const LAYER_COLOR: Record<AtlasLayer, string> = Object.fromEntries(
  LAYERS.map(l => [l.value, l.color])
) as Record<AtlasLayer, string>

export type PeriodKey = 'all' | 'pre500' | '500-1500' | '1500-1900' | '1900-'

export const PERIODS: Array<{ value: PeriodKey; label: string }> = [
  { value: 'all', label: 'All periods' },
  { value: 'pre500', label: 'Before 500 CE' },
  { value: '500-1500', label: '500–1500' },
  { value: '1500-1900', label: '1500–1900' },
  { value: '1900-', label: '1900–present' },
]

export function inPeriod(year: number | null, period: PeriodKey): boolean {
  if (period === 'all') return true
  if (year == null) return false
  switch (period) {
    case 'pre500': return year < 500
    case '500-1500': return year >= 500 && year < 1500
    case '1500-1900': return year >= 1500 && year < 1900
    case '1900-': return year >= 1900
  }
}

export function formatYear(year: number): string {
  return year < 0 ? `${Math.abs(year)} BCE` : String(year)
}

function formatRange(start: number | null, end: number | null, prefixes: [string, string]): string | null {
  if (start != null && end != null) return `${formatYear(start)} – ${formatYear(end)}`
  if (start != null) return `${prefixes[0]} ${formatYear(start)}`
  if (end != null) return `${prefixes[1]} ${formatYear(end)}`
  return null
}

interface KnowledgeEmbed {
  id?: string
  slug: string | null
  title: string | null
  summary: string | null
  knowledge_type?: string | null
  verification_status: string | null
}

interface PlaceEmbed {
  name: string | null
  latitude: number | null
  longitude: number | null
}

interface PlaceRow extends PlaceEmbed {
  id: string
  knowledge_item_id: string | null
  modern_country: string | null
  historical_region: string | null
  knowledge_items: KnowledgeEmbed | null
}

interface KingdomRow {
  id: string
  knowledge_item_id: string | null
  name: string | null
  founding_year: number | null
  dissolution_year: number | null
  modern_countries: string[] | null
  knowledge_items: KnowledgeEmbed | null
  capital: PlaceEmbed | null
}

interface PersonRow {
  id: string
  knowledge_item_id: string | null
  name: string | null
  birth_year: number | null
  death_year: number | null
  knowledge_items: KnowledgeEmbed | null
  birth_place: PlaceEmbed | null
}

interface RecordRow {
  id: string
  slug: string | null
  title: string
  summary: string | null
  knowledge_type: string | null
  country_codes: string[] | null
  verification_status: string | null
}

const KI_FIELDS = 'slug, title, summary, knowledge_type, verification_status'

function isFlagged(ki: KnowledgeEmbed | null | undefined): boolean {
  return ki?.verification_status === 'flagged'
}

function hasCoords(p: PlaceEmbed | null | undefined): p is PlaceEmbed & { latitude: number; longitude: number } {
  return !!p && typeof p.latitude === 'number' && typeof p.longitude === 'number'
}

export interface AtlasData {
  items: AtlasItem[]
  /** True when at least one of the queries failed. */
  partial: boolean
}

const PAGE = 1000

/** The API returns at most 1,000 rows per request, so read larger tables page by page. */
async function fetchAll(
  build: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>
): Promise<{ data: unknown[]; error: { message: string } | null }> {
  const rows: unknown[] = []
  for (let page = 0; page < 40; page++) {
    const { data, error } = await build(page * PAGE, page * PAGE + PAGE - 1)
    if (error) return { data: rows, error }
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE) break
  }
  return { data: rows, error: null }
}

export async function fetchAtlasData(): Promise<AtlasData> {
  const [placesRes, kingdomsRes, peopleRes, recordsRes] = await Promise.all([
    fetchAll((from, to) =>
      supabase
        .from('places')
        .select(`id, knowledge_item_id, name, modern_country, historical_region, latitude, longitude, knowledge_items(${KI_FIELDS})`)
        .not('latitude', 'is', null)
        .order('id')
        .range(from, to)
    ),
    fetchAll((from, to) =>
      supabase
        .from('kingdoms_or_states')
        .select(`id, knowledge_item_id, name, founding_year, dissolution_year, modern_countries, knowledge_items(${KI_FIELDS}), capital:places!kingdoms_or_states_capital_place_id_fkey(name, latitude, longitude)`)
        .not('capital_place_id', 'is', null)
        .order('id')
        .range(from, to)
    ),
    fetchAll((from, to) =>
      supabase
        .from('people')
        .select(`id, knowledge_item_id, name, birth_year, death_year, knowledge_items(${KI_FIELDS}), birth_place:places!people_birth_place_id_fkey(name, latitude, longitude)`)
        .not('birth_place_id', 'is', null)
        .order('id')
        .range(from, to)
    ),
    // Objects without coordinates are grouped by country; scholarly works are left out.
    fetchAll((from, to) =>
      supabase
        .from('knowledge_items')
        .select('id, slug, title, summary, knowledge_type, country_codes, verification_status')
        .in('knowledge_type', ['cultural_artifact', 'manuscript'])
        .not('country_codes', 'eq', '{}')
        .order('id')
        .range(from, to)
    ),
  ])

  const failures = [placesRes, kingdomsRes, peopleRes, recordsRes].filter(r => r.error).length
  if (failures === 4) throw new Error('Atlas data could not be loaded')

  const items: AtlasItem[] = []
  const plotted = new Set<string>()

  for (const row of (placesRes.data ?? []) as unknown as PlaceRow[]) {
    const ki = row.knowledge_items
    if (isFlagged(ki) || !hasCoords(row)) continue
    if (row.knowledge_item_id) plotted.add(row.knowledge_item_id)
    const region = [row.historical_region, row.modern_country].filter(Boolean).join(', ')
    items.push({
      key: `places:${row.id}`,
      layer: 'places',
      name: row.name || ki?.title || 'Unnamed place',
      lat: row.latitude,
      lng: row.longitude,
      slug: ki?.slug ?? null,
      typeLabel: ki?.knowledge_type ? knowledgeTypeLabel(ki.knowledge_type) : 'Place',
      period: null,
      year: null,
      summary: ki?.summary ?? null,
      location: region || null,
    })
  }

  for (const row of (kingdomsRes.data ?? []) as unknown as KingdomRow[]) {
    const ki = row.knowledge_items
    if (isFlagged(ki) || !hasCoords(row.capital)) continue
    if (row.knowledge_item_id) plotted.add(row.knowledge_item_id)
    items.push({
      key: `kingdoms:${row.id}`,
      layer: 'kingdoms',
      name: row.name || ki?.title || 'Unnamed state',
      lat: row.capital.latitude,
      lng: row.capital.longitude,
      slug: ki?.slug ?? null,
      typeLabel: 'State or kingdom',
      period: formatRange(row.founding_year, row.dissolution_year, ['From', 'Until']),
      year: row.founding_year,
      summary: ki?.summary ?? null,
      location: row.capital.name ? `Capital: ${row.capital.name}` : null,
    })
  }

  for (const row of (peopleRes.data ?? []) as unknown as PersonRow[]) {
    const ki = row.knowledge_items
    if (isFlagged(ki) || !hasCoords(row.birth_place)) continue
    if (row.knowledge_item_id) plotted.add(row.knowledge_item_id)
    items.push({
      key: `people:${row.id}`,
      layer: 'people',
      name: row.name || ki?.title || 'Unnamed person',
      lat: row.birth_place.latitude,
      lng: row.birth_place.longitude,
      slug: ki?.slug ?? null,
      typeLabel: 'Person',
      period: formatRange(row.birth_year, row.death_year, ['Born', 'Died']),
      year: row.birth_year,
      summary: ki?.summary ?? null,
      location: row.birth_place.name ? `Born in ${row.birth_place.name}` : null,
    })
  }

  // Records without their own coordinates, grouped by African country.
  const byCountry = new Map<string, AtlasRecordLink[]>()
  for (const row of (recordsRes.data ?? []) as unknown as RecordRow[]) {
    if (row.verification_status === 'flagged' || plotted.has(row.id)) continue
    const codes = new Set((row.country_codes ?? []).map(c => c.trim().toUpperCase()))
    for (const code of codes) {
      if (!AFRICAN_COUNTRIES[code]) continue
      const list = byCountry.get(code) ?? []
      list.push({ slug: row.slug, title: row.title })
      byCountry.set(code, list)
    }
  }
  for (const [code, records] of byCountry) {
    const c = AFRICAN_COUNTRIES[code]
    records.sort((a, b) => a.title.localeCompare(b.title))
    items.push({
      key: `countries:${code}`,
      layer: 'countries',
      name: c.name,
      lat: c.lat,
      lng: c.lng,
      slug: null,
      typeLabel: 'Records by country',
      period: null,
      year: null,
      summary: null,
      location: null,
      count: records.length,
      records,
    })
  }

  return { items, partial: failures > 0 }
}
