# Independent Go Service

## 1. Overview
The `go-service` is an independent, lightweight, high-performance microservice within the Cloud Management Platform (CMP). It handles:
- Asynchronous resource synchronization and cloud telemetry ingestion.
- High-concurrency scheduled polling of virtual instances and storage metrics.
- Background worker execution for compute-heavy or real-time streaming operations.

## 2. Technology Stack
- **Language**: Go (Golang 1.22+)
- **HTTP Routing**: Chi / Gin / Standard `net/http`
- **Architecture**: Standard Go Project Layout (`cmd/`, `internal/`, `pkg/`)

## 3. Directory Layout (Architecture)
The service follows the canonical Standard Go Project Layout to ensure clean separation between entrypoints and internal domain logic:

```text
go-service/
├── cmd/
│   └── server/               # Application entrypoint (main.go location)
├── internal/                 # Private code internal to this service
│   ├── api/                  # HTTP handlers, routers, and middlewares
│   ├── client/
│   │   └── django/           # HTTP REST client to communicate with Django Core Backend
│   ├── config/               # Configuration parser and environment loader
│   ├── model/                # Internal data structures and DTOs
│   └── service/              # Core business processing and worker routines
├── pkg/                      # Public library code safe for sharing
├── .env.example              # Template for Go service environment variables
└── README.md                 # Service documentation
```

## 4. Communication Pattern & Database Isolation
> **CRITICAL RULE**:
> `go-service` does **NOT** connect directly to the PostgreSQL database.
>
> All state changes, customer information lookups, and cloud service registrations must be dispatched via HTTP REST API calls to the **Core Backend (Django)** through `internal/client/django/`.

## 5. Local Setup (Scheduled for Phase 4)
In Phase 4, this directory will be initialized with `go mod init`, configuration bootstrap, the Django HTTP REST client, and concurrent background worker pipelines.
