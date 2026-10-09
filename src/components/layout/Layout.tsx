import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import { cn } from '@/lib/utils'

// Scroll to the top on page changes, or to the #section when a hash is present.
function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)))
      if (el) { el.scrollIntoView(); return }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

export default function Layout() {
  // The museum is always dark, so the navbar switches to its dark variant there.
  const inMuseum = useLocation().pathname.startsWith('/museum')
  return (
    <div className={cn('min-h-screen flex flex-col', inMuseum ? 'bg-dark-bg' : 'bg-sand-100 dark:bg-dark-bg')}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary-600 focus:text-white">
        Skip to content
      </a>
      <ScrollManager />
      <div className={inMuseum ? 'dark' : undefined}>
        <Navbar />
      </div>
      <main id="main" className="flex-1 pt-16 md:pt-18">
        <Suspense
          fallback={
            <div className="min-h-[60vh] flex items-center justify-center" role="status" aria-label="Loading">
              <div className="w-10 h-10 rounded-full border-4 border-primary-500/20 border-t-primary-600 animate-spin" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
