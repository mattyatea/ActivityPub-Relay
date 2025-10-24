import { createPrismaClient } from '@/lib/prisma';
import { removeFollower } from '@/utils/activityPub';

export async function listActors(limit: number, offset: number, env: Env) {
	const prisma = createPrismaClient(env.DB);
	try {
		const [actors, total] = await Promise.all([
			prisma.actor.findMany({
				take: limit,
				skip: offset,
				orderBy: { id: 'asc' },
			}),
			prisma.actor.count(),
		]);
		return { actors, total };
	} finally {
		await prisma.$disconnect();
	}
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
	const prisma = createPrismaClient(env.DB);
	try {
		// アクター情報を取得
		const actor = await prisma.actor.findUnique({
			where: { id: actorId },
		});

		if (!actor) {
			console.error('Actor not found:', actorId);
			return false;
		}

		// Reject Activityを送信
		const targetInbox = actor.sharedInbox ?? actor.inbox;
		try {
			await removeFollower(actorId, targetInbox, env);
			console.log(
				`Reject activity sent to ${targetInbox} for actor ${actorId}`,
			);
		} catch (error) {
			console.error('Failed to send Reject activity:', error);
			// Reject送信に失敗してもDBからは削除する
		}

		// DBからアクターを削除
		await prisma.actor.delete({
			where: { id: actorId },
		});

		console.log(`Actor ${actorId} removed successfully`);
		return true;
	} catch (error) {
		console.error('Failed to remove actor:', error);
		return false;
	} finally {
		await prisma.$disconnect();
	}
}
