<template>
  <Teleport to="body">
    <div v-if="isOpen" class="dialog-overlay" @click="onCancel">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h3>{{ title }}</h3>
          <button class="dialog-close" @click="onCancel" aria-label="Close">&times;</button>
        </div>
        <div class="dialog-body">
          <p>{{ message }}</p>
        </div>
        <div class="dialog-footer">
          <button class="button-secondary" @click="onCancel">
            Cancel
          </button>
          <button class="button-primary" @click="onConfirm">
            Confirm
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
	isOpen: boolean;
	title: string;
	message: string;
}

interface Emits {
	(e: 'confirm'): void;
	(e: 'cancel'): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const onConfirm = () => {
	emit('confirm');
};

const onCancel = () => {
	emit('cancel');
};
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: var(--bg-primary);
  border-radius: 8px;
  max-width: 480px;
  width: 90%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.dialog-close {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0;
  line-number: 1;
}

.dialog-close:hover {
  color: var(--text-primary);
}

.dialog-body {
  padding: 20px;
}

.dialog-body p {
  margin: 0;
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.5;
}

.dialog-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.button-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.button-secondary:hover {
  background: var(--bg-primary);
}

.button-primary {
  background: var(--button-primary);
  color: white;
  border: 1px solid var(--button-primary);
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.button-primary:hover {
  background: var(--button-primary-hover);
  border-color: var(--button-primary-hover);
}
</style>
