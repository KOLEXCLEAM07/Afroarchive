import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  useDocumentTitle('Choose a new password')

  const [ready, setReady] = useState<'checking' | 'ok' | 'invalid'>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  // The reset link signs the user in with a short-lived recovery session.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setReady('ok')
    })
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady('ok')
      else setTimeout(() => setReady(r => (r === 'checking' ? 'invalid' : r)), 3000)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('The two passwords do not match.'); return }
    setLoading(true)
    try {
      await updatePassword(password)
      setDone(true)
      setTimeout(() => navigate('/', { replace: true }), 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not update your password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-sand-100 dark:bg-dark-bg">
      <div className="w-full max-w-md card p-8">
        <Link to="/" className="inline-flex items-center gap-2 mb-8" aria-label="AfroArchive home">
          <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
        </Link>

        {ready === 'checking' && (
          <div className="flex items-center gap-3 text-sm text-gray-500" role="status">
            <Loader2 className="w-5 h-5 animate-spin text-primary-500" /> Checking your reset link…
          </div>
        )}

        {ready === 'invalid' && (
          <>
            <h1 className="heading-md text-gray-900 dark:text-white mb-2">This link has expired</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Password reset links can only be used once and expire after a short time. Request a new one to continue.</p>
            <Link to="/auth/forgot-password" className="btn btn-primary btn-md w-full">Send a new link</Link>
          </>
        )}

        {ready === 'ok' && done && (
          <div className="text-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h1 className="heading-md text-gray-900 dark:text-white mb-2">Password updated</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Taking you back to AfroArchive…</p>
          </div>
        )}

        {ready === 'ok' && !done && (
          <>
            <h1 className="heading-md text-gray-900 dark:text-white mb-1">Choose a new password</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Use at least 8 characters.</p>

            {error && (
              <div role="alert" className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm mb-5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="reset-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">New password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input id="reset-password" type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password" required minLength={8} className="input pl-10 pr-10" />
                  <button type="button" onClick={() => setShowPwd(p => !p)} aria-label={showPwd ? 'Hide password' : 'Show password'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="reset-confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm new password</label>
                <input id="reset-confirm" type={showPwd ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)}
                  autoComplete="new-password" required minLength={8} className="input" />
              </div>
              <button type="submit" disabled={loading} className="w-full btn btn-primary btn-md">
                {loading ? 'Saving…' : 'Update password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
