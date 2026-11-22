# Development Roadmap & Testing Strategy

## 1. Project Progression Matrix

This roadmap outlines the systematic development lifecycle for the **Cloud Management Platform (CMP)** monorepo.
A key architectural principle of this project is that **automated tests must be authored and executed alongside each service during its respective phase**, rather than postponed to the end.

---

### Phase 1: Repository Architecture, Base Structure & Documentation (CURRENT PHASE - COMPLETED)
- [x] Monorepo repository structuring (`frontend`, `backend`, `go-service`, `php-service`, `infrastructure`, `docs`, `scripts`).
- [x] Baseline environment configuration templates (`.env.example` in root and each sub-service).
- [x] Initial Docker Compose & Makefile scaffolding.
- [x] Architectural documentation aligned with Take-Home Assignment scope:
  - Simplified 1:N data model (`Customer` 1 ---- N `Service`).
  - Strict database ownership by Django; isolation of Go and PHP.
  - Test suites and command execution requirements defined per service.
- [x] Git repository initialization on `main` branch with comprehensive `.gitignore`.
- [x] Zero business logic, zero scaffolding of frameworks, zero package installations (preserving pure Phase 1 boundary).

---

### Phase 2: Core Backend (Django + DRF) & Database Schema
#### Scope & Implementation
- Initialize Python virtual environment and Django REST Framework project in `backend/`.
- Connect to local PostgreSQL on macOS (`localhost:5432`) using environment variables. Ensure idempotent database connectivity.
- Implement data models:
  - `Customer` (`id`, `first_name`, `last_name`, `email`, `phone`, `registration_date`)
  - `Service` (`id`, `name`, `type`, `status`, `customer_id`, `created_at`)
- Implement REST API endpoints with `/api/v1/` prefix:
  - `POST /api/v1/customers/` : Create customer.
  - `GET /api/v1/customers/` : List customers (with pagination and filtering).
  - `GET /api/v1/customers/{id}/` : Retrieve customer by ID.
  - `POST /api/v1/customers/{id}/services/` : Add a service for a customer.
  - `GET /api/v1/customers/{id}/services/` : List all services of a customer.
  - `GET /api/v1/services/{id}/` : Retrieve service by ID.
  - `PATCH /api/v1/services/{id}/status/` : Update service status (`active` / `suspended`).
- Comprehensive input validation, serializing, and error response formatting.

#### Testing Strategy (Django)
1. **Unit Tests**: Model field validation, string representations, default values.
2. **Serializer Tests**: Validation of email uniqueness, phone formatting, allowed service statuses.
3. **API Tests**: Testing HTTP status codes (200, 201, 400, 404) across all CRUD endpoints.
4. **Database Integration Tests**: Verification of ForeignKey cascade behavior and transactional integrity.
5. **Smoke Test**: Quick health check ensuring the API server boots and responds.

```bash
# Execution Command
cd backend && python manage.py test --verbosity=2

# Expected Output
# Running tests...
# test_create_customer (apps.customers.tests.test_api) ... ok
# test_create_service_for_customer (apps.services.tests.test_api) ... ok
# test_update_service_status (apps.services.tests.test_api) ... ok
# ----------------------------------------------------------------------
# Ran 18 tests in 0.852s
# OK
```

---

### Phase 3: Frontend Web Application (Next.js + TypeScript)
#### Scope & Implementation
- Initialize Next.js 14+ with App Router and TypeScript in `frontend/`.
- Configure Tailwind CSS, dark/light theme provider, and RTL/LTR internationalization (Persian / English).
- Build clean, reusable component architecture:
  - **Dashboard**: High-level metrics (total customers, total services, active vs. suspended).
  - **Customers List**: Searchable, paginated table of registered customers.
  - **Create Customer**: Validated form with immediate feedback.
  - **Customer Details**: View customer contact details and registered services.
  - **Customer Services**: Tabular view of services owned by this customer.
  - **Add Service**: Form to create and attach a service to a customer.
  - **Change Service Status**: Interactive toggle/dropdown to switch between `active` and `suspended`.
- Implement resilient UI states: Loading skeletons, error toasts, and empty states.

#### Testing Strategy (Next.js)
1. **Unit Tests**: Formatting helpers, i18n translation loaders, query-param parsers.
2. **Component Tests**: Jest + React Testing Library for customer forms, service cards, theme toggles.
3. **API Integration Tests**: Mocking Django API with MSW (Mock Service Worker) to test error states.
4. **Playwright E2E Tests**: Browser-level end-to-end user navigation flows.
5. **Smoke Test**: Verification that the Next.js bundle compiles with zero type errors.

```bash
# Execution Commands
cd frontend && npm test
cd frontend && npx playwright test

# Expected Output
# PASS src/components/CustomerForm.test.tsx
# PASS src/components/ServiceStatusToggle.test.tsx
# Test Suites: 8 passed, 8 total
# Tests:       24 passed, 24 total
# Snapshots:   0 total
# Time:        2.41 s
```

---

### Phase 4: Independent Go Microservice
#### Scope & Implementation
- Initialize Go module in `go-service/`.
- Implement `GET /health` handler:
  - Returns `{"status": "healthy"}` indicating Go runtime health.
  - Inspects query parameter `?service_id=<id>`.
  - When `service_id` is present, calls Django API (`GET /api/v1/services/{service_id}/`) to retrieve its status.
- Implement robust error handling:
  - Non-numeric or invalid ID -> `400 Bad Request`.
  - Service does not exist in Django -> `404 Not Found`.
  - Django API offline or unresponsive -> `502 Bad Gateway` / `503 Service Unavailable`.
- Clean logging and structured JSON responses.

#### Testing Strategy (Go)
1. **Unit Tests**: Query parameter parsing and status response serialization.
2. **HTTP Handler Tests**: Utilizing standard `net/http/httptest` to verify HTTP status codes.
3. **Django Client Tests**: Using mock HTTP servers to test timeout, 404, and network failure resilience.
4. **Smoke Test**: Verification of binary compilation and server startup.

```bash
# Execution Command
cd go-service && go test -v ./...

# Expected Output
# === RUN   TestHealthHandler_NoParam
# --- PASS: TestHealthHandler_NoParam (0.00s)
# === RUN   TestHealthHandler_WithValidServiceId
# --- PASS: TestHealthHandler_WithValidServiceId (0.01s)
# === RUN   TestHealthHandler_ServiceNotFound
# --- PASS: TestHealthHandler_ServiceNotFound (0.00s)
# === RUN   TestHealthHandler_InvalidParam
# --- PASS: TestHealthHandler_InvalidParam (0.00s)
# PASS
# ok      cloud-management-platform/go-service/internal/api 0.024s
```

---

### Phase 5: Additional PHP / Laravel Service
#### Scope & Implementation
- Initialize Laravel 11 application in `php-service/`.
- Configure `app/Services/Django/DjangoApiClient.php` using Laravel HTTP Client (`Http::withHeaders(...)`).
- Implement API controller endpoints:
  - `GET /api/v1/customers/{id}` : Fetches customer info from Django.
  - `GET /api/v1/customers/{id}/services` : Fetches services of a customer from Django.
  - `PATCH /api/v1/services/{id}/status` : Dispatches status change request to Django.
- Implement security and validation:
  - Input validation using Laravel Form Requests.
  - SQL Injection prevention (no direct DB access; clean parameter passing).
  - Prevention of unauthorized access between tenant data.
  - Graceful handling of upstream Django downtime.

#### Testing Strategy (Laravel)
1. **Unit Tests**: Form Request validation rules and DTO mappings.
2. **Feature Tests**: API endpoint assertions (`assertStatus`, `assertJsonStructure`).
3. **Django HTTP Client Tests**: Using `Http::fake()` to verify request headers, URLs, and failure responses.
4. **Smoke Test**: Artisan config and route caching validation.

```bash
# Execution Command
cd php-service && php artisan test

# Expected Output
# PASS  Tests\Unit\CustomerValidationTest
# ✓ customer id must be an integer
# PASS  Tests\Feature\DjangoIntegrationTest
# ✓ it can fetch customer details from django client
# ✓ it returns 404 when customer does not exist in django
# ✓ it successfully updates service status through django
# Tests:    6 passed (18 assertions)
# Duration: 0.22s
```

---

### Phase 6: Multi-Service Integration & End-to-End Scenario
#### Mandatory Integration Flow
A unified end-to-end verification scenario testing the full data lifecycle across all services:

```text
[Step 1: Create Customer]
      │
      ▼ (POST /api/v1/customers/ -> 201 Created, ID: 101)
[Step 2: Add Service for Customer]
      │
      ▼ (POST /api/v1/customers/101/services/ -> 201 Created, Service ID: 501, Status: "active")
[Step 3: Read Service Status via Go Service]
      │
      ▼ (GET http://localhost:8080/health?service_id=501 -> {"status": "healthy", "service_id": 501, "service_status": "active"})
[Step 4: Update Service Status via PHP Service]
      │
      ▼ (PATCH http://localhost:8001/api/v1/services/501/status -> Payload: {"status": "suspended"} -> 200 OK)
[Verification: Re-check via Go Service]
      ▼ (GET http://localhost:8080/health?service_id=501 -> {"status": "healthy", "service_id": 501, "service_status": "suspended"})
```

#### Execution Rule
> **IMPORTANT**:
> No test may be reported as successful without actual, verified execution and assertion passing.

---

### Phase 7: Infrastructure, Containerization & Nginx Gateway
- Author production-ready `Dockerfile` for each service (`frontend`, `backend`, `go-service`, `php-service`).
- Containerize PostgreSQL in `docker-compose.yml` with named volumes (`postgres_data`) for data preservation.
- Configure Nginx reverse proxy routing on port `80`:
  - `/` -> Next.js Frontend
  - `/api/v1/core/` -> Django Backend
  - `/api/v1/health` -> Go Service
  - `/api/v1/php/` -> PHP Service
- Verify idempotent startup (`docker compose up --build`).

---

### Phase 8: Final Review & Technical Interview Defense Preparation
- Perform full codebase linting and formatting.
- Review and verify all documentation against the working implementation.
- Prepare technical defense talking points:
  - Why Django was chosen as the sole database owner.
  - How inter-service contracts were maintained cleanly.
  - Handling of partial network failures and circuit breaking between microservices.
