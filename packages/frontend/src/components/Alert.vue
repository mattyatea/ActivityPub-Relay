<template>
  <div v-if="visible" class="alert" :class="type">
    <div class="alert-content">
      <span class="alert-icon">{{ icon }}</span>
      <span class="alert-message">{{ message }}</span>
    </div>
    <button v-if="closeable" class="alert-close" @click="close">×</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = withDefaults(
  defineProps<{
    message: string
    type?: 'success' | 'error' | 'warning' | 'info'
    closeable?: boolean
    autoDismiss?: boolean
    dismissDuration?: number
  }>(),
  {
    type: 'info',
    closeable: true,
    autoDismiss: true,
    dismissDuration: 5000,
  }
)

const visible = ref(true)
let dismissTimer: ReturnType<typeof setTimeout> | null = null

const icon = computed(() => {
  const icons: Record<string, string> = {
    success: '✓',
    error: '✕',
    warning: '!',
    info: 'i',
  }
  return icons[props.type] || 'i'
})

const close = () => {
  visible.value = false
  if (dismissTimer) {
    clearTimeout(dismissTimer)
  }
}

onMounted(() => {
  if (props.autoDismiss) {
    dismissTimer = setTimeout(() => {
      visible.value = false
    }, props.dismissDuration)
  }
})
</script>

<style scoped>
.alert {
  padding: 12px 16px;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 14px;
}

.alert-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.alert-icon {
  font-size: 14px;
}

.alert-message {
  font-size: 14px;
}

.alert-close {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 20px;
  padding: 0;
  opacity: 0.6;
}

.alert-close:hover {
  opacity: 1;
}

.alert.success {
  background: var(--success-bg);
  color: var(--success-text);
  border: 1px solid var(--success-text);
}

.alert.error {
  background: var(--error-bg);
  color: var(--error-text);
  border: 1px solid var(--error-text);
}

.alert.warning {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #f59e0b;
}

.alert.info {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}
</style>
