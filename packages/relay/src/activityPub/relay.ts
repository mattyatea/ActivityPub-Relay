import type { Context } from 'hono';
import { actors } from '@/db/schema.ts';
import { createDb } from '@/lib/db.ts';
import type { AppEnv } from '@/middleware/requestLogging.ts';
import type { APActivity } from '@/types/activityPubTypes.ts';
import { checkPublicCollection, sendActivity } from '@/utils/activityPub.ts';
import { signHeaders } from '@/utils/httpSignature.ts';
import { createActivityLogger, sanitizeError } from '@/utils/logger.ts';

const DELIVERY_CONCURRENCY = 12;
const DELIVERY_RECIPIENT_MEMO_TTL_MS = 5_000;

type DeliveryRecipient = {
	actorHost: string | null;
	inbox: string;
};

type DeliveryRecipientMemo = {
	expiresAt: number;
	recipients: DeliveryRecipient[];
};

let deliveryRecipientMemo: DeliveryRecipientMemo | null = null;
let deliveryRecipientMemoRefresh: Promise<DeliveryRecipient[]> | null = null;

const safeHostname = (value: string) => {
	try {
		return new URL(value).hostname;
	} catch {
		return null;
	}
};

async function getDeliveryRecipients(env: Env): Promise<DeliveryRecipient[]> {
	const now = Date.now();
	if (deliveryRecipientMemo && deliveryRecipientMemo.expiresAt > now) {
		return deliveryRecipientMemo.recipients;
	}

	if (deliveryRecipientMemoRefresh) {
		return await deliveryRecipientMemoRefresh;
	}

	deliveryRecipientMemoRefresh = loadDeliveryRecipients(env, now);
	try {
		return await deliveryRecipientMemoRefresh;
	} finally {
		deliveryRecipientMemoRefresh = null;
	}
}

async function loadDeliveryRecipients(
	env: Env,
	startedAt: number,
): Promise<DeliveryRecipient[]> {
	const db = createDb(env.DB);
	// 承認済みフォロワーはactorテーブルに保存されるため、直接取得する
	const followers = await db
		.select({
			id: actors.id,
			inbox: actors.inbox,
			sharedInbox: actors.sharedInbox,
		})
		.from(actors);

	const recipientsByInbox = new Map<string, DeliveryRecipient>();
	for (const follower of followers) {
		const inbox = follower.sharedInbox ?? follower.inbox;
		if (!recipientsByInbox.has(inbox)) {
			recipientsByInbox.set(inbox, {
				actorHost: safeHostname(follower.id),
				inbox,
			});
		}
	}

	const recipients = Array.from(recipientsByInbox.values());
	deliveryRecipientMemo = {
		expiresAt: startedAt + DELIVERY_RECIPIENT_MEMO_TTL_MS,
		recipients,
	};

	return recipients;
}

async function settleDeliveries(
	recipients: DeliveryRecipient[],
	deliver: (recipient: DeliveryRecipient) => Promise<void>,
): Promise<PromiseSettledResult<void>[]> {
	const results: PromiseSettledResult<void>[] = [];
	let nextIndex = 0;

	async function worker() {
		while (true) {
			const currentIndex = nextIndex;
			nextIndex += 1;

			const recipient = recipients[currentIndex];
			if (!recipient) {
				return;
			}

			try {
				await deliver(recipient);
				results[currentIndex] = { status: 'fulfilled', value: undefined };
			} catch (reason) {
				results[currentIndex] = { status: 'rejected', reason };
			}
		}
	}

	const workers = Array.from(
		{ length: Math.min(DELIVERY_CONCURRENCY, recipients.length) },
		() => worker(),
	);
	await Promise.all(workers);

	return results;
}

/**
 * Create/Announce Activityをリレーする
 *
 * @description
 * 受信したCreate/Announce Activityを、登録されているすべてのフォロワーに配信します。
 * 送信元と同じホストのフォロワーには配信しません。
 *
 * @param activity - 受信したCreate/Announce Activity
 * @param context - Honoのコンテキスト（環境変数とD1データベースへのアクセスを含む）
 * @returns {Promise<{success: boolean; relayedCount: number; failureCount: number}>}
 *   - success: リレー配信をスケジュールできたかどうか
 *   - relayedCount: 配信対象としてスケジュールしたフォロワー数
 *   - failureCount: 同期処理中に判明した失敗数
 *
 * @remarks
 * - アクティビティがpublicコレクション宛でない場合は配信しません
 * - フォロワーが存在しない場合は配信をスキップします
 * - 送信元と同じホストのフォロワーはフィルタリングされます
 * - SharedInboxが利用可能な場合はそちらを優先して使用します
 * - 配信は並列処理されます（Promise.allSettled使用）
 * - 配信失敗は警告ログに記録されます
 */
export const relayActivity = async (
	activity: APActivity,
	context: Context<AppEnv>,
): Promise<{
	success: boolean;
	relayedCount: number;
	failureCount: number;
}> => {
	const logger = createActivityLogger(activity.type, activity.actor);

	if (!checkPublicCollection(activity)) {
		logger.debug('Activity is not for public collection, skipping relay', {
			activityId: activity.id,
		});
		return { success: false, relayedCount: 0, failureCount: 0 };
	}

	const deliveryRecipients = await getDeliveryRecipients(context.env);

	if (deliveryRecipients.length === 0) {
		logger.info('No followers registered, skipping relay', {
			activityId: activity.id,
		});
		return { success: false, relayedCount: 0, failureCount: 0 };
	}

	const originHost = safeHostname(activity.actor);
	const recipients = deliveryRecipients.filter((recipient) => {
		if (!originHost) return true;
		return recipient.actorHost !== originHost;
	});

	if (recipients.length === 0) {
		return { success: false, relayedCount: 0, failureCount: 0 };
	}

	// Stringify activity once and reuse for all deliveries
	const activityJson = JSON.stringify(activity);

	const deliveryTask = settleDeliveries(recipients, async (recipient) => {
		const headers = signHeaders(activityJson, recipient.inbox, context.env);
		await sendActivity(recipient.inbox, activity, headers);
	})
		.then((deliveries) => {
			const failures = deliveries.filter(
				(result) => result.status === 'rejected',
			);
			const relayedCount = deliveries.length - failures.length;
			const failureCount = failures.length;

			if (failures.length > 0) {
				logger.warn('Some deliveries failed during relay', {
					activityId: activity.id,
					totalRecipients: deliveries.length,
					successCount: relayedCount,
					failureCount,
					failureReasons: failures.map((f) =>
						f.status === 'rejected' ? sanitizeError(f.reason) : null,
					),
				});
			} else {
				logger.info('Activity relayed successfully to all followers', {
					activityId: activity.id,
					recipientCount: relayedCount,
				});
			}
		})
		.catch((error) => {
			logger.error('Relay delivery task failed', {
				activityId: activity.id,
				...sanitizeError(error),
			});
		});

	context.executionCtx.waitUntil(deliveryTask);

	return {
		success: true,
		relayedCount: recipients.length,
		failureCount: 0,
	};
};
