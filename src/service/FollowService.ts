import type { Bindings } from '@/server.ts';
import type { APActivity } from '@/types/activityPubTypes.ts';
import { acceptFollow, rejectFollow } from '@/utils/activityPub.ts';

type FollowRequestRecord = {
	id: string;
	actor: string;
	object: string;
	status: string;
	activity_json: string | null;
};

type ActorRecord = {
	inbox: string;
};

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
	// Follow申請を取得
	const { results } = await env.DB.prepare(
		'SELECT id, actor, object, status, activity_json FROM followRequest WHERE id = ?',
	)
		.bind(followRequestId)
		.all();

	if (!results || results.length === 0) {
		console.error('Follow request not found:', followRequestId);
		return false;
	}

	const followRequest = results[0] as FollowRequestRecord;

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
	const { results: actorResults } = await env.DB.prepare(
		'SELECT inbox FROM actors WHERE id = ?',
	)
		.bind(followRequest.actor)
		.all();

	if (!actorResults || actorResults.length === 0) {
		console.error('Actor not found:', followRequest.actor);
		return false;
	}

	const actor = actorResults[0] as ActorRecord;

	// DB保存されたActivityを取得
	let activity: APActivity;
	try {
		activity = JSON.parse(followRequest.activity_json);
	} catch (error) {
		console.error('Invalid activity JSON:', error);
		return false;
	}

	try {
		// Accept送信を先に実行
		await acceptFollow(activity, actor.inbox, env);

		// Accept送信成功後にステータスを更新
		await env.DB.prepare('UPDATE followRequest SET status = ? WHERE id = ?')
			.bind('approved', followRequestId)
			.run();

		console.log(`Follow request ${followRequestId} approved and Accept sent`);
		return true;
	} catch (error) {
		console.error('Failed to send Accept:', error);
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
	env: Bindings,
): Promise<boolean> {
	const { results } = await env.DB.prepare(
		'SELECT status, activity_json FROM followRequest WHERE id = ?',
	)
		.bind(followRequestId)
		.all();

	if (!results || results.length === 0) {
		console.error('Follow request not found:', followRequestId);
		return false;
	}

	const followRequest = results[0] as {
		status: string;
		activity_json: string | null;
	};

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
	const { results: actorResults } = await env.DB.prepare(
		'SELECT inbox FROM actors WHERE id = ?',
	)
		.bind(activity.actor)
		.all();

	if (!actorResults || actorResults.length === 0) {
		console.error('Actor not found');
		return false;
	}

	const actor = actorResults[0] as ActorRecord;

	try {
		// Reject送信を先に実行
		await rejectFollow(activity, actor.inbox, env);

		// Reject送信成功後にステータスを更新
		await env.DB.prepare('UPDATE followRequest SET status = ? WHERE id = ?')
			.bind('rejected', followRequestId)
			.run();

		console.log(`Follow request ${followRequestId} rejected and Reject sent`);
		return true;
	} catch (error) {
		console.error('Failed to send Reject:', error);
		return false;
	}
}
