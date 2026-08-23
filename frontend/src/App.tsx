import { useEffect, useState } from 'react'
import Navigation from './components/Navigation'
import LandingPage from './pages/LandingPage'

function App() {
  const [isDark, setIsDark] = useState(() => {
    // Persist theme preference in localStorage
    const stored = localStorage.getItem('theme')
    if (stored) return stored === 'dark'
    // Default: respect system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    // Apply theme to document element
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const handleThemeToggle = () => setIsDark(v => !v)

  return (
    <>
      <Navigation isDark={isDark} onThemeToggle={handleThemeToggle} />
      <LandingPage />
    </>
  )
}

export default App
