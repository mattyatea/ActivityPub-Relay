<template>
  <Card title="Delivery Servers" class="section">
    <div v-if="actors.length === 0" class="empty">
      <p>No servers currently being delivered to</p>
    </div>
    <div v-else class="list">
      <div v-for="actor in actors" :key="actor.id" class="list-item">
        <div class="list-item-info">
          <div class="list-item-id">{{ extractDomain(actor.id) }}</div>
          <div class="list-item-text">{{ actor.inbox }}</div>
        </div>
        <button
          class="remove-button"
          @click="handleRemove(actor.id)"
          title="Remove this server"
        >
          Remove
        </button>
      </div>
      <div v-if="actorTotal > actors.length" class="list-footer">
        <p>Showing {{ actors.length}} of {{ actorTotal }} servers</p>
      </div>
    </div>
    <ConfirmationDialog
      :isOpen="showConfirmDialog"
      title="Remove Delivery Server"
      :message="`Are you sure you want to remove ${extractDomain(actorToRemove || '')}? A Reject activity will be sent to this server.`"
      @confirm="confirmRemove"
      @cancel="cancelRemove"
    />
  </Card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Actor } from '../../types/api';
import Card from '../Card.vue';
import ConfirmationDialog from '../ConfirmationDialog.vue';

interface Props {
	actors: Actor[];
	actorTotal: number;
}

defineProps<Props>();

const emit = defineEmits<{
	removeActor: [actorId: string];
}>();

const showConfirmDialog = ref(false);
const actorToRemove = ref<string | null>(null);

const handleRemove = (actorId: string) => {
	actorToRemove.value = actorId;
	showConfirmDialog.value = true;
};

const confirmRemove = () => {
	if (actorToRemove.value) {
		emit('removeActor', actorToRemove.value);
	}
	showConfirmDialog.value = false;
	actorToRemove.value = null;
};

const cancelRemove = () => {
	showConfirmDialog.value = false;
	actorToRemove.value = null;
};

const extractDomain = (url: string): string => {
	try {
		const urlObj = new URL(url);
		return urlObj.hostname;
	} catch {
		return url;
	}
};
</script>

<style scoped>
.section {
  margin-bottom: 24px;
}

.empty {
  text-align: center;
  padding: 32px;
  color: var(--text-secondary);
  font-size: 14px;
}

.list {
  margin-top: 16px;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: 12px;
  background: var(--bg-primary);
  transition: all 0.2s ease;
}

.list-item:hover {
  border-color: var(--text-secondary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.list-item-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.list-item-id {
  font-size: 13px;
  font-family: monospace;
  color: var(--text-primary);
  font-weight: 600;
}

.list-item-text {
  font-size: 13px;
  color: var(--text-secondary);
  word-break: break-all;
}

.list-footer {
  text-align: center;
  padding: 16px;
  color: var(--text-secondary);
  font-size: 13px;
  border-top: 1px solid var(--border-color);
  margin-top: 8px;
  background: var(--bg-primary);
  border-radius: 0 0 8px 8px;
}

.remove-button {
  padding: 8px 16px;
  font-size: 13px;
  background-color: transparent;
  color: var(--button-danger);
  border: 2px solid var(--button-danger);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.remove-button:hover {
  background-color: var(--button-danger);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
}
</style>
