# 開発ガイド

このドキュメントは、ActivityPub Relayの開発に関する詳細な情報を提供します。

## 目次

- [プロジェクト構成](#プロジェクト構成)
- [開発環境のセットアップ](#開発環境のセットアップ)
- [開発ワークフロー](#開発ワークフロー)
- [アーキテクチャ](#アーキテクチャ)
- [コーディング規約](#コーディング規約)
- [テスト](#テスト)
- [デバッグ](#デバッグ)
- [トラブルシューティング](#トラブルシューティング)

## プロジェクト構成

このプロジェクトは、pnpm workspacesを使用したモノレポ構成になっています:

```
ActivityPub-Relay-Bun/
├── packages/
│   ├── contract/          # ORPC型定義と契約
│   │   ├── src/
│   │   └── package.json
│   ├── relay/             # バックエンド(Cloudflare Workers)
│   │   ├── src/
│   │   │   ├── activityPub/  # ActivityPub関連のロジック
│   │   │   ├── api/          # APIルーター
│   │   │   ├── lib/          # Prismaクライアント等
│   │   │   ├── service/      # ビジネスロジック
│   │   │   ├── types/        # 型定義
│   │   │   ├── utils/        # ユーティリティ関数
│   │   │   └── server.ts     # エントリーポイント
│   │   ├── prisma/        # Prismaスキーマとマイグレーション
│   │   ├── wrangler.toml  # Cloudflare Workers設定
│   │   └── package.json
│   └── frontend/          # フロントエンド(Vue 3)
│       ├── src/
│       │   ├── api/          # バックエンドAPIクライアント
│       │   ├── components/   # Vueコンポーネント
│       │   ├── composables/  # Composition API関数
│       │   ├── pages/        # ページコンポーネント
│       │   ├── router/       # Vue Router設定
│       │   ├── App.vue       # ルートコンポーネント
│       │   └── main.ts       # エントリーポイント
│       └── package.json
├── pnpm-workspace.yaml    # pnpm workspace設定
├── biome.json             # Biome設定
└── package.json           # ルートpackage.json
```

### packages/contract

ORPC (Type-safe RPC framework) を使用して、フロントエンドとバックエンド間の型安全な通信を実現します。

- APIの契約(contract)を定義
- フロントエンドとバックエンドで型定義を共有
- 型安全なAPIクライアントを自動生成

### packages/relay

Cloudflare Workers上で動作するバックエンドサーバーです。

- **activityPub/**: ActivityPubプロトコルの実装(Follow, Undo, Relayロジック)
- **api/**: ORPCルーター、管理APIエンドポイント
- **service/**: ドメインルール、フォロー管理、設定管理などのビジネスロジック
- **utils/**: HTTP署名、ActivityPubヘルパー、ドメインブロックなどのユーティリティ
- **lib/**: Prismaクライアントの初期化
- **types/**: TypeScript型定義

### packages/frontend

Vue 3 + Viteで構築された管理ダッシュボードです。

- **components/**: 再利用可能なUIコンポーネント
- **pages/**: ページレベルのコンポーネント
- **composables/**: Composition API関数(状態管理、API呼び出し等)
- **router/**: Vue Routerのルート定義
- **api/**: ORPCクライアントを使用したバックエンドAPIとの通信

## 開発環境のセットアップ

### 必要なツール

- **Node.js**: 18以上
- **pnpm**: 9以上
- **Wrangler CLI**: Cloudflare Workers開発ツール(pnpm installで自動インストール)
- **OpenSSL**: キー生成用

### 初回セットアップ手順

1. **リポジトリのクローン**

```bash
git clone <repository-url>
cd ActivityPub-Relay-Bun
```

2. **依存関係のインストール**

```bash
pnpm install
```

3. **RSAキーペアの生成**

```bash
# 秘密鍵を生成
openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048

# 公開鍵を抽出
openssl rsa -pubout -in private_key.pem -out public_key.pem
```

4. **環境変数の設定**

`packages/relay/.dev.vars.example`をコピー:

```bash
cp packages/relay/.dev.vars.example packages/relay/.dev.vars
```

`.dev.vars`を編集して、生成したキーとAPIキーを設定:

```bash
PUBLICKEY=-----BEGIN PUBLIC KEY-----
<public_key.pemの内容をここに貼り付け>
-----END PUBLIC KEY-----

PRIVATEKEY=-----BEGIN PRIVATE KEY-----
<private_key.pemの内容をここに貼り付け>
-----END PRIVATE KEY-----

API_KEY=<強力なランダム文字列>
```

5. **D1データベースの作成**

```bash
cd packages/relay
npx wrangler d1 create activitypub-relay
```

出力されたdatabase_idを`packages/relay/wrangler.toml`に設定:

```toml
[[d1_databases]]
binding = "DB"
database_name = "activitypub-relay"
database_id = "<ここに出力されたID>"
```

6. **データベースマイグレーション**

```bash
# ルートディレクトリから実行
pnpm db:generate  # Prismaクライアント生成
pnpm db:migrate   # ローカルマイグレーション実行
```

7. **開発サーバーの起動**

```bash
pnpm dev
```

これにより以下が起動します:
- バックエンド: http://localhost:3000
- フロントエンド: http://localhost:5173

## 開発ワークフロー

### 日常的な開発作業

#### 1. ブランチの作成

```bash
git checkout -b feature/your-feature-name
```

#### 2. コードの記述

お好みのエディタで開発を行います。VS CodeやWebStormを推奨します。

#### 3. コード品質チェック

Biomeを使用したコード品質チェック:

```bash
# 問題をチェック
pnpm check

# 自動修正
pnpm fix

# unsafe fixを含めて修正
pnpm fix-unsafe
```

#### 4. 動作確認

開発サーバーで動作を確認:

```bash
pnpm dev
```

#### 5. コミットとプッシュ

```bash
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature-name
```

### パッケージ個別の開発

特定のパッケージのみを開発する場合:

```bash
# バックエンドのみ
pnpm dev:relay

# フロントエンドのみ
pnpm dev:frontend
```

### データベーススキーマの変更

1. `packages/relay/prisma/schema.prisma`を編集

2. マイグレーションを作成:

```bash
cd packages/relay
npx prisma migrate dev --name your_migration_name
```

3. Prismaクライアントを再生成:

```bash
pnpm db:generate
```

## アーキテクチャ

### バックエンドアーキテクチャ

#### リクエストフロー

```
リクエスト
  ↓
server.ts (Honoアプリケーション)
  ↓
api/router.ts (ORPCルーター)
  ↓
service/* (ビジネスロジック)
  ↓
lib/prisma.ts (データベースアクセス)
```

#### ActivityPubフロー

```
外部サーバー → POST /inbox
  ↓
activityPub/relay.ts
  ↓
HTTP署名検証 (utils/httpSignature.ts)
  ↓
ドメインルールチェック (service/DomainRuleService.ts)
  ↓
フォロワーへの配信
```

#### 主要なコンポーネント

- **Hono**: 軽量Webフレームワーク
- **ORPC**: 型安全なRPCフレームワーク
- **Prisma**: ORMとデータベースマイグレーション
- **Cloudflare Workers**: サーバーレス実行環境
- **Cloudflare D1**: SQLiteベースのサーバーレスデータベース

### フロントエンドアーキテクチャ

#### コンポーネント構成

```
App.vue
  ↓
Router (router/index.ts)
  ↓
Pages (pages/*)
  ↓
Components (components/*)
  ↓
API Client (api/client.ts)
  ↓
Backend ORPC Endpoints
```

#### 状態管理

- Vue 3のComposition APIを使用
- Composablesで状態とロジックをカプセル化
- ORPCクライアントで型安全なAPI呼び出し

### セキュリティ

#### HTTP署名検証

ActivityPubの標準に準拠したHTTP署名検証を実装しています(`utils/httpSignature.ts`):

1. `Signature`ヘッダーのパース
2. 署名文字列の構築
3. 公開鍵の取得(リモートサーバーから)
4. 署名の検証

#### ドメインルール

ホワイトリスト/ブラックリストによるドメインフィルタリング(`service/DomainRuleService.ts`):

- **ホワイトリストモード**: 許可されたドメインのみ受け入れ
- **ブラックリストモード**: 禁止されたドメインを拒否
- **デフォルト**: すべてのドメインを受け入れ

#### API認証

管理APIはAPI_KEYによる認証を必須としています。

## コーディング規約

### TypeScript

- **型安全性**: `any`の使用を避け、明示的な型定義を行う
- **Null安全性**: `null`/`undefined`チェックを適切に行う
- **関数型プログラミング**: 純粋関数とイミュータブルなデータ構造を優先

### Biome設定

プロジェクトでは[Biome](https://biomejs.dev/)を使用しています:

```bash
# コードチェック
pnpm check

# 自動修正
pnpm fix
```

### コミットメッセージ

Conventional Commits形式を推奨:

```
feat: 新機能を追加
fix: バグ修正
docs: ドキュメントの変更
style: コードスタイルの変更(機能に影響なし)
refactor: リファクタリング
test: テストの追加・修正
chore: ビルドプロセスやツールの変更
```

## テスト

### ローカルテスト

開発サーバーで基本的な動作確認:

```bash
pnpm dev
```

### ActivityPubプロトコルのテスト

実際のMastodonやMisskeyインスタンスとの連携テスト:

1. ローカルサーバーをngrokなどで公開
2. フォローリクエストを送信
3. 投稿が正しくリレーされるか確認

### D1データベースのテスト

ローカルD1データベースでのクエリテスト:

```bash
cd packages/relay
npx wrangler d1 execute activitypub-relay --local --command "SELECT * FROM Follower"
```

## デバッグ

### バックエンドのデバッグ

Wranglerの開発モードはホットリロードとログ出力をサポート:

```bash
pnpm dev:relay
```

`console.log()`や`console.error()`でログを出力できます。

### フロントエンドのデバッグ

ブラウザの開発者ツールを使用:

- Vue Devtools拡張機能を推奨
- NetworkタブでAPI通信を確認
- Consoleタブでエラーを確認

### Cloudflare Workersのログ

デプロイ後のログ確認:

```bash
npx wrangler tail
```

または、Cloudflare Dashboardの「Logs」セクションを確認。

## トラブルシューティング

### データベースマイグレーションエラー

マイグレーションが失敗する場合:

```bash
# ローカルD1データベースをリセット
rm -rf .wrangler/state

# マイグレーションを再実行
pnpm db:migrate
```

### キー関連のエラー

秘密鍵/公開鍵のフォーマットが正しいか確認:

```bash
# 秘密鍵の検証
openssl rsa -in private_key.pem -check

# 公開鍵の検証
openssl rsa -pubin -in public_key.pem -text
```

### ポート競合

開発サーバーのポートが使用中の場合:

```bash
# ポート3000を使用しているプロセスを確認
lsof -i :3000

# プロセスを終了
kill -9 <PID>
```

### CORS エラー

フロントエンドからバックエンドへのリクエストでCORSエラーが発生する場合、`packages/relay/src/server.ts`のCORS設定を確認してください。

### Wranglerのログイン問題

```bash
# ログアウト
npx wrangler logout

# 再ログイン
npx wrangler login
```

## デプロイ

### 本番環境へのデプロイ

1. **シークレットの設定**

```bash
cd packages/relay

# 公開鍵を登録
npx wrangler secret put PUBLICKEY
# プロンプトで公開鍵の内容を貼り付け

# 秘密鍵を登録
npx wrangler secret put PRIVATEKEY
# プロンプトで秘密鍵の内容を貼り付け

# APIキーを登録
npx wrangler secret put API_KEY
# プロンプトでAPIキーを貼り付け
```

2. **本番データベースのマイグレーション**

```bash
pnpm db:migrate:prod
```

3. **デプロイ**

```bash
# ルートディレクトリから
pnpm deploy
```

これにより以下が実行されます:
- フロントエンドのビルド
- バックエンドのデプロイ(静的ファイルを含む)

### デプロイ後の確認

1. Cloudflare Dashboardでワーカーの状態を確認
2. エンドポイントにアクセスして動作確認:
   - `https://your-domain.workers.dev/actor`
   - `https://your-domain.workers.dev/.well-known/webfinger?resource=acct:relay@your-domain.workers.dev`

## 貢献

プルリクエストを歓迎します！以下の手順に従ってください:

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'feat: add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 参考資料

- [ActivityPub仕様](https://www.w3.org/TR/activitypub/)
- [Hono ドキュメント](https://hono.dev/)
- [ORPC ドキュメント](https://orpc.unnoq.com/)
- [Cloudflare Workers ドキュメント](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 ドキュメント](https://developers.cloudflare.com/d1/)
- [Prisma ドキュメント](https://www.prisma.io/docs)
- [Vue 3 ドキュメント](https://vuejs.org/)
- [Biome ドキュメント](https://biomejs.dev/)
