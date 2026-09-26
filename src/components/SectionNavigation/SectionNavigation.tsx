import React, { useState, useEffect } from 'react'

export interface SectionItem {
  id: string
  number: string
  label: string
}

const SECTIONS: SectionItem[] = [
  { id: 'hero', number: '01', label: 'EXHIBITION OPENING' },
  { id: 'archive-overview', number: '02', label: 'COLLECTIONS & MANUSCRIPTS' },
  { id: 'civilizations', number: '03', label: 'CIVILIZATIONS & KNOWLEDGE' },
  { id: 'stories', number: '04', label: 'ORAL HISTORIES & PHILOSOPHY' },
]

export const SectionNavigation: React.FC = () => {
  const [activeSection, setActiveSection] = useState('hero')

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200
      for (const section of SECTIONS) {
        const element = document.getElementById(section.id)
        if (element) {
          const top = element.offsetTop
          const height = element.offsetHeight
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <aside
      aria-label="Section position indicator"
      className="hidden xl:flex fixed left-8 top-1/2 -translate-y-1/2 z-40 flex-col items-start space-y-6 pointer-events-auto"
    >
      {/* Vertical Indicator Line */}
      <div className="relative flex flex-col space-y-5">
        {SECTIONS.map((section) => {
          const isActive = activeSection === section.id
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="group flex items-center space-x-3 text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-bronze-400 p-1"
              aria-current={isActive ? 'location' : undefined}
            >
              {/* Number Badge */}
              <span
                className={`font-mono text-2xs transition-all duration-300 ${
                  isActive
                    ? 'text-bronze-400 font-bold tracking-wider scale-110'
                    : 'text-ivory-500 opacity-60 group-hover:opacity-100 group-hover:text-ivory-200'
                }`}
              >
                {section.number}
              </span>

              {/* Active Dot / Dash */}
              <span
                className={`h-px transition-all duration-300 ${
                  isActive
                    ? 'w-8 bg-bronze-400'
                    : 'w-3 bg-ivory-500/30 group-hover:w-5 group-hover:bg-ivory-300'
                }`}
              />

              {/* Label tooltip on hover */}
              <span
                className={`font-mono text-[10px] tracking-widest uppercase transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${
                  isActive ? 'text-bronze-300 opacity-80' : 'text-ivory-400'
                }`}
              >
                {section.label}
              </span>
            </a>
          )
        })}
      </div>
    </aside>
  )
}
