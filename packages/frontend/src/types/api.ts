// API型定義
// contract から型を自動推論して使用

import type { orpc } from '../composables/useApiClient'

// 各APIのレスポンス型を推論
export type FollowRequest = Awaited<ReturnType<typeof orpc.followRequests.list>>['requests'][number]
export type DomainRule = Awaited<ReturnType<typeof orpc.domainRules.list>>['rules'][number]
export type Actor = Awaited<ReturnType<typeof orpc.actors.list>>['actors'][number]
export type Settings = Awaited<ReturnType<typeof orpc.settings.get>>

// フォームの型定義
export interface NewDomainRule {
  pattern: string
  isRegex: boolean
  reason?: string
}

// アラートの型
export type AlertType = 'success' | 'error' | 'warning' | 'info'

export interface AlertMessage {
  message: string
  type: AlertType
}
