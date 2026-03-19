import { create } from 'zustand'
import { api } from './api.js'
import { useAuthStore } from './authStore.js'
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

export const useChatStore = create((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,
  sending: false,
  streamingContent: '',

  loadConversations: async () => {
    if (useAuthStore.getState().isGuest) return
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
    if (useAuthStore.getState().isGuest) {
      const conv = {
        id: 'guest-' + Date.now(),
        title: title || 'שיחה חדשה',
        createdAt: new Date().toISOString(),
        messageCount: 0,
      }
      set((state) => ({
        conversations: [conv, ...state.conversations],
        currentConversation: conv,
        messages: [],
      }))
      return conv
    }

    try {
      const conv = await api.createConversation(title || 'שיחה חדשה')
      set((state) => ({
        conversations: [conv, ...state.conversations],
        currentConversation: conv,
        messages: [],
      }))
      return conv
    } catch {
      toast.error('לא הצלחנו ליצור שיחה חדשה. נסו שוב.')
      return null
    }
  },

  selectConversation: async (conv) => {
    set({ currentConversation: conv })
    if (useAuthStore.getState().isGuest) {
      return
    }
    try {
      const messages = await api.getMessages(conv.id)
      set({ messages })
    } catch {
      set({ messages: [] })
      toast.error('לא הצלחנו לטעון את ההודעות.')
    }
  },

  sendMessage: async (content) => {
    const { currentConversation, messages: currentMessages } = get()
    if (!currentConversation || !content.trim()) return

    set({ sending: true, streamingContent: '' })

    const tempId = 'temp-' + Date.now()
    const tempMsg = { id: tempId, role: 'user', content, timestamp: new Date().toISOString() }
    set((state) => ({ messages: [...state.messages, tempMsg] }))

    const isGuest = useAuthStore.getState().isGuest

    try {
      const body = isGuest
        ? await api.sendGuestMessageStream(content, currentMessages)
        : await api.sendMessageStream(currentConversation.id, content)

      const finalAssistantMessage = await parseSSEStream(body, {
        onUserMessage: (msg) => {
          set((state) => ({
            messages: state.messages.map(m => m.id === tempId ? msg : m)
          }))
        },
        onChunk: (chunk) => {
          set((state) => ({
            streamingContent: state.streamingContent + chunk
          }))
        },
        onError: (err) => {
          console.error('Stream error:', err)
          toast.error('שגיאה בקבלת תשובה. נסו שוב.')
        },
      })

      if (finalAssistantMessage) {
        set((state) => {
          const convs = state.conversations.map(c => {
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
      set((state) => ({
        messages: state.messages.filter(m => m.id !== tempId),
        sending: false,
        streamingContent: '',
      }))
      toast.error('שגיאה בשליחת ההודעה. בדקו את החיבור ונסו שוב.')
    }
  },
}))
