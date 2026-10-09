import React, { useState } from 'react'
import { BookOpen, Globe, Layers, FileText } from 'lucide-react'
import { ContributorModal } from './ContributorModal'

export const AboutSection: React.FC = () => {
  const [contributorModalOpen, setContributorModalOpen] = useState(false)

  const pillars = [
    {
      title: 'Oral & Written Traditions',
      icon: BookOpen,
      desc: 'Oral epics, proverbs and griot traditions sit alongside manuscripts and inscriptions as sources worth reading closely.',
    },
    {
      title: 'Sources Shown',
      icon: FileText,
      desc: 'Every gallery entry lists the books, articles or collections it draws on, so you can follow up and check.',
    },
    {
      title: 'Organised by Place & Theme',
      icon: Layers,
      desc: 'Entries are grouped by region, period and subject to make connections across the continent easier to see.',
    },
    {
      title: 'Free to Read',
      icon: Globe,
      desc: 'Everything in the museum can be read without an account or a paywall.',
    },
  ]

  const howItWorks = [
    {
      step: '01',
      title: 'Open collections',
      detail: 'Archive records come from open collections such as Wikimedia Commons, Wikidata, OpenAlex, Zenodo, openAFRICA and Masakhane, and keep their original licence and attribution.',
    },
    {
      step: '02',
      title: 'Cited essays',
      detail: 'The gallery essays summarise published scholarship and list their references.',
    },
    {
      step: '03',
      title: 'Member articles',
      detail: 'Members can write articles with references. An article becomes public when its author publishes it.',
    },
    {
      step: '04',
      title: 'Corrections',
      detail: 'Mistakes happen. If you spot one, report it and the entry will be checked and corrected.',
    },
  ]

  return (
    <section
      id="about"
      aria-label="About AfroArchive"
      className="py-12 md:py-16 bg-dark-surface border-t border-white/10 text-ivory-100 overflow-hidden"
    >
      <div className="container-app space-y-12">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="eyebrow">About the museum</span>
              <span className="text-xs text-ivory-400">
                Preserve · Discover · Empower
              </span>
            </div>

            <h2 className="heading-xl text-white">
              Africa’s knowledge, preserved for the future
            </h2>

            <p className="text-base md:text-lg text-ivory-300 leading-relaxed">
              AfroArchive is a free digital museum and archive for African history, philosophy, science, architecture and literature. It is a growing collection, and it does not cover everything.
            </p>
          </div>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((p) => {
            const IconComp = p.icon
            return (
              <div key={p.title} className="card rounded-2xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-accent-400/10 border border-accent-400/25 flex items-center justify-center text-accent-300">
                  <IconComp className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="font-serif font-bold text-xl text-white">{p.title}</h3>
                <p className="text-sm text-ivory-400 leading-relaxed">{p.desc}</p>
              </div>
            )
          })}
        </div>

        {/* How the archive works */}
        <div className="card rounded-2xl p-6 md:p-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-6 gap-4">
            <div className="space-y-1">
              <span className="eyebrow">
                How it works
              </span>
              <h3 className="heading-lg text-white">
                Where the content comes from
              </h3>
            </div>
            
            <button
              onClick={() => setContributorModalOpen(true)}
              type="button"
              className="btn btn-primary btn-md"
            >
              Contribute
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item) => (
              <div key={item.step} className="p-5 rounded-2xl bg-dark-surface border border-white/10 space-y-2">
                <span className="text-sm font-semibold text-accent-300">{item.step}</span>
                <h4 className="font-serif text-lg font-bold text-white">{item.title}</h4>
                <p className="text-sm text-ivory-400 leading-relaxed">{item.detail}</p>
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
