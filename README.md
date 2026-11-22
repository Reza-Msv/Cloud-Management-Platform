# Cloud Management Platform (CMP)

A clean, modular, and defensible Cloud Management Platform designed as a multi-service **Monorepo** for a technical Take-Home Assignment.

---

## 1. Architectural Overview

The project is structured to demonstrate clean separation of concerns, robust inter-service communication over HTTP REST APIs, and strict database ownership:

- **Frontend (`frontend/`)**: Modern SaaS dashboard built with **Next.js & TypeScript** (featuring responsive design, Dark/Light modes, Persian/English i18n, and RTL/LTR layout support).
- **Core Backend (`backend/`)**: Central business domain, REST APIs (`/api/v1/`), and **sole owner of the PostgreSQL database**, built with **Python & Django REST Framework**.
- **Primary Database**: **PostgreSQL** (developed locally on macOS, containerized via Docker Compose in later phases).
- **Independent Go Service (`go-service/`)**: Independent microservice in **Go** providing a runtime `/health` endpoint with `service_id` query support that inspects service status via Django REST APIs.
- **Additional Service (`php-service/`)**: Independent microservice built with **PHP & Laravel** performing customer lookups and service status updates using Laravel HTTP Client.
- **Infrastructure (`infrastructure/`)**: Reverse proxy gateway (**Nginx**) and container orchestration definitions (**Docker Compose**).
- **Documentation (`docs/`)**: Architecture blueprints, data design, and phased development roadmap with comprehensive test strategies.

```
                                 ┌─────────────────────────┐
                                 │   Frontend (Next.js)    │
                                 │       Port: 3000        │
                                 └────────────┬────────────┘
                                              │ HTTP REST / JSON
                                              ▼
┌─────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│   Go Service (Health)   │◄────►│   Core Backend (Django) │◄────►│   PHP Service (Laravel) │
│       Port: 8080        │ HTTP │       Port: 8000        │ HTTP │       Port: 8001        │
└─────────────────────────┘      └────────────┬────────────┘      └─────────────────────────┘
                                              │ Direct SQL (Owner)
                                              ▼
                                 ┌─────────────────────────┐
                                 │  PostgreSQL (Port 5432) │
                                 └─────────────────────────┘
```

> **Data Ownership Rule**: Django is the **sole and exclusive owner** of the PostgreSQL database schema and migrations. Independent services (`go-service` and `php-service`) NEVER connect directly to PostgreSQL; all cross-service operations occur over HTTP REST APIs.

---

## 2. Monorepo Repository Structure

```text
cloud-management-platform/
├── backend/                  # Core Backend (Django REST Framework + PostgreSQL)
├── frontend/                 # Frontend Dashboard (Next.js + TypeScript)
├── go-service/               # Independent Service (Go)
├── php-service/              # Additional Service (PHP + Laravel)
├── infrastructure/           # Deployment & Gateway configurations
│   ├── docker/               # Dockerfiles and container configurations
│   └── nginx/                # Reverse proxy and ingress definitions
├── docs/                     # Architectural, database, and roadmap documentation
│   ├── architecture.md
│   ├── database-design.md
│   └── development-roadmap.md
├── scripts/                  # Automation and operational maintenance scripts
├── .env.example              # Monorepo global environment template
├── .gitignore                # Global ignore rules
├── docker-compose.yml        # Orchestration placeholder for future phases
├── Makefile                  # Standardized cross-service development commands
└── README.md                 # Primary project documentation
```

---

## 3. Getting Started (Phase 1)

### Prerequisites
- Git
- macOS with local PostgreSQL 18+ installed and running (configured on port `5432`)
- Make utility

### Local PostgreSQL Setup
- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `cloud_management_db`
- **User**: `cloud_management_user`
- Connection credentials must be populated in `backend/.env` without committing secrets.

### Environment Setup
Each service maintains its own `.env.example` template. You can generate local `.env` files using Make:

```bash
make setup-env
```

Or manually copy individual template files:
```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp go-service/.env.example go-service/.env
cp php-service/.env.example php-service/.env
```

*Note: Update the values in `.env` files with your local credentials. Real `.env` files are ignored by Git.*

---

## 4. Documentation Index

Detailed architectural specifications and design blueprints are located in the `docs/` directory:

- [docs/architecture.md](docs/architecture.md): System architecture, service boundaries, and inter-service HTTP communication contracts.
- [docs/database-design.md](docs/database-design.md): Customer 1 ---- N Service data model, schema specification, and Django database ownership.
- [docs/development-roadmap.md](docs/development-roadmap.md): Sequential roadmap including integrated test suites and execution commands for each service.

---

## 5. Development & Running Services

### Terminal 1 — Django Backend
```bash
cd backend
python manage.py runserver localhost:8000
```

### Terminal 2 — Go Microservice
```bash
cd go-service
go run ./cmd/server
```

### Terminal 3 — Next.js Frontend
```bash
cd frontend
pnpm dev
```

### Terminal 4 — PHP Service (Laravel)
```bash
cd php-service
php artisan serve --host=127.0.0.1 --port=8001
```

---

## 6. Current Status

- **Phase 1 (Completed)**: Monorepo structure, aligned architecture documentation, environment variable templates, and Git initialization.
- **Phase 2 (Completed)**: Django REST Framework setup, PostgreSQL model definitions (`Customer` & `Service`), CRUD REST APIs, session/basic authentication, and automated test suite.
- **Phase 3 (Completed)**: Next.js Frontend SaaS Dashboard (RTL/LTR, Persian/English i18n, dark/light theme, and customer/service management).
- **Phase 4 (Completed)**: Complete Go microservice with independent `/health` endpoint, Django REST API client integration, Next.js server-side route proxy (`/api/go/health`), and real-time dashboard System Health widget.
- **Phase 5 (Completed)**: Complete PHP (Laravel 11+) customer inquiry & service management module, Django REST API client integration, relationship security validation, and automated test suite.
