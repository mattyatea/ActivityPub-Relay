import { eq } from 'drizzle-orm';
import type { Context } from 'hono';
import { actors, followRequests, settings } from '@/db/schema.ts';
import { createDb } from '@/lib/db.ts';
import type { AppEnv } from '@/middleware/requestLogging.ts';
import { invalidateDeliveryRecipientCache } from '@/service/CacheService.ts';
import type { APActivity, APActor } from '@/types/activityPubTypes.ts';
import {
	acceptFollow,
	checkPublicCollection,
	fetchActorWithCache,
} from '@/utils/activityPub.ts';
import {
	extractDomainFromActorId,
	isDomainBlocked,
} from '@/utils/domainBlock.ts';
import { createActivityLogger, sanitizeError } from '@/utils/logger.ts';

/**
 * Follow Activityを処理する
 *
 * @description
 * リレーへのフォローリクエストを処理し、フォロワー情報をデータベースに保存して、
 * Accept Activityを返信します。
 *
 * @param activity - 受信したFollow Activity
 * @param actor - リクエストを送信したアクター情報
 * @param context - Honoのコンテキスト(環境変数とD1データベースへのアクセスを含む)
 * @returns {Promise<boolean>} 処理が成功した場合はtrue、失敗した場合はfalse
 *
 * @remarks
 * - アクティビティがpublicコレクション宛でない場合は失敗します
 * - フォローリクエストをデータベースに保存します
 * - 自動承認モードの場合はactorテーブルに追加してAcceptを送信します
 */
export const followActivity = async (
	activity: APActivity,
	actor: APActor,
	context: Context<AppEnv>,
): Promise<boolean> => {
	const logger = createActivityLogger('Follow', activity.actor);

	if (checkPublicCollection(activity)) {
		const db = createDb(context.env.DB);
		try {
			let followerRecord = actor;
			if (actor.id !== activity.actor) {
				followerRecord = await fetchActorWithCache(activity.actor, context.env);
			}

			// ドメインブロックチェック
			const domain = extractDomainFromActorId(activity.actor);
			if (!domain) {
				logger.error('Failed to extract domain from actor ID', {
					actorId: activity.actor,
				});
				return false;
			}
			if (await isDomainBlocked(domain, context.env.DB)) {
				logger.warn('Follow request rejected: domain is blocked', {
					domain,
					actorId: activity.actor,
				});
				return false;
			}

			// 自動承認モードの確認
			const autoApproveSetting = await db
				.select()
				.from(settings)
				.where(eq(settings.key, 'auto_approve_follows'))
				.get();

			const autoApprove = autoApproveSetting?.value === 'true';

			// フォローリクエストの存在確認と作成
			const existingFollowRequest = await db
				.select()
				.from(followRequests)
				.where(eq(followRequests.id, activity.id))
				.get();

			if (!existingFollowRequest) {
				const followObjectId: string | null =
					typeof activity.object === 'string'
						? activity.object
						: typeof activity.object?.id === 'string'
							? activity.object.id
							: null;

				await db.insert(followRequests).values({
					id: activity.id,
					actor: activity.actor,
					object: followObjectId,
					activityJson: JSON.stringify(activity),
				});
			}

			// 自動承認モードの場合は即座にactorテーブルに追加してAcceptを送信
			if (autoApprove) {
				try {
					// actorテーブルに追加
					await db
						.insert(actors)
						.values({
							id: activity.actor,
							inbox: followerRecord.inbox,
							sharedInbox: followerRecord.endpoints?.sharedInbox ?? null,
							publicKey: followerRecord.publicKey?.publicKeyPem ?? null,
						})
						.onConflictDoUpdate({
							target: actors.id,
							set: {
								inbox: followerRecord.inbox,
								sharedInbox: followerRecord.endpoints?.sharedInbox ?? null,
								publicKey: followerRecord.publicKey?.publicKeyPem ?? null,
							},
						});
					await invalidateDeliveryRecipientCache(context.env);

					// Accept送信
					await acceptFollow(activity, followerRecord.inbox, context.env);

					// followRequestから削除
					await db
						.delete(followRequests)
						.where(eq(followRequests.id, activity.id));

					logger.info('Follow request auto-approved and Accept sent', {
						domain,
						inbox: followerRecord.inbox,
					});
				} catch (error) {
					logger.error('Failed to send Accept', {
						domain,
						...sanitizeError(error),
					});
					return false;
				}
			} else {
				logger.info('Follow request saved as pending', {
					domain,
					requiresManualApproval: true,
				});
			}

			return true;
		} catch (error) {
			logger.error('Failed to process follow activity', {
				...sanitizeError(error),
			});
			return false;
		}
	} else {
		logger.warn('Follow activity is not for the public collection', {
			activityId: activity.id,
		});
		return false;
	}
};
