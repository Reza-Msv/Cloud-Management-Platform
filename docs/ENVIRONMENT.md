# Cloud Management Platform — Environment Configuration Guide

This document details every environment variable used across the Cloud Management Platform.

---

## 1. Global & Orchestration Variables (Root & Docker Compose)

Configured at root `.env` or passed to Docker Compose:

| Variable | Service | Required | Purpose | Safe Local / Docker Default |
| :--- | :--- | :---: | :--- | :--- |
| `APP_ENV` | All | Yes | Operational environment mode (`development`, `staging`, `production`) | `production` |
| `APP_NAME` | Global | No | Human-readable application branding | `"Cloud Management Platform"` |
| `FRONTEND_PORT` | `cmp_frontend` | No | Host port binding for Next.js web application | `3000` |
| `BACKEND_PORT` | `cmp_backend` | No | Host port binding for Django REST API | `8000` |
| `GO_SERVICE_PORT` | `cmp_go_service` | No | Host port binding for Go inspector | `8080` |
| `PHP_SERVICE_PORT` | `cmp_php_service` | No | Host port binding for Laravel portal | `8001` |
| `DB_NAME` | `cmp_db`, `cmp_backend` | Yes | PostgreSQL database name | `cloud_management_db` |
| `DB_USER` | `cmp_db`, `cmp_backend` | Yes | PostgreSQL database user | `cloud_management_user` |
| `DB_PASSWORD` | `cmp_db`, `cmp_backend` | Yes | PostgreSQL database password | `replace_with_secure_password` |
| `POSTGRES_DB` | `cmp_db` | Yes | Native Postgres container database initialization name | `${DB_NAME}` |
| `POSTGRES_USER` | `cmp_db` | Yes | Native Postgres container superuser role name | `${DB_USER}` |
| `POSTGRES_PASSWORD` | `cmp_db` | Yes | Native Postgres container role password | `${DB_PASSWORD}` |

---

## 2. Django Core Backend Variables (`backend/.env`)

Located in `backend/.env` for manual execution, or injected via `docker-compose.yml`:

| Variable | Required | Default in Docker | Purpose | Safe Example |
| :--- | :---: | :--- | :--- | :--- |
| `SECRET_KEY` | Yes | Random secure fallback | Cryptographic signing key for Django sessions and CSRF | `generate_with_django_get_random_secret_key` |
| `DEBUG` | Yes | `False` | Enables verbose tracebacks and auto-reload (**must be False in production**) | `False` (Prod/Docker) / `True` (Dev) |
| `ALLOWED_HOSTS` | Yes | `localhost,127.0.0.1,backend,frontend,go-service,php-service` | HTTP Host header whitelist | `localhost,127.0.0.1,backend` |
| `DB_HOST` | Yes | `db` (Docker) / `localhost` (Host) | PostgreSQL database hostname | `db` |
| `DB_PORT` | Yes | `5432` | PostgreSQL database connection port | `5432` |
| `DB_NAME` | Yes | `cloud_management_db` | Target PostgreSQL database name | `cloud_management_db` |
| `DB_USER` | Yes | `cloud_management_user` | Database user account | `cloud_management_user` |
| `DB_PASSWORD` | Yes | Secure placeholder | Database user password | `replace_with_db_password` |
| `DB_CONNECTION_MAX_AGE` | No | `600` | Persistent DB connection timeout (seconds) | `600` |
| `CORS_ALLOWED_ORIGINS` | Yes | `http://localhost:3000,http://127.0.0.1:3000` | Whitelist for cross-origin browser requests | `http://localhost:3000,http://frontend:3000` |
| `CSRF_TRUSTED_ORIGINS` | Yes | Matches CORS origins | Whitelist for unsafe POST/PATCH/DELETE origins | `http://localhost:3000,http://frontend:3000` |
| `SESSION_COOKIE_SECURE` | No | `False` (`True` in HTTPS) | Restrict session cookie transmission to HTTPS | `False` |
| `CSRF_COOKIE_SECURE` | No | `False` (`True` in HTTPS) | Restrict CSRF cookie transmission to HTTPS | `False` |
| `SESSION_COOKIE_SAMESITE` | No | `Lax` | SameSite cookie attribute for cross-site request control | `Lax` |
| `CSRF_COOKIE_SAMESITE` | No | `Lax` | SameSite cookie attribute for CSRF tokens | `Lax` |

---

## 3. Next.js Frontend Variables (`frontend/.env`)

Located in `frontend/.env` for manual local development:

| Variable | Required | Scope | Purpose | Safe Example |
| :--- | :---: | :---: | :--- | :--- |
| `PORT` | No | Server | Node.js HTTP server port | `3000` |
| `NODE_ENV` | Yes | Server | Runtime environment (`development`, `production`) | `production` |
| `NEXT_PUBLIC_APP_NAME` | No | Client | Visible application title in browser layout | `"Cloud Management Platform"` |
| `NEXT_PUBLIC_SITE_URL` | No | Client | Canonical base URL of the frontend | `http://localhost:3000` |
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Client | Public Django REST API endpoint queried by the browser | `http://localhost:8000/api/v1` |
| `GO_SERVICE_BASE_URL` | Yes | Server | Internal URL used by Next.js Server Route Handler (`/api/go/health`) | `http://go-service:8080` (Docker) / `http://localhost:8080` (Host) |

---

## 4. Go Health & Inspection Microservice Variables (`go-service/.env`)

Located in `go-service/.env` for manual local development:

| Variable | Required | Scope | Purpose | Safe Example |
| :--- | :---: | :---: | :--- | :--- |
| `HTTP_PORT` | Yes | Server | HTTP listen port for Go runtime | `8080` |
| `APP_ENV` | Yes | Server | Application environment tag | `production` |
| `APP_VERSION` | Yes | Server | Version string returned in `/health` payload | `1.0.0` |
| `DJANGO_API_BASE_URL` | Yes | Server | Upstream Django REST API base endpoint | `http://backend:8000/api/v1` (Docker) / `http://localhost:8000/api/v1` (Host) |
| `DJANGO_API_TIMEOUT` | No | Server | HTTP Client context timeout duration | `5s` |
| `DJANGO_AUTH_USERNAME` | Yes | Server | HTTP Basic Auth service account username | `service_integration` |
| `DJANGO_AUTH_PASSWORD` | Yes | Server | HTTP Basic Auth service account password | `replace_with_service_integration_password` |

---

## 5. Laravel / PHP Customer Portal Variables (`php-service/.env`)

Located in `php-service/.env` for manual local development:

| Variable | Required | Scope | Purpose | Safe Example |
| :--- | :---: | :---: | :--- | :--- |
| `APP_NAME` | Yes | Server | Application name identifier | `"Cloud Management PHP"` |
| `APP_ENV` | Yes | Server | Laravel runtime environment (`local`, `production`) | `production` |
| `APP_KEY` | Yes | Server | 32-character AES encryption key (generated via `artisan key:generate`) | `base64:placeholder_key=` |
| `APP_DEBUG` | Yes | Server | Display detailed exception stack traces | `false` |
| `APP_URL` | Yes | Server | Canonical base URL for Laravel routes | `http://localhost:8001` |
| `DJANGO_API_BASE_URL` | Yes | Server | Upstream Django REST API base endpoint | `http://backend:8000/api/v1` (Docker) / `http://localhost:8000/api/v1` (Host) |
| `DJANGO_API_TIMEOUT` | No | Server | Laravel HTTP client timeout in seconds | `10` |
| `DJANGO_AUTH_USERNAME` | Yes | Server | HTTP Basic Auth service account username | `service_integration` |
| `DJANGO_AUTH_PASSWORD` | Yes | Server | HTTP Basic Auth service account password | `replace_with_service_integration_password` |
