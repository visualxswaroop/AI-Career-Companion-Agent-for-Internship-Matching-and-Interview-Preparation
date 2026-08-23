import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AuthProvider } from './context/AuthContext'
import Navigation from './components/Navigation'
import ProtectedRoute from './components/ProtectedRoute'
import AppShell from './components/AppShell'

import LandingPage from './pages/LandingPage'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import OnboardingPage from './pages/OnboardingPage'

import OverviewPage from './pages/app/OverviewPage'
import ResumePlaceholderPage from './pages/app/ResumePlaceholderPage'
import InternshipsPlaceholderPage from './pages/app/InternshipsPlaceholderPage'
import CoverLetterPlaceholderPage from './pages/app/CoverLetterPlaceholderPage'
import ProfilePage from './pages/app/ProfilePage'

function LandingLayout({ isDark, onThemeToggle }: { isDark: boolean; onThemeToggle: () => void }) {
  return (
    <>
      <Navigation isDark={isDark} onThemeToggle={onThemeToggle} />
      <LandingPage />
    </>
  )
}

export default function App() {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('theme')
    if (stored) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const handleThemeToggle = () => setIsDark(v => !v)

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing Page */}
          <Route
            path="/"
            element={<LandingLayout isDark={isDark} onThemeToggle={handleThemeToggle} />}
          />

          {/* Authentication Routes */}
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/onboarding" element={<OnboardingPage />} />
            
            {/* Authenticated Application Shell */}
            <Route
              path="/app"
              element={<AppShell isDark={isDark} onThemeToggle={handleThemeToggle} />}
            >
              <Route index element={<OverviewPage />} />
              <Route path="resume" element={<ResumePlaceholderPage />} />
              <Route path="internships" element={<InternshipsPlaceholderPage />} />
              <Route path="cover-letters" element={<CoverLetterPlaceholderPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
