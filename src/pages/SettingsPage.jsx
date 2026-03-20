import { useState, useMemo, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../shared/authStore'
import { calculateAge } from '../../shared/constants'
import { api } from '../../shared/api'
import BirthDatePicker from '../components/BirthDatePicker'

const PERSONALITIES = [
  { value: 'sensitive', label: 'רגיש/ה' },
  { value: 'stubborn', label: 'עקשן/ית' },
  { value: 'anxious', label: 'חרדתי/ת' },
  { value: 'energetic', label: 'אנרגטי/ת' },
  { value: 'calm', label: 'רגוע/ה' },
]

export default function SettingsPage() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const updateUser = useAuthStore(s => s.updateUser)

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showAddChild, setShowAddChild] = useState(false)
  const [childForm, setChildForm] = useState({ name: '', birthDate: '', gender: 'boy', personality: '' })
  const [savingChild, setSavingChild] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [apiStats, setApiStats] = useState(null)

  useEffect(() => {
    api.getStats().then(setApiStats).catch(() => {})
  }, [])
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true'
    }
    return false
  })

  function toggleDarkMode() {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem('darkMode', String(next))
    if (next) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const [showPromptModal, setShowPromptModal] = useState(false)
  const [promptText, setPromptText] = useState('')
  const [promptLoading, setPromptLoading] = useState(false)
  const [promptSaving, setPromptSaving] = useState(false)
  const [promptSaved, setPromptSaved] = useState(false)

  async function openPromptModal() {
    setShowPromptModal(true)
    setPromptLoading(true)
    setPromptSaved(false)
    try {
      const data = await api.getSystemPrompt()
      setPromptText(data.prompt || '')
    } catch (err) {
      console.error('Failed to load system prompt:', err)
      setPromptText('')
    } finally {
      setPromptLoading(false)
    }
  }

  async function handleSavePrompt() {
    if (!promptText.trim()) return
    setPromptSaving(true)
    try {
      await api.updateSystemPrompt(promptText)
      setPromptSaved(true)
      setTimeout(() => setPromptSaved(false), 2000)
    } catch (err) {
      console.error('Failed to save system prompt:', err)
    } finally {
      setPromptSaving(false)
    }
  }

  const children = useMemo(() => user?.children || [], [user])

  const joinDate = useMemo(() => {
    if (!user?.createdAt) return ''
    return new Date(user.createdAt).toLocaleDateString('he-IL', { year: 'numeric', month: 'long' })
  }, [user])

  const initials = useMemo(() => {
    if (!user?.parentName) return '?'
    return user.parentName.split(' ').map(w => w[0]).join('').slice(0, 2)
  }, [user])

  async function handleAddChild(e) {
    e.preventDefault()
    if (!childForm.name || !childForm.birthDate) return
    setSavingChild(true)
    try {
      const result = await api.addChild(childForm)
      const newChildren = [...children, result.child || childForm]
      updateUser({ children: newChildren })
      setChildForm({ name: '', birthDate: '', gender: 'boy', personality: '' })
      setShowAddChild(false)
    } catch (err) {
      console.error('Failed to add child:', err)
    } finally {
      setSavingChild(false)
    }
  }

  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)

  async function handleDeleteAccount() {
    setDeletingAccount(true)
    try {
      await api.deleteAccount()
      logout()
      navigate('/')
    } catch {
      setDeletingAccount(false)
    }
  }

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* ───────── Header ───────── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-surface-dark/80 border-b border-border-color dark:border-gray-800">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between px-4 h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <div className="size-9 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-soft">
              <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
            </div>
            <span className="font-black text-lg text-text-main tracking-tight hidden sm:block">פסיכולוגית בכיס</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/" className="px-4 py-2 rounded-xl text-sm font-medium text-text-muted hover:text-primary hover:bg-primary-light/60 transition-all no-underline">
              ראשי
            </Link>
            <span className="px-4 py-2 rounded-xl text-sm font-bold text-primary bg-primary-light cursor-default">
              הגדרות
            </span>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Back to chat */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white font-semibold text-sm shadow-md shadow-primary/25 hover:shadow-lg hover:brightness-110 transition-all duration-200"
            >
              <span className="material-symbols-outlined text-lg" style={{ transform: 'scaleX(-1)' }}>arrow_back</span>
              חזרה לצ׳אט
            </button>

            {/* Avatar */}
            <div className="size-9 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-xs font-bold cursor-pointer">
              {initials}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden size-10 rounded-xl flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary-light/60 transition-all"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="material-symbols-outlined text-xl">{mobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div className="px-4 pb-4 space-y-1 border-t border-border-color pt-3">
            <Link to="/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:bg-primary-light/60 hover:text-primary transition-all no-underline">
              <span className="material-symbols-outlined text-lg">home</span>
              ראשי
            </Link>
            <span className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-primary bg-primary-light">
              <span className="material-symbols-outlined text-lg">settings</span>
              הגדרות
            </span>
          </div>
        </div>
      </header>

      {/* ───────── Main Content ───────── */}
      <main className="max-w-[1024px] mx-auto py-8 px-4">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-text-muted mb-8">
          <Link to="/" className="hover:text-primary transition-colors no-underline text-text-muted">בית</Link>
          <span className="material-symbols-outlined text-xs">chevron_left</span>
          <span className="text-text-main font-medium">פרופיל והגדרות</span>
        </nav>

        {/* ── System Prompt Block ── */}
        <button
          onClick={openPromptModal}
          className="w-full mb-6 relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary via-purple-500 to-indigo-600 p-6 shadow-lg hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 group"
        >
          {/* Decorative */}
          <div className="absolute top-0 left-0 size-40 rounded-full bg-white/10 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 size-28 rounded-full bg-white/5 translate-x-1/3 translate-y-1/3"></div>

          <div className="relative flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-white text-3xl">edit_note</span>
            </div>
            <div className="flex-1 text-right">
              <h3 className="font-black text-xl text-white mb-1">קורקל כתוב System Prompt</h3>
              <p className="text-white/70 text-sm">ערוך את ההנחיות שה-AI מקבל בכל שיחה</p>
            </div>
            <span className="material-symbols-outlined text-white/50 text-2xl group-hover:text-white/80 transition-colors">chevron_left</span>
          </div>
        </button>

        {/* 2-col grid */}
        <div className="grid lg:grid-cols-12 gap-6">

          {/* ═══════ Right column ═══════ */}
          <div className="lg:col-span-8 space-y-6">

            {/* ── Profile Card ── */}
            <div className="bg-white dark:bg-surface-dark rounded-2xl border border-border-color dark:border-gray-700 shadow-soft overflow-hidden">
              {/* Gradient banner */}
              <div className="h-28 bg-gradient-to-l from-primary via-purple-500 to-indigo-500 relative">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-4 right-12 size-16 rounded-full bg-white/20"></div>
                  <div className="absolute bottom-2 left-20 size-10 rounded-full bg-white/15"></div>
                  <div className="absolute top-6 left-1/3 size-8 rounded-full bg-white/10"></div>
                </div>
              </div>

              <div className="px-6 pb-6 -mt-14">
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                  {/* Avatar */}
                  <div className="relative group">
                    <div className="size-28 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-3xl font-black ring-4 ring-white shadow-lg">
                      {initials}
                    </div>
                    <button className="absolute bottom-1 right-1 size-8 rounded-full bg-white shadow-md border border-border-color flex items-center justify-center text-text-muted hover:text-primary hover:border-primary transition-all group-hover:scale-110">
                      <span className="material-symbols-outlined text-sm">photo_camera</span>
                    </button>
                  </div>

                  {/* Info */}
                  <div className="flex-1 pt-2">
                    <h1 className="font-black text-2xl text-text-main leading-tight">{user?.parentName || 'משתמש'}</h1>
                    <p className="text-text-muted text-sm mt-0.5">{user?.email || ''}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
                        <span className="size-1.5 rounded-full bg-emerald-500"></span>
                        מחובר/ת
                      </span>
                      {joinDate && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-text-muted text-xs font-medium border border-gray-200">
                          <span className="material-symbols-outlined text-xs">calendar_month</span>
                          הצטרפות: {joinDate}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Edit button */}
                  <button className="self-start sm:self-end px-5 py-2.5 rounded-xl border border-border-color text-sm font-medium text-text-main hover:border-primary hover:text-primary hover:bg-primary-light/40 transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">edit</span>
                    עריכה
                  </button>
                </div>
              </div>
            </div>

            {/* ── Children Management ── */}
            <div className="bg-white dark:bg-surface-dark rounded-2xl border border-border-color dark:border-gray-700 shadow-soft p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary-light flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>child_care</span>
                  </div>
                  <h2 className="font-bold text-lg text-text-main">הילדים שלי</h2>
                </div>
                <button
                  onClick={() => setShowAddChild(!showAddChild)}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  הוספת ילד
                </button>
              </div>

              {/* Add child form */}
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showAddChild ? 'max-h-[500px] opacity-100 mb-5' : 'max-h-0 opacity-0'}`}>
                <form onSubmit={handleAddChild} className="bg-background-light rounded-xl border border-border-color p-5 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-main mb-1.5">שם הילד/ה</label>
                      <input
                        type="text"
                        value={childForm.name}
                        onChange={e => setChildForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="לדוגמה: נועה"
                        className="w-full px-4 py-2.5 rounded-xl border border-border-color bg-white text-sm text-text-main placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-main mb-1.5">תאריך לידה</label>
                      <BirthDatePicker
                        value={childForm.birthDate}
                        onChange={(date) => setChildForm(f => ({ ...f, birthDate: date }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-main mb-2">מגדר</label>
                    <div className="flex gap-3">
                      {[
                        { value: 'boy', label: 'בן', icon: 'boy', color: 'blue' },
                        { value: 'girl', label: 'בת', icon: 'girl', color: 'pink' },
                      ].map(g => (
                        <button
                          key={g.value}
                          type="button"
                          onClick={() => setChildForm(f => ({ ...f, gender: g.value }))}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                            childForm.gender === g.value
                              ? 'border-primary bg-primary-light text-primary'
                              : 'border-border-color bg-white text-text-muted hover:border-primary/40'
                          }`}
                        >
                          <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>{g.icon}</span>
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-main mb-2">אופי</label>
                    <div className="flex flex-wrap gap-2">
                      {PERSONALITIES.map(p => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setChildForm(f => ({ ...f, personality: f.personality === p.value ? '' : p.value }))}
                          className={`px-4 py-2 rounded-full border text-sm transition-all ${
                            childForm.personality === p.value
                              ? 'border-primary bg-primary text-white'
                              : 'border-border-color bg-white text-text-muted hover:border-primary/40'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={savingChild || !childForm.name || !childForm.birthDate}
                      className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                      {savingChild ? (
                        <>
                          <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                          שומר...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-base">check</span>
                          שמירה
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddChild(false); setChildForm({ name: '', birthDate: '', gender: 'boy', personality: '' }) }}
                      className="px-5 py-2.5 rounded-xl border border-border-color text-sm font-medium text-text-muted hover:text-text-main hover:border-gray-300 transition-all"
                    >
                      ביטול
                    </button>
                  </div>
                </form>
              </div>

              {/* Children cards grid */}
              <div className="grid sm:grid-cols-2 gap-3">
                {children.map((child, i) => {
                  const isGirl = child.gender === 'girl'
                  return (
                    <div
                      key={child._id || i}
                      className="flex items-center gap-3.5 p-4 rounded-xl border border-border-color bg-background-light/50 hover:border-primary/30 hover:shadow-sm transition-all group"
                    >
                      <div className={`size-12 rounded-full flex items-center justify-center text-white shadow-sm ${isGirl ? 'bg-gradient-to-br from-pink-400 to-rose-500' : 'bg-gradient-to-br from-blue-400 to-indigo-500'}`}>
                        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {isGirl ? 'girl' : 'boy'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-text-main text-sm truncate">{child.name}</p>
                        <p className="text-text-muted text-xs mt-0.5">{calculateAge(child.birthDate)}</p>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 size-8 rounded-lg flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary-light transition-all">
                        <span className="material-symbols-outlined text-base">more_vert</span>
                      </button>
                    </div>
                  )
                })}

                {/* Add child placeholder */}
                <button
                  onClick={() => setShowAddChild(true)}
                  className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-border-color text-text-muted hover:border-primary/40 hover:text-primary hover:bg-primary-light/20 transition-all min-h-[80px]"
                >
                  <span className="material-symbols-outlined text-2xl">add_circle</span>
                  <span className="text-sm font-medium">הוספת ילד/ה</span>
                </button>
              </div>
            </div>

            {/* ── Subscription Card ── */}
            <div className="bg-white dark:bg-surface-dark rounded-2xl border border-border-color dark:border-gray-700 shadow-soft p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-amber-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-amber-600 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>card_membership</span>
                  </div>
                  <div>
                    <h2 className="font-bold text-text-main">מנוי</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-100 text-text-muted text-xs font-medium border border-gray-200">
                        בסיסי (חינם)
                      </span>
                    </div>
                  </div>
                </div>
                <button className="px-5 py-2.5 rounded-xl bg-gradient-to-l from-primary to-purple-500 text-white text-sm font-bold hover:shadow-lg hover:shadow-primary/25 transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                  שדרוג לפרימיום
                </button>
              </div>
            </div>
          </div>

          {/* ═══════ Left column ═══════ */}
          <div className="lg:col-span-4 space-y-6">

            {/* ── Talk to human card ── */}
            <div className="relative rounded-2xl overflow-hidden p-6 bg-gradient-to-br from-purple-600 via-primary to-indigo-600 text-white shadow-lg">
              {/* Decorative blobs */}
              <div className="absolute top-0 left-0 size-32 rounded-full bg-white/10 -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 right-0 size-24 rounded-full bg-white/5 translate-x-1/3 translate-y-1/3"></div>
              <div className="absolute top-1/2 left-1/2 size-16 rounded-full bg-white/5"></div>

              <div className="relative">
                <div className="size-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-2xl text-white" style={{ fontVariationSettings: "'FILL' 1" }}>support_agent</span>
                </div>
                <h3 className="font-bold text-lg mb-1.5">צריכים לדבר עם מישהו?</h3>
                <p className="text-white/80 text-sm leading-relaxed mb-4">
                  צוות המומחים שלנו זמין עבורכם לייעוץ אישי ומקצועי
                </p>
                <button className="w-full py-3 rounded-xl bg-white text-primary font-bold text-sm hover:bg-white/90 transition-all shadow-sm">
                  דברו עם מומחה
                </button>
              </div>
            </div>

            {/* ── General Settings ── */}
            <div className="bg-white dark:bg-surface-dark rounded-2xl border border-border-color dark:border-gray-700 shadow-soft overflow-hidden">
              <div className="px-6 py-4 border-b border-border-color dark:border-gray-700">
                <h3 className="font-bold text-text-main flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-text-muted">tune</span>
                  הגדרות כלליות
                </h3>
              </div>

              <div className="divide-y divide-border-color dark:divide-gray-700">
                {/* Dark mode toggle */}
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-lg text-text-muted dark:text-gray-400">
                      {darkMode ? 'dark_mode' : 'light_mode'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-text-main dark:text-gray-200">מצב כהה</p>
                      <p className="text-xs text-text-muted dark:text-gray-500 mt-0.5">החליפו בין מצב בהיר לכהה</p>
                    </div>
                  </div>
                  <button
                    onClick={toggleDarkMode}
                    className={`relative w-12 h-7 rounded-full transition-all duration-200 ${darkMode ? 'bg-primary' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-0.5 size-6 rounded-full bg-white shadow-md transition-all duration-200 ${darkMode ? 'right-0.5' : 'right-[22px]'}`}></span>
                  </button>
                </div>

                {/* Email notifications toggle */}
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-lg text-text-muted dark:text-gray-400">email</span>
                    <div>
                      <p className="text-sm font-medium text-text-main">התראות במייל</p>
                      <p className="text-xs text-text-muted mt-0.5">קבלו טיפים וחדשות</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEmailNotifications(!emailNotifications)}
                    className={`relative w-12 h-7 rounded-full transition-all duration-200 ${emailNotifications ? 'bg-primary' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-0.5 size-6 rounded-full bg-white shadow-md transition-all duration-200 ${emailNotifications ? 'right-0.5' : 'right-[22px]'}`}></span>
                  </button>
                </div>

                {/* Password */}
                <button className="flex items-center justify-between w-full px-6 py-4 text-right hover:bg-background-light/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-lg text-text-muted">lock</span>
                    <div>
                      <p className="text-sm font-medium text-text-main">שינוי סיסמה</p>
                      <p className="text-xs text-text-muted mt-0.5">עדכון סיסמת החשבון</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-lg text-text-muted">chevron_left</span>
                </button>

                {/* Language */}
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-lg text-text-muted">language</span>
                    <div>
                      <p className="text-sm font-medium text-text-main">שפה</p>
                      <p className="text-xs text-text-muted mt-0.5">שפת הממשק</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-background-light text-text-main text-xs font-medium border border-border-color">
                    עברית
                  </span>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-6 py-4 text-right hover:bg-red-50 transition-colors group"
                >
                  <span className="material-symbols-outlined text-lg text-red-500">logout</span>
                  <span className="text-sm font-medium text-red-500 group-hover:text-red-600">התנתקות</span>
                </button>

                {/* Delete Account */}
                <button
                  onClick={() => setShowDeleteAccount(true)}
                  className="flex items-center justify-between w-full px-6 py-4 text-right hover:bg-red-50/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-lg text-gray-400 group-hover:text-red-400">delete_forever</span>
                    <div>
                      <p className="text-sm font-medium text-gray-400 group-hover:text-red-400">מחיקת חשבון</p>
                      <p className="text-xs text-gray-300 group-hover:text-red-300 mt-0.5">מחיקת כל הנתונים לצמיתות</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-lg text-gray-300 group-hover:text-red-300">chevron_left</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ───────── API Cost Info ───────── */}
      <div className="max-w-[1024px] mx-auto px-4 mt-8">
        <div className="bg-gray-50 dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-gray-400 text-base">payments</span>
              <span className="text-xs font-bold text-gray-500">עלויות API (GPT-4.1)</span>
            </div>
            {apiStats?.tokens?.totalCost > 0 && (
              <span className="text-sm font-black text-primary bg-primary/10 px-3 py-1 rounded-full">
                ${apiStats.tokens.totalCost.toFixed(4)}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-[10px] text-gray-400 mb-0.5">Input tokens</p>
              <p className="text-xs font-mono font-bold text-gray-600">{apiStats?.tokens?.totalInputTokens?.toLocaleString() ?? '...'}</p>
              <p className="text-[10px] text-gray-400">${apiStats?.tokens?.totalInputCost?.toFixed(4) ?? '0'}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 mb-0.5">Output tokens</p>
              <p className="text-xs font-mono font-bold text-gray-600">{apiStats?.tokens?.totalOutputTokens?.toLocaleString() ?? '...'}</p>
              <p className="text-[10px] text-gray-400">${apiStats?.tokens?.totalOutputCost?.toFixed(4) ?? '0'}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 mb-0.5">סה"כ הודעות AI</p>
              <p className="text-xs font-mono font-bold text-gray-600">{apiStats?.tokens?.totalMessages ?? '0'}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 mb-0.5">סה"כ שיחות</p>
              <p className="text-xs font-mono font-bold text-primary">{apiStats?.totalConversations ?? '...'}</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200">
            <p className="text-[10px] text-gray-400">
              תמחור: $2.00/1M input • $8.00/1M output • סיכום: gpt-4.1-mini ($0.40/$1.60)
            </p>
            {apiStats?.tokens?.totalMessages > 0 && (
              <p className="text-[10px] font-bold text-gray-500">
                ~${(apiStats.tokens.totalCost / apiStats.tokens.totalMessages).toFixed(4)} / הודעה
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ───────── Footer ───────── */}
      <footer className="border-t border-border-color dark:border-gray-800 bg-white/60 dark:bg-surface-dark/60 mt-12">
        <div className="max-w-[1024px] mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-text-muted">© {new Date().getFullYear()} פסיכולוגית בכיס. כל הזכויות שמורות.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-xs text-text-muted hover:text-primary transition-colors no-underline">תנאי שימוש</a>
            <a href="#" className="text-xs text-text-muted hover:text-primary transition-colors no-underline">מדיניות פרטיות</a>
            <a href="#" className="text-xs text-text-muted hover:text-primary transition-colors no-underline">צרו קשר</a>
          </div>
        </div>
      </footer>

      {/* ───────── Delete Account Modal ───────── */}
      {showDeleteAccount && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setShowDeleteAccount(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-600 text-4xl">warning</span>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">מחיקת חשבון</h3>
            <p className="text-sm text-gray-500 text-center mb-2">
              האם למחוק את החשבון שלך לצמיתות?
            </p>
            <div className="text-sm text-center mb-6 space-y-1">
              <p className="text-gray-500 flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-red-400 text-base">chat</span>
                כל השיחות יימחקו
              </p>
              <p className="text-gray-500 flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-red-400 text-base">psychology</span>
                כל הזכרונות יימחקו
              </p>
              <p className="text-gray-500 flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-red-400 text-base">person_off</span>
                פרטי המשתמש יימחקו
              </p>
            </div>
            <p className="text-xs text-red-500 font-medium text-center mb-6">פעולה זו בלתי הפיכה.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteAccount(false)}
                className="flex-1 h-11 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="flex-1 h-11 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {deletingAccount ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-lg">delete_forever</span>
                )}
                {deletingAccount ? 'מוחק...' : 'מחק חשבון'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────── System Prompt Modal ───────── */}
      {showPromptModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowPromptModal(false)}
          />

          {/* Modal card */}
          <div className="relative w-full max-w-2xl bg-white dark:bg-surface-dark rounded-2xl shadow-2xl border border-border-color dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-color dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-primary-light dark:bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-xl">edit_note</span>
                </div>
                <div>
                  <h3 className="font-bold text-text-main dark:text-gray-100 text-lg">System Prompt</h3>
                  <p className="text-xs text-text-muted dark:text-gray-500">ההנחיות שה-AI מקבל בכל שיחה</p>
                </div>
              </div>
              <button
                onClick={() => setShowPromptModal(false)}
                className="size-9 rounded-xl flex items-center justify-center text-text-muted hover:text-text-main hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {promptLoading ? (
                <div className="flex items-center justify-center py-12 gap-3 text-text-muted dark:text-gray-400">
                  <span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>
                  <span className="text-sm">טוען...</span>
                </div>
              ) : (
                <textarea
                  value={promptText}
                  onChange={e => setPromptText(e.target.value)}
                  dir="rtl"
                  rows={10}
                  placeholder="כתבו כאן את ההנחיות ל-AI..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-border-color dark:border-gray-600 bg-background-light dark:bg-background-dark text-sm text-text-main dark:text-gray-200 placeholder:text-text-muted/50 leading-relaxed resize-y focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  style={{ minHeight: '200px', maxHeight: '400px' }}
                />
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border-color dark:border-gray-700 bg-background-light/50 dark:bg-background-dark/50">
              <p className="text-xs text-text-muted dark:text-gray-500">השינויים ישפיעו על שיחות חדשות</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowPromptModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-border-color dark:border-gray-600 text-sm font-medium text-text-muted hover:text-text-main hover:border-gray-300 transition-all"
                >
                  ביטול
                </button>
                <button
                  onClick={handleSavePrompt}
                  disabled={promptSaving || promptLoading}
                  className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm"
                >
                  {promptSaving ? (
                    <>
                      <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                      שומר...
                    </>
                  ) : promptSaved ? (
                    <>
                      <span className="material-symbols-outlined text-base">check</span>
                      נשמר!
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">save</span>
                      שמירה
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
