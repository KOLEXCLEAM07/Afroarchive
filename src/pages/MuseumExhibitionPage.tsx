import React, { useState, useEffect, useCallback } from 'react'
import { Navbar } from '../components/Navbar/Navbar'
import { Hero } from '../components/Hero/Hero'
import { SectionNavigation } from '../components/SectionNavigation/SectionNavigation'
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

// Section anchor IDs for keyboard navigation
const SECTION_ANCHORS = ['hero', 'archive', 'timeline', 'map', 'stories', 'ai', 'about']

export default function MuseumExhibitionPage() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [signInOpen, setSignInOpen] = useState(false)
  const [bookmarksOpen, setBookmarksOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [selectedArtifact, setSelectedArtifact] = useState<ArtifactItem | null>(null)
  const [selectedStory, setSelectedStory] = useState<StoryItem | null>(null)
  const [showDevDoc, setShowDevDoc] = useState(false)

  const { bookmarks, isBookmarked, toggleBookmark, removeBookmark, count: bookmarkCount } = useBookmarks()

  // Smooth-scroll helper
  const scrollToSection = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
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

      // G + 1-7 — Jump to Section
      if (e.key.toLowerCase() === 'g' && !isAnyModalOpen) {
        const handleSecondKey = (e2: KeyboardEvent) => {
          const num = parseInt(e2.key)
          if (num >= 1 && num <= SECTION_ANCHORS.length) {
            scrollToSection(SECTION_ANCHORS[num - 1])
          }
          window.removeEventListener('keydown', handleSecondKey)
        }
        window.addEventListener('keydown', handleSecondKey)
        setTimeout(() => window.removeEventListener('keydown', handleSecondKey), 1000)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isAnyModalOpen, scrollToSection])

  return (
    <div className="min-h-screen bg-charcoal-900 text-ivory-100 font-sans selection:bg-bronze-400 selection:text-charcoal-950 relative">
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

      {/* Desktop Vertical Section Indicator */}
      <SectionNavigation />

      {/* Main Exhibition Sequence */}
      <main id="main-content" tabIndex={-1} className="outline-none">
        {/* Gallery 01 — Hero Opening Exhibition */}
        <Hero
          onExploreClick={() => scrollToSection('archive')}
          onDiscoverClick={() => scrollToSection('timeline')}
        />

        {/* Gallery 02 — Archive Explorer & Collections */}
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

        {/* Gallery 03 — Chronological Civilizations Timeline */}
        <TimelineSection
          onInspectArtifact={(artifact) => setSelectedArtifact(artifact)}
        />

        {/* Gallery 04 — Interactive Africa Map & Regional Discovery */}
        <AfricaMapSection />

        {/* Gallery 05 — Stories, Philosophies & Oral Traditions */}
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

        {/* Gallery 06 — AfroArchive AI Exhibition Curator */}
        <AiCuratorSection
          onInspectArtifact={(artifact) => setSelectedArtifact(artifact)}
        />

        {/* Gallery 07 — About & Museum Manifesto */}
        <AboutSection />

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
