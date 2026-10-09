import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function NotFoundPage() {
  useDocumentTitle('Page not found')
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-20">
      <div className="text-center max-w-md">
        <Compass className="w-12 h-12 text-primary-500 mx-auto mb-4" aria-hidden="true" />
        <p className="eyebrow mb-2">Error 404</p>
        <h1 className="heading-lg text-gray-900 dark:text-white mb-3">This page isn’t in the archive</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">The link may be broken or the page may have moved.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn btn-primary btn-md">Go home</Link>
          <Link to="/discover" className="btn btn-outline btn-md">Search the archive</Link>
        </div>
      </div>
    </div>
  )
}
