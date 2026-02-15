import { useEffect, useRef } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import StoriesPage from './pages/StoriesPage'
import ContactPage from './pages/ContactPage'
import NotFoundPage from './pages/NotFoundPage'
import DonorDashboard from './DonorDashboard/pages/DonorDashboard'
import NGODashboard from './modules/NGODashboard/pages/NGODashboard'
import AdminDashboard from './admin/AdminDashboard'
import VolunteerPage from './pages/VolunteerPage'
import ProtectedRoute from './components/ProtectedRoute'

gsap.registerPlugin(ScrollTrigger)

/*
 * Dashboard paths don't need Lenis smooth scroll — they have
 * their own overflow containers.  Only enable it for public pages.
 */
const DASHBOARD_PREFIXES = ['/donor-dashboard', '/ngo-dashboard', '/admin-dashboard']

function App() {
  const lenisRef = useRef(null)
  const location = useLocation()

  const isDashboard = DASHBOARD_PREFIXES.some((p) =>
    location.pathname.startsWith(p)
  )

  useEffect(() => {
    // Don't initialise Lenis on dashboard pages
    if (isDashboard) {
      // Kill any stale Lenis instance when navigating to a dashboard
      if (lenisRef.current) {
        lenisRef.current.destroy()
        lenisRef.current = null
      }
      return
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    })

    lenisRef.current = lenis

    lenis.on('scroll', ScrollTrigger.update)

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000)
    })

    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.destroy()
      lenisRef.current = null
      gsap.ticker.remove(lenis.raf)
    }
  }, [isDashboard])

  return (
    <Routes>
      {/* ── Public routes ── */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/stories" element={<StoriesPage />} />
      <Route path="/contact" element={<ContactPage />} />

      {/* ── Protected dashboard routes ── */}
      <Route
        path="/donor-dashboard"
        element={
          <ProtectedRoute allowedRoles={['donor']}>
            <DonorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ngo-dashboard"
        element={
          <ProtectedRoute allowedRoles={['ngo', 'volunteer']}>
            <NGODashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* ── 404 catch-all ── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
