import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/layout/Layout'
import LandingPage from './pages/LandingPage'
import DiscoverPage from './pages/DiscoverPage'
import CollectionsPage from './pages/CollectionsPage'
import MuseumExhibitionPage from './pages/MuseumExhibitionPage'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import CallbackPage from './pages/auth/CallbackPage'

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
      <Routes>
        {/* Museum Exhibition Experience (8-Stage Flagship) */}
        <Route path="/museum" element={<MuseumExhibitionPage />} />

        {/* Auth routes (standalone full-screen layouts) */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/signup" element={<SignupPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/callback" element={<CallbackPage />} />

        {/* Portal & Community Pages wrapped in standard Layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/exhibition" element={<Navigate to="/museum" replace />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
