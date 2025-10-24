import { createPrismaClient } from '@/lib/prisma';
import type { DomainRule, ListDomainRulesResponse } from '@/types/api.ts';

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
	const prisma = createPrismaClient(env.DB);
	try {
		const [rules, total] = await Promise.all([
			prisma.domainRule.findMany({
				take: limit,
				skip: offset,
				orderBy: { id: 'desc' },
			}),
			prisma.domainRule.count(),
		]);

		return {
			rules: rules.map((r) => ({
				id: r.id,
				pattern: r.pattern,
				isRegex: r.is_regex === 1,
				reason: r.reason ?? undefined,
				createdAt: r.created_at || undefined,
			})),
			total,
		};
	} finally {
		await prisma.$disconnect();
	}
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
	const prisma = createPrismaClient(env.DB);
	try {
		const rule = await prisma.domainRule.create({
			data: {
				pattern,
				is_regex: isRegex ? 1 : 0,
				reason,
				created_at: Math.floor(Date.now() / 1000),
			},
		});

		return rule.id;
	} finally {
		await prisma.$disconnect();
	}
}

/**
 * ドメインルールを削除する
 *
 * @param id - ルールID
 * @param env - 環境変数とD1データベース
 * @returns {Promise<boolean>} 成功した場合はtrue
 */
export async function removeDomainRule(
	id: number,
	env: Env,
): Promise<boolean> {
	const prisma = createPrismaClient(env.DB);
	try {
		await prisma.domainRule.delete({
			where: { id },
		});

		return true;
	} catch (error) {
		console.error('Failed to remove domain rule:', error);
		return false;
	} finally {
		await prisma.$disconnect();
	}
}
