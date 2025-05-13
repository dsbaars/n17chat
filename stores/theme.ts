import { defineStore } from 'pinia'

export type ThemeMode = 'light' | 'dark' | 'auto'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    mode: 'auto' as ThemeMode
  }),
  
  actions: {
    setTheme(newTheme: ThemeMode) {
      this.mode = newTheme
      
      // Apply theme to document
      if (newTheme === 'auto') {
        // For auto, use system preference
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
      } else {
        // Set specific theme
        document.documentElement.setAttribute('data-theme', newTheme)
      }
      
      // Save preference to local storage
      localStorage.setItem('theme', newTheme)
    },
    
    initTheme() {
      // Get theme from localStorage or default to auto
      const savedTheme = localStorage.getItem('theme') as ThemeMode || 'auto'
      this.setTheme(savedTheme)
      
      // Add listener for system preference changes when in auto mode
      if (savedTheme === 'auto') {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
          if (this.mode === 'auto') {
            document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light')
          }
        })
      }
    }
  }
}) 