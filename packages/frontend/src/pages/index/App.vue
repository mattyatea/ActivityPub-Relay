<template>
  <MainLayout currentPage="home">
    <div class="home">

    <section class="section">
      <h2>リレーへの接続方法</h2>
      <Card>
        <div class="relay-url-section">
          <p class="relay-url-label">あなたのインスタンスのソフトウェアに応じて、以下のいずれかのURLを使用してください:</p>

          <div class="url-group">
            <h4>Mastodon / Misskey の場合</h4>
            <div class="relay-url-box">
              <code>{{ inboxUrl }}</code>
              <button
                type="button"
                class="copy-button"
                @click="copyToClipboard(inboxUrl)"
                :class="{ copied: copiedUrl === 'inbox' }"
              >
                {{ copiedUrl === 'inbox' ? 'コピー済み!' : 'コピー' }}
              </button>
            </div>
            <p class="relay-url-note">
              ※ Mastodonの場合: 管理画面 → モデレーション → リレー から追加<br>
              ※ Misskeyの場合: コントロールパネル → リレー から追加
            </p>
          </div>

          <div class="url-group">
            <h4>Pleroma の場合</h4>
            <div class="relay-url-box">
              <code>{{ actorUrl }}</code>
              <button
                type="button"
                class="copy-button"
                @click="copyToClipboard(actorUrl)"
                :class="{ copied: copiedUrl === 'actor' }"
              >
                {{ copiedUrl === 'actor' ? 'コピー済み!' : 'コピー' }}
              </button>
            </div>
            <p class="relay-url-note">
              ※ Pleromaの場合: AdminFE → リレー から追加
            </p>
          </div>

          <p class="relay-url-note" style="margin-top: 16px;">
            ※ その他のソフトウェアの場合: 各ソフトウェアのドキュメントを参照してください
          </p>
        </div>
      </Card>
    </section>

    <section class="section">
      <h2>オープンソース</h2>
      <Card>
        <div class="github-section">
          <p class="github-description">
            このリレーサーバーはオープンソースで開発されています。<br>
            ソースコード、ドキュメント、Issue報告はGitHubで公開しています。
          </p>
          <a
            href="https://github.com/mattyatea/ActivityPub-Relay"
            target="_blank"
            rel="noopener noreferrer"
            class="github-link"
          >
            <svg class="github-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
              <path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
            </svg>
            GitHub Repository
          </a>
        </div>
      </Card>
    </section>

    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import Card from '../../components/Card.vue';
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

		// Reset after 2 seconds
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

ol {
  padding-left: 20px;
  margin: 0;
}

ol li {
  margin-bottom: 8px;
  font-size: 14px;
}

.relay-url-section {
  padding: 4px 0;
}

.relay-url-label {
  font-size: 14px;
  margin-bottom: 16px;
  font-weight: 500;
}

.url-group {
  margin-bottom: 24px;
}

.url-group:last-of-type {
  margin-bottom: 0;
}

.url-group h4 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--text-primary);
}

.relay-url-box {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 12px;
  overflow-x: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.relay-url-box code {
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 14px;
  color: var(--text-primary);
  word-break: break-all;
  flex: 1;
}

.copy-button {
  background: var(--button-primary);
  color: var(--bg-primary);
  border: 1px solid var(--button-primary);
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.copy-button:hover {
  background: var(--button-primary-hover);
  border-color: var(--button-primary-hover);
}

.copy-button.copied {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.copy-button:active {
  transform: scale(0.95);
}

.relay-url-note {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

.github-section {
  padding: 4px 0;
  text-align: center;
}

.github-description {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 20px 0;
}

.github-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--button-primary);
  color: var(--bg-primary);
  padding: 10px 20px;
  border-radius: 4px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid var(--button-primary);
  transition: all 0.2s ease;
}

.github-link:hover {
  background: var(--button-primary-hover);
  border-color: var(--button-primary-hover);
  transform: translateY(-1px);
}

.github-link:active {
  transform: translateY(0);
}

.github-icon {
  flex-shrink: 0;
}

</style>
