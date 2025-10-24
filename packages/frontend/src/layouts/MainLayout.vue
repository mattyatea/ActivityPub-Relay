<template>
  <div class="app">
    <Navbar :currentPage="currentPage" />
    <main class="container">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
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

main {
  flex: 1;
}
</style>
