<template>
  <Card title="Settings" class="section">
    <div class="form-group">
      <label>Domain Block Mode</label>
      <select v-model="localSettings.domainBlockMode">
        <option value="whitelist">Whitelist (only allow listed domains)</option>
        <option value="blacklist">Blacklist (block listed domains)</option>
      </select>
    </div>
    <button @click="handleSave" :disabled="saving">
      {{ saving ? 'Saving...' : 'Save Settings' }}
    </button>
  </Card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import Card from '../Card.vue'
import type { Settings } from '../../types/api'

interface Props {
  settings: Settings
  saving?: boolean
}

interface Emits {
  (e: 'save', settings: Settings): void
}

const props = withDefaults(defineProps<Props>(), {
  saving: false
})
const emit = defineEmits<Emits>()

const localSettings = ref<Settings>({ ...props.settings })

watch(() => props.settings, (newSettings) => {
  localSettings.value = { ...newSettings }
}, { deep: true })

const handleSave = () => {
  emit('save', localSettings.value)
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
</style>
