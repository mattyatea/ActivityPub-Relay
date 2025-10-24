<template>
  <nav class="navbar">
    <div class="nav-container">
      <a href="/" class="nav-brand">
        ActivityPub Relay
      </a>

      <div class="nav-links">
        <a href="/" class="nav-link" :class="{ active: currentPage === 'home' }">
          Home
        </a>
        <a href="/admin" class="nav-link" :class="{ active: currentPage === 'admin' }">
          Admin
        </a>
        <button class="theme-toggle" @click="toggleTheme" aria-label="Toggle theme">
          {{ isDark ? '☀' : '☾' }}
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useTheme } from '../composables/useTheme';

interface Props {
	currentPage?: 'home' | 'admin';
}

const props = withDefaults(defineProps<Props>(), {
	currentPage: 'home',
});

const { isDark, toggleTheme } = useTheme();
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
