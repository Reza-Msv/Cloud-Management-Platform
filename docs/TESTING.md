# Automated Testing & Verification Guide

This document catalogs every automated test suite, execution command, and quality gate implemented across the monorepo.

---

## 1. Test Suite Summary Matrix

| Application | Test Framework | Test Count | Scope | Verification Command |
| :--- | :--- | :---: | :--- | :--- |
| **Django Backend** | Django Test Runner / `unittest` | **122** | Models, Serializers, Selectors, Services, RBAC Permissions, APIs | `docker compose exec backend python manage.py test` |
| **Go Microservice** | Go `testing` standard library | **17** | Handlers, Upstream Client, Config, End-to-End | `cd go-service && go test -v ./... && go vet ./...` |
| **PHP / Laravel** | PHPUnit 11 | **11** (27 assertions) | Service Client, Ownership Validation, Routes | `cd php-service && php artisan test` |
| **Next.js Unit** | Vitest 3 / Testing Library | **19** | Components, Hooks, Routing, Theme, Auth | `cd frontend && pnpm test` |
| **Next.js E2E** | Playwright 1.50 | **5** | Cross-Browser, i18n, RTL/LTR Layout, Auth Redirection | `cd frontend && pnpm test:e2e` |

---

## 2. Django Backend Test Suite (122 Tests)

The backend test suite runs in an isolated temporary SQLite/Postgres test database created on-the-fly:

### Execution Command:
```bash
# Inside running container (Recommended):
docker compose exec backend python manage.py test

# Or in local Python virtual environment:
cd backend && python manage.py test
```

### Coverage Breakdown:
- **`apps.authentication` (15 tests)**:
  - CSRF token acquisition.
  - Login authentication with valid and invalid credentials.
  - Session establishment, session cookie creation, and `/api/v1/auth/me/` profile retrieval.
  - User logout and session invalidation.
- **`apps.common` (12 tests)**:
  - Error format standardization (`error`, `detail`, `code`).
  - RBAC permissions checking (`Admin` vs `Operator` group privileges).
- **`apps.customers` (45 tests)**:
  - Customer model validation and uniqueness constraints.
  - Serializers and field validations.
  - Service layer logic and customer creation.
  - Customer list, detail, filtering, and search endpoints.
  - Role-based restriction: Operators cannot create customers (`403 Forbidden`).
- **`apps.services` (50 tests)**:
  - Service model choices validation (`active` vs `suspended`).
  - Serializer validation against the 4 canonical types (`vps`, `cloud_server`, `dedicated_server`, `cloud_storage`).
  - Service status update endpoints (`PATCH /status/`).
  - Foreign key referential protection (`on_delete=models.PROTECT`).

---

## 3. Go Microservice Test Suite (17 Tests)

### Execution Command:
```bash
cd go-service
go test -v ./...
go vet ./...
```

### Test Scenarios:
- `TestHealthHandler_BasicHealth`: Verifies `GET /health` returns runtime info independently of Django.
- `TestHealthHandler_WithValidServiceID`: Tests `GET /health?service_id=10` against mock upstream server.
- `TestHealthHandler_InvalidServiceID`: Verifies non-numeric and negative IDs return `400 Bad Request`.
- `TestHealthHandler_NotFound`: Verifies 404 propagation when service does not exist in Django.
- `TestHealthHandler_UpstreamAuthError`: Verifies upstream authentication failures return `502 Bad Gateway`.
- `TestHealthHandler_UpstreamTimeout`: Tests resilient context timeout cancellation.

---

## 4. PHP / Laravel Test Suite (11 Tests)

### Execution Command:
```bash
cd php-service
php artisan test
```

### Test Scenarios:
- Customer search with valid, missing, and invalid integer IDs.
- Service status update dispatching via Laravel HTTP client.
- Security boundary check: verifies customer/service ownership matching before dispatching PATCH requests.

---

## 5. Next.js Frontend Quality Checks

### 5.1 Type Checking & Linting
```bash
cd frontend
pnpm tsc --noEmit
pnpm lint
```

### 5.2 Unit Tests (Vitest)
```bash
cd frontend
pnpm test
```
Verifies theme toggling, language switching, login form validations, and customer/service components.

### 5.3 End-to-End Tests (Playwright)
```bash
cd frontend
pnpm test:e2e
```
Executes headless browser checks against `http://localhost:3000` verifying:
1. Root URL redirects to default locale (`/en`).
2. Persian locale (`/fa`) renders with `dir="rtl"` and localized Farsi typography.
3. Unauthenticated access to `/dashboard` redirects immediately to `/login`.
4. Dark and Light theme switching without hydration mismatches.
