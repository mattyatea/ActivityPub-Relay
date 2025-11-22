import type {Context} from 'hono';
import {createPrismaClient} from '@/lib/prisma.ts';
import type {APActivity, APActor} from '@/types/activityPubTypes.ts';
import {
    acceptFollow,
    checkPublicCollection,
    fetchActor,
} from '@/utils/activityPub.ts';
import {
    extractDomainFromActorId,
    isDomainBlocked,
} from '@/utils/domainBlock.ts';
import {createActivityLogger, sanitizeError} from '@/utils/logger.ts';

/**
 * Follow Activityを処理する
 *
 * @description
 * リレーへのフォローリクエストを処理し、フォロワー情報をデータベースに保存して、
 * Accept Activityを返信します。
 *
 * @param activity - 受信したFollow Activity
 * @param actor - リクエストを送信したアクター情報
 * @param env - Honoのコンテキスト(環境変数とD1データベースへのアクセスを含む)
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
    env: Env,
): Promise<boolean> => {
    const logger = createActivityLogger('Follow', activity.actor);

    if (checkPublicCollection(activity)) {
        const prisma = createPrismaClient(env.DB);
        try {
            let followerRecord = actor;
            if (actor.id !== activity.actor) {
                followerRecord = await fetchActor(activity.actor);
            }

            // ドメインブロックチェック
            const domain = extractDomainFromActorId(activity.actor);
            if (!domain) {
                logger.error('Failed to extract domain from actor ID', {
                    actorId: activity.actor,
                });
                return false;
            }
            if (await isDomainBlocked(domain, env.DB)) {
                logger.warn('Follow request rejected: domain is blocked', {
                    domain,
                    actorId: activity.actor,
                });
                return false;
            }

            // 自動承認モードの確認
            const autoApproveSetting = await prisma.setting.findUnique({
                where: {key: 'auto_approve_follows'},
            });

            const autoApprove = autoApproveSetting?.value === 'true';

            // フォローリクエストの存在確認と作成
            const existingFollowRequest = await prisma.followRequest.findUnique({
                where: {id: activity.id},
            });

            if (!existingFollowRequest) {
                const followObjectId: string | null =
                    typeof activity.object === 'string'
                        ? activity.object
                        : typeof activity.object?.id === 'string'
                            ? activity.object.id
                            : null;

                await prisma.followRequest.create({
                    data: {
                        id: activity.id,
                        actor: activity.actor,
                        object: followObjectId,
                        activity_json: JSON.stringify(activity),
                    },
                });
            }

            // 自動承認モードの場合は即座にactorテーブルに追加してAcceptを送信
            if (autoApprove) {
                try {
                    // actorテーブルに追加
                    await prisma.actor.upsert({
                        where: {id: activity.actor},
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

                    // Accept送信
                    await acceptFollow(activity, followerRecord.inbox, env);

                    // followRequestから削除
                    await prisma.followRequest.delete({
                        where: {id: activity.id},
                    });

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
        } finally {
            await prisma.$disconnect();
        }
    } else {
        logger.warn('Follow activity is not for the public collection', {
            activityId: activity.id,
        });
        return false;
    }
};
