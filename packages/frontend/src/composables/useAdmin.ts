import { ref, computed } from 'vue'
import apiClient from '../api/client'
import type { FollowRequest, DomainRule, Settings } from '../api/client'

export function useAdmin() {
  const apiKey = ref('')
  const authenticated = ref(false)
  const loading = ref(false)
  const error = ref('')

  const followRequests = ref<FollowRequest[]>([])
  const domainRules = ref<DomainRule[]>([])
  const settings = ref<Settings>({ autoApprove: false })

  const isAuthenticated = computed(() => authenticated.value)
  const hasFollowRequests = computed(() => followRequests.value.length > 0)
  const hasDomainRules = computed(() => domainRules.value.length > 0)

  const setError = (message: string) => {
    error.value = message
    setTimeout(() => {
      error.value = ''
    }, 5000)
  }

  const authenticate = async (key: string) => {
    loading.value = true
    error.value = ''

    try {
      apiClient.setApiKey(key)
      // Test connection by fetching settings
      await apiClient.getSettings()
      apiKey.value = key
      authenticated.value = true
      await loadData()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
      authenticated.value = false
      return false
    } finally {
      loading.value = false
    }
  }

  const loadData = async () => {
    try {
      const [requests, rules, sett] = await Promise.all([
        apiClient.getFollowRequests(),
        apiClient.getDomainRules(),
        apiClient.getSettings(),
      ])

      followRequests.value = requests
      domainRules.value = rules
      settings.value = sett
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    }
  }

  const approveFollow = async (id: string) => {
    try {
      await apiClient.approveFollowRequest(id)
      followRequests.value = followRequests.value.filter((r) => r.id !== id)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve follow')
      return false
    }
  }

  const rejectFollow = async (id: string) => {
    try {
      await apiClient.rejectFollowRequest(id)
      followRequests.value = followRequests.value.filter((r) => r.id !== id)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject follow')
      return false
    }
  }

  const addRule = async (domain: string, type: 'whitelist' | 'blacklist') => {
    try {
      const newRule = await apiClient.createDomainRule({ domain, type })
      domainRules.value.push(newRule)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add rule')
      return false
    }
  }

  const deleteRule = async (id: string) => {
    try {
      await apiClient.deleteDomainRule(id)
      domainRules.value = domainRules.value.filter((r) => r.id !== id)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete rule')
      return false
    }
  }

  const updateSettings = async (newSettings: Partial<Settings>) => {
    try {
      const updated = await apiClient.updateSettings(newSettings)
      settings.value = updated
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings')
      return false
    }
  }

  return {
    // State
    apiKey,
    authenticated,
    loading,
    error,
    followRequests,
    domainRules,
    settings,

    // Computed
    isAuthenticated,
    hasFollowRequests,
    hasDomainRules,

    // Methods
    authenticate,
    loadData,
    approveFollow,
    rejectFollow,
    addRule,
    deleteRule,
    updateSettings,
    setError,
  }
}
