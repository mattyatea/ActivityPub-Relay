import { PrismaD1 } from '@prisma/adapter-d1';
import { PrismaClient } from '@prisma/client';

/**
 * Cloudflare D1を使用するPrisma Clientを初期化します
 * @param db - Cloudflare D1のデータベースインスタンス (env.DB)
 * @returns PrismaClient instance
 */
export function createPrismaClient(db: D1Database) {
	const adapter = new PrismaD1(db);
	return new PrismaClient({ adapter });
}
