import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../shared/api'
import { CHALLENGES, PERSONALITIES, PARENTING_STYLES } from '../../shared/constants'

// Build lookup maps: English value -> Hebrew label
const LABELS = {}
for (const list of [CHALLENGES, PERSONALITIES, PARENTING_STYLES]) {
  for (const item of list) LABELS[item.value] = item.label
}
function t(val) { return LABELS[val] || val }

// ---- User Detail Popup ----
function UserDetailPopup({ userId, onClose, onDelete, onSave }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    api.getUserDetails(userId).then(data => {
      setUser(data)
      setEditName(data.parentName || data.name || '')
      setEditEmail(data.email || '')
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [userId])

  async function handleSave() {
    setSaving(true)
    try {
      await api.updateUserAdmin(userId, { name: editName, parentName: editName, email: editEmail })
      setUser(prev => ({ ...prev, name: editName, parentName: editName, email: editEmail }))
      setEditing(false)
      onSave?.()
    } catch { /* */ }
    setSaving(false)
  }

  async function doDelete() {
    try {
      await api.deleteUser(userId)
      onDelete(userId)
      onClose()
    } catch { /* */ }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : !user ? (
          <div className="p-8 text-center text-gray-500">משתמש לא נמצא</div>
        ) : (
          <>
            {/* Header */}
            <div className="p-6 pb-0 flex items-start justify-between">
              <div className="flex items-center gap-3">
                {user.picture ? (
                  <img src={user.picture} referrerPolicy="no-referrer" className="w-14 h-14 rounded-full object-cover border-2 border-gray-100" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                    {(user.parentName || user.name || '?').charAt(0)}
                  </div>
                )}
                <div>
                  {editing ? (
                    <input value={editName} onChange={e => setEditName(e.target.value)}
                      className="text-lg font-bold border-2 border-primary rounded-lg px-2 py-1 outline-none" />
                  ) : (
                    <h2 className="text-lg font-bold text-gray-900">{user.parentName || user.name || 'ללא שם'}</h2>
                  )}
                  {editing ? (
                    <input value={editEmail} onChange={e => setEditEmail(e.target.value)} dir="ltr"
                      className="text-sm text-gray-500 border-2 border-gray-200 rounded-lg px-2 py-0.5 mt-1 outline-none focus:border-primary" />
                  ) : (
                    <p className="text-sm text-gray-500 dir-ltr text-right">{user.email}</p>
                  )}
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-gray-400">close</span>
              </button>
            </div>

            {/* Info badges */}
            <div className="px-6 pt-4 flex flex-wrap gap-2">
              {user.authProvider && (
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">{user.authProvider === 'google' ? 'g_mobiledata' : 'mail'}</span>
                  {user.authProvider === 'google' ? 'גוגל' : user.authProvider === 'email' ? 'אימייל' : user.authProvider}
                </span>
              )}
              {user.isGuest && (
                <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full">אורח</span>
              )}
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('he-IL') : '-'}
              </span>
              {user.parentAge && (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">גיל {user.parentAge}</span>
              )}
              {user.parentStyle && (
                <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full">{t(user.parentStyle)}</span>
              )}
            </div>

            {/* Children */}
            <div className="px-6 pt-5">
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-pink-500">child_care</span>
                ילדים ({(user.children || []).length})
              </h3>
              {(user.children || []).length > 0 ? (
                <div className="space-y-2">
                  {user.children.map((child, i) => (
                    <div key={child.id || i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        child.gender === 'girl' ? 'bg-gradient-to-br from-pink-400 to-rose-500' : 'bg-gradient-to-br from-blue-400 to-indigo-500'
                      }`}>
                        <span className="material-symbols-outlined text-lg">{child.gender === 'girl' ? 'girl' : 'boy'}</span>
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-bold text-gray-900">{child.name}</span>
                        <div className="text-xs text-gray-500 flex gap-2">
                          {child.birthDate && <span>{child.birthDate}</span>}
                          {child.personality && <span className="text-primary">{child.personality}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 py-2">לא הוגדרו ילדים</p>
              )}
            </div>

            {/* Challenges */}
            {(user.challenges || []).length > 0 && (
              <div className="px-6 pt-5">
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-amber-500">target</span>
                  אתגרים
                </h3>
                <div className="flex flex-wrap gap-2">
                  {user.challenges.map(c => (
                    <span key={c} className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full">{t(c)}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Memories */}
            <div className="px-6 pt-5">
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-green-500">psychology</span>
                זכרונות AI ({(user.memories || []).length})
              </h3>
              {(user.memories || []).length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {user.memories.map((m, i) => (
                    <div key={m.id || i} className="p-3 bg-green-50/50 rounded-xl border border-green-100">
                      <p className="text-sm text-gray-700">{m.content}</p>
                      <div className="text-xs text-gray-400 mt-1 flex gap-2">
                        {m.childName && <span className="text-primary font-medium">{m.childName}</span>}
                        {m.category && <span>{m.category === 'general' ? 'כללי' : m.category}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 py-2">אין זכרונות</p>
              )}
            </div>

            {/* Actions */}
            <div className="p-6 pt-5 flex items-center gap-3 border-t border-gray-100 mt-5">
              {editing ? (
                <>
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 h-11 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50">
                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className="material-symbols-outlined text-lg">save</span>}
                    {saving ? 'שומר...' : 'שמור'}
                  </button>
                  <button onClick={() => setEditing(false)}
                    className="h-11 px-5 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-colors">ביטול</button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditing(true)}
                    className="flex-1 h-11 bg-primary/10 text-primary font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/20 transition-colors">
                    <span className="material-symbols-outlined text-lg">edit</span>
                    עריכה
                  </button>
                  <button onClick={() => setShowDeleteConfirm(true)}
                    className="h-11 px-5 bg-red-50 text-red-600 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
                    <span className="material-symbols-outlined text-lg">delete</span>
                    מחיקה
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {/* Delete Confirmation Popup */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-6" onClick={() => setShowDeleteConfirm(false)}>
            <div className="absolute inset-0 bg-black/30 rounded-3xl" />
            <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-red-600 text-3xl">warning</span>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 text-center mb-2">מחיקת משתמש</h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                למחוק את <strong>{user?.parentName || user?.name}</strong> וכל הנתונים שלו? (שיחות, זכרונות)
                <br />
                <span className="text-red-500 font-medium">פעולה זו בלתי הפיכה.</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 h-11 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={doDelete}
                  className="flex-1 h-11 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">delete_forever</span>
                  מחק
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ---- Main Admin Page ----
export default function AdminPage() {
  const [stats, setStats] = useState({ totalUsers: 0, totalConversations: 0 })
  const [users, setUsers] = useState([])
  const [systemPrompt, setSystemPrompt] = useState('')
  const [savedPrompt, setSavedPrompt] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [activeTab, setActiveTab] = useState('users')
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null) // { id, name }
  const [temperature, setTemperature] = useState(0.7)
  const [savedTemperature, setSavedTemperature] = useState(0.7)
  const [testMessage, setTestMessage] = useState('')
  const [testResponse, setTestResponse] = useState('')
  const [testLoading, setTestLoading] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const [promptRes, usersRes, statsRes, tempRes] = await Promise.all([
          api.getSystemPrompt(),
          api.getUsers(),
          api.getStats(),
          api.getTemperature(),
        ])
        const promptText = promptRes.prompt || ''
        setSystemPrompt(promptText)
        setSavedPrompt(promptText)
        setUsers(usersRes.users || usersRes || [])
        setStats(statsRes || { totalUsers: 0, totalConversations: 0 })
        if (tempRes.temperature !== undefined) {
          setTemperature(tempRes.temperature)
          setSavedTemperature(tempRes.temperature)
        }
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

  function handleUserDeleted(userId) {
    setUsers(prev => prev.filter(u => u.id !== userId))
    setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }))
    setFeedback({ type: 'success', message: 'המשתמש נמחק בהצלחה' })
  }

  function handleUserSaved() {
    // Refresh users list
    api.getUsers().then(data => setUsers(data.users || data || []))
    setFeedback({ type: 'success', message: 'המשתמש עודכן בהצלחה' })
  }

  async function runTest() {
    if (!testMessage.trim() || testLoading) return
    setTestLoading(true)
    setTestResponse('')
    try {
      const body = await api.sendTempMessageStream(testMessage, [])
      const reader = body.getReader()
      const decoder = new TextDecoder()
      let result = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta?.content
            if (delta) {
              result += delta
              setTestResponse(result)
            }
          } catch { /* skip */ }
        }
      }
      if (!result) setTestResponse('(תשובה ריקה)')
    } catch (err) {
      setTestResponse('שגיאה: ' + err.message)
    }
    setTestLoading(false)
  }

  const isPromptChanged = systemPrompt !== savedPrompt

  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
  })

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

  const tabs = [
    { id: 'users', label: 'משתמשים', icon: 'group', count: users.length },
    { id: 'settings', label: 'הגדרות', icon: 'settings' },
  ]

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
            <span className="px-3 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded-full">Admin</span>
          </div>
          <Link to="/" className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5 text-sm font-medium">
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
            חזרה לאפליקציה
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 md:p-10 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-600 text-lg">group</span>
              </div>
              <span className="text-xs text-gray-500 font-medium">משתמשים</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalUsers?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-lg">forum</span>
              </div>
              <span className="text-xs text-gray-500 font-medium">שיחות</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalConversations?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-600 text-lg">token</span>
              </div>
              <span className="text-xs text-gray-500 font-medium">עלות טוקנים</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">${(stats.tokens?.totalCost || 0).toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-green-600 text-lg">cloud_done</span>
              </div>
              <span className="text-xs text-gray-500 font-medium">סטטוס</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-gray-900">פעיל</p>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              {tab.label}
              {tab.count !== undefined && (
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-500'
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Feedback Toast */}
        {feedback && (
          <div className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium ${
            feedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
          }`}>
            <span className="material-symbols-outlined text-lg">{feedback.type === 'success' ? 'check_circle' : 'error'}</span>
            {feedback.message}
          </div>
        )}

        {/* ======= USERS TAB ======= */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Search */}
            <div className="p-5 pb-0">
              <div className="relative">
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="חיפוש לפי שם או אימייל..."
                  className="w-full h-12 pr-12 pl-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>

            {/* Users List */}
            <div className="p-5">
              {filteredUsers.length > 0 ? (
                <div className="space-y-2">
                  {filteredUsers.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors group cursor-pointer border border-transparent hover:border-gray-200"
                      onClick={() => setSelectedUserId(user.id)}
                    >
                      {/* Avatar */}
                      {user.picture ? (
                        <img src={user.picture} referrerPolicy="no-referrer" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/80 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {(user.name || user.email || '?').charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900 truncate">{user.name || 'ללא שם'}</span>
                          {user.isGuest && (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-full">אורח</span>
                          )}
                          {user.authProvider === 'google' && (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full">Google</span>
                          )}
                          {user.parentStyle && (
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-bold rounded-full">{t(user.parentStyle)}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate dir-ltr text-right">{user.email}</p>
                        {/* Children names inline */}
                        {(user.children || []).length > 0 && (
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {user.children.map((c, i) => (
                              <span key={i} className={`inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                c.gender === 'girl' ? 'bg-pink-50 text-pink-600' : 'bg-blue-50 text-blue-600'
                              }`}>
                                <span className="material-symbols-outlined" style={{fontSize: '11px'}}>{c.gender === 'girl' ? 'girl' : 'boy'}</span>
                                {c.name}
                                {c.personality && <span className="text-gray-400 mr-0.5">· {t(c.personality)}</span>}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Children count */}
                      <div className="flex items-center gap-1 text-gray-400 text-xs shrink-0">
                        <span className="material-symbols-outlined text-base">child_care</span>
                        {user.childrenCount || 0}
                      </div>

                      {/* Date */}
                      <span className="text-xs text-gray-400 hidden sm:block shrink-0">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('he-IL') : '-'}
                      </span>

                      {/* Delete */}
                      <button
                        onClick={e => { e.stopPropagation(); setDeleteTarget({ id: user.id, name: user.name || user.email }) }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                        title="מחיקה"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>

                      {/* Arrow */}
                      <span className="material-symbols-outlined text-gray-300 group-hover:text-primary transition-colors">chevron_left</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <span className="material-symbols-outlined text-gray-400 text-2xl">search_off</span>
                  </div>
                  <p className="text-gray-500 text-sm">{searchQuery ? 'לא נמצאו תוצאות' : 'אין משתמשים רשומים'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======= SETTINGS TAB ======= */}
        {activeTab === 'settings' && (<>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">psychology</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">System Prompt</h2>
                  <p className="text-sm text-gray-500">ההנחיות שמגדירות את אופי התשובות של הבוט</p>
                </div>
              </div>

              <div className="mt-6 relative">
                <textarea
                  value={systemPrompt}
                  onChange={e => setSystemPrompt(e.target.value)}
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
              </div>
            </div>
          </div>

          {/* Temperature Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-amber-600">thermostat</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Temperature</h2>
                  <p className="text-sm text-gray-500">קובע כמה יצירתיות/אקראיות בתשובות (0 = מדויק, 2 = יצירתי מאוד)</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={e => setTemperature(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-900 w-12 text-center">{temperature.toFixed(1)}</span>
                  {temperature !== savedTemperature && (
                    <button
                      onClick={async () => {
                        try {
                          await api.updateTemperature(temperature)
                          setSavedTemperature(temperature)
                          setFeedback({ type: 'success', message: `Temperature עודכן ל-${temperature.toFixed(1)}` })
                        } catch { setFeedback({ type: 'error', message: 'שגיאה בשמירת Temperature' }) }
                      }}
                      className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors"
                    >
                      שמור
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2 px-1">
                <span>מדויק (0)</span>
                <span>מאוזן (0.7)</span>
                <span>יצירתי (2)</span>
              </div>
            </div>
          </div>

          {/* Chat Test Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-600">science</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">ניסיון צ'אט</h2>
                  <p className="text-sm text-gray-500">בדוק את ה-System Prompt והטמפרטורה הנוכחיים</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={testMessage}
                    onChange={e => setTestMessage(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && testMessage.trim() && !testLoading) {
                        e.preventDefault()
                        runTest()
                      }
                    }}
                    placeholder="כתוב הודעה לניסיון..."
                    className="flex-1 h-12 px-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                  <button
                    onClick={runTest}
                    disabled={!testMessage.trim() || testLoading}
                    className="h-12 px-6 bg-green-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {testLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span className="material-symbols-outlined text-lg">send</span>
                    )}
                    שלח
                  </button>
                </div>

                {testResponse && (
                  <div className="p-4 bg-green-50/50 border border-green-100 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-green-600 text-lg">smart_toy</span>
                      <span className="text-sm font-bold text-green-700">תשובת הבוט:</span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{testResponse}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>)}
      </main>

      {/* Delete Confirmation Popup (from list) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-600 text-3xl">warning</span>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">מחיקת משתמש</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              למחוק את <strong>{deleteTarget.name}</strong> וכל הנתונים שלו? (שיחות, זכרונות)
              <br />
              <span className="text-red-500 font-medium">פעולה זו בלתי הפיכה.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 h-11 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={async () => {
                  try {
                    await api.deleteUser(deleteTarget.id)
                    handleUserDeleted(deleteTarget.id)
                  } catch { /* */ }
                  setDeleteTarget(null)
                }}
                className="flex-1 h-11 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">delete_forever</span>
                מחק
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Popup */}
      {selectedUserId && (
        <UserDetailPopup
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onDelete={handleUserDeleted}
          onSave={handleUserSaved}
        />
      )}
    </div>
  )
}
