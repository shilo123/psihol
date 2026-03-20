// Shared API layer - used by both React Web and React Native
const BASE_URL = typeof window !== 'undefined' && window.location
  ? '' // Web: use Vite proxy
  : 'http://localhost:3001' // Native: direct URL

export async function apiRequest(path, options = {}) {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }

  return res.json()
}

export const api = {
  // Auth
  login: (data) => apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  signup: (data) => apiRequest('/api/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  googleLogin: (credential) => apiRequest('/api/auth/google', { method: 'POST', body: JSON.stringify({ credential }) }),
  register: (data) => apiRequest('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => apiRequest('/api/auth/me'),
  loginAsGuest: () => apiRequest('/api/auth/guest', { method: 'POST' }),

  // Chat
  getConversations: () => apiRequest('/api/chat/conversations'),
  createConversation: (title) => apiRequest('/api/chat/conversations', { method: 'POST', body: JSON.stringify({ title }) }),
  getMessages: (convId) => apiRequest(`/api/chat/conversations/${convId}/messages`),
  sendMessage: (convId, content) => apiRequest(`/api/chat/conversations/${convId}/messages`, { method: 'POST', body: JSON.stringify({ content }) }),

  // Streaming send - returns a reader for SSE chunks
  sendMessageStream: async (convId, content) => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null
    const res = await fetch(`${BASE_URL}/api/chat/conversations/${convId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ content }),
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(error.error || 'Request failed')
    }
    return res.body
  },

  // Guest chat - streaming, no auth
  sendGuestMessageStream: async (content, history) => {
    const res = await fetch(`${BASE_URL}/api/chat/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, history }),
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(error.error || 'Request failed')
    }
    return res.body
  },

  // Temp chat - not saved to DB
  sendTempMessageStream: async (content, history) => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null
    const res = await fetch(`${BASE_URL}/api/chat/temp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ content, history }),
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(error.error || 'Request failed')
    }
    return res.body
  },

  // User
  getProfile: () => apiRequest('/api/user/profile'),
  updateProfile: (data) => apiRequest('/api/user/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getChildren: () => apiRequest('/api/user/children'),
  addChild: (data) => apiRequest('/api/user/children', { method: 'POST', body: JSON.stringify(data) }),

  // Admin
  getSystemPrompt: () => apiRequest('/api/admin/system-prompt'),
  updateSystemPrompt: (prompt) => apiRequest('/api/admin/system-prompt', { method: 'PUT', body: JSON.stringify({ prompt }) }),
  getUsers: () => apiRequest('/api/admin/users'),
  getUserDetails: (id) => apiRequest(`/api/admin/users/${id}`),
  updateUserAdmin: (id, data) => apiRequest(`/api/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id) => apiRequest(`/api/admin/users/${id}`, { method: 'DELETE' }),
  getTemperature: () => apiRequest('/api/admin/settings/temperature'),
  updateTemperature: (temperature) => apiRequest('/api/admin/settings/temperature', { method: 'PUT', body: JSON.stringify({ temperature }) }),
  getStats: () => apiRequest('/api/admin/stats'),
}
