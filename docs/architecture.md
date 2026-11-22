# System Architecture Specification

## 1. Executive Summary & Take-Home Assignment Scope
The **Cloud Management Platform (CMP)** is designed as a focused, realistic, and defensible **Monorepo** for a Senior Technical Assessment / Take-Home Assignment.

The core objective is demonstrating clean software architecture, distinct separation of concerns, robust inter-service HTTP communication, and disciplined database ownership—without unnecessary enterprise bloat (such as complex billing engines, telemetry pipelines, or multi-tenant orchestration).

---

## 2. System Architecture Diagram

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Layer"]
        UI["Frontend Web App\n(Next.js + TypeScript)\nPort: 3000\n- RTL / LTR & i18n (FA / EN)\n- Dark / Light Mode\n- Responsive SaaS Dashboard"]
    end

    subgraph IngressLayer ["Ingress & Gateway Layer (Phase 7)"]
        Gateway["Nginx Reverse Proxy\nPort: 80 / 443"]
    end

    subgraph CoreDomainLayer ["Core Domain Layer (Single Source of Truth)"]
        DjangoCore["Core Backend (Python / Django REST Framework)\nPort: 8000\n- Primary Business Logic\n- REST APIs: /api/v1/\n- Authentication & Permissions\n- Customer & Service Management\n- Database Migrations & Validation"]
    end

    subgraph AuxiliaryServices ["Independent Microservices Layer"]
        GoService["Go Independent Service\nPort: 8080\n- GET /health\n- Query Param: ?service_id=\n- HTTP Client for Django API"]
        PHPService["PHP / Laravel Service\nPort: 8001\n- Customer Lookup & Services List\n- Service Status Mutation\n- Laravel HTTP Client for Django API"]
    end

    subgraph PersistenceLayer ["Persistence Layer"]
        Postgres[("Primary PostgreSQL Database\nPort: 5432\n(Owned exclusively by Django)")]
    end

    UI -->|HTTP REST / JSON| DjangoCore
    UI -.->|Via Gateway in Phase 7| Gateway
    Gateway -.-> DjangoCore
    Gateway -.-> GoService
    Gateway -.-> PHPService

    GoService -->|HTTP REST Client\n(GET /api/v1/services/{id}/)| DjangoCore
    PHPService -->|Laravel HTTP Client\n(GET / PATCH /api/v1/...)| DjangoCore

    DjangoCore -->|Direct SQL / Migrations / ORM| Postgres
```

---

## 3. Core Architectural Rules

1. **Single Database Owner**:
   - **Django** is the **sole owner** of the PostgreSQL database.
   - All migrations, table definitions, foreign key constraints, and database queries are strictly executed through Django.
2. **Strict Database Isolation for Auxiliary Services**:
   - **Neither Go nor PHP connects directly to PostgreSQL**.
   - Both Go and PHP communicate exclusively with Django via HTTP REST API (`/api/v1/`).
3. **Frontend API Consumer**:
   - The Next.js frontend interacts directly with Django's REST APIs for all customer and service operations.

---

## 4. Service Roles & Boundaries

### 4.1 Core Backend (`backend/`)
- **Technology**: Python 3.12+, Django REST Framework (DRF), PostgreSQL.
- **Responsibilities**:
  - **Single Source of Truth**: Manages customer profiles and cloud services.
  - **Database Migrations & Schema**: Sole maintainer of database integrity.
  - **REST API Endpoints (`/api/v1/`)**:
    - `POST /api/v1/customers/` : Create new Customer.
    - `GET /api/v1/customers/` : List all Customers (with pagination/filtering).
    - `GET /api/v1/customers/{id}/` : Retrieve Customer details by ID.
    - `POST /api/v1/customers/{id}/services/` : Add a Service for a specific Customer.
    - `GET /api/v1/customers/{id}/services/` : List all Services belonging to a Customer.
    - `GET /api/v1/services/{id}/` : Retrieve Service details by ID.
    - `PATCH /api/v1/services/{id}/status/` : Update Service status (`active` / `suspended`).
  - **Validation & Security**: Input validation, custom exception handlers, authentication, and authorization.

### 4.2 Frontend (`frontend/`)
- **Technology**: Next.js 14+ (App Router), TypeScript, Tailwind CSS.
- **Responsibilities**:
  - Clean, component-based SaaS Dashboard.
  - **Key Pages**:
    1. Dashboard (Summary cards: total customers, services, active/suspended ratios).
    2. Customers List (Search, filter, pagination).
    3. Create Customer Form (Client-side validation).
    4. Customer Details View (Contact details, registered date).
    5. Customer Services View (List of services owned by this customer).
    6. Add Service Form (Name, type selection, initial status).
    7. Change Service Status Action (Toggle between `active` and `suspended`).
  - **UI Capabilities**:
    - Full Responsive Design (Mobile / Tablet / Desktop).
    - Loading & Skeleton States for asynchronous fetches.
    - User-friendly Error States & Toast Notifications.
    - Dark / Light Theme switching.
    - Bilingual Support: Persian (FA) & English (EN) with RTL / LTR layout adaptation.

### 4.3 Independent Go Service (`go-service/`)
- **Technology**: Go (Golang 1.22+), standard `net/http` / Chi.
- **Responsibilities**:
  - Lightweight, high-performance independent microservice.
  - Exposes `GET /health`:
    - Returns runtime operational status of the Go service itself (`"status": "healthy"`).
    - Supports optional query parameter: `?service_id=<id>`.
    - If `service_id` is supplied, calls Django REST API (`GET /api/v1/services/{id}/`) to inspect that service's status.
  - **Error Handling**:
    - Invalid ID format -> `400 Bad Request`.
    - Service Not Found in Django -> `404 Not Found`.
    - Django API unreachable or timing out -> `502 Bad Gateway` / `503 Service Unavailable`.
  - **Sample Output**:
    ```json
    {
      "status": "healthy",
      "service_id": 125,
      "service_status": "active"
    }
    ```
  - *Out of Scope*: Background worker pools, telemetry polling, metrics aggregation.

### 4.4 Additional Service (`php-service/`)
- **Technology**: PHP 8.2+, Laravel 11.
- **Responsibilities**:
  - Independent service acting as an API consumer/orchestrator using **Laravel HTTP Client**.
  - **Endpoints / Actions**:
    - Retrieve Customer by ID -> Forwarded to Django.
    - Display Customer Information.
    - Retrieve Services belonging to Customer -> Forwarded to Django.
    - Change Service Status (`active` / `suspended`) -> Forwarded to Django.
  - **Validation & Security**:
    - Rigorous input validation using Laravel Form Requests.
    - Consistent API error handling (propagating Django errors cleanly).
    - SQL Injection prevention (no raw queries; communicates via HTTP).
    - Unauthorized access prevention across tenant/customer data.
  - *Out of Scope*: Invoice generation, PDF/CSV reporting, payment gateways, webhooks.

### 4.5 Infrastructure & Reverse Proxy (`infrastructure/`)
- **PostgreSQL**: Hosted locally on macOS during Phase 1–6; containerized in Phase 7.
- **Nginx & Docker Compose**: Configured in Phase 7 for multi-container orchestration.

---

## 5. Git Branching & Workflow

- **`main`**: Production-ready, fully tested codebase.
- **`develop`**: Central integration branch for all completed features.
- **`feature/<service>-<feature-name>`**: Dedicated short-lived feature branches (e.g., `feature/django-customer-api`, `feature/go-health-endpoint`, `feature/frontend-i18n`).
- **`bugfix/<service>-<issue>`**: Bug fix branches.
