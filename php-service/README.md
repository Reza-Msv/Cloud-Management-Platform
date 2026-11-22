# Additional PHP Service (Laravel)

## 1. Overview
The `php-service` is an independent module within the Cloud Management Platform (CMP). It provides an operator interface to:
- Look up customer account records (`GET /api/v1/customers/{id}/`).
- Inspect cloud services attached to that customer (`GET /api/v1/customers/{id}/services/`).
- Safely transition service status between `active` and `suspended` (`PATCH /api/v1/services/{id}/status/`).
- Enforce strict database isolation: **PHP never connects directly to PostgreSQL** and routes all operations through Django's REST APIs.

## 2. Technology Stack
- **Language**: PHP 8.2+ (tested on PHP 8.6.0)
- **Framework**: Laravel 11+
- **HTTP Client**: Laravel HTTP Client (`Illuminate\Support\Facades\Http`) / Guzzle
- **Testing**: PHPUnit 12+ / Laravel Feature Testing

## 3. Directory Layout

```text
php-service/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       └── CustomerServiceController.php   # Handles lookup and status mutation actions
│   └── Services/
│       └── Django/
│           ├── DjangoApiClient.php             # Context-aware HTTP client calling Django REST API
│           └── DjangoApiException.php          # Custom exception with clean HTTP status codes
├── config/
│   └── django.php                              # Django API connection & credential configuration
├── resources/
│   └── views/
│       └── customers/
│           └── index.blade.php                 # Responsive Blade UI adhering to CMP brand identity
├── routes/
│   └── web.php                                 # Web routes (customers.index, services.updateStatus)
├── tests/
│   └── Feature/
│       └── CustomerServiceTest.php             # Feature test suite with HTTP mocking
├── composer.json
├── .env.example
└── README.md
```

## 4. Endpoints & Routes

| Method | URI | Route Name | Action | Description |
|---|---|---|---|---|
| `GET` | `/` | `customers.index` | `CustomerServiceController@index` | Customer ID lookup & services list |
| `PATCH` | `/services/{id}/status` | `services.updateStatus` | `CustomerServiceController@updateStatus` | Toggle service between active/suspended |

## 5. Security & Isolation Architecture

1. **Database Isolation**:
   - Zero PostgreSQL drivers or direct database connection configurations.
   - Django remains the single source of truth for business logic and data persistence.
2. **Tenant & Relationship Integrity**:
   - Before dispatching a status change to Django, PHP validates that the service ID exists and strictly belongs to the currently selected customer. If an ID mismatch occurs, the request is aborted with an error to prevent cross-customer tampering.
3. **CSRF & Form Security**:
   - All state-changing operations require Laravel's `@csrf` token and `@method('PATCH')`.
   - All rendered variables use Blade's `{{ e(...) }}` syntax to ensure complete protection against XSS.

## 6. Environment Variables

| Variable | Default | Description |
|---|---|---|
| `APP_NAME` | `Cloud Management PHP` | Application display name |
| `APP_ENV` | `local` | Application environment (`local`, `production`) |
| `APP_KEY` | *(Generated)* | 32-character application encryption key |
| `APP_URL` | `http://localhost:8001` | Service public URL |
| `DJANGO_API_BASE_URL` | `http://localhost:8000/api/v1` | Core Django REST API base URL |
| `DJANGO_API_TIMEOUT` | `10` | Timeout in seconds for HTTP requests to Django |
| `DJANGO_AUTH_USERNAME` | `""` | Integration account username (e.g. `admin_user`) |
| `DJANGO_AUTH_PASSWORD` | `""` | Integration account password |

## 7. Local Execution Commands

```bash
cd php-service

# Install dependencies
composer install --no-audit

# Run tests
php artisan test

# Start local server
php artisan serve --host=127.0.0.1 --port=8001
```
