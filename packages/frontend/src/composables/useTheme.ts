import { ref, onMounted } from 'vue'

export function useTheme() {
  const isDark = ref(false)

  onMounted(() => {
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    isDark.value = saved ? saved === 'dark' : prefersDark
    applyTheme(isDark.value)
  })

  const toggleTheme = () => {
    isDark.value = !isDark.value
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
    applyTheme(isDark.value)
  }

  const applyTheme = (dark: boolean) => {
    document.documentElement.classList.remove('light-mode', 'dark-mode')
    document.documentElement.classList.add(dark ? 'dark-mode' : 'light-mode')
  }

  return {
    isDark,
    toggleTheme
  }
}
