import { eq } from 'drizzle-orm';
import { settings } from '@/db/schema.ts';
import { createDb } from '@/lib/db.ts';
import type { DomainBlockMode, SettingsResponse } from '@/types/api.ts';
import { createServiceLogger, sanitizeError } from '@/utils/logger.ts';

const logger = createServiceLogger('SettingsService');

/**
 * 設定を取得する
 *
 * @param env - 環境変数とD1データベース
 * @returns {Promise<SettingsResponse>}
 */
export async function getSettings(env: Env): Promise<SettingsResponse> {
	const db = createDb(env.DB);
	const modeSetting = await db
		.select()
		.from(settings)
		.where(eq(settings.key, 'domain_block_mode'))
		.get();

	return {
		domainBlockMode: (modeSetting?.value as DomainBlockMode) ?? 'blacklist',
	};
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
	const db = createDb(env.DB);
	try {
		if (domainBlockMode) {
			await db
				.insert(settings)
				.values({ key: 'domain_block_mode', value: domainBlockMode })
				.onConflictDoUpdate({
					target: settings.key,
					set: { value: domainBlockMode },
				});
		}

		return true;
	} catch (error) {
		logger.error('Failed to update settings', {
			domainBlockMode,
			...sanitizeError(error),
		});
		return false;
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
	const db = createDb(env.DB);
	try {
		const setting = await db
			.select()
			.from(settings)
			.where(eq(settings.key, key))
			.get();

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
		logger.error('Failed to get setting', {
			key,
			...sanitizeError(error),
		});
		throw error;
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
	const db = createDb(env.DB);
	try {
		await db.insert(settings).values({ key, value }).onConflictDoUpdate({
			target: settings.key,
			set: { value },
		});

		return true;
	} catch (error) {
		logger.error('Failed to update setting', {
			key,
			...sanitizeError(error),
		});
		return false;
	}
}
