import { create } from 'zustand'
import { api } from './api.js'
import { toast } from './toastStore.js'

function parseSSEStream(body, { onUserMessage, onChunk, onDone, onError }) {
  return new Promise(async (resolve) => {
    const reader = body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let finalResult = null

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
          else if (event.type === 'done') finalResult = { message: event.message, boundaryCount: event.boundaryCount }
          else if (event.type === 'error') onError?.(event.error)
        } catch {}
      }
    }

    resolve(finalResult)
  })
}

function tokenize(text) {
  return text.match(/\S+\s*/g) || []
}

export const useChatStore = create((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,
  sending: false,
  streamingContent: '',
  streamingMessageId: null,
  isTempChat: false,
  boundaryCount: 0,

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

    set({ sending: true, streamingContent: '', streamingMessageId: null })

    const tempId = 'temp-' + Date.now()
    const tempMsg = { id: tempId, role: 'user', content, timestamp: new Date().toISOString() }

    // Add user message + placeholder assistant message immediately
    const assistantPlaceholderId = 'ai-' + Date.now()
    set((state) => ({
      messages: [
        ...state.messages,
        tempMsg,
        { id: assistantPlaceholderId, role: 'assistant', content: '', timestamp: new Date().toISOString(), _streaming: true }
      ],
      streamingMessageId: assistantPlaceholderId,
    }))

    // Producer-consumer: server fills buffer, we display at our pace
    let serverBuffer = ''
    let displayedCharCount = 0
    let serverDone = false
    let animTimer = null

    const WORDS_PER_SECOND = 12
    const INTERVAL = 1000 / WORDS_PER_SECOND

    function updateMessageContent(text) {
      set((state) => ({
        messages: state.messages.map(m =>
          m.id === assistantPlaceholderId ? { ...m, content: text } : m
        )
      }))
    }

    function scheduleNextWord() {
      animTimer = setTimeout(() => {
        const words = tokenize(serverBuffer)
        let charTarget = 0
        let found = false
        for (const w of words) {
          charTarget += w.length
          if (charTarget > displayedCharCount) {
            displayedCharCount = charTarget
            found = true
            break
          }
        }

        if (found) {
          updateMessageContent(serverBuffer.slice(0, displayedCharCount))
          scheduleNextWord()
        } else if (!serverDone) {
          // Buffer empty, server still sending — pause, will resume on next chunk
          animTimer = null
        } else {
          // All done
          animTimer = null
        }
      }, INTERVAL)
    }

    function kickAnimation() {
      if (!animTimer) scheduleNextWord()
    }

    try {
      const body = isTempChat
        ? await api.sendTempMessageStream(content, currentMessages)
        : await api.sendMessageStream(currentConversation.id, content)

      const finalResult = await parseSSEStream(body, {
        onUserMessage: (msg) => {
          set((state) => ({
            messages: state.messages.map(m => m.id === tempId ? msg : m)
          }))
        },
        onChunk: (chunk) => {
          serverBuffer += chunk
          kickAnimation()
        },
        onError: (err) => {
          console.error('Stream error:', err)
          toast.error('שגיאה בקבלת תשובה. נסו שוב.')
        },
      })

      serverDone = true
      kickAnimation()

      if (finalResult?.message) {
        // Wait for animation to finish all remaining words
        await new Promise((resolve) => {
          function check() {
            const words = tokenize(serverBuffer)
            let totalChars = 0
            for (const w of words) totalChars += w.length
            if (displayedCharCount >= totalChars) {
              resolve()
            } else {
              kickAnimation()
              setTimeout(check, 50)
            }
          }
          check()
        })

        // Seamlessly replace placeholder with final message (same ID, same position, no flash)
        set((state) => {
          const convs = isTempChat ? state.conversations : state.conversations.map(c => {
            if (c.id === currentConversation.id) {
              return { ...c, title: c.messageCount === 0 ? content.substring(0, 50) : c.title, messageCount: (c.messageCount || 0) + 2 }
            }
            return c
          })
          return {
            messages: state.messages.map(m =>
              m.id === assistantPlaceholderId
                ? { ...finalResult.message, id: assistantPlaceholderId }
                : m
            ),
            conversations: convs,
            boundaryCount: finalResult.boundaryCount ?? state.boundaryCount,
            sending: false,
            streamingMessageId: null,
          }
        })
      } else {
        if (animTimer) clearTimeout(animTimer)
        // Remove placeholder if no result
        set((state) => ({
          messages: state.messages.filter(m => m.id !== assistantPlaceholderId),
          sending: false,
          streamingMessageId: null,
        }))
      }
    } catch {
      if (animTimer) clearTimeout(animTimer)
      set((state) => ({
        messages: state.messages.filter(m => m.id !== tempId && m.id !== assistantPlaceholderId),
        sending: false,
        streamingMessageId: null,
      }))
      toast.error('שגיאה בשליחת ההודעה. בדקו את החיבור ונסו שוב.')
    }
  },
}))
