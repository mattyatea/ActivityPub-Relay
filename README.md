# ActivityPub Relay

[English](#english) | [日本語](#日本語)

---

<a name="日本語"></a>

[Hono](https://hono.dev/)、TypeScript、Cloudflare Workersで構築されたシンプルなActivityPubリレーサーバーです。

## 前提条件

- [Cloudflareアカウント](https://cloudflare.com/) - Workersへのデプロイ用
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) - Cloudflare Workers CLI（開発依存としてインストール済み）

## 機能

- **ActivityPubプロトコルサポート**: コアとなるActivityPubリレー機能を実装
- **HTTP署名検証**: セキュリティのため、受信するアクティビティの署名を検証
- **アクティビティタイプ**: Follow、Undo、Create、Announceアクティビティに対応
- **Cloudflare D1**: フォロワーの関係性を保存するためのD1データベースを使用
- **WebFinger & NodeInfo**: フェデレーション検出のための`.well-known`エンドポイントを実装

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

`.dev.vars.example`をコピーして`.dev.vars`を作成し、実際の値を設定します:

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

### 5. ローカル実行

開発サーバーを起動します:

```bash
pnpm run dev
```

サーバーはホットリロードを有効にしてローカルで実行されます。

### 6. Cloudflare Workersへのデプロイ

リレーをCloudflare Workersにデプロイします:

```bash
pnpm run deploy
```

## APIエンドポイント

- `POST /inbox` - ActivityPubアクティビティを受信
- `GET /actor` - アクター情報エンドポイント
- `GET /.well-known/webfinger` - アクター検出用のWebFingerエンドポイント
- `GET /.well-known/nodeinfo` - NodeInfo検出エンドポイント
- `GET /nodeinfo/2.1.json` - NodeInfo 2.1メタデータ
- `GET /.well-known/host-meta` - ホストメタデータエンドポイント

## 開発

### コード品質

プロジェクトではBiomeをリントとフォーマットに使用しています:

```bash
# コードをチェック
pnpm run check

# 問題を自動修正
pnpm run fix

# unsafe fixを含めて修正
pnpm run fix-unsafe
```

## ライセンス

詳細はLICENSEファイルを参照してください。

---

## English

A simple ActivityPub relay server built with [Hono](https://hono.dev/), TypeScript, and Cloudflare Workers.

### Prerequisites

- [Cloudflare account](https://cloudflare.com/) - For deploying to Workers
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) - Cloudflare Workers CLI (installed as dev dependency)

### Features

- **ActivityPub Protocol Support**: Implements core ActivityPub relay functionality
- **HTTP Signature Verification**: Verifies incoming activity signatures for security
- **Activity Types**: Supports Follow, Undo, Create, and Announce activities
- **Cloudflare D1**: Uses D1 database for storing follower relationships
- **WebFinger & NodeInfo**: Implements `.well-known` endpoints for federation discovery

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