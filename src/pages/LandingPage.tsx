import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import {
  ArrowRight, BookOpen, Users, Archive, Library, Brain, Crown, Telescope, Languages, Gem,
  ChevronRight, Landmark, ExternalLink, Scale,
} from 'lucide-react'
import { cn, formatNumber } from '@/lib/utils'
import ArticleCard from '@/components/articles/ArticleCard'
import type { Article } from '@/types'
import { supabase } from '@/lib/supabase'
import { KNOWLEDGE_SELECT, NOT_FLAGGED, knowledgeItemToArticle, licenseLabel, type KnowledgeRecord } from '@/lib/knowledge'
import { FOUNDATIONAL_ARTICLES } from '@/data/articlesData'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const TOPICS = [
  'Ubuntu', 'Mansa Musa', 'Timbuktu', 'Swahili Coast',
  'Benin', 'Great Zimbabwe', 'Nubian pyramids', 'Djenné',
  'Aksum', 'Ifá', 'Meroë', 'Lalibela',
]

const THEMES = [
  { name: 'Philosophy & Thought',    icon: Brain,     to: '/discover?category=philosophy' },
  { name: 'History & Civilizations', icon: Crown,     to: '/discover?category=history' },
  { name: 'Science & Innovation',    icon: Telescope, to: '/discover?category=science' },
  { name: 'Languages & Scripts',     icon: Languages, to: '/discover?category=languages' },
  { name: 'Art & Culture',           icon: Gem,       to: '/discover?category=art-culture' },
  { name: 'Archive records',         icon: Archive,   to: '/discover?type=records' },
]

const PHILOSOPHERS = [
  { name: 'Cheikh Anta Diop', country: 'Senegal', era: '1923–1986', description: 'Historian, anthropologist and physicist whose work placed ancient Egypt within African history and reshaped debates on the continent’s past.', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Cheikh_Anta_Diop_%281%29.jpg/400px-Cheikh_Anta_Diop_%281%29.jpg' },
  { name: 'Frantz Fanon', country: 'Martinique / Algeria', era: '1925–1961', description: 'Psychiatrist and political philosopher whose writing on colonialism and decolonisation shaped liberation movements worldwide.', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Frantz_Fanon.jpg/400px-Frantz_Fanon.jpg' },
  { name: 'Kwame Nkrumah', country: 'Ghana', era: '1909–1972', description: 'Pan-Africanist thinker and statesman who led Ghana to independence and argued for continental unity.', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Kwame_Nkrumah.jpg/400px-Kwame_Nkrumah.jpg' },
  { name: 'Steve Biko', country: 'South Africa', era: '1946–1977', description: 'Founder of the Black Consciousness Movement, which centred psychological liberation in the struggle against apartheid.', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Steve_Biko.jpg/400px-Steve_Biko.jpg' },
]

const CIVILIZATIONS = [
  { name: 'Kush & Nubia', region: 'Northeast Africa', period: 'c. 2500 BCE – 350 CE', img: 'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=400&q=80', q: 'Nubian' },
  { name: 'Mali Empire', region: 'West Africa', period: 'c. 1235 – 1670 CE', img: 'https://images.unsplash.com/photo-1564436872-f6d81182df12?w=400&q=80', q: 'Mali' },
  { name: 'Kingdom of Aksum', region: 'Horn of Africa', period: 'c. 100 – 940 CE', img: 'https://images.unsplash.com/photo-1572550484818-8f5f64e3f5b0?w=400&q=80', q: 'Aksum' },
  { name: 'Great Zimbabwe', region: 'Southern Africa', period: 'c. 1100 – 1450 CE', img: 'https://images.unsplash.com/photo-1469041797191-50ace28483c3?w=400&q=80', q: 'Great Zimbabwe' },
]

const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}
const stagger: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }

export default function LandingPage() {
  useDocumentTitle(null)
  return (
    // Pulled up under the transparent navbar so the hero gradient sits behind it.
    // (Done here, not on the hero, because overflow-x-hidden would clip a negative margin.)
    <div className="overflow-x-hidden -mt-16 md:-mt-18">
      <HeroSection />
      <StatsSection />
      <FeaturedArticlesSection />
      <RecentRecordsSection />
      <TopicsSection />
      <ThemesSection />
      <PhilosophersSection />
      <CivilizationsSection />
      <VirtualMuseumBannerSection />
      <SourcesSection />
      <CTASection />
    </div>
  )
}

// ─── Hero ─────────────────────────────────────────────────────
function HeroSection() {
  const words = ['Knowledge', 'History', 'Philosophy', 'Culture', 'Wisdom']
  const [wordIdx, setWordIdx] = useState(0)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (reduceMotion) return
    const interval = setInterval(() => setWordIdx(i => (i + 1) % words.length), 3000)
    return () => clearInterval(interval)
  }, [reduceMotion, words.length])

  return (
    <section className="relative pt-16 md:pt-18 min-h-[92vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 animated-gradient opacity-90" />
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
        aria-hidden="true"
      />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl animate-pulse-slow" aria-hidden="true" />
      <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-primary-300/20 rounded-full blur-3xl animate-float" aria-hidden="true" />

      <div className="relative z-10 container-app py-24 text-center">
        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-8 text-sm text-white/90 font-medium"
        >
          <Library className="w-4 h-4 text-accent-300" aria-hidden="true" />
          An open archive of African knowledge
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="heading-hero text-white mb-6"
        >
          <span className="sr-only">Preserve African knowledge, history, philosophy, culture and wisdom</span>
          <span aria-hidden="true">
            <span className="block sm:inline">Preserve African </span>
            {/* All words share one grid cell, so the slot is as wide as the longest word and the
                headline never shifts or loses its baseline while the word changes. */}
            <span className="inline-grid text-accent-300 sm:text-left">
              {words.map((word, i) => (
                <span
                  key={word}
                  className={cn(
                    'col-start-1 row-start-1 transition-[opacity,transform] duration-300 ease-out',
                    // The outgoing word fades first; the incoming one waits, so they never overlap.
                    i === wordIdx ? 'opacity-100 translate-y-0 delay-300' : 'opacity-0 translate-y-2 delay-0'
                  )}
                >
                  {word}
                </span>
              ))}
            </span>
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          From the manuscripts of Timbuktu to the bronzes of Benin and the philosophy of Ubuntu. Read essays, explore records from open archives, and write about the knowledge you carry.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 justify-center"
        >
          <Link to="/discover" className="btn btn-lg gap-2 whitespace-nowrap bg-white text-primary-700 hover:bg-sand-100 shadow-lg" id="hero-explore-btn">
            Start exploring <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </Link>
          <Link to="/museum" className="btn btn-lg gap-2 whitespace-nowrap btn-accent" id="hero-museum-btn">
            <Landmark className="w-5 h-5" aria-hidden="true" />
            Visit the virtual museum
          </Link>
          <Link to="/auth/signup" className="btn btn-lg whitespace-nowrap bg-white/10 text-white border border-white/30 hover:bg-white/20" id="hero-signup-btn">
            Become a contributor
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Live counts ──────────────────────────────────────────────
function useArchiveCounts() {
  const [counts, setCounts] = useState<{ records: number; essays: number; sources: number; contributors: number } | null>(null)
  useEffect(() => {
    const head = { count: 'exact' as const, head: true }
    Promise.all([
      supabase.from('knowledge_items').select('id', head),
      supabase.from('articles').select('id', head).eq('status', 'published'),
      supabase.from('sources').select('id', head),
      supabase.from('profiles').select('id', head),
    ]).then(([records, essays, sources, contributors]) => {
      if ([records, essays, sources, contributors].some(r => r.error)) return
      setCounts({
        records: records.count ?? 0,
        essays: (essays.count ?? 0) + FOUNDATIONAL_ARTICLES.length,
        sources: sources.count ?? 0,
        contributors: contributors.count ?? 0,
      })
    })
  }, [])
  return counts
}

function StatsSection() {
  const [ref, inView] = useInView({ threshold: 0.2, triggerOnce: true })
  const counts = useArchiveCounts()
  if (!counts) return null

  const stats = [
    { icon: <Archive className="w-6 h-6" />, value: counts.records, label: 'Archive records' },
    { icon: <BookOpen className="w-6 h-6" />, value: counts.essays, label: 'Essays & articles' },
    { icon: <Library className="w-6 h-6" />, value: counts.sources, label: 'Open-data sources' },
    { icon: <Users className="w-6 h-6" />, value: counts.contributors, label: 'Members' },
  ]

  return (
    <section ref={ref} className="py-12 bg-white dark:bg-dark-surface border-y border-sand-200 dark:border-dark-border" aria-label="Archive at a glance">
      <div className="container-app">
        <motion.dl variants={stagger} initial="hidden" animate={inView ? 'visible' : 'hidden'} className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map(stat => (
            <motion.div key={stat.label} variants={fadeUp} className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center mx-auto mb-3 text-primary-600 dark:text-primary-400" aria-hidden="true">
                {stat.icon}
              </div>
              <dd className="text-3xl font-bold font-serif text-gray-900 dark:text-white">{formatNumber(stat.value)}</dd>
              <dt className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</dt>
            </motion.div>
          ))}
        </motion.dl>
        <p className="text-center text-xs text-gray-400 mt-6">The archive is growing. Counts are live.</p>
      </div>
    </section>
  )
}

// ─── Featured essays ──────────────────────────────────────────
function FeaturedArticlesSection() {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true })
  const [articles, setArticles] = useState<Article[]>(FOUNDATIONAL_ARTICLES.slice(0, 4))

  useEffect(() => {
    supabase
      .from('articles')
      .select('*, author:profiles!articles_author_id_fkey(*), category:categories(*)')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(4)
      .then(({ data }) => {
        // Only feature community work that has a proper excerpt; fill the rest with editorial essays.
        const community = ((data as Article[]) ?? []).filter(a => a.excerpt && a.title.trim().length >= 5)
        setArticles([...community, ...FOUNDATIONAL_ARTICLES].slice(0, 4))
      })
  }, [])

  return (
    <section ref={ref} className="section">
      <div className="container-app">
        <SectionHeader
          badge="Read"
          title="Featured essays"
          subtitle="Introductions to African history and thought, each with references for further reading"
          inView={inView}
          cta={{ label: 'All essays', to: '/discover?type=articles' }}
        />
        <motion.div variants={stagger} initial="hidden" animate={inView ? 'visible' : 'hidden'} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
          <motion.div variants={fadeUp} className="md:col-span-2 lg:col-span-2">
            <ArticleCard article={articles[0]} variant="featured" className="h-full min-h-[380px]" />
          </motion.div>
          {articles.slice(1, 4).map(a => (
            <motion.div key={a.id} variants={fadeUp}>
              <ArticleCard article={a} variant="default" className="h-full" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ─── Recently added records ───────────────────────────────────
function RecentRecordsSection() {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true })
  const [records, setRecords] = useState<Article[]>([])

  useEffect(() => {
    supabase
      .from('knowledge_items')
      .select(KNOWLEDGE_SELECT)
      .or(NOT_FLAGGED)
      .order('created_at', { ascending: false })
      .limit(12)
      .then(({ data }) => {
        const mapped = ((data ?? []) as unknown as KnowledgeRecord[]).map(knowledgeItemToArticle).filter(r => r.cover_image)
        setRecords(mapped.slice(0, 4))
      })
  }, [])

  if (records.length === 0) return null

  return (
    <section ref={ref} className="section bg-gray-50 dark:bg-dark-surface">
      <div className="container-app">
        <SectionHeader
          badge="New in the archive"
          title="Recently added records"
          subtitle="Objects, places and documents gathered from open collections, with their source and licence"
          inView={inView}
          cta={{ label: 'Browse records', to: '/discover?type=records' }}
        />
        <motion.div variants={stagger} initial="hidden" animate={inView ? 'visible' : 'hidden'} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
          {records.map(r => (
            <motion.div key={r.id} variants={fadeUp}>
              <ArticleCard article={r} variant="default" className="h-full" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ─── Topics ───────────────────────────────────────────────────
function TopicsSection() {
  const [ref, inView] = useInView({ threshold: 0.2, triggerOnce: true })
  return (
    <section ref={ref} className="section bg-primary-500 dark:bg-primary-700 overflow-hidden">
      <div className="container-app">
        <motion.div variants={stagger} initial="hidden" animate={inView ? 'visible' : 'hidden'} className="text-center mb-10">
          <motion.h2 variants={fadeUp} className="heading-xl text-white mb-4">Where to begin</motion.h2>
          <motion.p variants={fadeUp} className="text-white/70 max-w-xl mx-auto">
            A few starting points across people, places and ideas
          </motion.p>
        </motion.div>
        <motion.ul variants={stagger} initial="hidden" animate={inView ? 'visible' : 'hidden'} className="flex flex-wrap justify-center gap-3">
          {TOPICS.map(topic => (
            <motion.li key={topic} variants={fadeUp}>
              <Link
                to={`/discover?q=${encodeURIComponent(topic)}`}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5"
              >
                {topic}
                <ChevronRight className="w-3.5 h-3.5 opacity-60" aria-hidden="true" />
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}

// ─── Themes ───────────────────────────────────────────────────
function ThemesSection() {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true })
  return (
    <section ref={ref} className="section">
      <div className="container-app">
        <SectionHeader
          badge="Browse"
          title="Browse by theme"
          subtitle="The archive is organised into broad subject areas"
          inView={inView}
          cta={{ label: 'All collections', to: '/collections' }}
        />
        <motion.div variants={stagger} initial="hidden" animate={inView ? 'visible' : 'hidden'} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-10">
          {THEMES.map(theme => (
            <motion.div key={theme.name} variants={fadeUp}>
              <Link
                to={theme.to}
                className="group flex flex-col items-center text-center p-5 h-full rounded-2xl border border-sand-200 dark:border-dark-border hover:border-primary-300 dark:hover:border-primary-600 bg-white dark:bg-dark-card hover:shadow-glow transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-accent-300 flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-105" aria-hidden="true">
                  <theme.icon className="w-6 h-6" strokeWidth={1.75} />
                </div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {theme.name}
                </h3>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ─── Thinkers ─────────────────────────────────────────────────
function PhilosophersSection() {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true })
  return (
    <section ref={ref} className="section bg-gray-50 dark:bg-dark-surface">
      <div className="container-app">
        <SectionHeader
          badge="Thinkers"
          title="African philosophers & scholars"
          subtitle="Thinkers whose ideas shaped the twentieth century and continue to be read today"
          inView={inView}
          cta={{ label: 'Philosophy & thought', to: '/discover?category=philosophy' }}
        />
        <motion.div variants={stagger} initial="hidden" animate={inView ? 'visible' : 'hidden'} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
          {PHILOSOPHERS.map(p => (
            <motion.div key={p.name} variants={fadeUp}>
              <div className="card-hover p-6 h-full flex flex-col items-center text-center group">
                <img
                  src={p.img}
                  alt={p.name}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-24 h-24 rounded-2xl object-cover shadow-md mb-4 bg-sand-200 dark:bg-dark-card"
                  onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=0F5132&color=fff&size=96` }}
                />
                <h3 className="font-serif font-bold text-gray-900 dark:text-white">{p.name}</h3>
                <p className="text-xs text-primary-600 dark:text-primary-400 font-medium mt-1">{p.country} · {p.era}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 leading-relaxed line-clamp-4">{p.description}</p>
                <Link to={`/discover?q=${encodeURIComponent(p.name)}`} className="mt-auto pt-4 text-xs text-primary-600 dark:text-primary-400 font-medium hover:underline flex items-center gap-1">
                  Search the archive <ChevronRight className="w-3 h-3" aria-hidden="true" />
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ─── Civilizations ────────────────────────────────────────────
function CivilizationsSection() {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true })
  return (
    <section ref={ref} className="section">
      <div className="container-app">
        <SectionHeader
          badge="Civilizations"
          title="African states and kingdoms"
          subtitle="A few of the societies explored in essays and records across the archive"
          inView={inView}
          cta={{ label: 'History & civilizations', to: '/discover?category=history' }}
        />
        <motion.div variants={stagger} initial="hidden" animate={inView ? 'visible' : 'hidden'} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
          {CIVILIZATIONS.map(civ => (
            <motion.div key={civ.name} variants={fadeUp}>
              <Link to={`/discover?q=${encodeURIComponent(civ.q)}`} className="group block card-hover overflow-hidden">
                <div className="relative h-48 overflow-hidden bg-sand-200 dark:bg-dark-card">
                  <img
                    src={civ.img}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={e => { (e.target as HTMLImageElement).style.visibility = 'hidden' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute bottom-3 left-3 badge bg-white/20 text-white text-xs">{civ.period}</span>
                </div>
                <div className="p-4">
                  <h3 className="font-serif font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{civ.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{civ.region}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ─── Museum banner ────────────────────────────────────────────
function VirtualMuseumBannerSection() {
  const [ref, inView] = useInView({ threshold: 0.15, triggerOnce: true })
  const stages: Array<[string, string, string]> = [
    ['Collections', 'Objects & manuscripts', 'collections'],
    ['Timeline', 'Civilizations through time', 'timeline'],
    ['Regions', 'Heritage by region', 'map'],
    ['Stories', 'Proverbs & oral traditions', 'stories'],
  ]

  // A preview of the museum's dark "gallery wing", using the same palette the museum uses.
  return (
    <section ref={ref} className="dark section bg-dark-bg text-ivory-100 border-y border-white/10">
      <div className="container-app">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.7 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center"
        >
          <div className="lg:col-span-6 space-y-6">
            <p className="eyebrow"><Landmark className="w-4 h-4" aria-hidden="true" /> Virtual museum</p>
            <h2 className="heading-xl text-white">Walk through the galleries</h2>
            <p className="text-base sm:text-lg text-ivory-300 leading-relaxed">
              A guided exhibition of manuscripts, sculpture and monuments, arranged by theme, era and region, with stories and proverbs alongside the objects.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center pt-2">
              <Link to="/museum" className="btn btn-accent btn-lg gap-2 group">
                Enter the museum
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <span className="text-sm text-ivory-400">Free, no account needed</span>
            </div>
          </div>
          <ul className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stages.map(([title, desc, tab]) => (
              <li key={title}>
                <Link to={`/museum?tab=${tab}`} className="card-hover block h-full p-5 rounded-2xl">
                  <span className="block font-serif font-bold text-xl text-white">{title}</span>
                  <span className="text-sm text-ivory-400">{desc}</span>
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Sources & provenance ─────────────────────────────────────
interface SourceRow { name: string; slug: string; base_url: string | null; default_license: string | null }

function SourcesSection() {
  const [ref, inView] = useInView({ threshold: 0.15, triggerOnce: true })
  const [sources, setSources] = useState<SourceRow[]>([])

  useEffect(() => {
    supabase.from('sources').select('name, slug, base_url, default_license').order('name')
      .then(({ data }) => setSources(((data ?? []) as SourceRow[]).filter(s => s.slug !== 'afroarchive-seed')))
  }, [])

  return (
    <section ref={ref} className="section bg-primary-500 dark:bg-primary-800">
      <div className="container-app">
        <motion.div variants={stagger} initial="hidden" animate={inView ? 'visible' : 'hidden'} className="max-w-3xl mx-auto text-center mb-10">
          <motion.h2 variants={fadeUp} className="heading-xl text-white mb-4">Where our records come from</motion.h2>
          <motion.p variants={fadeUp} className="text-white/80 leading-relaxed">
            Every archive record links back to the open collection it came from and keeps its original licence and attribution. Essays list the scholarship they draw on.
          </motion.p>
        </motion.div>
        {sources.length > 0 && (
          <motion.ul variants={stagger} initial="hidden" animate={inView ? 'visible' : 'hidden'} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {sources.map(s => (
              <motion.li key={s.slug} variants={fadeUp}>
                <a
                  href={s.base_url ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start justify-between gap-3 h-full rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 p-5 text-white transition-colors"
                >
                  <span>
                    <span className="block font-semibold">{s.name}</span>
                    <span className="mt-1 inline-flex items-center gap-1 text-xs text-white/70">
                      <Scale className="w-3 h-3" aria-hidden="true" /> {licenseLabel(s.default_license)}
                    </span>
                  </span>
                  <ExternalLink className="w-4 h-4 text-white/60 flex-shrink-0 mt-1" aria-hidden="true" />
                </a>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>
    </section>
  )
}

// ─── CTA ──────────────────────────────────────────────────────
function CTASection() {
  const [ref, inView] = useInView({ threshold: 0.3, triggerOnce: true })
  return (
    <section ref={ref} className="section">
      <div className="container-app">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-4xl animated-gradient p-12 md:p-20 text-center"
        >
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full" aria-hidden="true" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-accent-500/20 rounded-full" aria-hidden="true" />
          <div className="relative z-10">
            <h2 className="heading-xl text-white mb-4">Know something worth preserving?</h2>
            <p className="text-white/80 text-lg max-w-2xl mx-auto mb-10">
              Write about the history, language, art or ideas you know, with sources, so others can learn from it. Reading is always free.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth/signup" className="btn btn-xl bg-white text-primary-700 hover:bg-sand-100 shadow-lg" id="cta-signup-btn">
                Start writing <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </Link>
              <Link to="/discover" className="btn btn-xl border-2 border-white/40 text-white hover:bg-white/10">
                Explore first
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Section header ───────────────────────────────────────────
function SectionHeader({
  badge, title, subtitle, inView, cta,
}: {
  badge: string
  title: string
  subtitle: string
  inView: boolean
  cta?: { label: string; to: string }
}) {
  return (
    <motion.div variants={stagger} initial="hidden" animate={inView ? 'visible' : 'hidden'} className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <motion.p variants={fadeUp} className="flex items-center gap-2 mb-3">
          <span className="w-8 h-1 bg-primary-500 rounded-full" aria-hidden="true" />
          <span className="text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">{badge}</span>
        </motion.p>
        <motion.h2 variants={fadeUp} className="heading-lg text-gray-900 dark:text-white">{title}</motion.h2>
        <motion.p variants={fadeUp} className="text-gray-500 dark:text-gray-400 mt-2 max-w-xl">{subtitle}</motion.p>
      </div>
      {cta && (
        <motion.div variants={fadeUp} className="flex-shrink-0">
          <Link to={cta.to} className="btn btn-outline btn-md gap-1.5">
            {cta.label} <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </motion.div>
      )}
    </motion.div>
  )
}
