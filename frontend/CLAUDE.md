# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EnviGuide Frontend is an environmental management suite for tracking Product Carbon Footprints (PCF), supplier questionnaires, and data quality ratings. Built with React 19, TypeScript, Vite, Tailwind CSS, and Ant Design.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:5173
npm run build    # TypeScript check + Vite production build
npm run lint     # ESLint validation
npm run preview  # Preview production build
```

No test framework is currently configured.

## Architecture

### Directory Structure
- `src/components/` - Reusable UI components (Layout, Sidebar, ProtectedRoute)
- `src/pages/` - Page-level components organized by feature
- `src/features/` - Feature modules for complex multi-step workflows (pcf-create, supplier-questionnaire)
- `src/lib/` - API service classes and utilities
- `src/contexts/` - React Context providers (AuthContext)
- `src/config/` - Configuration files (menu items, data setup groups, questionnaire schemas)
- `src/routes/` - React Router configuration
- `src/types/` - TypeScript interfaces

### Key Patterns

**Authentication**: Uses React Context (`useAuth()` hook) backed by `authService`. Token stored in localStorage. MFA flow redirects to `/mfa-verification` when required.

**API Services**: Located in `src/lib/`. Services use Axios with Bearer token auth. Base URL: `https://enviguide.nextechltd.in/api`. Standard response format: `{ status: boolean; message: string; code: number; data: T }`.

**Routing**: React Router v7 with `createBrowserRouter`. Protected routes wrap content with `ProtectedRoute` component. Data setup pages use dynamic routes with tabs defined in `src/config/dataSetupGroups.ts`.

**Multi-step Forms**: Complex workflows (PCF creation, supplier questionnaire) use Ant Design's Steps component. Step components are in feature directories. Draft data saved to localStorage during form progression.

**Styling**: Tailwind CSS utilities combined with Ant Design components. Custom scrollbar styles in `index.css`.

### Adding New Features

1. Create page component in `src/pages/`
2. Add route in `src/routes/index.tsx`
3. Add menu item in `src/config/menu.ts`
4. If API needed, create/extend service in `src/lib/`

### Data Setup Pattern

Settings pages for master data use a tabbed interface. Groups are defined in `src/config/dataSetupGroups.ts`. CRUD operations go through `dataSetupService.ts` with entity-specific endpoints.
