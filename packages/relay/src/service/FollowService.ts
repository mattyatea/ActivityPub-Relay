import { count, desc, eq } from 'drizzle-orm';
import { actors, followRequests } from '@/db/schema.ts';
import { createDb } from '@/lib/db.ts';
import type { APActivity } from '@/types/activityPubTypes.ts';
import type {
	FollowRequestStatus,
	ListFollowRequestsResponse,
} from '@/types/api.ts';
import { acceptFollow, rejectFollow } from '@/utils/activityPub.ts';
import { createServiceLogger, sanitizeError } from '@/utils/logger.ts';

/**
 * フォロー申請一覧を取得する
 *
 * @param limit - 取得件数
 * @param offset - オフセット
 * @param env - 環境変数とD1データベース
 * @returns {Promise<ListFollowRequestsResponse>}
 */
export async function listFollowRequests(
	limit: number,
	offset: number,
	env: Env,
): Promise<ListFollowRequestsResponse> {
	const db = createDb(env.DB);
	const [requests, totalRows] = await Promise.all([
		db
			.select()
			.from(followRequests)
			.orderBy(desc(followRequests.id))
			.limit(limit)
			.offset(offset),
		db.select({ value: count() }).from(followRequests),
	]);

	return {
		requests: requests.map((r) => ({
			id: r.id,
			actorId: r.actor ?? '',
			status: 'pending' as FollowRequestStatus,
			createdAt: undefined,
		})),
		total: totalRows[0]?.value ?? 0,
	};
}

/**
 * Follow申請を承認する
 *
 * @param followRequestId - 承認するFollowリクエストのID
 * @param env - 環境変数とD1データベース
 * @returns {Promise<boolean>} 成功した場合はtrue
 */
export async function approveFollowRequest(
	followRequestId: string,
	env: Env,
): Promise<boolean> {
	const logger = createServiceLogger('FollowService');
	const db = createDb(env.DB);
	try {
		// Follow申請を取得
		const followRequest = await db
			.select()
			.from(followRequests)
			.where(eq(followRequests.id, followRequestId))
			.get();

		if (!followRequest) {
			logger.error('Follow request not found', { followRequestId });
			return false;
		}

		if (!followRequest.activityJson) {
			logger.error('No activity JSON found for follow request', {
				followRequestId,
			});
			return false;
		}

		// アクター情報を取得
		if (!followRequest.actor) {
			logger.error('No actor found for follow request', { followRequestId });
			return false;
		}

		// DB保存されたActivityを取得
		let activity: APActivity;
		try {
			activity = JSON.parse(followRequest.activityJson);
		} catch (error) {
			logger.error('Invalid activity JSON', {
				followRequestId,
				...sanitizeError(error),
			});
			return false;
		}

		// アクター情報をfetchする
		const { fetchActor } = await import('@/utils/activityPub.ts');
		const actorData = await fetchActor(followRequest.actor);

		// actorテーブルに追加
		await db
			.insert(actors)
			.values({
				id: followRequest.actor,
				inbox: actorData.inbox,
				sharedInbox: actorData.endpoints?.sharedInbox ?? null,
				publicKey: actorData.publicKey?.publicKeyPem ?? null,
			})
			.onConflictDoUpdate({
				target: actors.id,
				set: {
					inbox: actorData.inbox,
					sharedInbox: actorData.endpoints?.sharedInbox ?? null,
					publicKey: actorData.publicKey?.publicKeyPem ?? null,
				},
			});

		// Accept送信
		await acceptFollow(activity, actorData.inbox, env);

		// followRequestから削除
		await db
			.delete(followRequests)
			.where(eq(followRequests.id, followRequestId));

		logger.info('Follow request approved and Accept sent', {
			followRequestId,
			actorId: followRequest.actor,
		});
		return true;
	} catch (error) {
		logger.error('Failed to approve follow request', {
			followRequestId,
			...sanitizeError(error),
		});
		return false;
	}
}

/**
 * Follow申請を拒否する
 *
 * @param followRequestId - 拒否するFollowリクエストのID
 * @param env - 環境変数とD1データベース
 * @returns {Promise<boolean>} 成功した場合はtrue
 */
export async function rejectFollowRequest(
	followRequestId: string,
	env: Env,
): Promise<boolean> {
	const logger = createServiceLogger('FollowService');
	const db = createDb(env.DB);
	try {
		const followRequest = await db
			.select()
			.from(followRequests)
			.where(eq(followRequests.id, followRequestId))
			.get();

		if (!followRequest) {
			logger.error('Follow request not found', { followRequestId });
			return false;
		}

		if (!followRequest.activityJson) {
			logger.error('No activity JSON found for follow request', {
				followRequestId,
			});
			return false;
		}

		if (!followRequest.actor) {
			logger.error('No actor found for follow request', { followRequestId });
			return false;
		}

		// DB保存されたActivityをパース
		let activity: APActivity;
		try {
			activity = JSON.parse(followRequest.activityJson);
		} catch (error) {
			logger.error('Invalid activity JSON', {
				followRequestId,
				...sanitizeError(error),
			});
			return false;
		}

		// アクター情報をfetchする
		const { fetchActor } = await import('@/utils/activityPub.ts');
		const actorData = await fetchActor(followRequest.actor);

		// Reject送信
		await rejectFollow(activity, actorData.inbox, env);

		// followRequestから削除
		await db
			.delete(followRequests)
			.where(eq(followRequests.id, followRequestId));

		logger.info('Follow request rejected and Reject sent', {
			followRequestId,
			actorId: followRequest.actor,
		});
		return true;
	} catch (error) {
		logger.error('Failed to reject follow request', {
			followRequestId,
			...sanitizeError(error),
		});
		return false;
	}
}
