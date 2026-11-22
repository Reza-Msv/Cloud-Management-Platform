# Cloud Management Platform (CMP)

A centralized, scalable, multi-tenant Cloud Management Platform designed to orchestrate cloud resources, provide customer service subscriptions, monitoring, and administrative governance.

---

## 1. Architectural Overview

The project is structured as a **Monorepo** comprising modular components designed for high scalability and separation of concerns:

- **Frontend (`frontend/`)**: Modern dashboard and client application built with **Next.js & TypeScript**.
- **Core Backend (`backend/`)**: Central business logic, domain model, authentication, and sole owner of the database, implemented with **Python & Django REST Framework**.
- **Primary Database**: **PostgreSQL** (installed locally on macOS for early development, containerized in later phases).
- **Independent High-Performance Service (`go-service/`)**: Concurrent task execution, cloud telemetry, metrics aggregation, and sync workers developed in **Go**. Communicates exclusively with the core backend via HTTP REST APIs.
- **Additional Backend Service (`php-service/`)**: Specialized reporting and webhook integration services built with **PHP & Laravel**. Communicates exclusively with the core backend via HTTP REST APIs.
- **Infrastructure (`infrastructure/`)**: Gateway configuration (**Nginx**) and container orchestration definitions (**Docker Compose**).
- **Documentation (`docs/`)**: Architecture diagrams, data schemas, and the multi-phase development roadmap.

```
                                 ┌─────────────────────────┐
                                 │   Frontend (Next.js)    │
                                 │       Port: 3000        │
                                 └────────────┬────────────┘
                                              │ HTTP / JSON
                                              ▼
┌─────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│   Go Service (Worker)   │◄────►│   Core Backend (Django) │◄────►│   PHP Service (Laravel) │
│       Port: 8080        │ HTTP │       Port: 8000        │ HTTP │       Port: 8001        │
└─────────────────────────┘      └────────────┬────────────┘      └─────────────────────────┘
                                              │ Direct SQL (Owner)
                                              ▼
                                 ┌─────────────────────────┐
                                 │  PostgreSQL (Port 5432) │
                                 └─────────────────────────┘
```

> **Data Ownership Rule**: Django is the **sole owner** of the PostgreSQL database schema and migrations. Independent services (`go-service` and `php-service`) NEVER connect directly to PostgreSQL; all cross-service communication occurs over authenticated HTTP REST APIs.

---

## 2. Monorepo Repository Structure

```text
cloud-management-platform/
├── backend/                  # Core Backend (Django REST Framework + PostgreSQL)
├── frontend/                 # Frontend Dashboard (Next.js + TypeScript)
├── go-service/               # High-concurrency Service (Go)
├── php-service/              # Auxiliary Service (PHP + Laravel)
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
- macOS with local PostgreSQL installed (configured on port `5432`)
- Make utility

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

Detailed architectural blueprints and design specifications are located in the `docs/` directory:

- [docs/architecture.md](docs/architecture.md): Detailed system architecture, communication patterns, and service responsibilities.
- [docs/database-design.md](docs/database-design.md): Entity relationships, Customer-Service domain model, and database ownership principles.
- [docs/development-roadmap.md](docs/development-roadmap.md): Phased roadmap detailing upcoming implementation steps.

---

## 5. Current Status

- **Phase 1 (Completed)**: Repository structure, architectural documentation, environment variable templates, and Git initialization.
- **Phase 2 (Upcoming)**: Django REST Framework project scaffolding, PostgreSQL model definitions (Customer, Service, Subscription), and core CRUD endpoints.
