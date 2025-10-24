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
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  margin-bottom: 8px;
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
}

.list-item-text {
  font-size: 13px;
  color: var(--text-secondary);
}

.list-footer {
  text-align: center;
  padding: 12px;
  color: var(--text-secondary);
  font-size: 13px;
  border-top: 1px solid var(--border-color);
  margin-top: 8px;
}

.remove-button {
  padding: 6px 12px;
  font-size: 13px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.remove-button:hover {
  background-color: #c82333;
}
</style>
