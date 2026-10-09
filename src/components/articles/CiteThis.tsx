import { useState } from 'react'
import { Check, Copy, Quote, Scale } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { licenseLabel } from '@/lib/knowledge'

export interface CitationSource {
  title: string
  /** Person or organisation responsible for the text. */
  author: string
  /** ISO date the item was published or added. */
  date?: string | null
  url: string
  /** "AfroArchive" for essays; the original repository for records. */
  publisher: string
  kind: 'article' | 'record'
  license?: string | null
  licenseUrl?: string | null
  attribution?: string | null
  originalUrl?: string | null
}

type Style = 'apa' | 'chicago' | 'mla' | 'bibtex'
const STYLES: Array<{ key: Style; label: string }> = [
  { key: 'apa', label: 'APA' },
  { key: 'chicago', label: 'Chicago' },
  { key: 'mla', label: 'MLA' },
  { key: 'bibtex', label: 'BibTeX' },
]

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function parts(iso?: string | null) {
  const d = iso ? new Date(iso) : null
  if (!d || Number.isNaN(d.getTime())) return null
  return { y: d.getFullYear(), m: d.getMonth(), d: d.getDate() }
}

/** "Ada Obi" → "Obi, A."; organisations are left as written. */
function apaName(name: string) {
  const words = name.trim().split(/\s+/)
  if (words.length < 2 || /editorial|archive|commons|wikidata|openalex|zenodo|institute|museum/i.test(name)) return name
  const last = words.pop()!
  return `${last}, ${words.map(w => `${w[0]}.`).join(' ')}`
}
function invertedName(name: string) {
  const words = name.trim().split(/\s+/)
  if (words.length < 2 || /editorial|archive|commons|wikidata|openalex|zenodo|institute|museum/i.test(name)) return name
  const last = words.pop()!
  return `${last}, ${words.join(' ')}`
}

function formatCitation(src: CitationSource, style: Style, accessed = new Date()): string {
  const p = parts(src.date)
  const acc = `${accessed.getDate()} ${MONTHS[accessed.getMonth()]} ${accessed.getFullYear()}`
  const accUS = `${MONTHS[accessed.getMonth()]} ${accessed.getDate()}, ${accessed.getFullYear()}`
  switch (style) {
    case 'apa':
      return `${apaName(src.author)} (${p ? `${p.y}, ${MONTHS[p.m]} ${p.d}` : 'n.d.'}). ${src.title}. ${src.publisher}. ${src.url}`
    case 'chicago':
      return `${invertedName(src.author)}. “${src.title}.” ${src.publisher}${p ? `, ${MONTHS[p.m]} ${p.d}, ${p.y}` : ''}. Accessed ${accUS}. ${src.url}.`
    case 'mla':
      return `${invertedName(src.author)}. “${src.title}.” ${src.publisher}${p ? `, ${p.d} ${MONTHS[p.m].slice(0, 3)}. ${p.y}` : ''}, ${src.url.replace(/^https?:\/\//, '')}. Accessed ${acc}.`
    case 'bibtex': {
      const key = `${src.author.split(/\s+/).pop()?.toLowerCase().replace(/[^a-z]/g, '') || 'afroarchive'}${p?.y ?? ''}${src.title.split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, '')}`
      return [
        `@misc{${key},`,
        `  author = {${src.author}},`,
        `  title = {${src.title}},`,
        `  howpublished = {${src.publisher}},`,
        p ? `  year = {${p.y}},` : null,
        `  url = {${src.url}},`,
        `  note = {Accessed ${accessed.toISOString().slice(0, 10)}}`,
        `}`,
      ].filter(Boolean).join('\n')
    }
  }
}

function reuseGuidance(license?: string | null): string {
  switch (license) {
    case 'public_domain':
    case 'cc0':
      return 'Free to reuse for any purpose. Credit is appreciated but not required.'
    case 'cc_by':
      return 'You may reuse and adapt this, including commercially, as long as you credit the creator and link to the licence.'
    case 'cc_by_sa':
      return 'You may reuse and adapt this with credit, and anything you make from it must be shared under the same licence.'
    case 'cc_by_nc':
    case 'cc_by_nc_sa':
      return 'You may reuse this with credit for non-commercial purposes only.'
    case 'copyrighted_metadata_only':
      return 'Only the description is shown here. The original work is under copyright; follow the link to read it at its source.'
    default:
      return 'The licence for this item is not recorded. Check the original source before reusing it.'
  }
}

export default function CiteThis({ source }: { source: CitationSource }) {
  const [style, setStyle] = useState<Style>('apa')
  const [copied, setCopied] = useState(false)
  const text = formatCitation(source, style)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error('Could not copy. Select the text and copy it manually.')
    }
  }

  return (
    <section className="mt-10 p-6 sm:p-8 rounded-3xl bg-white dark:bg-dark-surface border border-sand-200 dark:border-dark-border" aria-labelledby="cite-heading">
      <h2 id="cite-heading" className="flex items-center gap-2 font-serif font-bold text-lg text-gray-900 dark:text-white mb-4">
        <Quote className="w-5 h-5 text-primary-500" aria-hidden="true" /> Cite this {source.kind === 'record' ? 'record' : 'article'}
      </h2>

      <div className="flex flex-wrap gap-1.5 mb-3" role="tablist" aria-label="Citation style">
        {STYLES.map(s => (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={style === s.key}
            onClick={() => setStyle(s.key)}
            className={cn('px-3 py-1 rounded-lg text-xs font-semibold border transition-colors',
              style === s.key ? 'bg-primary-600 text-white border-primary-600' : 'border-sand-200 dark:border-dark-border text-gray-600 dark:text-gray-300 hover:border-primary-400')}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <pre className="whitespace-pre-wrap break-words text-xs sm:text-sm font-mono bg-sand-50 dark:bg-dark-card border border-sand-200 dark:border-dark-border rounded-xl p-4 pr-12 text-gray-700 dark:text-gray-300">{text}</pre>
        <button type="button" onClick={copy} aria-label="Copy citation"
          className="absolute top-2.5 right-2.5 p-2 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-white dark:hover:bg-dark-surface">
          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      {source.kind === 'record' && (
        <div className="mt-5 pt-5 border-t border-sand-200 dark:border-dark-border text-sm">
          <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white mb-1.5">
            <Scale className="w-4 h-4 text-primary-500" aria-hidden="true" /> How to reuse this
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            <strong>{licenseLabel(source.license)}.</strong> {reuseGuidance(source.license)}
          </p>
          {source.attribution && (
            <p className="mt-2 text-gray-500 dark:text-gray-400">Suggested credit: <span className="text-gray-700 dark:text-gray-200">{source.attribution}</span></p>
          )}
          {source.licenseUrl && (
            <a href={source.licenseUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-primary-600 dark:text-primary-400 hover:underline">Read the licence</a>
          )}
        </div>
      )}
    </section>
  )
}
