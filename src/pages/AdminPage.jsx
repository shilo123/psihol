import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../shared/api'

export default function AdminPage() {
  const [stats, setStats] = useState({ users: 0, conversations: 0 })
  const [users, setUsers] = useState([])
  const [systemPrompt, setSystemPrompt] = useState('')
  const [savedPrompt, setSavedPrompt] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState(null) // { type: 'success' | 'error', message }

  useEffect(() => {
    async function fetchData() {
      try {
        const [promptRes, usersRes, statsRes] = await Promise.all([
          api.getSystemPrompt(),
          api.getUsers(),
          api.getStats(),
        ])
        const promptText = promptRes.prompt || ''
        setSystemPrompt(promptText)
        setSavedPrompt(promptText)
        setUsers(usersRes.users || usersRes || [])
        setStats(statsRes || { users: 0, conversations: 0 })
      } catch (err) {
        console.error('Failed to load admin data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [feedback])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.updateSystemPrompt(systemPrompt)
      setSavedPrompt(systemPrompt)
      setFeedback({ type: 'success', message: 'System Prompt נשמר בהצלחה' })
    } catch (err) {
      setFeedback({ type: 'error', message: 'שגיאה בשמירה: ' + err.message })
    } finally {
      setSaving(false)
    }
  }

  const isPromptChanged = systemPrompt !== savedPrompt

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-gray-500 text-lg">טוען נתוני מערכת...</p>
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background-light">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl">admin_panel_settings</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">ניהול מערכת</h1>
            <span className="px-3 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded-full">
              Admin
            </span>
          </div>
          <Link
            to="/"
            className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5 text-sm font-medium"
          >
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
            חזרה לאפליקציה
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-6 md:p-10 space-y-8">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Users Stat */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-600">group</span>
              </div>
              <span className="text-sm text-gray-500 font-medium">משתמשים</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.users?.toLocaleString() || 0}</p>
          </div>

          {/* Conversations Stat */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">forum</span>
              </div>
              <span className="text-sm text-gray-500 font-medium">שיחות</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.conversations?.toLocaleString() || 0}</p>
          </div>

          {/* Status Stat */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-green-600">cloud_done</span>
              </div>
              <span className="text-sm text-gray-500 font-medium">סטטוס מערכת</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold text-gray-900">פעיל</p>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            </div>
          </div>
        </div>

        {/* System Prompt Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">settings</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">הגדרת System Prompt</h2>
                <p className="text-sm text-gray-500">ההנחיות שמגדירות את אופי התשובות של הבוט</p>
              </div>
            </div>

            <div className="mt-6 relative">
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full min-h-[350px] bg-background-light border-2 border-gray-200 rounded-xl p-4 text-sm font-mono text-gray-800 leading-relaxed resize-y focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all placeholder:text-gray-400"
                placeholder="הכנס את ה-System Prompt כאן..."
              />
              <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                <span>{systemPrompt.length.toLocaleString()} תווים</span>
                {isPromptChanged && (
                  <span className="text-amber-500 font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">edit</span>
                    יש שינויים שלא נשמרו
                  </span>
                )}
              </div>
            </div>

            <div className="mt-5 flex items-center gap-4">
              <button
                onClick={handleSave}
                disabled={!isPromptChanged || saving}
                className="px-8 py-3 bg-primary text-white font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    שומר...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">save</span>
                    שמור שינויים
                  </>
                )}
              </button>

              {feedback && (
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium animate-in fade-in ${
                    feedback.type === 'success'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">
                    {feedback.type === 'success' ? 'check_circle' : 'error'}
                  </span>
                  {feedback.message}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Users Table Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-600">group</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900">משתמשים</h2>
              <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                {users.length}
              </span>
            </div>

            {users.length > 0 ? (
              <div className="overflow-x-auto -mx-6 md:-mx-8">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="bg-gray-50 text-right">
                      <th className="px-6 md:px-8 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">שם</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">אימייל</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ילדים</th>
                      <th className="px-6 md:px-8 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">תאריך הצטרפות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((user) => (
                      <tr key={user._id || user.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 md:px-8 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-primary text-sm font-bold">
                                {(user.name || user.email || '?').charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{user.name || '-'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600 dir-ltr text-right">{user.email}</td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center justify-center w-7 h-7 bg-primary/10 text-primary text-sm font-semibold rounded-full">
                            {user.children?.length || 0}
                          </span>
                        </td>
                        <td className="px-6 md:px-8 py-4 text-sm text-gray-500">
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString('he-IL', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-gray-400 text-3xl">person_off</span>
                </div>
                <p className="text-gray-500 text-sm">אין משתמשים רשומים עדיין</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
