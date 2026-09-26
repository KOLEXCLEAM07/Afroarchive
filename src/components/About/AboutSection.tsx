import React, { useState } from 'react'
import { ShieldCheck, BookOpen, Globe, Award, Layers, Users, ArrowRight, Sparkles, FileText } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { ContributorModal } from './ContributorModal'

export const AboutSection: React.FC = () => {
  const [contributorModalOpen, setContributorModalOpen] = useState(false)

  const pillars = [
    {
      title: 'Oral & Written Parity',
      icon: BookOpen,
      desc: 'Treating oral epics, Griot lineages, and Saharan manuscripts as equal primary sources of civilizational truth.',
    },
    {
      title: 'Primary Source Rigor',
      icon: ShieldCheck,
      desc: 'Every catalog entry is authenticated with verified archival citations, radiocarbon dates, and peer references.',
    },
    {
      title: 'Decolonized Taxonomy',
      icon: Layers,
      desc: 'Structuring African knowledge around indigenous cosmological, mathematical, and philosophical categories.',
    },
    {
      title: 'Global Open Access',
      icon: Globe,
      desc: 'Ensuring universal free access for scholars, students, and descendants across the globe without paywalls.',
    },
  ]

  const verificationTiers = [
    { step: '01', title: 'Primary Source Audit', detail: 'Physical manuscript or archaeological record verification.' },
    { step: '02', title: 'Lineage Authentication', detail: 'Oral tradition cross-referencing with recognized elders & Jelis.' },
    { step: '03', title: 'Carbon & Geographic Mapping', detail: 'Radiocarbon dating & GIS cartographic coordinate mapping.' },
    { step: '04', title: 'Open Access Indexing', detail: 'Permanent open-access digital archival publishing.' },
  ]

  return (
    <section
      id="about"
      aria-label="About AfroArchive and Mission"
      className="relative w-full bg-charcoal-900 text-ivory-100 py-24 border-t border-ivory-100/10 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-16">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-ivory-100/10 pb-8">
          <div className="space-y-4 max-w-3xl">
            <div className="flex items-center space-x-3">
              <Badge variant="bronze" size="sm">
                EXHIBITION GALLERY 06
              </Badge>
              <span className="font-mono text-2xs uppercase tracking-widest text-ivory-400">
                DIGITAL MUSEUM MANIFESTO
              </span>
            </div>

            <h2 className="font-display font-semibold text-3xl md:text-5xl text-ivory-100 tracking-tight">
              AFRICA’S KNOWLEDGE, PRESERVED FOR THE FUTURE.
            </h2>

            <p className="font-sans text-base md:text-lg text-ivory-300 font-light leading-relaxed">
              AfroArchive was built to serve as an interactive digital museum and open-access archive for African history, philosophy, science, architecture, literature, and indigenous wisdom.
            </p>
          </div>

          <div className="font-mono text-2xs text-bronze-400 uppercase tracking-widest">
            TAGLINE: PRESERVE. DISCOVER. EMPOWER.
          </div>
        </div>

        {/* 4 Foundational Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((p) => {
            const IconComp = p.icon
            return (
              <div key={p.title} className="p-6 rounded-lg bg-charcoal-850 border border-ivory-100/10 hover:border-bronze-400/50 transition-colors space-y-3 shadow-museum">
                <div className="w-10 h-10 rounded bg-bronze-900/40 border border-bronze-400/30 flex items-center justify-center text-bronze-300">
                  <IconComp className="w-5 h-5" />
                </div>
                <h3 className="font-display font-semibold text-lg text-ivory-100">{p.title}</h3>
                <p className="font-sans text-xs text-ivory-300 font-light leading-relaxed">{p.desc}</p>
              </div>
            )
          })}
        </div>

        {/* Peer-Verification Methodology Panel */}
        <div className="bg-charcoal-850 rounded-lg border border-ivory-100/10 p-8 md:p-12 space-y-8 shadow-artifact">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-ivory-100/10 pb-6 gap-4">
            <div className="space-y-1">
              <span className="font-mono text-2xs uppercase tracking-widest text-bronze-400">
                CURATORIAL STANDARD
              </span>
              <h3 className="font-display font-semibold text-2xl text-ivory-100">
                4-Tier Peer-Verification Protocol
              </h3>
            </div>
            
            <Button
              variant="primary"
              size="md"
              onClick={() => setContributorModalOpen(true)}
            >
              SUBMIT HERITAGE PROPOSAL
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {verificationTiers.map((tier) => (
              <div key={tier.step} className="p-5 rounded bg-charcoal-900 border border-ivory-100/5 space-y-2">
                <span className="font-mono text-xs font-bold text-bronze-400">{tier.step}.</span>
                <h4 className="font-display text-sm font-semibold text-ivory-100">{tier.title}</h4>
                <p className="font-sans text-xs text-ivory-400 font-light leading-relaxed">{tier.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ContributorModal
        isOpen={contributorModalOpen}
        onClose={() => setContributorModalOpen(false)}
      />
    </section>
  )
}
