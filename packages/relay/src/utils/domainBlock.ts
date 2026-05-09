import { eq } from 'drizzle-orm';
import { domainRules, settings } from '@/db/schema.ts';
import { createDb } from '@/lib/db.ts';
import { createServiceLogger, sanitizeError } from '@/utils/logger.ts';

const logger = createServiceLogger('DomainBlock');

/**
 * アクターIDからドメインを抽出する
 *
 * @param actorId - アクターのID (URL形式)
 * @returns {string} ドメイン名
 */
export function extractDomainFromActorId(actorId: string): string {
	try {
		const url = new URL(actorId);
		return url.hostname;
	} catch (error) {
		logger.warn('Invalid actor ID', {
			actorId,
			...sanitizeError(error),
		});
		return '';
	}
}

/**
 * ドメインパターンマッチング
 *
 * @param domain - チェックするドメイン
 * @param pattern - パターン文字列
 * @param isRegex - 正規表現かどうか
 * @returns {boolean} マッチした場合はtrue
 */
function matchesDomainPattern(
	domain: string,
	pattern: string,
	isRegex: boolean,
): boolean {
	if (isRegex) {
		try {
			const regex = new RegExp(pattern);
			return regex.test(domain);
		} catch (error) {
			logger.warn('Invalid regex pattern', {
				domain,
				pattern,
				...sanitizeError(error),
			});
			return false;
		}
	}
	return domain === pattern;
}

/**
 * ドメインがブロックされているかチェックする
 * blacklist: ルールにマッチしたらtrue (ブロック)
 * whitelist: ルールにマッチしなかったらtrue (ブロック)
 *
 * @param domain - チェックするドメイン
 * @param db - D1データベースインスタンス
 * @returns {Promise<boolean>} ブロックされている場合はtrue
 */
export async function isDomainBlocked(
	domain: string,
	db: D1Database,
): Promise<boolean> {
	const drizzleDb = createDb(db);
	// ブロックモードを取得
	const modeSetting = await drizzleDb
		.select()
		.from(settings)
		.where(eq(settings.key, 'domain_block_mode'))
		.get();

	const mode = modeSetting?.value ?? 'blacklist';

	// 全てのドメインルールを取得
	const rules = await drizzleDb
		.select({
			pattern: domainRules.pattern,
			isRegex: domainRules.isRegex,
		})
		.from(domainRules);

	if (rules.length === 0) {
		// ルールが無い場合
		// blacklist: 全て許可 (false)
		// whitelist: 全て拒否 (true)
		return mode === 'whitelist';
	}

	// ドメインがルールにマッチするかチェック
	const matches = rules.some((rule) =>
		matchesDomainPattern(domain, rule.pattern, rule.isRegex === 1),
	);

	// blacklist: マッチしたらブロック
	// whitelist: マッチしなかったらブロック
	return mode === 'blacklist' ? matches : !matches;
}
