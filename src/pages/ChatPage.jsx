import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../shared/authStore'
import { useChatStore } from '../../shared/chatStore'
import { formatTime, renderMarkdown, extractAddChildData, extractUpdateChildData, extractFollowups, extractCommonMistake, extractFollowUpQuestion, PERSONALITIES } from '../../shared/constants'
import { api } from '../../shared/api'
import allSuggestions from '../../shared/suggestions.json'

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
/*  AddChildSheet - Bottom sheet (mobile) / Modal (desktop)            */
/* ================================================================== */
function AddChildSheet({ data, onSubmit, onClose }) {
  const [name, setName] = useState(data?.name || '')
  const [age, setAge] = useState(data?.age || '')
  const [gender, setGender] = useState('boy')
  const [personality, setPersonality] = useState(data?.personality || '')
  const [saving, setSaving] = useState(false)
  const [sheetVisible, setSheetVisible] = useState(false)
  const sheetRef = useRef(null)

  // Animate in
  useEffect(() => {
    requestAnimationFrame(() => setSheetVisible(true))
  }, [])

  function handleClose() {
    setSheetVisible(false)
    setTimeout(onClose, 300)
  }

  async function handleSubmit() {
    if (!name.trim() || !age) return
    setSaving(true)
    try {
      const now = new Date()
      const birthYear = now.getFullYear() - parseInt(age, 10)
      const birthDate = new Date(birthYear, now.getMonth(), 1).toISOString()
      await api.addChild({
        name: name.trim(),
        birthDate,
        gender,
        personality: personality || 'calm',
      })
      // Update auth store with new child
      const currentUser = useAuthStore.getState().user
      if (currentUser) {
        useAuthStore.setState({
          user: {
            ...currentUser,
            children: [...(currentUser.children || []), {
              name: name.trim(), birthDate, gender, personality: personality || 'calm'
            }]
          }
        })
      }
      onSubmit({ name: name.trim(), age, gender, personality: personality || 'calm' })
      handleClose()
    } catch {
      setSaving(false)
    }
  }

  // Touch drag for mobile bottom sheet
  const dragStart = useRef(null)
  function onTouchStart(e) { dragStart.current = e.touches[0].clientY }
  function onTouchMove(e) {
    if (!dragStart.current || !sheetRef.current) return
    const diff = e.touches[0].clientY - dragStart.current
    if (diff > 0) sheetRef.current.style.transform = `translateY(${diff}px)`
  }
  function onTouchEnd(e) {
    if (!dragStart.current || !sheetRef.current) return
    const diff = e.changedTouches[0].clientY - dragStart.current
    if (diff > 120) handleClose()
    else sheetRef.current.style.transform = ''
    dragStart.current = null
  }

  const personalityOptions = PERSONALITIES

  return (
    <div className={`fixed inset-0 z-[200] transition-all duration-300 ${sheetVisible ? 'bg-black/40 backdrop-blur-sm' : 'bg-transparent'}`} onClick={handleClose}>
      {/* Desktop Modal */}
      <div className="hidden md:flex items-center justify-center h-full p-4">
        <div
          className={`relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transition-all duration-300 ${
            sheetVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
          }`}
          onClick={e => e.stopPropagation()}
        >
          {/* Gradient header */}
          <div className="h-2 bg-gradient-to-r from-primary via-purple-500 to-pink-400" />
          <div className="p-7">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="size-14 rounded-2xl bg-gradient-to-br from-primary/15 to-purple-500/15 flex items-center justify-center">
                <span className="material-symbols-rounded text-primary text-3xl">person_add</span>
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">ילד חדש זוהה!</h2>
                <p className="text-sm text-gray-500">השלימו את הפרטים כדי שנוכל לעזור טוב יותר</p>
              </div>
              <button onClick={handleClose} className="mr-auto size-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-gray-400">close</span>
              </button>
            </div>

            {/* Form */}
            <div className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">שם הילד/ה</label>
                <div className="relative">
                  <span className="material-symbols-rounded absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">badge</span>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full h-12 pr-11 pl-4 rounded-xl border-2 border-gray-200 bg-gray-50/50 text-sm font-medium outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                    placeholder="לדוגמה: יוסי"
                    autoFocus
                  />
                </div>
              </div>

              {/* Age */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">גיל</label>
                <div className="relative">
                  <span className="material-symbols-rounded absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">cake</span>
                  <input
                    type="number"
                    min="0"
                    max="18"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    className="w-full h-12 pr-11 pl-4 rounded-xl border-2 border-gray-200 bg-gray-50/50 text-sm font-medium outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                    placeholder="גיל בשנים"
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">מין</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGender('boy')}
                    className={`h-12 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                      gender === 'boy'
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm shadow-blue-500/10'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <span className="material-symbols-rounded text-lg">boy</span>
                    בן
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('girl')}
                    className={`h-12 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                      gender === 'girl'
                        ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-sm shadow-pink-500/10'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <span className="material-symbols-rounded text-lg">girl</span>
                    בת
                  </button>
                </div>
              </div>

              {/* Personality */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">אופי</label>
                <div className="flex flex-wrap gap-2">
                  {personalityOptions.map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPersonality(p.value)}
                      className={`px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                        personality === p.value
                          ? 'border-primary bg-primary/8 text-primary shadow-sm shadow-primary/10'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-7">
              <button
                onClick={handleClose}
                className="flex-1 h-12 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                לא עכשיו
              </button>
              <button
                onClick={handleSubmit}
                disabled={!name.trim() || !age || saving}
                className="flex-1 h-12 rounded-xl font-bold text-white bg-gradient-to-l from-primary to-purple-600 shadow-lg shadow-primary/25 hover:shadow-xl hover:brightness-110 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {saving ? (
                  <span className="material-symbols-rounded animate-spin text-lg">progress_activity</span>
                ) : (
                  <span className="material-symbols-rounded text-lg">check_circle</span>
                )}
                {saving ? 'שומר...' : 'הוספה'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet */}
      <div className="md:hidden flex flex-col justify-end h-full" onClick={handleClose}>
        <div
          ref={sheetRef}
          className={`bg-white rounded-t-3xl shadow-2xl overflow-hidden transition-transform duration-300 ease-out ${
            sheetVisible ? 'translate-y-0' : 'translate-y-full'
          }`}
          style={{ maxHeight: '90vh' }}
          onClick={e => e.stopPropagation()}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
          </div>

          {/* Gradient bar */}
          <div className="h-1.5 bg-gradient-to-r from-primary via-purple-500 to-pink-400 mx-6 rounded-full" />

          <div className="p-6 pb-8 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 40px)' }}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="size-12 rounded-2xl bg-gradient-to-br from-primary/15 to-purple-500/15 flex items-center justify-center shrink-0">
                <span className="material-symbols-rounded text-primary text-2xl">person_add</span>
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">ילד חדש זוהה!</h2>
                <p className="text-xs text-gray-500">השלימו את הפרטים</p>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">שם הילד/ה</label>
                <div className="relative">
                  <span className="material-symbols-rounded absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">badge</span>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full h-12 pr-11 pl-4 rounded-xl border-2 border-gray-200 bg-gray-50/50 text-sm font-medium outline-none focus:border-primary focus:bg-white transition-all"
                    placeholder="לדוגמה: יוסי"
                  />
                </div>
              </div>

              {/* Age + Gender row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">גיל</label>
                  <div className="relative">
                    <span className="material-symbols-rounded absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">cake</span>
                    <input
                      type="number"
                      min="0"
                      max="18"
                      value={age}
                      onChange={e => setAge(e.target.value)}
                      className="w-full h-12 pr-11 pl-4 rounded-xl border-2 border-gray-200 bg-gray-50/50 text-sm font-medium outline-none focus:border-primary focus:bg-white transition-all"
                      placeholder="שנים"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">מין</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setGender('boy')}
                      className={`h-12 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                        gender === 'boy'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-500'
                      }`}
                    >
                      <span className="material-symbols-rounded text-base">boy</span>
                      בן
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('girl')}
                      className={`h-12 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                        gender === 'girl'
                          ? 'border-pink-500 bg-pink-50 text-pink-700'
                          : 'border-gray-200 text-gray-500'
                      }`}
                    >
                      <span className="material-symbols-rounded text-base">girl</span>
                      בת
                    </button>
                  </div>
                </div>
              </div>

              {/* Personality */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">אופי</label>
                <div className="flex flex-wrap gap-2">
                  {personalityOptions.map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPersonality(p.value)}
                      className={`px-3.5 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                        personality === p.value
                          ? 'border-primary bg-primary/8 text-primary'
                          : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleClose}
                className="flex-1 h-12 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                לא עכשיו
              </button>
              <button
                onClick={handleSubmit}
                disabled={!name.trim() || !age || saving}
                className="flex-1 h-12 rounded-xl font-bold text-white bg-gradient-to-l from-primary to-purple-600 shadow-lg shadow-primary/25 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <span className="material-symbols-rounded animate-spin text-lg">progress_activity</span>
                ) : (
                  <span className="material-symbols-rounded text-lg">check_circle</span>
                )}
                {saving ? 'שומר...' : 'הוספה'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
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
  const loginOffline = useAuthStore((s) => s.loginOffline)
  const dbError = useAuthStore((s) => s.dbError)
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
  const [showScrollBtn, setShowScrollBtn] = useState(false)

  /* ---- Derived ---- */
  const grouped = useMemo(() => groupConversationsByDate(conversations), [conversations])
  // Track if a child was already selected in this conversation
  const childAlreadySelected = useMemo(() => {
    return messages.some(m => m.role === 'user' && /^אני מדבר\/ת על /.test(m.content))
  }, [messages])

  // Detect active child from messages (last assistant message with activeChildName, or from user selection)
  const activeChildName = useMemo(() => {
    // Check from newest messages - find the last AI response with activeChildName
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant' && messages[i].activeChildName) {
        return messages[i].activeChildName
      }
    }
    // Fallback: check user's child selection messages
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        const match = messages[i].content.match(/^אני מדבר\/ת על (.+)$/)
        if (match) return match[1].trim()
      }
    }
    // If only one child, default to that
    if (user?.children?.length === 1) return user.children[0].name
    return null
  }, [messages, user])

  const [showChildPicker, setShowChildPicker] = useState(false)

  // Add child detection from AI responses
  const [addChildData, setAddChildData] = useState(null) // { name, age, personality }
  const [dismissedChildren, setDismissedChildren] = useState(new Set())
  const lastCheckedMsgId = useRef(null)
  // Update child detection from AI responses
  const [updateChildData, setUpdateChildData] = useState(null) // { name, field, value, childId }
  const [dismissedUpdates, setDismissedUpdates] = useState(new Set())

  useEffect(() => {
    if (messages.length === 0 || sending) return
    const lastMsg = messages[messages.length - 1]
    if (lastMsg.role !== 'assistant' || lastMsg.id === lastCheckedMsgId.current) return
    lastCheckedMsgId.current = lastMsg.id

    // Check for new child
    const childData = extractAddChildData(lastMsg.content)
    if (childData) {
      const isRegistered = user?.children?.some(c => c.name === childData.name)
      if (!isRegistered && !dismissedChildren.has(childData.name)) {
        setAddChildData(childData)
        return
      }
    }

    // Check for child update
    const updateData = extractUpdateChildData(lastMsg.content)
    if (updateData) {
      const existingChild = user?.children?.find(c => c.name === updateData.name)
      if (existingChild) {
        const updateKey = `${updateData.name}:${updateData.field}:${updateData.value}`
        if (!dismissedUpdates.has(updateKey)) {
          setUpdateChildData({ ...updateData, childId: existingChild.id })
        }
      }
    }
  }, [messages, sending, user, dismissedChildren, dismissedUpdates])

  // Long-press context menu for conversations
  const [contextMenu, setContextMenu] = useState(null) // { convId, convTitle, x, y }
  const [deleteConfirm, setDeleteConfirm] = useState(null) // { convId, convTitle }
  const [editingConv, setEditingConv] = useState(null) // { convId, title }
  const longPressTimer = useRef(null)

  /* ---- Effects ---- */
  // Load conversations on login (only after user is validated by init)
  // Offline users go straight to temp chat — no DB available
  useEffect(() => {
    if (isLoggedIn && user) {
      if (user.isOffline) {
        startTempChat()
      } else {
        loadConversations()
      }
    }
  }, [isLoggedIn, user, loadConversations, startTempChat])

  // On landing, always start with a fresh new conversation view (no auto-select)
  // The user sees the welcome screen and can start typing or pick an old chat from sidebar

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

  // Scroll position detection for "scroll to bottom" button
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handleScroll = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
      setShowScrollBtn(distFromBottom > 200)
    }
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [])

  // Time-of-day greeting
  const timeGreeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 6) return 'לילה טוב'
    if (h < 12) return 'בוקר טוב'
    if (h < 17) return 'צהריים טובים'
    if (h < 21) return 'ערב טוב'
    return 'לילה טוב'
  }, [])

  // Pick 4 random suggestions per session
  const randomSuggestions = useMemo(() => {
    const shuffled = [...allSuggestions].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 4)
  }, [])

  // Close child picker on outside click
  useEffect(() => {
    if (!showChildPicker) return
    const handler = (e) => {
      if (!e.target.closest('.relative')) setShowChildPicker(false)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [showChildPicker])

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
          width: Math.min(400, window.innerWidth - 48),
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

  /* ---- Long-press handlers for conversations ---- */
  function handleConvLongPressStart(e, conv) {
    longPressTimer.current = setTimeout(() => {
      const rect = e.currentTarget.getBoundingClientRect()
      setContextMenu({
        convId: conv.id,
        convTitle: conv.title || 'שיחה חדשה',
        x: rect.left,
        y: rect.bottom,
      })
    }, 500)
  }
  function handleConvLongPressEnd() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  async function handleDeleteConversation(convId) {
    try {
      await api.deleteConversation(convId)
      useChatStore.setState(state => {
        const filtered = state.conversations.filter(c => c.id !== convId)
        return {
          conversations: filtered,
          currentConversation: state.currentConversation?.id === convId ? null : state.currentConversation,
          messages: state.currentConversation?.id === convId ? [] : state.messages,
        }
      })
      setDeleteConfirm(null)
    } catch {
      // error
    }
  }

  async function handleRenameConversation() {
    if (!editingConv || !editingConv.title.trim()) return
    try {
      await api.renameConversation(editingConv.convId, editingConv.title.trim())
      useChatStore.setState(state => ({
        conversations: state.conversations.map(c =>
          c.id === editingConv.convId ? { ...c, title: editingConv.title.trim() } : c
        ),
        currentConversation: state.currentConversation?.id === editingConv.convId
          ? { ...state.currentConversation, title: editingConv.title.trim() }
          : state.currentConversation,
      }))
      setEditingConv(null)
    } catch {
      // error
    }
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
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main mb-1 anim-fade-in-up anim-delay-2">הורות בכיס</h1>
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

            {/* DB error fallback — offline mode */}
            {dbError && (
              <button
                onClick={loginOffline}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-amber-50 border border-amber-300 rounded-2xl text-amber-700 font-semibold text-sm mb-4 hover:bg-amber-100 active:scale-[0.98] transition-all"
              >
                <span className="material-symbols-rounded text-base">cloud_off</span>
                <span>שגיאה ב-DB — כניסה ללא שמירה</span>
              </button>
            )}

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
              <Link to="/terms" className="text-primary hover:underline mx-0.5">תנאי השימוש</Link>
              ול
              <Link to="/privacy" className="text-primary hover:underline mx-0.5">מדיניות הפרטיות</Link>
            </p>
            <Link to="/about" className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-text-muted/60 hover:text-primary transition-colors no-underline">
              <span className="material-symbols-rounded text-xs">info</span>
              קצת עלינו
            </Link>
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
          <div className="shrink-0 h-14 px-4 flex items-center gap-3 z-10 bg-white/70 dark:bg-surface-dark/70 backdrop-blur-md border-b border-gray-100/40 dark:border-gray-800/30">
            {/* Sidebar toggle — more visible on mobile */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden size-9 flex items-center justify-center rounded-xl bg-white dark:bg-surface-dark shadow-sm hover:shadow-md transition-all"
            >
              <span className="material-symbols-rounded text-primary text-xl">menu</span>
            </button>
            {/* Logo - mobile only */}
            <div className="md:hidden flex items-center gap-2">
              <div className="size-8 bg-gradient-to-br from-primary/15 to-purple-500/15 rounded-xl flex items-center justify-center">
                <span className="material-symbols-rounded text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-text-main dark:text-gray-200 leading-tight">הורות בכיס</span>
                <span className="text-[10px] text-emerald-500 font-medium leading-tight flex items-center gap-1">
                  <span className="size-1.5 bg-emerald-400 rounded-full inline-block"></span>
                  מקשיבה
                </span>
              </div>
            </div>
            {/* Active child indicator */}
            {isLoggedIn && activeChildName && !isTempChat && (
              <div className="relative mr-auto">
                <button
                  onClick={() => setShowChildPicker(!showChildPicker)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 border border-pink-200/60 text-pink-700 rounded-full text-xs font-bold hover:bg-pink-100 transition-all"
                >
                  <span className="material-symbols-rounded text-sm">child_care</span>
                  <span>{activeChildName}</span>
                  <span className="material-symbols-rounded text-sm text-pink-400">edit</span>
                </button>
                {showChildPicker && user?.children?.length > 1 && (
                  <div className="absolute top-full mt-1 left-0 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50 min-w-[140px] anim-scale-in">
                    {user.children.map(child => (
                      <button
                        key={child.id || child.name}
                        onClick={() => {
                          handleChildSelect(child.name)
                          setShowChildPicker(false)
                        }}
                        className={`w-full text-right px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                          child.name === activeChildName ? 'text-primary font-bold bg-primary/5' : 'text-gray-700'
                        }`}
                      >
                        <span className={`material-symbols-rounded text-base ${
                          child.gender === 'girl' ? 'text-pink-500' : 'text-blue-500'
                        }`}>
                          {child.gender === 'girl' ? 'girl' : 'boy'}
                        </span>
                        {child.name}
                        {child.name === activeChildName && (
                          <span className="material-symbols-rounded text-primary text-sm mr-auto">check</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
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
            {/* Temp chat toggle button */}
            {!isGuest && (
              <button
                onClick={() => {
                  if (isTempChat) {
                    // Exit temp chat - go back to normal
                    useChatStore.setState({ isTempChat: false, currentConversation: null, messages: [] })
                  } else {
                    startTempChat()
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isTempChat
                    ? 'bg-amber-100 text-amber-700 border border-amber-300 shadow-sm'
                    : 'bg-gray-100 text-gray-500 hover:bg-amber-50 hover:text-amber-600 border border-transparent hover:border-amber-200'
                } ${!activeChildName ? 'mr-auto' : ''}`}
                title={isTempChat ? 'יציאה משיחה זמנית' : 'שיחה זמנית - לא נשמרת'}
              >
                <span className="material-symbols-rounded text-sm">chat_bubble</span>
                {isTempChat && <span className="material-symbols-rounded text-xs">close</span>}
              </button>
            )}
          </div>

          {/* Messages container */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-8 pt-5 pb-44 scrollbar-thin">
            {messages.length === 0 ? (
              /* ---- Welcome / Empty state ---- */
              <div className="max-w-2xl mx-auto flex flex-col items-center anim-fade-in px-2">
                {/* Welcome card with integrated avatar — warm and personal */}
                <div className="relative bg-white dark:bg-surface-dark rounded-3xl shadow-lg shadow-primary/8 w-full mb-4 anim-fade-in-up anim-delay-1">
                  <div className="px-5 pt-5 pb-4 sm:px-8 sm:pt-6 sm:pb-5 text-center">
                    <p className="text-sm text-primary/80 font-bold mb-1.5">{timeGreeting}{user?.parentName && !isGuest ? ` ${user.parentName}` : ''} 👋</p>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-text-main mb-3 leading-tight">
                      איך אוכל לעזור היום?
                    </h2>
                    <p className="text-text-muted text-sm leading-relaxed max-w-sm mx-auto">
                      {user?.children?.length > 0
                        ? `אני כאן בשבילך, לדבר על ${user.children.map(c => c.name).join(' ו')} או על כל נושא אחר. זה מקום בטוח לשאול הכל.`
                        : 'מקום בטוח ופרטי לדבר על כל מה שמטריד אתכם כהורים.'
                      }
                    </p>

                    {/* Safe space indicator — inside the card */}
                    <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                      <span className="material-symbols-rounded text-emerald-500 text-sm">verified_user</span>
                      <span className="text-xs text-text-muted font-medium">שיחה פרטית ומאובטחת</span>
                    </div>
                  </div>
                </div>

                {/* Quick suggestion chips — desktop: cards grid, mobile: compact pill chips */}
                {/* Desktop version */}
                <div className="hidden sm:grid w-full grid-cols-2 gap-3 anim-fade-in-up anim-delay-3">
                  {randomSuggestions.map((s, i) => (
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
                      className="group relative flex flex-col items-start gap-2.5 w-full p-4 bg-white dark:bg-surface-dark border-2 border-gray-100 dark:border-gray-700/50 rounded-2xl text-right active:scale-[0.97] transition-all duration-300 disabled:opacity-50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/8 hover:-translate-y-0.5 anim-fade-in-up"
                      style={{ animationDelay: `${0.3 + i * 0.08}s` }}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <span className="flex items-center justify-center size-10 rounded-xl bg-primary/8 group-hover:bg-primary/15 transition-colors duration-300 text-xl">{s.emoji}</span>
                        <span className="flex-1 text-[13.5px] font-medium text-text-main dark:text-gray-200 leading-relaxed">{s.text}</span>
                      </div>
                      <div className="w-full flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <span className="text-[11px] text-primary/60 font-bold flex items-center gap-1">
                          לחצו לשיחה
                          <span className="material-symbols-rounded text-sm">arrow_back</span>
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                {/* Mobile version — stacked compact list */}
                <div className="sm:hidden w-full space-y-2 anim-fade-in-up anim-delay-3">
                  {randomSuggestions.map((s, i) => (
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
                      className="flex items-center gap-3 w-full px-4 py-3 bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm active:scale-[0.97] transition-transform duration-150 disabled:opacity-50 text-right"
                    >
                      <span className="text-lg shrink-0">{s.emoji}</span>
                      <span className="flex-1 text-[13px] font-medium text-text-main dark:text-gray-200 leading-snug">{s.text}</span>
                      <span className="material-symbols-rounded text-gray-300 text-sm shrink-0">arrow_back</span>
                    </button>
                  ))}
                </div>

              </div>
            ) : (
              /* ---- Messages list ---- */
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.map((msg, idx) => {
                  const isUser = msg.role === 'user'
                  const isFirst = idx === 0
                  const isLastAI = !isUser && (idx === messages.length - 1 || messages[idx + 1]?.role === 'user')
                  return (
                    <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-3 msg-entrance`} style={{ animationDelay: `${Math.min(idx * 50, 300)}ms` }}>
                      {/* AI avatar */}
                      {!isUser && (
                        <div className="shrink-0 size-9 rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-pink-400 flex items-center justify-center shadow-lg shadow-primary/20 mt-1">
                          <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                        </div>
                      )}

                      <div className={`max-w-[92%] sm:max-w-[82%] ${isUser ? 'ml-auto' : ''}`}>
                        {isUser ? (
                          /* User bubble — warm, approachable */
                          <div className="bg-gradient-to-l from-primary to-purple-500 text-white px-5 py-3.5 rounded-2xl rounded-tl-md shadow-lg shadow-primary/15">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        ) : (
                          /* AI card — clean, trustworthy, warm */
                          <div className="relative bg-white dark:bg-surface-dark rounded-2xl rounded-tr-md shadow-md shadow-gray-200/60 dark:shadow-none hover:shadow-lg transition-shadow duration-300 overflow-hidden ai-card-enter border border-gray-100 dark:border-gray-700/50">
                            <div className="h-[3px] bg-gradient-to-r from-primary/30 via-purple-400/30 to-pink-300/30" />
                            <div className="p-5 md:p-6">
                              <div
                                className={`text-[14px] text-text-main dark:text-gray-200 leading-[1.8] prose-sm${childAlreadySelected ? ' child-selected' : ''}`}
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
                                  // followup buttons are now rendered outside the bubble as React components
                                }}
                              />
                              {/* Common mistake — subtle note */}
                              {(() => {
                                const mistake = extractCommonMistake(msg.content)
                                if (!mistake) return null
                                return (
                                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50 flex items-start gap-2">
                                    <span className="material-symbols-rounded text-amber-500 text-sm mt-0.5 shrink-0">lightbulb</span>
                                    <p className="text-xs text-text-muted dark:text-gray-400 leading-relaxed">
                                      <span className="font-semibold text-amber-600 dark:text-amber-400">טעות נפוצה: </span>
                                      {mistake}
                                    </p>
                                  </div>
                                )
                              })()}
                            </div>
                            {/* Actions — visible on mobile, hover on desktop */}
                            <div className="flex items-center gap-1 px-5 pb-4 pt-1 border-t border-gray-50 dark:border-gray-800 md:opacity-0 md:hover:opacity-100 md:focus-within:opacity-100 transition-opacity duration-200 action-bar">
                              <button
                                onClick={() => handleCopy(msg.content, msg.id)}
                                className="size-8 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                title="העתק"
                              >
                                <span className="material-symbols-outlined text-gray-400 text-[15px]">
                                  {copiedId === msg.id ? 'check_circle' : 'content_copy'}
                                </span>
                              </button>
                              <button
                                onClick={() => handleLike(msg.id)}
                                className="size-8 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                title="אהבתי"
                              >
                                <span
                                  className={`material-symbols-outlined text-[15px] transition-colors ${
                                    likedIds.has(msg.id) ? 'text-pink-500' : 'text-gray-400'
                                  }`}
                                  style={likedIds.has(msg.id) ? { fontVariationSettings: "'FILL' 1" } : {}}
                                >
                                  favorite
                                </span>
                              </button>
                              {msg.timestamp && (
                                <span className="ml-auto text-[11px] text-gray-300 dark:text-gray-600">{formatTime(msg.timestamp)}</span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Follow-up questions — outside the bubble */}
                        {!isUser && (() => {
                          const followups = extractFollowups(msg.content)
                          if (followups.length === 0) return null
                          return (
                            <div className="mt-3 space-y-2 pr-1">
                              {followups.map((q, fi) => (
                                <button
                                  key={fi}
                                  onClick={() => { if (!sending) sendMessage(q) }}
                                  disabled={sending}
                                  className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-surface-dark border-2 border-primary/15 rounded-2xl text-right hover:border-primary/40 hover:bg-primary/[0.03] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 group"
                                >
                                  <span className="shrink-0 size-7 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                    <span className="material-symbols-rounded text-primary text-base">chat_bubble</span>
                                  </span>
                                  <span className="flex-1 text-[13px] font-medium text-text-main dark:text-gray-300 leading-relaxed">{q}</span>
                                  <span className="material-symbols-rounded text-gray-300 text-base shrink-0 group-hover:text-primary/60 group-hover:translate-x-[-2px] transition-all">arrow_back</span>
                                </button>
                              ))}
                            </div>
                          )
                        })()}

                        {/* Timestamp for user messages */}
                        {isUser && msg.timestamp && (
                          <p className="text-[11px] text-gray-400 mt-1.5 px-1 text-left">{formatTime(msg.timestamp)}</p>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Streaming AI response — empathetic thinking state */}
                {sending && (
                  <div className="flex items-start gap-3 msg-entrance">
                    <div className="shrink-0 size-9 rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-pink-400 flex items-center justify-center shadow-lg shadow-primary/20 mt-1 avatar-breathing">
                      <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                    </div>
                    <div className="max-w-[92%] sm:max-w-[82%]">
                      <div className="relative bg-white dark:bg-surface-dark rounded-2xl rounded-tr-md shadow-md shadow-gray-200/60 dark:shadow-none overflow-hidden ai-card-enter border border-gray-100 dark:border-gray-700/50">
                        <div className="h-[3px] bg-gradient-to-r from-primary/30 via-purple-400/30 to-pink-300/30" />
                        <div className="p-5 md:p-6">
                          {streamingContent ? (
                            <div
                              className="text-[14px] text-text-main dark:text-gray-200 leading-[1.8] prose-sm streaming-cursor"
                              dangerouslySetInnerHTML={{ __html: renderMarkdown(streamingContent) }}
                            />
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5">
                                <span className="typing-dot size-2 bg-primary/60 rounded-full" style={{ animationDelay: '0ms' }} />
                                <span className="typing-dot size-2 bg-primary/60 rounded-full" style={{ animationDelay: '150ms' }} />
                                <span className="typing-dot size-2 bg-primary/60 rounded-full" style={{ animationDelay: '300ms' }} />
                              </div>
                              <span className="text-xs text-text-muted thinking-text">חושבת על זה...</span>
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

          {/* Scroll to bottom button */}
          {showScrollBtn && messages.length > 0 && (
            <button
              onClick={() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }) }}
              className="absolute bottom-36 left-1/2 -translate-x-1/2 z-20 size-10 flex items-center justify-center rounded-full bg-white dark:bg-surface-dark shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-all duration-200 anim-fade-in"
            >
              <span className="material-symbols-rounded text-primary text-lg">keyboard_arrow_down</span>
            </button>
          )}

          {/* ---- INPUT AREA ---- */}
          <div className="absolute bottom-0 inset-x-0 z-20 anim-fade-in-up">
            {/* Gradient fade — larger for more breathing room */}
            <div className="h-12 bg-gradient-to-t from-chat-bg dark:from-background-dark to-transparent pointer-events-none" />

            <div className="bg-chat-bg dark:bg-background-dark px-3 sm:px-4 md:px-8 pb-5">
              {/* Follow-up question — above input */}
              {(() => {
                const lastAiMsg = [...messages].reverse().find(m => m.role === 'assistant')
                const fuq = lastAiMsg ? extractFollowUpQuestion(lastAiMsg.content) : null
                if (!fuq || sending) return null
                return (
                  <div className="max-w-3xl mx-auto mb-2">
                    <button
                      onClick={() => { if (!sending) sendMessage(fuq) }}
                      className="w-full flex items-start gap-2.5 px-4 py-2.5 bg-white dark:bg-surface-dark border border-primary/20 rounded-xl text-right hover:border-primary/40 active:scale-[0.99] transition-all"
                    >
                      <span className="material-symbols-rounded text-primary text-sm mt-0.5 shrink-0">reply</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-semibold text-primary block mb-0.5">הגב לשאלה</span>
                        <span className="text-xs text-text-main dark:text-gray-300 leading-relaxed">{fuq}</span>
                      </div>
                    </button>
                  </div>
                )
              })()}
              <form
                onSubmit={handleSend}
                className="max-w-3xl mx-auto relative bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg shadow-gray-200/50 dark:shadow-none focus-within:border-primary/40 focus-within:shadow-xl focus-within:shadow-primary/8 transition-all duration-300"
              >
                <div className="flex items-end gap-2 p-2.5">
                  {/* Textarea */}
                  <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="ספרו לי מה מטריד אתכם..."
                    rows={1}
                    className="flex-1 resize-none py-2.5 px-2 text-sm text-text-main dark:text-gray-200 placeholder:text-gray-400/70 bg-transparent outline-none leading-relaxed max-h-40"
                    dir="rtl"
                  />

                  {/* Send button — grows slightly when active */}
                  <button
                    type="submit"
                    disabled={!inputText.trim() || sending}
                    className={`shrink-0 size-10 flex items-center justify-center rounded-xl transition-all duration-300 ${
                      inputText.trim() && !sending
                        ? 'bg-gradient-to-l from-primary to-purple-500 text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-105'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-default'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl" style={{ transform: 'scaleX(-1)' }}>
                      {sending ? 'more_horiz' : 'send'}
                    </span>
                  </button>
                </div>
              </form>

              {/* Disclaimer — softer, less intrusive */}
              <div className="max-w-3xl mx-auto flex items-center justify-center gap-1.5 mt-3">
                <span className="material-symbols-rounded text-gray-300 text-xs">info</span>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  מבוסס AI - אינו מחליף ייעוץ מקצועי.
                  <span className="text-rose-400 font-semibold"> במצב חירום חייגו 1201</span>
                </p>
              </div>
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
              <span className="font-black text-base text-text-main dark:text-gray-100">הורות בכיס</span>
              {/* Close sidebar on mobile */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="md:hidden mr-auto size-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="material-symbols-outlined text-text-muted text-lg">close</span>
              </button>
            </div>

            {/* New conversation button */}
            <button
              onClick={handleNewConversation}
              className="w-full flex items-center justify-center gap-2 px-3 py-3 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:brightness-110 transition-all duration-200"
            >
              <span className="material-symbols-outlined text-xl">add_comment</span>
              שיחה חדשה
            </button>
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
                          if (!contextMenu) {
                            selectConversation(conv)
                            setSidebarOpen(false)
                          }
                        }}
                        onTouchStart={(e) => handleConvLongPressStart(e, conv)}
                        onTouchEnd={handleConvLongPressEnd}
                        onContextMenu={(e) => {
                          e.preventDefault()
                          const rect = e.currentTarget.getBoundingClientRect()
                          setContextMenu({
                            convId: conv.id,
                            convTitle: conv.title || 'שיחה חדשה',
                            x: rect.left,
                            y: rect.bottom,
                          })
                        }}
                        className={`
                          w-full text-right px-3 py-2.5 rounded-xl mb-0.5 transition-all duration-150 group select-none
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

          {/* Context menu for long-press on conversations */}
          {contextMenu && (
            <>
              <div className="fixed inset-0 z-50" onClick={() => setContextMenu(null)} />
              <div
                className="fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-200 py-1 min-w-[160px] anim-scale-in"
                style={{ top: contextMenu.y, right: 16 }}
              >
                <button
                  onClick={() => {
                    setEditingConv({ convId: contextMenu.convId, title: contextMenu.convTitle })
                    setContextMenu(null)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg text-blue-500">edit</span>
                  שינוי שם
                </button>
                <button
                  onClick={() => {
                    setDeleteConfirm({ convId: contextMenu.convId, convTitle: contextMenu.convTitle })
                    setContextMenu(null)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                  מחיקה
                </button>
              </div>
            </>
          )}

          {/* Delete confirmation popup */}
          {deleteConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
              <div className="relative bg-white rounded-2xl shadow-xl p-5 sm:p-6 w-[92vw] sm:w-full max-w-sm anim-scale-in" onClick={e => e.stopPropagation()}>
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-red-600 text-3xl">warning</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 text-center mb-2">מחיקת שיחה</h3>
                <p className="text-sm text-gray-500 text-center mb-6">
                  האם אתה בטוח שברצונך למחוק את השיחה
                  <strong className="block mt-1">"{deleteConfirm.convTitle}"</strong>
                  <span className="text-red-500 text-xs mt-1 block">פעולה זו בלתי הפיכה</span>
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 h-11 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    ביטול
                  </button>
                  <button
                    onClick={() => handleDeleteConversation(deleteConfirm.convId)}
                    className="flex-1 h-11 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">delete_forever</span>
                    מחק
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit conversation title popup */}
          {editingConv && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setEditingConv(null)}>
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
              <div className="relative bg-white rounded-2xl shadow-xl p-5 sm:p-6 w-[92vw] sm:w-full max-w-sm anim-scale-in" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-gray-900 text-center mb-4">שינוי שם שיחה</h3>
                <input
                  autoFocus
                  value={editingConv.title}
                  onChange={e => setEditingConv(prev => ({ ...prev, title: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') handleRenameConversation() }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-primary text-sm text-right"
                  placeholder="שם השיחה"
                />
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setEditingConv(null)}
                    className="flex-1 h-11 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    ביטול
                  </button>
                  <button
                    onClick={handleRenameConversation}
                    disabled={!editingConv.title.trim()}
                    className="flex-1 h-11 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-lg">save</span>
                    שמור
                  </button>
                </div>
              </div>
            </div>
          )}

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

            {/* Settings + About links */}
            <div className="flex border-t border-gray-100 dark:border-gray-800">
              <Link
                to="/settings"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm text-text-main dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors no-underline"
              >
                <span className="material-symbols-outlined text-lg text-gray-400">settings</span>
                הגדרות
              </Link>
            </div>
          </div>
        </aside>

      {/* ---- Add Child Sheet ---- */}
      {addChildData && (
        <AddChildSheet
          data={addChildData}
          onSubmit={() => setAddChildData(null)}
          onClose={() => {
            setDismissedChildren(prev => new Set([...prev, addChildData.name]))
            setAddChildData(null)
          }}
        />
      )}

      {/* ---- Update Child Confirmation ---- */}
      {updateChildData && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={() => {
          setDismissedUpdates(prev => new Set([...prev, `${updateChildData.name}:${updateChildData.field}:${updateChildData.value}`]))
          setUpdateChildData(null)
        }}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white dark:bg-surface-dark rounded-2xl shadow-2xl w-[92vw] sm:w-full max-w-sm p-6 anim-pop-in text-center" onClick={e => e.stopPropagation()}>
            <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-rounded text-primary text-3xl">edit_note</span>
            </div>
            <h3 className="text-lg font-bold text-text-main mb-2">עדכון פרטי ילד</h3>
            <p className="text-sm text-text-muted leading-relaxed mb-5">
              {updateChildData.field === 'age' && `שמנו לב שהגיל של ${updateChildData.name} השתנה ל-${updateChildData.value}. לעדכן?`}
              {updateChildData.field === 'name' && `שמנו לב ששמו של הילד השתנה ל-${updateChildData.value}. לעדכן?`}
              {updateChildData.field === 'personality' && (() => {
                const persHeb = { sensitive: 'רגיש/ה', stubborn: 'עקשן/ית', anxious: 'חרדתי/ת', energetic: 'אנרגטי/ת', calm: 'רגוע/ה' };
                return `שמנו לב שהאופי של ${updateChildData.name} השתנה ל${persHeb[updateChildData.value] || updateChildData.value}. לעדכן?`;
              })()}
              {updateChildData.field === 'gender' && `שמנו לב שהמגדר של ${updateChildData.name} השתנה. לעדכן?`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  try {
                    await api.updateChild(updateChildData.childId, { [updateChildData.field]: updateChildData.value })
                    // Update local state
                    const currentUser = useAuthStore.getState().user
                    if (currentUser) {
                      const updatedChildren = currentUser.children.map(c => {
                        if (c.id !== updateChildData.childId) return c
                        const updated = { ...c }
                        if (updateChildData.field === 'age') {
                          const now = new Date()
                          const birthYear = now.getFullYear() - parseInt(updateChildData.value, 10)
                          updated.birthDate = new Date(birthYear, now.getMonth(), now.getDate()).toISOString()
                        } else {
                          updated[updateChildData.field] = updateChildData.value
                        }
                        return updated
                      })
                      useAuthStore.setState({ user: { ...currentUser, children: updatedChildren } })
                    }
                    setUpdateChildData(null)
                  } catch {
                    setUpdateChildData(null)
                  }
                }}
                className="flex-1 py-3 bg-gradient-to-l from-primary to-purple-600 text-white font-bold rounded-xl text-sm active:scale-[0.97] transition-transform"
              >
                כן, עדכנו
              </button>
              <button
                onClick={() => {
                  setDismissedUpdates(prev => new Set([...prev, `${updateChildData.name}:${updateChildData.field}:${updateChildData.value}`]))
                  setUpdateChildData(null)
                }}
                className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-text-main dark:text-gray-300 font-bold rounded-xl text-sm active:scale-[0.97] transition-transform"
              >
                לא, תודה
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Inline styles for typing animation ---- */}
      <style>{`
        /* ---- Message entrance animation ---- */
        @keyframes msgEntrance {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .msg-entrance {
          animation: msgEntrance 0.4s ease-out both;
        }

        /* ---- AI card entrance ---- */
        @keyframes aiCardEnter {
          0% { opacity: 0; transform: translateX(16px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        .ai-card-enter {
          animation: aiCardEnter 0.45s ease-out forwards;
        }

        /* ---- Avatar breathing — creates sense of presence ---- */
        @keyframes avatarBreathing {
          0%, 100% { transform: scale(1); box-shadow: 0 8px 30px -4px rgba(122, 90, 252, 0.2); }
          50% { transform: scale(1.04); box-shadow: 0 12px 40px -4px rgba(122, 90, 252, 0.3); }
        }
        .avatar-breathing {
          animation: avatarBreathing 3.5s ease-in-out infinite;
        }

        /* ---- Thinking text fade ---- */
        @keyframes thinkingFade {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .thinking-text {
          animation: thinkingFade 2s ease-in-out infinite;
        }

        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.3; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        .typing-dot {
          animation: typingBounce 1.2s ease-in-out infinite;
        }

        /* ---- Action bar visibility on AI cards ---- */
        .ai-card-enter:hover .action-bar,
        .ai-card-enter:focus-within .action-bar {
          opacity: 1 !important;
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.08);
          border-radius: 999px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(0,0,0,0.15);
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }

        /* ---- Streaming cursor ---- */
        .streaming-cursor::after {
          content: '';
          display: inline-block;
          width: 2px;
          height: 1em;
          background: currentColor;
          opacity: 0.6;
          margin-right: 2px;
          animation: cursorBlink 0.8s ease-in-out infinite;
          vertical-align: text-bottom;
        }
        @keyframes cursorBlink {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.6; }
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

        /* followup buttons are now rendered as React components outside the bubble */

        /* ---- Add child card ---- */
        .add-child-card {
          direction: rtl;
          background: linear-gradient(135deg, #f3e8ff 0%, #ecfdf5 100%);
          border: 1.5px solid #d8b4fe;
          border-radius: 16px;
          padding: 16px 18px;
          margin: 12px 0;
          box-shadow: 0 2px 12px rgba(139, 92, 246, 0.1);
        }
        .add-child-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 15px;
          font-weight: 500;
          color: #4c1d95;
          margin-bottom: 12px;
        }
        .add-child-icon {
          font-size: 22px;
          color: #7c3aed;
        }
        .add-child-personalities {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 14px;
        }
        .add-child-trait {
          padding: 6px 14px;
          border-radius: 20px;
          border: 1.5px solid #d8b4fe;
          background: white;
          color: #6b21a8;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .add-child-trait:hover {
          background: #ede9fe;
          border-color: #a78bfa;
        }
        .add-child-trait.active {
          background: #7c3aed;
          color: white;
          border-color: #7c3aed;
          box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
        }
        .add-child-confirm {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 20px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
        }
        .add-child-confirm:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(34, 197, 94, 0.4);
        }
        .add-child-confirm:active {
          transform: scale(0.96);
        }
        .add-child-success {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #16a34a;
          font-weight: 600;
          font-size: 15px;
          padding: 8px 0;
        }
        .add-child-success .material-symbols-rounded {
          font-size: 22px;
        }
        .add-child-error {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #dc2626;
          font-weight: 500;
          font-size: 14px;
          padding: 8px 0;
        }
        .add-child-error .material-symbols-rounded {
          font-size: 22px;
        }
      `}</style>
    </div>
  )
}
