# Adanalyser AI

<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Training data may be outdated; the bundled docs are the source of truth for the installed Next.js version.

When the dev server is running, use the Next.js MCP server before changing app code:

- Query project metadata, routes, and current errors through `next-devtools-mcp`.
- Use runtime diagnostics for build errors, route shape, Server Actions, logs, and page metadata.
- Verify user-facing changes in a browser when behavior or rendering changes.

<!-- END:nextjs-agent-rules -->

## Project Overview

Adanalyser AI analyzes short-form ad creatives and generates actionable reports that help marketers improve performance before publishing.

The goal is not generic feedback. Feedback must be highly specific to the uploaded creative.

## Tech Stack

- Next.js 16.2.6 with the App Router
- React 19
- TypeScript strict mode
- PostgreSQL
- OpenAI API
- CSS Modules by default
- SCSS Modules when `sass` is installed
- Stripe

## Next.js Patterns

- Keep pages and layouts as Server Components by default.
- Add `"use client"` only at the smallest interactive boundary that needs state, effects, event handlers, custom hooks, or browser APIs.
- Keep secrets, database access, OpenAI calls, and Stripe server logic in Server Components, Server Functions, Route Handlers, or server-only modules.
- Use Server Functions for mutations and Server Actions for form/action flows.
- Always validate authentication and authorization inside every Server Function; Server Functions are reachable through direct POST requests.
- Model expected form and validation errors as return values for `useActionState`; reserve thrown errors for unexpected failures.
- Revalidate or refresh after mutations with the documented Next.js cache APIs when changed data should be visible immediately.

## UI Principles

- Focus on clarity and report readability.
- Mobile-first.
- The product should feel professional, useful, and trustworthy.
- The report UI should make insights easy to scan and act on.

## UI Architecture

We use two UI layers: **Atoms** and **Components**.

### Atoms

Atoms are small, reusable UI primitives.

Examples:

- Button
- Input
- Textarea
- Checkbox
- Badge
- Spinner
- Icon

Structure:

```txt
src/atoms/
  Button/
    Button.tsx
    Button.module.scss
```

Rules:

- Atoms must be generic and reusable.
- Atoms must not contain product-specific business logic.
- Atoms must not import Components.
- Atoms may be used by Components, pages, and layouts.

### Components

Components are larger composed UI blocks or product sections.

Examples:

- Navigation
- Hero
- UploadArea
- VideoPreview
- ReportSummary
- TextImage
- PricingSection

Structure:

```txt
src/components/
  Navigation/
    Navigation.tsx
    Navigation.module.scss

  TextImage/
    TextImage.tsx
    TextImage.module.scss
```

Rules:

- Components may import Atoms.
- Components should not be placed inside the atoms directory.
- Use PascalCase for folders and component files.
- Use one component per folder.
- Every Atom and Component must have its own CSS/SCSS module.
- Do not create global styles for component-specific styling.
- Reuse existing Atoms and Components before creating new ones.

## Styling

- Use CSS Modules by default.
- Use SCSS Modules when `sass` is installed.
- Never use Tailwind unless explicitly requested.
- Never use styled-components.
- Prefer class-based styling through CSS/SCSS modules.
- Avoid inline styles unless the value is dynamic and cannot reasonably live in CSS.
- Prefer readable, shallow nesting.
- Avoid deeply nested selectors.
- Component-specific styles belong next to the component.

## Coding Standards

- Avoid `any`; prefer precise TypeScript types.
- Prefer functional components.
- Reuse existing components before creating new ones.
- Keep Client Components small and pass serializable props from Server Components.
- Use `server-only` for modules that must never enter the client bundle.
- Keep component props typed with explicit `type` definitions.
- Prefer clear names over clever names.
- Keep files focused and avoid mixing unrelated concerns.
- Do not introduce new dependencies without a clear reason.
- Follow the existing project structure before creating a new pattern.

## Report Quality Rules

The report must:

- Explain why something is weak.
- Explain how to improve it.
- Avoid generic marketing advice.
- Reference concrete moments in the video.
- Prioritize actionable feedback.
- Be specific enough that the user feels the video was actually analyzed.
- Focus on practical changes the creator, founder, marketer, or agency can make before publishing.

Bad:

"The hook could be stronger."

Good:

"The first 2.5 seconds contain no curiosity trigger, product reveal, or problem statement, which increases scroll risk."

## Commands

```bash
pnpm install
pnpm dev
pnpm lint
pnpm build
```
