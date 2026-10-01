import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { BookOpen, Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    // Listen for auth state change from hash or code exchange
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || (session && session.user)) {
        navigate('/', { replace: true })
      }
    })

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/', { replace: true })
      } else {
        // If not immediately available (exchanging tokens), allow a grace period
        const timer = setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: s } }) => {
            if (s) navigate('/', { replace: true })
            else navigate('/auth/login', { replace: true })
          })
        }, 2500)
        return () => clearTimeout(timer)
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-sand-100 dark:bg-dark-bg">
      <div className="w-12 h-12 rounded-2xl bg-primary-500 flex items-center justify-center">
        <BookOpen className="w-7 h-7 text-white" />
      </div>
      <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
      <p className="text-gray-500 dark:text-gray-400 text-sm">Completing sign in…</p>
    </div>
  )
}
