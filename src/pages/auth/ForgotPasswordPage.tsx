import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, BookOpen, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      await resetPassword(email)
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-sand-100 dark:bg-dark-bg">
      <div className="w-full max-w-md">
        <div className="card p-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
          </Link>

          {success ? (
            <>
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="heading-md text-gray-900 dark:text-white mb-3">Check your inbox</h1>
              <p className="text-gray-500 dark:text-gray-400 mb-8">
                We've sent a password reset link to <strong className="text-gray-900 dark:text-white">{email}</strong>
              </p>
              <Link to="/auth/login" className="btn btn-primary btn-md w-full">Back to Sign In</Link>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h1 className="heading-md text-gray-900 dark:text-white mb-2">Forgot your password?</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
                No worries. Enter your email and we'll send you a reset link.
              </p>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm mb-5">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="text-left space-y-4">
                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input id="forgot-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required className="input pl-10" />
                  </div>
                </div>
                <button id="forgot-submit-btn" type="submit" disabled={loading} className="w-full btn btn-primary btn-md">
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>

              <Link to="/auth/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 mt-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
