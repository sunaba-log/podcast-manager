# データモデル：ポッドキャスト特化型CMS

**フェーズ**: Phase 1  
**日付**: 2026年1月27日  
**ステータス**: 完成

## エンティティ定義

### 1. User （ユーザー）

配信者、チームメンバーとして登録されたユーザー

**フィールド**:
| フィールド | 型 | 説明 | 制約 |
|-----------|---|----|-----|
| id | String (UUID) | 一意識別子 | PK |
| email | String | メールアドレス | UNIQUE, NOT NULL |
| password | String | bcryptハッシュ | NOT NULL |
| name | String | ユーザー名 | NOT NULL |
| createdAt | DateTime | 作成日時 | DEFAULT now() |
| updatedAt | DateTime | 更新日時 | AUTO UPDATE |

**リレーション**:

- `ownedPodcasts`: 所有している番組（1対多）
- `teamMemberships`: チームメンバーとして参加している番組（多対多）

**バリデーション**:

- email: 有効なメールアドレス形式
- password: 最小8文字、大文字・小文字・数字を含む
- name: 1~100文字

---

### 2. Podcast （番組）

ポッドキャスト番組の基本情報

**フィールド**:
| フィールド | 型 | 説明 | 制約 |
|-----------|---|----|-----|
| id | String (UUID) | 一意識別子 | PK |
| title | String | 番組タイトル | NOT NULL, INDEX |
| description | String | 番組説明 | NOT NULL |
| ownerId | String | 所有者ID | FK -> User.id, NOT NULL |
| author | String | 著者名 | OPTIONAL |
| category | String[] | カテゴリ（JSON配列） | DEFAULT [] |
| language | String | 言語コード（ISO 639-1） | DEFAULT 'en', INDEX |
| explicit | Boolean | 不適切な表現フラグ | DEFAULT false |
| feedUrl | String | RSS フィードURL | UNIQUE, NOT NULL, GENERATED |
| rssUpdatedAt | DateTime | RSS最終更新日時 | OPTIONAL |
| createdAt | DateTime | 作成日時 | DEFAULT now(), INDEX |
| updatedAt | DateTime | 更新日時 | AUTO UPDATE |

**リレーション**:

- `owner`: 所有ユーザー（多対1）
- `episodes`: 含まれるエピソード（1対多）
- `artwork`: カバーアート（1対1）
- `teamMembers`: チームメンバー（1対多）

**バリデーション**:

- title: 1~255文字
- description: 1~1000文字
- category: 有効なカテゴリのみ（Technology, Business, News, Education, Arts等）
- language: ISO 639-1 形式（ja, en, fr等）
- feedUrl: 自動生成 `/feeds/{podcastId}/rss.xml`

**インデックス**:

- (ownerId, language)
- (createdAt DESC) - 最新番組の取得

---

### 3. Episode （エピソード）

個別のポッドキャスト回

**フィールド**:
| フィールド | 型 | 説明 | 制約 |
|-----------|---|----|-----|
| id | String (UUID) | 一意識別子 | PK |
| podcastId | String | 親番組ID | FK -> Podcast.id, NOT NULL, INDEX |
| title | String | エピソードタイトル | NOT NULL, INDEX |
| description | String | Show Notes | NOT NULL |
| episodeNumber | Int | エピソード番号 | OPTIONAL |
| seasonNumber | Int | シーズン番号 | DEFAULT 1 |
| publishedAt | DateTime | 公開予定日時 | NOT NULL, INDEX |
| explicit | Boolean | 不適切な表現フラグ | DEFAULT false |
| duration | Int | 音声長（秒） | OPTIONAL |
| createdAt | DateTime | 作成日時 | DEFAULT now() |
| updatedAt | DateTime | 更新日時 | AUTO UPDATE |

**リレーション**:

- `podcast`: 親番組（多対1）
- `audioFile`: 音声ファイル（1対1）

**バリデーション**:

- title: 1~255文字
- description: 1~5000文字
- episodeNumber: 1以上
- seasonNumber: 1以上
- publishedAt: 過去または現在の日時
- duration: 60以上（秒）

**インデックス**:

- (podcastId, publishedAt DESC) - エピソード一覧の高速取得
- (podcastId, seasonNumber, episodeNumber) - シーズンごと取得

---

### 4. AudioFile （音声ファイル）

エピソードに紐付けられたアップロード済み音声ファイル

**フィールド**:
| フィールド | 型 | 説明 | 制約 |
|-----------|---|----|-----|
| id | String (UUID) | 一意識別子 | PK |
| episodeId | String | 親エピソードID | FK -> Episode.id, NOT NULL, UNIQUE |
| fileName | String | ファイル名 | NOT NULL |
| mimeType | String | MIME タイプ | DEFAULT 'audio/mpeg', NOT NULL |
| size | BigInt | ファイルサイズ（バイト） | NOT NULL |
| gcsPath | String | GCS保存パス | NOT NULL |
| publicUrl | String | 公開URL | NOT NULL, UNIQUE |
| duration | Int | 音声長（秒） | OPTIONAL |
| uploadedAt | DateTime | アップロード日時 | DEFAULT now() |
| createdAt | DateTime | 作成日時 | DEFAULT now() |

**リレーション**:

- `episode`: 親エピソード（多対1）

**バリデーション**:

- mimeType: 'audio/mpeg' または 'audio/aac' のみ
- size: 10MB以上、5GB以下
- gcsPath: GCS内パス形式 `/podcast/{podcastId}/episodes/{episodeId}/audio.*`

**バックアップ戦略**:

- GCS の 30 日間バージョン履歴を有効化
- Cloudflare R2 には RSS フィード生成時に参照URL を保存

---

### 5. Artwork （アートワーク）

番組のカバーアート画像

**フィールド**:
| フィールド | 型 | 説明 | 制約 |
|-----------|---|----|-----|
| id | String (UUID) | 一意識別子 | PK |
| podcastId | String | 親番組ID | FK -> Podcast.id, NOT NULL, UNIQUE |
| fileName | String | ファイル名 | NOT NULL |
| width | Int | 画像幅（ピクセル） | NOT NULL |
| height | Int | 画像高さ（ピクセル） | NOT NULL |
| mimeType | String | MIME タイプ | DEFAULT 'image/jpeg', NOT NULL |
| size | Int | ファイルサイズ（バイト） | NOT NULL |
| gcsPath | String | GCS保存パス | NOT NULL |
| publicUrl | String | 公開URL | NOT NULL |
| validationStatus | ValidationStatus | 規格検証状態 | DEFAULT PENDING |
| validationWarnings | String[] | 警告メッセージ | DEFAULT [] |
| uploadedAt | DateTime | アップロード日時 | DEFAULT now() |
| createdAt | DateTime | 作成日時 | DEFAULT now() |

**Enum**: ValidationStatus

- PENDING: 検証待ち
- PASSED: 推奨規格クリア
- PASSED_WITH_WARNING: 規格外だが許可
- FAILED: 使用不可

**リレーション**:

- `podcast`: 親番組（多対1）

**バリデーション**:

- mimeType: 'image/jpeg', 'image/png', 'image/webp' のみ
- 画像サイズ: 3000x3000px 以上推奨
  - 警告: 1000~2999px
  - エラー: 999px 以下
- ファイルサイズ: 10MB以下

---

### 6. TeamMember （チームメンバー）

番組への共同編集アクセス権を持つユーザー

**フィールド**:
| フィールド | 型 | 説明 | 制約 |
|-----------|---|----|-----|
| id | String (UUID) | 一意識別子 | PK |
| userId | String | ユーザーID | FK -> User.id, NOT NULL, INDEX |
| podcastId | String | 番組ID | FK -> Podcast.id, NOT NULL, INDEX |
| role | Role | ロール（ADMIN/EDITOR） | NOT NULL |
| invitedAt | DateTime | 招待日時 | DEFAULT now() |
| acceptedAt | DateTime | 承認日時 | OPTIONAL |
| createdAt | DateTime | 作成日時 | DEFAULT now() |

**Enum**: Role

- ADMIN: 番組の設定、メンバー管理、削除が可能
- EDITOR: エピソード、メタデータの編集のみ可能

**リレーション**:

- `user`: ユーザー（多対1）
- `podcast`: 番組（多対1）

**制約**:

- UNIQUE(userId, podcastId): 同じメンバーが複数回追加されない
- 1つの番組に最低1人の ADMIN が必須

---

## Prisma スキーマ

```prisma
// backend/prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ===== User（ユーザー）=====
model User {
  id    String  @id @default(cuid())
  email String  @unique
  password String
  name  String

  // リレーション
  ownedPodcasts Podcast[] @relation("PodcastOwner")
  teamMemberships TeamMember[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
}

// ===== Podcast（番組）=====
model Podcast {
  id          String  @id @default(cuid())
  title       String
  description String  @db.Text
  author      String?
  category    String[] @default([])
  language    String  @default("en")
  explicit    Boolean @default(false)
  ownerId     String
  owner       User    @relation("PodcastOwner", fields: [ownerId], references: [id], onDelete: Cascade)

  // RSS フィード
  feedUrl     String  @unique
  rssUpdatedAt DateTime?

  // リレーション
  episodes    Episode[]
  artwork     Artwork?
  teamMembers TeamMember[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([ownerId])
  @@index([language])
  @@index([createdAt])
}

// ===== Episode（エピソード）=====
model Episode {
  id            String  @id @default(cuid())
  podcastId     String
  podcast       Podcast @relation(fields: [podcastId], references: [id], onDelete: Cascade)

  title         String
  description   String  @db.Text
  episodeNumber Int?
  seasonNumber  Int     @default(1)
  publishedAt   DateTime
  explicit      Boolean @default(false)
  duration      Int?

  // リレーション
  audioFile     AudioFile?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([podcastId])
  @@index([publishedAt])
  @@index([podcastId, seasonNumber, episodeNumber])
}

// ===== AudioFile（音声ファイル）=====
model AudioFile {
  id        String  @id @default(cuid())
  episodeId String  @unique
  episode   Episode @relation(fields: [episodeId], references: [id], onDelete: Cascade)

  fileName  String
  mimeType  String  @default("audio/mpeg")
  size      BigInt
  gcsPath   String
  publicUrl String  @unique
  duration  Int?

  uploadedAt DateTime @default(now())
  createdAt  DateTime @default(now())
}

// ===== Artwork（アートワーク）=====
model Artwork {
  id        String  @id @default(cuid())
  podcastId String  @unique
  podcast   Podcast @relation(fields: [podcastId], references: [id], onDelete: Cascade)

  fileName String
  width    Int
  height   Int
  mimeType String  @default("image/jpeg")
  size     Int
  gcsPath  String
  publicUrl String

  validationStatus ValidationStatus @default(PENDING)
  validationWarnings String[]       @default([])

  uploadedAt DateTime @default(now())
  createdAt  DateTime @default(now())
}

enum ValidationStatus {
  PENDING
  PASSED
  PASSED_WITH_WARNING
  FAILED
}

// ===== TeamMember（チームメンバー）=====
model TeamMember {
  id        String  @id @default(cuid())
  userId    String
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  podcastId String
  podcast   Podcast @relation(fields: [podcastId], references: [id], onDelete: Cascade)

  role      Role
  invitedAt DateTime @default(now())
  acceptedAt DateTime?

  createdAt DateTime @default(now())

  @@unique([userId, podcastId])
  @@index([userId])
  @@index([podcastId])
}

enum Role {
  ADMIN
  EDITOR
}
```

---

## ER図（論理設計）

```
┌─────────────┐
│   User      │
├─────────────┤
│ id (PK)     │
│ email       │◄─────┐
│ password    │      │
│ name        │      │
│ createdAt   │      │
│ updatedAt   │      │
└─────────────┘      │ (1)
     ▲               │
     │               │
(1)  │ owns          │
     │               │ (many)
     │               │
┌────┴────────┐      │
│  Podcast    │──────┤
├─────────────┤      │
│ id (PK)     │      │ ownerId (FK)
│ title       │      │
│ description │      │
│ ownerId(FK) ├──────┘
│ feedUrl     │
│ createdAt   │
│ updatedAt   │
└─────────────┘
     │ (1)
     │
     │ episodes (many)
     │
     ▼
┌─────────────┐
│  Episode    │
├─────────────┤
│ id (PK)     │
│ podcastId   │ (FK)
│ title       │
│ description │
│ publishedAt │
│ createdAt   │
└─────────────┘
     │ (1)
     │
     │ audioFile (1)
     │
     ▼
┌─────────────┐
│ AudioFile   │
├─────────────┤
│ id (PK)     │
│ episodeId   │ (FK unique)
│ fileName    │
│ publicUrl   │
│ gcsPath     │
│ uploadedAt  │
└─────────────┘

Podcast (1) ├─ artwork (1) ─────────┐
            │                        ▼
            │                   ┌─────────────┐
            │                   │  Artwork    │
            │                   ├─────────────┤
            │                   │ id (PK)     │
            │                   │ podcastId   │ (FK unique)
            │                   │ width, height
            │                   │ publicUrl   │
            │                   │ gcsPath     │
            │                   └─────────────┘
            │
            │ teamMembers (many)
            │
            ▼
        ┌─────────────┐
        │ TeamMember  │
        ├─────────────┤
        │ id (PK)     │
        │ userId (FK) ├──────┐
        │ podcastId   │      │
        │ role        │      │
        │ unique(     │      │ (many)
        │   userId,   │      │
        │   podcastId)│      │
        └─────────────┘      │
                             │ (many)
                             │
                        ┌────┴─────┐
                        │   User    │
                        │ (see above)
                        └───────────┘
```

---

## マイグレーション戦略

### Initial Migration (Phase 1)

```bash
npx prisma migrate dev --name init
```

生成されるマイグレーション:

1. User テーブル作成
2. Podcast テーブル作成
3. Episode テーブル作成
4. AudioFile テーブル作成
5. Artwork テーブル作成
6. TeamMember テーブル作成
7. 外部キー制約 + インデックス作成

---

## 権限ロジック

### API エンドポイント別アクセス制御

| エンドポイント                   | ADMIN | EDITOR | 非メンバー |
| -------------------------------- | ----- | ------ | ---------- |
| GET /shows                       | ✅    | ✅     | ❌         |
| POST /shows                      | ✅    | ❌     | ❌         |
| PATCH /shows/{id}                | ✅    | ❌     | ❌         |
| DELETE /shows/{id}               | ✅    | ❌     | ❌         |
| POST /shows/{id}/episodes        | ✅    | ✅     | ❌         |
| PATCH /episodes/{id}             | ✅    | ✅     | ❌         |
| DELETE /episodes/{id}            | ✅    | ❌     | ❌         |
| POST /shows/{id}/team            | ✅    | ❌     | ❌         |
| DELETE /shows/{id}/team/{userId} | ✅    | ❌     | ❌         |

### 権限チェック実装

```typescript
// backend/src/middleware/auth.ts
import { Role } from "@prisma/client";

export async function checkPodcastAccess(
  userId: string,
  podcastId: string,
  requiredRole: Role = "EDITOR",
): Promise<boolean> {
  const membership = await prisma.teamMember.findUnique({
    where: { userId_podcastId: { userId, podcastId } },
  });

  if (!membership) {
    // 所有者チェック
    const podcast = await prisma.podcast.findUnique({
      where: { id: podcastId },
    });
    return podcast?.ownerId === userId;
  }

  // ロール判定
  if (requiredRole === "ADMIN") {
    return membership.role === "ADMIN";
  }
  return true;
}
```

---

## 次のステップ

1. **Prisma マイグレーション生成**: `npx prisma migrate dev --name init`
2. **LocalDB テスト**: docker-compose で PostgreSQL 起動してマイグレーション確認
3. **シードデータ生成**: prisma/seed.ts でテストデータを作成
4. **API コントラクト** (`contracts/`) の詳細設計に進む
