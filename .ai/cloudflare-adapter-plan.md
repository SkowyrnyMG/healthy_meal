# Cloudflare Workers Adapter Migration Plan

## Executive Summary

This document outlines the migration strategy from the current **Node.js adapter** (configured for DigitalOcean/Docker deployment) to the **Cloudflare Workers adapter** for the HealthyMeal Astro application.

**⚠️ CRITICAL CONSIDERATIONS**: Cloudflare Workers operate in a different runtime environment than Node.js. This migration requires careful consideration of runtime limitations, session management, and database connectivity.

---

## Current Architecture

### Stack
- **Framework**: Astro 5.13.7 with Server-Side Rendering (`output: "server"`)
- **Adapter**: `@astrojs/node` v9.4.3 (standalone mode)
- **Frontend**: React 19, Tailwind 4, Shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + SDK)
- **AI Integration**: OpenRouter.ai
- **Deployment Target**: DigitalOcean via Docker

### Key Dependencies
- Supabase SSR client (`@supabase/ssr` v0.7.0)
- Session management using filesystem storage (Node.js adapter)
- Cookie-based authentication
- Environment variables: `SUPABASE_URL`, `SUPABASE_KEY`, `OPENROUTER_API_KEY`

### Current Session Management
- **Method**: Filesystem storage (as shown in build logs)
- **Location**: Server-side sessions via Node.js adapter
- **Authentication**: Supabase SSR client with cookie-based tokens

---

## Migration Strategy

### Phase 1: Pre-Migration Assessment

#### 1.1 Runtime Compatibility Audit

**Action Items:**
- [ ] Verify Supabase client compatibility with Cloudflare Workers runtime
- [ ] Check all npm packages for Node.js-specific dependencies
- [ ] Review middleware for Workers compatibility
- [ ] Test OpenRouter.ai integration in Workers environment

**Potential Issues:**
- Node.js built-in modules (fs, path, crypto, etc.) are not available
- Some npm packages may use Node.js APIs
- Different JavaScript runtime (V8 isolates vs Node.js)

#### 1.2 Session Storage Strategy

**Current Problem:**
```
[@astrojs/node] Enabling sessions with filesystem storage
```

**Cloudflare Solutions (choose one):**

**Option A: Cloudflare KV (Recommended for simple sessions)**
- Key-value storage for session data
- Low latency, globally distributed
- Eventual consistency (60 seconds)
- Cost: Included in Workers plan, then $0.50/GB/month

**Option B: Cloudflare Durable Objects**
- Strongly consistent storage
- Real-time coordination
- More complex but more powerful
- Cost: $0.15/million requests + $12.50/GB/month

**Option C: External Session Store**
- Use Supabase database for session storage
- Leverage existing infrastructure
- Requires additional queries per request

**Recommendation**: Since authentication is handled by Supabase SSR (cookie-based tokens), sessions might not be needed. **Verify if the Node.js adapter's session storage is actually being used.**

#### 1.3 Environment Variables Mapping

**Current (.env):**
```env
SUPABASE_URL=###
SUPABASE_KEY=###
OPENROUTER_API_KEY=###
```

**Migration Required:**
- Move to Cloudflare Workers secrets via `wrangler secret put`
- Or configure in `wrangler.toml` for non-sensitive values
- Update references from `import.meta.env.*` (should still work)

---

### Phase 2: Adapter Migration

#### 2.1 Install Cloudflare Adapter

```bash
npm install @astrojs/cloudflare
npm uninstall @astrojs/node
```

#### 2.2 Update Astro Configuration

**File**: `astro.config.mjs`

**Before:**
```javascript
import node from "@astrojs/node";

export default defineConfig({
  output: "server",
  adapter: node({
    mode: "standalone",
  }),
  // ...
});
```

**After:**
```javascript
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: "server",
  adapter: cloudflare({
    mode: "directory", // or "advanced" for Workers API
    routes: {
      strategy: "auto", // automatic routing
    },
  }),
  // ...
});
```

**Adapter Mode Options:**
- **`directory`**: Standard deployment (recommended for SSR apps)
- **`advanced`**: Direct Workers API access (for complex use cases)

#### 2.3 Create Wrangler Configuration

**File**: `wrangler.toml` (create in project root)

```toml
#:schema node_modules/wrangler/config-schema.json
name = "healthy-meal"
compatibility_date = "2025-12-09"
pages_build_output_dir = "./dist"

# Cloudflare account details (optional, can use CLI login)
# account_id = "your-account-id"

[site]
bucket = "./dist/client"

[build]
command = "npm run build"

[observability]
enabled = true

# Environment variables (non-sensitive only)
[vars]
# PUBLIC_SUPABASE_URL will be set via secrets
# PUBLIC_SUPABASE_ANON_KEY will be set via secrets

# Production environment
[env.production]
name = "healthy-meal-production"
# Add production-specific configuration

# Staging environment
[env.staging]
name = "healthy-meal-staging"
```

**Security Note**: Never put sensitive keys in `wrangler.toml`. Use secrets instead:
```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_KEY
wrangler secret put OPENROUTER_API_KEY
```

---

### Phase 3: Code Modifications

#### 3.1 Middleware Updates

**Current**: `src/middleware/index.ts`

**Required Changes:**
- ✅ **Good news**: Current implementation uses `@supabase/ssr` which is compatible with Workers
- ✅ Cookie handling via `AstroCookies` should work out of the box
- ⚠️ Verify `import.meta.env` variables are accessible

**Test Points:**
- Ensure `createSupabaseServerInstance()` works in Workers runtime
- Verify cookie parsing from headers works correctly
- Test authentication flow end-to-end

#### 3.2 API Routes Review

**Action Items:**
- [ ] Review all API routes in `src/pages/api/`
- [ ] Check for Node.js-specific code (fs, path, etc.)
- [ ] Verify Zod validation schemas (should be compatible)
- [ ] Test database queries via Supabase client

**Common Issues:**
- File system operations (not available)
- Process environment variables (use `Astro.env` instead)
- Streaming responses (limited in Workers)

#### 3.3 Runtime.Runtime Type Issues

**Potential Issue**: Some Astro/Vite types may reference Node.js

**Solution**: Use Cloudflare Workers types
```typescript
/// <reference types="@cloudflare/workers-types" />
```

Add to `tsconfig.json`:
```json
{
  "compilerOptions": {
    "types": ["@cloudflare/workers-types"]
  }
}
```

#### 3.4 Environment Variable Access

**Current Pattern** (should still work):
```typescript
import.meta.env.SUPABASE_URL
import.meta.env.SUPABASE_KEY
```

**Workers Alternative** (if needed):
```typescript
// Access via Astro.locals or context
const { env } = context;
const supabaseUrl = env.SUPABASE_URL;
```

---

### Phase 4: Testing Strategy

#### 4.1 Local Development

**Update package.json scripts:**
```json
{
  "scripts": {
    "dev": "astro dev",
    "dev:wrangler": "wrangler pages dev dist --compatibility-date=2025-12-09",
    "build": "astro build",
    "preview": "wrangler pages dev dist",
    "deploy": "npm run build && wrangler pages deploy dist",
    "deploy:production": "npm run build && wrangler pages deploy dist --env production"
  }
}
```

**Local Testing Steps:**
1. Run `npm run build` to build with Cloudflare adapter
2. Run `wrangler pages dev dist` to test locally
3. Verify all routes work correctly
4. Test authentication flow
5. Test API endpoints
6. Verify database queries

#### 4.2 Feature Testing Checklist

- [ ] **Authentication**
  - [ ] Login flow
  - [ ] Registration
  - [ ] Password reset
  - [ ] Session persistence across requests
  - [ ] Logout
  - [ ] Protected route access

- [ ] **API Endpoints**
  - [ ] `/api/tags`
  - [ ] `/api/allergens`
  - [ ] `/api/ingredient-substitutions`
  - [ ] `/api/recipes/*`
  - [ ] All authenticated endpoints

- [ ] **Database Operations**
  - [ ] Read operations
  - [ ] Write operations
  - [ ] Real-time subscriptions (if used)

- [ ] **AI Integration**
  - [ ] OpenRouter.ai calls
  - [ ] Recipe modifications
  - [ ] Response streaming (if used)

- [ ] **UI/UX**
  - [ ] Static page rendering
  - [ ] React component hydration
  - [ ] Form submissions
  - [ ] Client-side navigation

#### 4.3 Performance Testing

- [ ] Measure cold start times
- [ ] Test concurrent request handling
- [ ] Monitor memory usage
- [ ] Check response times
- [ ] Verify edge caching behavior

---

### Phase 5: Deployment Setup

#### 5.1 Cloudflare Pages vs Workers

**Cloudflare Pages (Recommended)**
- Better for full-stack Astro apps
- Integrated with Git (auto-deploy on push)
- Built-in preview deployments
- 500 builds/month free tier

**Cloudflare Workers**
- More control over routing
- Direct Workers API access
- Requires manual deployment

**Recommendation**: Use **Cloudflare Pages** with the Cloudflare adapter set to `mode: "directory"`.

#### 5.2 Cloudflare Pages Deployment

**Via Dashboard:**
1. Go to Cloudflare Dashboard → Pages
2. Connect to Git repository (GitHub)
3. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`
   - **Node version**: 22.14.0

**Environment Variables (in Pages dashboard):**
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `OPENROUTER_API_KEY`
- `NODE_VERSION` = `22.14.0`

**Via Wrangler CLI:**
```bash
# Build the project
npm run build

# Deploy to Pages
wrangler pages deploy dist

# Deploy to production
wrangler pages deploy dist --branch main
```

#### 5.3 Custom Domain Setup

1. Add domain in Cloudflare Pages settings
2. Update DNS records (automatic if using Cloudflare DNS)
3. SSL/TLS certificate (automatic)

#### 5.4 CI/CD Integration

**Option A: Cloudflare Pages Git Integration**
- Automatic deployments on push
- Preview deployments for PRs
- No GitHub Actions needed

**Option B: GitHub Actions with Wrangler**
- More control over deployment process
- Can run tests before deployment
- Requires Cloudflare API token

**File**: `.github/workflows/cloudflare-deploy.yml`
```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22.14.0'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm run test

      - name: Build
        run: npm run build

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=healthy-meal
```

**Required GitHub Secrets:**
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `OPENROUTER_API_KEY`

---

### Phase 6: Monitoring & Optimization

#### 6.1 Cloudflare Analytics

- Enable Workers Analytics in dashboard
- Monitor request volume, errors, and latency
- Set up alerts for error rates

#### 6.2 Error Tracking

**Recommended Tools:**
- Sentry (Cloudflare Workers integration)
- LogFlare (Cloudflare-specific)
- Cloudflare Workers Logs (built-in)

**Example Sentry Setup:**
```typescript
import * as Sentry from "@sentry/cloudflare";

Sentry.init({
  dsn: import.meta.env.SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
});
```

#### 6.3 Performance Optimization

- Enable Cloudflare CDN caching for static assets
- Implement edge caching for API responses
- Use Cloudflare's Argo Smart Routing (optional)
- Optimize bundle sizes with code splitting

---

## Migration Risks & Mitigation

### High-Risk Items

#### 1. Session Storage Migration
**Risk**: Filesystem sessions won't work in Workers
**Mitigation**:
- Verify if sessions are actually needed (Supabase uses cookies)
- If needed, implement Cloudflare KV storage
- Test authentication thoroughly

#### 2. Node.js API Dependencies
**Risk**: Code using Node.js built-ins will break
**Mitigation**:
- Audit all dependencies for Node.js usage
- Use polyfills where possible
- Refactor incompatible code

#### 3. Database Connection Limits
**Risk**: Cloudflare Workers may hit Supabase connection limits
**Mitigation**:
- Use Supabase connection pooling
- Implement proper connection management
- Monitor connection usage

#### 4. Cold Start Performance
**Risk**: Initial request latency
**Mitigation**:
- Optimize bundle size
- Use Cloudflare's zero-downtime deployments
- Implement edge caching

### Medium-Risk Items

#### 5. Environment Variable Access
**Risk**: Different ENV handling in Workers
**Mitigation**:
- Test ENV access patterns
- Use Wrangler secrets for sensitive data
- Update documentation

#### 6. Response Streaming
**Risk**: Limited streaming support in Workers
**Mitigation**:
- Test AI response streaming from OpenRouter
- Implement fallback for non-streaming

---

## Rollback Plan

If migration encounters critical issues:

### Immediate Rollback
1. Revert `astro.config.mjs` to Node.js adapter
2. Run `npm install @astrojs/node`
3. Redeploy to DigitalOcean

### Data Preservation
- Supabase database remains unchanged (no migration needed)
- User sessions may be lost (acceptable for rollback scenario)

### Communication Plan
- Notify users of temporary downtime (if applicable)
- Document issues encountered
- Schedule re-migration with fixes

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Pre-Migration Assessment | 2-3 days | None |
| Adapter Migration | 1 day | Phase 1 complete |
| Code Modifications | 2-4 days | Phase 2 complete |
| Testing | 3-5 days | Phase 3 complete |
| Deployment Setup | 1-2 days | Phase 4 complete |
| Monitoring & Optimization | Ongoing | Phase 5 complete |
| **Total Estimated Time** | **9-15 days** | |

---

## Success Criteria

- [ ] All authentication flows work correctly
- [ ] No 500 errors in production
- [ ] API response times < 200ms (median)
- [ ] Cold start times < 1s
- [ ] Zero data loss during migration
- [ ] All tests pass (unit, integration, e2e)
- [ ] Successful deployment to Cloudflare Pages
- [ ] Monitoring and alerts configured
- [ ] Documentation updated

---

## Post-Migration Optimization

### Immediate (Week 1)
- Monitor error rates and fix critical issues
- Optimize slow API endpoints
- Adjust caching strategies

### Short-term (Month 1)
- Implement edge caching for static data
- Optimize bundle sizes
- Add performance monitoring dashboards

### Long-term (Quarter 1)
- Implement regional data caching
- Optimize database queries
- Consider multi-region deployment

---

## Cost Analysis

### Current (DigitalOcean)
- Estimated: $X/month (fill in based on current usage)

### After Migration (Cloudflare Pages)

**Free Tier Includes:**
- Unlimited requests
- Unlimited bandwidth
- 500 builds/month
- 100 custom domains

**Paid Add-ons (if needed):**
- Cloudflare KV: $0.50/GB/month + $0.50/million reads
- Durable Objects: $0.15/million requests + $12.50/GB/month
- Workers Analytics: Included

**Estimated Cost**: $0-20/month (depending on KV usage)

**Savings**: Potential significant reduction in hosting costs

---

## Documentation Updates Needed

- [ ] Update `README.md` with Cloudflare deployment instructions
- [ ] Update `CLAUDE.md` with new architecture details
- [ ] Create `docs/deployment-cloudflare.md`
- [ ] Update environment variable documentation
- [ ] Document local development with Wrangler
- [ ] Update CI/CD workflow documentation

---

## Resources & References

### Official Documentation
- [Astro Cloudflare Adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Supabase with Cloudflare](https://supabase.com/docs/guides/platform/cloudflare-workers)

### Community Resources
- Astro Discord: #adapter-cloudflare
- Cloudflare Discord: #pages-help
- Supabase Discord: #help

### Tools
- [Wrangler CLI](https://github.com/cloudflare/workers-sdk)
- [Cloudflare Workers Types](https://github.com/cloudflare/workers-types)
- [Miniflare](https://miniflare.dev/) - Local Cloudflare Workers simulator

---

## Next Steps

1. **Review this plan** with the team
2. **Create a backup** of current production environment
3. **Set up a staging environment** on Cloudflare Pages for testing
4. **Begin Phase 1**: Pre-Migration Assessment
5. **Schedule migration window** based on timeline estimate

---

**Document Version**: 1.0
**Created**: 2025-12-09
**Last Updated**: 2025-12-09
**Owner**: DevOps Team
**Status**: Draft - Awaiting Approval
