import type { Context, MiddlewareHandler } from 'hono';
import { type LogContext, logger, sanitizeError } from '@/utils/logger.ts';

export type RequestLogContext = LogContext;

export type AppEnv = {
	Bindings: Env;
	Variables: {
		requestLog: RequestLogContext;
	};
};

const requestIdHeaderNames = ['CF-Ray', 'X-Request-ID'];

function getRequestId(c: Context<AppEnv>): string {
	for (const headerName of requestIdHeaderNames) {
		const value = c.req.header(headerName);
		if (value) {
			return value;
		}
	}

	return crypto.randomUUID();
}

function getRouteGroup(path: string): string {
	if (path.startsWith('/api/')) {
		return 'api';
	}
	if (path === '/inbox') {
		return 'activitypub.inbox';
	}
	if (path === '/actor' || path === '/outbox') {
		return 'activitypub.actor';
	}
	if (path.startsWith('/.well-known/')) {
		return 'well-known';
	}
	if (path.startsWith('/nodeinfo')) {
		return 'nodeinfo';
	}
	if (path.startsWith('/assets/')) {
		return 'assets';
	}
	return 'static';
}

function getCfString(c: Context<AppEnv>, key: string): string | undefined {
	const value = c.req.raw.cf?.[key];
	return typeof value === 'string' ? value : undefined;
}

function getStatus(c: Context<AppEnv>): number {
	const status = c.res.status;
	return status === 0 ? 200 : status;
}

function getOutcome(status: number): string {
	if (status >= 500) {
		return 'error';
	}
	if (status >= 400) {
		return 'client_error';
	}
	return 'success';
}

export function addRequestLogContext(
	c: Context<AppEnv>,
	context: RequestLogContext,
): void {
	Object.assign(c.get('requestLog'), context);
}

export function requestLogging(): MiddlewareHandler<AppEnv> {
	return async (c, next) => {
		const startedAt = Date.now();
		const requestId = getRequestId(c);
		const event: RequestLogContext = {
			event: 'worker.request',
			requestId,
			method: c.req.method,
			path: c.req.path,
			routeGroup: getRouteGroup(c.req.path),
			cfRay: c.req.header('CF-Ray'),
			colo: getCfString(c, 'colo'),
			country: getCfString(c, 'country'),
			userAgent: c.req.header('User-Agent'),
		};

		c.set('requestLog', event);
		c.header('X-Request-ID', requestId);

		try {
			await next();
			event.statusCode = getStatus(c);
			event.outcome = getOutcome(event.statusCode as number);
		} catch (error) {
			event.outcome = 'error';
			event.statusCode = 500;
			event.error = sanitizeError(error);
			throw error;
		} finally {
			event.statusCode ??= getStatus(c);
			event.durationMs = Date.now() - startedAt;
			if (event.outcome === 'error') {
				logger.error('Request completed', event);
			} else {
				logger.info('Request completed', event);
			}
		}
	};
}
