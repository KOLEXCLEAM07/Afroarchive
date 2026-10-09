import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Info, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatYear, knowledgeTypeLabel, yearSpan as span } from '@/lib/knowledge'

type Fact = { label: string; value: ReactNode }
interface Related { slug: string; title: string; knowledge_type: string | null }

interface PlaceRow { name: string; historical_names: string[] | null; modern_country: string | null; historical_region: string | null; latitude: number | null; longitude: number | null }
interface StateRow { founding_year: number | null; dissolution_year: number | null; political_structure: string | null; notable_rulers: string[] | null; modern_countries: string[] | null; capital: { name: string } | null }
interface PersonRow { birth_year: number | null; death_year: number | null; is_approximate_dates: boolean | null; era: string | null; occupations: string[] | null; alternative_names: string[] | null; birth_place: { name: string } | null }
interface WorkRow { publication_year: number | null; venue_name: string | null; publisher: string | null; doi: string | null; is_open_access: boolean | null; open_access_pdf_url: string | null; citation_count: number | null; work_type: string | null }
interface CultureRow { geographic_distribution: string[] | null; linguistic_affiliations: string[] | null; historical_period: string | null }

async function loadFacts(recordId: string, type: string | null): Promise<{ facts: Fact[]; mapSlug?: boolean }> {
  const facts: Fact[] = []
  const add = (label: string, value: ReactNode | null | undefined) => {
    if (value !== null && value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0)) facts.push({ label, value })
  }
  const list = (arr: string[] | null | undefined) => (arr && arr.length ? arr.join(', ') : null)

  switch (type) {
    case 'place': {
      const { data } = await supabase.from('places')
        .select('name, historical_names, modern_country, historical_region, latitude, longitude')
        .eq('knowledge_item_id', recordId).maybeSingle()
      const p = data as PlaceRow | null
      if (!p) break
      add('Also known as', list(p.historical_names))
      add('Modern country', p.modern_country)
      add('Historical region', p.historical_region)
      if (p.latitude !== null && p.longitude !== null) {
        add('Location', (
          <a href={`https://www.openstreetmap.org/?mlat=${p.latitude}&mlon=${p.longitude}#map=12/${p.latitude}/${p.longitude}`}
            target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline">
            {p.latitude.toFixed(3)}, {p.longitude.toFixed(3)} <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </a>
        ))
        return { facts, mapSlug: true }
      }
      break
    }
    case 'kingdom_or_state': {
      const { data } = await supabase.from('kingdoms_or_states')
        .select('founding_year, dissolution_year, political_structure, notable_rulers, modern_countries, capital:places!kingdoms_or_states_capital_place_id_fkey(name)')
        .eq('knowledge_item_id', recordId).maybeSingle()
      const k = data as unknown as StateRow | null
      if (!k) break
      add('Period', span(formatYear(k.founding_year), formatYear(k.dissolution_year)))
      add('Capital', k.capital?.name)
      add('Government', k.political_structure)
      add('Notable rulers', list(k.notable_rulers))
      add('Today part of', list(k.modern_countries))
      break
    }
    case 'person': {
      const { data } = await supabase.from('people')
        .select('birth_year, death_year, is_approximate_dates, era, occupations, alternative_names, birth_place:places!people_birth_place_id_fkey(name)')
        .eq('knowledge_item_id', recordId).maybeSingle()
      const p = data as unknown as PersonRow | null
      if (!p) break
      const approx = !!p.is_approximate_dates
      add('Lived', span(formatYear(p.birth_year, approx), formatYear(p.death_year, approx)))
      add('Born in', p.birth_place?.name)
      add('Era', p.era)
      add('Known as', list(p.alternative_names))
      add('Roles', list(p.occupations))
      break
    }
    case 'work': {
      const { data } = await supabase.from('works')
        .select('publication_year, venue_name, publisher, doi, is_open_access, open_access_pdf_url, citation_count, work_type')
        .eq('knowledge_item_id', recordId).maybeSingle()
      const w = data as WorkRow | null
      if (!w) break
      add('Published', w.publication_year ? String(w.publication_year) : null)
      add('In', w.venue_name)
      add('Publisher', w.publisher)
      add('Type', w.work_type ? w.work_type.replace(/[-_]/g, ' ') : null)
      add('Cited by', w.citation_count ? `${w.citation_count.toLocaleString()} works` : null)
      if (w.doi) {
        const href = w.doi.startsWith('http') ? w.doi : `https://doi.org/${w.doi}`
        add('DOI', <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline break-all">{href.replace('https://doi.org/', '')}</a>)
      }
      if (w.is_open_access && w.open_access_pdf_url) {
        add('Full text', <a href={w.open_access_pdf_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">Open-access PDF</a>)
      }
      break
    }
    case 'culture': {
      const { data } = await supabase.from('cultures')
        .select('geographic_distribution, linguistic_affiliations, historical_period')
        .eq('knowledge_item_id', recordId).maybeSingle()
      const c = data as CultureRow | null
      if (!c) break
      add('Where', list(c.geographic_distribution))
      add('Languages', list(c.linguistic_affiliations))
      add('Period', c.historical_period)
      break
    }
  }
  return { facts }
}

async function loadRelated(recordId: string): Promise<Related[]> {
  const { data: own } = await supabase.from('knowledge_item_tags').select('tag_id').eq('knowledge_item_id', recordId)
  const tagIds = (own ?? []).map(t => t.tag_id as string)
  if (!tagIds.length) return []
  const { data: links } = await supabase.from('knowledge_item_tags')
    .select('knowledge_item_id').in('tag_id', tagIds).neq('knowledge_item_id', recordId).limit(60)
  const counts = new Map<string, number>()
  for (const l of links ?? []) counts.set(l.knowledge_item_id as string, (counts.get(l.knowledge_item_id as string) ?? 0) + 1)
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id]) => id)
  if (!top.length) return []
  const { data: items } = await supabase.from('knowledge_items')
    .select('id, slug, title, knowledge_type, verification_status').in('id', top)
  return ((items ?? []) as Array<Related & { id: string; verification_status: string | null }>)
    .filter(i => i.verification_status !== 'flagged' && i.slug)
    .sort((a, b) => top.indexOf(a.id) - top.indexOf(b.id))
}

interface Props {
  recordId: string
  recordSlug: string
  knowledgeType: string | null
  /** Facts go above the body; related records below it. */
  part: 'facts' | 'related'
}

export default function RecordFacts({ recordId, recordSlug, knowledgeType, part }: Props) {
  const [facts, setFacts] = useState<Fact[]>([])
  const [onMap, setOnMap] = useState(false)
  const [related, setRelated] = useState<Related[]>([])

  useEffect(() => {
    let cancelled = false
    if (part === 'facts') {
      loadFacts(recordId, knowledgeType).then(r => { if (!cancelled) { setFacts(r.facts); setOnMap(!!r.mapSlug) } }).catch(() => {})
    } else {
      loadRelated(recordId).then(r => { if (!cancelled) setRelated(r) }).catch(() => {})
    }
    return () => { cancelled = true }
  }, [recordId, knowledgeType, part])

  if (!facts.length && !related.length) return null

  return (
    <>
      {facts.length > 0 && (
        <aside className="mb-8 p-5 rounded-2xl bg-white dark:bg-dark-surface border border-sand-200 dark:border-dark-border text-sm" aria-labelledby="facts-heading">
          <h2 id="facts-heading" className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white mb-3">
            <Info className="w-4 h-4 text-primary-500" aria-hidden="true" /> {knowledgeTypeLabel(knowledgeType)} at a glance
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-[9rem_1fr] gap-x-4 gap-y-2 text-gray-600 dark:text-gray-300">
            {facts.map(f => (
              <div key={f.label} className="contents">
                <dt className="text-gray-400">{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
          {onMap && (
            <Link to={`/atlas?focus=${encodeURIComponent(recordSlug)}`} className="mt-3 inline-flex items-center gap-1.5 text-primary-600 dark:text-primary-400 font-medium hover:underline">
              <MapPin className="w-3.5 h-3.5" aria-hidden="true" /> See it on the atlas
            </Link>
          )}
        </aside>
      )}

      {related.length > 0 && (
        <section className="mt-12" aria-labelledby="related-records">
          <h2 id="related-records" className="font-serif font-bold text-lg text-gray-900 dark:text-white mb-3">Related records</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {related.map(r => (
              <li key={r.slug}>
                <Link to={`/article/${r.slug}`} className="block p-3 rounded-xl border border-sand-200 dark:border-dark-border bg-white dark:bg-dark-surface hover:border-primary-400 transition-colors">
                  <span className="block text-sm font-medium text-gray-900 dark:text-white line-clamp-1">{r.title}</span>
                  <span className="text-xs text-gray-400">{knowledgeTypeLabel(r.knowledge_type)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
