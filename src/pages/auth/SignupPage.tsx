import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, Mail, Lock, Eye, EyeOff, User, AtSign, AlertCircle, Globe, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function SignupPage() {
  const { signUp, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  const [fullName,  setFullName]  = useState('')
  const [username,  setUsername]  = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [showPwd,   setShowPwd]   = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [gLoading,  setGLoading]  = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [success,   setSuccess]   = useState(false)

  const passwordStrength = (() => {
    if (password.length === 0) return 0
    let s = 0
    if (password.length >= 8) s++
    if (/[A-Z]/.test(password)) s++
    if (/[0-9]/.test(password)) s++
    if (/[^A-Za-z0-9]/.test(password)) s++
    return s
  })()

  const strengthColor = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'][passwordStrength - 1] || 'bg-gray-200'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      await signUp(email, password, username, fullName)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        navigate('/')
      } else {
        setSuccess(true)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.'
      if (msg.toLowerCase().includes('confirmation email') || msg.toLowerCase().includes('rate limit')) {
        setError('Supabase email limit reached. In your Supabase Dashboard, go to Authentication -> Providers -> Email and turn off "Confirm email" for instant sign-ups.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-sand-100 dark:bg-dark-bg">
        <div className="w-full max-w-md text-center card p-10">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="heading-md text-gray-900 dark:text-white mb-3">Check your email!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
            We sent a confirmation link to <strong className="text-gray-900 dark:text-white">{email}</strong>. Click it to activate your AfroArchive account.
          </p>
          <Link to="/auth/login" className="btn btn-primary btn-md w-full">Back to Sign In</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-gray-900 via-primary-900 to-accent-900">
        <div className="absolute inset-0" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4z'/%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <Link to="/" className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <span className="font-serif font-bold text-2xl">AfroArchive</span>
          </Link>
          <h2 className="font-serif text-3xl font-bold mb-4 leading-tight">
            Join 45,000+ scholars preserving Africa's legacy
          </h2>
          <p className="text-white/70 leading-relaxed mb-10">
            Read unlimited articles, write and publish your own research, build collections, and connect with a global community of African knowledge keepers.
          </p>
          {[
            'Access 12,400+ curated articles',
            'Write and publish your research',
            'AI-powered article tools',
            'Connect with global scholars',
            'Build personal collections',
          ].map(benefit => (
            <div key={benefit} className="flex items-center gap-3 mb-3">
              <div className="w-5 h-5 rounded-full bg-primary-400/30 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary-300" />
              </div>
              <span className="text-white/80 text-sm">{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-sand-100 dark:bg-dark-bg overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <div className="card p-8">
            <h1 className="heading-md text-gray-900 dark:text-white mb-1">Create your account</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Free forever. No credit card required.</p>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm mb-5 animate-fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            <button
              id="signup-google-btn"
              onClick={async () => { setGLoading(true); try { await signInWithGoogle() } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed') } finally { setGLoading(false) } }}
              disabled={gLoading}
              className="w-full btn btn-ghost border border-sand-300 dark:border-dark-border btn-md mb-5 gap-2"
            >
              <Globe className="w-5 h-5 text-blue-500" />
              {gLoading ? 'Connecting…' : 'Sign up with Google'}
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-sand-300 dark:bg-dark-border" />
              <span className="text-xs text-gray-400">or with email</span>
              <div className="flex-1 h-px bg-sand-300 dark:bg-dark-border" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="signup-fullname" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input id="signup-fullname" type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" required className="input pl-10" />
                  </div>
                </div>
                <div>
                  <label htmlFor="signup-username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Username</label>
                  <div className="relative">
                    <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input id="signup-username" type="text" value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="username" required minLength={3} maxLength={30} className="input pl-10" />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input id="signup-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required className="input pl-10" />
                </div>
              </div>

              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input id="signup-password" type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" required minLength={8} className="input pl-10 pr-10" />
                  <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" aria-label="Toggle password">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="mt-2 flex gap-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= passwordStrength ? strengthColor : 'bg-gray-200 dark:bg-dark-border'}`} />
                    ))}
                  </div>
                )}
              </div>

              <button id="signup-submit-btn" type="submit" disabled={loading} className="w-full btn btn-primary btn-md mt-1">
                {loading ? 'Creating account…' : 'Create Free Account'}
              </button>
            </form>

            <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
              By signing up, you agree to our{' '}
              <Link to="/terms" className="text-primary-600 dark:text-primary-400 hover:underline">Terms</Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline">Privacy Policy</Link>
            </p>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5 border-t border-sand-200 dark:border-dark-border pt-5">
              Already have an account?{' '}
              <Link to="/auth/login" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
