# Practical Troubleshooting Guide

This guide provides symptoms, diagnoses, and safe remedies for common development and runtime issues.

---

## 1. Port Conflicts (Address Already in Use)

### Symptom:
`Error response from daemon: listen tcp 0.0.0.0:8000: bind: address already in use` (or port 3000, 8080, 8001).

### Cause:
A local development server (such as `python manage.py runserver`, `go run`, or `artisan serve`) is still running on the macOS host outside of Docker.

### Safe Remedy:
Find and terminate the lingering process on the affected port:
```bash
# Identify process listening on the port (e.g. 8000):
lsof -i :8000
# Terminate the process by PID:
kill <PID>
```
Then start the container:
```bash
docker compose up -d
```

---

## 2. Docker Daemon Unavailable

### Symptom:
`Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?`

### Cause:
Docker Desktop is not currently open or active on macOS/Windows.

### Safe Remedy:
1. Launch **Docker Desktop** from Applications.
2. Wait until the whale icon in the status bar turns solid green ("Engine running").
3. Verify connection via `docker ps`.

---

## 3. Database Persistence & Restart Safety

### Symptom:
Developer concerns regarding whether restarting containers erases existing customers or user accounts.

### Explanation:
PostgreSQL records are safely preserved in the named Docker volume `cmp_postgres_data`.
- **Safe Command**: `docker compose down` stops containers but preserves the volume.
- **Safe Command**: `docker compose stop` or `docker compose restart`.
- **Destructive Command (Never use)**: `docker compose down -v` permanently destroys named volumes and wipes all database records.

---

## 4. CSRF or 403 Forbidden on Login

### Symptom:
`403 Forbidden: {"detail": "CSRF Failed: CSRF token missing or incorrect."}`

### Diagnosis:
State-changing API calls (`POST /api/v1/auth/login/`) require the `X-CSRFToken` header matching the `csrftoken` cookie.

### Safe Remedy:
Ensure client code calls `GET /api/v1/auth/csrf/` first to acquire a valid token before submitting the login form. The frontend client (`authApi.login`) handles this sequence automatically.

---

## 5. Microservice Authentication Failure (502 Bad Gateway)

### Symptom:
Go microservice returns `{"error":"upstream authentication failure"}` when calling `/health?service_id=10`.

### Diagnosis:
`DJANGO_AUTH_USERNAME` or `DJANGO_AUTH_PASSWORD` in `go-service/.env` does not match the active service account credentials in Django's database.

### Safe Remedy:
Verify that `service_integration` exists in the database and that `go-service/.env` and `php-service/.env` contain matching credentials. Restart the affected services:
```bash
docker compose restart go-service php-service
```

---

## 6. Frontend Build / Hydration Warnings

### Symptom:
Next.js shows hydration mismatch warnings between server and client rendering.

### Safe Remedy:
Ensure the browser locale and cookies are intact. The platform uses `suppressHydrationWarning` on `<html>` alongside `next-themes` and `next-intl` to guarantee seamless server-to-client DOM transitions across light, dark, LTR, and RTL modes.
