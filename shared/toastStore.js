import { create } from 'zustand'

let toastId = 0

export const useToastStore = create((set) => ({
  toasts: [],

  addToast: (message, type = 'error', duration = 4000) => {
    const id = ++toastId
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }))
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }))
    }, duration)
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },
}))

// Shorthand helpers
export const toast = {
  error: (msg) => useToastStore.getState().addToast(msg, 'error'),
  success: (msg) => useToastStore.getState().addToast(msg, 'success'),
  info: (msg) => useToastStore.getState().addToast(msg, 'info'),
}
