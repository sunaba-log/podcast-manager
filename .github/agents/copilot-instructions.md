# podcast-manager Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-01-27

## Active Technologies & Stack

**Feature**: 001-podcast-cms-core (Podcast CMS Core)

### Frontend

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript 5.x
- **UI Library**: Shadcn UI + TailwindCSS
- **Auth**: NextAuth.js v5
- **Testing**: Jest + Playwright
- **Validation**: Zod

### Backend

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **API**: REST (Next.js API Routes)
- **Deployment**: Google Cloud Run
- **ORM**: Prisma
- **Database**: PostgreSQL 14+
- **Storage**: Google Cloud Storage (GCS) + Cloudflare R2
- **RSS Generation**: rss npm package + xml2js
- **Testing**: Jest + Supertest

### Key Services

- **Auth Service**: JWT + NextAuth.js session management
- **Podcast Service**: CRUD + RSS feed management
- **Episode Service**: Episode lifecycle management
- **Storage Service**: GCS signed URLs + Cloudflare R2 uploads
- **Feed Service**: RSS XML generation with Podcast Namespace

## Project Structure

```text
.
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js App Router
│   │   │   ├── (auth)/          # Auth pages
│   │   │   └── (dashboard)/     # Dashboard pages
│   │   ├── components/          # Shadcn UI + custom components
│   │   ├── lib/                 # API client, validation, utils
│   │   └── types/               # TypeScript types
│   └── tests/                   # Jest + Playwright tests
│
├── backend/
│   ├── src/
│   │   ├── api/                 # API routes
│   │   ├── services/            # Business logic
│   │   ├── lib/                 # GCS, R2, Prisma clients
│   │   └── types/               # TypeScript types
│   ├── prisma/
│   │   ├── schema.prisma        # Data model
│   │   └── migrations/          # DB migrations
│   └── tests/                   # Jest + Supertest tests
│
├── specs/001-podcast-cms-core/  # Specification docs
│   ├── spec.md                  # Feature specification
│   ├── plan.md                  # Implementation plan
│   ├── research.md              # Phase 0 research
│   ├── data-model.md            # Phase 1 data model
│   ├── quickstart.md            # Setup & development guide
│   └── contracts/               # API contracts (OpenAPI)
│
└── .specify/                    # Speckit configuration
```

## Core Features (Priority: P1)

1. **番組管理 (Podcast Management)**
   - CRUD operations with metadata validation
   - Artwork upload with size validation (3000x3000px recommended)
   - Feed URL generation

2. **エピソード管理 (Episode Management)**
   - Episode creation with publish scheduling
   - Audio file association
   - Season/episode number tracking

3. **音声ファイル管理 (Audio File Management)**
   - Signed URL generation for direct GCS upload
   - MIME type validation (audio/mpeg, audio/aac)
   - File size tracking (10MB-5GB range)

4. **RSS フィード生成 (RSS Feed Generation)**
   - Podcast Namespace compliance (iTunes tags)
   - Real-time generation from metadata
   - Cloudflare R2 CDN distribution
   - Fixed per-show RSS URLs

5. **チーム管理 (Team Management)**
   - Role-based access control (ADMIN, EDITOR)
   - Member invitation system
   - Permission enforcement

## Development Commands

```bash
# Frontend
cd frontend
npm install
npm run dev              # Start dev server (http://localhost:3000)
npm run test            # Run Jest tests
npm run test:e2e        # Run Playwright E2E tests
npm run type-check      # TypeScript type checking
npm run lint            # ESLint check
npm run lint --fix      # Auto-fix lint issues

# Backend
cd backend
npm install
npm run dev             # Start dev server (http://localhost:3001)
npx prisma generate    # Generate Prisma client
npx prisma migrate dev # Create/apply migrations
npx prisma db seed     # Load test data
npm run test           # Run Jest tests
npm run type-check     # TypeScript type checking

# Docker
docker-compose up -d postgres   # Start PostgreSQL
docker-compose down -v          # Stop and clean
```

## Code Style & Standards

### TypeScript

- **Strict Mode**: Enabled
- **No Implicit Any**: Required
- **File Extensions**: `.ts` for backend, `.tsx` for frontend components

### Naming Conventions

- Components: PascalCase (`ShowForm.tsx`)
- Functions: camelCase (`createPodcast()`)
- Constants: UPPER_SNAKE_CASE (`CACHE_DURATION`)
- Files: kebab-case or PascalCase for components

### Testing Standards

- **Minimum Coverage**: 80% (Jest + Playwright)
- **Test Pattern**: `should_{action}_{when}_{then}`
- **Fixtures**: Use factories in `tests/fixtures/`
- **Mocking**: MSW for API, jest.mock() for services

### Formatting

- **Prettier**: Auto-format on save
- **ESLint**: Strict config, pre-commit hooks
- **Line Length**: 100 characters (configurable)

## Performance Targets

- **API Response**: < 500ms (p95)
- **RSS Generation**: < 2s for 100+ episodes
- **UI Interactions**: < 100ms
- **Feed Update**: < 30s from metadata change
- **Bundle Size**: < 250KB gzipped (JS) + < 50KB (CSS)

## Database Schema

Key tables: User, Podcast, Episode, AudioFile, Artwork, TeamMember

Relations:

- User owns multiple Podcasts
- Podcast has many Episodes and TeamMembers
- Episode has one AudioFile
- Podcast has one Artwork
- TeamMember bridges User-Podcast with role-based access

Indexes on: (ownerId), (language), (publishedAt), (podcastId, seasonNumber, episodeNumber)

## API Endpoints (v1)

### Authentication

- POST `/auth/register` - User registration
- POST `/auth/login` - Login

### Podcasts

- GET `/shows` - List user's podcasts
- POST `/shows` - Create podcast
- GET `/shows/{id}` - Get podcast details
- PATCH `/shows/{id}` - Update podcast
- DELETE `/shows/{id}` - Delete podcast

### Episodes

- GET `/shows/{podcastId}/episodes` - List episodes
- POST `/shows/{podcastId}/episodes` - Create episode
- PATCH `/episodes/{id}` - Update episode
- DELETE `/episodes/{id}` - Delete episode

### Uploads

- POST `/shows/{podcastId}/artwork/upload-url` - Get artwork upload URL
- POST `/episodes/{episodeId}/audio/upload-url` - Get audio upload URL
- POST `/episodes/{episodeId}/audio/confirm-upload` - Confirm upload

### RSS Feeds

- GET `/feeds/{podcastId}/rss.xml` - Get RSS feed (public)
- GET `/shows/{podcastId}/feed-settings` - Get feed settings

### Team

- GET `/shows/{podcastId}/team` - List team members
- POST `/shows/{podcastId}/team` - Invite team member
- DELETE `/shows/{podcastId}/team/{memberId}` - Remove member

## Documentation

- **Specification**: `/specs/001-podcast-cms-core/spec.md`
- **Implementation Plan**: `/specs/001-podcast-cms-core/plan.md`
- **API Contract**: `/specs/001-podcast-cms-core/contracts/api.openapi.yaml`
- **Quick Start**: `/specs/001-podcast-cms-core/quickstart.md`
- **Data Model**: `/specs/001-podcast-cms-core/data-model.md`

## Recent Changes

- 001-podcast-cms-core: Phase 1 complete
  - ✅ plan.md created
  - ✅ research.md completed
  - ✅ data-model.md with Prisma schema
  - ✅ api.openapi.yaml OpenAPI spec
  - ✅ quickstart.md with setup instructions
  - ✅ Copilot context updated

<!-- MANUAL ADDITIONS START -->

## Additional Resources

### Local Development Setup

- See `quickstart.md` for PostgreSQL + Docker setup
- Test data: Run `npx prisma db seed` after migration
- Test accounts: creator@example.com, editor@example.com (password: TestPassword123!)

### Testing Strategy

- Unit tests for services/utils
- Integration tests for API endpoints
- E2E tests for critical user flows (Playwright)
- API contract tests using OpenAPI spec

### Cloud Setup (Production)

- GCP: Enable GCS API, create service account, generate credentials
- Cloudflare: Create R2 bucket, generate API token
- PostgreSQL: Use Cloud SQL or managed PostgreSQL service
- Deployment: Google Cloud Run for backend, Vercel for frontend

### Monitoring & Debugging

- Enable Prisma logs: `DEBUG="*" npm run dev`
- GCS logging: Check Cloud Logging in GCP Console
- Request tracing: Use Server-Timing headers for performance analysis

<!-- MANUAL ADDITIONS END -->
