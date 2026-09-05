import { Header } from './Header'
import { MobileNav } from './MobileNav'
import { Footer } from './Footer'
import { ToastContainer } from '@/components/feedback/Toast'
import { LibrarySync } from '@/components/library/LibrarySync'

interface ShellProps {
  children: React.ReactNode
}

export function Shell({ children }: ShellProps) {
  return (
    <>
      {/* Skip to main content */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Header />

      <main id="main-content" className="mx-auto min-h-screen max-w-[1440px] pb-20 md:pb-8">
        {children}
      </main>

      <Footer />

      <MobileNav />

      <ToastContainer />

      <LibrarySync />
    </>
  )
}
