import type { Context } from 'hono';
import { createPrismaClient } from '@/lib/prisma.ts';
import type { APActivity } from '@/types/activityPubTypes.ts';
import { checkPublicCollection, sendActivity } from '@/utils/activityPub.ts';
import { signHeaders } from '@/utils/httpSignature.ts';
import { createActivityLogger, sanitizeError } from '@/utils/logger.ts';

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
 *   - success: リレー処理が成功したかどうか
 *   - relayedCount: 正常に配信できたフォロワー数
 *   - failureCount: 配信に失敗したフォロワー数
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
	context: Context<{
		Bindings: Env;
	}>,
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

	const prisma = createPrismaClient(context.env.DB);
	try {
		// 承認済みフォロワーはactorテーブルに保存されるため、直接取得する
		const followers = await prisma.actor.findMany({
			select: {
				id: true,
				inbox: true,
				sharedInbox: true,
			},
		});

		if (followers.length === 0) {
			logger.info('No followers registered, skipping relay', {
				activityId: activity.id,
			});
			return { success: false, relayedCount: 0, failureCount: 0 };
		}

		const safeHostname = (value: string) => {
			try {
				return new URL(value).hostname;
			} catch {
				return null;
			}
		};

		const originHost = safeHostname(activity.actor);
		const recipients = followers.filter((follower) => {
			if (!originHost) return true;
			const followerHost = safeHostname(follower.id);
			return followerHost !== originHost;
		});

		if (recipients.length === 0) {
			return { success: false, relayedCount: 0, failureCount: 0 };
		}

		const deliveries = await Promise.allSettled(
			recipients.map(async (follower) => {
				const inbox = follower.sharedInbox ?? follower.inbox;
				const headers = signHeaders(
					JSON.stringify(activity),
					inbox,
					context.env,
				);
				await sendActivity(inbox, activity, headers);
			}),
		);

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
					f.status === 'rejected' ? sanitizeError(f.reason) : null
				),
			});
		} else {
			logger.info('Activity relayed successfully to all followers', {
				activityId: activity.id,
				recipientCount: relayedCount,
			});
		}

		return {
			success: true,
			relayedCount,
			failureCount,
		};
	} finally {
		await prisma.$disconnect();
	}
};
