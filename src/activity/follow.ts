import type { Context } from 'hono';
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
		let followerRecord = actor;
		if (actor.id !== activity.actor) {
			followerRecord = await fetchActor(activity.actor);
		}

		// ドメインブロックチェック
		const domain = extractDomainFromActorId(activity.actor);
		if (!domain) {
			console.error('Failed to extract domain from actor ID:', activity.actor);
			return false;
		}
		if (await isDomainBlocked(domain, context.env.DB)) {
			console.warn(`Follow request rejected: domain ${domain} is blocked`);
			return false;
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

		// 自動承認モードの確認
		const { results: settingsResults } = await context.env.DB.prepare(
			"SELECT value FROM settings WHERE key = 'auto_approve_follows'",
		).all<{ value: string }>();

		const autoApprove =
			settingsResults &&
			settingsResults.length > 0 &&
			settingsResults[0].value === 'true';

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

			const initialStatus = autoApprove ? 'approved' : 'pending';

			await context.env.DB.prepare(
				'INSERT INTO followRequest (id, actor, object, status, activity_json) VALUES (?, ?, ?, ?, ?)',
			)
				.bind(
					activity.id,
					activity.actor,
					followObjectId,
					initialStatus,
					JSON.stringify(activity),
				)
				.run();
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
	} else {
		console.warn('Follow activity is not for the public collection');
		return false;
	}
};
