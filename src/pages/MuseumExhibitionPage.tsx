import React, { useState, useEffect, useCallback } from 'react'
import { Navbar } from '../components/Navbar/Navbar'
import { Hero } from '../components/Hero/Hero'
import { ArchiveExplorer } from '../components/Archive/ArchiveExplorer'
import { TimelineSection } from '../components/Timeline/TimelineSection'
import { AfricaMapSection } from '../components/Map/AfricaMapSection'
import { StoriesSection } from '../components/Stories/StoriesSection'
import { AiCuratorSection } from '../components/ai/AiCuratorSection'
import { AboutSection } from '../components/About/AboutSection'
import { Footer } from '../components/layout/Footer'
import { ArtifactDetailDrawer } from '../components/Archive/ArtifactDetailDrawer'
import { StoryReaderModal } from '../components/Stories/StoryReaderModal'
import { SearchModal } from '../components/Navbar/SearchModal'
import { SignInModal } from '../components/Navbar/SignInModal'
import { BookmarksDrawer } from '../components/Navbar/BookmarksDrawer'
import { ShortcutsModal } from '../components/layout/ShortcutsModal'
import { DesignTokensDoc } from '../components/DevTools/DesignTokensDoc'
import { useBookmarks } from '../hooks/useBookmarks'
import { ArtifactItem } from '../types/archiveTypes'
import { StoryItem } from '../types/storyTypes'
import { BookOpen, Clock, MapPin, Scroll, Sparkles, Info, LayoutGrid } from 'lucide-react'

// Museum gallery tab definitions
type GalleryTab = 'collections' | 'timeline' | 'map' | 'stories' | 'ai' | 'about'

interface TabDef {
  key: GalleryTab
  label: string
  shortLabel: string
  icon: React.ElementType
  description: string
}

const GALLERY_TABS: TabDef[] = [
  { key: 'collections', label: 'Collections & Archive', shortLabel: 'Collections', icon: BookOpen, description: 'Browse manuscripts, artifacts, and heritage entries' },
  { key: 'timeline', label: 'Civilizations Timeline', shortLabel: 'Timeline', icon: Clock, description: 'Explore African civilizations across the ages' },
  { key: 'map', label: 'Regional Map', shortLabel: 'Map', icon: MapPin, description: 'Discover heritage by African region' },
  { key: 'stories', label: 'Oral Histories', shortLabel: 'Stories', icon: Scroll, description: 'Philosophies, proverbs, and oral traditions' },
  { key: 'ai', label: 'AI Curator', shortLabel: 'AI', icon: Sparkles, description: 'Get guided explorations from our AI curator' },
  { key: 'about', label: 'About the Museum', shortLabel: 'About', icon: Info, description: 'Our mission and manifesto' },
]

export default function MuseumExhibitionPage() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [signInOpen, setSignInOpen] = useState(false)
  const [bookmarksOpen, setBookmarksOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [selectedArtifact, setSelectedArtifact] = useState<ArtifactItem | null>(null)
  const [selectedStory, setSelectedStory] = useState<StoryItem | null>(null)
  const [showDevDoc, setShowDevDoc] = useState(false)
  const [activeTab, setActiveTab] = useState<GalleryTab>('collections')
  const [showHero, setShowHero] = useState(true)

  const { bookmarks, isBookmarked, toggleBookmark, removeBookmark, count: bookmarkCount } = useBookmarks()

  // Smooth-scroll helper
  const scrollToSection = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Handle "Explore" click from Hero — hide hero and show collections
  const handleExploreFromHero = useCallback(() => {
    setShowHero(false)
    setActiveTab('collections')
    // Scroll to top of gallery content
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleDiscoverFromHero = useCallback(() => {
    setShowHero(false)
    setActiveTab('timeline')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleTabChange = useCallback((tab: GalleryTab) => {
    setActiveTab(tab)
    setShowHero(false)
    // Scroll to top of gallery content area
    const galleryEl = document.getElementById('gallery-content')
    if (galleryEl) {
      galleryEl.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  // Check if any modal is open
  const isAnyModalOpen =
    searchOpen ||
    signInOpen ||
    bookmarksOpen ||
    shortcutsOpen ||
    !!selectedArtifact ||
    !!selectedStory

  useEffect(() => {
    // Dev doc — URL param or Shift+D
    const params = new URLSearchParams(window.location.search)
    if (params.get('dev') === 'true') {
      setShowDevDoc(true)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
      const isEditable = tag === 'input' || tag === 'textarea' || tag === 'select'

      // Shift+D — dev token doc
      if (e.shiftKey && e.key.toLowerCase() === 'd') {
        setShowDevDoc((prev) => !prev)
        return
      }

      // Skip all other shortcuts if user is typing in an input
      if (isEditable) return

      // ? — Keyboard Shortcuts Modal
      if (e.key === '?') {
        e.preventDefault()
        setShortcutsOpen((prev) => !prev)
        return
      }

      // Ctrl/Cmd + K — Global Search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (!isAnyModalOpen) setSearchOpen(true)
        return
      }

      // B — Bookmarks Drawer
      if (e.key.toLowerCase() === 'b' && !isAnyModalOpen) {
        setBookmarksOpen(true)
        return
      }

      // Number keys 1-6 — switch tabs (when gallery is visible)
      if (!showHero && !isAnyModalOpen) {
        const num = parseInt(e.key)
        if (num >= 1 && num <= GALLERY_TABS.length) {
          handleTabChange(GALLERY_TABS[num - 1].key)
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isAnyModalOpen, showHero, handleTabChange])

  // Render the active gallery section content
  const renderActiveSection = () => {
    switch (activeTab) {
      case 'collections':
        return (
          <ArchiveExplorer
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
        return <AfricaMapSection />
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
    <div className="min-h-screen bg-sand-50 dark:bg-dark-bg text-gray-900 dark:text-ivory-100 font-sans transition-colors relative">
      {/* Skip to Main Content (Accessibility) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[999] focus:px-4 focus:py-2 focus:bg-bronze-400 focus:text-charcoal-950 focus:font-sans focus:font-semibold focus:text-sm focus:rounded-sm focus:shadow-lg focus:outline-none"
      >
        Skip to Main Content
      </a>

      {/* Responsive Navigation Header */}
      <Navbar
        onSearchClick={() => setSearchOpen(true)}
        onSignInClick={() => setSignInOpen(true)}
        bookmarkCount={bookmarkCount}
        onBookmarksClick={() => setBookmarksOpen(true)}
      />

      {/* Main Exhibition Sequence */}
      <main id="main-content" tabIndex={-1} className="outline-none">
        {/* Hero — shown on initial load, hidden after user starts exploring */}
        {showHero && (
          <Hero
            onExploreClick={handleExploreFromHero}
            onDiscoverClick={handleDiscoverFromHero}
          />
        )}

        {/* Gallery Navigation Tabs + Content — shown after hero is dismissed */}
        {!showHero && (
          <div className="pt-20 sm:pt-24">
            {/* Back to Hero / Exhibition Intro Button */}
            <div className="container-app pt-4 pb-2">
              <button
                onClick={() => setShowHero(true)}
                type="button"
                className="inline-flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-accent-400 transition-colors font-mono text-xs uppercase tracking-wider"
              >
                <span>←</span>
                <span>Exhibition Intro</span>
              </button>
            </div>

            {/* Tab Navigation Bar */}
            <div className="sticky top-16 sm:top-[72px] z-30 bg-white/95 dark:bg-dark-surface/95 backdrop-blur-md border-b border-sand-200 dark:border-dark-border transition-colors">
              <div className="container-app">
                <nav
                  aria-label="Gallery Navigation"
                  className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2.5"
                >
                  {GALLERY_TABS.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.key
                    return (
                      <button
                        key={tab.key}
                        onClick={() => handleTabChange(tab.key)}
                        type="button"
                        title={tab.description}
                        className={`group relative flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-lg font-sans text-xs font-semibold tracking-wide transition-all duration-200 flex-shrink-0 ${
                          isActive
                            ? 'text-white bg-primary-600 dark:bg-primary-700 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-card'
                        }`}
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-accent-300' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200'}`} />
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden">{tab.shortLabel}</span>
                      </button>
                    )
                  })}
                </nav>
              </div>
            </div>

            {/* Active Tab Description Header */}
            <div className="container-app py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-sand-200 dark:border-dark-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-500/10 border border-primary-200 dark:border-primary-500/30 flex items-center justify-center flex-shrink-0">
                  <activeTabDef.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge badge-primary">GALLERY EXHIBIT</span>
                    <span className="text-xs text-gray-400 font-mono">Stage {GALLERY_TABS.findIndex((t) => t.key === activeTab) + 1} of {GALLERY_TABS.length}</span>
                  </div>
                  <h2 className="heading-lg text-gray-900 dark:text-white">{activeTabDef.label}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-sans mt-0.5">{activeTabDef.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-primary-500" />
                <span className="badge badge-gray font-mono">
                  EXHIBIT {GALLERY_TABS.findIndex((t) => t.key === activeTab) + 1} / {GALLERY_TABS.length}
                </span>
              </div>
            </div>

            {/* Gallery Content Area */}
            <div id="gallery-content" className="min-h-[60vh]">
              {renderActiveSection()}
            </div>
          </div>
        )}

        {/* Developer-Only Design Tokens Panel */}
        {showDevDoc && (
          <div className="relative z-50">
            <div className="text-center py-4 bg-bronze-900/80 border-y border-bronze-400/40 font-mono text-xs text-bronze-300">
              Developer Token Inspector Active (Press Shift + D to hide)
            </div>
            <DesignTokensDoc />
          </div>
        )}
      </main>

      {/* Museum Exhibition Footer */}
      <Footer onKeyboardShortcutsClick={() => setShortcutsOpen(true)} />

      {/* Interactive Exhibition Overlays */}
      <ArtifactDetailDrawer
        artifact={selectedArtifact}
        isOpen={!!selectedArtifact}
        onClose={() => setSelectedArtifact(null)}
      />
      <StoryReaderModal
        story={selectedStory}
        isOpen={!!selectedStory}
        onClose={() => setSelectedStory(null)}
      />
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onInspectArtifact={(art) => setSelectedArtifact(art)}
        onReadStory={(st) => setSelectedStory(st)}
      />
      <BookmarksDrawer
        isOpen={bookmarksOpen}
        onClose={() => setBookmarksOpen(false)}
        bookmarks={bookmarks}
        onRemoveBookmark={(id) => removeBookmark(id)}
        onInspectArtifact={(art) => setSelectedArtifact(art)}
        onReadStory={(st) => setSelectedStory(st)}
      />
      <SignInModal isOpen={signInOpen} onClose={() => setSignInOpen(false)} />
      <ShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  )
}
