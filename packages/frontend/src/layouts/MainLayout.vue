<template>
  <div class="app">
    <Navbar :currentPage="currentPage" />
    <ElMain class="container">
      <slot />
    </ElMain>
  </div>
</template>

<script setup lang="ts">
import { ElMain } from 'element-plus';
import Navbar from '../components/Navbar.vue';

interface Props {
	currentPage?: 'home' | 'admin';
}

withDefaults(defineProps<Props>(), {
	currentPage: 'home',
});
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.container {
  flex: 1;
}
</style>
