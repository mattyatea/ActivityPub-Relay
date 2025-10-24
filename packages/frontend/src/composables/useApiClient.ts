import { ref, readonly, onMounted } from 'vue'
import { contract } from '@activitypub-relay/contract'
import { createORPCClient } from '@orpc/client'
import { OpenAPILink } from '@orpc/openapi-client/fetch'
import type { ContractRouterClient } from '@orpc/contract'
import type { JsonifiedClient } from '@orpc/openapi-client'

const apiKey = ref('')
const authenticated = ref(false)

export function useApiClient() {
  onMounted(() => {
    // Restore API key from localStorage on mount
    const stored = localStorage.getItem('api-key')
    if (stored) {
      apiKey.value = stored
      authenticated.value = true
    }
  })

  const setApiKey = (key: string) => {
    apiKey.value = key
    if (key) {
      localStorage.setItem('api-key', key)
      authenticated.value = true
    } else {
      localStorage.removeItem('api-key')
      authenticated.value = false
    }
  }

  const clearApiKey = () => {
    apiKey.value = ''
    authenticated.value = false
    localStorage.removeItem('api-key')
  }

  // Get API URL based on current origin
  const getApiUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api`
    }
    return '/api'
  }

  // Create ORPC client with dynamic API key
  const link = new OpenAPILink(contract, {
    url: getApiUrl(),
    headers: () => ({
      'X-API-Key': apiKey.value,
    }),
  })

  const orpc: JsonifiedClient<ContractRouterClient<typeof contract>> = createORPCClient(link)

  return {
    apiKey: readonly(apiKey),
    authenticated: readonly(authenticated),
    setApiKey,
    clearApiKey,
    orpc
  }
}

// Legacy export for backward compatibility
export function setApiKey(key: string) {
  apiKey.value = key
  if (key) {
    localStorage.setItem('api-key', key)
  } else {
    localStorage.removeItem('api-key')
  }
}

// Legacy ORPC client export
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`
  }
  return '/api'
}

const link = new OpenAPILink(contract, {
  url: getApiUrl(),
  headers: () => ({
    'X-API-Key': apiKey.value,
  }),
})

export const orpc: JsonifiedClient<ContractRouterClient<typeof contract>> = createORPCClient(link)
