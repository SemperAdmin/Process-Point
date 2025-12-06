import { create } from 'zustand'
import { User } from '@/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  
  login: (user: User) => {
    set({ user, isAuthenticated: true })
    localStorage.setItem('user', JSON.stringify(user))
  },
  
  logout: () => {
    set({ user: null, isAuthenticated: false })
    localStorage.removeItem('user')
  },
}))
