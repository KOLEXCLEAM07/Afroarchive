import React, { useState, useEffect } from 'react'
import { X, User, KeyRound, ArrowRight } from 'lucide-react'

export interface SignInModalProps {
  isOpen: boolean
  onClose: () => void
}

export const SignInModal: React.FC<SignInModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sign in to AfroArchive"
      className="fixed inset-0 z-50 bg-charcoal-950/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 animate-fade-in"
    >
      <div className="relative w-full max-w-md bg-charcoal-900 border border-ivory-100/15 rounded-lg shadow-museum overflow-hidden p-6 sm:p-8 space-y-6">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-ivory-100/10 pb-4">
          <div>
            <span className="font-mono text-2xs uppercase tracking-widest text-bronze-400">
              ARCHIVE ACCESS
            </span>
            <h3 className="font-display font-bold text-xl text-ivory-100 mt-0.5">
              Sign In to AfroArchive
            </h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label="Close sign in modal"
            className="p-1.5 text-ivory-400 hover:text-bronze-300 rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-bronze-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Fields */}
        <form onSubmit={(e) => { e.preventDefault(); alert('Signed in successfully.'); onClose(); }} className="space-y-4">
          <div>
            <label className="block font-mono text-2xs uppercase tracking-wider text-ivory-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="researcher@archival.org"
                className="w-full bg-charcoal-950 text-ivory-100 font-sans text-sm px-4 py-3 pl-10 rounded border border-ivory-100/15 focus:border-bronze-400 focus:outline-none"
              />
              <User className="w-4 h-4 text-ivory-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block font-mono text-2xs uppercase tracking-wider text-ivory-300 mb-1.5">
              Passcode
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-charcoal-950 text-ivory-100 font-sans text-sm px-4 py-3 pl-10 rounded border border-ivory-100/15 focus:border-bronze-400 focus:outline-none"
              />
              <KeyRound className="w-4 h-4 text-ivory-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-bronze-400 text-charcoal-950 font-sans font-semibold text-xs uppercase tracking-widest rounded hover:bg-bronze-300 transition-colors flex items-center justify-center space-x-2"
          >
            <span>Access Member Archives</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer */}
        <div className="pt-4 border-t border-ivory-100/10 text-center font-mono text-[10px] text-ivory-400">
          <span>PRESERVE. DISCOVER. EMPOWER.</span>
        </div>
      </div>
    </div>
  )
}
