<template>
  <div class="admin">
    <h1>Admin Panel</h1>

    <Alert v-if="alertMessage" :message="alertMessage" :type="alertType" />

    <!-- API Key Section -->
    <Card title="API Authentication" class="section">
      <div class="form-group">
        <input
          v-model="apiKey"
          type="password"
          placeholder="Enter your API key"
          @keyup.enter="testConnection"
          :disabled="authenticated"
        />
      </div>
      <div class="button-group">
        <button
          @click="testConnection"
          :disabled="!apiKey || loading"
        >
          {{ authenticated ? 'Authenticated' : 'Connect' }}
        </button>
        <button v-if="authenticated" @click="logout" class="danger">
          Disconnect
        </button>
      </div>
    </Card>

    <!-- Settings Section -->
    <Card v-if="authenticated" title="Settings" class="section">
      <div class="form-group">
        <label>Domain Block Mode</label>
        <select v-model="settings.domainBlockMode">
          <option value="whitelist">Whitelist (only allow listed domains)</option>
          <option value="blacklist">Blacklist (block listed domains)</option>
        </select>
      </div>
      <button @click="updateSettings">Save Settings</button>
    </Card>

    <!-- Follow Requests Section -->
    <Card v-if="authenticated" title="Follow Requests" class="section">
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
            <button @click="approveFollow(request.id)">Approve</button>
            <button @click="rejectFollow(request.id)" class="danger">Reject</button>
          </div>
        </div>
      </div>
    </Card>

    <!-- Domain Rules Section -->
    <Card v-if="authenticated" title="Domain Rules" class="section">
      <div class="form-group">
        <label>Pattern</label>
        <input
          v-model="newRule.pattern"
          placeholder="example.com"
          @keyup.enter="addRule"
        />
      </div>
      <div class="form-group">
        <label class="checkbox-label">
          <input v-model="newRule.isRegex" type="checkbox" />
          <span>Is Regex Pattern</span>
        </label>
      </div>
      <div class="form-group">
        <label>Reason (optional)</label>
        <input
          v-model="newRule.reason"
          placeholder="Why block/allow this domain?"
          @keyup.enter="addRule"
        />
      </div>
      <button @click="addRule" :disabled="!newRule.pattern">
        Add Rule
      </button>

      <div v-if="domainRules.length > 0" class="list">
        <div v-for="rule in domainRules" :key="rule.id" class="list-item">
          <div class="list-item-info">
            <div class="list-item-id">{{ rule.pattern }}</div>
            <span class="badge" v-if="rule.isRegex">Regex</span>
          </div>
          <button @click="deleteRule(rule.id)" class="danger">
            Delete
          </button>
        </div>
      </div>
      <div v-else class="empty">
        <p>No domain rules configured</p>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Card from '../components/Card.vue'
import Alert from '../components/Alert.vue'
import { orpc, setApiKey } from '@/api/client'

const apiKey = ref('')
const authenticated = ref(false)
const loading = ref(false)
const alertMessage = ref('')
const alertType = ref<'success' | 'error' | 'warning' | 'info'>('info')

const settings = ref({
  domainBlockMode: 'blacklist' as 'whitelist' | 'blacklist',
})

const followRequests = ref<Array<{ id: string; actorId: string; status: string }>>([])
const domainRules = ref<Array<{ id: number; pattern: string; isRegex: boolean; reason?: string }>>([])
const newRule = ref({ pattern: '', isRegex: false, reason: '' })

const showAlert = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  alertMessage.value = message
  alertType.value = type
  setTimeout(() => {
    alertMessage.value = ''
  }, 5000)
}

const testConnection = async () => {
  if (!apiKey.value) return

  loading.value = true
  try {
    setApiKey(apiKey.value)
    await loadData()
    authenticated.value = true
    showAlert('Connected successfully!', 'success')
  } catch (error) {
    console.error('Connection error:', error)
    // Check if it's an authentication error
    if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
      showAlert('Authentication failed: Invalid API key', 'error')
    } else {
      showAlert('Failed to connect: ' + (error instanceof Error ? error.message : String(error)), 'error')
    }
    authenticated.value = false
    setApiKey('') // Clear the invalid API key
  } finally {
    loading.value = false
  }
}

const logout = () => {
  apiKey.value = ''
  authenticated.value = false
  followRequests.value = []
  domainRules.value = []
  showAlert('Disconnected', 'info')
}

const loadData = async () => {
  // Load settings
  const settingsData = await orpc.settings.get({})
  settings.value = settingsData

  // Load follow requests
  const followData = await orpc.followRequests.list({
    status: 'pending',
    limit: 50,
    offset: 0
  })
  followRequests.value = followData.requests

  // Load domain rules
  const rulesData = await orpc.domainRules.list({
    limit: 50,
    offset: 0
  })
  domainRules.value = rulesData.rules
}

const approveFollow = async (id: string) => {
  try {
    const result = await orpc.followRequests.approve({ id })
    if (result.success) {
      followRequests.value = followRequests.value.filter((r) => r.id !== id)
      showAlert('Follow request approved!', 'success')
    } else {
      showAlert('Failed to approve follow', 'error')
    }
  } catch (error) {
    console.error('Failed to approve follow:', error)
    showAlert('Failed to approve follow', 'error')
  }
}

const rejectFollow = async (id: string) => {
  try {
    const result = await orpc.followRequests.reject({ id })
    if (result.success) {
      followRequests.value = followRequests.value.filter((r) => r.id !== id)
      showAlert('Follow request rejected', 'info')
    } else {
      showAlert('Failed to reject follow', 'error')
    }
  } catch (error) {
    console.error('Failed to reject follow:', error)
    showAlert('Failed to reject follow', 'error')
  }
}

const addRule = async () => {
  if (!newRule.value.pattern) {
    showAlert('Please enter a domain pattern', 'warning')
    return
  }

  try {
    const result = await orpc.domainRules.add({
      pattern: newRule.value.pattern,
      isRegex: newRule.value.isRegex,
      reason: newRule.value.reason || undefined,
    })

    if (result.success) {
      await loadData()
      newRule.value = { pattern: '', isRegex: false, reason: '' }
      showAlert('Rule added successfully!', 'success')
    } else {
      showAlert('Failed to add rule', 'error')
    }
  } catch (error) {
    console.error('Failed to add rule:', error)
    showAlert('Failed to add rule', 'error')
  }
}

const deleteRule = async (id: number) => {
  try {
    const result = await orpc.domainRules.remove({ id })
    if (result.success) {
      domainRules.value = domainRules.value.filter((r) => r.id !== id)
      showAlert('Rule deleted', 'success')
    } else {
      showAlert('Failed to delete rule', 'error')
    }
  } catch (error) {
    console.error('Failed to delete rule:', error)
    showAlert('Failed to delete rule', 'error')
  }
}

const updateSettings = async () => {
  try {
    const result = await orpc.settings.update({
      domainBlockMode: settings.value.domainBlockMode,
    })

    if (result.success) {
      showAlert('Settings updated!', 'success')
    } else {
      showAlert('Failed to update settings', 'error')
    }
  } catch (error) {
    console.error('Failed to update settings:', error)
    showAlert('Failed to update settings', 'error')
  }
}

// Auto-load data if API key is already set (for development)
// In production, users should enter their API key manually
</script>

<style scoped>
.admin {
  max-width: 800px;
  margin: 0 auto;
}

.admin h1 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
}

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

.button-group {
  display: flex;
  gap: 8px;
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

.list-item-actions {
  display: flex;
  gap: 8px;
}

.list-item-actions button {
  padding: 6px 12px;
  font-size: 13px;
}

.badge {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 3px;
  color: white;
}

.badge.whitelist {
  background: #22c55e;
}

.badge.blacklist {
  background: var(--button-danger);
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
