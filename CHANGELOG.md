# Changelog

All notable changes to the Cloud Management Platform (CMP) are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v1.0.0] - 2026-11-22

### Added
- **Core Backend Service (Django REST Framework)**:
  - Domain models for `Customer` and `Service` with strict referential protection (`on_delete=models.PROTECT`).
  - Standardized REST APIs for customers (`/api/v1/customers/`) and services (`/api/v1/services/`).
  - Role-Based Access Control (RBAC) via `Admin` and `Operator` groups.
  - Session authentication with double-submit CSRF cookie protection.
  - Interactive OpenAPI 3 / Swagger documentation at `/api/docs/`.
  - Comprehensive 122-test automated unit and integration suite.
- **Next.js SaaS Dashboard Frontend**:
  - Built on Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS.
  - Internationalization (`next-intl`) with English (`/en`) and Persian (`/fa`) supporting dynamic bidirectional layout switching (LTR / RTL).
  - Dark, light, and system theme switching without hydration mismatches.
  - TanStack React Query v5 client-side caching and deduplicated data fetching.
  - Live system health integration widget connected to Go microservice via server-side proxy route (`/api/go/health`).
- **Independent Go Microservice**:
  - Zero-dependency Go 1.22 runtime health reporter (`GET /health`).
  - Upstream service status inspector (`GET /health?service_id={id}`) with context timeout protection.
  - Resilient HTTP REST client communicating with Django.
- **Additional PHP / Laravel Service**:
  - Independent customer inquiry portal with real-time service status mutation (`active` vs `suspended`).
  - Relationship security validation preventing cross-customer resource manipulation.
- **Docker & Container Infrastructure (Phase 6 & 7)**:
  - Multi-service orchestration via `docker-compose.yml` for all 5 services (`cmp_db`, `cmp_backend`, `cmp_frontend`, `cmp_go_service`, `cmp_php_service`).
  - Hardened non-root runtime containers (`django`, `nextjs`, `appuser`, `laravel`).
  - Isolated internal Docker bridge network (`cmp_network`).
  - Data volume persistence via named volume `cmp_postgres_data`.
  - Comprehensive container health checks and dependency chains.

### Security
- Provisioned dedicated unprivileged `service_integration` service account with strict `Operator` role permissions for auxiliary microservices (Go and PHP), eliminating excessive superuser privileges.
- Verified zero direct database connections from Go or PHP; PostgreSQL port 5432 is strictly private to the Django container.
- Protected state-changing API requests against Cross-Site Request Forgery (CSRF).
- Excluded all real `.env` files and credentials from Git and Docker build contexts.

### Fixed
- Created missing `backend/apps/authentication/__init__.py` allowing default Django test runner to discover and execute all 122 backend tests.
- Provisioned `operator_user` in the Docker PostgreSQL database with appropriate `Operator` permissions.
- Aligned Vitest testing mocks for `@/i18n/routing` in the Next.js test suite.
