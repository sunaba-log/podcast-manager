# クイックスタート：ポッドキャスト特化型CMS

**フェーズ**: Phase 1  
**日付**: 2026年1月27日  
**対象読者**: 開発者、QA、デザイナー

## 目次
1. [システム要件](#システム要件)
2. [ローカル開発環境セットアップ](#ローカル開発環境セットアップ)
3. [初回実行](#初回実行)
4. [基本操作](#基本操作)
5. [トラブルシューティング](#トラブルシューティング)

---

## システム要件

### 必須環境
- **Node.js**: 18.x 以上（推奨: 20.x LTS）
- **npm**: 9.x 以上 または **pnpm**: 8.x 以上
- **Docker**: 24.x 以上（ローカルDB用）
- **Docker Compose**: 2.x 以上
- **Git**: 2.x 以上
- **PostgreSQL クライアント**: `psql` コマンド（オプション、デバッグ用）

### クラウドアカウント（本番/ステージング）
- **Google Cloud**: GCS アクセス権
- **Cloudflare**: R2 アクセス権

### ブラウザ
- Chrome/Edge/Firefox 最新版（ローカル開発では何でも可）

---

## ローカル開発環境セットアップ

### ステップ 1: リポジトリのクローン

```bash
git clone https://github.com/sunaba-log/podcast-manager.git
cd podcast-manager
git checkout 001-podcast-cms-core
```

### ステップ 2: 環境変数ファイルの作成

**frontend/.env.local**
```bash
# Next.js 基本設定
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Podcast Manager"

# 認証（NextAuth.js）
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-key-change-in-production-$(openssl rand -base64 32)
```

**backend/.env.local**
```bash
# データベース
DATABASE_URL="postgresql://podcast_user:podcast_pass@localhost:5432/podcast_manager_dev"

# Google Cloud Storage
GCP_PROJECT_ID="your-gcp-project-id"
GCS_BUCKET_NAME="podcast-manager-dev"
GCS_CREDENTIAL_PATH="./credentials-gcs.json"

# Cloudflare R2
R2_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
R2_ACCESS_KEY_ID="your-r2-key-id"
R2_SECRET_ACCESS_KEY="your-r2-secret"
R2_BUCKET_NAME="podcast-feeds"
R2_PUBLIC_URL="https://feeds.example.com"

# アプリケーション
NODE_ENV=development
LOG_LEVEL=debug
PORT=3001
```

### ステップ 3: Docker で PostgreSQL の起動

**docker-compose.yml** がリポジトリルートにあることを確認：

```bash
docker-compose up -d postgres
```

**確認**:
```bash
docker-compose ps
# postgres が "Up" 状態であることを確認
```

### ステップ 4: フロントエンド環境のセットアップ

```bash
cd frontend

# 依存パッケージのインストール
npm install
# または
pnpm install

# Shadcn UI コンポーネントの初期化
npx shadcn-ui@latest init

# TypeScript 型チェック
npm run type-check

# ESLint チェック
npm run lint
```

### ステップ 5: バックエンド環境のセットアップ

```bash
cd ../backend

# 依存パッケージのインストール
npm install
# または
pnpm install

# Prisma スキーマの生成
npx prisma generate

# データベースマイグレーション実行
npx prisma migrate dev --name init

# テストデータをシードする
npx prisma db seed
```

**マイグレーション確認**:
```bash
psql $DATABASE_URL -c "\dt"
# User, Podcast, Episode, AudioFile, Artwork, TeamMember テーブルが表示されることを確認
```

---

## 初回実行

### ローカル開発サーバー起動

**ターミナル 1: バックエンドサーバー**
```bash
cd backend
npm run dev
# バックエンド起動: http://localhost:3001
```

**ターミナル 2: フロントエンドサーバー**
```bash
cd frontend
npm run dev
# フロントエンド起動: http://localhost:3000
```

### ブラウザアクセス

```
http://localhost:3000
```

**ログイン画面が表示されれば成功 ✅**

---

## 基本操作

### テスト用アカウントでログイン

`npx prisma db seed` で以下のテストユーザーが作成されます：

**テストユーザー**
| メール | パスワード | 用途 |
|--------|----------|------|
| creator@example.com | TestPassword123! | 番組所有者 |
| editor@example.com | TestPassword123! | チームメンバー（編集者） |

### ユースケース 1: 新しい番組を作成

1. **ログイン**
   - メール: `creator@example.com`
   - パスワード: `TestPassword123!`

2. **ダッシュボード → 番組管理 → 新規作成**
   ```
   タイトル: "My Test Podcast"
   説明: "A test podcast for development"
   著者: "John Doe"
   カテゴリ: Technology
   言語: English (en)
   不適切な表現: いいえ
   ```

3. **保存**
   - フィード URL が自動生成される
   - RSS フィードは `http://localhost:3001/feeds/{podcastId}/rss.xml` でアクセス可能

### ユースケース 2: エピソードを追加

1. **番組詳細 → エピソード管理 → 新規作成**
   ```
   タイトル: "Episode 1: Introduction"
   説明: "Welcome to the show!"
   シーズン: 1
   エピソード番号: 1
   公開予定日時: 2026-01-27 10:00 (現在時刻)
   ```

2. **保存**

### ユースケース 3: 音声ファイルをアップロード

1. **エピソード詳細 → 音声ファイル → アップロード**

2. **署名付き URL を取得**
   - バックエンド API が自動で GCS 署名付きURL を生成

3. **MP3 ファイルを選択して直接 GCS にアップロード**
   - ブラウザ → GCS へ直接アップロード（セキュア）

4. **完了確認**
   - RSS フィードに Enclosure タグが追加される

### ユースケース 4: RSS フィード確認

**固定フィード URL** を確認：
```bash
curl http://localhost:3001/feeds/{podcastId}/rss.xml
```

**出力**: 有効な XML フィード
```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>My Test Podcast</title>
    <description>A test podcast for development</description>
    ...
  </channel>
</rss>
```

---

## テストデータシード

**backend/prisma/seed.ts** で以下のテストデータを自動生成：

### 作成されるデータ

```
User: creator@example.com (所有者)
  └─ Podcast: "Test Show #1"
      ├─ Episode 1: "Introduction"
      │   └─ AudioFile: sample-audio.mp3 (mock)
      ├─ Episode 2: "Deep Dive"
      └─ Artwork: test-cover.jpg (3000x3000px mock)
  
  └─ Podcast: "Test Show #2"
      └─ Episode 1: "Pilot"

User: editor@example.com
  └─ TeamMember (EDITOR) for "Test Show #1"
```

**シード実行**
```bash
cd backend
npx prisma db seed
```

**削除してリセット**
```bash
cd backend
npx prisma migrate reset
# 確認: y
```

---

## 開発ワークフロー

### コードの追加・修正

```bash
# フロントエンド例
cd frontend
# src/components/podcast/ShowForm.tsx を編集
# npm run dev で自動リロード

# バックエンド例
cd backend
# src/services/podcast.service.ts を編集
# npm run dev で自動リスタート
```

### テストの実行

```bash
# ユニットテスト
npm run test

# E2E テスト（ブラウザテスト）
npm run test:e2e

# カバレッジレポート
npm run test:coverage
```

### 型チェック・リント

```bash
npm run type-check
npm run lint
npm run lint --fix  # 自動修正
```

### データベースマイグレーション

```bash
# 新しいマイグレーション作成
cd backend
npx prisma migrate dev --name add_new_field

# マイグレーション確認
npx prisma migrate status

# 本番環境に適用（デプロイ時）
npx prisma migrate deploy
```

---

## API テスト

### cURL でエンドポイント確認

**ユーザー登録**
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "name": "Test User"
  }'
```

**ログイン**
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "creator@example.com",
    "password": "TestPassword123!"
  }'
# トークンをコピー
```

**番組一覧取得**
```bash
curl -X GET http://localhost:3001/api/v1/shows \
  -H "Authorization: Bearer {トークン}"
```

### Postman / Insomnia での確認

- **OpenAPI スキーマ**: `specs/001-podcast-cms-core/contracts/api.openapi.yaml`
- Postman や Insomnia にインポート可能

---

## トラブルシューティング

### PostgreSQL が起動しない

```bash
# ポート 5432 の競合確認
lsof -i :5432

# Docker ログ確認
docker-compose logs postgres

# 既存コンテナ削除してリセット
docker-compose down -v
docker-compose up -d postgres
```

### Prisma マイグレーション失敗

```bash
# スキーマ再生成
cd backend
npx prisma generate

# マイグレーション履歴リセット（開発のみ）
npx prisma migrate reset

# デバッグモード
DEBUG=* npx prisma migrate dev
```

### フロントエンド ビルドエラー

```bash
cd frontend
# キャッシュクリア
rm -rf .next node_modules
npm install

# 型チェック実行
npm run type-check

# ESLint 確認
npm run lint
```

### API 401 エラー（認証失敗）

- JWT トークンの有効期限確認
- `NEXTAUTH_SECRET` が設定されているか確認
- ブラウザの Cookie をクリア

```bash
# 開発環境のみ: トークン有効期限を長く設定
NEXTAUTH_SECRET=dev-secret-key
```

### GCS / R2 アップロード失敗

```bash
# 認証情報確認
echo $GCS_CREDENTIAL_PATH
echo $R2_ACCESS_KEY_ID

# ローカル署名付きURL生成テスト
cd backend
npm run test:gcs-signing
```

---

## 次のステップ

1. **UI/UX デザイン**: Storybook で Shadcn UI コンポーネント確認
   ```bash
   cd frontend
   npm run storybook
   ```

2. **E2E テスト作成**: Playwright で ユーザーフロー検証
   ```bash
   cd frontend
   npm run test:e2e
   ```

3. **デプロイ準備**: GitHub Actions CI/CD パイプライン設定

4. **本番環境**: GCP / Cloudflare 本番アカウント設定

---

## サポート

問題が発生した場合:

1. **ログ確認**
   ```bash
   # フロントエンド
   npm run dev -- --debug
   
   # バックエンド
   LOG_LEVEL=debug npm run dev
   ```

2. **GitHub Issues**: [Issues](https://github.com/sunaba-log/podcast-manager/issues)

3. **ドキュメント**: [Docs](https://podcast-manager.example.com/docs)
