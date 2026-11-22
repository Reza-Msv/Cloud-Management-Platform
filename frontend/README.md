# Frontend Service — Cloud Management Platform (Next.js)

## 1. Overview
The Frontend is an enterprise-grade control panel built with:
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server & Client Components)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Styling**: [Tailwind CSS v3](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Data Fetching & Caching**: [TanStack Query v5](https://tanstack.com/query)
- **Client State**: [Zustand](https://github.com/pmndrs/zustand)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **Internationalization**: [next-intl](https://next-intl-docs.vercel.app/)
- **Unit & Component Testing**: [Vitest](https://vitest.dev/) & [React Testing Library](https://testing-library.com/)
- **End-to-End Testing**: [Playwright](https://playwright.dev/)

---

## 2. Directory Structure

```text
frontend/
├── messages/                 # i18n message catalogs (e.g. en.json)
├── public/                   # Static public assets
├── src/
│   ├── app/                  # Next.js App Router (layout, page, metadata)
│   ├── components/           # UI components
│   │   ├── layout/           # App layouts, headers, sidebars
│   │   └── ui/               # shadcn/ui primitives (button, etc.)
│   ├── features/             # Domain-specific modules (customers, services, auth)
│   ├── hooks/                # Custom React hooks
│   ├── i18n/                 # next-intl server request configuration
│   ├── lib/                  # Shared utilities (cn, API client, helpers)
│   ├── providers/            # React context providers (TanStack Query, etc.)
│   ├── services/             # Core API service calls
│   ├── styles/               # Global CSS & Tailwind design tokens
│   └── types/                # Domain & TypeScript type declarations
├── tests/
│   ├── e2e/                  # Playwright end-to-end smoke tests
│   ├── unit/                 # Vitest unit & component tests
│   └── setup.ts              # Testing Library Jest-DOM setup
├── .env.example              # Environment variables template
├── eslint.config.mjs         # ESLint 9 configuration
├── next.config.mjs           # Next.js configuration (with next-intl plugin)
├── package.json              # Project manifest and scripts
├── playwright.config.ts      # Playwright E2E configuration
├── postcss.config.js         # PostCSS configuration
├── tailwind.config.js        # Tailwind CSS design system configuration
├── tsconfig.json             # TypeScript compiler settings (strict mode, @/* alias)
└── vitest.config.ts          # Vitest testing configuration
```

---

## 3. Getting Started & Local Development

### 3.1 Prerequisites
- Node.js `v20+` or `v22+` (Installed: `v22.22.3`)
- `pnpm` `v9+` or `v10+` (Installed: `v10.24.0`)

### 3.2 Environment Setup
Copy the environment template:
```bash
cd frontend
cp .env.example .env.local
```

Key environment variable:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

### 3.3 Install Dependencies
```bash
pnpm install
```

### 3.4 Run Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 4. Quality Assurance & Scripts

| Command | Action |
| :--- | :--- |
| `pnpm dev` | Starts Next.js development server at port 3000 |
| `pnpm build` | Creates an optimized production build |
| `pnpm start` | Runs the built production server |
| `pnpm lint` | Runs ESLint type and syntax analysis |
| `pnpm test` | Runs all Vitest unit and component tests |
| `pnpm test:watch` | Runs Vitest in interactive watch mode |
| `pnpm test:e2e` | Runs Playwright end-to-end smoke tests |
