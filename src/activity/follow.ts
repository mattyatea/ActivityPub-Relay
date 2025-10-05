import type { Context } from 'hono';
import { createPrismaClient } from '@/lib/prisma.ts';
import type { Bindings } from '@/server.ts';
import type { APActivity, APActor } from '@/types/activityPubTypes.ts';
import {
	acceptFollow,
	checkPublicCollection,
	fetchActor,
} from '@/utils/activityPub.ts';
import {
	extractDomainFromActorId,
	isDomainBlocked,
} from '@/utils/domainBlock.ts';

/**
 * Follow Activityを処理する
 *
 * @description
 * リレーへのフォローリクエストを処理し、フォロワー情報をデータベースに保存して、
 * Accept Activityを返信します。
 *
 * @param activity - 受信したFollow Activity
 * @param actor - リクエストを送信したアクター情報
 * @param context - Honoのコンテキスト（環境変数とD1データベースへのアクセスを含む）
 * @returns {Promise<boolean>} 処理が成功した場合はtrue、失敗した場合はfalse
 *
 * @remarks
 * - アクティビティがpublicコレクション宛でない場合は失敗します
 * - アクター情報とフォローリクエストをデータベースに保存します
 * - 既存のアクターの場合は情報を更新します
 * - Accept Activityの送信に失敗した場合はfalseを返します
 */
export const followActivity = async (
	activity: APActivity,
	actor: APActor,
	context: Context<{
		Bindings: Bindings;
	}>,
): Promise<boolean> => {
	if (checkPublicCollection(activity)) {
		const prisma = createPrismaClient(context.env.DB);
		try {
			let followerRecord = actor;
			if (actor.id !== activity.actor) {
				followerRecord = await fetchActor(activity.actor);
			}

			// ドメインブロックチェック
			const domain = extractDomainFromActorId(activity.actor);
			if (!domain) {
				console.error(
					'Failed to extract domain from actor ID:',
					activity.actor,
				);
				return false;
			}
			if (await isDomainBlocked(domain, context.env.DB)) {
				console.warn(`Follow request rejected: domain ${domain} is blocked`);
				return false;
			}

			// アクターの存在確認とupsert
			await prisma.actor.upsert({
				where: { id: activity.actor },
				update: {
					inbox: followerRecord.inbox,
					sharedInbox: followerRecord.endpoints?.sharedInbox ?? null,
					publicKey: followerRecord.publicKey?.publicKeyPem ?? null,
				},
				create: {
					id: activity.actor,
					inbox: followerRecord.inbox,
					sharedInbox: followerRecord.endpoints?.sharedInbox ?? null,
					publicKey: followerRecord.publicKey?.publicKeyPem ?? null,
				},
			});

			// 自動承認モードの確認
			const autoApproveSetting = await prisma.setting.findUnique({
				where: { key: 'auto_approve_follows' },
			});

			const autoApprove = autoApproveSetting?.value === 'true';

			// フォローリクエストの存在確認と作成
			const existingFollowRequest = await prisma.followRequest.findUnique({
				where: { id: activity.id },
			});

			if (!existingFollowRequest) {
				const followObjectId: string | null =
					typeof activity.object === 'string'
						? activity.object
						: typeof activity.object?.id === 'string'
							? activity.object.id
							: null;

				const initialStatus = autoApprove ? 'approved' : 'pending';

				await prisma.followRequest.create({
					data: {
						id: activity.id,
						actor: activity.actor,
						object: followObjectId,
						status: initialStatus,
						activity_json: JSON.stringify(activity),
					},
				});
			}

			// 自動承認モードの場合は即座にAcceptを送信
			if (autoApprove) {
				try {
					await acceptFollow(activity, followerRecord.inbox, context.env);
					console.log(
						`Follow request from ${activity.actor} auto-approved and Accept sent`,
					);
				} catch (error) {
					console.error('Failed to send Accept:', error);
					return false;
				}
			} else {
				// Accept は送らず、承認待ちとして保存するのみ
				console.log(`Follow request from ${activity.actor} saved as pending`);
			}

			return true;
		} catch (error) {
			console.error('Failed to process follow activity:', error);
			return false;
		} finally {
			await prisma.$disconnect();
		}
	} else {
		console.warn('Follow activity is not for the public collection');
		return false;
	}
};
