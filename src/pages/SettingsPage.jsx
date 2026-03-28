import { useState, useMemo } from 'react'
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

  const [showAddChild, setShowAddChild] = useState(false)
  const [childForm, setChildForm] = useState({ name: '', birthDate: '', gender: 'boy', personality: '' })
  const [savingChild, setSavingChild] = useState(false)

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
      {/* ───────── Header — clean, mobile-first ───────── */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-gray-100/60 dark:border-gray-800/40">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-5 h-14">
          <Link
            to="/"
            className="flex items-center gap-2 text-text-main no-underline hover:opacity-80 transition-opacity"
          >
            <span className="material-symbols-rounded text-primary text-lg">arrow_forward</span>
            <span className="text-sm font-bold">חזרה לצ'אט</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-extrabold text-text-main hidden sm:block">הגדרות</span>
            <div className="size-9 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {initials}
            </div>
          </div>
        </div>
      </header>

      {/* ───────── Main Content — single column, mobile-first ───────── */}
      <main className="max-w-3xl mx-auto py-6 px-4 sm:px-5 space-y-5">

            {/* ── Profile Card — compact, warm ── */}
            <div className="bg-white dark:bg-surface-dark rounded-3xl shadow-lg shadow-primary/5 border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="h-20 bg-gradient-to-l from-primary/80 via-purple-500/80 to-pink-400/80" />
              <div className="px-5 pb-5 -mt-10">
                <div className="flex items-end gap-4">
                  <div className="size-20 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-2xl font-black ring-4 ring-white shadow-lg flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0 pt-12">
                    <h1 className="font-extrabold text-xl text-text-main leading-tight truncate">{user?.parentName || 'משתמש'}</h1>
                    <p className="text-text-muted text-sm truncate">{user?.email || ''}</p>
                  </div>
                </div>
                {joinDate && (
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <span className="material-symbols-rounded text-text-muted text-sm">calendar_month</span>
                    <span className="text-xs text-text-muted">הצטרפות: {joinDate}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Children Management ── */}
            <div className="bg-white dark:bg-surface-dark rounded-3xl shadow-lg shadow-primary/5 border border-gray-100 dark:border-gray-700 p-5 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>child_care</span>
                  </div>
                  <h2 className="font-extrabold text-lg text-text-main">הילדים שלי</h2>
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
            <div className="bg-white dark:bg-surface-dark rounded-3xl shadow-lg shadow-primary/5 border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-amber-50 flex items-center justify-center">
                      <span className="material-symbols-outlined text-amber-600 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>card_membership</span>
                    </div>
                    <div>
                      <h2 className="font-bold text-text-main">מנוי</h2>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-100 text-text-muted text-xs font-medium border border-gray-200">
                        בסיסי (חינם)
                      </span>
                    </div>
                  </div>
                </div>
                {/* Feature comparison */}
                <div className="space-y-2.5 mb-5">
                  {[
                    { icon: 'chat', text: 'שיחות ללא הגבלה', free: true },
                    { icon: 'auto_awesome', text: 'תשובות מותאמות אישית', free: true },
                    { icon: 'history', text: 'שמירת היסטוריית שיחות', free: true },
                    { icon: 'psychology', text: 'ייעוץ מעמיק ומפורט', free: false },
                    { icon: 'family_restroom', text: 'תוכנית אישית לכל ילד', free: false },
                    { icon: 'support_agent', text: 'שיחה עם מומחה אנושי', free: false },
                  ].map((f, i) => (
                    <div key={i} className={`flex items-center gap-2.5 text-sm ${f.free ? 'text-text-main' : 'text-text-muted'}`}>
                      <span className={`material-symbols-rounded text-base ${f.free ? 'text-emerald-500' : 'text-gray-300'}`}>
                        {f.free ? 'check_circle' : 'lock'}
                      </span>
                      {f.text}
                    </div>
                  ))}
                </div>
                <button className="w-full py-3 rounded-xl bg-gradient-to-l from-primary to-purple-500 text-white text-sm font-bold hover:shadow-lg hover:shadow-primary/25 transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-rounded text-base">diamond</span>
                  שדרוג לפרימיום
                </button>
              </div>
            </div>

            {/* ── Emergency Resources ── */}
            <div className="bg-red-50/80 dark:bg-red-900/10 rounded-3xl border border-red-200/40 p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="material-symbols-rounded text-red-500 text-xl">emergency</span>
                <h3 className="font-bold text-red-700 text-sm">קווים חמים</h3>
              </div>
              <div className="space-y-2 text-sm">
                <a href="tel:1201" className="flex items-center justify-between p-2.5 bg-white/60 rounded-xl hover:bg-white transition-all no-underline">
                  <span className="text-text-main font-medium">ער"ן - סיוע נפשי</span>
                  <span className="text-primary font-bold">1201</span>
                </a>
                <a href="tel:118" className="flex items-center justify-between p-2.5 bg-white/60 rounded-xl hover:bg-white transition-all no-underline">
                  <span className="text-text-main font-medium">עמותת אל"י - למניעת התעללות</span>
                  <span className="text-primary font-bold">118</span>
                </a>
              </div>
            </div>

            {/* ── General Settings ── */}
            <div className="bg-white dark:bg-surface-dark rounded-3xl shadow-lg shadow-primary/5 border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-extrabold text-text-main flex items-center gap-2.5">
                  <span className="material-symbols-rounded text-lg text-primary">tune</span>
                  הגדרות כלליות
                </h3>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-700">
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
      </main>

      {/* ───────── Footer ───────── */}
      <footer className="border-t border-gray-100 dark:border-gray-800 bg-white/60 dark:bg-surface-dark/60 mt-8">
        <div className="max-w-3xl mx-auto px-5 py-5 flex flex-col items-center gap-2">
          <div className="flex items-center gap-4">
            <Link to="/about" className="text-xs text-text-muted hover:text-primary transition-colors no-underline flex items-center gap-1">
              <span className="material-symbols-rounded text-sm">info</span>
              קצת עלינו
            </Link>
            <Link to="/terms" className="text-xs text-text-muted hover:text-primary transition-colors no-underline">תנאי שימוש</Link>
            <Link to="/privacy" className="text-xs text-text-muted hover:text-primary transition-colors no-underline">פרטיות</Link>
          </div>
          <p className="text-xs text-text-muted">© {new Date().getFullYear()} הורות בכיס. כל הזכויות שמורות.</p>
        </div>
      </footer>

      {/* ───────── Delete Account Modal ───────── */}
      {showDeleteAccount && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setShowDeleteAccount(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-xl p-5 sm:p-6 w-[92vw] sm:w-full max-w-sm anim-scale-in" onClick={e => e.stopPropagation()}>
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

    </div>
  )
}
