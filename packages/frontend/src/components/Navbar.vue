<template>
  <ElMenu class="navbar" mode="horizontal" :default-active="currentPage">
    <ElMenuItem class="nav-brand" index="brand">
      <ElLink href="/" :underline="false">ActivityPub Relay</ElLink>
    </ElMenuItem>
    <div class="nav-spacer" />
    <ElMenuItem index="home">
      <ElLink href="/" :underline="false">Home</ElLink>
    </ElMenuItem>
    <ElMenuItem index="admin">
      <ElLink href="/admin" :underline="false">Admin</ElLink>
    </ElMenuItem>
    <ElMenuItem index="theme">
      <ElButton circle plain :aria-label="'Toggle theme'" @click="toggleTheme">
        {{ isDark ? '☀' : '☾' }}
      </ElButton>
    </ElMenuItem>
  </ElMenu>
</template>

<script setup lang="ts">
import { ElButton, ElLink, ElMenu, ElMenuItem } from 'element-plus';
import { useTheme } from '../composables/useTheme';
interface Props {
	currentPage?: 'home' | 'admin';
}

withDefaults(defineProps<Props>(), {
	currentPage: 'home',
});

const { isDark, toggleTheme } = useTheme();
</script>

<style scoped>
.navbar {
  padding: 0 max(20px, calc((100vw - 1200px) / 2 + 20px));
}

.nav-brand :deep(.el-link__inner) {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.nav-spacer {
  flex: 1;
}

</style>
