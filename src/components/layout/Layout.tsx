import { type ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

interface LayoutProps {
  children?: ReactNode
  hideFooter?: boolean
}

export default function Layout({ hideFooter = false }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-sand-100 dark:bg-dark-bg">
      <Navbar />
      <main className="flex-1 pt-16 md:pt-18">
        <Outlet />
      </main>
      {!hideFooter && <Footer />}
    </div>
  )
}
