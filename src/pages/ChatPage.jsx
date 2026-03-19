import { useState, useEffect, useRef, useMemo } from 'react'
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

  /* ---- Effects ---- */
  // Load conversations on login
  useEffect(() => {
    if (isLoggedIn) {
      loadConversations()
    }
  }, [isLoggedIn, loadConversations])

  // Auto-select first conversation
  useEffect(() => {
    if (isLoggedIn && conversations.length > 0 && !currentConversation) {
      selectConversation(conversations[0])
    }
  }, [isLoggedIn, conversations, currentConversation, selectConversation])

  // Navigate to onboarding after login if not onboarded
  useEffect(() => {
    if (isLoggedIn && user && !isOnboarded) {
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
  const [loginName, setLoginName] = useState('')
  const [loginEmail, setLoginEmail] = useState('')

  /* ---- Demo names ---- */
  const DEMO_FIRST_NAMES = ['נועה', 'יוסי', 'מיכל', 'אורי', 'דנה', 'עומר', 'שירה', 'איתי', 'רונית', 'גיל', 'תמר', 'אלון', 'ליאת', 'עידו', 'הדס']

  /* ---- Handlers ---- */
  async function handleLogin(e) {
    e?.preventDefault()
    if (!loginName.trim() || !loginEmail.trim()) return
    const u = await login({ name: loginName.trim(), email: loginEmail.trim() })
    if (u && !(u.parentName && u.children?.length > 0 && u.challenges?.length > 0)) {
      navigate('/onboarding')
    }
  }

  async function handleDemoLogin() {
    const name = DEMO_FIRST_NAMES[Math.floor(Math.random() * DEMO_FIRST_NAMES.length)]
    const id = Math.floor(Math.random() * 9000) + 1000
    const email = `demo-${id}@psihologit.app`
    const u = await login({ name, email })
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

  /* ================================================================ */
  /*  LOGIN OVERLAY                                                    */
  /* ================================================================ */
  if (!isLoggedIn) {
    return (
      <div dir="rtl" className="h-screen flex flex-col overflow-hidden bg-background-light">
        {/* Full-screen overlay */}
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary/20 via-purple-500/10 to-pink-500/10 backdrop-blur-md">
          {/* Decorative blobs */}
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl" />

          {/* Glass card */}
          <div className="relative z-10 w-full max-w-md mx-4 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 text-center border border-white/50">
            {/* Logo card – rotated */}
            <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-xl shadow-primary/30 transform rotate-3">
              <span className="material-symbols-outlined text-white text-4xl">psychology</span>
            </div>

            <h1 className="text-3xl font-extrabold text-text-main mb-2">פסיכולוגית בכיס</h1>
            <p className="text-text-secondary mb-8 leading-relaxed">
              העוזרת החכמה להורים ישראליים.<br />
              קבלו הכוונה מקצועית מבוססת AI, בכל רגע.
            </p>

            {/* Simple login form */}
            <form onSubmit={handleLogin} className="space-y-3 text-right">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">שם</label>
                <input
                  type="text"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  placeholder="השם שלך"
                  className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-right"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">אימייל</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="your@email.com"
                  dir="ltr"
                  className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-left"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-l from-primary to-purple-600 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 text-white font-semibold disabled:opacity-50"
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-lg">login</span>
                )}
                <span>{loading ? 'מתחבר...' : 'כניסה'}</span>
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-text-secondary">או</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Demo user button */}
            <button
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-l from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 text-white font-semibold disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">science</span>
              <span>כניסת משתמש דמו</span>
            </button>

            {/* Guest button */}
            <button
              onClick={async () => {
                const u = await loginAsGuest()
                if (u) navigate('/onboarding')
              }}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all duration-200 text-text-secondary font-medium mt-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">person_outline</span>
              <span>כניסה כאורח (3 ימים)</span>
            </button>

            {/* Terms */}
            <p className="mt-6 text-xs text-text-secondary/70 leading-relaxed">
              בכניסה, את/ה מסכים/ה ל
              <a href="#" className="text-primary hover:underline mx-1">תנאי השימוש</a>
              ול
              <a href="#" className="text-primary hover:underline mx-1">מדיניות הפרטיות</a>
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
          <div className="shrink-0 h-12 px-4 flex items-center gap-3 z-10">
            {/* Sidebar toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden size-9 flex items-center justify-center rounded-lg hover:bg-white/60 dark:hover:bg-surface-dark/60 transition-colors"
            >
              <span className="material-symbols-outlined text-text-muted text-xl">menu</span>
            </button>
            {/* Logo - mobile only */}
            <div className="md:hidden flex items-center gap-2">
              <div className="size-7 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-base">psychology</span>
              </div>
              <span className="text-sm font-bold text-text-main dark:text-gray-200">פסיכולוגית בכיס</span>
            </div>
            {/* Temp chat indicator */}
            {isTempChat && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold mr-auto">
                <span className="material-symbols-outlined text-sm">timer</span>
                שיחה זמנית
              </div>
            )}
          </div>

          {/* Messages container */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-6 pb-44 scrollbar-thin">
            {messages.length === 0 ? (
              /* ---- Welcome / Empty state ---- */
              <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-full">
                {/* AI avatar */}
                <div className="mb-6 relative">
                  <div className="size-20 rounded-3xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-2xl shadow-primary/30">
                    <span className="material-symbols-outlined text-white text-4xl">psychology</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 size-5 bg-emerald-500 rounded-full border-2 border-white" />
                </div>

                {/* Welcome card */}
                <div className="relative bg-white dark:bg-surface-dark rounded-2xl shadow-lg w-full overflow-hidden mb-8">
                  {/* Rainbow bar */}
                  <div className="h-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />
                  <div className="p-6 text-center">
                    <h2 className="text-xl font-bold text-text-main mb-2">
                      שלום{user?.parentName ? ` ${user.parentName}` : ''}! איך אוכל לעזור היום?
                    </h2>
                    <p className="text-text-secondary text-sm leading-relaxed">
                      אני כאן כדי לעזור לך עם כל שאלה הורית. ספרו לי מה מטריד אתכם.
                    </p>
                  </div>
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
                          <div className="relative bg-white dark:bg-surface-dark rounded-2xl shadow-md overflow-hidden">
                            {/* Rainbow top bar */}
                            <div className="h-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />
                            <div className="p-4 md:p-5">
                              <div
                                className="text-sm text-text-main dark:text-gray-200 leading-relaxed prose-sm"
                                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                                onClick={(e) => {
                                  if (e.target.classList.contains('child-select-btn')) {
                                    const childName = e.target.dataset.child
                                    if (childName && !sending) {
                                      handleChildSelect(childName)
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
                      <div className="relative bg-white dark:bg-surface-dark rounded-2xl shadow-md overflow-hidden">
                        <div className="h-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />
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
          <div className="absolute bottom-0 inset-x-0 z-20">
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
                    placeholder="ספרו לי מה מטריד אתכם..."
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
                התשובות מבוססות על AI ואינן מחליפות ייעוץ מקצועי. במקרה חירום, פנו לגורם מקצועי.
              </p>
            </div>
          </div>
        </main>

        {/* -------------------------------------------------------- */}
        {/*  SIDEBAR (second in DOM = LEFT in RTL)                     */}
        {/* -------------------------------------------------------- */}
        <aside
          className={`
            fixed top-0 left-0 h-full w-80 bg-white dark:bg-surface-dark border-r border-gray-100 dark:border-gray-800 z-40 flex flex-col
            transform transition-transform duration-300 ease-in-out
            md:relative md:translate-x-0 md:flex md:shrink-0 md:z-auto md:w-80
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            ${sidebarOpen ? '' : 'hidden md:flex'}
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
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="size-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-gray-400 text-3xl">chat_bubble_outline</span>
                </div>
                <p className="text-sm text-text-secondary">
                  אין שיחות עדיין.<br />התחילו שיחה חדשה!
                </p>
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
                onClick={logout}
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
          align-items: center;
          gap: 8px;
          padding: 10px 22px;
          margin: 4px 4px;
          color: white;
          border: none;
          border-radius: 9999px;
          font-weight: 800;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .child-select-btn:hover {
          transform: translateY(-3px) scale(1.03);
          filter: brightness(1.1);
        }
        .child-select-btn:active {
          transform: scale(0.93);
        }
        .child-select-btn::before {
          font-family: "Material Symbols Outlined";
          font-size: 20px;
        }
        /* sensitive - רגיש/ה - ורוד רך */
        .child-sensitive {
          background: linear-gradient(135deg, #ec4899 0%, #f472b6 50%, #db2777 100%);
          box-shadow: 0 4px 15px rgba(236, 72, 153, 0.35);
        }
        .child-sensitive:hover { box-shadow: 0 8px 25px rgba(236, 72, 153, 0.45); }
        .child-sensitive::before { content: "\\e87f"; }
        /* stubborn - עקשן/ית - כתום חזק */
        .child-stubborn {
          background: linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ea580c 100%);
          box-shadow: 0 4px 15px rgba(245, 158, 11, 0.35);
        }
        .child-stubborn:hover { box-shadow: 0 8px 25px rgba(245, 158, 11, 0.45); }
        .child-stubborn::before { content: "\\ea3b"; }
        /* anxious - חרדתי/ת - כחול עמוק */
        .child-anxious {
          background: linear-gradient(135deg, #6366f1 0%, #818cf8 50%, #4f46e5 100%);
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.35);
        }
        .child-anxious:hover { box-shadow: 0 8px 25px rgba(99, 102, 241, 0.45); }
        .child-anxious::before { content: "\\f0e2"; }
        /* energetic - אנרגטי/ת - ירוק חי */
        .child-energetic {
          background: linear-gradient(135deg, #10b981 0%, #34d399 50%, #059669 100%);
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35);
        }
        .child-energetic:hover { box-shadow: 0 8px 25px rgba(16, 185, 129, 0.45); }
        .child-energetic::before { content: "\\e566"; }
        /* calm - רגוע/ה - טורקיז */
        .child-calm {
          background: linear-gradient(135deg, #06b6d4 0%, #22d3ee 50%, #0891b2 100%);
          box-shadow: 0 4px 15px rgba(6, 182, 212, 0.35);
        }
        .child-calm:hover { box-shadow: 0 8px 25px rgba(6, 182, 212, 0.45); }
        .child-calm::before { content: "\\e1bd"; }
      `}</style>
    </div>
  )
}
