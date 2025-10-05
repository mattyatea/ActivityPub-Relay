import { createPrismaClient } from '@/lib/prisma.ts';
import type { Bindings } from '@/server.ts';
import type { APActivity } from '@/types/activityPubTypes.ts';
import { acceptFollow, rejectFollow } from '@/utils/activityPub.ts';

/**
 * Follow申請を承認する
 *
 * @param followRequestId - 承認するFollowリクエストのID
 * @param env - 環境変数とD1データベース
 * @returns {Promise<boolean>} 成功した場合はtrue
 */
export async function approveFollowRequest(
	followRequestId: string,
	env: Bindings,
): Promise<boolean> {
	const prisma = createPrismaClient(env.DB);
	try {
		// Follow申請を取得
		const followRequest = await prisma.followRequest.findUnique({
			where: { id: followRequestId },
		});

		if (!followRequest) {
			console.error('Follow request not found:', followRequestId);
			return false;
		}

		if (!followRequest.activity_json) {
			console.error(
				'No activity JSON found for follow request:',
				followRequestId,
			);
			return false;
		}

		if (followRequest.status !== 'pending') {
			console.warn(
				`Follow request ${followRequestId} is already ${followRequest.status}`,
			);
			return false;
		}

		// アクター情報を取得
		if (!followRequest.actor) {
			console.error('No actor found for follow request:', followRequestId);
			return false;
		}

		const actor = await prisma.actor.findUnique({
			where: { id: followRequest.actor },
		});

		if (!actor) {
			console.error('Actor not found:', followRequest.actor);
			return false;
		}

		// DB保存されたActivityを取得
		let activity: APActivity;
		try {
			activity = JSON.parse(followRequest.activity_json);
		} catch (error) {
			console.error('Invalid activity JSON:', error);
			return false;
		}

		// Accept送信を先に実行
		await acceptFollow(activity, actor.inbox, env);

		// Accept送信成功後にステータスを更新
		await prisma.followRequest.update({
			where: { id: followRequestId },
			data: { status: 'approved' },
		});

		console.log(`Follow request ${followRequestId} approved and Accept sent`);
		return true;
	} catch (error) {
		console.error('Failed to approve follow request:', error);
		return false;
	} finally {
		await prisma.$disconnect();
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
	env: Bindings,
): Promise<boolean> {
	const prisma = createPrismaClient(env.DB);
	try {
		const followRequest = await prisma.followRequest.findUnique({
			where: { id: followRequestId },
		});

		if (!followRequest) {
			console.error('Follow request not found:', followRequestId);
			return false;
		}

		if (!followRequest.activity_json) {
			console.error(
				'No activity JSON found for follow request:',
				followRequestId,
			);
			return false;
		}

		if (followRequest.status !== 'pending') {
			console.warn(
				`Follow request ${followRequestId} is already ${followRequest.status}`,
			);
			return false;
		}

		// DB保存されたActivityをパース
		let activity: APActivity;
		try {
			activity = JSON.parse(followRequest.activity_json);
		} catch (error) {
			console.error('Invalid activity JSON:', error);
			return false;
		}

		// アクター情報を取得
		const actor = await prisma.actor.findUnique({
			where: { id: activity.actor },
		});

		if (!actor) {
			console.error('Actor not found');
			return false;
		}

		// Reject送信を先に実行
		await rejectFollow(activity, actor.inbox, env);

		// Reject送信成功後にステータスを更新
		await prisma.followRequest.update({
			where: { id: followRequestId },
			data: { status: 'rejected' },
		});

		console.log(`Follow request ${followRequestId} rejected and Reject sent`);
		return true;
	} catch (error) {
		console.error('Failed to reject follow request:', error);
		return false;
	} finally {
		await prisma.$disconnect();
	}
}
