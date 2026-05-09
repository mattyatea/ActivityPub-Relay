const DELIVERY_RECIPIENT_CACHE_TTL_SECONDS = 60;
const DELIVERY_RECIPIENT_CACHE_KEY = 'delivery:recipients';

export type DeliveryRecipient = {
	actorHost: string | null;
	inbox: string;
};

type DeliveryCacheEnv = Env & {
	DELIVERY_CACHE?: KVNamespace;
};

function getDeliveryKvCache(env: Env): KVNamespace | undefined {
	return (env as DeliveryCacheEnv).DELIVERY_CACHE;
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
