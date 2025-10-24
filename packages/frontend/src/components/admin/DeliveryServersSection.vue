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
      </div>
      <div v-if="actorTotal > actors.length" class="list-footer">
        <p>Showing {{ actors.length}} of {{ actorTotal }} servers</p>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import Card from '../Card.vue'
import type { Actor } from '../../types/api'

interface Props {
  actors: Actor[]
  actorTotal: number
}

defineProps<Props>()

const extractDomain = (url: string): string => {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch {
    return url
  }
}
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
</style>
