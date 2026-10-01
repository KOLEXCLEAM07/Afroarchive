import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { X, Mail, Lock, Eye, EyeOff, AlertCircle, Globe, CheckCircle2, ArrowRight } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export interface SignInModalProps {
  isOpen: boolean
  onClose: () => void
}

export const SignInModal: React.FC<SignInModalProps> = ({ isOpen, onClose }) => {
  const { signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [gLoading, setGLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
      setError(null)
      setSuccess(false)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password)
      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 1200)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setGLoading(true)
    try {
      await signInWithGoogle()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed. Please try again.')
    } finally {
      setGLoading(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sign in to AfroArchive"
      className="fixed inset-0 z-50 bg-charcoal-950/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 animate-fade-in"
    >
      <div className="relative w-full max-w-md bg-charcoal-900 border border-ivory-100/15 rounded-lg shadow-museum overflow-hidden p-6 sm:p-8 space-y-6">
        {/* Modal Header */}
        <div className="flex justify-between items-start border-b border-ivory-100/10 pb-4">
          <div>
            <span className="font-mono text-2xs uppercase tracking-widest text-bronze-400">
              ARCHIVE ACCESS
            </span>
            <h3 className="font-display font-bold text-xl text-ivory-100 mt-0.5">
              Sign In to AfroArchive
            </h3>
            <p className="font-sans text-xs text-ivory-400 mt-1">
              Connect to your researcher account and bookmarked artifacts
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label="Close sign in modal"
            className="p-1.5 text-ivory-400 hover:text-bronze-300 rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-bronze-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="flex items-center gap-3 bg-green-950/40 border border-green-500/40 text-green-300 rounded p-3 text-xs animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
            <span>Welcome back! Signed in successfully.</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-2.5 bg-red-950/40 border border-red-500/30 text-red-300 rounded p-3 text-xs animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={gLoading || loading}
          className="w-full flex items-center justify-center space-x-2.5 py-3 px-4 rounded bg-charcoal-850 hover:bg-charcoal-800 border border-ivory-100/15 hover:border-bronze-400/40 text-ivory-100 font-sans text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
        >
          <Globe className="w-4 h-4 text-bronze-400" />
          <span>{gLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-ivory-100/10" />
          <span className="font-mono text-2xs uppercase tracking-wider text-ivory-500">
            or email passcode
          </span>
          <div className="flex-1 h-px bg-ivory-100/10" />
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full bg-charcoal-950 text-ivory-100 font-sans text-xs px-4 py-3 pl-10 rounded border border-ivory-100/15 focus:border-bronze-400 focus:outline-none placeholder:text-ivory-500"
              />
              <Mail className="w-4 h-4 text-ivory-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block font-mono text-2xs uppercase tracking-wider text-ivory-300">
                Password
              </label>
              <Link
                to="/auth/forgot-password"
                onClick={onClose}
                className="font-mono text-2xs text-bronze-400 hover:text-bronze-300 underline underline-offset-2"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-charcoal-950 text-ivory-100 font-sans text-xs px-4 py-3 pl-10 pr-10 rounded border border-ivory-100/15 focus:border-bronze-400 focus:outline-none placeholder:text-ivory-500"
              />
              <Lock className="w-4 h-4 text-ivory-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ivory-500 hover:text-ivory-300"
                aria-label={showPwd ? 'Hide password' : 'Show password'}
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || gLoading}
            className="w-full py-3.5 bg-bronze-400 text-charcoal-950 font-sans font-semibold text-xs uppercase tracking-widest rounded hover:bg-bronze-300 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Access Member Archives'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Links */}
        <div className="pt-4 border-t border-ivory-100/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-sans text-ivory-400">
          <span>Don't have an account?</span>
          <Link
            to="/auth/signup"
            onClick={onClose}
            className="font-medium text-bronze-400 hover:text-bronze-300 underline underline-offset-2"
          >
            Create free account →
          </Link>
        </div>
      </div>
    </div>
  )
}
