```sh
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
```

```sh
specify init --here

Project ready.

╭────────────────────────────────────────────────────────────────────────────────────── Agent Folder Security ──────────────────────────────────────────────────────────────────────────────────────╮
│                                                                                                                                                                                                   │
│  Some agents may store credentials, auth tokens, or other identifying and private artifacts in the agent folder within your project.                                                              │
│  Consider adding .github/ (or parts of it) to .gitignore to prevent accidental credential leakage.                                                                                                │
│                                                                                                                                                                                                   │
╰───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯

╭─────────────────────────────────────────────────────────────────────────────────────────── Next Steps ────────────────────────────────────────────────────────────────────────────────────────────╮
│                                                                                                                                                                                                   │
│  1. Go to the project folder: cd podcast-manager                                                                                                                                                  │
│  2. Start using slash commands with your AI agent:                                                                                                                                                │
│     2.1 /speckit.constitution - Establish project principles                                                                                                                                      │
│     2.2 /speckit.specify - Create baseline specification                                                                                                                                          │
│     2.3 /speckit.plan - Create implementation plan                                                                                                                                                │
│     2.4 /speckit.tasks - Generate actionable tasks                                                                                                                                                │
│     2.5 /speckit.implement - Execute implementation                                                                                                                                               │
│                                                                                                                                                                                                   │
╰───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯

╭────────────────────────────────────────────────────────────────────────────────────── Enhancement Commands ───────────────────────────────────────────────────────────────────────────────────────╮
│                                                                                                                                                                                                   │
│  Optional commands that you can use for your specs (improve quality & confidence)                                                                                                                 │
│                                                                                                                                                                                                   │
│  ○ /speckit.clarify (optional) - Ask structured questions to de-risk ambiguous areas before planning (run before /speckit.plan if used)                                                           │
│  ○ /speckit.analyze (optional) - Cross-artifact consistency & alignment report (after /speckit.tasks, before /speckit.implement)                                                                  │
│  ○ /speckit.checklist (optional) - Generate quality checklists to validate requirements completeness, clarity, and consistency (after /speckit.plan)                                              │
│                                                                                                                                                                                                   │
╰───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
```

```sh
# 提供する機能と範囲（What: 何を作るのか）
本サービスは、**「ポッドキャスト特化型コンテンツ管理システム（CMS）」**です。

# なぜ作るのか（Why）：「配信管理の煩雑さ」を取り除き、クリエイターが「音声コンテンツの制作」に集中できる世界を実現します。

# 主要な機能
A. 番組（Show）管理機能

- 番組メタデータ編集: 番組タイトル、説明文、著者情報、カテゴリ設定、言語設定など、RSSの <channel> タグに相当する情報をフォーム形式で編集できる。
- アートワーク管理: 番組のカバーアート（画像）をアップロードし、配信プラットフォームの規格（サイズ・形式）に適合しているか管理する。

B. エピソード（Episode）管理機能

- 音声ファイル管理: 配信する音声ファイル（MP3/AAC等）をアップロードし、公開可能なURL（Enclosure URL）として紐付ける。
- エピソードメタデータ編集: エピソードごとのタイトル、説明（Show Notes）、配信日時、エピソード番号、シーズン番号、Explicit（不適切な表現）フラグなどを設定できる。

C. RSSフィード生成・出力機能

- リアルタイム生成: 上記の入力データを元に、Podcast名前空間（iTunes tagsなど）に準拠した有効なXMLを自動生成する。
- フィードURLの発行: 外部プラットフォーム（Apple, Spotify等）に登録するための固定RSS URLを提供する
- マルチ番組対応: 1つのユーザーアカウントで「複数の異なる番組」を管理できる
- チーム管理:「編集者」や「管理者」のように複数人でログインして共同編集できる
```

## 4. Create a technical implementation plan

```sh
/speckit.plan アプリケーションはNext.js (App Router) とTypeScriptで構築されたポッドキャストCMSです。 アーキテクチャは、フロントエンドダッシュボードと、Google Cloud Run上で動作する独立したバックエンドワーカーで構成されます。 データベースにはPostgreSQLを、ORMにはPrismaを使用してください。 中核となる音声パイプラインは以下のフローに従う必要があります：
1. クライアントは署名付きURL経由でGoogle Cloud Storage (GCS) に直接音声をアップロードする。
2. RSSフィードはCloudflare R2の公開URLを使用して生成される。 フロントエンドコンポーネントにはShadcn UIを使用してください。
```

### 修正 1

```sh
specs/001-podcast-cms-core/spec.md Podcastの新エピソード追加では、音声ファイルをGCSにアップロードする。音声ファイルのホストはR2上で実施し、R2上の音声ファイルの変更削除をアプリ経由で可能にする。以上の仕様をspec.mdに記載する必要があれば追記して。
```

### 修正 2

```sh
specs/001-podcast-cms-core/spec.md GCSにアップロードした後にCloud Runで実行される処理は別のリポジトリで管理されているので、本アプリで実装する必要はない。以上の仕様をspec.mdに記載する必要があれば追記して。
```

## 5. Break down into tasks

Use /speckit.tasks to create an actionable task list from your implementation plan.

```sh
/speckit.tasks
```
