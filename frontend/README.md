# Frontend Service (Next.js + TypeScript)

## 1. Overview
The Frontend service provides the web user interface for the Cloud Management Platform (CMP). It offers interactive portals for:
- Customers to view, provision, and manage cloud services and subscriptions.
- Administrators to manage customer accounts, resource limits, and service catalogs.
- Real-time telemetry, resource metrics, and billing dashboards.

## 2. Technology Stack
- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS / Component Library
- **State & Data Fetching**: TanStack Query / SWR / Context API

## 3. Directory Layout (Architecture)
The frontend is architected for scalability using modular Next.js directory conventions:

```text
frontend/
├── public/                   # Static assets (images, icons, fonts)
├── src/
│   ├── app/                  # App Router pages, layouts, and route handlers
│   ├── components/           # Reusable UI components (atomic & composite)
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility functions and third-party client configs
│   ├── services/             # API client modules for interacting with Django / Go
│   ├── styles/               # Global CSS and styling themes
│   └── types/                # TypeScript interfaces, DTOs, and type definitions
├── .env.example              # Template for frontend environment variables
└── README.md                 # Service documentation
```

## 4. API Communication Pattern
The frontend interacts primarily with the **Core Backend (Django REST Framework)** for authentication, customer state, and service orders. Real-time telemetry or event streams may be fetched directly or via the API gateway from `go-service`.

## 5. Local Setup (Scheduled for Phase 3)
In Phase 3, this directory will be initialized with the Next.js scaffold, TypeScript compiler settings, styling setup, and responsive layout foundations.
