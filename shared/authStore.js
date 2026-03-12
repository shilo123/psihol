import { create } from 'zustand'
import { api } from './api.js'

export const useAuthStore = create((set, get) => ({
  user: null,
  token: typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null,
  isGuest: typeof localStorage !== 'undefined' ? localStorage.getItem('isGuest') === 'true' : false,
  loading: false,

  get isLoggedIn() { return !!get().token || get().isGuest },
  get isOnboarded() {
    if (get().isGuest) return true
    const user = get().user
    if (!user) return false
    return !!(user.parentName && user.children?.length > 0 && user.challenges?.length > 0)
  },

  init: async () => {
    if (get().isGuest) return
    const token = get().token
    if (!token) return
    try {
      const user = await api.getMe()
      set({ user })
    } catch {
      get().logout()
    }
  },

  loginAsGuest: () => {
    if (typeof localStorage !== 'undefined') localStorage.setItem('isGuest', 'true')
    set({
      isGuest: true,
      user: { parentName: 'אורח', email: '', children: [], challenges: [] },
      token: null,
    })
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
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('isGuest')
    }
    set({ user: null, token: null, isGuest: false })
  },

  updateUser: (updates) => {
    set((state) => ({ user: state.user ? { ...state.user, ...updates } : null }))
  },
}))
