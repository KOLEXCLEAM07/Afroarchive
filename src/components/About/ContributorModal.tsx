import React, { useState, useEffect } from 'react'
import { X, Send, BookOpen, ShieldCheck, User, Building, FileText, CheckCircle2 } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

export interface ContributorModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ContributorModal: React.FC<ContributorModalProps> = ({ isOpen, onClose }) => {
  const [contributorName, setContributorName] = useState('')
  const [institution, setInstitution] = useState('')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('manuscripts')
  const [region, setRegion] = useState('west')
  const [abstract, setAbstract] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      onClose()
    }, 2000)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Scholar Contributor Submission"
      className="fixed inset-0 z-50 bg-charcoal-950/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 md:p-10 animate-fade-in"
    >
      <div className="relative w-full max-w-2xl bg-charcoal-900 border border-ivory-100/15 rounded-lg shadow-museum overflow-hidden p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-ivory-100/10 pb-4">
          <div>
            <span className="font-mono text-2xs uppercase tracking-widest text-bronze-400">
              SCHOLARIAL SUBMISSION PORTAL
            </span>
            <h3 className="font-display font-bold text-xl sm:text-2xl text-ivory-100 mt-0.5">
              Submit Archival Proposal
            </h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label="Close modal"
            className="p-1.5 text-ivory-400 hover:text-bronze-300 rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-bronze-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-12 space-y-4">
            <CheckCircle2 className="w-12 h-12 text-bronze-400 mx-auto animate-bounce" />
            <h4 className="font-display font-bold text-xl text-ivory-100">Proposal Submitted to Curatorial Board</h4>
            <p className="font-sans text-xs text-ivory-300 max-w-md mx-auto">
              Thank you for contributing to AfroArchive. Our academic review board will cross-reference your primary sources within 5 business days.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-2xs uppercase tracking-wider text-ivory-300 mb-1.5">
                  Contributor Name / Title
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={contributorName}
                    onChange={(e) => setContributorName(e.target.value)}
                    placeholder="Dr. Amara Nkosi / Griot Djeli"
                    className="w-full bg-charcoal-950 text-ivory-100 font-sans text-xs px-4 py-3 pl-10 rounded border border-ivory-100/15 focus:border-bronze-400 focus:outline-none"
                  />
                  <User className="w-4 h-4 text-ivory-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block font-mono text-2xs uppercase tracking-wider text-ivory-300 mb-1.5">
                  Institution / Heritage Lineage
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="University of Ibadan / Ahmed Baba Inst."
                    className="w-full bg-charcoal-950 text-ivory-100 font-sans text-xs px-4 py-3 pl-10 rounded border border-ivory-100/15 focus:border-bronze-400 focus:outline-none"
                  />
                  <Building className="w-4 h-4 text-ivory-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-mono text-2xs uppercase tracking-wider text-ivory-300 mb-1.5">
                  Proposal Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Ge’ez Astronomy Codex of Axum"
                  className="w-full bg-charcoal-950 text-ivory-100 font-sans text-xs px-4 py-3 rounded border border-ivory-100/15 focus:border-bronze-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-2xs uppercase tracking-wider text-ivory-300 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-charcoal-950 text-ivory-100 font-sans text-xs px-3 py-3 rounded border border-ivory-100/15 focus:border-bronze-400 focus:outline-none"
                >
                  <option value="manuscripts">Manuscripts</option>
                  <option value="civilizations">Civilizations</option>
                  <option value="science">Science</option>
                  <option value="architecture">Architecture</option>
                  <option value="philosophy">Philosophy</option>
                  <option value="arts">Arts</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-mono text-2xs uppercase tracking-wider text-ivory-300 mb-1.5">
                Archival Abstract & Primary Sources
              </label>
              <textarea
                rows={4}
                required
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                placeholder="Provide a concise summary of the manuscript folio, oral lineage, or artifact along with primary archival citations..."
                className="w-full bg-charcoal-950 text-ivory-100 font-sans text-xs p-4 rounded border border-ivory-100/15 focus:border-bronze-400 focus:outline-none leading-relaxed"
              />
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-ivory-100/10">
              <span className="font-mono text-[10px] text-ivory-400 uppercase">
                PEER-VERIFIED OPEN ACCESS
              </span>
              <Button type="submit" variant="primary" size="md">
                SUBMIT FOR REVIEW
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
