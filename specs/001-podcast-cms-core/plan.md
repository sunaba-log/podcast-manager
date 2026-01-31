# 実装計画：ポッドキャスト特化型CMS コア機能

**ブランチ**: `001-podcast-cms-core` | **日付**: 2026年1月27日 | **仕様**: [spec.md](spec.md)
**入力**: `/specs/001-podcast-cms-core/spec.md` からのフィーチャー仕様

**注記**: このテンプレートは `/speckit.plan` コマンドで記入されます。`.specify/templates/commands/plan.md` で実行ワークフローを確認してください。

## 概要

ポッドキャスト配信者向けの特化型CMS。番組メタデータ、エピソード管理、音声ファイルアップロード、RSS フィード自動生成を実装。アーキテクチャは Next.js フロントエンドダッシュボードで構成。データベースは PostgreSQL + Prisma ORM を使用。本アプリは署名付きURL経由で Google Cloud Storage (GCS) へのアップロードまでを責務とし、GCS から Cloudflare R2 へのコピーと R2 ファイル管理は別リポジトリで管理される Google Cloud Run ワーカーで実行される。RSS フィードは R2 の公開 URL を使用して生成される。

## 技術コンテキスト

**言語/バージョン**: Python 3.11+, Next.js 16 (App Router)  
**フロントエンド**: Next.js 16 (React), Shadcn UI, TailwindCSS  
**バックエンド**: Python + FastAPI + Google Cloud Run  
**パッケージ管理**: uv (Python), npm (フロントエンド)  
**主要依存パッケージ**:

- API フレームワーク: FastAPI, Uvicorn
- ORM: SQLAlchemy 2.0
- ストレージ: google-cloud-storage, boto3 (Cloudflare R2)
- RSS生成: feedgen, xml2js
- バリデーション: Pydantic v2
- テスト: pytest, pytest-asyncio, Playwright, responses (HTTP mocking)

**ストレージ**: PostgreSQL 17  
**クラウドストレージ**: Google Cloud Storage (GCS) 音声ファイル、Cloudflare R2 (RSS フィード)  
**テスト**: pytest (ユニット/統合) + Playwright (E2E)  
**ターゲットプラットフォーム**: Web (ブラウザ) + Google Cloud Run  
**プロジェクトタイプ**: Web アプリケーション（フロントエンド + バックエンド）

**パフォーマンス目標**:

- RSS フィード生成: < 500ms (p95)
- エピソード一覧取得: < 200ms (p95)
- メタデータ更新 → RSS 反映: < 30秒
- UI インタラクション: < 100ms

**制約**:

- JavaScript バンドル: < 250KB (gzip)
- CSS: < 50KB (gzip)
- 100+ エピソード時の RSS 生成: < 2秒 (p95)
- アートワーク検証: < 10秒

**スケール/スコープ**:

- ユーザー数: 初期 100~1,000 ユーザー
- 番組数: ユーザー当たり最大 5~10 番組
- エピソード数: 番組当たり最大 1,000+ エピソード
- 画面数: ダッシュボード, 番組管理, エピソード管理, フィード設定, チーム管理 (約 6~8 画面)

## 憲法チェック

_ゲート: Phase 0 研究前に合格する必要があります。Phase 1 デザイン後に再確認します。_

### 必須要件（憲法より）

| 原則               | 要件                                                  | 状態                |
| ------------------ | ----------------------------------------------------- | ------------------- |
| I. コード品質      | Ruff/Black で Python 一貫性を強制; 型チェック有効    | ✅ 計画に含む       |
| II. テスト基準     | 80%+ カバレッジ; pytest + Playwright; TDD ワークフロー | ✅ 計画に含む       |
| III. UX一貫性      | Shadcn UI で デザイン一貫; エラーメッセージ明確化     | ✅ 計画に含む       |
| IV. パフォーマンス | API < 500ms (p95); RSS < 2s; UI < 100ms               | ✅ 計画に含む       |
| コードレビュー     | PR レビュー必須                                       | ✅ プロセスに含む   |
| テストゲート       | マージ前に 80%+ カバレッジ確認                        | ✅ CI/CD に組み込み |

**ゲート評価**: ✅ すべての主要原則が実装可能。違反なし。

## プロジェクト構造

### ドキュメンテーション（このフィーチャー）

```text
specs/001-podcast-cms-core/
├── plan.md              # このファイル
├── research.md          # Phase 0 出力（未作成）
├── data-model.md        # Phase 1 出力（未作成）
├── quickstart.md        # Phase 1 出力（未作成）
├── contracts/           # Phase 1 出力（未作成）
│   ├── api.openapi.yaml
│   └── db.schema.sql
└── spec.md              # フィーチャー仕様
```

### ソースコード（リポジトリルート）

```text
.
├── frontend/
│   ├── src/
│   │   ├── app/                    # Next.js App Router
│   │   │   ├── (auth)/             # 認証フロー
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── register/page.tsx
│   │   │   ├── (dashboard)/        # ダッシュボード
│   │   │   │   ├── shows/          # 番組管理
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── [id]/page.tsx
│   │   │   │   │   └── [id]/episodes/page.tsx
│   │   │   │   ├── team/           # チーム管理
│   │   │   │   ├── settings/       # 設定
│   │   │   │   └── layout.tsx
│   │   │   └── api/                # API Routes (BFF パターン)
│   │   │       ├── auth/
│   │   │       ├── shows/
│   │   │       ├── episodes/
│   │   │       └── feeds/
│   │   ├── components/
│   │   │   ├── ui/                 # Shadcn UI コンポーネント
│   │   │   ├── forms/              # フォームコンポーネント
│   │   │   ├── layout/             # レイアウトコンポーネント
│   │   │   └── podcast/            # ドメイン固有コンポーネント
│   │   ├── hooks/                  # カスタム React Hooks
│   │   ├── lib/
│   │   │   ├── api.ts              # API クライアント
│   │   │   ├── validation.ts       # Zod スキーマ
│   │   │   └── utils.ts
│   │   ├── types/
│   │   └── styles/
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/                    # Playwright E2E テスト
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.js
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── shows.py        # 番組エンドポイント
│   │   │   │   ├── episodes.py     # エピソードエンドポイント
│   │   │   │   ├── feeds.py        # フィード生成エンドポイント
│   │   │   │   └── auth.py
│   │   │   └── middleware/
│   │   │       ├── auth.py
│   │   │       └── validation.py
│   │   ├── services/
│   │   │   ├── podcast.py          # 番組ビジネスロジック
│   │   │   ├── episode.py          # エピソードビジネスロジック
│   │   │   ├── feed.py             # RSS 生成ロジック
│   │   │   ├── storage.py          # GCS/R2 インタラクション
│   │   │   └── auth.py
│   │   ├── models/
│   │   │   ├── podcast.py
│   │   │   ├── episode.py
│   │   │   └── user.py
│   │   ├── events/                 # イベント定義
│   │   │   └── episode_deleted.py  # エピソード削除イベント
│   │   ├── core/
│   │   │   ├── config.py           # 設定管理
│   │   │   ├── database.py         # SQLAlchemy セッション
│   │   │   ├── security.py         # JWT 認証
│   │   │   └── errors.py           # エラーハンドリング
│   │   ├── lib/
│   │   │   ├── gcs.py              # Google Cloud Storage (署名付きURL生成、削除イベント)
│   │   │   └── validators.py       # Pydantic スキーマ
│   │   ├── main.py                 # FastAPI アプリケーションエントリポイント
│   │   └── __init__.py
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── contract/               # API コントラクトテスト
│   ├── migrations/                 # Alembic マイグレーション
│   ├── pyproject.toml              # uv プロジェクト定義
│   ├── uv.lock                     # uv ロックファイル
│   ├── Dockerfile                  # Cloud Run デプロイ用
│   └── .dockerignore
│
├── shared/
│   ├── types/
│   │   ├── api.py                  # 共有 API 型定義
│   │   └── domain.py               # 共有 ドメイン型定義
│   ├── pyproject.toml
│   └── uv.lock
│
├── .specify/                        # Speckit 設定
├── .github/
│   ├── workflows/                  # CI/CD パイプライン
│   │   ├── test.yml
│   │   ├── lint.yml
│   │   └── deploy.yml
│   └── prompts/
├── docker-compose.yml              # ローカル開発環境
└── package.json                    # ルートレベル依存管理
```

**構造決定**: Web アプリケーション構造を採用。フロントエンド (Next.js 16 App Router) とバックエンド (FastAPI + Google Cloud Run) を分離し、スケーラビリティと責任の分離を実現。SQLAlchemy 2.0 ORM で PostgreSQL 17 データベースを管理。uv でバックエンド依存パッケージを管理。GCS と Cloudflare R2 でメディアファイルとフィード配信を管理。

## 複雑性追跡

> **憲法チェックに違反がある場合にのみ記入**

| 違反 | 理由 | より単純な代替案が不適切な理由 |
| ---- | ---- | ------------------------------ |
| なし | -    | -                              |

---

## 実装ガイドライン（Phase 0, 1, 2）

### Phase 0: 概要と研究（1-2日）

**目標**: すべての技術的不確実性を解決し、`research.md` を完成させる。

**研究タスク**:

1. Google Cloud Storage との署名付きURL統合パターン（アップロード、削除イベント）
2. Google Cloud Pub/Sub を用いた GCS → R2 コピーのイベント駆動アーキテクチャ（別リポジトリ実装）
3. イベントベース削除通知の仕様（エピソード削除時の GCS/R2 クリーンアップ）
4. SQLAlchemy 2.0 による複雑な関連付けと権限管理
5. FastAPI での JWT 認証フローとベストプラクティス
6. Shadcn UI カスタマイズとアクセシビリティ実装
7. pytest + Playwright でのテスト戦略（API + E2E）
8. RSS フィード生成の検証ルール（Podcast Namespace）- R2 URL を Enclosure に含める
9. Python 非同期処理（asyncio）と FastAPI の統合パターン

**出力**: `research.md` (すべての NEEDS CLARIFICATION を解決)

### Phase 1: デザインとコントラクト（2-3日）

**目標**: データモデル、API コントラクト、クイックスタートを作成。

**タスク**:

1. **データモデル** (`data-model.md`):
   - User, Podcast, Episode, TeamMember, AudioFile, Artwork エンティティ定義
   - SQLAlchemy モデルクラスで実装
   - リレーションシップと権限ロジック

2. **API コントラクト** (`contracts/`):
   - OpenAPI 3.0 スキーマ (`api.openapi.yaml`)
   - 認証 (JWT), 番組管理, エピソード管理, フィード生成, チーム管理エンドポイント
   - 署名付きURL生成エンドポイント (GCS アップロード用)
   - エピソード削除イベント通知エンドポイント（GCS/R2 クリーンアップ用）

3. **クイックスタート** (`quickstart.md`):
   - ローカル環境セットアップ手順
   - 初期データベース初期化スクリプト
   - GCS 認証情報セットアップ（署名付きURL生成用）
   - 最初の番組・エピソード作成フロー
   - 本アプリと別リポジトリ（ワーカー）との連携ポイント説明

4. **エージェントコンテキスト更新**:
   - `.specify/scripts/bash/update-agent-context.sh copilot` を実行
   - Copilot に Next.js 16 + FastAPI + SQLAlchemy + uv 技術スタックを通知

**出力**: `data-model.md`, `contracts/`, `quickstart.md`, エージェントコンテキスト更新

### Phase 2: 実装タスク生成（1日）

**目標**: `/speckit.tasks` コマンドで詳細な実装タスク一覧を生成。

**出力**: `tasks.md` (Story 単位の具体的な実装タスク)

---

## 次のステップ

1. **Phase 0 開始**: `research.md` を作成し、すべての技術的疑問を解決
2. **Phase 1 開始**: データモデルと API コントラクトを設計
3. **Phase 2 開始**: 実装タスクを `/speckit.tasks` で生成
4. **開発開始**: タスク単位で実装し、TDD ワークフローに従う
