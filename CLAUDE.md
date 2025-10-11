# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HealthyMeal is an AI-powered web application that helps users modify recipes according to their dietary needs and preferences. The app is built with Astro 5, React 19, TypeScript, Tailwind 4, and Shadcn/ui, with Supabase as the backend and OpenRouter.ai for AI integration.

## Development Commands

### Essential Commands

- `npm run dev` - Start development server (port 3000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Check for code issues with ESLint
- `npm run lint:fix` - Auto-fix linting issues
- `npm run format` - Format code with Prettier

### Node Version

- Required: Node.js 22.14.0 (use `nvm use` to switch)

## Architecture

### Framework Configuration

- **Astro**: Configured with server-side rendering (`output: "server"`)
- **Server Port**: 3000 (configured in astro.config.mjs)
- **Adapter**: Node.js standalone mode for Docker deployment
- **React Integration**: Used for interactive components only
- **Path Aliases**: `@/*` maps to `./src/*`

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

## Deployment

- CI/CD: GitHub Actions
- Hosting: DigitalOcean via Docker images
- Adapter: Node.js standalone mode configured in astro.config.mjs
