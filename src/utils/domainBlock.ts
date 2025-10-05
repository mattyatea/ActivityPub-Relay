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
		console.error('Invalid actor ID:', actorId, error);
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
			console.error('Invalid regex pattern:', pattern, error);
			return false;
		}
	}
	return domain === pattern;
}

type SettingRecord = {
	value: string;
};

type DomainRuleRecord = {
	pattern: string;
	is_regex: number;
};

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
	// ブロックモードを取得
	const { results: modeResults } = await db
		.prepare("SELECT value FROM settings WHERE key = 'domain_block_mode'")
		.all<SettingRecord>();

	const mode =
		modeResults && modeResults.length > 0 ? modeResults[0].value : 'blacklist';

	// 全てのドメインルールを取得
	const { results: rules } = await db
		.prepare('SELECT pattern, is_regex FROM domainRules')
		.all<DomainRuleRecord>();

	if (!rules || rules.length === 0) {
		// ルールが無い場合
		// blacklist: 全て許可 (false)
		// whitelist: 全て拒否 (true)
		return mode === 'whitelist';
	}

	// ドメインがルールにマッチするかチェック
	const matches = rules.some((rule) =>
		matchesDomainPattern(domain, rule.pattern, rule.is_regex === 1),
	);

	// blacklist: マッチしたらブロック
	// whitelist: マッチしなかったらブロック
	return mode === 'blacklist' ? matches : !matches;
}
