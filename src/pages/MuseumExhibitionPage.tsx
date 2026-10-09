import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Hero } from '../components/Hero/Hero'
import { ArchiveExplorer } from '../components/Archive/ArchiveExplorer'
import { TimelineSection } from '../components/Timeline/TimelineSection'
import { AfricaMapSection } from '../components/Map/AfricaMapSection'
import { StoriesSection } from '../components/Stories/StoriesSection'
import { AiCuratorSection } from '../components/ai/AiCuratorSection'
import { AboutSection } from '../components/About/AboutSection'
import { ArtifactDetailDrawer } from '../components/Archive/ArtifactDetailDrawer'
import { StoryReaderModal } from '../components/Stories/StoryReaderModal'
import { SearchModal } from '../components/Navbar/SearchModal'
import { BookmarksDrawer } from '../components/Navbar/BookmarksDrawer'
import { ShortcutsModal } from '../components/layout/ShortcutsModal'
import { DesignTokensDoc } from '../components/DevTools/DesignTokensDoc'
import { useBookmarks } from '../hooks/useBookmarks'
import { hasOpenModal } from '../hooks/useScrollLock'
import { ARTIFACTS_DATA } from '../data/archiveData'
import { STORIES_DATA } from '../data/storyData'
import { ArtifactItem, RegionFilter } from '../types/archiveTypes'
import { StoryItem } from '../types/storyTypes'
import { GalleryTab, isGalleryTab } from '../components/museum/galleryTabs'
import { BookOpen, Clock, MapPin, Scroll, Sparkles, Info, Landmark, Search, Bookmark, Keyboard } from 'lucide-react'

interface TabDef {
  key: GalleryTab
  label: string
  shortLabel: string
  icon: React.ElementType
  description: string
}

const GALLERY_TABS: TabDef[] = [
  { key: 'collections', label: 'Collections', shortLabel: 'Collections', icon: BookOpen, description: 'Manuscripts, sculpture, monuments and other objects from across the continent.' },
  { key: 'timeline', label: 'Timeline', shortLabel: 'Timeline', icon: Clock, description: 'African states and civilizations through time, with the objects they left behind.' },
  { key: 'map', label: 'Regions', shortLabel: 'Regions', icon: MapPin, description: 'Heritage by region, from the Nile valley to the Swahili coast.' },
  { key: 'stories', label: 'Stories & proverbs', shortLabel: 'Stories', icon: Scroll, description: 'Philosophy, proverbs and oral traditions, in their own words.' },
  { key: 'ai', label: 'Ask the curator', shortLabel: 'Curator', icon: Sparkles, description: 'Ask a question and get an answer drawn from the archive’s records.' },
  { key: 'about', label: 'About', shortLabel: 'About', icon: Info, description: 'How the museum and the archive are put together.' },
]

const REGION_KEYS: RegionFilter[] = ['west', 'east', 'north', 'southern', 'central']

export default function MuseumExhibitionPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchOpen, setSearchOpen] = useState(false)
  const [bookmarksOpen, setBookmarksOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [selectedArtifact, setSelectedArtifact] = useState<ArtifactItem | null>(null)
  const [selectedStory, setSelectedStory] = useState<StoryItem | null>(null)
  const [showDevDoc, setShowDevDoc] = useState(false)
  const [activeTab, setActiveTab] = useState<GalleryTab>('collections')
  const [showHero, setShowHero] = useState(true)
  const [collectionsRegion, setCollectionsRegion] = useState<RegionFilter | undefined>(undefined)

  const { bookmarks, isBookmarked, toggleBookmark, removeBookmark, count: bookmarkCount } = useBookmarks()

  const tabParam = searchParams.get('tab')
  const artifactParam = searchParams.get('artifact')
  const storyParam = searchParams.get('story')

  const updateParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          mutate(next)
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  // Deep links: ?tab=, ?artifact=, ?story=
  useEffect(() => {
    if (isGalleryTab(tabParam)) {
      setActiveTab(tabParam)
      setShowHero(false)
    }
  }, [tabParam])

  useEffect(() => {
    if (!artifactParam) return
    const artifact = ARTIFACTS_DATA.find((a) => a.id === artifactParam)
    if (artifact) {
      setSelectedArtifact(artifact)
      setShowHero(false)
    }
  }, [artifactParam])

  useEffect(() => {
    if (!storyParam) return
    const story = STORIES_DATA.find((s) => s.id === storyParam)
    if (story) {
      setSelectedStory(story)
      setShowHero(false)
    }
  }, [storyParam])

  const handleTabChange = useCallback(
    (tab: GalleryTab) => {
      setActiveTab(tab)
      setShowHero(false)
      setCollectionsRegion(undefined)
      updateParams((p) => p.set('tab', tab))
      const galleryEl = document.getElementById('gallery-content')
      if (galleryEl) {
        galleryEl.scrollIntoView({ behavior: 'smooth' })
      }
    },
    [updateParams],
  )

  const handleExploreFromHero = useCallback(() => {
    handleTabChange('collections')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [handleTabChange])

  const handleRegionFromHero = useCallback(() => {
    handleTabChange('map')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [handleTabChange])

  const handleExploreRegion = useCallback(
    (regionKey: string) => {
      handleTabChange('collections')
      const region = REGION_KEYS.find((r) => r === regionKey)
      setCollectionsRegion(region)
    },
    [handleTabChange],
  )

  const handleShowIntro = () => {
    setShowHero(true)
    updateParams((p) => p.delete('tab'))
  }

  const closeArtifact = useCallback(() => {
    setSelectedArtifact(null)
    if (artifactParam) updateParams((p) => p.delete('artifact'))
  }, [artifactParam, updateParams])

  const closeStory = useCallback(() => {
    setSelectedStory(null)
    if (storyParam) updateParams((p) => p.delete('story'))
  }, [storyParam, updateParams])

  const closeSearch = useCallback(() => setSearchOpen(false), [])
  const closeBookmarks = useCallback(() => setBookmarksOpen(false), [])
  const closeShortcuts = useCallback(() => setShortcutsOpen(false), [])

  const isAnyModalOpen =
    searchOpen ||
    bookmarksOpen ||
    shortcutsOpen ||
    !!selectedArtifact ||
    !!selectedStory

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      const isEditable =
        tag === 'input' || tag === 'textarea' || tag === 'select' || !!target?.isContentEditable
      const modalOpen =
        isAnyModalOpen || hasOpenModal() || !!document.querySelector('[role="dialog"]')

      // Ctrl/Cmd + K works everywhere, including inside text fields
      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (!modalOpen) setSearchOpen(true)
        return
      }

      if (isEditable) return

      if (import.meta.env.DEV && e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase() === 'd') {
        setShowDevDoc((prev) => !prev)
        return
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return

      if (e.key === '?') {
        e.preventDefault()
        if (shortcutsOpen) setShortcutsOpen(false)
        else if (!modalOpen) setShortcutsOpen(true)
        return
      }

      if (e.key.toLowerCase() === 'b') {
        if (!modalOpen) setBookmarksOpen(true)
        return
      }

      if (!showHero && !modalOpen && /^[1-9]$/.test(e.key)) {
        const num = Number(e.key)
        if (num <= GALLERY_TABS.length) {
          handleTabChange(GALLERY_TABS[num - 1].key)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isAnyModalOpen, shortcutsOpen, showHero, handleTabChange])

  const renderActiveSection = () => {
    switch (activeTab) {
      case 'collections':
        return (
          <ArchiveExplorer
            initialRegion={collectionsRegion}
            onInspectArtifact={(artifact) => setSelectedArtifact(artifact)}
            isBookmarked={isBookmarked}
            onToggleBookmark={(art) =>
              toggleBookmark({
                id: art.id,
                type: 'artifact',
                title: art.title,
                subtitle: art.subtitle,
                catalogOrCategory: art.catalogNumber,
                savedAt: new Date().toISOString(),
                href: art.recordSlug ? `/article/${art.recordSlug}` : `/museum?artifact=${art.id}`,
              })
            }
          />
        )
      case 'timeline':
        return (
          <TimelineSection
            onInspectArtifact={(artifact) => setSelectedArtifact(artifact)}
          />
        )
      case 'map':
        return <AfricaMapSection onExploreRegion={handleExploreRegion} />
      case 'stories':
        return (
          <StoriesSection
            onReadStory={(story) => setSelectedStory(story)}
            isBookmarked={isBookmarked}
            onToggleBookmark={(st) =>
              toggleBookmark({
                id: st.id,
                type: 'story',
                title: st.title,
                subtitle: st.subtitle,
                catalogOrCategory: st.categoryLabel,
                savedAt: new Date().toISOString(),
                href: `/museum?story=${st.id}`,
              })
            }
          />
        )
      case 'ai':
        return (
          <AiCuratorSection
            onInspectArtifact={(artifact) => setSelectedArtifact(artifact)}
          />
        )
      case 'about':
        return <AboutSection />
      default:
        return null
    }
  }

  const activeTabDef = GALLERY_TABS.find((t) => t.key === activeTab)!

  return (
    // The museum is a dark "gallery wing" of the site: same navbar, type and components,
    // with the dark palette forced on so it reads as an exhibition space.
    <div className="dark">
    <div className="min-h-screen bg-dark-bg text-ivory-100 font-sans relative">
      <div className="sticky top-16 md:top-18 z-30 bg-charcoal-900/95 backdrop-blur-md border-b border-white/10">
        <div className="container-app flex items-center gap-3">
          <button
            type="button"
            onClick={handleShowIntro}
            className={`hidden md:inline-flex items-center gap-2 pr-4 mr-1 border-r border-white/10 font-serif font-bold text-lg whitespace-nowrap transition-colors ${showHero ? 'text-accent-300' : 'text-ivory-100 hover:text-accent-300'}`}
          >
            <Landmark className="w-4 h-4" aria-hidden="true" /> Virtual Museum
          </button>
          <nav aria-label="Museum galleries" className="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar py-2.5">
            {GALLERY_TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = !showHero && activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-2 whitespace-nowrap px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
                    isActive ? 'bg-white/10 text-white' : 'text-ivory-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-accent-300' : ''}`} aria-hidden="true" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button type="button" onClick={() => setSearchOpen(true)} aria-label="Search the museum (Ctrl+K)" className="p-2 rounded-lg text-ivory-300 hover:text-white hover:bg-white/10">
              <Search className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => setBookmarksOpen(true)} aria-label={`Saved items (${bookmarkCount})`} className="relative p-2 rounded-lg text-ivory-300 hover:text-white hover:bg-white/10">
              <Bookmark className="w-4 h-4" />
              {bookmarkCount > 0 && (
                <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-accent-400 text-charcoal-950 text-[10px] font-bold rounded-full flex items-center justify-center">
                  {bookmarkCount}
                </span>
              )}
            </button>
            <button type="button" onClick={() => setShortcutsOpen(true)} aria-label="Keyboard shortcuts" className="hidden sm:inline-flex p-2 rounded-lg text-ivory-300 hover:text-white hover:bg-white/10">
              <Keyboard className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div id="main-content" className="outline-none">
        {showHero && (
          <Hero
            onExploreClick={handleExploreFromHero}
            onRegionClick={handleRegionFromHero}
          />
        )}

        {!showHero && (
          <div>
            <header className="container-app pt-10 pb-8 border-b border-white/10">
              <p className="eyebrow mb-2"><activeTabDef.icon className="w-3.5 h-3.5" aria-hidden="true" /> Virtual Museum</p>
              <h1 className="heading-xl text-white">{activeTabDef.label}</h1>
              <p className="text-ivory-400 mt-2 max-w-2xl">{activeTabDef.description}</p>
            </header>

            <div id="gallery-content" className="min-h-[60vh] scroll-mt-32">
              {renderActiveSection()}
            </div>
          </div>
        )}

        {import.meta.env.DEV && showDevDoc && (
          <div className="relative z-50">
            <div className="text-center py-4 bg-charcoal-800 border-y border-white/10 font-mono text-xs text-accent-300">
              Developer token inspector (Shift + D to hide)
            </div>
            <DesignTokensDoc />
          </div>
        )}
      </div>

      {/* Interactive Exhibition Overlays */}
      <ArtifactDetailDrawer
        artifact={selectedArtifact}
        isOpen={!!selectedArtifact}
        onClose={closeArtifact}
      />
      <StoryReaderModal
        story={selectedStory}
        isOpen={!!selectedStory}
        onClose={closeStory}
      />
      <SearchModal
        isOpen={searchOpen}
        onClose={closeSearch}
        onInspectArtifact={(art) => setSelectedArtifact(art)}
        onReadStory={(st) => setSelectedStory(st)}
      />
      <BookmarksDrawer
        isOpen={bookmarksOpen}
        onClose={closeBookmarks}
        bookmarks={bookmarks}
        onRemoveBookmark={(id) => removeBookmark(id)}
        onInspectArtifact={(art) => setSelectedArtifact(art)}
        onReadStory={(st) => setSelectedStory(st)}
      />
      <ShortcutsModal isOpen={shortcutsOpen} onClose={closeShortcuts} />
    </div>
    </div>
  )
}
