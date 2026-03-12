import { create } from 'zustand'
import { api } from './api.js'

export const useAuthStore = create((set, get) => ({
  user: null,
  token: typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null,
  loading: false,

  get isLoggedIn() { return !!get().token },
  get isOnboarded() {
    const user = get().user
    if (!user) return false
    return !!(user.parentName && user.children?.length > 0 && user.challenges?.length > 0)
  },

  init: async () => {
    const token = get().token
    if (!token) return
    try {
      const user = await api.getMe()
      set({ user })
    } catch {
      get().logout()
    }
  },

  login: async ({ name, email }) => {
    set({ loading: true })
    try {
      const data = await api.login({
        email,
        name,
        picture: ''
      })
      if (typeof localStorage !== 'undefined') localStorage.setItem('token', data.token)
      set({ token: data.token, user: data.user, loading: false })
      return data.user
    } catch {
      set({ loading: false })
      return null
    }
  },

  completeOnboarding: async (onboardingData) => {
    set({ loading: true })
    try {
      const data = await api.register(onboardingData)
      set({ user: data, loading: false })
      return data
    } catch {
      set({ loading: false })
      return null
    }
  },

  logout: () => {
    if (typeof localStorage !== 'undefined') localStorage.removeItem('token')
    set({ user: null, token: null })
  },

  updateUser: (updates) => {
    set((state) => ({ user: state.user ? { ...state.user, ...updates } : null }))
  },
}))
