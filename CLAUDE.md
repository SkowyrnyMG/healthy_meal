# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HealthyMeal is an AI-powered web application that helps users modify recipes according to their dietary needs and preferences. The app is built with Astro 5, React 19, TypeScript, Tailwind 4, and Shadcn/ui, with Supabase as the backend and OpenRouter.ai for AI integration.

## Development Commands

### Essential Commands

- `npm run dev` - Start development server (port 3000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally (Astro preview)
- `npm run preview:cloudflare` - Preview with Wrangler (Cloudflare runtime)
- `npm run deploy` - Build and deploy to Cloudflare Pages
- `npm run lint` - Check for code issues with ESLint
- `npm run lint:fix` - Auto-fix linting issues
- `npm run format` - Format code with Prettier

### Node Version

- Required: Node.js 22.14.0 (use `nvm use` to switch)

## Architecture

### Framework Configuration

- **Astro**: Configured with server-side rendering (`output: "server"`)
- **Server Port**: 3000 (configured in astro.config.mjs)
- **Adapter**: Cloudflare Pages (directory mode) for edge deployment
- **React Integration**: Used for interactive components only
- **Path Aliases**: `@/*` maps to `./src/*`
- **Runtime**: Cloudflare Workers with Node.js compatibility

### Directory Structure

```
src/
├── layouts/          # Astro layouts
├── pages/            # Astro pages
│   └── api/          # API endpoints
├── middleware/       # Astro middleware (index.ts)
├── db/               # Supabase clients and types
├── types.ts          # Shared types (Entities, DTOs)
├── components/       # Astro (static) and React (dynamic) components
│   └── ui/           # Shadcn/ui components
├── lib/              # Services and helpers
├── assets/           # Internal static assets
└── styles/           # Global styles (global.css)
```

### Key Technical Patterns

#### Astro-Specific

- Use `.astro` components for static content and layouts
- React components should be used only for interactivity
- API routes use `export const prerender = false`
- Use uppercase HTTP method handlers (GET, POST, etc.)
- Access Supabase via `context.locals.supabase` in routes, not direct imports
- Use `SupabaseClient` type from `src/db/supabase.client.ts`
- Use Astro.cookies for server-side cookie management
- Use import.meta.env for environment variables

#### React-Specific

- Never use "use client" or Next.js directives (this is Astro + React, not Next.js)
- Custom hooks go in `src/components/hooks`
- Use functional components with hooks only

#### Backend & Data

- Supabase provides PostgreSQL, authentication, and SDK
- Use Zod schemas for all API input validation
- Extract business logic into services in `src/lib/services`

#### Styling

- Tailwind 4 via Vite plugin
- Shadcn/ui configured with New York style, neutral base color
- Global styles in `src/styles/global.css`
- Icon library: lucide-react

### Code Quality Standards

#### Error Handling

- Handle errors and edge cases at the beginning of functions
- Use early returns for error conditions (guard clauses)
- Avoid unnecessary else statements (if-return pattern)
- Place happy path last in functions
- Implement proper error logging with user-friendly messages

#### Linting & Formatting

- Husky pre-commit hooks are configured
- lint-staged runs on commit:
  - ESLint for .ts, .tsx, .astro files
  - Prettier for .json, .css, .md files

#### Accessibility

- Use ARIA landmarks and roles appropriately
- Implement proper aria-expanded, aria-controls, aria-live regions
- Use aria-label/aria-labelledby for elements without visible labels
- Avoid redundant ARIA that duplicates HTML semantics

## Environment Variables

Required environment variables (see .env.example):

- `PUBLIC_SUPABASE_URL` - Supabase project URL
- `PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `OPENROUTER_API_KEY` - OpenRouter API key for AI integration

### Cloudflare Configuration

Environment variables must be configured in Cloudflare Pages dashboard or via Wrangler CLI:

```bash
# Using Wrangler CLI
wrangler pages secret put PUBLIC_SUPABASE_URL
wrangler pages secret put PUBLIC_SUPABASE_ANON_KEY
wrangler pages secret put OPENROUTER_API_KEY
```

For CI/CD, these variables should be set as GitHub Secrets:
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token with Pages write access
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

## Deployment

### Cloudflare Pages

- **CI/CD**: GitHub Actions (`.github/workflows/master.yml`)
- **Hosting**: Cloudflare Pages with edge deployment
- **Adapter**: Cloudflare adapter (directory mode) configured in astro.config.mjs
- **Configuration**: `wrangler.toml` in project root

### Deployment Methods

#### Manual Deployment
```bash
npm run deploy
```

#### CI/CD Deployment
- Trigger manually via GitHub Actions UI (workflow_dispatch)
- Workflow runs linting, unit tests, builds, and deploys to Cloudflare Pages
- Requires GitHub Secrets configured (see Environment Variables section)

#### Local Testing
```bash
# Build the project
npm run build

# Preview with Wrangler (simulates Cloudflare runtime)
npm run preview:cloudflare
```

### Cloudflare Pages Configuration

- **Project Name**: healthy-meal
- **Build Command**: `npm run build`
- **Build Output**: `./dist`
- **Node Version**: 22.14.0
- **Compatibility Date**: 2025-12-09
- **Node.js Compatibility**: Enabled via `nodejs_compat` flag
