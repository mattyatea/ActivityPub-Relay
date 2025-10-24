<template>
  <Card title="Follow Requests" class="section">
    <div v-if="followRequests.length === 0" class="empty">
      <p>No pending follow requests</p>
    </div>
    <div v-else class="list">
      <div v-for="request in followRequests" :key="request.id" class="list-item">
        <div class="list-item-info">
          <div class="list-item-id">{{ request.id }}</div>
          <div class="list-item-text">{{ request.actorId }}</div>
        </div>
        <div class="list-item-actions">
          <button
            @click="$emit('approve', request.id)"
            :disabled="loadingActions.approve.has(request.id)"
          >
            {{ loadingActions.approve.has(request.id) ? 'Approving...' : 'Approve' }}
          </button>
          <button
            @click="$emit('reject', request.id)"
            class="danger"
            :disabled="loadingActions.reject.has(request.id)"
          >
            {{ loadingActions.reject.has(request.id) ? 'Rejecting...' : 'Reject' }}
          </button>
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import type { FollowRequest } from '../../types/api';
import Card from '../Card.vue';

interface Props {
	followRequests: FollowRequest[];
}

interface Emits {
	(e: 'approve', id: string): void;
	(e: 'reject', id: string): void;
}

defineProps<Props>();
defineEmits<Emits>();

const loadingActions = reactive({
	approve: new Set<string>(),
	reject: new Set<string>(),
});
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

.list-item-actions {
  display: flex;
  gap: 8px;
}

.list-item-actions button {
  padding: 8px 16px;
  font-size: 13px;
}

@media (max-width: 768px) {
  .list-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .list-item-actions {
    width: 100%;
  }

  .list-item-actions button {
    flex: 1;
  }
}
</style>
