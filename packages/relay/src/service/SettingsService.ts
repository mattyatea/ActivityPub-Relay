import { createPrismaClient } from '@/lib/prisma';
import type { DomainBlockMode, SettingsResponse } from '@/types/api.ts';

/**
 * 設定を取得する
 *
 * @param env - 環境変数とD1データベース
 * @returns {Promise<SettingsResponse>}
 */
export async function getSettings(env: Env): Promise<SettingsResponse> {
	const prisma = createPrismaClient(env.DB);
	try {
		const modeSetting = await prisma.setting.findUnique({
			where: { key: 'domain_block_mode' },
		});

		return {
			domainBlockMode: (modeSetting?.value as DomainBlockMode) ?? 'blacklist',
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
	env: Env,
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

/**
 * 個別の設定を取得する
 *
 * @param key - 設定キー
 * @param env - 環境変数とD1データベース
 * @returns {Promise<{key: string, value: string}>}
 */
export async function getSettingByKey(
	key: string,
	env: Env,
): Promise<{ key: string; value: string }> {
	const prisma = createPrismaClient(env.DB);
	try {
		const setting = await prisma.setting.findUnique({
			where: { key },
		});

		if (!setting) {
			// 設定が存在しない場合はデフォルト値を返す
			const defaultValue = key === 'auto_approve_follows' ? 'false' : '';
			return {
				key,
				value: defaultValue,
			};
		}

		return {
			key: setting.key,
			value: setting.value,
		};
	} catch (error) {
		console.error('Failed to get setting:', error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

/**
 * 個別の設定を更新する
 *
 * @param key - 設定キー
 * @param value - 設定値
 * @param env - 環境変数とD1データベース
 * @returns {Promise<boolean>} 成功した場合はtrue
 */
export async function updateSettingByKey(
	key: string,
	value: string,
	env: Env,
): Promise<boolean> {
	const prisma = createPrismaClient(env.DB);
	try {
		await prisma.setting.upsert({
			where: { key },
			update: { value },
			create: { key, value },
		});

		return true;
	} catch (error) {
		console.error('Failed to update setting:', error);
		return false;
	} finally {
		await prisma.$disconnect();
	}
}
