# Tasks: ポッドキャスト特化型CMS コア機能

**入力**: `/specs/001-podcast-cms-core/` の設計ドキュメント  
**前提条件**: plan.md（必須）、spec.md（ユーザーストーリー用、必須）

**テスト**: テストタスクはOPTIONAL - spec.md に明示的にリクエストされた場合のみ含める

**編成**: タスクはユーザーストーリー別にグループ化され、各ストーリーの独立した実装とテストが可能

## フォーマット: `- [ ] [ID] [P?] [Story] 説明`

- **[P]**: 並列実行可能（異なるファイル、依存なし）
- **[Story]**: このタスクが属するユーザーストーリー（例：US1, US2）
- 説明には正確なファイルパスを含める

---

## Phase 1: セットアップ（共有インフラ）

**目的**: プロジェクト初期化と基本構造

- [x] T001 `/frontend` と `/backend` ディレクトリ構造を作成
- [x] T002 [P] Next.js 16 (App Router) フロントエンドプロジェクト初期化
- [x] T003 [P] FastAPI バックエンドプロジェクト初期化（uv で依存管理）
- [x] T004 [P] Python 3.11+ 必須パッケージを uv でセットアップ（FastAPI, SQLAlchemy, Pydantic, pytest）
- [x] T005 [P] Ruff/Black 設定ファイルを作成（`.ruff.toml`, `pyproject.toml`）
- [x] T006 [P] Git pre-commit hook を設定（Ruff lint + Black format 自動実行）
- [x] T007 PostgreSQL 17 ローカル開発環境を `docker-compose.yml` に設定

---

## Phase 2: 基盤（ブロッキング前提条件）

**目的**: すべてのユーザーストーリーが依存する共有インフラストラクチャ

⚠️ **CRITICAL**: このフェーズが完了するまでユーザーストーリーの実装は開始できない

- [x] T008 SQLAlchemy モデルを `/backend/app/models/` に定義（User, Podcast, Episode, AudioFile, Artwork, TeamMember）
- [x] T009 [P] Alembic マイグレーション初期化を `/backend/migrations/` に実行
- [x] T010 [P] SQLAlchemy ORM クライアント・セッションを `/backend/app/core/database.py` に実装
- [x] T011 [P] JWT 認証ミドルウェアを `/backend/app/api/middleware/auth.py` に実装
- [x] T012 [P] 認可・ロール管理ロジックを `/backend/app/core/security.py` に実装
- [x] T013 [P] Pydantic スキーマ（バリデーション）を `/backend/app/lib/validators.py` に定義
- [x] T014 [P] API エラーハンドリング統一フォーマットを `/backend/app/core/errors.py` に実装
- [x] T015 [P] ロギング設定を `/backend/app/core/` に実装
- [x] T016 Google Cloud Storage (GCS) SDK 統合を `/backend/app/lib/gcs.py` に実装（署名付きURL生成、削除イベント）
- [x] T017 [P] 環境変数設定テンプレートを `.env.example` に作成（Python/FastAPI用）
- [x] T018 [P] FastAPI アプリケーションエントリポイント `/backend/app/main.py` を作成（ルーター登録）
- [x] T019 [P] フロントエンド Shadcn UI コンポーネント基盤を `/frontend/src/components/ui/` に作成
- [x] T020 [P] フロントエンド API クライアント実装を `/frontend/src/lib/api.ts` に作成（Next.js 16対応）

**チェックポイント**: 基盤準備完了 - ユーザーストーリー実装が並列実行可能

---

## Phase 2.1: ストレージバックエンド抽象化（ブロッキング前提条件）

**目的**: ファイルストレージ（画像、音声）の保存先を抽象化し、複数バックエンド（GCS、Cloudflare R2など）に対応可能な設計

⚠️ **CRITICAL**: このフェーズが完了するまで、ファイルアップロード機能（US2・US4）を実装できない

- [x] T020.5 [P] ストレージバックエンド抽象化インターフェース を `/backend/app/lib/storage.py` に実装（base class、各実装は依存）
- [x] T020.6 [P] Google Cloud Storage (GCS) バックエンド実装を `/backend/app/lib/storage_gcs.py` に実装（署名付きURL、削除）
- [x] T020.7 [P] Cloudflare R2 バックエンド実装を `/backend/app/lib/storage_r2.py` に実装
- [x] T020.8 [P] ストレージバックエンド設定を `/backend/app/core/config.py` に追加（環境変数から読み込み）
- [x] T020.9 ストレージバックエンド依存解決コンテナを `/backend/app/core/dependencies.py` に実装

**チェックポイント**: ストレージ抽象化完全実装・複数バックエンド対応準備完了

---

## Phase 2.5: 認証エンドポイント実装（ブロッキング前提条件）

**目的**: マルチユーザー環境のための認証・アカウント管理エンドポイント実装

⚠️ **CRITICAL**: このフェーズが完了するまで、真のマルチユーザー運用が開始できない（US7・US8 の前提）

- [x] T021 [P] [Auth] ユーザー登録エンドポイント `POST /api/auth/register` を `/backend/app/api/routes/auth.py` に実装（メールバリデーション含む）
- [x] T022 [P] [Auth] ログインエンドポイント `POST /api/auth/login` を `/backend/app/api/routes/auth.py` に実装（JWT発行）
- [x] T023 [P] [Auth] トークンリフレッシュエンドポイント `POST /api/auth/refresh` を `/backend/app/api/routes/auth.py` に実装
- [x] T024 [P] [Auth] 現在ユーザー取得エンドポイント `GET /api/auth/me` を `/backend/app/api/routes/auth.py` に実装
- [x] T025 [Auth] ユーザー登録バリデーションスキーマを `/backend/app/lib/validators.py` に追加（メール形式、パスワード強度）
- [x] T026 [P] [Auth] ログイン画面を `/frontend/src/app/login/page.tsx` に実装
- [x] T027 [P] [Auth] ユーザー登録画面を `/frontend/src/app/register/page.tsx` に実装
- [x] T028 [P] [Auth] 認証状態管理 hook を `/frontend/src/hooks/useAuth.ts` に実装
- [x] T029 [P] [Auth] 認証ガード（ProtectedRoute）を `/frontend/src/components/auth/ProtectedRoute.tsx` に実装
- [x] T030 [Auth] ローカル環境での認証フロー検証（登録→ログイン→トークンリフレッシュ）

**チェックポイント**: 認証エンドポイント完全実装・マルチユーザー環境準備完了

---

## Phase 3: ユーザーストーリー1 - 番組の基本メタデータ設定と公開（優先度: P1）🎯 MVP

**ゴール**: ポッドキャスト配信者が番組の基本情報（タイトル、説明、著者、カテゴリ、言語）を入力・保存・編集でき、ダッシュボードに表示される

**独立テスト**: 番組メタデータを入力して保存し、ダッシュボードで正確に表示されることを確認

### 実装 - ユーザーストーリー1

- [x] T031 [P] [US1] Podcast SQLAlchemy モデルと migration を `/backend/app/models/podcast.py` に定義
- [x] T032 [P] [US1] 番組作成エンドポイント `POST /api/shows` を `/backend/app/api/routes/shows.py` に実装
- [x] T033 [P] [US1] 番組取得エンドポイント `GET /api/shows/:id` を `/backend/app/api/routes/shows.py` に実装
- [x] T034 [P] [US1] 番組一覧エンドポイント `GET /api/shows` を `/backend/app/api/routes/shows.py` に実装
- [x] T035 [P] [US1] 番組更新エンドポイント `PUT /api/shows/:id` を `/backend/app/api/routes/shows.py` に実装
- [x] T036 [US1] Podcast ビジネスロジックサービスを `/backend/app/services/podcast.py` に実装（依存：T032-T035）
- [x] T037 [P] [US1] 番組作成フォームコンポーネントを `/frontend/src/components/forms/CreateShowForm.tsx` に実装
- [x] T038 [P] [US1] 番組編集フォームコンポーネントを `/frontend/src/components/forms/EditShowForm.tsx` に実装
- [x] T039 [P] [US1] 番組詳細ページを `/frontend/src/app/(dashboard)/shows/[id]/page.tsx` に実装
- [x] T040 [P] [US1] ダッシュボード - 番組リスト表示ページを `/frontend/src/app/(dashboard)/shows/page.tsx` に実装
- [x] T041 [US1] 番組メタデータ入力検証を `/backend/app/lib/validators.py` に追加（依存：T013）
- [x] T042 [US1] 言語オプションドロップダウンコンポーネントを `/frontend/src/components/ui/LanguageSelect.tsx` に実装
- [x] T043 [US1] 数ユーザーによる初期テストおよびUX検証

**チェックポイント**: ユーザーストーリー1 完全実装・テスト完了 - MVP コア機能1つ目

---

## Phase 4: ユーザーストーリー2 - 番組・エピソードアートワーク管理（優先度: P1）

**ゴール**: 配信者が番組レベルおよびエピソードレベルでカバーアート（画像）をアップロードでき、プラットフォーム規格（Apple/Spotify: 3000x3000px以上）への適合性を検証できる。ストレージバックエンド（GCS、Cloudflare R2など）は設定によって切り替え可能。

**独立テスト**: チャンネルとエピソードの両レベルで画像をアップロードして、警告メッセージと検証結果が正確に表示される

### 実装 - ユーザーストーリー2

- [ ] T044 [P] [US2] Artwork SQLAlchemy モデルを `/backend/app/models/artwork.py` に更新（Podcast と Episode の両方に関連付け対応）
- [ ] T045 [P] [US2] 画像検証ユーティリティを `/backend/app/lib/image_validator.py` に実装（サイズ・形式チェック）
- [ ] T046 [US2] 番組レベル画像アップロードエンドポイント `POST /api/shows/:showId/artwork` を `/backend/app/api/routes/artwork.py` に実装（依存：T045, T020.5）
- [ ] T047 [US2] 番組レベル画像取得エンドポイント `GET /api/shows/:showId/artwork` を `/backend/app/api/routes/artwork.py` に実装
- [ ] T048 [US2] 番組レベル画像削除エンドポイント `DELETE /api/shows/:showId/artwork` を `/backend/app/api/routes/artwork.py` に実装
- [ ] T049 [P] [US2] エピソードレベル画像アップロードエンドポイント `POST /api/shows/:showId/episodes/:episodeId/artwork` を `/backend/app/api/routes/artwork.py` に実装
- [ ] T050 [P] [US2] エピソードレベル画像取得エンドポイント `GET /api/shows/:showId/episodes/:episodeId/artwork` を `/backend/app/api/routes/artwork.py` に実装
- [ ] T051 [P] [US2] エピソードレベル画像削除エンドポイント `DELETE /api/shows/:showId/episodes/:episodeId/artwork` を `/backend/app/api/routes/artwork.py` に実装
- [ ] T052 [P] [US2] アートワークアップロードコンポーネントを `/frontend/src/components/forms/ArtworkUpload.tsx` に実装（再利用可能）
- [ ] T053 [P] [US2] 画像プレビュー＆検証ステータス表示を `/frontend/src/components/podcast/ArtworkPreview.tsx` に実装
- [ ] T054 [P] [US2] 警告メッセージコンポーネントを `/frontend/src/components/ui/ValidationWarning.tsx` に実装
- [ ] T055 [US2] フロントエンド - 番組レベルアートワーク管理ページを `/frontend/src/app/(dashboard)/shows/[id]/artwork/page.tsx` に実装（依存：T052-T054）
- [ ] T056 [US2] フロントエンド - エピソード編集フォームにアートワーク管理を統合（依存：T052-T054）
- [ ] T057 [US2] ローカル環境でのテストおよび複数画像での検証

**チェックポイント**: ユーザーストーリー2 完全実装・テスト完了 - MVP コア機能2つ目

---

## Phase 5: ユーザーストーリー3 - エピソード基本情報の入力と公開（優先度: P1）

**ゴール**: 配信者がエピソード情報（タイトル、説明、配信日時、番号）を入力・保存・編集でき、ダッシュボードに一覧表示される

**独立テスト**: エピソード情報を入力して保存し、一覧で正確に表示されることを確認

### 実装 - ユーザーストーリー3

- [x] T058 [P] [US3] Episode SQLAlchemy モデルを `/backend/app/models/episode.py` に定義（Podcast との関連付け、Artwork 対応）
- [x] T059 [P] [US3] エピソード作成エンドポイント `POST /api/shows/:showId/episodes` を `/backend/app/api/routes/episodes.py` に実装
- [x] T060 [P] [US3] エピソード取得エンドポイント `GET /api/shows/:showId/episodes/:episodeId` を `/backend/app/api/routes/episodes.py` に実装
- [x] T061 [P] [US3] エピソード一覧エンドポイント `GET /api/shows/:showId/episodes` を `/backend/app/api/routes/episodes.py` に実装
- [x] T062 [P] [US3] エピソード更新エンドポイント `PUT /api/shows/:showId/episodes/:episodeId` を `/backend/app/api/routes/episodes.py` に実装
- [x] T063 [US3] Episode ビジネスロジックサービスを `/backend/app/services/episode.py` に実装（依存：T059-T062）
- [x] T064 [P] [US3] エピソード作成フォームを `/frontend/src/components/forms/CreateEpisodeForm.tsx` に実装
- [x] T065 [P] [US3] エピソード編集フォームを `/frontend/src/components/forms/EditEpisodeForm.tsx` に実装
- [x] T066 [P] [US3] エピソード一覧コンポーネントを `/frontend/src/components/podcast/EpisodeList.tsx` に実装
- [x] T067 [P] [US3] フロントエンド - エピソード管理ページを `/frontend/src/app/(dashboard)/shows/[id]/episodes/page.tsx` に実装
- [x] T068 [US3] エピソード入力値検証スキーマを `/backend/app/lib/validators.py` に追加（依存：T013）
- [ ] T069 [US3] ローカル環境でのテストおよび複数エピソードでの検証

**チェックポイント**: ユーザーストーリー3 完全実装・テスト完了 - MVP コア機能3つ目

---

## Phase 6: ユーザーストーリー4 - 音声ファイルのアップロードと紐付け（優先度: P1）

**ゴール**: 配信者が MP3/AAC 形式の音声ファイルをストレージ（GCS等）にアップロードし、エピソードに紐付け、Enclosure URL として管理できる

**独立テスト**: 音声ファイルをアップロードしてストレージに保存され、公開 URL が RSS フィードに含まれることを確認

### 実装 - ユーザーストーリー4

- [ ] T070 [P] [US4] AudioFile SQLAlchemy モデルを `/backend/app/models/audio_file.py` に定義（Episode との関連付け）
- [ ] T071 [P] [US4] ストレージバックエンド経由の署名付きURL生成エンドポイント `POST /api/audio/signed-url` を `/backend/app/api/routes/audio.py` に実装（依存：T020.5）
- [ ] T072 [P] [US4] 音声ファイルメタデータ登録エンドポイント `POST /api/shows/:showId/episodes/:episodeId/audio` を `/backend/app/api/routes/audio.py` に実装
- [ ] T073 [P] [US4] 音声ファイル取得エンドポイント `GET /api/shows/:showId/episodes/:episodeId/audio` を `/backend/app/api/routes/audio.py` に実装
- [ ] T074 [US4] エピソード削除時の削除イベント送信を `/backend/app/services/episode.py` に実装（依存：T063）
- [ ] T075 [P] [US4] 音声ファイルアップロードコンポーネントを `/frontend/src/components/forms/AudioUpload.tsx` に実装（署名付きURL利用）
- [ ] T076 [P] [US4] アップロード進捗インジケータを `/frontend/src/components/ui/UploadProgress.tsx` に実装
- [ ] T077 [P] [US4] ファイルサイズ警告コンポーネントを `/frontend/src/components/ui/FileSizeWarning.tsx` に実装
- [ ] T078 [US4] フロントエンド - エピソード編集時に音声アップロード機能を統合（`/frontend/src/components/forms/EditEpisodeForm.tsx` 修正、依存：T065, T075）
- [ ] T079 [P] [US4] 音声ファイル形式検証を `/backend/app/lib/validators.py` に追加
- [ ] T080 [US4] ローカル環境でのストレージ認証テスト および ファイルアップロード検証

**チェックポイント**: ユーザーストーリー4 完全実装・テスト完了 - MVP コア機能4つ目

---

## Phase 7: ユーザーストーリー5 - RSS フィード自動生成（優先度: P1）

**ゴール**: システムが番組・エピソード・音声ファイルのメタデータから、Podcast Namespace に準拠した有効な XML 形式の RSS フィードを自動生成し、リアルタイム更新される

**独立テスト**: RSS フィード生成エンドポイントを呼び出し、有効な XML が返され、必須タグがすべて含まれることを確認

### 実装 - ユーザーストーリー5

- [ ] T077 [P] [US5] RSS 生成ロジックを `/backend/app/services/feed.py` に実装（Podcast Namespace 対応）
- [ ] T078 [P] [US5] Enclosure URL に R2 公開 URL を含めるロジックを追加（`feed.py` 内）
- [ ] T079 [P] [US5] RSS フィード取得エンドポイント `GET /feeds/shows/:showId/rss.xml` を `/backend/app/api/routes/feeds.py` に実装
- [ ] T080 [P] [US5] XML 検証ユーティリティを `/backend/app/lib/xml_validator.py` に実装
- [ ] T081 [US5] RSS キャッシング戦略を `/backend/app/lib/cache.py` に実装（パフォーマンス最適化）
- [ ] T082 [P] [US5] RSS フィード表示・検証ページを `/frontend/src/app/(dashboard)/shows/[id]/feed/page.tsx` に実装
- [ ] T083 [P] [US5] XML プレビューコンポーネントを `/frontend/src/components/podcast/FeedPreview.tsx` に実装
- [ ] T084 [US5] 複数エピソード（100+）での RSS 生成パフォーマンステスト

**チェックポイント**: ユーザーストーリー5 完全実装・テスト完了 - MVP コア機能5つ目

---

## Phase 8: ユーザーストーリー6 - 固定 RSS フィード URL の提供（優先度: P1）

**ゴール**: 各番組に一意で固定の RSS フィード URL を発行し、Apple Podcasts や Spotify などのプラットフォームに登録可能にする

**独立テスト**: 番組ごとに異なる固定 URL が発行され、複数回アクセスで同じ URL が返されること、および有効な RSS が取得されることを確認

### 実装 - ユーザーストーリー6

- [ ] T085 [P] [US6] Podcast に `feedUrl` フィールドを SQLAlchemy モデル `/backend/app/models/podcast.py` に追加
- [ ] T086 [P] [US6] 番組作成時に固定 RSS URL を生成するロジックを `/backend/app/services/podcast.py` に追加（依存：T036）
- [ ] T087 [US6] フィード URL 取得エンドポイント `GET /api/shows/:showId/feed-url` を `/backend/app/api/routes/feeds.py` に実装
- [ ] T088 [P] [US6] フロントエンド - フィード設定ページを `/frontend/src/app/(dashboard)/shows/[id]/settings/feed/page.tsx` に実装
- [ ] T089 [P] [US6] フィード URL コピーボタンコンポーネントを `/frontend/src/components/ui/CopyButton.tsx` に実装
- [ ] T090 [US6] ローカル環境での複数番組 URL 検証テスト

**チェックポイント**: ユーザーストーリー6 完全実装・テスト完了 - MVP コア機能6つ目

---

## Phase 9: ユーザーストーリー7 - 複数番組管理（優先度: P2）

**ゴール**: 1つのユーザーアカウントで複数の異なる番組を管理でき、ダッシュボードから各番組に容易に切り替え可能

**独立テスト**: 複数番組を作成し、ダッシュボードで切り替え、各番組の独立したメタデータが正確に表示されることを確認

### 実装 - ユーザーストーリー7

- [ ] T091 [P] [US7] User-Podcast 関連付けロジックを SQLAlchemy モデル内で実装（1対多）
- [ ] T092 [P] [US7] ユーザーの番組一覧エンドポイント `GET /api/shows?userId=...` を修正（フィルタリング追加）
- [ ] T093 [P] [US7] 現在のユーザーコンテキスト取得エンドポイント `GET /api/me/current-show` を `/backend/app/api/routes/auth.py` に実装
- [ ] T094 [US7] 現在の番組コンテキスト状態管理を `/frontend/src/lib/current-show.ts` に実装（React Context）
- [ ] T095 [P] [US7] ダッシュボード番組切り替えドロップダウンを `/frontend/src/components/layout/ShowSwitcher.tsx` に実装
- [ ] T096 [P] [US7] 番組切り替え時のページ遷移ロジックを `/frontend/src/app/(dashboard)/layout.tsx` に追加
- [ ] T097 [US7] 複数番組での独立した RSS フィード検証テスト

**チェックポイント**: ユーザーストーリー7 完全実装・テスト完了

---

## Phase 10: ユーザーストーリー8 - チーム協働編集（優先度: P2）

**ゴール**: 複数ユーザーが同じ番組に「編集者」「管理者」ロールでアクセスし、メタデータ編集やエピソード公開を分担できる

**独立テスト**: 複数ユーザーでアカウント作成、同じ番組へのアクセス権付与、権限制御が機能することを確認

### 実装 - ユーザーストーリー8

- [ ] T098 [P] [US8] TeamMember SQLAlchemy モデルをスキーマに追加（ロール: admin, editor）
- [ ] T099 [P] [US8] ロールベースアクセス制御（RBAC）を `/backend/app/core/security.py` に実装（依存：T012）
- [ ] T100 [P] [US8] チームメンバー招待エンドポイント `POST /api/shows/:showId/members/invite` を `/backend/app/api/routes/team.py` に実装
- [ ] T101 [P] [US8] チームメンバー一覧エンドポイント `GET /api/shows/:showId/members` を `/backend/app/api/routes/team.py` に実装
- [ ] T102 [P] [US8] チームメンバー削除エンドポイント `DELETE /api/shows/:showId/members/:userId` を `/backend/app/api/routes/team.py` に実装
- [ ] T103 [P] [US8] ロール変更エンドポイント `PUT /api/shows/:showId/members/:userId/role` を `/backend/app/api/routes/team.py` に実装
- [ ] T104 [P] [US8] メール招待メッセージテンプレートを `/backend/app/templates/invite_email.html` に作成
- [ ] T105 [P] [US8] メール送信ロジックを `/backend/app/services/email.py` に実装
- [ ] T106 [P] [US8] 招待受け入れエンドポイント `POST /api/invitations/:token/accept` を `/backend/app/api/routes/auth.py` に実装
- [ ] T107 [P] [US8] チーム管理ページを `/frontend/src/app/(dashboard)/shows/[id]/team/page.tsx` に実装
- [ ] T108 [P] [US8] メンバー招待フォームを `/frontend/src/components/forms/InviteTeamMemberForm.tsx` に実装
- [ ] T109 [P] [US8] メンバーリストとロール管理UIを `/frontend/src/components/team/MemberList.tsx` に実装
- [ ] T110 [US8] エディタロール権限テスト（管理者追加操作が拒否される）

**チェックポイント**: ユーザーストーリー8 完全実装・テスト完了

---

## Phase 11: ポーランド＆クロスカッティング

**目的**: 品質向上、パフォーマンス最適化、本番環境対応

- [ ] T111 [P] エラーメッセージ統一・わかりやすさ改善
- [ ] T112 [P] ローディング状態 UI 統一（Skeleton/Spinner）
- [ ] T113 [P] 空状態 UI 実装（データなしの場合の表示）
- [ ] T114 [P] アクセシビリティ監査（WCAG 2.1 Level AA）
- [ ] T115 [P] 国際化（i18n）設定（日本語/英語対応）
- [ ] T116 パフォーマンス監査（Lighthouse, Core Web Vitals）
- [ ] T117 セキュリティ監査（OWASP Top 10）
- [ ] T118 [P] ログアウト・セッション管理の改善
- [ ] T119 [P] 公開 API ドキュメント生成（OpenAPI/Swagger UI）
- [ ] T120 本番環境デプロイ手順書作成

**チェックポイント**: 全機能実装完了・本番対応準備完了

---

## 依存関係グラフ

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← BLOCKING
    ↓
Phase 2.5 (Authentication Endpoints) ← BLOCKING (for US7-US8)
    ↓
┌──────────────────────────────────────────┐
│ Phase 3-10: User Stories (並列実行可能)   │
│                                          │
│ US1 (Show Metadata)                     │
│ US2 (Artwork) ──→ US3 (Episodes)       │
│ US3 (Episodes) ──→ US4 (Audio)         │
│ US4 (Audio) ──→ US5 (RSS Feed)         │
│ US5 (RSS Feed) ──→ US6 (Fixed URL)    │
│ US1 ──→ US7 (Multi Show)               │
│ Auth (Phase 2.5) ──→ US7, US8         │
└──────────────────────────────────────────┘
    ↓
Phase 11: Polish & Cross-cutting
```

---

## 並列実行例

### MVP 最小必要機能（Phase 1-2 + 2.5 + US1-6）

**推定所要時間**: 5-7週間

1. **Week 1-2**: Phase 1 (Setup) + Phase 2 (Foundational)
2. **Week 2-3**: Phase 2.5 (Authentication) + US1 並列実行
3. **Week 3**: US2 並列実行（US1 完了後）
4. **Week 3-4**: US3 + US4 並列実行（US1 完了後）
5. **Week 4-5**: US5 + US6（US3-4 完了後）

### フル実装（全8ユーザーストーリー）

**推定所要時間**: 7-9週間

1. **Week 1-2**: Phase 1 + Phase 2
2. **Week 2-3**: Phase 2.5 (Authentication)
3. **Week 3-5**: US1-6 段階的実装
4. **Week 5-6**: US7 + US8 並列実行（Auth完了後）
5. **Week 6-7**: Phase 11 (Polish)
6. **Week 7-9**: テスト・本番対応

---

## 実装戦略

### MVP スコープ（推奨）

ユーザーストーリー 1-6（Phase 1-10 前半）を優先実装

**理由**:

- 認証エンドポイント → 番組作成 → 音声アップロード → RSS 生成という主要な流れを完成
- 単一ユーザーでの完全な配信準備が可能
- 市場投入可能な最小機能

### 段階的デリバリー

1. **Sprint 1**: Phase 1-2 (Setup + Foundational)
2. **Sprint 2**: Phase 2.5 (Authentication) + US1 (Show Metadata)
3. **Sprint 3**: US2 (Artwork)
4. **Sprint 4**: US3-4 (Episodes + Audio)
5. **Sprint 5**: US5-6 (RSS Feed)
6. **Sprint 6**: US7-8 (Multi-show + Team)
7. **Sprint 7**: Phase 11 (Polish & 本番対応)

---

## 総タスク数

| フェーズ | 件数 | 内訳 |
|---------|------|------|
| Phase 1 | 7 | Setup |
| Phase 2 | 13 | Foundational |
| Phase 2.5 | 10 | Authentication |
| US1 (P1) | 13 | Show Metadata |
| US2 (P1) | 10 | Artwork |
| US3 (P1) | 12 | Episodes |
| US4 (P1) | 11 | Audio Upload |
| US5 (P1) | 8 | RSS Feed |
| US6 (P1) | 6 | Fixed URL |
| US7 (P2) | 7 | Multi Show |
| US8 (P2) | 13 | Team Collab |
| Phase 11 | 10 | Polish |
| **合計** | **120** | **全フェーズ** |

---

## 次のステップ

1. ✅ **spec.md/plan.md 確認完了**
2. 🚀 **実装開始**: Phase 1 から順序立てて実行
3. 📊 **進捗追跡**: 各フェーズ/ユーザーストーリー単位で検証
4. 🧪 **並列実行**: Phase 2 + 2.5 完了後、US1-6 を並列推進
