import { createPrismaClient } from '@/lib/prisma.ts';
import type { Bindings } from '@/server.ts';
import type { APActivity } from '@/types/activityPubTypes.ts';
import type {
	FollowRequestStatus,
	ListFollowRequestsResponse,
} from '@/types/api.ts';
import { acceptFollow, rejectFollow } from '@/utils/activityPub.ts';

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
	env: Bindings,
): Promise<ListFollowRequestsResponse> {
	const prisma = createPrismaClient(env.DB);
	try {
		const [requests, total] = await Promise.all([
			prisma.followRequest.findMany({
				take: limit,
				skip: offset,
				orderBy: { id: 'desc' },
			}),
			prisma.followRequest.count(),
		]);

		return {
			requests: requests.map((r) => ({
				id: r.id,
				actorId: r.actor ?? '',
				status: 'pending' as FollowRequestStatus,
				createdAt: undefined,
			})),
			total,
		};
	} finally {
		await prisma.$disconnect();
	}
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

		// アクター情報を取得
		if (!followRequest.actor) {
			console.error('No actor found for follow request:', followRequestId);
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

		// アクター情報をfetchする
		const { fetchActor } = await import('@/utils/activityPub.ts');
		const actorData = await fetchActor(followRequest.actor);

		// actorテーブルに追加
		await prisma.actor.upsert({
			where: { id: followRequest.actor },
			update: {
				inbox: actorData.inbox,
				sharedInbox: actorData.endpoints?.sharedInbox ?? null,
				publicKey: actorData.publicKey?.publicKeyPem ?? null,
			},
			create: {
				id: followRequest.actor,
				inbox: actorData.inbox,
				sharedInbox: actorData.endpoints?.sharedInbox ?? null,
				publicKey: actorData.publicKey?.publicKeyPem ?? null,
			},
		});

		// Accept送信
		await acceptFollow(activity, actorData.inbox, env);

		// followRequestから削除
		await prisma.followRequest.delete({
			where: { id: followRequestId },
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

		if (!followRequest.actor) {
			console.error('No actor found for follow request:', followRequestId);
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

		// アクター情報をfetchする
		const { fetchActor } = await import('@/utils/activityPub.ts');
		const actorData = await fetchActor(followRequest.actor);

		// Reject送信
		await rejectFollow(activity, actorData.inbox, env);

		// followRequestから削除
		await prisma.followRequest.delete({
			where: { id: followRequestId },
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
