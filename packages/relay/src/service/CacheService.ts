import type { APActor } from '@/types/activityPubTypes.ts';

const DELIVERY_RECIPIENT_CACHE_TTL_SECONDS = 60;
const DELIVERY_RECIPIENT_CACHE_KEY = 'delivery:recipients';
const ACTOR_CACHE_KEY_PREFIX = 'actor:';

export type DeliveryRecipient = {
	actorHost: string | null;
	inbox: string;
};

function getDeliveryKvCache(env: Env): KVNamespace | undefined {
	return env.DELIVERY_CACHE;
}

function getActorCacheKey(keyId: string): string {
	const actorUrl = keyId.includes('#') ? keyId.split('#', 1)[0] : keyId;
	return `${ACTOR_CACHE_KEY_PREFIX}${actorUrl}`;
}

export async function getCachedActor(
	env: Env,
	keyId: string,
): Promise<APActor | null> {
	const kvCache = getDeliveryKvCache(env);
	if (!kvCache) {
		return null;
	}

	return await kvCache.get<APActor>(getActorCacheKey(keyId), 'json');
}

export async function setCachedActor(
	env: Env,
	keyId: string,
	actor: APActor,
): Promise<void> {
	const kvCache = getDeliveryKvCache(env);
	if (!kvCache) {
		return;
	}

	await kvCache.put(getActorCacheKey(keyId), JSON.stringify(actor));
}

export async function getCachedDeliveryRecipients(
	env: Env,
): Promise<DeliveryRecipient[] | null> {
	const kvCache = getDeliveryKvCache(env);
	if (!kvCache) {
		return null;
	}

	return await kvCache.get<DeliveryRecipient[]>(
		DELIVERY_RECIPIENT_CACHE_KEY,
		'json',
	);
}

export async function setCachedDeliveryRecipients(
	env: Env,
	recipients: DeliveryRecipient[],
): Promise<void> {
	const kvCache = getDeliveryKvCache(env);
	if (!kvCache) {
		return;
	}

	await kvCache.put(DELIVERY_RECIPIENT_CACHE_KEY, JSON.stringify(recipients), {
		expirationTtl: DELIVERY_RECIPIENT_CACHE_TTL_SECONDS,
	});
}

export async function invalidateDeliveryRecipientCache(
	env?: Env,
): Promise<void> {
	if (!env) {
		return;
	}

	const kvCache = getDeliveryKvCache(env);
	await kvCache?.delete(DELIVERY_RECIPIENT_CACHE_KEY);
}
