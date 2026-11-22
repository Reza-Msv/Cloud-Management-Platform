# Independent Go Service

## 1. Overview
The `go-service` is an independent, lightweight, high-performance microservice within the Cloud Management Platform (CMP). It provides:
- Health check endpoints returning live runtime, uptime, and version telemetry.
- Inter-service lookup of cloud service operational status via Django's Core REST API.
- Zero direct database access, strictly honoring Django's single ownership of PostgreSQL.

## 2. Technology Stack
- **Language**: Go (Golang 1.22+)
- **Routing & HTTP**: Standard Go Library (`net/http`, `http.ServeMux`, `context`)
- **Testing**: Go Standard Library `testing` and `net/http/httptest`
- **Dependencies**: Zero external dependencies (100% standard library)

## 3. Architecture & Project Layout

```text
go-service/
├── cmd/
│   └── server/
│       └── main.go               # Service bootstrap, graceful shutdown & server setup
├── internal/
│   ├── api/
│   │   ├── handlers/             # HTTP endpoint handlers (HealthHandler)
│   │   └── router/               # Route registration and HTTP multiplexing
│   ├── client/
│   │   └── django/               # Context-aware HTTP REST client for Django
│   ├── config/                   # Environment-driven configuration loader
│   ├── model/                    # Domain structs and JSON DTOs
│   └── service/                  # Business logic services (HealthService)
├── tests/
│   └── integration_test.go       # End-to-end integration tests using httptest
├── go.mod
├── .env.example                  # Environment configuration template
└── README.md
```

## 4. Endpoints

### 4.1 Basic Health Check
`GET /health`

Returns runtime information for the Go process. This endpoint operates independently of Django's availability.

**Response** (`200 OK`):
```json
{
  "status": "ok",
  "service": "cloud-management-go",
  "version": "1.0.0",
  "uptime": "2h15m0s",
  "go_version": "go1.27.4"
}
```

### 4.2 Health with Service Status Lookup
`GET /health?service_id=10`

When `service_id` is supplied:
1. Validates `service_id` is a positive integer (returns `400 Bad Request` if invalid).
2. Queries Django REST API (`GET /api/v1/services/{id}/`) with configured service credentials.
3. Maps response into the Go runtime payload.

**Response** (`200 OK`):
```json
{
  "status": "ok",
  "service": "cloud-management-go",
  "version": "1.0.0",
  "uptime": "2h15m0s",
  "go_version": "go1.27.4",
  "service_detail": {
    "id": 10,
    "name": "storage",
    "service_type": "cloud_storage",
    "status": "active",
    "customer": 28,
    "created_at": "2026-11-22T17:22:05.74894Z"
  }
}
```

## 5. Configuration (Environment Variables)

| Variable | Default | Description |
|---|---|---|
| `HTTP_PORT` | `8080` | Port for the HTTP server |
| `APP_ENV` | `development` | Application environment (`development`, `staging`, `production`) |
| `APP_VERSION` | `1.0.0` | Application release version |
| `DJANGO_API_BASE_URL` | `http://localhost:8000/api/v1` | Django REST API base URL |
| `DJANGO_API_TIMEOUT` | `5s` | Timeout for upstream requests to Django |
| `DJANGO_AUTH_USERNAME` | `""` | Service account username for Django BasicAuth |
| `DJANGO_AUTH_PASSWORD` | `""` | Service account password for Django BasicAuth |

## 6. Local Execution

```bash
cd go-service

# Run tests
go test -v ./...
go vet ./...

# Run service
DJANGO_AUTH_USERNAME=admin_user DJANGO_AUTH_PASSWORD=SecretPassword123! go run ./cmd/server
```

**Example Curl Requests**:
```bash
# Basic health
curl http://localhost:8080/health

# Service detail lookup
curl "http://localhost:8080/health?service_id=10"

# Invalid service ID (400)
curl "http://localhost:8080/health?service_id=abc"

# Unknown service ID (404)
curl "http://localhost:8080/health?service_id=999"
```
