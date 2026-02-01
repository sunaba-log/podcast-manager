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

- **Python**: 3.11 以上（推奨: 3.12 LTS）
- **uv**: 最新版（Python パッケージマネージャー）
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

**.env.local** (リポジトリルート)

```bash
# Backend Database
DATABASE_URL=postgresql+asyncpg://podcast_user:podcast_password@localhost:5432/podcast_cms

# FastAPI Configuration
DEBUG=true
API_PORT=8000
API_HOST=0.0.0.0
CORS_ORIGINS=["http://localhost:3000"]

# Frontend Configuration
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000

# JWT Configuration
SECRET_KEY=your-super-secret-jwt-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Google Cloud Storage (GCS)
GCS_PROJECT_ID=your-gcp-project-id
GCS_BUCKET_NAME=podcast-manager-audio
GCS_SERVICE_ACCOUNT_JSON=/path/to/gcp-key.json

# Cloudflare R2 (for RSS feed storage)
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=podcast-feeds
R2_PUBLIC_URL=https://your-r2-public-url.com

# Email Configuration (for team invitations)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SENDER_EMAIL=noreply@podcast-manager.com
SENDER_NAME=Podcast Manager

# Logging
LOG_LEVEL=INFO
LOGS_DIR=./logs

# Environment
ENVIRONMENT=development
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

# TypeScript 型チェック
npm run type-check

# ESLint チェック
npm run lint
```

### ステップ 5: バックエンド環境のセットアップ

**環境変数を追加する**:

`backend/.env`

```sh
DATABASE_URL="<>"
```

**マイグレーションを実行する**:

```bash
cd ../backend

# Python 仮想環境の確認
python --version  # 3.11+

# 依存パッケージのインストール (uv使用)
uv sync

# Alembic データベースマイグレーション実行
uv run alembic upgrade head
```

**マイグレーション確認**:

> [!NOTE]  
> psqlをインストールしていない場合は、インストールする。

```bash
psql $DATABASE_URL -c "\dt"
# user_account, podcast, episode, audio_file, artwork, team_member テーブルが表示されることを確認
```

---

## 初回実行

### ローカル開発サーバー起動

**ターミナル 1: バックエンドサーバー**

```bash
cd backend
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# バックエンド起動: http://localhost:8000
# Swagger UI: http://localhost:8000/docs
```

**ターミナル 2: フロントエンドサーバー**

```bash
cd frontend
npm run dev
# or
pnpm dev
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

**テストユーザーを作成する** (管理者アカウント):

```bash
cd backend

# ユーザー作成スクリプト実行
uv run python -c "
from app.models.base import User
from app.core.database import AsyncSessionLocal
import asyncio

async def create_test_user():
    async with AsyncSessionLocal() as session:
        user = User(
            email='creator@example.com',
            username='creator',
            hashed_password='$2b$12$...',  # bcryptハッシュ
            role='admin'
        )
        session.add(user)
        await session.commit()

asyncio.run(create_test_user())
"
```

または、以下のエンドポイントで登録:

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "creator@example.com",
    "password": "TestPassword123!",
    "username": "creator"
  }'
```

### ユースケース 1: 新しい番組を作成

1. **ログイン**
   - メール: `creator@example.com`
   - パスワード: `TestPassword123!`

2. **API で番組作成**

   ```bash
   # JWT トークンを取得
   TOKEN=$(curl -X POST http://localhost:8000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "creator@example.com",
       "password": "TestPassword123!"
     }' | jq -r '.access_token')

   # 番組を作成
   curl -X POST http://localhost:8000/api/shows \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "My Test Podcast",
       "description": "A test podcast for development",
       "owner_id": "user-uuid",
       "cover_art_url": ""
     }'
   ```

3. **保存**
   - フィード URL が自動生成される
   - RSS フィードは `http://localhost:8000/feeds/{podcastId}/rss.xml` でアクセス可能

### ユースケース 2: エピソードを追加

1. **API でエピソード作成**

   ```bash
   curl -X POST http://localhost:8000/api/shows/{show_id}/episodes \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Episode 1: Introduction",
       "description": "Welcome to the show!",
       "podcast_id": "podcast-uuid",
       "status": "draft"
     }'
   ```

2. **保存**
   - エピソードが下書き状態で作成される

### ユースケース 3: 音声ファイルをアップロード

1. **署名付き URL を取得**

   ```bash
   curl -X POST http://localhost:8000/api/audio/signed-url \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "filename": "episode1.mp3",
       "content_type": "audio/mpeg"
     }'
   ```

2. **署名付き URL を使用して GCS に直接アップロード**

   ```bash
   curl -X PUT "$SIGNED_URL" \
     -H "Content-Type: audio/mpeg" \
     --data-binary @episode1.mp3
   ```

3. **エピソードにメタデータを登録**

   ```bash
   curl -X POST http://localhost:8000/api/shows/{show_id}/episodes/{episode_id}/audio \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "filename": "episode1.mp3",
       "duration_seconds": 3600,
       "file_size_bytes": 50000000
     }'
   ```

4. **完了確認**
   - RSS フィードに Enclosure タグが追加される

### ユースケース 4: RSS フィード確認

**固定フィード URL** を確認：

```bash
curl http://localhost:8000/feeds/{podcastId}/rss.xml
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

## 開発ワークフロー

### コードの追加・修正

```bash
# バックエンド例
cd backend
# app/services/podcast.py を編集
# uv run uvicorn app.main:app --reload で自動リロード

# フロントエンド例
cd frontend
# src/components/podcast/ShowForm.tsx を編集
# npm run dev で自動リロード
```

### テストの実行

```bash
# バックエンドユニットテスト
cd backend
uv run pytest

# フロントエンドユニットテスト
cd frontend
npm run test

# E2E テスト（ブラウザテスト）
npm run test:e2e

# カバレッジレポート
npm run test:coverage
```

### 型チェック・リント

```bash
# バックエンド
cd backend
uv run ruff check app/
uv run black --check app/

# フロントエンド
cd frontend
npm run type-check
npm run lint
npm run lint --fix  # 自動修正
```

### データベースマイグレーション

```bash
# 新しいマイグレーション作成
cd backend
uv run alembic revision --autogenerate -m "add_new_field"

# マイグレーション確認
uv run alembic current

# 本番環境に適用（デプロイ時）
uv run alembic upgrade head
```

---

## API テスト

### cURL でエンドポイント確認

**ユーザー登録**

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "username": "testuser"
  }'
```

**ログイン**

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "creator@example.com",
    "password": "TestPassword123!"
  }'
# トークンをコピー
```

**番組一覧取得**

```bash
curl -X GET http://localhost:8000/api/shows \
  -H "Authorization: Bearer {トークン}"
```

**ヘルスチェック**

```bash
curl http://localhost:8000/health
```

### Swagger UI での確認

```
http://localhost:8000/docs
```

FastAPI の自動生成 API ドキュメント（Swagger UI）が表示されます。

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

### Alembic マイグレーション失敗

```bash
# マイグレーション履歴確認
cd backend
uv run alembic history

# 最新のマイグレーション適用
uv run alembic upgrade head

# デバッグモード
SQLALCHEMY_ECHO=1 uv run alembic upgrade head
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

### FastAPI サーバーエラー

```bash
# ポート 8000 の競合確認
lsof -i :8000

# 別ポートで起動
uv run uvicorn app.main:app --reload --port 8001
```

### API 401 エラー（認証失敗）

- JWT トークンの有効期限確認
- `SECRET_KEY` 環境変数が設定されているか確認
- ブラウザの Cookie をクリア

```bash
# 開発環境のみ: トークン有効期限を長く設定
ACCESS_TOKEN_EXPIRE_MINUTES=1440  # 24時間
```

### GCS / R2 アップロード失敗

```bash
# 認証情報確認
echo $GCS_PROJECT_ID
echo $GCS_BUCKET_NAME
echo $R2_ACCESS_KEY_ID

# ローカル署名付きURL生成テスト
cd backend
uv run python -c "from app.lib.gcs import GCSClient; print(GCSClient.get_instance())"
```

---

## 次のステップ

1. **コンポーネント開発**: フロントエンド Shadcn UI コンポーネント実装

   ```bash
   cd frontend
   npm run dev
   ```

2. **E2E テスト作成**: Playwright でユーザーフロー検証

   ```bash
   cd frontend
   npm run test:e2e
   ```

3. **バックエンドテスト**: pytest でユニットテスト実装

   ```bash
   cd backend
   uv run pytest tests/
   ```

4. **デプロイ準備**: GitHub Actions CI/CD パイプライン設定

5. **本番環境**: GCP / Cloudflare 本番アカウント設定

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
