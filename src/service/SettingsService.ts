import { createPrismaClient } from '@/lib/prisma';
import type { Bindings } from '@/server.ts';
import type { DomainBlockMode, SettingsResponse } from '@/types/api.ts';

/**
 * 設定を取得する
 *
 * @param env - 環境変数とD1データベース
 * @returns {Promise<SettingsResponse>}
 */
export async function getSettings(env: Bindings): Promise<SettingsResponse> {
	const prisma = createPrismaClient(env.DB);
	try {
		const modeSetting = await prisma.setting.findUnique({
			where: { key: 'domain_block_mode' },
		});

		return {
			domainBlockMode:
				(modeSetting?.value as DomainBlockMode) ?? 'blacklist',
		};
	} finally {
		await prisma.$disconnect();
	}
}

/**
 * 設定を更新する
 *
 * @param domainBlockMode - ドメインブロックモード
 * @param env - 環境変数とD1データベース
 * @returns {Promise<boolean>} 成功した場合はtrue
 */
export async function updateSettings(
	domainBlockMode: DomainBlockMode | undefined,
	env: Bindings,
): Promise<boolean> {
	const prisma = createPrismaClient(env.DB);
	try {
		if (domainBlockMode) {
			await prisma.setting.upsert({
				where: { key: 'domain_block_mode' },
				update: { value: domainBlockMode },
				create: { key: 'domain_block_mode', value: domainBlockMode },
			});
		}

		return true;
	} catch (error) {
		console.error('Failed to update settings:', error);
		return false;
	} finally {
		await prisma.$disconnect();
	}
}
