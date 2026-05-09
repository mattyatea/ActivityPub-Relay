import { asc, count, eq } from 'drizzle-orm';
import { actors } from '@/db/schema.ts';
import { createDb } from '@/lib/db.ts';
import { removeFollower } from '@/utils/activityPub';
import { createServiceLogger, sanitizeError } from '@/utils/logger';

export async function listActors(limit: number, offset: number, env: Env) {
	const db = createDb(env.DB);
	const [actorRows, totalRows] = await Promise.all([
		db
			.select()
			.from(actors)
			.orderBy(asc(actors.id))
			.limit(limit)
			.offset(offset),
		db.select({ value: count() }).from(actors),
	]);

	return { actors: actorRows, total: totalRows[0]?.value ?? 0 };
}

/**
 * フォロワー(配送サーバー)を削除する
 * Reject Activityを送信してフォロー関係を解除し、DBから削除する
 *
 * @param actorId - 削除するアクターのID (URL形式)
 * @param env - 環境変数とD1データベース
 * @returns {Promise<boolean>} 成功した場合はtrue
 */
export async function removeActor(actorId: string, env: Env): Promise<boolean> {
	const logger = createServiceLogger('ActorService');
	const db = createDb(env.DB);
	try {
		// アクター情報を取得
		const actor = await db
			.select()
			.from(actors)
			.where(eq(actors.id, actorId))
			.get();

		if (!actor) {
			logger.error('Actor not found', { actorId });
			return false;
		}

		// Reject Activityを送信
		const targetInbox = actor.sharedInbox ?? actor.inbox;
		try {
			await removeFollower(actorId, targetInbox, env);
			logger.info('Reject activity sent to actor', {
				actorId,
				targetInbox,
			});
		} catch (error) {
			logger.warn(
				'Failed to send Reject activity, proceeding with DB deletion',
				{
					actorId,
					targetInbox,
					...sanitizeError(error),
				},
			);
			// Reject送信に失敗してもDBからは削除する
		}

		// DBからアクターを削除
		await db.delete(actors).where(eq(actors.id, actorId));

		logger.info('Actor removed successfully', { actorId });
		return true;
	} catch (error) {
		logger.error('Failed to remove actor', {
			actorId,
			...sanitizeError(error),
		});
		return false;
	}
}
