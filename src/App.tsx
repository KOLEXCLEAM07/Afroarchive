import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/layout/Layout'
import LandingPage from './pages/LandingPage'

const DiscoverPage = lazy(() => import('./pages/DiscoverPage'))
const CollectionsPage = lazy(() => import('./pages/CollectionsPage'))
const CollectionDetailPage = lazy(() => import('./pages/CollectionDetailPage'))
const MuseumExhibitionPage = lazy(() => import('./pages/MuseumExhibitionPage'))
const ArticleDetailPage = lazy(() => import('./pages/ArticleDetailPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const AtlasPage = lazy(() => import('./pages/AtlasPage'))
const ExplorePage = lazy(() => import('./pages/ExplorePage'))
const GlossaryPage = lazy(() => import('./pages/GlossaryPage'))
const ModerationPage = lazy(() => import('./pages/ModerationPage'))
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'))
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const SignupPage = lazy(() => import('./pages/auth/SignupPage'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'))
const CallbackPage = lazy(() => import('./pages/auth/CallbackPage'))

function PageFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center" role="status" aria-label="Loading">
      <div className="w-10 h-10 rounded-full border-4 border-primary-500/20 border-t-primary-600 animate-spin" />
    </div>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'bg-charcoal-800 text-ivory-100 border border-ivory-100/10 font-sans text-xs',
          duration: 3500,
        }}
      />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/signup" element={<SignupPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/callback" element={<CallbackPage />} />

          <Route element={<Layout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/museum" element={<MuseumExhibitionPage />} />
            <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/collections/:slug" element={<CollectionDetailPage />} />
            <Route path="/article/:slug" element={<ArticleDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:username" element={<ProfilePage />} />
            <Route path="/write" element={<ProfilePage />} />
            <Route path="/settings" element={<Navigate to="/profile?tab=settings" replace />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/atlas" element={<AtlasPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/glossary" element={<GlossaryPage />} />
            <Route path="/moderation" element={<ModerationPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/exhibition" element={<Navigate to="/museum" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
