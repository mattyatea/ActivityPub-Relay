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
import { computed, onMounted, ref } from 'vue';

const props = withDefaults(
	defineProps<{
		message: string;
		type?: 'success' | 'error' | 'warning' | 'info';
		closeable?: boolean;
		autoDismiss?: boolean;
		dismissDuration?: number;
	}>(),
	{
		type: 'info',
		closeable: true,
		autoDismiss: true,
		dismissDuration: 5000,
	},
);

const visible = ref(true);
let dismissTimer: ReturnType<typeof setTimeout> | null = null;

const icon = computed(() => {
	const icons: Record<string, string> = {
		success: '✓',
		error: '✕',
		warning: '!',
		info: 'i',
	};
	return icons[props.type] || 'i';
});

const close = () => {
	visible.value = false;
	if (dismissTimer) {
		clearTimeout(dismissTimer);
	}
};

onMounted(() => {
	if (props.autoDismiss) {
		dismissTimer = setTimeout(() => {
			visible.value = false;
		}, props.dismissDuration);
	}
});
</script>

<style scoped>
.alert {
  padding: 16px 20px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.alert-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.alert-icon {
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
}

.alert-message {
  font-size: 14px;
  line-height: 1.5;
  font-weight: 500;
}

.alert-close {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 24px;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: all 0.2s ease;
  border-radius: 4px;
}

.alert-close:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.1);
  transform: scale(1.1);
}

.alert.success {
  background: var(--success-bg);
  color: var(--success-text);
  border: 2px solid var(--success-text);
}

.alert.error {
  background: var(--error-bg);
  color: var(--error-text);
  border: 2px solid var(--error-text);
}

.alert.warning {
  background: #fef3c7;
  color: #92400e;
  border: 2px solid #f59e0b;
}

.alert.info {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 2px solid var(--border-color);
}
</style>
