import React, { useState, useEffect } from 'react'
import { Search, Menu, X, Globe, User, BookOpen, Compass, Sparkles, Info, Bookmark, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export interface NavbarProps {
  onSearchClick?: () => void
  onSignInClick?: () => void
  bookmarkCount?: number
  onBookmarksClick?: () => void
}

export const Navbar: React.FC<NavbarProps> = ({
  onSearchClick,
  onSignInClick,
  bookmarkCount = 0,
  onBookmarksClick,
}) => {
  const { user, profile, signOut } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileMenuOpen])

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  const navLinks = [
    { label: 'Explore', href: '#explore', icon: Compass },
    { label: 'Archive', href: '#archive', icon: BookOpen },
    { label: 'Stories', href: '#stories', icon: Globe },
    { label: 'AI', href: '#ai', icon: Sparkles },
    { label: 'About', href: '#about', icon: Info },
  ]

  const displayName = profile?.full_name || profile?.username || user?.email?.split('@')[0] || 'Member'

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'bg-charcoal-900/90 backdrop-blur-md border-b border-ivory-100/10 py-3.5 shadow-museum'
            : 'bg-gradient-to-b from-charcoal-950/80 to-transparent py-4 lg:py-6'
        }`}
      >
        <div className="container-app flex items-center justify-between">
          {/* Brand Wordmark */}
          <a
            href="/"
            className="group flex items-center space-x-2 focus:outline-none p-1 rounded"
            title="Return to Main Portal"
          >
            <div className="w-8 h-8 rounded-lg bg-primary-500/20 border border-primary-500/40 flex items-center justify-center transition-colors duration-300 group-hover:border-primary-400">
              <span className="font-serif font-bold text-accent-400 text-sm">A</span>
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-bold text-base sm:text-lg lg:text-xl tracking-wider text-white group-hover:text-accent-300 transition-colors duration-300">
                AFROARCHIVE
              </span>
              <span className="font-mono text-[9px] tracking-widest text-accent-400/80 -mt-1 hidden sm:inline">
                DIGITAL MUSEUM
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links — only show on lg+ (1024px+) to avoid cramped tablet layout */}
          <nav
            aria-label="Main Navigation"
            className="hidden lg:flex items-center space-x-8"
          >
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="font-sans text-xs uppercase tracking-widest text-white/80 hover:text-accent-300 transition-colors duration-300 relative py-1 focus:outline-none"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop Action Items — only show on lg+ */}
          <div className="hidden lg:flex items-center space-x-3">
            <button
              onClick={onSearchClick}
              type="button"
              aria-label="Search AfroArchive collections"
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors duration-200"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              onClick={onBookmarksClick}
              type="button"
              aria-label="View Saved Heritage Items"
              className="relative p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors duration-200"
            >
              <Bookmark className="w-4 h-4" />
              {bookmarkCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 text-white font-mono text-[9px] font-bold rounded-full flex items-center justify-center">
                  {bookmarkCount}
                </span>
              )}
            </button>

            {user ? (
              <div className="flex items-center space-x-2">
                <a
                  href="/profile"
                  className="btn btn-sm btn-outline gap-1.5 max-w-[140px] truncate"
                  title="View Archival Profile & Write Articles"
                >
                  <User className="w-3.5 h-3.5 text-accent-400 flex-shrink-0" />
                  <span className="truncate">{displayName}</span>
                </a>
                <button
                  onClick={() => signOut()}
                  type="button"
                  title="Sign Out"
                  className="p-2 text-white/60 hover:text-red-400 hover:bg-white/10 rounded transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onSignInClick}
                type="button"
                className="btn btn-sm btn-primary gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            <a
              href="/"
              className="inline-flex items-center space-x-1.5 text-xs font-sans font-medium uppercase tracking-wider text-ivory-300 hover:text-bronze-300 bg-charcoal-800/80 border border-ivory-100/15 hover:border-bronze-400/60 px-3.5 py-2 rounded-sm transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-bronze-400"
              title="Return to Main Archive Portal"
            >
              <span>← Exit Tour</span>
            </a>
          </div>

          {/* Mobile + Tablet Hamburger Controls — show below lg (< 1024px) */}
          <div className="flex lg:hidden items-center space-x-2">
            <button
              onClick={onSearchClick}
              type="button"
              aria-label="Search"
              className="p-2 text-ivory-300 hover:text-bronze-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-bronze-400"
            >
              <Search className="w-5 h-5" />
            </button>

            <button
              onClick={onBookmarksClick}
              type="button"
              aria-label="Bookmarks"
              className="relative p-2 text-ivory-300 hover:text-bronze-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-bronze-400"
            >
              <Bookmark className="w-5 h-5" />
              {bookmarkCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-bronze-400 text-charcoal-950 font-mono text-[9px] font-bold rounded-full flex items-center justify-center">
                  {bookmarkCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-drawer"
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              className="p-2 text-ivory-100 hover:text-bronze-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-bronze-400"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-bronze-400" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile + Tablet Drawer Overlay — show below lg (< 1024px) */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Menu"
          className="fixed inset-0 z-40 bg-charcoal-950/98 backdrop-blur-xl flex flex-col justify-between p-6 sm:p-10 lg:hidden animate-fade-in"
        >
          {/* Mobile Header Spacer */}
          <div className="pt-20 flex justify-between items-center border-b border-ivory-100/10 pb-4">
            <span className="font-mono text-2xs uppercase tracking-widest text-bronze-400">
              EXHIBITION NAVIGATION
            </span>
            <span className="font-mono text-2xs text-ivory-400">
              AFROARCHIVE v1.0
            </span>
          </div>

          {/* Navigation Links List — tablet gets a 2-column grid */}
          <div className="flex flex-col sm:grid sm:grid-cols-2 sm:gap-x-8 space-y-6 sm:space-y-0 sm:gap-y-6 my-auto">
            {navLinks.map((link, idx) => {
              const IconComp = link.icon
              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between text-2xl sm:text-xl font-serif text-ivory-100 hover:text-bronze-300 transition-colors py-2 border-b border-ivory-100/5 group"
                >
                  <div className="flex items-center space-x-4">
                    <span className="font-mono text-xs text-bronze-400/80">0{idx + 1}</span>
                    <span className="group-hover:translate-x-2 transition-transform duration-300">
                      {link.label}
                    </span>
                  </div>
                  <IconComp className="w-5 h-5 text-ivory-500 group-hover:text-bronze-400" />
                </a>
              )
            })}
          </div>

          {/* Mobile Footer Actions — tablet gets side-by-side buttons */}
          <div className="pt-6 border-t border-ivory-100/10 flex flex-col sm:flex-row sm:items-center gap-3">
            <a
              href="/"
              className="flex-1 text-center py-3 bg-charcoal-800 text-ivory-200 border border-ivory-100/15 font-sans font-semibold text-xs uppercase tracking-widest rounded-sm hover:border-bronze-400 transition-colors"
            >
              ← Back to Main Archive Portal
            </a>
            {user ? (
              <>
                <a
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-3 bg-bronze-400 text-charcoal-950 font-sans font-semibold text-xs uppercase tracking-widest rounded-sm hover:bg-bronze-300 transition-colors"
                >
                  My Profile ({displayName})
                </a>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    signOut()
                  }}
                  type="button"
                  className="flex-1 text-center py-3 bg-red-950/50 text-red-300 border border-red-500/40 font-sans font-semibold text-xs uppercase tracking-widest rounded-sm hover:bg-red-900/60 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  if (onSignInClick) onSignInClick()
                }}
                type="button"
                className="flex-1 text-center py-3 bg-bronze-400 text-charcoal-950 font-sans font-semibold text-xs uppercase tracking-widest rounded-sm hover:bg-bronze-300 transition-colors"
              >
                Sign In to Archive
              </button>
            )}
          </div>
          <div className="text-center font-mono text-[10px] text-ivory-500 tracking-wider pt-3">
            PRESERVE. DISCOVER. EMPOWER.
          </div>
        </div>
      )}
    </>
  )
}
