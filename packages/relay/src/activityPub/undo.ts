import type { Context } from 'hono';
import { createPrismaClient } from '@/lib/prisma.ts';
import type { Bindings } from '@/server.ts';
import type { APActivity } from '@/types/activityPubTypes.ts';
import { createActivityLogger, sanitizeError } from '@/utils/logger.ts';

/**
 * Undo Activityを処理する
 *
 * @description
 * フォローの取り消しリクエストを処理し、データベースからフォローリクエストと
 * アクター情報を削除します。
 *
 * @param activity - 受信したUndo Activity
 * @param context - Honoのコンテキスト（環境変数とD1データベースへのアクセスを含む）
 * @returns {Promise<boolean>} 処理が成功した場合はtrue、objectが存在しない場合はfalse
 *
 * @remarks
 * - activity.objectからフォローリクエストのIDを取得します
 * - フォローリクエストとアクター情報の両方をデータベースから削除します
 * - objectが存在しない場合はfalseを返します
 */
export const undoActivity = async (
	activity: APActivity,
	context: Context<{
		Bindings: Bindings;
	}>,
): Promise<boolean> => {
	const logger = createActivityLogger('Undo', activity.actor);

	const followActivityId =
		typeof activity.object !== 'string' ? activity.object?.id : activity.object;
	if (!followActivityId || typeof followActivityId !== 'string') {
		logger.warn('Invalid Undo activity: missing or invalid object', {
			activityId: activity.id,
			object: activity.object,
		});
		return false;
	}

	const prisma = createPrismaClient(context.env.DB);
	try {
		await prisma.followRequest.delete({
			where: { id: followActivityId },
		});
		await prisma.actor.delete({
			where: { id: activity.actor },
		});
		logger.info('Successfully processed Undo activity', {
			activityId: activity.id,
			followActivityId,
		});
		return true;
	} catch (error) {
		logger.error('Failed to undo activity', {
			activityId: activity.id,
			followActivityId,
			...sanitizeError(error),
		});
		return false;
	} finally {
		await prisma.$disconnect();
	}
};
