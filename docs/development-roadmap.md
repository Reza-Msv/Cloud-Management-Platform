# Development Roadmap

## Project Progression Matrix

This roadmap outlines the systematic development lifecycle for the **Cloud Management Platform (CMP)** monorepo across all phases.

---

### Phase 1: Repository Architecture, Base Structure & Documentation (CURRENT PHASE)
- [x] Monorepo repository structuring (`frontend`, `backend`, `go-service`, `php-service`, `infrastructure`, `docs`, `scripts`).
- [x] Baseline environment configuration templates (`.env.example` in root and each sub-service).
- [x] Initial Docker Compose & Makefile scaffolding.
- [x] Comprehensive architectural, database domain, and roadmap documentation in `docs/`.
- [x] Git repository initialization with strictly configured `.gitignore` (ignoring `.env` and runtime caches).
- [x] Zero business logic, zero scaffolding of frameworks, zero package installations (preserving pure Phase 1 boundary).

---

### Phase 2: Core Backend (Django + DRF) & Database Schema
- [ ] Initialize Python virtual environment and configure Django & Django REST Framework.
- [ ] Connect Django to local PostgreSQL on macOS (`localhost:5432`).
- [ ] Implement `Customer` domain model and migrations (`apps/customers/`).
- [ ] Implement `Service`, `Subscription`, and `ServiceInstance` domain models (`apps/services/`).
- [ ] Configure JWT authentication and user role-based permissions (`apps/authentication/`).
- [ ] Build core REST API endpoints:
  - Customer registration, profile management, and status updates.
  - Service catalog listing, subscription ordering, and instance status retrieval.
  - Internal endpoints protected by `INTERNAL_SERVICE_API_KEY` for Go and PHP service interactions.
- [ ] Unit and integration tests for Django models and serializers.

---

### Phase 3: Frontend Foundation (Next.js + TypeScript)
- [ ] Initialize Next.js with TypeScript and App Router in `frontend/`.
- [ ] Configure Tailwind CSS, iconography, and responsive design tokens.
- [ ] Build API client layer connecting to Django core backend.
- [ ] Implement Authentication flows (Login, Register, Session context with NextAuth/JWT).
- [ ] Develop Customer Dashboard:
  - Services catalog grid & subscription request workflow.
  - Active cloud instances and status indicators.
- [ ] Develop Admin Portal:
  - Customer directory, tier management, and service catalog administration.

---

### Phase 4: Independent Go Microservice
- [ ] Initialize Go module (`go mod init`) and standard directory layout in `go-service/`.
- [ ] Implement configuration loader reading `go-service/.env`.
- [ ] Build robust HTTP REST client (`internal/client/django`) with retry logic and token authentication.
- [ ] Implement telemetry polling routines and worker pool (`internal/service/worker.go`).
- [ ] Expose health check and telemetry status endpoints on port `8080`.
- [ ] Validate synchronization flow: Go service polls mock cloud telemetry -> pushes state updates to Django API.

---

### Phase 5: Additional PHP/Laravel Service
- [ ] Initialize Laravel framework in `php-service/`.
- [ ] Configure environment and service providers.
- [ ] Build HTTP client service (`app/Services/Django`) to fetch customer usage metrics from Django API.
- [ ] Implement PDF and CSV report generation for billing statements and resource audit logs.
- [ ] Implement webhook receiver for external payment processing events.
- [ ] Expose reporting endpoints on port `8001`.

---

### Phase 6: Inter-Service Integration & End-to-End Testing
- [ ] Comprehensive integration testing across the four services:
  - Next.js UI -> Django Core API -> PostgreSQL
  - Go Service -> Django Core Internal API
  - PHP Service -> Django Core Internal API
- [ ] Error handling, idempotency, and timeout resilience testing across network boundaries.
- [ ] Automated end-to-end API test suites using Newman/Postman or Pytest integration tests.

---

### Phase 7: Infrastructure, Nginx Gateway & Docker Compose
- [ ] Author production-grade `Dockerfile` for each service:
  - `infrastructure/docker/Dockerfile.frontend` (Multi-stage Node)
  - `infrastructure/docker/Dockerfile.backend` (Python slim + Gunicorn)
  - `infrastructure/docker/Dockerfile.go` (Distroless/Alpine Go binary)
  - `infrastructure/docker/Dockerfile.php` (PHP-FPM / Octane)
- [ ] Configure PostgreSQL service in `docker-compose.yml` with persistent volume management.
- [ ] Configure Nginx reverse proxy in `infrastructure/nginx/conf.d/default.conf` to unify routing on port `80`:
  - Web UI: `/`
  - Core API: `/api/v1/core/`
  - Go Telemetry: `/api/v1/sync/`
  - PHP Reports: `/api/v1/reports/`
- [ ] Validate full single-command spin-up (`docker compose up --build`).

---

### Phase 8: CI/CD, Monitoring & Production Deployment
- [ ] GitHub Actions CI pipeline:
  - Linting & type checking (TypeScript `tsc`, Python `flake8`/`black`, Go `golangci-lint`, PHP `phpstan`).
  - Automated test execution across all services.
- [ ] Container image vulnerability scanning.
- [ ] Observability setup (structured logging, Prometheus metrics, and OpenTelemetry tracing).
- [ ] Production environment deployment configuration.
