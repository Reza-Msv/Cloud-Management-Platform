# Frontend Dashboard Service (Next.js & TypeScript)

## 1. Overview
The Frontend Dashboard is a modern, responsive SaaS management interface for the Cloud Management Platform. It connects to the Django REST API backend for core data and features real-time System Health integration with the Go microservice.

---

## 2. Technology Stack & Key Dependencies
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19 / TypeScript 5.8
- **Styling**: Tailwind CSS / Lucide Icons
- **State & Caching**: TanStack React Query v5 / Zustand v5
- **Forms & Validation**: React Hook Form / Zod
- **Internationalization**: `next-intl` (English `/en` and Persian `/fa` with automatic LTR / RTL switching)
- **Themes**: `next-themes` (Dark / Light / System)

---

## 3. Directory Layout
```text
frontend/
├── src/
│   ├── app/              # App router pages, layouts, and route handlers
│   │   └── api/go/       # Next.js Server Route Proxy to Go microservice
│   ├── components/       # Reusable UI primitives and shared components
│   ├── features/         # Domain-driven features (auth, customers, services)
│   ├── hooks/            # Custom React hooks (theme, locale)
│   ├── i18n/             # Routing, request config, navigation helpers
│   ├── services/         # API client and backend service callers
│   ├── stores/           # Zustand global state stores
│   └── types/            # TypeScript data contracts and interfaces
├── messages/             # Localized JSON dictionaries (en.json, fa.json)
├── tests/                # Unit tests (Vitest) and E2E tests (Playwright)
├── Dockerfile            # Multi-stage production container
└── README.md
```

---

## 4. Local Development Setup (Manual)

### Prerequisites:
- Node.js 22+
- `pnpm` (Corepack enabled: `corepack enable && corepack prepare pnpm@10.24.0 --activate`)

### Setup Steps:
```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env
# Ensure NEXT_PUBLIC_API_BASE_URL points to Django (http://localhost:8000/api/v1)

# 3. Start development server
pnpm dev
```
Access the application at `http://localhost:3000`.

---

## 5. Quality & Testing Commands
```bash
# Type check and linting
pnpm tsc --noEmit
pnpm lint

# Unit tests (Vitest)
pnpm test

# End-to-end browser tests (Playwright)
pnpm test:e2e

# Production build
pnpm build
```
