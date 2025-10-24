# ActivityPub Relay

[English](#english) | [日本語](#日本語)

---

<a name="日本語"></a>

[Hono](https://hono.dev/)、TypeScript、Cloudflare Workersで構築されたシンプルなActivityPubリレーサーバーです。

## 構成

このプロジェクトはpnpm workspacesを使用したモノレポ構成になっています:

- `packages/contract` - ORPC型定義と契約（フロントエンドとバックエンドで共有）
- `packages/relay` - バックエンド（Cloudflare Workers）
- `packages/frontend` - フロントエンド（Vue 3 + Vite）

## 前提条件

- [Cloudflareアカウント](https://cloudflare.com/)
- Node.js 18以上
- pnpm 9以上

## 機能

- [x] 基本的な投稿リレー機能
- [x] HTTP署名
- [x] WebFingerおよびNodeInfoのサポート
- [x] 管理用ダッシュボード（Vue 3）
- [x] ドメインルール管理（ホワイトリスト/ブラックリスト）
- [x] フォローリクエスト管理
- [ ] Queue機能
- [ ] レート制限機能

## セットアップ

### 1. 依存関係のインストール

プロジェクトの依存関係をインストールします:

```bash
pnpm install
```

### 2. キーの生成

ActivityPubアクティビティの署名用にRSAキーペアを生成します:

```bash
# 秘密鍵を生成
openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048

# 公開鍵を抽出
openssl rsa -pubout -in private_key.pem -out public_key.pem
```

### 3. 環境変数の設定

#### ローカル開発環境

relayパッケージ内の`.dev.vars.example`をコピーして`.dev.vars`を作成し、実際の値を設定します:

```bash
cp .dev.vars.example .dev.vars
```

`.dev.vars`を編集して以下を設定:

```bash
PUBLICKEY=-----BEGIN PUBLIC KEY-----
<公開鍵の内容>
-----END PUBLIC KEY-----

PRIVATEKEY=-----BEGIN PRIVATE KEY-----
<秘密鍵の内容>
-----END PRIVATE KEY-----

API_KEY=<強力なAPIキー>
```

#### 本番環境（Cloudflare）

Cloudflare Workersにシークレットを登録します:

```bash
# 公開鍵を登録
wrangler secret put PUBLICKEY
# プロンプトで公開鍵の内容を貼り付け

# 秘密鍵を登録
wrangler secret put PRIVATEKEY
# プロンプトで秘密鍵の内容を貼り付け

# APIキーを登録
wrangler secret put API_KEY
# プロンプトでAPIキーを貼り付け
```

#### wrangler.tomlの設定

`wrangler.toml`を編集してD1データベースとホスト名を設定します:

```toml
[vars]
HOSTNAME = "relay.example.com"  # リレーのドメイン

[[d1_databases]]
binding = "DB"
database_name = "activitypub-relay"
database_id = "your-database-id"
```

**重要**: `PUBLICKEY`、`PRIVATEKEY`、`API_KEY`は`wrangler.toml`に含めず、必ず`wrangler secret put`コマンドで登録してください。

### 4. D1データベースの作成

リレー用のD1データベースを作成します:

```bash
# データベースを作成
npx wrangler d1 create activitypub-relay

# 出力されたdatabase_idをwrangler.tomlにコピー
```

データベーススキーマを初期化します（必要に応じてマイグレーションの作成やSQLコマンドの実行を行ってください）。

### 5. データベースマイグレーション

Prismaスキーマを生成してマイグレーションを実行:

```bash
# スキーマ生成
pnpm db:generate

# ローカルマイグレーション
pnpm db:migrate
```

### 6. ローカル実行

開発サーバーを起動します:

```bash
pnpm dev
```

これにより以下が起動します:
- バックエンド: http://localhost:3000
- フロントエンド: http://localhost:5173

詳細な開発ガイドは [DEVELOPMENT.md](./development.md) を参照してください。

### 7. Cloudflare Workersへのデプロイ

リレーをCloudflare Workersにデプロイします:

```bash
pnpm deploy
```

## 開発

詳細な開発ガイドは [development.md](./development.md) を参照してください。

### 利用可能なコマンド

```bash
# 全体開発サーバー起動
pnpm dev

# 個別起動
pnpm dev:relay      # バックエンドのみ
pnpm dev:frontend   # フロントエンドのみ

# ビルド
pnpm build

# デプロイ
pnpm deploy

# DB操作
pnpm db:generate      # Prismaスキーマ生成
pnpm db:migrate       # ローカルマイグレーション
pnpm db:migrate:prod  # 本番マイグレーション

# コード品質
pnpm check       # Biomeチェック
pnpm fix         # 自動修正
pnpm fix-unsafe  # unsafe fixを含めて修正
```

## ライセンス

詳細はLICENSEファイルを参照してください。

---

## English

A simple ActivityPub relay server built with [Hono](https://hono.dev/), TypeScript, and Cloudflare Workers.

### Architecture

This project uses pnpm workspaces monorepo structure:

- `packages/contract` - ORPC type definitions and contracts (shared between frontend and backend)
- `packages/relay` - Backend (Cloudflare Workers)
- `packages/frontend` - Frontend (Vue 3 + Vite)

### Prerequisites

- [Cloudflare account](https://cloudflare.com/)
- Node.js 18+
- pnpm 9+

### Features

- [x] Basic post relay functionality
- [x] HTTP Signatures
- [x] WebFinger and NodeInfo support
- [x] Admin dashboard (Vue 3)
- [x] Domain rule management (whitelist/blacklist)
- [x] Follow request management
- [ ] Queue functionality
- [ ] Rate limiting

### Getting Started

#### 1. Install Dependencies

Install the project dependencies:

```bash
pnpm install
```

#### 2. Generate Keys

Generate an RSA key pair for signing ActivityPub activities:

```bash
# Generate a private key
openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048

# Extract the public key
openssl rsa -pubout -in private_key.pem -out public_key.pem
```

#### 3. Configure Environment Variables

##### Local Development

Copy `.dev.vars.example` to `.dev.vars` and set your actual values:

```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` to set:

```bash
PUBLICKEY=-----BEGIN PUBLIC KEY-----
<your public key content>
-----END PUBLIC KEY-----

PRIVATEKEY=-----BEGIN PRIVATE KEY-----
<your private key content>
-----END PRIVATE KEY-----

API_KEY=<your-strong-api-key>
```

##### Production (Cloudflare)

Register secrets to Cloudflare Workers:

```bash
# Register public key
wrangler secret put PUBLICKEY
# Paste your public key content when prompted

# Register private key
wrangler secret put PRIVATEKEY
# Paste your private key content when prompted

# Register API key
wrangler secret put API_KEY
# Paste your API key when prompted
```

##### Configure wrangler.toml

Edit `wrangler.toml` to set up your D1 database and hostname:

```toml
[vars]
HOSTNAME = "relay.example.com"  # Your relay domain

[[d1_databases]]
binding = "DB"
database_name = "activitypub-relay"
database_id = "your-database-id"
```

**Important**: Do NOT include `PUBLICKEY`, `PRIVATEKEY`, or `API_KEY` in `wrangler.toml`. Always use `wrangler secret put` command to register them.

#### 4. Create D1 Database

Create a D1 database for your relay:

```bash
# Create the database
npx wrangler d1 create activitypub-relay

# Copy the database_id from the output to wrangler.toml
```

Initialize the database schema (create a migration or execute SQL commands as needed).

#### 5. Run Locally

Start the development server:

```bash
pnpm run dev
```

The server will be running locally with hot-reload enabled.

#### 6. Deploy to Cloudflare Workers

Deploy your relay to Cloudflare Workers:

```bash
pnpm run deploy
```

### API Endpoints

- `POST /inbox` - Receive ActivityPub activities
- `GET /actor` - Actor information endpoint
- `GET /.well-known/webfinger` - WebFinger endpoint for actor discovery
- `GET /.well-known/nodeinfo` - NodeInfo discovery endpoint
- `GET /nodeinfo/2.1.json` - NodeInfo 2.1 metadata
- `GET /.well-known/host-meta` - Host metadata endpoint

### Development

#### Code Quality

The project uses Biome for linting and formatting:

```bash
# Check code
pnpm run check

# Fix issues automatically
pnpm run fix

# Fix issues including unsafe fixes
pnpm run fix-unsafe
```

### License

See LICENSE file for details.