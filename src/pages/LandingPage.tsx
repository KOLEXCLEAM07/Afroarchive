import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import {
  ArrowRight, BookOpen, Users, Globe2, Languages,
  Layers, Star, TrendingUp, ChevronRight, Sparkles,
  Quote, Award, ChevronLeft, Database,
} from 'lucide-react'
import { cn, formatNumber } from '@/lib/utils'
import ArticleCard from '@/components/articles/ArticleCard'
import type { Article, Category } from '@/types'
import { supabase } from '@/lib/supabase'

function mapKnowledgeItemToArticle(item: any): Article {
  let cover = 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&q=80'
  if (item.original_url && (item.original_url.endsWith('.jpg') || item.original_url.endsWith('.png') || item.original_url.includes('upload.wikimedia.org'))) {
    cover = item.original_url
  } else if (item.title?.toLowerCase().includes('timbuktu') || item.title?.toLowerCase().includes('sankor')) {
    cover = 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80'
  } else if (item.title?.toLowerCase().includes('zimbabwe')) {
    cover = 'https://images.unsplash.com/photo-1504185073616-d9b5bef4e4e8?w=800&q=80'
  } else if (item.title?.toLowerCase().includes('benin')) {
    cover = 'https://upload.wikimedia.org/wikipedia/commons/e/e9/Benin_bronze_Louvre_A97-14-1.jpg'
  }

  const categoryName = item.knowledge_type ? item.knowledge_type.replace(/_/g, ' ').toUpperCase() : 'HERITAGE'
  const authorName = item.attribution ? item.attribution.replace(/^Licensed under [^ ]+ by /i, '').replace(/^© /i, '') : 'AfroArchive Contributor'
  const sourceName = item.sources?.name || 'AfroArchive'

  return {
    id: item.id,
    author_id: item.source_id || 'system',
    title: item.title,
    slug: item.slug || item.id,
    excerpt: item.summary || (item.content ? item.content.slice(0, 160) + '...' : item.title),
    content: item.content || '',
    cover_image: cover,
    status: 'published',
    category_id: item.knowledge_type || 'heritage',
    reading_time: Math.max(3, Math.ceil((item.summary?.length || 200) / 100)),
    views_count: 1420 + Math.floor(Math.random() * 500),
    likes_count: 120 + Math.floor(Math.random() * 50),
    comments_count: 12,
    bookmarks_count: 45,
    is_featured: true,
    references: [],
    language: 'en',
    published_at: item.created_at || new Date().toISOString(),
    created_at: item.created_at || new Date().toISOString(),
    updated_at: item.created_at || new Date().toISOString(),
    youtube_embed: null,
    country: item.country_codes?.[0] || 'Africa',
    time_period: 'Historical Archive',
    author: {
      id: 'author-' + item.id,
      username: sourceName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      full_name: authorName,
      bio: `Provenance: ${sourceName}`,
      avatar_url: 'https://i.pravatar.cc/150?img=12',
      cover_url: null,
      country: item.country_codes?.[0] || null,
      website: item.source_url || null,
      languages: ['en'],
      role: 'contributor',
      is_verified: true,
      followers_count: 1200,
      following_count: 50,
      articles_count: 14,
      total_views: 45000,
      created_at: '',
      updated_at: '',
    },
    category: {
      id: item.knowledge_type,
      name: categoryName,
      slug: item.knowledge_type,
      description: null,
      icon: '🏛️',
      color: '#B08A44',
      parent_id: null,
      articles_count: 14,
      created_at: '',
    },
  }
}

// ─── Static data for landing page (will be replaced by real data when Supabase is configured) ──────
const MOCK_ARTICLES: Article[] = [
  {
    id: '1', author_id: 'a1', title: 'The Philosophy of Ubuntu: I Am Because We Are',
    slug: 'philosophy-of-ubuntu', excerpt: 'Explore the profound African philosophical concept of Ubuntu and its implications for modern society, governance, and human dignity.',
    content: '', cover_image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&q=80',
    status: 'published', category_id: '1', reading_time: 8, views_count: 15420, likes_count: 892,
    comments_count: 67, bookmarks_count: 234, is_featured: true, references: [], language: 'en',
    published_at: '2026-07-15T10:00:00Z', created_at: '2026-07-15T10:00:00Z', updated_at: '2026-07-15T10:00:00Z',
    youtube_embed: null, country: 'South Africa', time_period: 'Contemporary',
    author: { id: 'a1', username: 'dr_nkosi', full_name: 'Dr. Amara Nkosi', bio: null, avatar_url: 'https://i.pravatar.cc/150?img=3', cover_url: null, country: 'ZA', website: null, languages: ['en'], role: 'contributor', is_verified: true, followers_count: 4200, following_count: 120, articles_count: 45, total_views: 89000, created_at: '', updated_at: '' },
    category: { id: '1', name: 'Philosophy', slug: 'philosophy', description: null, icon: '🧠', color: '#0F5132', parent_id: null, articles_count: 234, created_at: '' },
  },
  {
    id: '2', author_id: 'a2', title: 'Great Zimbabwe: Engineering Marvel of Medieval Africa',
    slug: 'great-zimbabwe-engineering', excerpt: 'How did ancient Africans construct one of the world\'s most impressive stone structures without mortar — and what does it tell us about medieval African civilization?',
    content: '', cover_image: 'https://images.unsplash.com/photo-1504185073616-d9b5bef4e4e8?w=800&q=80',
    status: 'published', category_id: '2', reading_time: 12, views_count: 23100, likes_count: 1340,
    comments_count: 89, bookmarks_count: 456, is_featured: true, references: [], language: 'en',
    published_at: '2026-07-20T10:00:00Z', created_at: '2026-07-20T10:00:00Z', updated_at: '2026-07-20T10:00:00Z',
    youtube_embed: null, country: 'Zimbabwe', time_period: '1100-1450 CE',
    author: { id: 'a2', username: 'prof_chikwanda', full_name: 'Prof. Tendai Chikwanda', bio: null, avatar_url: 'https://i.pravatar.cc/150?img=8', cover_url: null, country: 'ZW', website: null, languages: ['en', 'sn'], role: 'contributor', is_verified: true, followers_count: 7800, following_count: 230, articles_count: 78, total_views: 234000, created_at: '', updated_at: '' },
    category: { id: '2', name: 'History', slug: 'history', description: null, icon: '🏛️', color: '#B08A44', parent_id: null, articles_count: 512, created_at: '' },
  },
  {
    id: '3', author_id: 'a3', title: 'Timbuktu: The Harvard of the Medieval World',
    slug: 'timbuktu-medieval-university', excerpt: 'Long before European universities rose to prominence, Timbuktu hosted over 25,000 scholars and housed hundreds of thousands of manuscripts.',
    content: '', cover_image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80',
    status: 'published', category_id: '3', reading_time: 10, views_count: 18700, likes_count: 987,
    comments_count: 54, bookmarks_count: 312, is_featured: false, references: [], language: 'en',
    published_at: '2026-07-25T10:00:00Z', created_at: '2026-07-25T10:00:00Z', updated_at: '2026-07-25T10:00:00Z',
    youtube_embed: null, country: 'Mali', time_period: '1300-1600 CE',
    author: { id: 'a3', username: 'fatima_diallo', full_name: 'Fatima Diallo', bio: null, avatar_url: 'https://i.pravatar.cc/150?img=47', cover_url: null, country: 'ML', website: null, languages: ['en', 'fr'], role: 'contributor', is_verified: false, followers_count: 2100, following_count: 180, articles_count: 23, total_views: 45000, created_at: '', updated_at: '' },
    category: { id: '3', name: 'Education', slug: 'education', description: null, icon: '📚', color: '#B08A44', parent_id: null, articles_count: 189, created_at: '' },
  },
  {
    id: '4', author_id: 'a4', title: 'The Dogon Astronomical Knowledge: Stars Before Telescopes',
    slug: 'dogon-astronomical-knowledge', excerpt: 'The Dogon people of Mali possessed detailed knowledge of Sirius B — an invisible star — centuries before modern astronomy could confirm its existence.',
    content: '', cover_image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&q=80',
    status: 'published', category_id: '4', reading_time: 9, views_count: 31200, likes_count: 2100,
    comments_count: 134, bookmarks_count: 567, is_featured: false, references: [], language: 'en',
    published_at: '2026-07-28T10:00:00Z', created_at: '2026-07-28T10:00:00Z', updated_at: '2026-07-28T10:00:00Z',
    youtube_embed: null, country: 'Mali', time_period: 'Pre-1930',
    author: { id: 'a4', username: 'cosmos_nwosu', full_name: 'Dr. Cosmos Nwosu', bio: null, avatar_url: 'https://i.pravatar.cc/150?img=12', cover_url: null, country: 'NG', website: null, languages: ['en', 'ig'], role: 'contributor', is_verified: true, followers_count: 5600, following_count: 290, articles_count: 56, total_views: 178000, created_at: '', updated_at: '' },
    category: { id: '4', name: 'Science', slug: 'science', description: null, icon: '🔭', color: '#0F5132', parent_id: null, articles_count: 145, created_at: '' },
  },
]

const TRENDING_TOPICS = [
  'Ubuntu Philosophy', 'Mansa Musa', 'Egyptian Mathematics', 'Swahili Coast',
  'Yoruba Cosmology', 'Great Zimbabwe', 'African Medicine', 'Timbuktu',
  'Nubian Kingdoms', 'African Feminism', 'Pan-Africanism', 'Bantu Languages',
]

const COLLECTIONS = [
  { name: 'African Philosophy', icon: '🧠', count: 234, color: 'from-emerald-600 to-emerald-800', slug: 'philosophy' },
  { name: 'Great Empires',      icon: '👑', count: 189, color: 'from-amber-600 to-amber-800',   slug: 'history' },
  { name: 'Ancient Science',    icon: '🔭', count: 145, color: 'from-blue-600 to-blue-800',     slug: 'science' },
  { name: 'Languages & Oral Traditions', icon: '🗣️', count: 312, color: 'from-purple-600 to-purple-800', slug: 'languages' },
  { name: 'Sacred Architecture',icon: '🏛️', count: 98,  color: 'from-rose-600 to-rose-800',    slug: 'architecture' },
  { name: 'Music & Arts',       icon: '🎵', count: 267, color: 'from-orange-600 to-orange-800', slug: 'arts' },
]

const PHILOSOPHERS = [
  { name: 'Cheikh Anta Diop',    country: 'Senegal', era: '1923–1986', description: 'Historian, anthropologist, and physicist who argued that ancient Egypt was a Black civilization and the font of Western culture.', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Cheikh_Anta_Diop_%281%29.jpg/400px-Cheikh_Anta_Diop_%281%29.jpg' },
  { name: 'Frantz Fanon',        country: 'Martinique / Algeria', era: '1925–1961', description: 'Psychiatrist and political philosopher whose work on decolonization and psychopathology of colonialism shaped revolutionary thought.', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Frantz_Fanon.jpg/400px-Frantz_Fanon.jpg' },
  { name: 'Kwame Nkrumah',       country: 'Ghana', era: '1909–1972', description: 'Pan-Africanist philosopher and statesman who led Ghana to independence and championed African continental unity.', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Kwame_Nkrumah.jpg/400px-Kwame_Nkrumah.jpg' },
  { name: 'Steve Biko',          country: 'South Africa', era: '1946–1977', description: 'Black Consciousness philosopher who articulated the psychological liberation of Black South Africans from apartheid.', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Steve_Biko.jpg/400px-Steve_Biko.jpg' },
]

const TESTIMONIALS = [
  { text: "AfroArchive changed how I understand my own heritage. For the first time, I can access rich, documented knowledge about my ancestors' contributions to civilization.", name: 'Adaeze Okafor', role: 'Student, University of Lagos', country: '🇳🇬' },
  { text: "As a researcher, finding well-sourced content on African history was always a struggle. AfroArchive is the scholarly resource we've been waiting for.", name: 'Dr. Marcus Thompson', role: 'African Studies, Howard University', country: '🇺🇸' },
  { text: "I use AfroArchive in my classroom every day. My students finally see their culture reflected in academic literature. This platform is revolutionary.", name: 'Amina Touré', role: 'Secondary School Teacher, Dakar', country: '🇸🇳' },
]

const CIVILIZATIONS = [
  { name: 'Kush & Nubia',       region: 'Northeast Africa', period: '2500 BCE – 350 CE', img: 'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=400&q=80', slug: 'nubian-kingdoms' },
  { name: 'Mali Empire',        region: 'West Africa',       period: '1235 – 1670 CE',   img: 'https://images.unsplash.com/photo-1564436872-f6d81182df12?w=400&q=80', slug: 'mali-empire' },
  { name: 'Axum Kingdom',       region: 'East Africa',       period: '100 – 940 CE',     img: 'https://images.unsplash.com/photo-1572550484818-8f5f64e3f5b0?w=400&q=80', slug: 'axum-kingdom' },
  { name: 'Great Zimbabwe',     region: 'Southern Africa',   period: '1100 – 1450 CE',   img: 'https://images.unsplash.com/photo-1469041797191-50ace28483c3?w=400&q=80', slug: 'great-zimbabwe' },
]

const STATS = [
  { icon: <BookOpen className="w-6 h-6" />, value: 12400, label: 'Articles',     suffix: '+' },
  { icon: <Users    className="w-6 h-6" />, value: 45000, label: 'Contributors', suffix: '+' },
  { icon: <Globe2   className="w-6 h-6" />, value: 54,    label: 'Countries',    suffix: ''  },
  { icon: <Languages className="w-6 h-6" />,value: 127,   label: 'Languages',    suffix: '+' },
  { icon: <Layers   className="w-6 h-6" />, value: 890,   label: 'Collections',  suffix: '+' },
  { icon: <Star     className="w-6 h-6" />, value: 2100,  label: 'Scholars',     suffix: '+' },
]

// ─── Animation variants ───────────────────────────────────────
const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}
const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

// ─── Landing Page ─────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="overflow-x-hidden">
      <HeroSection />
      <StatsSection />
      <FeaturedArticlesSection />
      <TrendingTopicsSection />
      <CollectionsSection />
      <PhilosophersSection />
      <CivilizationsSection />
      <VirtualMuseumBannerSection />
      <TestimonialsSection />
      <CTASection />
    </div>
  )
}

// ─── Hero Section ─────────────────────────────────────────────
function HeroSection() {
  const words = ['Knowledge', 'History', 'Philosophy', 'Culture', 'Wisdom']
  const [wordIdx, setWordIdx] = useState(0)
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; count: number }>({ connected: false, count: 0 })

  useEffect(() => {
    const interval = setInterval(() => setWordIdx(i => (i + 1) % words.length), 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    async function checkDb() {
      try {
        const { count, error } = await supabase
          .from('knowledge_items')
          .select('*', { count: 'exact', head: true })
        if (!error && typeof count === 'number') {
          setDbStatus({ connected: true, count })
        }
      } catch {
        // quiet fallback
      }
    }
    checkDb()
  }, [])

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 animated-gradient opacity-90" />

      {/* Overlay Pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating Orbs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-primary-300/20 rounded-full blur-3xl animate-float" />

      <div className="relative z-10 container-app py-24 text-center">
        {/* Live Database Connected Indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-emerald-500/20 backdrop-blur-md border border-emerald-400/40 rounded-full px-4 py-1.5 mb-6 text-emerald-200"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-emerald-400/50 shadow" />
          <Database className="w-3.5 h-3.5 text-emerald-300" />
          <span className="text-xs font-mono font-medium">
            {dbStatus.connected
              ? `LIVE SUPABASE DATABASE · ${dbStatus.count} KNOWLEDGE ENTITIES · KOLEX AI READY`
              : 'CONNECTING TO SUPABASE DATABASE...'}
          </span>
        </motion.div>

        <div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-8"
          >
            <Sparkles className="w-4 h-4 text-accent-300" />
            <span className="text-sm text-white/90 font-medium">The World's African Knowledge Platform</span>
          </motion.div>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="heading-hero text-white mb-4 !leading-[1.15] sm:!leading-[1.05]"
        >
          <span className="block sm:inline">Preserve African </span>
          <span className="inline-block relative overflow-hidden align-top sm:align-bottom h-[1.25em] min-h-[1.25em] text-accent-300">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={words[wordIdx]}
                initial={{ opacity: 0, y: '100%' }}
                animate={{ opacity: 1, y: '0%' }}
                exit={{ opacity: 0, y: '-100%' }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="block"
              >
                {words[wordIdx]}
              </motion.span>
            </AnimatePresence>
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Discover 5,000 years of African civilization — from the libraries of Timbuktu to the philosophy of Ubuntu. Read, write, and share knowledge that shapes the future.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
        >
          <Link to="/discover" className="btn btn-xl bg-white text-primary-700 hover:bg-sand-100 shadow-lg hover:shadow-xl transition-all" id="hero-explore-btn">
            Start Exploring <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/museum" className="btn btn-xl bg-amber-500/20 text-amber-200 border-2 border-amber-400/50 hover:bg-amber-500/30 backdrop-blur-sm shadow-bronze-glow group" id="hero-museum-btn">
            <span>🏛️ Virtual Museum Tour</span>
            <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link to="/auth/signup" className="btn btn-xl bg-white/10 text-white border-2 border-white/30 hover:bg-white/20 backdrop-blur-sm" id="hero-signup-btn">
            Join the Community
          </Link>
        </motion.div>

        {/* Hero Stats Row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-wrap justify-center gap-8 text-white/70"
        >
          {[
            ['12,400+', 'Articles'],
            ['54', 'Countries'],
            ['45,000+', 'Readers'],
            ['2,100+', 'Scholars'],
          ].map(([val, label]) => (
            <div key={label} className="text-center">
              <div className="text-2xl font-bold text-white">{val}</div>
              <div className="text-sm">{label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
          <div className="w-1 h-2 bg-white/60 rounded-full animate-float" />
        </div>
      </div>
    </section>
  )
}

// ─── Stats Section ────────────────────────────────────────────
function StatsSection() {
  const [ref, inView] = useInView({ threshold: 0.2, triggerOnce: true })
  const [counts, setCounts] = useState(STATS.map(() => 0))

  useEffect(() => {
    if (!inView) return
    STATS.forEach((stat, i) => {
      const duration = 1500
      const steps = 60
      const increment = stat.value / steps
      let current = 0
      const timer = setInterval(() => {
        current = Math.min(current + increment, stat.value)
        setCounts(prev => {
          const next = [...prev]
          next[i] = Math.floor(current)
          return next
        })
        if (current >= stat.value) clearInterval(timer)
      }, duration / steps)
    })
  }, [inView])

  return (
    <section ref={ref} className="section bg-white dark:bg-dark-surface border-y border-sand-200 dark:border-dark-border">
      <div className="container-app">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8"
        >
          {STATS.map((stat, i) => (
            <motion.div key={stat.label} variants={fadeUp} className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center mx-auto mb-3 text-primary-600 dark:text-primary-400">
                {stat.icon}
              </div>
              <div className="text-3xl font-bold font-serif text-gray-900 dark:text-white">
                {formatNumber(counts[i])}{stat.suffix}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ─── Featured Articles Section ────────────────────────────────
function FeaturedArticlesSection() {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true })
  const [articles, setArticles] = useState<Article[]>(MOCK_ARTICLES)
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    async function loadLiveKnowledge() {
      try {
        const { data, error } = await supabase
          .from('knowledge_items')
          .select('*, sources(name, slug)')
          .not('summary', 'is', null)
          .order('created_at', { ascending: false })
          .limit(4)

        if (!error && data && data.length > 0) {
          const mapped = data.map(mapKnowledgeItemToArticle)
          setArticles(mapped)
          setIsLive(true)
        }
      } catch (err) {
        console.warn('Could not load live items from Supabase:', err)
      }
    }
    loadLiveKnowledge()
  }, [])

  return (
    <section ref={ref} className="section">
      <div className="container-app">
        <SectionHeader
          badge={isLive ? "Live from Supabase" : "Featured"}
          title={isLive ? "Live Archive Records" : "Editor's Picks"}
          subtitle={
            isLive
              ? "Live records synchronized directly from the AfroArchive Supabase database & Kolex AI knowledge layer"
              : "Handpicked articles that illuminate the depth and breadth of African knowledge"
          }
          inView={inView}
          cta={{ label: 'Explore All Records', to: '/discover' }}
        />
        <motion.div
          variants={stagger}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10"
        >
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

// ─── Trending Topics Section ──────────────────────────────────
function TrendingTopicsSection() {
  const [ref, inView] = useInView({ threshold: 0.2, triggerOnce: true })
  return (
    <section ref={ref} className="section bg-primary-500 dark:bg-primary-700 overflow-hidden">
      <div className="container-app">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="text-center mb-10"
        >
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-accent-300" />
            <span className="text-accent-300 font-medium text-sm uppercase tracking-wider">Trending Now</span>
          </motion.div>
          <motion.h2 variants={fadeUp} className="heading-xl text-white mb-4">Explore Hot Topics</motion.h2>
          <motion.p variants={fadeUp} className="text-white/70 max-w-xl mx-auto">
            Dive into the conversations shaping African knowledge today
          </motion.p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="flex flex-wrap justify-center gap-3"
        >
          {TRENDING_TOPICS.map((topic, i) => (
            <motion.div key={topic} variants={fadeUp}>
              <Link
                to={`/discover?q=${encodeURIComponent(topic)}`}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <span className="text-accent-300">#{i + 1}</span>
                {topic}
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ─── Collections Section ──────────────────────────────────────
function CollectionsSection() {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true })
  return (
    <section ref={ref} className="section">
      <div className="container-app">
        <SectionHeader
          badge="Collections"
          title="Knowledge Collections"
          subtitle="Curated libraries of African knowledge organized by theme, era, and discipline"
          inView={inView}
          cta={{ label: 'Browse All Collections', to: '/collections' }}
        />
        <motion.div
          variants={stagger}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-10"
        >
          {COLLECTIONS.map(col => (
            <motion.div key={col.slug} variants={fadeUp}>
              <Link
                to={`/collections/${col.slug}`}
                className="group flex flex-col items-center text-center p-5 rounded-2xl border border-sand-200 dark:border-dark-border hover:border-primary-300 dark:hover:border-primary-600 bg-white dark:bg-dark-card hover:shadow-glow transition-all duration-300 hover:-translate-y-1"
              >
                <div className={cn('w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-2xl mb-3 transition-transform duration-300 group-hover:scale-110', col.color)}>
                  {col.icon}
                </div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {col.name}
                </h3>
                <p className="text-xs text-gray-400 mt-1">{col.count} articles</p>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ─── Philosophers Section ─────────────────────────────────────
function PhilosophersSection() {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true })
  return (
    <section ref={ref} className="section bg-gray-50 dark:bg-dark-surface">
      <div className="container-app">
        <SectionHeader
          badge="Thinkers"
          title="African Philosophers & Scholars"
          subtitle="Giants of thought whose ideas shaped continents and centuries"
          inView={inView}
          cta={{ label: 'Discover More Thinkers', to: '/discover?category=philosophy' }}
        />
        <motion.div
          variants={stagger}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10"
        >
          {PHILOSOPHERS.map(p => (
            <motion.div key={p.name} variants={fadeUp}>
              <div className="card-hover p-6 flex flex-col items-center text-center group">
                <div className="relative mb-4">
                  <img
                    src={p.img}
                    alt={p.name}
                    className="w-24 h-24 rounded-2xl object-cover shadow-md group-hover:shadow-glow transition-shadow duration-300"
                    onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=0F5132&color=fff&size=96` }}
                  />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center shadow-sm">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                </div>
                <h3 className="font-serif font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{p.name}</h3>
                <p className="text-xs text-primary-600 dark:text-primary-400 font-medium mt-1">{p.country} · {p.era}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 leading-relaxed line-clamp-3">{p.description}</p>
                <Link to={`/discover?q=${encodeURIComponent(p.name)}`} className="mt-4 text-xs text-primary-600 dark:text-primary-400 font-medium hover:underline flex items-center gap-1">
                  Explore Work <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ─── Civilizations Section ────────────────────────────────────
function CivilizationsSection() {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true })
  return (
    <section ref={ref} className="section">
      <div className="container-app">
        <SectionHeader
          badge="Civilizations"
          title="Great African Civilizations"
          subtitle="Explore the empires, kingdoms, and cultures that defined human history"
          inView={inView}
          cta={{ label: 'All Civilizations', to: '/discover?category=history' }}
        />
        <motion.div
          variants={stagger}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10"
        >
          {CIVILIZATIONS.map(civ => (
            <motion.div key={civ.slug} variants={fadeUp}>
              <Link
                to={`/discover?q=${encodeURIComponent(civ.name)}`}
                className="group block card-hover overflow-hidden"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={civ.img}
                    alt={civ.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=400&q=80' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <span className="badge bg-white/20 text-white text-xs">{civ.period}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-serif font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {civ.name}
                  </h3>
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

// ─── Virtual Museum Banner Section ─────────────────────────────
function VirtualMuseumBannerSection() {
  const [ref, inView] = useInView({ threshold: 0.15, triggerOnce: true })

  return (
    <section ref={ref} className="py-20 relative overflow-hidden bg-charcoal-950 text-ivory-100 border-y border-ivory-100/10">
      {/* Archival Background Textures */}
      <div className="absolute inset-0 bg-archival-grid opacity-30 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-parchment-glow blur-3xl opacity-50 pointer-events-none" />

      <div className="container-app relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.7 }}
          className="rounded-3xl border border-bronze-400/30 bg-charcoal-900/90 backdrop-blur-xl p-8 sm:p-12 lg:p-16 shadow-artifact relative overflow-hidden"
        >
          {/* Subtle Watermark Year */}
          <div
            className="absolute top-2 right-6 font-display font-bold select-none pointer-events-none opacity-5 text-ivory-100 text-8xl md:text-9xl"
            aria-hidden="true"
          >
            1380
          </div>

          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-bronze-400/10 border border-bronze-400/30 text-bronze-300 font-mono text-2xs uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-bronze-400 animate-pulse" />
              FLAGSHIP 3D DIGITAL EXHIBITION
            </div>

            <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-ivory-100 tracking-tight leading-tight">
              Experience the 8-Stage Interactive Virtual Museum
            </h2>

            <p className="font-sans text-base sm:text-lg text-ivory-300 leading-relaxed font-light">
              Step away from the reading portal and immerse yourself in our cinematic exhibition. Explore verified primary manuscripts, celestial charts, a 5,000-year chronological timeline, interactive 3D Africa maps, and converse with our AI Exhibition Curator.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-ivory-100/10 font-mono text-xs text-ivory-300">
              <div className="flex flex-col">
                <span className="text-bronze-400 font-bold text-sm">01. FOLIOS</span>
                <span className="text-2xs text-ivory-400">Primary Manuscripts</span>
              </div>
              <div className="flex flex-col">
                <span className="text-bronze-400 font-bold text-sm">02. MAP</span>
                <span className="text-2xs text-ivory-400">Regional Cartography</span>
              </div>
              <div className="flex flex-col">
                <span className="text-bronze-400 font-bold text-sm">03. TIMELINE</span>
                <span className="text-2xs text-ivory-400">5,000-Year Index</span>
              </div>
              <div className="flex flex-col">
                <span className="text-bronze-400 font-bold text-sm">04. AI CURATOR</span>
                <span className="text-2xs text-ivory-400">Gemini Archival Guide</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <Link
                to="/museum"
                className="btn btn-xl bg-bronze-400 text-charcoal-950 hover:bg-bronze-300 font-display font-semibold uppercase tracking-wider text-xs shadow-bronze-glow group"
              >
                <span>Enter Virtual Museum Tour</span>
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
              <span className="font-mono text-2xs text-ivory-400 self-center sm:self-auto">
                No tickets or sign-in required • Free full access
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Testimonials Section ─────────────────────────────────────
function TestimonialsSection() {
  const [ref, inView]   = useInView({ threshold: 0.2, triggerOnce: true })
  const [current, setCurrent] = useState(0)

  const prev = () => setCurrent(i => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)
  const next = () => setCurrent(i => (i + 1) % TESTIMONIALS.length)

  useEffect(() => {
    const t = setInterval(next, 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <section ref={ref} className="section bg-primary-500 dark:bg-primary-800">
      <div className="container-app">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <Quote className="w-12 h-12 text-accent-300 mx-auto mb-6" />
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
            >
              <p className="text-xl sm:text-2xl text-white/90 italic leading-relaxed mb-8 font-serif">
                "{TESTIMONIALS[current].text}"
              </p>
              <div className="flex flex-col items-center gap-1">
                <span className="text-white font-semibold">{TESTIMONIALS[current].name}</span>
                <span className="text-white/60 text-sm">{TESTIMONIALS[current].role}</span>
                <span className="text-xl">{TESTIMONIALS[current].country}</span>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-center gap-4 mt-8">
            <button onClick={prev} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all" aria-label="Previous testimonial">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={cn('w-2 h-2 rounded-full transition-all duration-300', i === current ? 'bg-white w-6' : 'bg-white/40')}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
            <button onClick={next} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all" aria-label="Next testimonial">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── CTA Section ──────────────────────────────────────────────
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
          {/* Decorative circles */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-accent-500/20 rounded-full" />

          <div className="relative z-10">
            <h2 className="heading-xl text-white mb-4">
              Ready to Discover Africa's Story?
            </h2>
            <p className="text-white/80 text-lg max-w-2xl mx-auto mb-10">
              Join 45,000+ readers, researchers, and contributors preserving and discovering African knowledge. Free to read, free to contribute.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth/signup" className="btn btn-xl bg-white text-primary-700 hover:bg-sand-100 shadow-lg" id="cta-signup-btn">
                Start Your Journey <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/discover" className="btn btn-xl border-2 border-white/40 text-white hover:bg-white/10">
                Explore First
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Section Header Helper ────────────────────────────────────
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
    <motion.div
      variants={stagger}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"
    >
      <div>
        <motion.div variants={fadeUp} className="flex items-center gap-2 mb-3">
          <div className="w-8 h-1 bg-primary-500 rounded-full" />
          <span className="text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">{badge}</span>
        </motion.div>
        <motion.h2 variants={fadeUp} className="heading-lg text-gray-900 dark:text-white">{title}</motion.h2>
        <motion.p variants={fadeUp} className="text-gray-500 dark:text-gray-400 mt-2 max-w-xl">{subtitle}</motion.p>
      </div>
      {cta && (
        <motion.div variants={fadeUp} className="flex-shrink-0">
          <Link to={cta.to} className="btn btn-outline btn-md gap-1.5">
            {cta.label} <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>
      )}
    </motion.div>
  )
}
