import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { BookOpen, Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search + window.location.hash.replace(/^#/, '&'))
    if (params.get('error')) {
      console.error('[auth callback]', params.get('error_description') || params.get('error'))
      setFailed(true)
      return
    }
    const isRecovery = params.get('type') === 'recovery'
    let timer: ReturnType<typeof setTimeout> | undefined

    const finish = () => navigate(isRecovery ? '/auth/reset-password' : '/', { replace: true })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') navigate('/auth/reset-password', { replace: true })
      else if (session) finish()
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) { finish(); return }
      // Token exchange may still be in progress; give it a moment.
      timer = setTimeout(() => {
        supabase.auth.getSession().then(({ data: { session: s } }) => {
          if (s) finish()
          else setFailed(true)
        })
      }, 4000)
    })

    return () => {
      subscription.unsubscribe()
      if (timer) clearTimeout(timer)
    }
  }, [navigate])

  if (failed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-sand-100 dark:bg-dark-bg">
        <div className="card p-8 max-w-md text-center space-y-4">
          <h1 className="heading-md text-gray-900 dark:text-white">We couldn’t complete sign-in</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">The link may have expired or already been used. Please try signing in again.</p>
          <Link to="/auth/login" className="btn btn-primary btn-md w-full">Back to sign in</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-sand-100 dark:bg-dark-bg" role="status">
      <div className="w-12 h-12 rounded-2xl bg-primary-500 flex items-center justify-center">
        <BookOpen className="w-7 h-7 text-white" />
      </div>
      <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
      <p className="text-gray-500 dark:text-gray-400 text-sm">Completing sign in…</p>
    </div>
  )
}
