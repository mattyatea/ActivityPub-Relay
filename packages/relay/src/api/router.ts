import { contract } from '@activitypub-relay/contract';
import { implement } from '@orpc/server';
import type { Bindings } from '@/server.ts';
import {
	listActors as listActorsService,
	removeActor as removeActorService,
} from '@/service/ActorService';
import {
	addDomainRule as addDomainRuleService,
	listDomainRules as listDomainRulesService,
	removeDomainRule as removeDomainRuleService,
} from '@/service/DomainRuleService';
import {
	approveFollowRequest,
	listFollowRequests as listFollowRequestsService,
	rejectFollowRequest,
} from '@/service/FollowService';
import {
	getSettingByKey as getSettingByKeyService,
	getSettings as getSettingsService,
	updateSettingByKey as updateSettingByKeyService,
	updateSettings as updateSettingsService,
} from '@/service/SettingsService';

type Context = {
	env: Bindings;
};

const os = implement(contract).$context<Context>();

// ============================================================
// Settings API
// ============================================================

/**
 * GET /api/settings/get
 * 設定を取得
 */
const getSettings = os.settings.get.handler(async ({ context }) => {
	return await getSettingsService(context.env);
});

/**
 * POST /api/settings/update
 * 設定を更新
 */
const updateSettings = os.settings.update.handler(
	async ({ input, context }) => {
		const success = await updateSettingsService(
			input.domainBlockMode,
			context.env,
		);
		return { success };
	},
);

/**
 * GET /api/settings/{key}
 * 個別の設定を取得
 */
const getSettingByKey = os.settings.getByKey.handler(
	async ({ input, context }) => {
		try {
			return await getSettingByKeyService(input.key, context.env);
		} catch (error) {
			console.error('Failed to get setting by key:', error);
			throw error;
		}
	},
);

/**
 * PUT /api/settings/{key}
 * 個別の設定を更新
 */
const updateSettingByKey = os.settings.updateByKey.handler(
	async ({ input, context }) => {
		try {
			const success = await updateSettingByKeyService(
				input.key,
				input.value,
				context.env,
			);
			return { success };
		} catch (error) {
			console.error('Failed to update setting by key:', error);
			return { success: false };
		}
	},
);

// ============================================================
// Follow Requests API
// ============================================================

/**
 * GET /api/followRequests/list
 * フォロー申請一覧を取得
 */
const listFollowRequests = os.followRequests.list.handler(
	async ({ input, context }) => {
		return await listFollowRequestsService(
			input.limit,
			input.offset,
			context.env,
		);
	},
);

/**
 * POST /api/follow-requests/{id}/approve
 * フォロー申請を承認
 */
const approveFollowRequestHandler = os.followRequests.approve.handler(
	async ({ input, context }) => {
		try {
			const success = await approveFollowRequest(input.id, context.env);
			return { success };
		} catch (error) {
			console.error('Failed to approve follow request:', error);
			return { success: false };
		}
	},
);

/**
 * POST /api/follow-requests/{id}/reject
 * フォロー申請を拒否
 */
const rejectFollowRequestHandler = os.followRequests.reject.handler(
	async ({ input, context }) => {
		try {
			const success = await rejectFollowRequest(input.id, context.env);
			return { success };
		} catch (error) {
			console.error('Failed to reject follow request:', error);
			return { success: false };
		}
	},
);

// ============================================================
// Domain Rules API
// ============================================================

/**
 * GET /api/domainRules/list
 * ドメインルール一覧を取得
 */
const listDomainRules = os.domainRules.list.handler(
	async ({ input, context }) => {
		return await listDomainRulesService(input.limit, input.offset, context.env);
	},
);

/**
 * POST /api/domainRules/add
 * ドメインルールを追加
 */
const addDomainRule = os.domainRules.add.handler(async ({ input, context }) => {
	try {
		const id = await addDomainRuleService(
			input.pattern,
			input.isRegex,
			input.reason,
			context.env,
		);

		return {
			id,
			success: true,
		};
	} catch (error) {
		console.error('Failed to add domain rule:', error);
		throw error;
	}
});

/**
 * POST /api/domainRules/remove
 * ドメインルールを削除
 */
const removeDomainRule = os.domainRules.remove.handler(
	async ({ input, context }) => {
		const success = await removeDomainRuleService(input.id, context.env);
		return { success };
	},
);

// ============================================================
// Actors API
// ============================================================

/**
 * GET /api/actors/list
 * 配送中のサーバー一覧を取得
 */
const listActors = os.actors.list.handler(async ({ input, context }) => {
	return await listActorsService(input.limit, input.offset, context.env);
});

/**
 * DELETE /api/actors/{id}
 * フォロワー(配送サーバー)を削除
 */
const removeActor = os.actors.remove.handler(async ({ input, context }) => {
	try {
		const success = await removeActorService(input.id, context.env);
		return { success };
	} catch (error) {
		console.error('Failed to remove actor:', error);
		return { success: false };
	}
});

export const router = os.router({
	settings: {
		get: getSettings,
		update: updateSettings,
		getByKey: getSettingByKey,
		updateByKey: updateSettingByKey,
	},
	followRequests: {
		list: listFollowRequests,
		approve: approveFollowRequestHandler,
		reject: rejectFollowRequestHandler,
	},
	domainRules: {
		list: listDomainRules,
		add: addDomainRule,
		remove: removeDomainRule,
	},
	actors: {
		list: listActors,
		remove: removeActor,
	},
});
