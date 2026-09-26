import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Search, Menu, X, Sun, Moon, Bell, BookOpen,
  User, LogOut, Settings, ChevronDown, Feather, Shield,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { cn, getAvatarFallback, getAvatarColor } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { Notification } from '@/types'

const NAV_LINKS = [
  { to: '/',            label: 'Home'        },
  { to: '/discover',    label: 'Explore'     },
  { to: '/collections', label: 'Collections' },
  { to: '/about',       label: 'About'       },
]

export default function Navbar() {
  const { user, profile, signOut, isAdmin } = useAuth()
  const { isDark, toggleTheme }              = useTheme()
  const navigate                             = useNavigate()
  const location                             = useLocation()

  const [menuOpen,      setMenuOpen]      = useState(false)
  const [profileOpen,   setProfileOpen]   = useState(false)
  const [searchOpen,    setSearchOpen]    = useState(false)
  const [searchQuery,   setSearchQuery]   = useState('')
  const [scrolled,      setScrolled]      = useState(false)
  const [unreadCount,   setUnreadCount]   = useState(0)

  const searchRef  = useRef<HTMLInputElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); setSearchOpen(false) }, [location.pathname])

  // Scroll listener for nav shadow
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Close modals & menu on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        setSearchOpen(false)
        setProfileOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50)
  }, [searchOpen])

  // Click outside to close profile dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Fetch unread notification count
  useEffect(() => {
    if (!user) return
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
      .then(({ count }) => setUnreadCount(count ?? 0))
  }, [user])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/discover?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  const handleSignOut = async () => {
    setProfileOpen(false)
    await signOut()
    navigate('/')
  }

  const isHome = location.pathname === '/'

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled || !isHome || menuOpen
            ? 'glass shadow-sm'
            : 'bg-transparent'
        )}
      >
        <div className="container-app">
          <div className="flex items-center justify-between h-16 md:h-18">

            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2.5 group flex-shrink-0"
              aria-label="AfroArchive Home"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow group-hover:shadow-accent-glow transition-shadow duration-300">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className={cn(
                'font-serif font-bold text-xl tracking-tight transition-colors duration-300',
                scrolled || !isHome ? 'text-gray-900 dark:text-white' : 'text-white'
              )}>
                Afro<span className="text-gradient-gold">Archive</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) => cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10'
                      : scrolled || !isHome
                        ? 'text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-dark-card'
                        : 'text-white/90 hover:text-white hover:bg-white/10'
                  )}
                >
                  {label}
                </NavLink>
              ))}

              <Link
                to="/museum"
                className="ml-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase text-amber-300 bg-amber-500/15 border border-amber-500/35 hover:bg-amber-500/25 hover:border-amber-400 shadow-sm transition-all group"
                id="navbar-virtual-museum-btn"
                title="Enter 8-Stage Interactive Digital Museum"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse group-hover:scale-125 transition-transform" />
                <span>🏛️ Virtual Museum</span>
              </Link>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">

              {/* Search Button */}
              <button
                id="navbar-search-btn"
                onClick={() => setSearchOpen(true)}
                className={cn(
                  'p-2 rounded-xl transition-all duration-150',
                  scrolled || !isHome
                    ? 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-card'
                    : 'text-white/90 hover:bg-white/10'
                )}
                aria-label="Open search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Theme Toggle */}
              <button
                id="navbar-theme-btn"
                onClick={toggleTheme}
                className={cn(
                  'p-2 rounded-xl transition-all duration-150',
                  scrolled || !isHome
                    ? 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-card'
                    : 'text-white/90 hover:bg-white/10'
                )}
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {user ? (
                <>
                  {/* Write Button */}
                  <Link
                    to="/write"
                    className="hidden sm:flex btn btn-primary btn-sm gap-1.5"
                    id="navbar-write-btn"
                  >
                    <Feather className="w-3.5 h-3.5" />
                    Write
                  </Link>

                  {/* Notifications */}
                  <Link
                    to="/notifications"
                    className="relative p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-card transition-all"
                    aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="notification-dot" aria-hidden="true">
                        {unreadCount > 9 ? '' : ''}
                      </span>
                    )}
                  </Link>

                  {/* Profile Dropdown */}
                  <div className="relative" ref={profileRef}>
                    <button
                      id="navbar-profile-btn"
                      onClick={() => setProfileOpen(p => !p)}
                      className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-card transition-all"
                      aria-expanded={profileOpen}
                      aria-label="Profile menu"
                    >
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={profile.full_name || profile.username}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                      ) : (
                        <div className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold',
                          getAvatarColor(profile?.username || user.id)
                        )}>
                          {getAvatarFallback(profile?.full_name || profile?.username)}
                        </div>
                      )}
                      <ChevronDown className={cn('w-4 h-4 text-gray-500 transition-transform duration-200', profileOpen && 'rotate-180')} />
                    </button>

                    {profileOpen && (
                      <div className="absolute right-0 top-full mt-2 w-56 card py-1 animate-scale-in z-50">
                        <div className="px-3 py-2 border-b border-sand-200 dark:border-dark-border">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {profile?.full_name || 'Welcome'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            @{profile?.username || user.email}
                          </p>
                        </div>
                        <ProfileMenuItem to={`/profile/${profile?.username}`} icon={<User className="w-4 h-4" />} label="My Profile" onClick={() => setProfileOpen(false)} />
                        <ProfileMenuItem to="/write"    icon={<Feather className="w-4 h-4" />} label="Write Article" onClick={() => setProfileOpen(false)} />
                        <ProfileMenuItem to="/settings" icon={<Settings className="w-4 h-4" />} label="Settings"      onClick={() => setProfileOpen(false)} />
                        {isAdmin && (
                          <ProfileMenuItem to="/admin" icon={<Shield className="w-4 h-4" />} label="Admin Panel" onClick={() => setProfileOpen(false)} />
                        )}
                        <div className="border-t border-sand-200 dark:border-dark-border mt-1 pt-1">
                          <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg mx-1 transition-colors"
                            id="navbar-signout-btn"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    to="/auth/login"
                    className={cn(
                      'btn btn-sm px-4',
                      scrolled || !isHome
                        ? 'btn-ghost'
                        : 'text-white hover:bg-white/10 rounded-xl px-4 py-2 text-sm font-medium transition-all'
                    )}
                    id="navbar-login-btn"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/auth/signup"
                    className="btn btn-primary btn-sm"
                    id="navbar-signup-btn"
                  >
                    Get Started
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                id="navbar-mobile-menu-btn"
                onClick={() => setMenuOpen(m => !m)}
                className="md:hidden p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-card transition-all"
                aria-label="Toggle mobile menu"
                aria-expanded={menuOpen}
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-sand-50/98 dark:bg-charcoal-950/98 backdrop-blur-xl border-t border-b border-sand-200 dark:border-ivory-100/10 shadow-2xl animate-slide-down relative z-50">
            <div className="container-app py-4 space-y-1.5">
              {/* Virtual Museum Feature Link */}
              <Link
                to="/museum"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 transition-all mb-2"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>🏛️ Enter Virtual Museum Tour</span>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-amber-400 font-mono">8 STAGES →</span>
              </Link>
              {NAV_LINKS.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => cn(
                    'block px-4 py-3 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-card'
                  )}
                >
                  {label}
                </NavLink>
              ))}
              {!user ? (
                <div className="flex gap-3 pt-3 border-t border-sand-200 dark:border-dark-border">
                  <Link
                    to="/auth/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 btn btn-outline btn-md text-center"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/auth/signup"
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 btn btn-primary btn-md text-center"
                  >
                    Sign Up
                  </Link>
                </div>
              ) : (
                <div className="pt-3 border-t border-sand-200 dark:border-dark-border space-y-1.5">
                  <Link
                    to="/write"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-card flex items-center gap-2"
                  >
                    <Feather className="w-4 h-4" /> Write Article
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      handleSignOut()
                    }}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Menu Backdrop */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden animate-fade-in"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Search Modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-20 px-4 animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) setSearchOpen(false) }}
        >
          <div className="w-full max-w-2xl card p-4 animate-scale-in">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  ref={searchRef}
                  id="navbar-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search articles, collections, authors…"
                  className="input-lg pl-11"
                />
              </div>
              <button type="submit" className="btn btn-primary btn-lg">Search</button>
              <button type="button" onClick={() => setSearchOpen(false)} className="btn btn-ghost btn-lg p-3">
                <X className="w-5 h-5" />
              </button>
            </form>
            <div className="mt-3 flex flex-wrap gap-2">
              {['African Philosophy', 'Great Zimbabwe', 'Timbuktu', 'Yoruba Culture', 'Nubian Kingdoms'].map(q => (
                <button
                  key={q}
                  onClick={() => { setSearchQuery(q); setTimeout(() => searchRef.current?.form?.requestSubmit(), 50) }}
                  className="badge badge-gray hover:badge-primary cursor-pointer transition-colors text-xs"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ProfileMenuItem({
  to, icon, label, onClick,
}: {
  to: string; icon: React.ReactNode; label: string; onClick: () => void
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-card rounded-lg mx-1 transition-colors"
    >
      {icon}
      {label}
    </Link>
  )
}
