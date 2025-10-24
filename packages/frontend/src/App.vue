<template>
  <div class="app">
    <Navbar />
    <main class="container">
      <router-view />
    </main>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import Footer from './components/Footer.vue';
import Navbar from './components/Navbar.vue';
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
