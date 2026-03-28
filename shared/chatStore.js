import { create } from 'zustand'
import { api } from './api.js'
import { toast } from './toastStore.js'

function parseSSEStream(body, { onUserMessage, onChunk, onDone, onError }) {
  return new Promise(async (resolve) => {
    const reader = body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let finalMessage = null

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue
        const payload = trimmed.slice(6)

        try {
          const event = JSON.parse(payload)
          if (event.type === 'user_message') onUserMessage?.(event.message)
          else if (event.type === 'chunk') onChunk?.(event.content)
          else if (event.type === 'done') finalMessage = event.message
          else if (event.type === 'error') onError?.(event.error)
        } catch {}
      }
    }

    resolve(finalMessage)
  })
}

// Character-by-character streaming buffer
let _streamBuffer = ''
let _streamDisplayed = ''
let _streamTimer = null

function _flushStreamBuffer(set) {
  if (_streamBuffer.length <= _streamDisplayed.length) {
    clearInterval(_streamTimer)
    _streamTimer = null
    return
  }
  // Reveal 2-3 chars at a time for smooth Hebrew feel
  const next = _streamDisplayed.length + 2
  _streamDisplayed = _streamBuffer.slice(0, next)
  set({ streamingContent: _streamDisplayed })
}

function _startStreamReveal(set) {
  if (_streamTimer) return
  _streamTimer = setInterval(() => _flushStreamBuffer(set), 18)
}

function _resetStreamBuffer() {
  _streamBuffer = ''
  _streamDisplayed = ''
  if (_streamTimer) { clearInterval(_streamTimer); _streamTimer = null }
}

export const useChatStore = create((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,
  sending: false,
  streamingContent: '',
  isTempChat: false,

  loadConversations: async () => {
    set({ loading: true })
    try {
      const conversations = await api.getConversations()
      set({ conversations, loading: false })
    } catch {
      set({ loading: false })
      toast.error('לא הצלחנו לטעון את השיחות. נסו שוב.')
    }
  },

  createConversation: async (title) => {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const conv = await api.createConversation(title || 'שיחה חדשה')
        set((state) => ({
          conversations: [conv, ...state.conversations],
          currentConversation: conv,
          messages: [],
          isTempChat: false,
        }))
        return conv
      } catch (err) {
        console.error('Create conversation error (attempt ' + (attempt + 1) + '):', err)
        if (attempt === 0) await new Promise(r => setTimeout(r, 500))
      }
    }
    toast.error('לא הצלחנו ליצור שיחה חדשה. נסו שוב.')
    return null
  },

  startTempChat: () => {
    set({
      currentConversation: { id: 'temp', title: 'שיחה זמנית' },
      messages: [],
      isTempChat: true,
    })
  },

  selectConversation: async (conv) => {
    set({ currentConversation: conv, isTempChat: false })
    try {
      const messages = await api.getMessages(conv.id)
      set({ messages })
    } catch {
      set({ messages: [] })
      toast.error('לא הצלחנו לטעון את ההודעות.')
    }
  },

  sendMessage: async (content) => {
    const { currentConversation, messages: currentMessages, isTempChat } = get()
    if (!currentConversation || !content.trim()) return

    _resetStreamBuffer()
    set({ sending: true, streamingContent: '' })

    const tempId = 'temp-' + Date.now()
    const tempMsg = { id: tempId, role: 'user', content, timestamp: new Date().toISOString() }
    set((state) => ({ messages: [...state.messages, tempMsg] }))

    try {
      const body = isTempChat
        ? await api.sendTempMessageStream(content, currentMessages)
        : await api.sendMessageStream(currentConversation.id, content)

      const finalAssistantMessage = await parseSSEStream(body, {
        onUserMessage: (msg) => {
          set((state) => ({
            messages: state.messages.map(m => m.id === tempId ? msg : m)
          }))
        },
        onChunk: (chunk) => {
          _streamBuffer += chunk
          _startStreamReveal(set)
        },
        onError: (err) => {
          console.error('Stream error:', err)
          toast.error('שגיאה בקבלת תשובה. נסו שוב.')
        },
      })

      // Flush any remaining buffered content before showing final message
      _resetStreamBuffer()

      if (finalAssistantMessage) {
        set((state) => {
          const convs = isTempChat ? state.conversations : state.conversations.map(c => {
            if (c.id === currentConversation.id) {
              return { ...c, title: c.messageCount === 0 ? content.substring(0, 50) : c.title, messageCount: (c.messageCount || 0) + 2 }
            }
            return c
          })
          return {
            messages: [...state.messages, finalAssistantMessage],
            conversations: convs,
            sending: false,
            streamingContent: '',
          }
        })
      } else {
        set({ sending: false, streamingContent: '' })
      }
    } catch {
      _resetStreamBuffer()
      set((state) => ({
        messages: state.messages.filter(m => m.id !== tempId),
        sending: false,
        streamingContent: '',
      }))
      toast.error('שגיאה בשליחת ההודעה. בדקו את החיבור ונסו שוב.')
    }
  },
}))
