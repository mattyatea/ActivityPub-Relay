<template>
	<MainLayout currentPage="home">
		<div class="home">
			<section class="section">
				<h2>リレーへの接続方法</h2>
				<ElCard shadow="hover">
					<ElSpace
						direction="vertical"
						alignment="stretch"
						class="relay-url-section"
						:size="24"
					>
						<ElText
							>あなたのインスタンスのソフトウェアに応じて、以下のいずれかのURLを使用してください:</ElText
						>

						<ElCard shadow="never">
							<template #header>Mastodon / Misskey の場合</template>
							<ElInput :model-value="inboxUrl" readonly>
								<template #append>
									<ElButton @click="copyToClipboard(inboxUrl)">
										{{ copiedUrl === 'inbox' ? 'コピー済み!' : 'コピー' }}
									</ElButton>
								</template>
							</ElInput>
							<ElText class="relay-url-note" type="info">
								※ Mastodonの場合: 管理画面 → モデレーション → リレー から追加<br />
								※ Misskeyの場合: コントロールパネル → リレー から追加
							</ElText>
						</ElCard>

						<ElCard shadow="never">
							<template #header>Pleroma の場合</template>
							<ElInput :model-value="actorUrl" readonly>
								<template #append>
									<ElButton @click="copyToClipboard(actorUrl)">
										{{ copiedUrl === 'actor' ? 'コピー済み!' : 'コピー' }}
									</ElButton>
								</template>
							</ElInput>
							<ElText class="relay-url-note" type="info">
								※ Pleromaの場合: AdminFE → リレー から追加
							</ElText>
						</ElCard>

						<ElAlert
							title="※ その他のソフトウェアの場合: 各ソフトウェアのドキュメントを参照してください"
							type="info"
							:closable="false"
						/>
					</ElSpace>
				</ElCard>
			</section>

			<section class="section">
				<h2>オープンソース</h2>
				<ElCard shadow="hover">
					<div class="github-section">
						<ElText class="github-description">
							このリレーサーバーはオープンソースで開発されています。<br />
							ソースコード、ドキュメント、Issue報告はGitHubで公開しています。
						</ElText>
						<ElLink
							href="https://github.com/mattyatea/ActivityPub-Relay"
							target="_blank"
							rel="noopener noreferrer"
							type="primary"
						>
							GitHub Repository
						</ElLink>
					</div>
				</ElCard>
			</section>
		</div>
	</MainLayout>
</template>

<script setup lang="ts">
import {
	ElAlert,
	ElButton,
	ElCard,
	ElInput,
	ElLink,
	ElSpace,
	ElText,
} from 'element-plus';
import { computed, ref } from 'vue';
import MainLayout from '../../layouts/MainLayout.vue';

const actorUrl = computed(() => {
	return `https://${window.location.host}/actor`;
});

const inboxUrl = computed(() => {
	return `https://${window.location.host}/inbox`;
});

const copiedUrl = ref<string | null>(null);

const copyToClipboard = async (url: string) => {
	try {
		await navigator.clipboard.writeText(url);
		const urlType = url.includes('/actor') ? 'actor' : 'inbox';
		copiedUrl.value = urlType;

		setTimeout(() => {
			copiedUrl.value = null;
		}, 2000);
	} catch (err) {
		console.error('Failed to copy:', err);
	}
};
</script>

<style scoped>
.home {
	max-width: 800px;
	margin: 0 auto;
}

.section {
	margin-bottom: 48px;
}

.section h2 {
	font-size: 20px;
	font-weight: 600;
	margin-bottom: 16px;
}

.relay-url-section {
	width: 100%;
}

.relay-url-note {
	display: block;
	margin-top: 12px;
	line-height: 1.6;
}

.github-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 20px;
	text-align: center;
}

.github-description {
	line-height: 1.6;
}
</style>
