# System Architecture Specification

## 1. Executive Summary
The **Cloud Management Platform (CMP)** is an enterprise-grade cloud management system designed as a cohesive **Monorepo**. It coordinates multi-cloud resource provisioning, customer subscriptions, service quotas, monitoring metrics, and billing workflows.

The system emphasizes high modularity, distinct separation of concerns, and rigorous data consistency by establishing **Django REST Framework** as the central brain and sole owner of the database.

---

## 2. High-Level System Architecture Diagram

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Layer"]
        UI["Frontend Web App\n(Next.js + TypeScript)\nPort: 3000"]
    end

    subgraph IngressLayer ["Ingress & Gateway Layer"]
        Gateway["Nginx Gateway / Reverse Proxy\nPort: 80 / 443"]
    end

    subgraph CoreDomainLayer ["Core Domain Layer (Single Source of Truth)"]
        DjangoCore["Core Backend (Python / Django REST Framework)\nPort: 8000\n- Authentication & Permissions\n- Customer Lifecycle & Subscriptions\n- Resource Catalogs & Quotas\n- Database Migrations & Integrity"]
    end

    subgraph AuxiliaryServices ["Independent Microservices Layer"]
        GoWorker["Go Independent Service\nPort: 8080\n- Cloud Telemetry Polling\n- High-Concurrency Sync\n- Metric Collection"]
        PHPAux["PHP/Laravel Service\nPort: 8001\n- Report Generation & Exports\n- Webhook & Invoicing Handlers"]
    end

    subgraph PersistenceLayer ["Persistence Layer"]
        Postgres[("Primary PostgreSQL Database\nPort: 5432\n(Owned exclusively by Django)")]
    end

    UI --> Gateway
    Gateway -->|Dashboard & User Auth| DjangoCore
    Gateway -->|Real-time Metrics| GoWorker
    Gateway -->|Document Exports| PHPAux

    GoWorker -->|HTTP REST API\n(Internal Key / Service Token)| DjangoCore
    PHPAux -->|HTTP REST API\n(Internal Key / Service Token)| DjangoCore

    DjangoCore -->|Direct SQL / Migrations / ORM| Postgres
```

---

## 3. Service Roles and Boundaries

### 3.1 Frontend (`frontend/`)
- **Technology**: Next.js 14+ (App Router), TypeScript, Tailwind CSS.
- **Responsibilities**:
  - Providing dynamic customer and administration dashboards.
  - Interactive forms for provisioning cloud resources, ordering services, and viewing billing.
  - Client-side token storage, responsive layouts, and visualization of metrics.
- **Boundary**: Does not hold any business rules; all actions are validated and processed by backend APIs.

### 3.2 Core Backend (`backend/`)
- **Technology**: Python 3.12+, Django, Django REST Framework (DRF).
- **Responsibilities**:
  - **Single Source of Truth**: Houses all core domain entities (`Customer`, `Service`, `Subscription`, `Invoice`, `AuditLog`).
  - **Database Ownership**: Sole authority managing PostgreSQL migrations, relational schema, transactions, and row-level security.
  - **Authentication & RBAC**: Issues JWTs for users and enforces role-based access control.
  - **Internal Service APIs**: Exposes secure endpoints for `go-service` and `php-service` with internal API token validation.

### 3.3 Independent High-Concurrency Service (`go-service/`)
- **Technology**: Go (Golang 1.22+), standard `net/http` / Chi router.
- **Responsibilities**:
  - High-throughput asynchronous polling of cloud provider APIs.
  - Collection, aggregation, and streaming of instance health metrics and usage logs.
  - Real-time event dispatching.
- **Data Isolation**: **NEVER** connects directly to PostgreSQL. Must query or mutate customer/service states via Django's internal REST API.

### 3.4 Additional Backend Service (`php-service/`)
- **Technology**: PHP 8.2+, Laravel 11.
- **Responsibilities**:
  - Generation of complex formatted reports, usage summaries, and PDF invoices.
  - Webhook ingestion from external third-party payment gateways.
  - Specialized auxiliary batch processing.
- **Data Isolation**: **NEVER** connects directly to PostgreSQL. Always delegates data reads and state updates through Django REST APIs.

### 3.5 Infrastructure & Ingress (`infrastructure/`)
- **Nginx**: Ingress reverse proxy routing traffic to appropriate services based on path prefixes (`/`, `/api/v1/core/`, `/api/v1/sync/`, `/api/v1/reports/`).
- **Docker Compose**: Containerized multi-service orchestration for local development and integration testing (introduced in Phase 7).

---

## 4. Inter-Service Communication Contract

1. **Protocol**: HTTP/1.1 or HTTP/2 using JSON payloads over RESTful standards.
2. **Authentication**:
   - Client-to-Backend: Bearer JWT in the `Authorization` header.
   - Service-to-Service: Shared secret / HMAC token in `X-Internal-Service-Key` header with IP whitelisting.
3. **Consistency**:
   - Because Django owns PostgreSQL, any updates initiated by Go or PHP (e.g., "instance provisioned", "metric threshold exceeded") are submitted to Django endpoints, ensuring transactional integrity, audit logging, and signal triggers.

---

## 5. Git Branching and Workflow Strategy

To maintain a stable and predictable delivery lifecycle across the monorepo, the following Git branching model is adopted:

- **`main`**:
  - Protected branch.
  - Contains production-ready, thoroughly tested, and tagged releases.
  - Direct commits are prohibited; merges occur solely via Pull Requests from `release/*` or `hotfix/*`.
- **`develop`**:
  - Integration branch for ongoing development.
  - All new features and service scaffolds merge here.
- **`feature/<service>-<feature-name>`**:
  - Branch off: `develop`
  - Merge into: `develop`
  - Examples: `feature/backend-customer-model`, `feature/frontend-auth-flow`, `feature/go-metrics-worker`.
- **`bugfix/<service>-<description>`**:
  - Branch off: `develop`
  - Merge into: `develop`
- **`release/vX.Y.Z`**:
  - Branch off: `develop`
  - Merge into: `main` (with release tag) and back into `develop`.
- **`hotfix/<issue>`**:
  - Branch off: `main`
  - Merge into: `main` and `develop`.
