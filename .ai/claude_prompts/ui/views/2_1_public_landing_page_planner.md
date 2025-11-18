As a senior frontend developer, your task is to create a detailed implementation plan for a new view in a web application. This plan should be comprehensive and clear enough for another frontend developer to implement the view correctly and efficiently.

First, review the following information:

1. Product Requirements Document (PRD):
   <prd>
   `.ai/prd.md`
   </prd>

2. View Description:
   <view_description>

### 2.1 Public Landing Page

**Path:** `/`

**Main Purpose:** Marketing page to attract new users and explain the application's value proposition. Encourages registration.

**Key Information to Display:**

- Hero section with headline: "Dopasuj przepisy do swojej diety z pomocą AI"
- Value proposition: AI-powered recipe modification for personalized dietary needs
- Features highlights: calorie adjustment, protein increase, ingredient substitutions
- "How It Works" with 3 steps: (1) Add recipe, (2) Modify with AI, (3) Cook healthy meals
- Social proof placeholder (testimonials section for future)
- Call-to-action buttons: "Zacznij za darmo" (Register), "Dowiedz się więcej" (Learn more)

**Key View Components:**

**Layout Components:**

- `<LandingHeader>` - Logo, navigation links (Features, How It Works, Pricing), Login/Register buttons
- `<HeroSection>` - Large headline, subheadline, primary CTA, hero image/illustration
- `<FeaturesSection>` - 3-4 feature cards with icons, titles, descriptions
- `<HowItWorksSection>` - 3 steps with numbered cards, icons, descriptions
- `<SocialProofSection>` - Placeholder for testimonials or user statistics
- `<FinalCTASection>` - Secondary conversion section
- `<Footer>` - Links, copyright, contact

**Interactive Components:**

- Smooth scroll navigation to sections
- CTA button hover/press states
- Mobile hamburger menu

**UX Considerations:**

- Clear, action-oriented language in Polish
- High-contrast CTAs for visibility
- Fast page load (minimal JavaScript, optimized images)
- Responsive images/illustrations
- Sticky header on scroll (desktop)

**Accessibility Considerations:**

- Proper heading hierarchy (H1 for main headline)
- ARIA labels for icon-only buttons
- Keyboard navigation support
- Alt text for all images/illustrations
- Sufficient color contrast ratios

**Security Considerations:**

- No sensitive data on public page
- HTTPS enforced
- No external script injections
  </view_description>

3. User Stories:
   <user_stories>
   User will visit the landing page and see a clear headline explaining the app's purpose.
   The landing page will have a prominent call-to-action button encouraging users to register.
   The landing page will highlight key features of the app in an easy-to-read format.
   The landing page will include a "How It Works" section with 3 simple steps.
   The landing page will have a responsive design that looks good on both desktop and mobile devices.
   The landing page will contain login and register buttons in the header for easy access. (Authorization is not implemented yet, just the buttons)

Acceptance criteria:

- The headline must be in Polish: "Dopasuj przepisy do swojej diety z pomocą AI"
- The primary call-to-action button text must be "Zacznij za darmo"
- The "How It Works" section must clearly outline the 3 steps: Add recipe, Modify with AI, Cook healthy meals
- The page must be responsive and maintain usability across various screen sizes
- The header must include navigation links: Features, How It Works, Pricing, Login, Register
  </user_stories>

1. Endpoint Description:
   <endpoint_description>
   The view will use /login and /register, but these endpoints are not implemented yet. The buttons will be non-functional for now.
   </endpoint_description>

1. Endpoint Implementation:
   <endpoint_implementation>
   No backend implementation is required for this view at this time. The login and register buttons will be present but non-functional.
   </endpoint_implementation>

1. Type Definitions:
   <type_definitions>
   `src/types.ts`
   </type_definitions>

1. Tech Stack:
   <tech_stack>
   `.ai/tech-stack.md`
   </tech_stack>

Before creating the final implementation plan, conduct analysis and planning inside <implementation_breakdown> tags in your thinking block. This section can be quite long, as it's important to be thorough.

In your implementation breakdown, execute the following steps:

1. For each input section (PRD, User Stories, Endpoint Description, Endpoint Implementation, Type Definitions, Tech Stack):

- Summarize key points
- List any requirements or constraints
- Note any potential challenges or important issues

2. Extract and list key requirements from the PRD
3. List all needed main components, along with a brief description of their purpose, needed types, handled events, and validation conditions
4. Create a high-level component tree diagram
5. Identify required DTOs and custom ViewModel types for each view component. Explain these new types in detail, breaking down their fields and associated types.
6. Identify potential state variables and custom hooks, explaining their purpose and how they'll be used
7. List required API calls and corresponding frontend actions
8. Map each user story to specific implementation details, components, or functions
9. List user interactions and their expected outcomes
10. List conditions required by the API and how to verify them at the component level
11. Identify potential error scenarios and suggest how to handle them
12. List potential challenges related to implementing this view and suggest possible solutions

After conducting the analysis, provide an implementation plan in Markdown format with the following sections:

1. Overview: Brief summary of the view and its purpose.
2. View Routing: Specify the path where the view should be accessible.
3. Component Structure: Outline of main components and their hierarchy.
4. Component Details: For each component, describe:

- Component description, its purpose and what it consists of
- Main HTML elements and child components that build the component
- Handled events
- Validation conditions (detailed conditions, according to API)
- Types (DTO and ViewModel) required by the component
- Props that the component accepts from parent (component interface)

5. Types: Detailed description of types required for view implementation, including exact breakdown of any new types or view models by fields and types.
6. State Management: Detailed description of how state is managed in the view, specifying whether a custom hook is required.
7. API Integration: Explanation of how to integrate with the provided endpoint. Precisely indicate request and response types.
8. User Interactions: Detailed description of user interactions and how to handle them.
9. Conditions and Validation: Describe what conditions are verified by the interface, which components they concern, and how they affect the interface state
10. Error Handling: Description of how to handle potential errors or edge cases.
11. Implementation Steps: Step-by-step guide for implementing the view.

Ensure your plan is consistent with the PRD, user stories, and includes the provided tech stack.

The final output should be in English and saved in a file named .ai/{view-name}-view-implementation-plan.md. Do not include any analysis and planning in the final output.

Here's an example of what the output file should look like (content is to be replaced):

```markdown
# View Implementation Plan [View Name]

## 1. Overview

[Brief description of the view and its purpose]

## 2. View Routing

[Path where the view should be accessible]

## 3. Component Structure

[Outline of main components and their hierarchy]

## 4. Component Details

### [Component Name 1]

- Component description [description]
- Main elements: [description]
- Handled interactions: [list]
- Handled validation: [list, detailed]
- Types: [list]
- Props: [list]

### [Component Name 2]

[...]

## 5. Types

[Detailed description of required types]

## 6. State Management

[Description of state management in the view]

## 7. API Integration

[Explanation of integration with provided endpoint, indication of request and response types]

## 8. User Interactions

[Detailed description of user interactions]

## 9. Conditions and Validation

[Detailed description of conditions and their validation]

## 10. Error Handling

[Description of handling potential errors]

## 11. Implementation Steps

1. [Step 1]
2. [Step 2]
3. [...]
```

Begin analysis and planning now. Your final output should consist solely of the implementation plan in English in markdown format, which you will save in the .ai/{view-name}-view-implementation-plan.md file and should not duplicate or repeat any work done in the implementation breakdown.
