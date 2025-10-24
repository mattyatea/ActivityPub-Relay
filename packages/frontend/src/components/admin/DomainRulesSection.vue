<template>
  <Card title="Domain Rules" class="section">
    <div class="form-group">
      <label>
        Pattern
        <span v-if="!isValidPattern && newRule.pattern" class="validation-error">
          Invalid pattern format
        </span>
      </label>
      <input
        v-model="newRule.pattern"
        :class="{ 'is-invalid': !isValidPattern && newRule.pattern }"
        placeholder="example.com"
        @keyup.enter="handleAddRule"
      />
    </div>
    <div class="form-group">
      <label class="checkbox-label">
        <input v-model="newRule.isRegex" type="checkbox" />
        <span>Is Regex Pattern</span>
      </label>
      <small v-if="newRule.isRegex" class="help-text">
        JavaScript regex pattern (e.g., ^example\\.com$)
      </small>
    </div>
    <div class="form-group">
      <label>Reason (optional)</label>
      <input
        v-model="newRule.reason"
        placeholder="Why block/allow this domain?"
        @keyup.enter="handleAddRule"
      />
    </div>
    <button @click="handleAddRule" :disabled="!newRule.pattern || !isValidPattern || adding">
      {{ adding ? 'Adding...' : 'Add Rule' }}
    </button>

    <div v-if="domainRules.length > 0" class="list">
      <div v-for="rule in domainRules" :key="rule.id" class="list-item">
        <div class="list-item-info">
          <div class="list-item-id">{{ rule.pattern }}</div>
          <span class="badge" v-if="rule.isRegex">Regex</span>
          <span v-if="rule.reason" class="rule-reason">{{ rule.reason }}</span>
        </div>
        <button
          @click="$emit('delete', rule.id)"
          class="danger"
          :disabled="deleting.has(rule.id)"
        >
          {{ deleting.has(rule.id) ? 'Deleting...' : 'Delete' }}
        </button>
      </div>
    </div>
    <div v-else class="empty">
      <p>No domain rules configured</p>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import Card from '../Card.vue'
import type { DomainRule, NewDomainRule } from '../../types/api'

interface Props {
  domainRules: DomainRule[]
  adding?: boolean
}

interface Emits {
  (e: 'add', rule: NewDomainRule): void
  (e: 'delete', id: number): void
}

withDefaults(defineProps<Props>(), {
  adding: false
})
const emit = defineEmits<Emits>()

const newRule = ref<NewDomainRule>({
  pattern: '',
  isRegex: false,
  reason: ''
})

const deleting = reactive(new Set<number>())

const isValidPattern = computed(() => {
  if (!newRule.value.pattern) return true
  if (newRule.value.isRegex) {
    try {
      new RegExp(newRule.value.pattern)
      return true
    } catch {
      return false
    }
  }
  return true
})

const handleAddRule = () => {
  if (newRule.value.pattern && isValidPattern.value) {
    emit('add', { ...newRule.value })
    newRule.value = { pattern: '', isRegex: false, reason: '' }
  }
}
</script>

<style scoped>
.section {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  color: var(--text-primary);
}

.validation-error {
  color: var(--error-text);
  font-size: 12px;
  margin-left: 8px;
}

.is-invalid {
  border-color: var(--error-text) !important;
}

.help-text {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  font-size: 14px;
}

.checkbox-label input[type='checkbox'] {
  width: auto;
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
  flex-wrap: wrap;
}

.list-item-id {
  font-size: 13px;
  font-family: monospace;
  color: var(--text-primary);
}

.rule-reason {
  font-size: 12px;
  color: var(--text-secondary);
  font-style: italic;
}

.badge {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 3px;
  background: #3b82f6;
  color: white;
}
</style>
