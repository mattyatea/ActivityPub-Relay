<template>
  <nav class="navbar">
    <div class="nav-container">
      <router-link to="/" class="nav-brand">
        ActivityPub Relay
      </router-link>

      <div class="nav-links">
        <router-link to="/" class="nav-link" :class="{ active: route.path === '/' }">
          Home
        </router-link>
        <router-link to="/admin" class="nav-link" :class="{ active: route.path === '/admin' }">
          Admin
        </router-link>
        <button class="theme-toggle" @click="toggleTheme">
          {{ isDark ? '☀' : '☾' }}
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isDark = ref(false)

onMounted(() => {
  const saved = localStorage.getItem('theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  isDark.value = saved ? saved === 'dark' : prefersDark
  applyTheme()
})

const toggleTheme = () => {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  applyTheme()
}

const applyTheme = () => {
  document.body.classList.remove('light-mode', 'dark-mode')
  document.body.classList.add(isDark.value ? 'dark-mode' : 'light-mode')
}
</script>

<style scoped>
.navbar {
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-brand {
  text-decoration: none;
  font-weight: 600;
  font-size: 16px;
  color: var(--text-primary);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 24px;
}

.nav-link {
  text-decoration: none;
  color: var(--text-secondary);
  font-size: 14px;
}

.nav-link:hover {
  color: var(--text-primary);
}

.nav-link.active {
  color: var(--text-primary);
}

.theme-toggle {
  background: transparent;
  border: 1px solid var(--border-color);
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  color: var(--text-primary);
}

.theme-toggle:hover {
  background: var(--bg-secondary);
}

@media (max-width: 768px) {
  .nav-links {
    gap: 16px;
  }
}
</style>
