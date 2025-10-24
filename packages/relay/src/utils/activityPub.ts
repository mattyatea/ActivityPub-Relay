import type { APActor, APRequest } from '@/types/activityPubTypes.ts';
import { signHeaders } from '@/utils/httpSignature.ts';

const PUBLIC_COLLECTION = 'https://www.w3.org/ns/activitystreams#Public';

export const idGenerator = () => {
	return Date.now().toString();
};

function normaliseAudienceField(
	value: string | string[] | undefined,
): string[] {
	if (!value) return [];
	return Array.isArray(value) ? value : [value];
}

export function checkPublicCollection(activity: APRequest) {
	if (
		typeof activity.object === 'string' &&
		activity.object === PUBLIC_COLLECTION
	) {
		return true;
	}

	if (typeof activity.object === 'object' && activity.object !== null) {
		const objectTargets = [
			...normaliseAudienceField(
				activity.object.to as string | string[] | undefined,
			),
			...normaliseAudienceField(
				activity.object.cc as string | string[] | undefined,
			),
			...normaliseAudienceField(
				activity.object.bto as string | string[] | undefined,
			),
			...normaliseAudienceField(
				activity.object.bcc as string | string[] | undefined,
			),
			...normaliseAudienceField(
				activity.object.audience as string | string[] | undefined,
			),
		];
		if (objectTargets.includes(PUBLIC_COLLECTION)) {
			return true;
		}
	}

	const topLevelTargets = [
		...normaliseAudienceField(activity.to),
		...normaliseAudienceField(activity.cc),
		...normaliseAudienceField(activity.bto),
		...normaliseAudienceField(activity.bcc),
		...normaliseAudienceField(activity.audience),
	];

	return topLevelTargets.includes(PUBLIC_COLLECTION);
}

export async function sendActivity(
	req: string,
	body: APRequest,
	headers: {
		Accept: string;
		'Cache-Control': string;
		Digest: string;
		Signature: string;
		'User-Agent': string;
		Host: string;
		Date: string;
		'Content-Type': string;
	},
) {
	const response = await fetch(req, {
		method: 'POST',
		body: JSON.stringify(body),
		headers,
	});

	if (!response.ok) {
		const errorText = await response.text().catch(() => '<no response body>');
		throw new Error(
			`Failed to deliver activity to ${req}: ${response.status} ${response.statusText} ${errorText}`,
		);
	}

	return response;
}

export async function fetchActor(keyId: string): Promise<APActor> {
	const actorUrl = keyId.includes('#') ? keyId.split('#', 1)[0] : keyId;
	const response = await fetch(actorUrl, {
		method: 'GET',
		headers: {
			Accept: 'application/activity+json, application/ld+json',
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch actor: ${response.status}`);
	}

	const reader = response.body?.getReader();
	const decoder = new TextDecoder('utf-8');
	let result = '';
	if (reader) {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			result += decoder.decode(value, { stream: true });
		}
	}
	return JSON.parse(result);
}

export async function acceptFollow(
	activity: APRequest,
	targetInbox: string,
	env: Env,
) {
	const id = idGenerator();
	const body: APRequest = {
		'@context': ['https://www.w3.org/ns/activitystreams'],
		id: `https://${env.HOSTNAME}/activity/${id}`,
		type: 'Accept',
		actor: `https://${env.HOSTNAME}/actor`,
		object: activity,
	};
	const headers = signHeaders(JSON.stringify(body), targetInbox, env);
	await sendActivity(targetInbox, body, headers);
}

export async function rejectFollow(
	activity: APRequest,
	targetInbox: string,
	env: Env,
) {
	const id = idGenerator();
	const body: APRequest = {
		'@context': ['https://www.w3.org/ns/activitystreams'],
		id: `https://${env.HOSTNAME}/activity/${id}`,
		type: 'Reject',
		actor: `https://${env.HOSTNAME}/actor`,
		object: activity,
	};
	const headers = signHeaders(JSON.stringify(body), targetInbox, env);
	await sendActivity(targetInbox, body, headers);
}

/**
 * フォロワーを削除するためのReject Activityを送信する
 * 既存のフォロワーに対してフォロー関係を解除する
 *
 * @param actorId - 削除対象のアクターID
 * @param targetInbox - 送信先のinbox URL
 * @param env - 環境変数
 */
export async function removeFollower(
	actorId: string,
	targetInbox: string,
	env: Env,
) {
	const id = idGenerator();
	// フォローを解除するためのReject Activityを構築
	// オリジナルのFollow activityを再構築
	const originalFollow: APRequest = {
		'@context': ['https://www.w3.org/ns/activitystreams'],
		id: `${actorId}#follows/${Date.now()}`,
		type: 'Follow',
		actor: actorId,
		object: `https://${env.HOSTNAME}/actor`,
	};

	const body: APRequest = {
		'@context': ['https://www.w3.org/ns/activitystreams'],
		id: `https://${env.HOSTNAME}/activity/${id}`,
		type: 'Reject',
		actor: `https://${env.HOSTNAME}/actor`,
		object: originalFollow,
	};
	const headers = signHeaders(JSON.stringify(body), targetInbox, env);
	await sendActivity(targetInbox, body, headers);
}
