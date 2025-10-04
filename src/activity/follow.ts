import type { Context } from 'hono';
import type { Bindings } from '@/server.ts';
import type { APActivity, APActor } from '@/types/activityPubTypes.ts';
import { acceptFollow, checkPublicCollection } from '@/utils/activityPub.ts';
import { fetchActor } from '@/utils/httpSignature.ts';

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
		let followerRecord = actor;
		if (actor.id !== activity.actor) {
			followerRecord = await fetchActor(activity.actor);
		}

		const { results: actorExists } = await context.env.DB.prepare(
			'SELECT id FROM actors WHERE id = ?',
		)
			.bind(activity.actor)
			.all();
		if (!actorExists || actorExists.length === 0) {
			await context.env.DB.prepare(
				'INSERT INTO actors (id, inbox, sharedInbox, publicKey) VALUES (?, ?, ?, ?)',
			)
				.bind(
					activity.actor,
					followerRecord.inbox,
					followerRecord.endpoints?.sharedInbox ?? null,
					followerRecord.publicKey?.publicKeyPem ?? null,
				)
				.run();
		} else {
			await context.env.DB.prepare(
				'UPDATE actors SET inbox = ?, sharedInbox = ?, publicKey = ? WHERE id = ?',
			)
				.bind(
					followerRecord.inbox,
					followerRecord.endpoints?.sharedInbox ?? null,
					followerRecord.publicKey?.publicKeyPem ?? null,
					activity.actor,
				)
				.run();
		}

		const { results: followRequestExists } = await context.env.DB.prepare(
			'SELECT id FROM followRequest WHERE id = ?',
		)
			.bind(activity.id)
			.all();
		if (!followRequestExists || followRequestExists.length === 0) {
			const followObjectId =
				typeof activity.object === 'string'
					? activity.object
					: (activity.object?.id ?? null);
			await context.env.DB.prepare(
				'INSERT INTO followRequest (id, actor, object) VALUES (?, ?, ?)',
			)
				.bind(activity.id, activity.actor, followObjectId)
				.run();
		}

		try {
			await acceptFollow(activity, followerRecord.inbox, context.env);
		} catch (error) {
			console.error('Failed to send Accept response', error);
			return false;
		}
		return true;
	} else {
		console.warn('Follow activity is not for the public collection');
		return false;
	}
};
