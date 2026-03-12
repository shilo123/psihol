import { create } from 'zustand'
import { api } from './api.js'

export const useChatStore = create((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,
  sending: false,
  streamingContent: '', // current streaming text for the AI response

  loadConversations: async () => {
    set({ loading: true })
    try {
      const conversations = await api.getConversations()
      set({ conversations, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  createConversation: async (title) => {
    try {
      const conv = await api.createConversation(title || 'שיחה חדשה')
      set((state) => ({
        conversations: [conv, ...state.conversations],
        currentConversation: conv,
        messages: [],
      }))
      return conv
    } catch {
      return null
    }
  },

  selectConversation: async (conv) => {
    set({ currentConversation: conv })
    try {
      const messages = await api.getMessages(conv.id)
      set({ messages })
    } catch {
      set({ messages: [] })
    }
  },

  sendMessage: async (content) => {
    const { currentConversation } = get()
    if (!currentConversation || !content.trim()) return

    set({ sending: true, streamingContent: '' })

    const tempId = 'temp-' + Date.now()
    const tempMsg = { id: tempId, role: 'user', content, timestamp: new Date().toISOString() }
    set((state) => ({ messages: [...state.messages, tempMsg] }))

    try {
      const body = await api.sendMessageStream(currentConversation.id, content)
      const reader = body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let finalAssistantMessage = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() // keep incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue
          const payload = trimmed.slice(6)

          try {
            const event = JSON.parse(payload)

            if (event.type === 'user_message') {
              // Replace temp user message with real one
              set((state) => ({
                messages: state.messages.map(m => m.id === tempId ? event.message : m)
              }))
            } else if (event.type === 'chunk') {
              // Append streaming content
              set((state) => ({
                streamingContent: state.streamingContent + event.content
              }))
            } else if (event.type === 'done') {
              finalAssistantMessage = event.message
            } else if (event.type === 'error') {
              console.error('Stream error:', event.error)
            }
          } catch {}
        }
      }

      // Finalize: add assistant message to messages array, clear streaming
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
    }
  },
}))
