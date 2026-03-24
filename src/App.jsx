import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '../shared/authStore'
import ChatPage from './pages/ChatPage'
import OnboardingPage from './pages/OnboardingPage'
import SettingsPage from './pages/SettingsPage'
import AdminPage from './pages/AdminPage'
import AboutPage from './pages/AboutPage'
import ToastContainer from './components/ToastContainer'
import ErrorBoundary from './components/ErrorBoundary'

export default function App() {
  const init = useAuthStore((s) => s.init)

  useEffect(() => {
    init()
  }, [init])

  return (
    <BrowserRouter>
      <ToastContainer />
      <ErrorBoundary>
      <Routes>
        <Route path="/" element={<ChatPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  )
}
