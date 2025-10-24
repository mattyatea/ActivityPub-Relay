<template>
  <div class="card" :class="{ [variant]: true }">
    <div v-if="title" class="card-header">
      <h3>{{ title }}</h3>
    </div>
    <div class="card-body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
	title?: string;
	variant?: 'default' | 'success' | 'error' | 'warning';
}>();
</script>

<style scoped>
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-header {
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-primary);
}

.card-header h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 600;
}

.card-body {
  padding: 20px;
}

.card-footer {
  padding: 16px 20px;
  background: var(--bg-primary);
  border-top: 1px solid var(--border-color);
  display: flex;
  gap: 8px;
}

.card.success {
  border-left: 4px solid #22c55e;
}

.card.error {
  border-left: 4px solid var(--button-danger);
}

.card.warning {
  border-left: 4px solid #f59e0b;
}
</style>
