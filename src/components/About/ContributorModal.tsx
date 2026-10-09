import React from 'react'
import { Link } from 'react-router-dom'
import { X, Feather, UserPlus, FileText, BookOpen } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useModalStack } from '../../hooks/useScrollLock'

export interface ContributorModalProps {
  isOpen: boolean
  onClose: () => void
}

const linkButtonClass = 'btn btn-primary btn-md gap-2'

export const ContributorModal: React.FC<ContributorModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth()
  const panelRef = useModalStack<HTMLDivElement>(isOpen, onClose)

  if (!isOpen) return null

  const steps = [
    {
      icon: UserPlus,
      title: 'Create a free account',
      detail: 'Members can write and publish articles on AfroArchive.',
    },
    {
      icon: Feather,
      title: 'Write your article',
      detail: 'Explain your subject clearly and in your own words.',
    },
    {
      icon: FileText,
      title: 'Cite your sources',
      detail: 'List the books, articles, archives or recordings you relied on so readers can check them.',
    },
    {
      icon: BookOpen,
      title: 'Publish',
      detail: 'Your article becomes public once you publish it.',
    },
  ]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="contributor-modal-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 md:p-10 animate-fade-in"
    >
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} aria-hidden="true" />

      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative w-full max-w-2xl bg-dark-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto outline-none"
      >
        
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <div>
            <span className="eyebrow">
              Contribute
            </span>
            <h3 id="contributor-modal-title" className="heading-md text-white mt-1">
              Share what you know
            </h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label="Close"
            className="p-2 rounded-lg text-ivory-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <p className="text-sm text-ivory-300 leading-relaxed">
          Anyone with an account can contribute to AfroArchive by writing an article with references.
        </p>

        <ol className="space-y-3">
          {steps.map((step, idx) => {
            const Icon = step.icon
            return (
              <li key={step.title} className="flex items-start gap-4 p-4 rounded-xl bg-dark-card border border-white/10">
                <span className="text-sm font-semibold text-accent-300 mt-0.5">0{idx + 1}</span>
                <Icon className="w-4 h-4 text-accent-400 mt-1 flex-shrink-0" aria-hidden="true" />
                <div className="space-y-0.5">
                  <h4 className="font-serif font-bold text-lg text-white">{step.title}</h4>
                  <p className="text-sm text-ivory-400 leading-relaxed">{step.detail}</p>
                </div>
              </li>
            )
          })}
        </ol>

        <div className="pt-4 flex flex-col sm:flex-row sm:justify-end gap-3 border-t border-white/10">
          {user ? (
            <Link to="/write" onClick={onClose} className={linkButtonClass}>
              Write an article
            </Link>
          ) : (
            <Link to="/auth/signup" onClick={onClose} className={linkButtonClass}>
              Create an account
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
