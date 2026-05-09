import { count, desc, eq } from 'drizzle-orm';
import { domainRules } from '@/db/schema.ts';
import { createDb } from '@/lib/db.ts';
import type { ListDomainRulesResponse } from '@/types/api.ts';

/**
 * ドメインルール一覧を取得する
 *
 * @param limit - 取得件数
 * @param offset - オフセット
 * @param env - 環境変数とD1データベース
 * @returns {Promise<ListDomainRulesResponse>}
 */
export async function listDomainRules(
	limit: number,
	offset: number,
	env: Env,
): Promise<ListDomainRulesResponse> {
	const db = createDb(env.DB);
	const [rules, totalRows] = await Promise.all([
		db
			.select()
			.from(domainRules)
			.orderBy(desc(domainRules.id))
			.limit(limit)
			.offset(offset),
		db.select({ value: count() }).from(domainRules),
	]);

	return {
		rules: rules.map((r) => ({
			id: r.id,
			pattern: r.pattern,
			isRegex: r.isRegex === 1,
			reason: r.reason ?? undefined,
			createdAt: r.createdAt || undefined,
		})),
		total: totalRows[0]?.value ?? 0,
	};
}

/**
 * ドメインルールを追加する
 *
 * @param pattern - ドメインパターン
 * @param isRegex - 正規表現かどうか
 * @param reason - 理由
 * @param env - 環境変数とD1データベース
 * @returns {Promise<number>} 追加されたルールのID
 */
export async function addDomainRule(
	pattern: string,
	isRegex: boolean,
	reason: string | undefined,
	env: Env,
): Promise<number> {
	const db = createDb(env.DB);
	const rule = await db
		.insert(domainRules)
		.values({
			pattern,
			isRegex: isRegex ? 1 : 0,
			reason,
			createdAt: Math.floor(Date.now() / 1000),
		})
		.returning({ id: domainRules.id })
		.get();

	return rule.id;
}

/**
 * ドメインルールを削除する
 *
 * @param id - ルールID
 * @param env - 環境変数とD1データベース
 * @returns {Promise<boolean>} 成功した場合はtrue
 */
export async function removeDomainRule(id: number, env: Env): Promise<boolean> {
	const db = createDb(env.DB);
	try {
		const rule = await db
			.select({ id: domainRules.id })
			.from(domainRules)
			.where(eq(domainRules.id, id))
			.get();

		if (!rule) {
			return false;
		}

		await db.delete(domainRules).where(eq(domainRules.id, id));

		return true;
	} catch (error) {
		console.error('Failed to remove domain rule:', error);
		return false;
	}
}
