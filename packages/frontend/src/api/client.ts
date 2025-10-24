import { contract } from '@activitypub-relay/contract';
import { createORPCClient } from '@orpc/client';
import { OpenAPILink } from '@orpc/openapi-client/fetch';
import type { ContractRouterClient } from '@orpc/contract';
import type { JsonifiedClient } from '@orpc/openapi-client';

let apiKey = '';

export function setApiKey(key: string) {
	apiKey = key;
}

// Use absolute URL by prepending the current origin
const getApiUrl = () => {
	if (typeof window !== 'undefined') {
		return `${window.location.origin}/api`;
	}
	return '/api';
};

const link = new OpenAPILink(contract, {
	url: getApiUrl(),
	headers: () => ({
		'X-API-Key': apiKey,
	}),
});

export const orpc: JsonifiedClient<ContractRouterClient<typeof contract>> =
	createORPCClient(link);
