# PHP / Laravel Service (Customer & Service Portal)

## 1. Overview
The PHP service is an independent customer inquiry and service management portal built with Laravel 11. It allows users to search customer profiles, view attached cloud services, and dispatch status updates (`active` vs `suspended`) to Django.

---

## 2. Technology Stack & Key Dependencies
- **Language**: PHP 8.4+
- **Framework**: Laravel 11.x
- **HTTP Client**: Guzzle / Laravel `Http` facade
- **Container**: Minimal Alpine Linux CLI container with `php:8.4-cli-alpine`

---

## 3. Directory Layout
```text
php-service/
├── app/
│   ├── Http/Controllers/  # CustomerServiceController
│   └── Services/Django/   # DjangoApiClient & Exception handling
├── resources/views/       # Blade templates (customers/index.blade.php)
├── routes/                # Web routes (web.php)
├── tests/                 # Feature and unit test suites
├── Dockerfile             # Container definition
├── composer.json          # Composer dependency manifest
└── README.md
```

---

## 4. Security & Architecture Rules
- **No Direct Database Access**: Never connects to PostgreSQL directly; all data operations route via Django REST APIs.
- **Relationship Integrity**: Enforces strict customer-to-service validation before sending PATCH requests to Django, blocking cross-customer manipulation attempts.

---

## 5. Local Execution & Testing

```bash
# Install dependencies
composer install

# Configure environment
cp .env.example .env
php artisan key:generate

# Start server locally
php artisan serve --host=127.0.0.1 --port=8001

# Run test suite
php artisan test
```
