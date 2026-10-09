import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Search } from 'lucide-react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/utils'
import { GLOSSARY, type GlossaryTerm } from '@/data/glossary'

const fold = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’'ʼ]/g, '').toLowerCase()

const LANGUAGE_GROUPS: Record<string, string> = {
  Zulu: 'Zulu / Xhosa',
  Xhosa: 'Zulu / Xhosa',
  Amharic: 'Ge’ez / Amharic',
  'Ge’ez': 'Ge’ez / Amharic',
}

/** Language used for the filter pills: the first language named, grouped where closely related. */
const languageKey = (t: GlossaryTerm) => {
  const first = t.language.split(/[/(,;]| and /)[0].trim()
  return LANGUAGE_GROUPS[first] ?? first
}

const letterOf = (t: GlossaryTerm) => {
  const first = fold(t.term).charAt(0).toUpperCase()
  return /[A-Z]/.test(first) ? first : '#'
}

export default function GlossaryPage() {
  useDocumentTitle('Glossary')
  const [search, setSearch] = useState('')
  const [language, setLanguage] = useState<string>('all')

  const languages = useMemo(
    () => Array.from(new Set(GLOSSARY.map(languageKey))).sort((a, b) => a.localeCompare(b)),
    []
  )

  const groups = useMemo(() => {
    const needle = fold(search.trim())
    const matches = GLOSSARY.filter(t =>
      (language === 'all' || languageKey(t) === language) &&
      (!needle || [t.term, t.meaning, t.language].some(f => fold(f).includes(needle)))
    ).sort((a, b) => fold(a.term).localeCompare(fold(b.term)))

    const byLetter = new Map<string, GlossaryTerm[]>()
    for (const t of matches) {
      const letter = letterOf(t)
      byLetter.set(letter, [...(byLetter.get(letter) ?? []), t])
    }
    return Array.from(byLetter.entries())
  }, [search, language])

  const resultCount = groups.reduce((n, [, terms]) => n + terms.length, 0)

  return (
    <div className="min-h-screen bg-sand-50 dark:bg-dark-bg text-gray-900 dark:text-white transition-colors py-10">
      <div className="container-app max-w-4xl">
        <header className="mb-8">
          <h1 className="heading-xl text-3xl sm:text-4xl lg:text-5xl text-gray-900 dark:text-white mb-2">Glossary</h1>
          <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
            Words from African languages that appear across the archive, with their meanings and context.
          </p>
        </header>

        <div className="flex flex-col gap-4 mb-8">
          <div className="relative max-w-md w-full">
            <label htmlFor="glossary-search" className="sr-only">Search the glossary</label>
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" aria-hidden="true" />
            <input
              id="glossary-search"
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search terms, meanings or languages…"
              className="input pl-10 bg-white dark:bg-dark-surface shadow-xs"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by language">
            {['all', ...languages].map(lang => (
              <button
                key={lang}
                type="button"
                aria-pressed={language === lang}
                onClick={() => setLanguage(lang)}
                className={cn(
                  'whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-colors border',
                  language === lang
                    ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                    : 'bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-300 border-sand-200 dark:border-dark-border hover:border-primary-400'
                )}
              >
                {lang === 'all' ? 'All languages' : lang}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500" aria-live="polite">
            {resultCount} {resultCount === 1 ? 'term' : 'terms'}
          </p>
        </div>

        {groups.length > 0 && (
          <nav aria-label="Jump to letter" className="flex flex-wrap gap-1 mb-8">
            {groups.map(([letter]) => (
              <a
                key={letter}
                href={`#glossary-${letter}`}
                className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-sm font-semibold text-primary-600 dark:text-primary-400 bg-white dark:bg-dark-surface border border-sand-200 dark:border-dark-border hover:border-primary-400"
              >
                {letter}
              </a>
            ))}
          </nav>
        )}

        {groups.length === 0 ? (
          <div className="card p-8 text-center bg-white dark:bg-dark-surface">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No terms match{search.trim() ? ` “${search.trim()}”` : ''}.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {groups.map(([letter, terms]) => (
              <section key={letter} id={`glossary-${letter}`} aria-labelledby={`glossary-heading-${letter}`} className="scroll-mt-24">
                <h2 id={`glossary-heading-${letter}`} className="heading-md text-2xl text-gray-900 dark:text-white mb-4 pb-2 border-b border-sand-200 dark:border-dark-border">
                  {letter}
                </h2>
                <dl className="space-y-4">
                  {terms.map(t => (
                    <div key={`${t.term}-${t.language}`} className="card p-5 sm:p-6 bg-white dark:bg-dark-surface border border-sand-200 dark:border-dark-border rounded-2xl">
                      <dt className="flex flex-wrap items-baseline gap-x-3 gap-y-2 mb-2">
                        <span className="font-serif font-bold text-xl text-gray-900 dark:text-white">{t.term}</span>
                        {t.script && <span className="text-lg text-gray-700 dark:text-gray-300" lang={scriptLang(t)}>{t.script}</span>}
                        {t.pronunciation && <span className="text-sm text-gray-500 dark:text-gray-400 italic">{t.pronunciation}</span>}
                        <span className="badge badge-primary">{t.language}</span>
                      </dt>
                      <dd>
                        <p className="text-gray-800 dark:text-gray-200 leading-relaxed">{t.meaning}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mt-2">{t.context}</p>
                        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-sand-200 dark:border-dark-border">
                          <span className="text-xs text-gray-500">{t.region}</span>
                          <Link
                            to={`/discover?q=${encodeURIComponent(t.related || t.term)}`}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                          >
                            Find in the archive
                            <span className="sr-only">: {t.term}</span>
                            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                          </Link>
                        </div>
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function scriptLang(t: GlossaryTerm): string | undefined {
  if (/[\u0600-\u06ff]/.test(t.script ?? '')) return 'ar'
  if (/[\u1200-\u137f]/.test(t.script ?? '')) return t.language.startsWith('Amharic') ? 'am' : 'gez'
  return undefined
}
