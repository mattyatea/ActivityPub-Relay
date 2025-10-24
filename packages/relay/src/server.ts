import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { Hono } from 'hono';
import { followActivity } from '@/activityPub/follow.ts';
import { relayActivity } from '@/activityPub/relay.ts';
import { undoActivity } from '@/activityPub/undo.ts';
import { router } from '@/api/router.ts';
import type { APRequest } from '@/types/activityPubTypes';
import { verifySignature } from '@/utils/httpSignature';
import { logger, sanitizeError } from '@/utils/logger.ts';

const app = new Hono<{ Bindings: Env }>();

const relayActivityType = ['Create', 'Announce', 'Update', 'Delete', 'Remove'];

// Static assets can be served without full environment check
app.get('/assets/*', async (c) => {
	try {
		if (!c.env.ASSETS) {
			return c.notFound();
		}
		return c.env.ASSETS.fetch(c.req.raw);
	} catch (error) {
		logger.error('Error serving static asset', {
			path: c.req.path,
			...sanitizeError(error),
		});
		return c.notFound();
	}
});

app.use('*', async (c, next) => {
	if (!c.env.HOSTNAME || !c.env.PUBLICKEY || !c.env.PRIVATEKEY || !c.env.DB) {
		logger.error('Missing environment variables', {
			hasHostname: !!c.env.HOSTNAME,
			hasPublicKey: !!c.env.PUBLICKEY,
			hasPrivateKey: !!c.env.PRIVATEKEY,
			hasDB: !!c.env.DB,
		});
		return c.text('Internal Server Error: Missing configuration', 500);
	}
	await next();
});

const handler = new OpenAPIHandler(router);

// API Key認証ミドルウェア
app.use('/api/*', async (c, next) => {
	// API_KEYが設定されている場合のみ認証チェック
	const apiKey = c.req.header('X-API-Key');

	if (!apiKey || apiKey !== c.env.API_KEY) {
		return c.json(
			{
				error: 'Unauthorized',
				message: 'Invalid or missing API key',
			},
			401,
		);
	}

	await next();
});

app.use('/api/*', async (c, next) => {
	const requestLogger = logger.child({
		component: 'api',
		method: c.req.method,
		path: c.req.path,
	});

	requestLogger.info('Incoming API request');

	const { matched, response } = await handler.handle(c.req.raw, {
		prefix: '/api',
		context: {
			env: c.env,
		},
	});

	if (matched) {
		requestLogger.info('API request handled', {
			matched: true,
			statusCode: response?.status,
		});
		return c.newResponse(response.body, response);
	}

	requestLogger.debug('No handler match, passing to next middleware');
	await next();
});

// Inbox endpoint for receiving activities
app.post('/inbox', async (c) => {
	const inboxLogger = logger.child({ component: 'inbox' });

	// Clone the request to safely read the body, as it can only be read once.
	const reqClone = c.req.raw.clone();
	const activity: APRequest = await reqClone.json();

	inboxLogger.info('Received activity', {
		activityType: activity.type,
		activityId: activity.id,
		actor: activity.actor,
	});

	let verificationResult;
	try {
		verificationResult = await verifySignature(c.req.raw);
	} catch (error) {
		inboxLogger.warn('Signature verification threw error', {
			activityType: activity.type,
			actor: activity.actor,
			...sanitizeError(error),
		});
		return c.text('Unauthorized: Signature verification failed', 401);
	}

	if (!verificationResult.isValid) {
		inboxLogger.warn('Signature verification failed', {
			activityType: activity.type,
			actor: activity.actor,
		});
		return c.text('Unauthorized: Signature verification failed', 401);
	}

	const actor = verificationResult.actor;

	if (activity.type === 'Follow') {
		const followActivityResult = await followActivity(activity, actor, c);
		if (followActivityResult) {
			return c.text('Accepted', 202);
		} else {
			return c.text('Bad Request: Follow handling failed', 400);
		}
	}

	if (activity.type === 'Undo') {
		const undoActivityResult = await undoActivity(activity, c);
		if (undoActivityResult) {
			return c.text('OK', 200);
		} else {
			return c.text('Bad Request: Undo handling failed', 400);
		}
	}

	if (relayActivityType.includes(activity.type)) {
		const relayResult = await relayActivity(activity, c);

		if (!relayResult.success) {
			if (relayResult.relayedCount === 0 && relayResult.failureCount === 0) {
				return c.text(
					'Accepted: Activity is not public or no followers registered',
					202,
				);
			}
		}

		return c.text(
			`Accepted: Relayed to ${relayResult.relayedCount} follower(s)`,
			202,
		);
	}

	inboxLogger.warn('Unhandled activity type', {
		activityType: activity.type,
		activityId: activity.id,
	});
	return c.text('Not Implemented: Activity type not handled', 501);
});

// Actor endpoint
app.get('/actor', (c) => {
	return c.json(
		{
			'@context': ['https://www.w3.org/ns/activitystreams'],
			id: `https://${c.env.HOSTNAME}/actor`,
			type: 'Person',
			preferredUsername: 'relay',
			inbox: `https://${c.env.HOSTNAME}/inbox`,
			outbox: `https://${c.env.HOSTNAME}/outbox`,
			discoverable: true,
			publicKey: {
				publicKeyPem: c.env.PUBLICKEY,
				owner: `https://${c.env.HOSTNAME}/actor`,
				type: 'Key',
				id: `https://${c.env.HOSTNAME}/actor#main-key`,
			},
		},
		200,
		{ 'Content-Type': 'application/activity+json' },
	);
});

// .well-known/nodeinfo endpoint
app.get('/.well-known/nodeinfo', (c) => {
	return c.json({
		links: [
			{
				rel: 'http://nodeinfo.diaspora.software/ns/schema/2.1',
				href: `https://${c.env.HOSTNAME}/nodeinfo/2.1.json`,
			},
		],
	});
});

// .well-known/webfinger endpoint
app.get('/.well-known/webfinger', (c) => {
	return c.json(
		{
			subject: `acct:relay@${c.env.HOSTNAME}`,
			links: [
				{
					rel: 'self',
					type: 'application/activity+json',
					href: `https://${c.env.HOSTNAME}/actor`,
				},
			],
		},
		200,
		{ 'Content-Type': 'application/jrd+json; charset=UTF-8' },
	);
});

// NodeInfo 2.1 JSON endpoint
app.get('/nodeinfo/2.1.json', (c) => {
	return c.json({
		openRegistrations: false,
		protocols: ['activitypub'],
		software: {
			name: 'nanasi-apps.xyz Relay Service',
			version: '0.0.1',
		},
		usage: {
			users: {
				total: 1,
			},
		},
		services: {
			inbound: [],
			outbound: [],
		},
		version: '2.1',
	});
});

// .well-known/host-meta endpoint
app.get('/.well-known/host-meta', (c) => {
	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0">
  <Link rel="lrdd" template="https://${c.env.HOSTNAME}/.well-known/webfinger?resource={uri}" />
</XRD>`;
	return c.body(xml, 200, { 'Content-Type': 'application/xml' });
});

// Serve static assets from public directory
app.get('/*', async (c) => {
	try {
		if (!c.env.ASSETS) {
			logger.error('ASSETS binding not found', { path: c.req.path });
			return c.notFound();
		}

		const url = new URL(c.req.url);
		let pathname = url.pathname;

		// Handle directory requests by appending index.html
		// e.g., /admin or /admin/ -> /admin/index.html
		if (pathname.endsWith('/') || !pathname.includes('.')) {
			// If path ends with / or has no extension, try to serve index.html
			if (!pathname.endsWith('/')) {
				pathname += '/';
			}
			pathname += 'index.html';

			// Create a new request with the modified path
			const modifiedUrl = new URL(url);
			modifiedUrl.pathname = pathname;
			const modifiedRequest = new Request(modifiedUrl.toString(), c.req.raw);

			return c.env.ASSETS.fetch(modifiedRequest);
		}

		// Fetch the requested asset directly
		return c.env.ASSETS.fetch(c.req.raw);
	} catch (error) {
		logger.error('Error serving static asset', {
			path: c.req.path,
			...sanitizeError(error),
		});
		return c.notFound();
	}
});

export default app;
