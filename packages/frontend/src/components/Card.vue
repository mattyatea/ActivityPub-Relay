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
  border-radius: 4px;
  overflow: hidden;
}

.card-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.card-header h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 600;
}

.card-body {
  padding: 16px;
}

.card-footer {
  padding: 12px 16px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  display: flex;
  gap: 8px;
}

.card.success {
  border-left: 3px solid #22c55e;
}

.card.error {
  border-left: 3px solid var(--button-danger);
}

.card.warning {
  border-left: 3px solid #f59e0b;
}
</style>
