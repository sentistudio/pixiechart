import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark' | 'blue'

interface ThemeState {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => {
        set({ theme })
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', theme)
      }
    }),
    {
      name: 'pixiechart-theme',
      onRehydrateStorage: () => (state) => {
        // Apply theme on hydration
        if (state?.theme) {
          document.documentElement.setAttribute('data-theme', state.theme)
        }
      }
    }
  )
) 