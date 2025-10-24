// Type-only exports for frontend (without Zod schemas)
// This file contains only TypeScript types, no runtime validation

export type DomainBlockMode = 'whitelist' | 'blacklist'

export type FollowRequestStatus = 'pending' | 'approved' | 'rejected'

export interface FollowRequest {
  id: string
  actorId: string
  status: FollowRequestStatus
  createdAt?: number
}

export interface DomainRule {
  id: number
  pattern: string
  isRegex: boolean
  reason?: string
  createdAt?: number
}

export interface Actor {
  id: string
  inbox: string
  sharedInbox: string | null
  publicKey: string | null
}

export interface Settings {
  domainBlockMode: DomainBlockMode
}

export interface NewDomainRule {
  pattern: string
  isRegex: boolean
  reason?: string
}

export type AlertType = 'success' | 'error' | 'warning' | 'info'

export interface AlertMessage {
  message: string
  type: AlertType
}
