// API関連の型定義

// ============================================================
// Settings
// ============================================================

export type DomainBlockMode = 'whitelist' | 'blacklist';

export type SettingsResponse = {
	domainBlockMode: DomainBlockMode;
};

// ============================================================
// Follow Requests
// ============================================================

export type FollowRequestStatus = 'pending' | 'approved' | 'rejected';

export type FollowRequestItem = {
	id: string;
	actorId: string;
	status: FollowRequestStatus;
	createdAt?: number;
};

export type ListFollowRequestsResponse = {
	requests: FollowRequestItem[];
	total: number;
};

// ============================================================
// Domain Rules
// ============================================================

export type DomainRule = {
	id: number;
	pattern: string;
	isRegex: boolean;
	reason?: string;
	createdAt?: number;
};

export type ListDomainRulesResponse = {
	rules: DomainRule[];
	total: number;
};
