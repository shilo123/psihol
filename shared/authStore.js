import { create } from 'zustand'
import { api } from './api.js'
import { toast } from './toastStore.js'

export const useAuthStore = create((set, get) => ({
  user: null,
  token: typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null,
  isGuest: false,
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
      set({ user, isGuest: !!user.isGuest })
    } catch {
      get().logout()
    }
  },

  loginAsGuest: async () => {
    set({ loading: true })
    try {
      const data = await api.loginAsGuest()
      if (typeof localStorage !== 'undefined') localStorage.setItem('token', data.token)
      set({ token: data.token, user: data.user, isGuest: true, loading: false })
      return data.user
    } catch {
      set({ loading: false })
      toast.error('שגיאה ביצירת חשבון אורח. נסו שוב.')
      return null
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
      set({ token: data.token, user: data.user, isGuest: false, loading: false })
      return data.user
    } catch {
      set({ loading: false })
      toast.error('שגיאה בהתחברות. בדקו את הפרטים ונסו שוב.')
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
      toast.error('שגיאה בשמירת הפרטים. נסו שוב.')
      return null
    }
  },

  logout: () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('token')
    }
    set({ user: null, token: null, isGuest: false })
  },

  updateUser: (updates) => {
    set((state) => ({ user: state.user ? { ...state.user, ...updates } : null }))
  },
}))
