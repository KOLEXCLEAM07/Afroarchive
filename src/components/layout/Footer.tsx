import React, { useState } from 'react'
import {
  BookOpen,
  Globe,
  ExternalLink,
  Share2,
  Video,
  Mail,
  ArrowRight,
  Keyboard,
  Shield,
  Users,
  ChevronUp,
} from 'lucide-react'

interface FooterProps {
  onKeyboardShortcutsClick?: () => void
}

const EXHIBITION_SECTIONS = [
  { label: 'Archive Explorer', href: '#archive', code: '02' },
  { label: 'Civilizations Timeline', href: '#timeline', code: '03' },
  { label: 'Interactive Map', href: '#map', code: '04' },
  { label: 'Stories & Philosophies', href: '#stories', code: '05' },
  { label: 'AI Curator', href: '#ai', code: '06' },
  { label: 'About & Mission', href: '#about', code: '07' },
]

const KNOWLEDGE_DOMAINS = [
  { label: 'African Philosophy', href: '#stories' },
  { label: 'Ancient Civilizations', href: '#archive' },
  { label: 'Oral Traditions', href: '#stories' },
  { label: 'Science & Astronomy', href: '#archive' },
  { label: 'Languages & Scripts', href: '#archive' },
  { label: 'Traditional Knowledge', href: '#stories' },
]

const HERITAGE_REGIONS = [
  { label: 'Nile Valley Civilizations', href: '#map' },
  { label: 'Sahelian Empires', href: '#map' },
  { label: 'Horn of Africa', href: '#map' },
  { label: 'Swahili Coast', href: '#map' },
  { label: 'Great Lakes Region', href: '#map' },
  { label: 'Southern Africa Kingdoms', href: '#map' },
]

const SOCIAL_LINKS = [
  { icon: Share2, label: 'Share AfroArchive', href: '#' },
  { icon: Video, label: 'Watch on YouTube', href: '#' },
  { icon: Globe, label: 'Visit our Global Network', href: '#' },
  { icon: ExternalLink, label: 'External Links & Partners', href: '#' },
]

export const Footer: React.FC<FooterProps> = ({ onKeyboardShortcutsClick }) => {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [emailError, setEmailError] = useState('')

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address.')
      return
    }
    setEmailError('')
    setSubscribed(true)
    setEmail('')
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer
      id="footer"
      aria-label="AfroArchive Exhibition Footer"
      className="relative bg-charcoal-950 border-t border-ivory-100/8 overflow-hidden"
    >
      {/* Subtle noise/texture overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />

      {/* Newsletter Band */}
      <div className="relative border-b border-ivory-100/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-14 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-bronze-400 mb-3">
                Archival Dispatches
              </p>
              <h2 className="font-display text-2xl md:text-3xl lg:text-4xl text-ivory-100 leading-tight mb-3">
                Receive New Heritage Discoveries
              </h2>
              <p className="font-sans text-sm text-ivory-400 leading-relaxed max-w-md">
                Join scholars, educators, and heritage enthusiasts who receive curated updates on new
                manuscript folios, civilizational records, and oral traditions added to the archive.
              </p>
            </div>

            <div>
              {subscribed ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex items-center space-x-3 p-5 bg-bronze-400/10 border border-bronze-400/30 rounded-sm"
                >
                  <div className="w-8 h-8 rounded-full bg-bronze-400/20 border border-bronze-400/60 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-bronze-400" />
                  </div>
                  <div>
                    <p className="font-sans font-semibold text-ivory-100 text-sm">
                      You're now part of the archive.
                    </p>
                    <p className="font-mono text-[10px] text-bronze-400 tracking-wider mt-0.5">
                      DISPATCHES WILL ARRIVE WHEN NEW HERITAGE ITEMS ARE ADDED.
                    </p>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleNewsletterSubmit}
                  noValidate
                  aria-label="Newsletter subscription form"
                >
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <label htmlFor="newsletter-email" className="sr-only">
                        Email Address
                      </label>
                      <input
                        id="newsletter-email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          if (emailError) setEmailError('')
                        }}
                        placeholder="your@email.com"
                        autoComplete="email"
                        aria-describedby={emailError ? 'newsletter-error' : undefined}
                        aria-invalid={!!emailError}
                        className={`w-full bg-charcoal-900/60 border ${
                          emailError ? 'border-red-400/60' : 'border-ivory-100/15'
                        } hover:border-bronze-400/40 focus:border-bronze-400 text-ivory-100 placeholder:text-ivory-500 font-sans text-sm px-4 py-3 rounded-sm outline-none transition-colors duration-200 focus:ring-1 focus:ring-bronze-400/30`}
                      />
                      {emailError && (
                        <p
                          id="newsletter-error"
                          role="alert"
                          className="mt-1.5 font-mono text-[10px] text-red-400"
                        >
                          {emailError}
                        </p>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center space-x-2 bg-bronze-400 hover:bg-bronze-300 text-charcoal-950 font-sans font-semibold text-xs uppercase tracking-widest px-6 py-3 rounded-sm transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-bronze-300 whitespace-nowrap"
                    >
                      <span>Subscribe</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="mt-2.5 font-mono text-[10px] text-ivory-500 tracking-wider">
                    No spam. Unsubscribe at any time. Heritage dispatches only.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Grid */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-16 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">

          {/* Brand Column */}
          <div className="lg:col-span-2 sm:col-span-2">
            <a
              href="#"
              className="group inline-flex items-center space-x-3 mb-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-bronze-400 rounded-sm p-1"
              aria-label="AFROARCHIVE — Back to top"
            >
              <div className="w-10 h-10 rounded-sm bg-bronze-400/10 border border-bronze-400/40 flex items-center justify-center transition-colors duration-300 group-hover:border-bronze-400">
                <span className="font-display font-bold text-bronze-400 text-base">A</span>
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-xl tracking-widest text-ivory-100 group-hover:text-bronze-300 transition-colors duration-300">
                  AFROARCHIVE
                </span>
                <span className="font-mono text-[9px] tracking-[0.25em] text-bronze-400/80 -mt-0.5">
                  DIGITAL MUSEUM & LIVING ARCHIVE
                </span>
              </div>
            </a>

            <p className="font-sans text-sm text-ivory-400 leading-relaxed mb-6 max-w-sm">
              A digital museum and interactive archive for African knowledge — preserving history,
              philosophy, culture, science, innovation, civilizations, languages, literature, art,
              people, places, and traditional wisdom for generations to come.
            </p>

            <p className="font-display italic text-bronze-400/90 text-base mb-8 tracking-wide">
              "Preserve. Discover. Empower."
            </p>

            {/* Trust Badges */}
            <div className="flex flex-col space-y-2.5 mb-8">
              <div className="inline-flex items-center space-x-2">
                <Shield className="w-3.5 h-3.5 text-bronze-400/70" />
                <span className="font-mono text-[10px] text-ivory-500 tracking-wider uppercase">
                  Peer-Verified Archival Methodology
                </span>
              </div>
              <div className="inline-flex items-center space-x-2">
                <Users className="w-3.5 h-3.5 text-bronze-400/70" />
                <span className="font-mono text-[10px] text-ivory-500 tracking-wider uppercase">
                  Open Heritage — Accessible to All
                </span>
              </div>
              <div className="inline-flex items-center space-x-2">
                <BookOpen className="w-3.5 h-3.5 text-bronze-400/70" />
                <span className="font-mono text-[10px] text-ivory-500 tracking-wider uppercase">
                  Primary Sources Cited & Attributed
                </span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-3" role="list" aria-label="Social media links">
              {SOCIAL_LINKS.map((social) => {
                const IconComp = social.icon
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    role="listitem"
                    className="w-9 h-9 rounded-sm bg-charcoal-900 border border-ivory-100/10 hover:border-bronze-400/40 flex items-center justify-center text-ivory-500 hover:text-bronze-400 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-bronze-400"
                  >
                    <IconComp className="w-4 h-4" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Exhibition Sections */}
          <div>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-bronze-400 mb-5">
              Exhibition Galleries
            </h3>
            <ul className="space-y-3" role="list">
              {EXHIBITION_SECTIONS.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="group flex items-center space-x-2.5 font-sans text-sm text-ivory-400 hover:text-ivory-100 transition-colors duration-200 focus:outline-none focus-visible:text-bronze-300"
                  >
                    <span className="font-mono text-[9px] text-bronze-400/50 group-hover:text-bronze-400 transition-colors">
                      {item.code}
                    </span>
                    <span className="group-hover:translate-x-1 transition-transform duration-200">
                      {item.label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Knowledge Domains */}
          <div>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-bronze-400 mb-5">
              Knowledge Domains
            </h3>
            <ul className="space-y-3" role="list">
              {KNOWLEDGE_DOMAINS.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="font-sans text-sm text-ivory-400 hover:text-ivory-100 hover:translate-x-1 inline-block transition-all duration-200 focus:outline-none focus-visible:text-bronze-300"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Heritage Regions */}
          <div>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-bronze-400 mb-5">
              Heritage Regions
            </h3>
            <ul className="space-y-3" role="list">
              {HERITAGE_REGIONS.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="font-sans text-sm text-ivory-400 hover:text-ivory-100 hover:translate-x-1 inline-block transition-all duration-200 focus:outline-none focus-visible:text-bronze-300"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative border-t border-ivory-100/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">

            {/* Left — Legal */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-2">
              <p className="font-mono text-[10px] text-ivory-500 tracking-wider">
                © {new Date().getFullYear()} AFROARCHIVE. All rights reserved.
              </p>
              <span className="hidden md:inline text-ivory-700" aria-hidden="true">·</span>
              <a
                href="#"
                className="font-mono text-[10px] text-ivory-500 hover:text-ivory-300 tracking-wider transition-colors focus:outline-none focus-visible:text-bronze-400 uppercase"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="font-mono text-[10px] text-ivory-500 hover:text-ivory-300 tracking-wider transition-colors focus:outline-none focus-visible:text-bronze-400 uppercase"
              >
                Open Heritage Terms
              </a>
              <a
                href="#"
                className="font-mono text-[10px] text-ivory-500 hover:text-ivory-300 tracking-wider transition-colors focus:outline-none focus-visible:text-bronze-400 uppercase"
              >
                Attribution Guide
              </a>
            </div>

            {/* Right — Keyboard & Back to Top */}
            <div className="flex items-center space-x-4">
              {onKeyboardShortcutsClick && (
                <button
                  type="button"
                  onClick={onKeyboardShortcutsClick}
                  className="inline-flex items-center space-x-1.5 font-mono text-[10px] text-ivory-500 hover:text-bronze-400 tracking-wider uppercase transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-bronze-400 rounded-sm px-1"
                  aria-label="View keyboard shortcuts"
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  <span>Keyboard Shortcuts</span>
                </button>
              )}

              <button
                type="button"
                onClick={scrollToTop}
                className="inline-flex items-center space-x-1.5 font-mono text-[10px] text-ivory-500 hover:text-bronze-400 tracking-wider uppercase transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-bronze-400 rounded-sm px-1"
                aria-label="Scroll back to top of page"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Back to Top</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
