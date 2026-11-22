# Security Architecture & Hardening Guide

This document details the security model, access controls, protection mechanisms, and production hardening recommendations for the Cloud Management Platform.

---

## 1. Authentication & Session Architecture

1. **Browser Clients (Next.js)**:
   - Uses Django's battle-tested `SessionAuthentication` coupled with `CsrfViewMiddleware`.
   - On successful authentication at `/api/v1/auth/login/`, Django sets an `HttpOnly`, `SameSite=Lax` session cookie (`sessionid`).
   - Mitigates Cross-Site Scripting (XSS) token harvesting by never exposing authentication secrets to browser JavaScript or storing them in `localStorage`.
2. **Cross-Site Request Forgery (CSRF) Protection**:
   - Double-submit CSRF cookie pattern enforced on all state-changing HTTP requests (`POST`, `PATCH`, `PUT`, `DELETE`).
   - Browser requests must send the `X-CSRFToken` header matching the `csrftoken` cookie.
   - Django enforces `CSRF_TRUSTED_ORIGINS` validating incoming `Origin` and `Referer` headers.
3. **Cross-Origin Resource Sharing (CORS)**:
   - Configured via `django-cors-headers`.
   - Whitelist restricted to authorized frontend origins (`http://localhost:3000`).
   - `CORS_ALLOW_CREDENTIALS = True` ensures cookies are accepted only from explicit whitelist domains.

---

## 2. Role-Based Access Control (RBAC)

The platform enforces two distinct operational roles managed through Django Groups:

| Capability | Superuser (`Admin` Role) | Operator (`Operator` Role) | Unauthenticated |
| :--- | :---: | :---: | :---: |
| **View Customers** | Yes | Yes | No (401) |
| **Create Customers** | Yes | **No (403 Forbidden)** | No (401) |
| **View Services** | Yes | Yes | No (401) |
| **Create Services** | Yes | Yes | No (401) |
| **Update Service Status** | Yes | Yes | No (401) |
| **Django Admin Panel** | Yes (`is_staff=True`) | **No (`is_staff=False`)** | No |
| **User & Role Management** | Yes | **No** | No |

---

## 3. Service-to-Service Integration Security

1. **Dedicated Service Account (`service_integration`)**:
   - Microservices (Go and PHP) do not connect to Django using superuser credentials.
   - They authenticate via HTTP Basic Authentication using the unprivileged `service_integration` service account.
   - `service_integration` is member of the `Operator` group and has **zero staff or administrative privileges**.
2. **No Direct Database Access**:
   - Go and PHP have no network access or credentials to PostgreSQL. Port 5432 is strictly internal to `cmp_backend`.
3. **Cross-Customer Ownership Validation (PHP Service)**:
   - When updating service statuses via Laravel, the backend verifies that the target service genuinely belongs to the requested customer before mutating state.
   - Unauthorized attempts return an immediate `Security Violation` and are rejected.

---

## 4. Container & Infrastructure Security

1. **Non-Root Execution**:
   - All runtime Dockerfiles drop root privileges and execute under dedicated system users:
     - `cmp_backend`: `django` (UID 1000)
     - `cmp_frontend`: `nextjs` (UID 1001)
     - `cmp_go_service`: `appuser` (UID 10001)
     - `cmp_php_service`: `laravel` (UID 1000)
2. **Network Isolation**:
   - Containers communicate across a private Docker bridge network (`cmp_network`).
   - Only necessary web ports (3000, 8000, 8080, 8001) are exposed to `localhost`.
3. **Secret Hygiene**:
   - `.env` files are ignored by Git.
   - `.dockerignore` files prevent local environment variables and git caches from baking into image layers.

---

## 5. Production Hardening Checklist (Recommendations)

For production deployments:
- [ ] Set `DEBUG=False` in Django.
- [ ] Enable `SESSION_COOKIE_SECURE=True` and `CSRF_COOKIE_SECURE=True` behind HTTPS (TLS/SSL).
- [ ] Terminate TLS at a reverse proxy (e.g. Nginx or Cloudflare) with HTTP Strict Transport Security (HSTS).
- [ ] Rotate all database passwords and generate a cryptographically strong `SECRET_KEY` and `APP_KEY`.
- [ ] Remove demo auto-fill preset buttons from `login-form.tsx`.
