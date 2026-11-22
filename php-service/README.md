# Additional Backend Service (PHP + Laravel)

## 1. Overview
The `php-service` is an auxiliary microservice within the Cloud Management Platform (CMP). It specializes in:
- Auxiliary business reporting, export generation (PDF/CSV/Excel), and scheduled invoicing documents.
- Webhook endpoints for third-party billing providers and legacy integrations.
- Asynchronous notification dispatcher routines.

## 2. Technology Stack
- **Language**: PHP 8.2+
- **Framework**: Laravel 11+
- **Package Manager**: Composer
- **HTTP Client**: Guzzle / Laravel HTTP Client

## 3. Directory Layout (Architecture)
The service follows modern Laravel conventions structured for API-driven microservices:

```text
php-service/
├── app/
│   ├── Http/
│   │   ├── Controllers/      # Incoming HTTP request handlers
│   │   └── Middleware/       # Inter-service authentication and request logging
│   ├── Services/
│   │   └── Django/           # HTTP client service dedicated to Django REST API calls
│   └── Models/               # Transient data transfer models / DTOs
├── config/                   # Service configuration files
├── routes/                   # API route definitions (api.php, console.php)
├── tests/                    # Feature and Unit test suites
├── .env.example              # Template for Laravel environment variables
└── README.md                 # Service documentation
```

## 4. Communication Pattern & Database Isolation
> **CRITICAL RULE**:
> `php-service` does **NOT** connect directly to the primary PostgreSQL database.
>
> It does not maintain database migrations for core business entities. All queries for customers, subscriptions, or cloud service quotas must be requested from the **Core Backend (Django)** via HTTP REST API through `app/Services/Django/`.

## 5. Local Setup (Scheduled for Phase 5)
In Phase 5, this directory will be initialized with Composer, Laravel framework scaffolding, API route setup, and the Django REST API client integration.
