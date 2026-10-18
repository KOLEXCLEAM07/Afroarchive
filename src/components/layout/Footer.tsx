import React from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Feather, Scale, Unlock, ChevronUp, ArrowRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const MUSEUM_GALLERIES = [
  { label: 'Collections', to: '/museum?tab=collections' },
  { label: 'Civilizations timeline', to: '/museum?tab=timeline' },
  { label: 'Regional map', to: '/museum?tab=map' },
  { label: 'Stories & proverbs', to: '/museum?tab=stories' },
  { label: 'Ask the curator', to: '/museum?tab=ai' },
]

const TOPICS = [
  { label: 'Philosophy & Thought', to: '/discover?category=philosophy' },
  { label: 'History & Civilizations', to: '/discover?category=history' },
  { label: 'Science & Innovation', to: '/discover?category=science' },
  { label: 'Languages & Scripts', to: '/discover?category=languages' },
  { label: 'Art & Culture', to: '/discover?category=art-culture' },
  { label: 'Archive records', to: '/discover?type=records' },
]

const REFERENCE = [
  { label: 'People & places', to: '/explore' },
  { label: 'Atlas', to: '/atlas' },
  { label: 'Glossary', to: '/glossary' },
]

const ABOUT_LINKS = [
  { label: 'About AfroArchive', to: '/about' },
  { label: 'Sources & licensing', to: '/about#sources' },
  { label: 'Contribution guidelines', to: '/about#guidelines' },
  { label: 'Privacy', to: '/about#privacy' },
  { label: 'Collections', to: '/collections' },
]

export const Footer: React.FC = () => {
  const { user } = useAuth()

  return (
    <footer id="footer" className="relative bg-charcoal-950 text-ivory-100 border-t border-white/10 overflow-hidden">
      <div className="relative border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-14 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="heading-lg text-white mb-3">
                Add to the archive
              </h2>
              <p className="font-sans text-sm text-ivory-400 leading-relaxed max-w-md">
                Members can publish articles on African history, language, art and thought, with references so readers can follow up.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 md:justify-end">
              <Link
                to={user ? '/write' : '/auth/signup'}
                className="btn btn-accent btn-md gap-2"
              >
                <Feather className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{user ? 'Write an article' : 'Create a free account'}</span>
              </Link>
              <Link
                to="/about#guidelines"
                className="btn btn-md gap-2 text-ivory-200 border border-white/20 hover:border-accent-400 hover:text-accent-300"
              >
                <span>How it works</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-16 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          <div className="lg:col-span-2 sm:col-span-2">
            <Link to="/" className="group mb-6 inline-block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400" aria-label="AfroArchive home">
              <img
                src="/afroarchive-logo.png"
                alt="AfroArchive — Preserve. Discover. Empower."
                className="w-44 max-w-full transition-transform duration-200 group-hover:scale-[1.02]"
              />
            </Link>

            <p className="font-sans text-sm text-ivory-400 leading-relaxed mb-6 max-w-sm">
              An open archive of African knowledge: essays, records from open collections and a virtual museum, free for anyone to read.
            </p>

            <ul className="flex flex-col space-y-2.5">
              {[
                { icon: Scale, text: 'Records keep their original licence and attribution' },
                { icon: BookOpen, text: 'Essays list the sources they draw on' },
                { icon: Unlock, text: 'Free to read, no account needed' },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="inline-flex items-center space-x-2">
                  <Icon className="w-3.5 h-3.5 text-accent-400/80" aria-hidden="true" />
                  <span className="text-sm text-ivory-400">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <FooterColumn title="Virtual museum" links={MUSEUM_GALLERIES} />
          <div className="space-y-10">
            <FooterColumn title="Topics" links={TOPICS} />
            <FooterColumn title="Reference" links={REFERENCE} />
          </div>
          <FooterColumn title="About" links={ABOUT_LINKS} />
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ivory-500">
            © {new Date().getFullYear()} AfroArchive. Archive records remain under their original licences.
          </p>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-1.5 text-xs text-ivory-400 hover:text-accent-300 transition-colors rounded px-1"
            >
              <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Back to top</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, links }: { title: string; links: Array<{ label: string; to: string }> }) {
  return (
    <nav aria-label={title}>
      <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-400 mb-5">{title}</h3>
      <ul className="space-y-3">
        {links.map(item => (
          <li key={item.label}>
            <Link to={item.to} className="text-sm text-ivory-400 hover:text-white transition-colors">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default Footer
