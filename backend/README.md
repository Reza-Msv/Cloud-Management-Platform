# Core Backend Service (Django REST Framework)

## 1. Overview
The Core Backend is the central authority of the Cloud Management Platform (CMP). It is responsible for:
- Managing core domain business logic.
- Providing authenticated RESTful APIs for the Next.js frontend.
- Serving as the **sole owner** of the PostgreSQL database (managing migrations, schema integrity, and transactions).
- Exposing secure internal endpoints for auxiliary services (`go-service` and `php-service`).

## 2. Technology Stack
- **Language**: Python 3.12+
- **Framework**: Django & Django REST Framework (DRF)
- **Database**: PostgreSQL (Port 5432)
- **Database Driver**: `psycopg` (v3) or `psycopg2-binary`
- **Authentication**: JWT / Session / Internal Service Token

## 3. Directory Layout (Architecture)
The backend follows a modular Django application pattern:

```text
backend/
├── apps/                     # Modular Django applications
│   ├── authentication/       # User management, roles, and JWT/token auth
│   ├── customers/            # Customer organization and profile models
│   ├── services/             # Cloud service catalog, instances, and subscriptions
│   └── common/               # Shared utilities, base models, exceptions
├── config/                   # Django project configuration (settings, urls, wsgi, asgi)
├── requirements/             # Segmented pip dependency manifests (base, local, prod)
├── scripts/                  # Management scripts (seeds, db checks, migration helpers)
├── tests/                    # Integration and end-to-end test suites
├── .env.example              # Template for environment configuration
└── README.md                 # Service documentation
```

## 4. Database Ownership Rule
> **IMPORTANT**:
> No external microservice or frontend connects directly to PostgreSQL. All interactions with data must pass through Django's models, querysets, serializers, and permission layers to maintain data consistency and auditability.

## 5. Local Setup (Scheduled for Phase 2)
In Phase 2, this service will be initialized with a virtual environment, Django project scaffolding, PostgreSQL database configuration, and initial domain models for `Customer` and `Service`.
