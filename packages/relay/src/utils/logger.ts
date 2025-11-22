/**
 * Structured logging utility for Cloudflare Workers
 *
 * Best practices:
 * - Use console.log() for all log levels (info, warn, error)
 * - Structure logs as JSON objects for better querying in Cloudflare dashboard
 * - Include consistent fields: level, message, timestamp, and context
 * - Avoid logging sensitive information (API keys, tokens, etc.)
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
	[key: string]: unknown;
}

interface LogEntry {
	level: LogLevel;
	message: string;
	timestamp: string;
	context?: LogContext;
}

/**
 * Create a structured log entry
 */
function createLogEntry(
	level: LogLevel,
	message: string,
	context?: LogContext,
): LogEntry {
	return {
		level,
		message,
		timestamp: new Date().toISOString(),
		...(context && { context }),
	};
}

/**
 * Log a message with structured data
 */
function log(level: LogLevel, message: string, context?: LogContext): void {
	const entry = createLogEntry(level, message, context);
	// Always use console.log for Cloudflare Workers
	// The dashboard can filter by level field
	console.log(JSON.stringify(entry));
}

/**
 * Structured logger class
 */
export class Logger {
	private defaultContext?: LogContext;

	constructor(defaultContext?: LogContext) {
		this.defaultContext = defaultContext;
	}

	/**
	 * Merge default context with provided context
	 */
	private mergeContext(context?: LogContext): LogContext | undefined {
		if (!this.defaultContext && !context) {
			return undefined;
		}
		return {
			...this.defaultContext,
			...context,
		};
	}

	/**
	 * Log debug message
	 */
	debug(message: string, context?: LogContext): void {
		log('debug', message, this.mergeContext(context));
	}

	/**
	 * Log info message
	 */
	info(message: string, context?: LogContext): void {
		log('info', message, this.mergeContext(context));
	}

	/**
	 * Log warning message
	 */
	warn(message: string, context?: LogContext): void {
		log('warn', message, this.mergeContext(context));
	}

	/**
	 * Log error message
	 */
	error(message: string, context?: LogContext): void {
		log('error', message, this.mergeContext(context));
	}

	/**
	 * Create a child logger with additional default context
	 */
	child(context: LogContext): Logger {
		return new Logger(this.mergeContext(context));
	}
}

/**
 * Default logger instance
 */
export const logger = new Logger();

/**
 * Helper to sanitize error objects for logging
 */
export function sanitizeError(error: unknown): LogContext {
	if (error instanceof Error) {
		return {
			errorName: error.name,
			errorMessage: error.message,
			errorStack: error.stack,
		};
	}
	return {
		error: String(error),
	};
}

/**
 * Helper to create activity-specific logger
 */
export function createActivityLogger(
	activityType: string,
	actorId?: string,
): Logger {
	return new Logger({
		component: 'activitypub',
		activityType,
		...(actorId && { actorId }),
	});
}

/**
 * Helper to create API-specific logger
 */
export function createApiLogger(endpoint: string, method: string): Logger {
	return new Logger({
		component: 'api',
		endpoint,
		method,
	});
}

/**
 * Helper to create service-specific logger
 */
export function createServiceLogger(service: string): Logger {
	return new Logger({
		component: 'service',
		service,
	});
}

export function createQueueLogger(): Logger {
	return new Logger({
		component: 'queue',
	});
}
