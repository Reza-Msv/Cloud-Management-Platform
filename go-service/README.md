# Go Microservice (Health & Status Inspector)

## 1. Overview
The Go service is a lightweight, high-performance microservice designed for independent runtime health reporting and live cloud service status inspection. It communicates with the Django REST API over HTTP using a dedicated service integration account.

---

## 2. Technology Stack & Key Dependencies
- **Language**: Go 1.22+
- **Standard Library**: Built exclusively on standard library primitives (`net/http`, `encoding/json`, `context`, `time`). Zero third-party runtime frameworks.
- **Container**: Minimal Alpine Linux image via multi-stage Docker build.

---

## 3. Directory Layout
```text
go-service/
├── cmd/
│   └── server/           # Main application entrypoint
├── internal/
│   ├── api/              # HTTP routers and handlers
│   ├── client/django/    # Upstream Django HTTP REST API client
│   ├── config/           # Environment configuration loader
│   ├── model/            # Service structs and JSON representations
│   └── service/          # Business logic & health check orchestrator
├── tests/                # Integration and end-to-end test suites
├── Dockerfile            # Multi-stage container definition
├── go.mod                # Module definition
└── README.md
```

---

## 4. Endpoints
- `GET /health`: Returns service runtime status, uptime, and Go version (independent of upstream dependencies).
- `GET /health?service_id={id}`: Dynamically inspects service status in Django via authenticated REST calls.

---

## 5. Local Execution & Testing

```bash
# Run server locally
go run ./cmd/server

# Run unit and integration tests
go test -v ./...

# Static analysis and vet checks
go vet ./...
```
