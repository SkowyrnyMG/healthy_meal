# HealthyMeal

An AI-powered web application that helps users modify recipes according to their dietary needs and preferences, making healthy eating more accessible and personalized.

## Table of Contents

- Project Description
- Tech Stack
- Getting Started Locally
- Available Scripts
- Project Scope
- Project Status
- License

## Project Description

HealthyMeal is a web application that leverages artificial intelligence to modify recipes according to users' individual dietary needs. The application allows users to save, modify, and browse recipes tailored to their diets and preferences, making it easier to achieve their health goals.

### Key Features

- AI-powered recipe modification to match dietary requirements
- Personalized user profiles with dietary preferences and goals
- Recipe management system with search and filtering capabilities
- Meal planning functionality
- Nutritional data visualization

### Target Users

- People looking to lose weight
- Fitness enthusiasts aiming to build muscle
- Busy individuals with limited time for cooking

## Tech Stack

### Frontend

- **Astro 5** - Core framework for building fast, efficient pages with minimal JavaScript
- **React 19** - For interactive components where needed
- **TypeScript 5** - For static typing and better IDE support
- **Tailwind 4** - For styling
- **Shadcn/ui** - For accessible React components

### Backend

- **Supabase** - Complete backend solution providing:
  - PostgreSQL database
  - Authentication
  - SDK for backend-as-a-service capabilities

### AI Integration

- **OpenRouter.ai** - For access to various AI models (OpenAI, Anthropic, Google, etc.)

### Testing

- **Vitest** - Fast unit testing framework powered by Vite
  - React Testing Library for testing React components
  - Integration with TypeScript and Astro
- **Playwright** - Modern end-to-end testing
  - Cross-browser testing support
  - TypeScript integration

### CI/CD & Hosting

- **GitHub Actions** - For CI/CD pipelines
- **DigitalOcean** - For hosting via Docker images

## Getting Started Locally

### Prerequisites

- Node.js version 22.14.0
  ```bash
  # Use nvm to install and use the correct Node.js version
  nvm install 22.14.0
  nvm use 22.14.0
  ```

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/SkowyrnyMG/healthy_meal.git
   cd healthy_meal
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Set up environment variables (create a `.env` file in the project root)

   ```
   # Example environment variables
   PUBLIC_SUPABASE_URL=your_supabase_url
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

4. Start the development server

   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:4321`

## Available Scripts

### Development

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build locally
- `npm run astro` - Run Astro CLI commands

### Code Quality

- `npm run lint` - Run ESLint to check for code issues
- `npm run lint:fix` - Fix linting issues automatically
- `npm run format` - Format code with Prettier

### Testing

#### Unit Tests (Vitest)

- `npm test` - Run unit tests once
- `npm run test:watch` - Run unit tests in watch mode (re-runs on file changes)
- `npm run test:ui` - Open Vitest UI for visual test exploration
- `npm run test:coverage` - Run tests with coverage report

#### E2E Tests (Playwright)

- `npm run test:e2e` - Run end-to-end tests
- `npm run test:e2e:ui` - Run E2E tests in UI mode for debugging
- `npm run test:e2e:codegen` - Open Playwright Codegen tool for recording tests

## Testing

This project uses a comprehensive testing strategy with both unit and end-to-end tests.

### Unit Testing with Vitest

Unit tests are located alongside the source files with `.test.ts` or `.test.tsx` extensions. The project uses:

- **Vitest** - Fast unit testing framework built on Vite
- **React Testing Library** - For testing React components
- **jsdom** - DOM environment for testing

Example test location: `src/lib/utils/dashboard.test.ts`

#### Running Unit Tests

```bash
# Run tests once
npm test

# Run in watch mode (recommended during development)
npm run test:watch

# View tests in UI mode
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### E2E Testing with Playwright

End-to-end tests are located in the `e2e/` directory and use the Page Object Model pattern for maintainability.

Example test files:
- `e2e/landing.spec.ts` - Landing page tests
- `e2e/authentication.spec.ts` - Authentication flow tests
- `e2e/pages/` - Page Object Models

#### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode for debugging
npm run test:e2e:ui

# Record new tests with Codegen
npm run test:e2e:codegen
```

#### Writing E2E Tests

E2E tests use the Page Object Model pattern. Create page objects in `e2e/pages/` and test files in `e2e/`:

```typescript
// e2e/pages/example.page.ts
import { type Page, type Locator } from '@playwright/test';

export class ExamplePage {
  readonly page: Page;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1 });
  }

  async goto() {
    await this.page.goto('/example');
  }
}

// e2e/example.spec.ts
import { test, expect } from '@playwright/test';
import { ExamplePage } from './pages/example.page';

test('example test', async ({ page }) => {
  const examplePage = new ExamplePage(page);
  await examplePage.goto();
  await expect(examplePage.heading).toBeVisible();
});
```

## Project Scope

### Core Features (MVP)

- User account system with profiles and preferences
- Recipe management (add, edit, view, delete)
- AI-powered recipe modification:
  - Adjust calorie content
  - Increase protein and fiber content
  - Change portion sizes with automatic recalculation
  - Find healthier ingredient alternatives
- Data visualization (nutritional charts)
- Simple meal planning calendar
- Admin dashboard with user and recipe statistics

### Features Not Included in MVP

- URL-based recipe import
- Multimedia support (recipe images)
- Recipe sharing
- Social features (comments, sharing)
- Offline functionality
- Multi-language support
- Payment system and monetization

### Future Development Plans

- URL-based recipe import
- Native mobile apps for iOS and Android
- Expanded social features

## Project Status

HealthyMeal is currently in early development (version 0.0.1). The project is being developed in 6 phases, each lasting approximately 1.5 weeks:

1. User system and preferences
2. Basic recipe CRUD functionality
3. User interface development
4. AI integration
5. Testing and optimization
6. Admin dashboard and landing page

## License

This project is licensed under the MIT License - see the LICENSE file for details.
