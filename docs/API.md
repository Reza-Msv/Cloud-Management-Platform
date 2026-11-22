# REST API Reference & Specification

All core APIs are served under `/api/v1/` on the Django backend (Port 8000). Interactive Swagger UI documentation is available at `http://localhost:8000/api/docs/`.

---

## 1. Authentication Endpoints

### 1.1 Get CSRF Token
- **Endpoint**: `GET /api/v1/auth/csrf/`
- **Access**: Public (`AllowAny`).
- **Response** (`200 OK`):
  ```json
  {
    "detail": "CSRF cookie set.",
    "csrfToken": "qwe123token..."
  }
  ```
  *Sets the `csrftoken` HTTP cookie.*

### 1.2 User Login
- **Endpoint**: `POST /api/v1/auth/login/`
- **Access**: Public (`AllowAny`), requires valid `X-CSRFToken` header.
- **Payload**:
  ```json
  {
    "username": "admin_user",
    "password": "SecretPassword123!"
  }
  ```
- **Response** (`200 OK`): Sets `sessionid` HttpOnly cookie and returns profile:
  ```json
  {
    "id": 1,
    "username": "admin_user",
    "email": "admin@example.com",
    "first_name": "Admin",
    "last_name": "User",
    "is_superuser": true,
    "is_staff": true,
    "is_active": true,
    "groups": ["Admin"],
    "roles": ["Superuser", "Admin"],
    "permissions": ["customers.view_customer", "services.view_service", "..."]
  }
  ```

### 1.3 User Logout
- **Endpoint**: `POST /api/v1/auth/logout/`
- **Access**: Authenticated (`IsAuthenticated`).
- **Response** (`200 OK`): Flushes session and unsets `sessionid` cookie.

### 1.4 Current User Profile
- **Endpoint**: `GET /api/v1/auth/me/`
- **Access**: Authenticated (`IsAuthenticated`).
- **Response** (`200 OK`): Returns currently authenticated user profile.

---

## 2. Customer Endpoints

### 2.1 List Customers
- **Endpoint**: `GET /api/v1/customers/`
- **Access**: `Admin` or `Operator` (`customers.view_customer`).
- **Query Parameters**:
  - `page`: Page number (default: `1`).
  - `page_size`: Results per page (default: `25`).
  - `search`: Search across `first_name`, `last_name`, and `email`.
  - `email`: Exact email filter.
  - `phone`: Exact phone filter.
- **Response** (`200 OK`):
  ```json
  {
    "count": 2,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": 28,
        "first_name": "Alpha",
        "last_name": "Enterprise",
        "email": "alpha@example.com",
        "phone": "+1234567890",
        "services_count": 1,
        "created_at": "2026-11-22T19:04:22.143344Z"
      }
    ]
  }
  ```

### 2.2 Create Customer
- **Endpoint**: `POST /api/v1/customers/`
- **Access**: **Admin Only** (`customers.add_customer`). Returns `403 Forbidden` for Operators.
- **Payload**:
  ```json
  {
    "first_name": "Beta",
    "last_name": "Corp",
    "email": "beta@example.com",
    "phone": "+1987654321"
  }
  ```
- **Response** (`201 Created`).

### 2.3 Customer Detail
- **Endpoint**: `GET /api/v1/customers/{id}/`
- **Access**: `Admin` or `Operator` (`customers.view_customer`).
- **Response** (`200 OK`): Returns customer object with embedded service statistics.

---

## 3. Service Endpoints

### 3.1 List Services
- **Endpoint**: `GET /api/v1/services/`
- **Access**: `Admin` or `Operator` (`services.view_service`).
- **Query Parameters**:
  - `customer`: Filter services by customer ID (`/api/v1/services/?customer=28`).
  - `status`: Filter by status (`active` or `suspended`).
  - `service_type`: Filter by type (`vps`, `cloud_server`, etc.).
  - `search`: Search by service name.
- **Response** (`200 OK`): Paginated list of services.

### 3.2 Service Detail
- **Endpoint**: `GET /api/v1/services/{id}/`
- **Access**: `Admin` or `Operator`.

### 3.3 Create Service
- **Endpoint**: `POST /api/v1/services/`
- **Access**: `Admin` or `Operator` (`services.add_service`).
- **Payload**:
  ```json
  {
    "customer": 28,
    "name": "Production Load Balancer",
    "service_type": "cloud_server"
  }
  ```
- **Response** (`201 Created`).

### 3.4 Update Service Status
- **Endpoint**: `PATCH /api/v1/services/{id}/status/`
- **Access**: `Admin` or `Operator` (`services.change_service`).
- **Payload**:
  ```json
  {
    "status": "suspended"
  }
  ```
- **Response** (`200 OK`): Returns updated service object.

---

## 4. Go Health & Microservice Endpoints

### 4.1 Basic Health Check
- **Endpoint**: `GET http://localhost:8080/health`
- **Access**: Public.
- **Response** (`200 OK`):
  ```json
  {
    "status": "ok",
    "service": "cloud-management-go",
    "version": "1.0.0",
    "uptime": "14m22s",
    "go_version": "go1.22.12"
  }
  ```

### 4.2 Upstream Service Inspection
- **Endpoint**: `GET http://localhost:8080/health?service_id=10`
- **Access**: Public (Go queries Django with authenticated service credentials).
- **Response** (`200 OK`):
  ```json
  {
    "status": "ok",
    "service": "cloud-management-go",
    "version": "1.0.0",
    "uptime": "14m22s",
    "go_version": "go1.22.12",
    "service_detail": {
      "id": 10,
      "name": "Production Kubernetes Cluster",
      "service_type": "kubernetes",
      "status": "active",
      "customer": 28,
      "created_at": "2026-11-22T19:04:22.143344Z"
    }
  }
  ```

### 4.3 Next.js Route Proxy
- **Endpoint**: `GET http://localhost:3000/api/go/health`
- Internal server proxy returning Go runtime information directly to the dashboard.
