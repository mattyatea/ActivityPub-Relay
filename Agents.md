# Project Overview

This project is an ActivityPub relay server built with TypeScript running on Cloudflare Workers. It provides functionality to relay posts between ActivityPub-compatible servers like Mastodon.

## Tech Stack

### Backend (packages/relay)
- **Runtime**: Cloudflare Workers
- **Framework**: Hono v4.9.9
- **Language**: TypeScript 5.9.3
- **Database**: Cloudflare D1 (SQLite)
- **ORM**: Prisma v6.16.3
- **API**: ORPC (Type-safe RPC)

### Frontend (packages/frontend)
- **Framework**: Vue 3.5.22
- **Build Tool**: Vite 7.1.11
- **Language**: TypeScript 5.9.3
- **API Communication**: ORPC Client (Type-safe API client)

### Shared (packages/contract)
- **Type Definitions**: ORPC Contract + Zod
- Shares type definitions between backend and frontend to achieve end-to-end type safety

### Development Tools
- **Code Quality**: Biome 2.2.5 (linter + formatter)
- **Package Management**: pnpm v9+ (workspaces enabled)
- **Concurrent Execution**: concurrently

## Architecture Features

### 1. Monorepo Structure
Organized into three packages using pnpm workspaces:
- `@activitypub-relay/contract`: Type definitions & contracts
- `@activitypub-relay/relay`: Backend logic
- `@activitypub-relay/frontend`: Admin dashboard

### 2. Contract First Development
This project adopts **Contract First (Contract-Driven) Development**:

#### Development Flow
1. **Contract Definition** (`packages/contract/src/index.ts`):
   - Define input/output types using Zod schemas
   - Describe endpoint contracts with ORPC's `oc.route()`
   - This contract becomes the Single Source of Truth for both backend and frontend

2. **Backend Implementation** (`packages/relay/src/api/router.ts`):
   - Implement handlers according to the contract
   - Type mismatches result in compile-time errors

3. **Frontend Implementation** (`packages/frontend/src/`):
   - Use auto-generated clients from the contract
   - API response types are automatically inferred
   - Type safety is guaranteed for both requests and responses

#### Steps for New Feature Development
1. First, add the contract to `packages/contract/src/index.ts`
2. Add implementation to the backend router
3. Call the API from the frontend leveraging type completion

This approach prevents API specification and code drift, improving development efficiency and code quality.

### 3. End-to-End Type Safety
- Complete type safety for API communication between frontend and backend using ORPC
- Runtime validation with Zod schemas
- ORPC automatically generates OpenAPI schemas
- Type completion and checking on the client side

### 4. Edge Computing
- Distributed globally on Cloudflare Workers
- Low-latency responses
- Persistence with D1 database

## Core Features

### ActivityPub Implementation (packages/relay/src/activityPub/)
- **Follow Processing** (`follow.ts`): Accept and approve follow requests
- **Relay Processing** (`relay.ts`): Relay Create/Announce activities
- **Undo Processing** (`undo.ts`): Handle unfollows

### Security
- **HTTP Signature Verification** (`utils/httpSignature.ts`): Verify request authenticity
- RSA-SHA256 signature generation and verification
- API Key authentication (for admin API access)

### Domain Management
- **Domain Rules** (`service/DomainRuleService.ts`):
  - Whitelist mode: Only accept domains on the allow list
  - Blacklist mode: Exclude domains on the deny list
  - Regular expression pattern support
- **Domain Blocking** (`utils/domainBlock.ts`): Domain-based access control

### Admin Features (via API)
- Follow request management (approve/reject)
- Domain rule management (add/remove)
- Actor list display
- Settings management (block mode switching, etc.)

### Protocol Support
- **WebFinger** (`/.well-known/webfinger`): Actor discovery
- **NodeInfo** (`/nodeinfo/2.1.json`): Server information publication
- **Host-Meta** (`/.well-known/host-meta`): Metadata provision

## Directory Structure

```
packages/relay/src/
├── server.ts                # Entry point (Hono app definition)
├── activityPub/             # ActivityPub processing
│   ├── follow.ts           # Follow activities
│   ├── relay.ts            # Create/Announce relay
│   └── undo.ts             # Undo activities
├── api/                     # Admin API
│   └── router.ts           # ORPC router
├── service/                 # Business logic
│   └── DomainRuleService.ts
├── utils/                   # Utilities
│   ├── activityPub.ts      # Actor fetching, etc.
│   ├── httpSignature.ts    # Signature verification
│   └── domainBlock.ts      # Domain control
├── types/                   # Type definitions
│   ├── activityPubTypes.ts
│   └── api.ts
└── lib/                     # Libraries
    └── prisma.ts           # Prisma client
```

## Development Workflow

### Local Development
```bash
pnpm dev  # Start backend (localhost:3000) + frontend (localhost:5173)
```

### Deployment
```bash
pnpm deploy  # Build frontend → Deploy backend
```

### Database Operations
```bash
pnpm db:generate      # Generate Prisma schema
pnpm db:migrate       # Local migration
pnpm db:migrate:prod  # Production migration
```

## Design Features

### 1. Environment Variable Management
- **Local**: `.dev.vars` (excluded from Git)
- **Production**: Register secrets with `wrangler secret put`
- Security-critical information (private keys, API keys) should NOT be in `wrangler.toml`

### 2. Static Asset Serving
- Serve frontend via `ASSETS` binding
- SPA support (directory access → index.html)

### 3. API Authentication
- Authentication via `X-API-Key` header
- Verified by middleware for `/api/*` paths

## Not Yet Implemented (TODO)

- [ ] Queue functionality (load distribution for bulk delivery)
- [ ] Rate limiting (DoS protection)

## References

- **ActivityPub Specification**: https://www.w3.org/TR/activitypub/
- **Hono**: https://hono.dev/
- **ORPC**: https://orpc.unnoq.com/
- **Cloudflare Workers**: https://developers.cloudflare.com/workers/
- **Prisma**: https://www.prisma.io/