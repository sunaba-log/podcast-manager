# 研究文書：ポッドキャスト特化型CMS技術調査

**フェーズ**: Phase 0  
**日付**: 2026年1月27日  
**ステータス**: 進行中

## 研究タスク一覧

### 1. Google Cloud Storage との署名付きURL統合パターン

**課題**: GCS に直接アップロードするための署名付きURL生成メカニズム

**決定**: GCS クライアントライブラリの `generateSignedUrl()` メソッドを使用

```typescript
// backend/src/lib/gcs.ts
import { Storage } from "@google-cloud/storage";

const storage = new Storage({ projectId: process.env.GCP_PROJECT_ID });
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

export async function generateSignedUrl(
  fileName: string,
  duration = 15 * 60 * 1000,
) {
  const file = bucket.file(fileName);
  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + duration,
  });
  return url;
}
```

**理由**:

- セキュア：バックエンド認証情報を公開しない
- スケーラブル：フロントエンドから直接GCSへのアップロードが可能
- GCP公式推奨パターン

**代替案検討**:

- バックエンドでの中継アップロード → ネットワーク負荷が大きい、スケーラビリティが低い ❌
- CloudFront署名付きURL → Cloudflare R2配信用として検討 ✅

---

### 2. Cloudflare R2 API と RSS フィード配信戦略

**課題**: RSS フィードをCloudflare R2で配信し、高速・低レイテンシを実現

**決定**: 生成した RSS を R2 に保存し、CDN経由で配信

```typescript
// backend/src/lib/r2.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const r2Client = new S3Client({
  region: "auto",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  endpoint: process.env.R2_ENDPOINT!,
});

export async function uploadFeedToR2(showId: string, feedXml: string) {
  const key = `feeds/${showId}/rss.xml`;
  await r2Client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: feedXml,
      ContentType: "application/rss+xml",
      CacheControl: "public, max-age=3600", // 1時間キャッシュ
    }),
  );
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}
```

**理由**:

- Cloudflare R2は S3互換 API → AWS SDK そのまま使用可能
- CDN統合で低レイテンシ
- コスト効率的（エグレス料金がない）

**代替案検討**:

- API Routes で動的生成 → 毎回生成で負荷が高い ❌
- CloudFront + S3 → Cloudflare R2で十分 ✅

---

### 3. Prisma による複雑な関連付けと権限管理

**課題**: ユーザー、番組、チームメンバー、権限のモデリング

**決定**: Prisma 関連付けとロール型定義を活用

```prisma
// backend/prisma/schema.prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt hash
  name      String

  // ユーザーが所有する番組
  ownedPodcasts Podcast[] @relation("PodcastOwner")

  // ユーザーがメンバーとして参加する番組
  teamMemberships TeamMember[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Podcast {
  id          String   @id @default(cuid())
  title       String
  description String
  ownerId     String
  owner       User     @relation("PodcastOwner", fields: [ownerId], references: [id], onDelete: Cascade)

  episodes    Episode[]
  artwork     Artwork?
  teamMembers TeamMember[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model TeamMember {
  id        String   @id @default(cuid())
  userId    String
  podcastId String
  role      Role     // ADMIN, EDITOR

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  podcast   Podcast  @relation(fields: [podcastId], references: [id], onDelete: Cascade)

  @@unique([userId, podcastId])
  createdAt DateTime @default(now())
}

enum Role {
  ADMIN
  EDITOR
}
```

**理由**:

- Prisma の型安全性で権限ロジック実装が容易
- onDelete: Cascade で参照整合性を自動管理
- リレーション名 (@relation) で複数方向の参照が明確

**代替案検討**:

- MongoDB での権限管理 → RDBMSの参照整合性が必要 ❌
- 手動SQL → Prisma型安全性を失う ❌

---

### 4. Next.js App Router での認証フローベストプラクティス

**課題**: JWT ベースの認証とセッション管理

**決定**: NextAuth.js v5（App Router対応）を使用

```typescript
// frontend/src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        const res = await fetch("http://backend/api/auth/login", {
          method: "POST",
          body: JSON.stringify(credentials),
          headers: { "Content-Type": "application/json" },
        });
        return res.ok ? res.json() : null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      return { ...token, ...user };
    },
    async session({ session, token }) {
      session.user = token;
      return session;
    },
  },
};

export const handler = NextAuth(authOptions);
```

**理由**:

- NextAuth.js は Next.js公式推奨
- App Router完全対応
- JWT + セッション混合戦略で柔軟性が高い

**代替案検討**:

- Supabase Auth → オーバーヘッドが大きい ❌
- 手動JWT実装 → セキュリティリスク高い ❌

---

### 5. Shadcn UI カスタマイズとアクセシビリティ実装

**課題**: Shadcn UI で WCAG 2.1 AA コンプライアンスを実現

**決定**: Shadcn UI デフォルト + Radix UI 属性活用

```tsx
// frontend/src/components/podcast/ShowForm.tsx
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ShowForm() {
  return (
    <form aria-label="新規番組作成フォーム">
      <FormField
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel htmlFor="show-title">番組タイトル</FormLabel>
            <FormControl>
              <Input
                id="show-title"
                placeholder="例: My Awesome Podcast"
                aria-required="true"
                aria-describedby="show-title-hint"
                {...field}
              />
            </FormControl>
            <FormMessage id="show-title-hint" />
          </FormItem>
        )}
      />
      <Button type="submit">保存</Button>
    </form>
  );
}
```

**理由**:

- Shadcn UI は Radix UI ベース → アクセシビリティが組み込まれている
- aria-\* 属性で追加のサポート情報を提供
- Lighthouse Accessibility スコア向上

**代替案検討**:

- Material-UI → アクセシビリティ実装の手間が多い ❌
- 自作コンポーネント → スケーラビリティが低い ❌

---

### 6. Jest + Playwright でのテスト戦略（API + E2E）

**課題**: 80%+ カバレッジと E2E テストの両立

**決定**: レイヤー別テスト戦略

```typescript
// backend/tests/unit/services/podcast.service.test.ts
import { PodcastService } from "@/services/podcast.service";
import { PrismaClient } from "@prisma/client";

const mockPrisma = {
  podcast: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
};

describe("PodcastService", () => {
  let service: PodcastService;

  beforeEach(() => {
    service = new PodcastService(mockPrisma as any);
  });

  test("createPodcast should save metadata correctly", async () => {
    const input = {
      title: "Test Show",
      description: "Test Description",
      ownerId: "user-123",
    };

    mockPrisma.podcast.create.mockResolvedValue({
      id: "podcast-123",
      ...input,
    });

    const result = await service.createPodcast(input);

    expect(result.id).toBe("podcast-123");
    expect(mockPrisma.podcast.create).toHaveBeenCalledWith({
      data: input,
    });
  });
});
```

```typescript
// frontend/tests/e2e/shows.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Podcast Shows Management", () => {
  test("should create new show with metadata", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard/shows");

    // フォーム入力
    await page.fill('input[name="title"]', "My New Show");
    await page.fill('textarea[name="description"]', "A great show");
    await page.click('button[type="submit"]');

    // 成功を確認
    await expect(page.locator("text=Show created successfully")).toBeVisible();
    await expect(page.locator("text=My New Show")).toBeVisible();
  });
});
```

**理由**:

- ユニットテスト → ビジネスロジック検証が高速
- 統合テスト → API エンドポイント検証
- E2E テスト → ユーザーシナリオ検証
- 3層構成で 80%+ カバレッジ実現可能

**代替案検討**:

- E2Eテストのみ → 実行時間が長い ❌
- ユニットテストのみ → 統合時の問題発見遅延 ❌

---

### 7. RSS フィード生成の検証ルール（Podcast Namespace）

**課題**: Apple Podcasts、Spotify対応のRSS フィード生成

**決定**: Podcast Namespace + 検証ライブラリ活用

```typescript
// backend/src/services/feed.service.ts
import RSS from "rss";
import { z } from "zod";

const PodcastNamespaceSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  itunesAuthor: z.string().optional(),
  itunesOwner: z
    .object({
      itunesOwnerName: z.string(),
      itunesOwnerEmail: z.string().email(),
    })
    .optional(),
  itunesImage: z.string().url().optional(),
  category: z.array(
    z.object({
      text: z.enum(["Technology", "Business", "News", "Education", "Arts"]),
    }),
  ),
});

export async function generatePodcastFeed(podcast: any) {
  // バリデーション
  const validated = PodcastNamespaceSchema.parse({
    title: podcast.title,
    description: podcast.description,
    itunesAuthor: podcast.author,
    itunesImage: podcast.artwork?.url,
    category: podcast.categories,
  });

  // RSS 生成
  const feed = new RSS({
    title: validated.title,
    description: validated.description,
    site_url: process.env.FEED_URL,
    feed_url: `${process.env.FEED_URL}/shows/${podcast.id}/rss.xml`,
    author: validated.itunesAuthor,
    custom_namespaces: {
      itunes: "http://www.itunes.com/dtds/podcast-1.0.dtd",
    },
  });

  for (const episode of podcast.episodes) {
    feed.item({
      title: episode.title,
      description: episode.description,
      url: `${process.env.FEED_URL}/episodes/${episode.id}`,
      guid: episode.id,
      author: validated.itunesAuthor,
      date: episode.publishedAt,
      enclosure: {
        url: episode.audioFile.url,
        size: episode.audioFile.size,
        type: "audio/mpeg",
      },
      custom_elements: [
        { "itunes:duration": episode.duration },
        { "itunes:explicit": episode.explicit ? "yes" : "no" },
      ],
    });
  }

  return feed.xml();
}
```

**理由**:

- Podcast Namespace 公式推奨形式
- Zod バリデーションで データ品質を確保
- rss npm パッケージで Podcast Namespace タグが簡単に生成可能

**代替案検討**:

- 手動 XML 生成 → エラーリスク高い ❌
- xml2js → 低レベルで作業量が多い ❌

---

## 結論と次のステップ

**すべての NEEDS CLARIFICATION が解決されました。✅**

- ✅ GCS 署名付きURL生成パターン確定
- ✅ Cloudflare R2 フィード配信戦略確定
- ✅ Prisma データモデル設計確定
- ✅ Next.js 認証フロー確定
- ✅ Shadcn UI アクセシビリティ実装確定
- ✅ Jest + Playwright テスト戦略確定
- ✅ RSS Podcast Namespace 生成ルール確定

**Phase 1 への移行**: データモデルと API コントラクト設計を開始可能
