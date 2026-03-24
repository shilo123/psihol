import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../shared/authStore'
import { useChatStore } from '../../shared/chatStore'
import { formatTime, renderMarkdown } from '../../shared/constants'

/* ------------------------------------------------------------------ */
/*  Date-grouping helper                                               */
/* ------------------------------------------------------------------ */
function groupConversationsByDate(conversations) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const sevenDays = new Date(today.getTime() - 7 * 86400000)
  const thirtyDays = new Date(today.getTime() - 30 * 86400000)

  const groups = [
    { label: 'היום', items: [] },
    { label: '7 ימים אחרונים', items: [] },
    { label: 'חודש שעבר', items: [] },
    { label: 'ישן יותר', items: [] },
  ]

  conversations.forEach((c) => {
    const d = new Date(c.updatedAt || c.createdAt || Date.now())
    if (d >= today) groups[0].items.push(c)
    else if (d >= sevenDays) groups[1].items.push(c)
    else if (d >= thirtyDays) groups[2].items.push(c)
    else groups[3].items.push(c)
  })

  return groups.filter((g) => g.items.length > 0)
}



/* ================================================================== */
/*  ChatPage                                                           */
/* ================================================================== */
export default function ChatPage() {
  const navigate = useNavigate()

  /* ---- Auth store ---- */
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const isGuest = useAuthStore((s) => s.isGuest)
  const isLoggedIn = !!token || isGuest
  const loading = useAuthStore((s) => s.loading)
  const login = useAuthStore((s) => s.login)
  const signup = useAuthStore((s) => s.signup)
  const googleLogin = useAuthStore((s) => s.googleLogin)
  const loginAsGuest = useAuthStore((s) => s.loginAsGuest)
  const logout = useAuthStore((s) => s.logout)

  const isOnboarded =
    user?.parentName && user?.children?.length > 0 && user?.challenges?.length > 0

  /* ---- Chat store ---- */
  const conversations = useChatStore((s) => s.conversations)
  const currentConversation = useChatStore((s) => s.currentConversation)
  const messages = useChatStore((s) => s.messages)
  const sending = useChatStore((s) => s.sending)
  const streamingContent = useChatStore((s) => s.streamingContent)
  const loadConversations = useChatStore((s) => s.loadConversations)
  const createConversation = useChatStore((s) => s.createConversation)
  const selectConversation = useChatStore((s) => s.selectConversation)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const startTempChat = useChatStore((s) => s.startTempChat)
  const isTempChat = useChatStore((s) => s.isTempChat)

  function handleLogout() {
    logout()
    useChatStore.setState({ conversations: [], currentConversation: null, messages: [], streamingContent: '', isTempChat: false })
    navigate('/')
  }

  /* ---- Local state ---- */
  const [inputText, setInputText] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const [likedIds, setLikedIds] = useState(new Set())

  /* ---- Refs ---- */
  const scrollRef = useRef(null)
  const textareaRef = useRef(null)

  /* ---- Derived ---- */
  const grouped = useMemo(() => groupConversationsByDate(conversations), [conversations])
  // Track if a child was already selected in this conversation
  const childAlreadySelected = useMemo(() => {
    return messages.some(m => m.role === 'user' && /^אני מדבר\/ת על /.test(m.content))
  }, [messages])

  /* ---- Effects ---- */
  // Load conversations on login (only after user is validated by init)
  useEffect(() => {
    if (isLoggedIn && user) {
      loadConversations()
    }
  }, [isLoggedIn, user, loadConversations])

  // Auto-select first conversation
  useEffect(() => {
    if (isLoggedIn && conversations.length > 0 && !currentConversation) {
      selectConversation(conversations[0])
    }
  }, [isLoggedIn, conversations, currentConversation, selectConversation])

  // Navigate to onboarding after login if not onboarded (skip for guests)
  useEffect(() => {
    if (isLoggedIn && user && !isOnboarded && !isGuest) {
      navigate('/onboarding')
    }
  }, [isLoggedIn, isGuest, user, isOnboarded, navigate])

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, sending])

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
    }
  }, [inputText])

  /* ---- Login form state ---- */
  const [authMode, setAuthMode] = useState('login') // 'login' | 'signup'
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupConfirm, setSignupConfirm] = useState('')
  const [authError, setAuthError] = useState('')

  /* ---- Google Sign-In ---- */
  const googleHiddenRef = useRef(null)
  const [googleReady, setGoogleReady] = useState(false)
  const handleGoogleCallback = useCallback(async (response) => {
    const u = await googleLogin(response.credential)
    if (u && !(u.parentName && u.children?.length > 0 && u.challenges?.length > 0)) {
      navigate('/onboarding')
    }
  }, [googleLogin, navigate])

  useEffect(() => {
    if (isLoggedIn || !googleHiddenRef.current) return
    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(interval)
        window.google.accounts.id.initialize({
          client_id: '145489816493-r2vqfbp5jvla95msai28o5vp1q34naeh.apps.googleusercontent.com',
          callback: handleGoogleCallback,
        })
        window.google.accounts.id.renderButton(googleHiddenRef.current, {
          theme: 'outline',
          size: 'large',
          width: 400,
          text: 'continue_with',
          locale: 'he',
        })
        setGoogleReady(true)
      }
    }, 200)
    return () => clearInterval(interval)
  }, [isLoggedIn, handleGoogleCallback])

  /* ---- Handlers ---- */
  async function handleLogin(e) {
    e?.preventDefault()
    setAuthError('')
    if (!loginEmail.trim() || !loginPassword.trim()) return
    const u = await login({ email: loginEmail.trim(), password: loginPassword.trim() })
    if (u && !(u.parentName && u.children?.length > 0 && u.challenges?.length > 0)) {
      navigate('/onboarding')
    }
  }

  async function handleSignup(e) {
    e?.preventDefault()
    setAuthError('')
    if (!signupName.trim() || !signupEmail.trim() || !signupPassword) return
    if (signupPassword.length < 6) {
      setAuthError('הסיסמה חייבת להכיל לפחות 6 תווים')
      return
    }
    if (signupPassword !== signupConfirm) {
      setAuthError('הסיסמאות לא תואמות')
      return
    }
    const u = await signup({ name: signupName.trim(), email: signupEmail.trim(), password: signupPassword })
    if (u) navigate('/onboarding')
  }

  async function handleChildSelect(childName) {
    const text = `אני מדבר/ת על ${childName}`
    if (!currentConversation && !isTempChat) {
      const conv = await createConversation(text.substring(0, 50))
      if (!conv) return
    }
    await sendMessage(text)
  }

  async function handleSend(e) {
    e?.preventDefault()
    const text = inputText.trim()
    if (!text || sending) return
    setInputText('')

    if (!isTempChat && !currentConversation) {
      const conv = await createConversation(text.substring(0, 50))
      if (!conv) return
    }

    await sendMessage(text)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  async function handleNewConversation() {
    const conv = await createConversation()
    if (conv) setSidebarOpen(false)
  }

  function handleCopy(text, id) {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function handleLike(id) {
    setLikedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  /* ---- Collapsible email login ---- */
  const [showEmailLogin, setShowEmailLogin] = useState(false)

  /* ================================================================ */
  /*  LOGIN OVERLAY                                                    */
  /* ================================================================ */
  if (!isLoggedIn) {
    return (
      <div dir="rtl" className="h-screen flex flex-col overflow-hidden bg-background-light">
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary/20 via-purple-500/10 to-pink-500/10 backdrop-blur-md overflow-y-auto py-6">
          {/* Decorative blobs */}
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl" />

          {/* Glass card */}
          <div className="relative z-10 w-full max-w-md mx-4 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-7 sm:p-8 text-center border border-white/50 anim-scale-in">
            {/* Logo */}
            <div className="mx-auto mb-3 w-18 h-18 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-xl shadow-primary/30 transform rotate-3 anim-pop-in anim-delay-1" style={{ width: 72, height: 72 }}>
              <span className="material-symbols-outlined text-white text-4xl">psychology</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main mb-1 anim-fade-in-up anim-delay-2">פסיכולוגית בכיס</h1>
            <p className="text-text-muted mb-5 leading-relaxed text-sm anim-fade-in-up anim-delay-3">
              הדרך החכמה להתמודד עם אתגרי הורות - בכל רגע
            </p>

            {/* Value proposition chips */}
            <div className="flex flex-wrap justify-center gap-2 mb-5 anim-fade-in-up anim-delay-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/8 rounded-full text-xs font-semibold text-primary">
                <span className="material-symbols-rounded text-sm">psychology</span>
                מבוסס פסיכולוגיה
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/8 rounded-full text-xs font-semibold text-emerald-600">
                <span className="material-symbols-rounded text-sm">lock</span>
                פרטי ומאובטח
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/8 rounded-full text-xs font-semibold text-amber-600">
                <span className="material-symbols-rounded text-sm">bolt</span>
                מענה מיידי 24/7
              </div>
            </div>

            {/* Primary CTA — Google Sign-In */}
            <div className="relative w-full mb-3">
              <div className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white border-2 border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 pointer-events-none">
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="font-semibold text-gray-700">המשך עם Google</span>
              </div>
              <div
                ref={googleHiddenRef}
                className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-2xl"
                style={{ opacity: 0.01, cursor: 'pointer' }}
              />
            </div>

            {/* Secondary CTA — Try free */}
            <button
              onClick={async () => { await loginAsGuest() }}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-l from-primary to-purple-600 rounded-2xl shadow-lg shadow-primary/25 hover:shadow-xl hover:brightness-110 transition-all duration-200 text-white font-bold mb-4 disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? (
                <span className="material-symbols-rounded animate-spin text-lg">progress_activity</span>
              ) : (
                <span className="material-symbols-rounded text-lg">rocket_launch</span>
              )}
              <span>{loading ? 'נכנס...' : 'נסו בחינם'}</span>
            </button>

            {/* Social proof */}
            <div className="flex items-center justify-center gap-2 mb-4 anim-fade-in anim-delay-4">
              <div className="flex -space-x-2 rtl:space-x-reverse">
                <div className="size-7 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 border-2 border-white flex items-center justify-center text-white text-[10px] font-bold">מ</div>
                <div className="size-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 border-2 border-white flex items-center justify-center text-white text-[10px] font-bold">ד</div>
                <div className="size-7 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 border-2 border-white flex items-center justify-center text-white text-[10px] font-bold">ש</div>
              </div>
              <span className="text-xs text-text-muted">
                <b className="text-text-main">5,000+</b> הורים כבר משתמשים
              </span>
            </div>

            {/* Collapsible email login */}
            {!showEmailLogin ? (
              <button
                onClick={() => setShowEmailLogin(true)}
                className="text-xs text-text-muted hover:text-primary transition-colors"
              >
                כניסה עם אימייל וסיסמה
                <span className="material-symbols-rounded text-sm align-middle mr-1">expand_more</span>
              </button>
            ) : (
              <div className="anim-fade-in-up">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-text-muted">כניסה עם אימייל</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Auth mode toggle */}
                <div className="flex bg-gray-100 rounded-xl p-1 mb-3">
                  <button
                    onClick={() => { setAuthMode('login'); setAuthError('') }}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${authMode === 'login' ? 'bg-white shadow text-primary' : 'text-text-muted'}`}
                  >
                    כניסה
                  </button>
                  <button
                    onClick={() => { setAuthMode('signup'); setAuthError('') }}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${authMode === 'signup' ? 'bg-white shadow text-primary' : 'text-text-muted'}`}
                  >
                    הרשמה
                  </button>
                </div>

                {authError && (
                  <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 text-right">
                    {authError}
                  </div>
                )}

                {authMode === 'login' ? (
                  <form onSubmit={handleLogin} className="space-y-3 text-right">
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="אימייל"
                      dir="rtl"
                      className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 outline-none transition-all text-right text-sm"
                      required
                    />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="סיסמה"
                      dir="rtl"
                      className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 outline-none transition-all text-right text-sm"
                      required
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 rounded-xl transition-all duration-200 text-white font-semibold text-sm disabled:opacity-50 hover:bg-gray-800"
                    >
                      {loading ? <span className="material-symbols-rounded animate-spin text-lg">progress_activity</span> : null}
                      <span>{loading ? 'מתחבר...' : 'כניסה'}</span>
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleSignup} className="space-y-3 text-right">
                    <input
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="שם מלא"
                      className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 outline-none transition-all text-right text-sm"
                      required
                    />
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="אימייל"
                      dir="rtl"
                      className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 outline-none transition-all text-right text-sm"
                      required
                    />
                    <input
                      type="password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="סיסמה (לפחות 6 תווים)"
                      dir="rtl"
                      className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 outline-none transition-all text-right text-sm"
                      required
                      minLength={6}
                    />
                    <input
                      type="password"
                      value={signupConfirm}
                      onChange={(e) => setSignupConfirm(e.target.value)}
                      placeholder="אימות סיסמה"
                      dir="rtl"
                      className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 outline-none transition-all text-right text-sm"
                      required
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 rounded-xl transition-all duration-200 text-white font-semibold text-sm disabled:opacity-50 hover:bg-gray-800"
                    >
                      {loading ? <span className="material-symbols-rounded animate-spin text-lg">progress_activity</span> : null}
                      <span>{loading ? 'נרשם...' : 'הרשמה'}</span>
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Terms */}
            <p className="mt-4 text-[11px] text-text-muted/60 leading-relaxed">
              בכניסה, את/ה מסכים/ה ל
              <a href="#" className="text-primary hover:underline mx-0.5">תנאי השימוש</a>
              ול
              <a href="#" className="text-primary hover:underline mx-0.5">מדיניות הפרטיות</a>
            </p>
          </div>
        </div>
      </div>
    )
  }

  /* ================================================================ */
  /*  MAIN CHAT LAYOUT                                                 */
  /* ================================================================ */
  return (
    <div dir="rtl" className="h-screen flex overflow-hidden bg-background-light dark:bg-background-dark">
      {/* No top header - GPT style */}

      {/* ---------------------------------------------------------- */}
      {/*  BODY — RTL flex: main (right), sidebar (left)               */}
      {/* ---------------------------------------------------------- */}
        {/* ---- Mobile sidebar backdrop ---- */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* -------------------------------------------------------- */}
        {/*  CHAT AREA (first in DOM = RIGHT in RTL)                    */}
        {/* -------------------------------------------------------- */}
        <main className="flex-1 flex flex-col min-w-0 relative bg-chat-bg dark:bg-background-dark">
          {/* Mini topbar inside chat area */}
          <div className="shrink-0 h-12 px-4 flex items-center gap-3 z-10 border-b border-gray-100/60 dark:border-gray-800/40">
            {/* Sidebar toggle — more visible on mobile */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden size-9 flex items-center justify-center rounded-xl bg-white/80 dark:bg-surface-dark/80 shadow-sm hover:shadow-md transition-all"
            >
              <span className="material-symbols-rounded text-primary text-xl">menu</span>
            </button>
            {/* Logo - mobile only */}
            <div className="md:hidden flex items-center gap-2">
              <div className="size-7 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="material-symbols-rounded text-primary text-base">psychology</span>
              </div>
              <span className="text-sm font-bold text-text-main dark:text-gray-200">פסיכולוגית בכיס</span>
            </div>
            {/* Guest upgrade nudge */}
            {isGuest && (
              <button
                onClick={() => { handleLogout(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-l from-primary/10 to-purple-500/10 border border-primary/20 text-primary rounded-full text-xs font-bold mr-auto hover:bg-primary/15 transition-all"
              >
                <span className="material-symbols-rounded text-sm">diamond</span>
                הירשמו לשמירת השיחות
              </button>
            )}
            {/* Temp chat indicator */}
            {isTempChat && !isGuest && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold mr-auto">
                <span className="material-symbols-rounded text-sm">timer</span>
                שיחה זמנית
              </div>
            )}
          </div>

          {/* Messages container */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-6 pb-44 scrollbar-thin">
            {messages.length === 0 ? (
              /* ---- Welcome / Empty state ---- */
              <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-full anim-fade-in">
                {/* AI avatar */}
                <div className="mb-5 relative anim-pop-in anim-delay-1">
                  <div className="size-16 sm:size-20 rounded-3xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-2xl shadow-primary/30">
                    <span className="material-symbols-outlined text-white text-3xl sm:text-4xl">psychology</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 size-4 sm:size-5 bg-emerald-500 rounded-full border-2 border-chat-bg" />
                </div>

                {/* Welcome card */}
                <div className="relative bg-white dark:bg-surface-dark rounded-2xl shadow-lg w-full overflow-hidden mb-5 anim-fade-in-up anim-delay-2">
                  <div className="h-1 bg-gradient-to-r from-primary/60 via-purple-400/60 to-pink-400/60" />
                  <div className="p-5 sm:p-6 text-center">
                    <h2 className="text-lg sm:text-xl font-bold text-text-main mb-1.5">
                      {user?.parentName && !isGuest ? `היי ${user.parentName}` : 'שלום'}! איך אוכל לעזור?
                    </h2>
                    <p className="text-text-muted text-sm leading-relaxed">
                      {user?.children?.length > 0
                        ? `רוצה לדבר על ${user.children.map(c => c.name).join(', ')}? אני כאן בשבילך.`
                        : 'אני כאן בשבילכם - שאלו כל שאלה על הורות, חינוך או התפתחות הילד.'
                      }
                    </p>
                  </div>
                </div>

                {/* Quick suggestion chips */}
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 anim-fade-in-up anim-delay-3">
                  {[
                    { icon: 'bedtime', text: 'הילד שלי לא נרדם בלילה', color: 'from-indigo-500/10 to-purple-500/10 text-indigo-600' },
                    { icon: 'sentiment_frustrated', text: 'איך להתמודד עם התפרצויות זעם?', color: 'from-red-500/10 to-orange-500/10 text-red-500' },
                    { icon: 'devices', text: 'כמה זמן מסך מותר לילד?', color: 'from-blue-500/10 to-cyan-500/10 text-blue-600' },
                    { icon: 'group', text: 'הילדים שלי רבים כל הזמן', color: 'from-amber-500/10 to-yellow-500/10 text-amber-600' },
                  ].map((s, i) => (
                    <button
                      key={i}
                      onClick={async () => {
                        setInputText('')
                        if (!isTempChat && !currentConversation) {
                          const conv = await createConversation(s.text.substring(0, 50))
                          if (!conv) return
                        }
                        await sendMessage(s.text)
                      }}
                      disabled={sending}
                      className={`flex items-center gap-3 px-4 py-3 bg-gradient-to-l ${s.color} rounded-xl text-right hover:shadow-md active:scale-[0.97] transition-all duration-200 disabled:opacity-50 group`}
                    >
                      <span className="material-symbols-rounded text-xl opacity-70 group-hover:opacity-100 transition-opacity">{s.icon}</span>
                      <span className="text-sm font-medium text-text-main flex-1">{s.text}</span>
                    </button>
                  ))}
                </div>

              </div>
            ) : (
              /* ---- Messages list ---- */
              <div className="max-w-3xl mx-auto space-y-5">
                {messages.map((msg) => {
                  const isUser = msg.role === 'user'
                  return (
                    <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-3`}>
                      {/* AI avatar */}
                      {!isUser && (
                        <div className="shrink-0 size-9 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-md mt-1">
                          <span className="material-symbols-outlined text-white text-base">psychology</span>
                        </div>
                      )}

                      <div className={`max-w-[85%] ${isUser ? 'ml-auto' : ''}`}>
                        {isUser ? (
                          /* User bubble */
                          <div className="bg-primary text-white px-5 py-3 rounded-2xl rounded-tl-none shadow-md shadow-primary/15">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        ) : (
                          /* AI card */
                          <div className="relative bg-white dark:bg-surface-dark rounded-2xl shadow-md overflow-hidden slide-in-right">
                            {/* Rainbow top bar */}
                            <div className="h-0.5 bg-gradient-to-r from-primary/40 via-purple-400/40 to-pink-400/40" />
                            <div className="p-4 md:p-5">
                              <div
                                className={`text-sm text-text-main dark:text-gray-200 leading-relaxed prose-sm${childAlreadySelected ? ' child-selected' : ''}`}
                                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                                onClick={(e) => {
                                  const btn = e.target.closest('.child-select-btn')
                                  if (btn) {
                                    const childName = btn.dataset.child
                                    if (childName && !sending && !childAlreadySelected) {
                                      handleChildSelect(childName)
                                    }
                                    return
                                  }
                                  const followupBtn = e.target.closest('.followup-btn')
                                  if (followupBtn) {
                                    const question = followupBtn.dataset.followup
                                    if (question && !sending) {
                                      sendMessage(question)
                                    }
                                  }
                                }}
                              />
                            </div>
                            {/* Actions */}
                            <div className="flex items-center gap-1 px-4 pb-3">
                              <button
                                onClick={() => handleCopy(msg.content, msg.id)}
                                className="size-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                                title="העתק"
                              >
                                <span className="material-symbols-outlined text-gray-400 text-base">
                                  {copiedId === msg.id ? 'check' : 'content_copy'}
                                </span>
                              </button>
                              <button
                                onClick={() => handleLike(msg.id)}
                                className="size-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                                title="אהבתי"
                              >
                                <span
                                  className={`material-symbols-outlined text-base ${
                                    likedIds.has(msg.id) ? 'text-red-500' : 'text-gray-400'
                                  }`}
                                >
                                  {likedIds.has(msg.id) ? 'favorite' : 'favorite_border'}
                                </span>
                              </button>
                              {msg.timestamp && (
                                <span className="ml-auto text-[11px] text-gray-300">{formatTime(msg.timestamp)}</span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Timestamp for user messages */}
                        {isUser && msg.timestamp && (
                          <p className="text-[11px] text-gray-400 mt-1 px-1">{formatTime(msg.timestamp)}</p>
                        )}
                      </div>

                      {/* No spacer needed - justify-end handles user alignment */}
                    </div>
                  )
                })}

                {/* Streaming AI response */}
                {sending && (
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 size-9 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-md mt-1">
                      <span className="material-symbols-outlined text-white text-base">psychology</span>
                    </div>
                    <div className="max-w-[85%]">
                      <div className="relative bg-white dark:bg-surface-dark rounded-2xl shadow-md overflow-hidden slide-in-right">
                        <div className="h-0.5 bg-gradient-to-r from-primary/40 via-purple-400/40 to-pink-400/40" />
                        <div className="p-4 md:p-5">
                          {streamingContent ? (
                            <div
                              className="text-sm text-text-main dark:text-gray-200 leading-relaxed prose-sm streaming-cursor"
                              dangerouslySetInnerHTML={{ __html: renderMarkdown(streamingContent) }}
                            />
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="typing-dot size-2 bg-gray-400 rounded-full" style={{ animationDelay: '0ms' }} />
                              <span className="typing-dot size-2 bg-gray-400 rounded-full" style={{ animationDelay: '150ms' }} />
                              <span className="typing-dot size-2 bg-gray-400 rounded-full" style={{ animationDelay: '300ms' }} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ---- INPUT AREA ---- */}
          <div className="absolute bottom-0 inset-x-0 z-20 anim-fade-in-up">
            {/* Gradient fade */}
            <div className="h-8 bg-gradient-to-t from-chat-bg dark:from-background-dark to-transparent pointer-events-none" />

            <div className="bg-chat-bg dark:bg-background-dark px-4 md:px-8 pb-4">
              <form
                onSubmit={handleSend}
                className="max-w-3xl mx-auto relative bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl focus-within:border-primary/40 focus-within:shadow-primary/10 transition-all duration-200"
              >
                <div className="flex items-end gap-2 p-2">
                  {/* Attach button */}
                  <button
                    type="button"
                    className="shrink-0 size-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                  >
                    <span className="material-symbols-outlined text-xl">attach_file</span>
                  </button>

                  {/* Textarea */}
                  <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="מה תרצו לשאול?"
                    rows={1}
                    className="flex-1 resize-none py-2.5 px-1 text-sm text-text-main dark:text-gray-200 placeholder:text-gray-400 bg-transparent outline-none leading-relaxed max-h-40"
                    dir="rtl"
                  />

                  {/* Send button */}
                  <button
                    type="submit"
                    disabled={!inputText.trim() || sending}
                    className="shrink-0 size-10 flex items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/25 hover:shadow-lg hover:brightness-110 disabled:opacity-40 disabled:shadow-none transition-all duration-200"
                  >
                    <span className="material-symbols-outlined text-xl" style={{ transform: 'scaleX(-1)' }}>
                      send
                    </span>
                  </button>
                </div>
              </form>

              {/* Disclaimer */}
              <p className="max-w-3xl mx-auto text-center text-[11px] text-gray-400 mt-2 leading-relaxed">
                מבוסס AI - אינו מחליף ייעוץ מקצועי.
                <span className="text-red-400 font-medium"> במצב חירום חייגו 1201</span>
              </p>
            </div>
          </div>
        </main>

        {/* -------------------------------------------------------- */}
        {/*  SIDEBAR (second in DOM = LEFT in RTL → fixed RIGHT)       */}
        {/* -------------------------------------------------------- */}
        <aside
          className={`
            fixed top-0 right-0 h-full w-80 bg-white dark:bg-surface-dark border-l border-gray-100 dark:border-gray-800 z-40 flex flex-col
            transform transition-transform duration-300 ease-in-out
            md:relative md:translate-x-0 md:flex md:shrink-0 md:z-auto md:w-80 md:order-first
            ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
            ${sidebarOpen ? '' : 'pointer-events-none md:pointer-events-auto'}
            md:flex
          `}
        >
          {/* Sidebar header: Logo + New chat */}
          <div className="p-4 shrink-0 space-y-3">
            {/* Logo */}
            <div className="flex items-center gap-2.5 px-1">
              <div className="size-9 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
              </div>
              <span className="font-black text-base text-text-main dark:text-gray-100">פסיכולוגית בכיס</span>
              {/* Close sidebar on mobile */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="md:hidden mr-auto size-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="material-symbols-outlined text-text-muted text-lg">close</span>
              </button>
            </div>

            {/* New conversation buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleNewConversation}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-3 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:brightness-110 transition-all duration-200"
              >
                <span className="material-symbols-outlined text-xl">add_comment</span>
                שיחה חדשה
              </button>
              <button
                onClick={() => { startTempChat(); setSidebarOpen(false) }}
                className="shrink-0 flex items-center justify-center gap-1.5 px-3 py-3 bg-amber-500 text-white rounded-xl font-semibold shadow-lg shadow-amber-500/25 hover:shadow-xl hover:brightness-110 transition-all duration-200"
                title="שיחה זמנית - לא נשמרת"
              >
                <span className="material-symbols-outlined text-xl">timer</span>
              </button>
            </div>
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-thin">
            {grouped.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-5">
                <div className="size-16 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-2xl flex items-center justify-center mb-4">
                  <span className="material-symbols-rounded text-primary text-3xl">chat_bubble</span>
                </div>
                <p className="text-sm font-bold text-text-main mb-1">
                  אין שיחות עדיין
                </p>
                <p className="text-xs text-text-muted mb-4 leading-relaxed">
                  התחילו שיחה חדשה או לחצו על אחת מההצעות
                </p>
                {/* Quick tips */}
                <div className="w-full space-y-2">
                  <div className="flex items-center gap-2.5 p-2.5 bg-white/60 dark:bg-surface-dark/60 rounded-xl text-right">
                    <span className="material-symbols-rounded text-amber-500 text-lg">tips_and_updates</span>
                    <span className="text-xs text-text-muted">נסו לשאול "איך לבנות שגרת שינה?"</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-2.5 bg-white/60 dark:bg-surface-dark/60 rounded-xl text-right">
                    <span className="material-symbols-rounded text-blue-500 text-lg">auto_awesome</span>
                    <span className="text-xs text-text-muted">ככל שתספרו יותר, התשובות יהיו מדויקות יותר</span>
                  </div>
                </div>
              </div>
            ) : (
              grouped.map((group) => (
                <div key={group.label} className="mb-4">
                  <h3 className="px-3 py-2 text-xs font-bold text-text-secondary/60 uppercase tracking-wide">
                    {group.label}
                  </h3>
                  {group.items.map((conv) => {
                    const isActive = currentConversation?.id === conv.id
                    return (
                      <button
                        key={conv.id}
                        onClick={() => {
                          selectConversation(conv)
                          setSidebarOpen(false)
                        }}
                        className={`
                          w-full text-right px-3 py-2.5 rounded-xl mb-0.5 transition-all duration-150 group
                          ${isActive
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-text-main hover:bg-gray-50'}
                        `}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`material-symbols-outlined text-lg ${
                              isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-500'
                            }`}
                          >
                            chat_bubble
                          </span>
                          <span className="flex-1 truncate text-sm">{conv.title || 'שיחה חדשה'}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>

          {/* Bottom: Profile + Settings + Logout */}
          <div className="shrink-0 border-t border-gray-100 dark:border-gray-800">
            {/* User profile + logout */}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="size-9 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                {user?.parentName?.[0] || 'מ'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-main dark:text-gray-200 truncate">{user?.parentName || 'משתמש'}</p>
                <p className="text-xs text-text-muted dark:text-gray-500 truncate">{user?.email || ''}</p>
              </div>
              <button
                onClick={handleLogout}
                className="size-8 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="התנתקות"
              >
                <span className="material-symbols-outlined text-lg text-gray-400 hover:text-red-500">logout</span>
              </button>
            </div>

            {/* Settings */}
            <Link
              to="/settings"
              className="flex items-center justify-center gap-2 px-4 py-3 text-sm text-text-main dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors no-underline border-t border-gray-100 dark:border-gray-800"
            >
              <span className="material-symbols-outlined text-lg text-gray-400">settings</span>
              הגדרות
            </Link>
          </div>
        </aside>

      {/* ---- Inline styles for typing animation ---- */}
      <style>{`
        @keyframes slideInRight {
          0% { opacity: 0; transform: translateX(40px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        .slide-in-right {
          animation: slideInRight 0.5s ease-out forwards;
        }
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        .typing-dot {
          animation: typingBounce 1.2s ease-in-out infinite;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.1);
          border-radius: 999px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .child-select-btn {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 10px 22px;
          margin: 4px 4px;
          color: white;
          border: none;
          border-radius: 16px;
          font-weight: 800;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .child-btn-name {
          font-size: 14px;
          font-weight: 800;
        }
        .child-btn-personality {
          font-size: 10px;
          font-weight: 500;
          opacity: 0.85;
        }
        .child-select-btn:hover {
          transform: translateY(-3px) scale(1.03);
          filter: brightness(1.1);
        }
        .child-select-btn:active {
          transform: scale(0.93);
        }
        /* ---- Girl variants: softer/warmer hues ---- */
        .child-sensitive-girl {
          background: linear-gradient(135deg, #ec4899 0%, #f9a8d4 50%, #db2777 100%);
          box-shadow: 0 4px 15px rgba(236, 72, 153, 0.35);
        }
        .child-sensitive-girl:hover { box-shadow: 0 8px 25px rgba(236, 72, 153, 0.45); }
        .child-stubborn-girl {
          background: linear-gradient(135deg, #f472b6 0%, #fb923c 50%, #e11d48 100%);
          box-shadow: 0 4px 15px rgba(244, 114, 182, 0.35);
        }
        .child-stubborn-girl:hover { box-shadow: 0 8px 25px rgba(244, 114, 182, 0.45); }
        .child-anxious-girl {
          background: linear-gradient(135deg, #a78bfa 0%, #c4b5fd 50%, #7c3aed 100%);
          box-shadow: 0 4px 15px rgba(167, 139, 250, 0.35);
        }
        .child-anxious-girl:hover { box-shadow: 0 8px 25px rgba(167, 139, 250, 0.45); }
        .child-energetic-girl {
          background: linear-gradient(135deg, #34d399 0%, #a7f3d0 50%, #059669 100%);
          box-shadow: 0 4px 15px rgba(52, 211, 153, 0.35);
        }
        .child-energetic-girl:hover { box-shadow: 0 8px 25px rgba(52, 211, 153, 0.45); }
        .child-calm-girl {
          background: linear-gradient(135deg, #67e8f9 0%, #a5f3fc 50%, #06b6d4 100%);
          box-shadow: 0 4px 15px rgba(103, 232, 249, 0.35);
        }
        .child-calm-girl:hover { box-shadow: 0 8px 25px rgba(103, 232, 249, 0.45); }

        /* ---- Boy variants: deeper/cooler hues ---- */
        .child-sensitive-boy {
          background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #1d4ed8 100%);
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.35);
        }
        .child-sensitive-boy:hover { box-shadow: 0 8px 25px rgba(59, 130, 246, 0.45); }
        .child-stubborn-boy {
          background: linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ea580c 100%);
          box-shadow: 0 4px 15px rgba(245, 158, 11, 0.35);
        }
        .child-stubborn-boy:hover { box-shadow: 0 8px 25px rgba(245, 158, 11, 0.45); }
        .child-anxious-boy {
          background: linear-gradient(135deg, #6366f1 0%, #818cf8 50%, #4f46e5 100%);
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.35);
        }
        .child-anxious-boy:hover { box-shadow: 0 8px 25px rgba(99, 102, 241, 0.45); }
        .child-energetic-boy {
          background: linear-gradient(135deg, #10b981 0%, #34d399 50%, #047857 100%);
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35);
        }
        .child-energetic-boy:hover { box-shadow: 0 8px 25px rgba(16, 185, 129, 0.45); }
        .child-calm-boy {
          background: linear-gradient(135deg, #0284c7 0%, #38bdf8 50%, #0369a1 100%);
          box-shadow: 0 4px 15px rgba(2, 132, 199, 0.35);
        }
        .child-calm-boy:hover { box-shadow: 0 8px 25px rgba(2, 132, 199, 0.45); }

        /* ---- Disabled child buttons (already selected) ---- */
        .child-selected .child-select-btn {
          opacity: 0.45;
          cursor: not-allowed;
          pointer-events: none;
          filter: grayscale(0.5);
        }

        /* ---- Follow-up suggestion buttons ---- */
        .followup-btn {
          display: block;
          width: 100%;
          text-align: right;
          padding: 10px 16px;
          margin: 6px 0;
          background: linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%);
          border: 1.5px solid #e0e7ff;
          border-radius: 14px;
          font-size: 13px;
          font-weight: 500;
          color: #4338ca;
          cursor: pointer;
          transition: all 0.2s ease;
          direction: rtl;
        }
        .followup-btn:hover {
          background: linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%);
          border-color: #a5b4fc;
          transform: translateX(-3px);
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
        }
        .followup-btn:active {
          transform: scale(0.97);
        }
      `}</style>
    </div>
  )
}
