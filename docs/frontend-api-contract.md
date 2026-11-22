# Frontend API Contract & Integration Guide

**Cloud Management Platform (CMP) — Core Backend**  
*Target Consumer: Next.js Frontend (`frontend/`)*  
*Generated: Phase 2.7 Backend Audit & Handoff*

---

## 1. Overview & Base URL

- **Development Base URL**: `http://localhost:8000/api/v1`
- **Development Swagger UI**: `http://localhost:8000/api/docs/`
- **Development OpenAPI Schema**: `http://localhost:8000/api/schema/`
- **Development ReDoc**: `http://localhost:8000/api/redoc/`
- **Authentication Scheme**: Django Session Authentication (Cookie-Based: `sessionid` and `csrftoken`).
- **Data Exchange Format**: `application/json`

---

## 2. Authentication & CSRF Protocol for Next.js

All browser requests from Next.js (whether using `fetch`, `axios`, or SWR/React Query) must include cookies:
```typescript
// Fetch option
credentials: 'include'
```

### 2.1 The Two-Step Security Handshake

```
+--------------------+                     +-------------------------+
|  Next.js Frontend  |                     |  Django Core Backend    |
+--------------------+                     +-------------------------+
          |                                             |
          | 1. GET /api/v1/auth/csrf/                   |
          |-------------------------------------------->|
          |                                             |
          | 2. Returns JSON { csrfToken }               |
          |    + Sets Cookie: csrftoken                 |
          |<--------------------------------------------|
          |                                             |
          | 3. POST /api/v1/auth/login/                 |
          |    Header: X-CSRFToken: <csrfToken>         |
          |    Body: { username, password }             |
          |-------------------------------------------->|
          |                                             |
          | 4. Returns JSON User Profile                |
          |    + Sets Cookie: sessionid (HttpOnly)      |
          |    + Rotates Cookie: csrftoken              |
          |<--------------------------------------------|
          |                                             |
          | 5. Subsequent Mutative Requests             |
          |    (POST / PATCH / DELETE)                  |
          |    Header: X-CSRFToken: <new_csrftoken>     |
          |    Cookies: sessionid, csrftoken            |
          |-------------------------------------------->|
```

> [!IMPORTANT]
> **CSRF Token Rotation on Login**:
> Django rotates the CSRF token upon successful `login()`. Next.js frontend should read the updated `csrftoken` cookie value from `document.cookie` (or re-call `/api/v1/auth/csrf/`) after login, and supply it in the `X-CSRFToken` header for all mutative requests (`POST`, `PATCH`, `PUT`, `DELETE`).

---

## 3. Role-Based Access Control (RBAC) Matrix

Users belong to standard Django Groups (`Admin`, `Operator`) or have `is_superuser=True`. The `/api/v1/auth/me/` endpoint returns the user's roles and effective permissions.

| Endpoint | Method | Admin | Operator | Non-Role User | Anonymous |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `/api/v1/auth/csrf/` | `GET` | ✅ Allow | ✅ Allow | ✅ Allow | ✅ Allow |
| `/api/v1/auth/login/` | `POST` | ✅ Allow | ✅ Allow | ✅ Allow | ✅ Allow |
| `/api/v1/auth/logout/` | `POST` | ✅ Allow | ✅ Allow | ✅ Allow | ⛔ 401 |
| `/api/v1/auth/me/` | `GET` | ✅ Allow | ✅ Allow | ✅ Allow | ⛔ 401 |
| `/api/v1/customers/` (List) | `GET` | ✅ Allow | ✅ Allow | ⛔ 403 | ⛔ 401 |
| `/api/v1/customers/` (Create) | `POST` | ✅ Allow | ⛔ 403 | ⛔ 403 | ⛔ 401 |
| `/api/v1/customers/{id}/` (Detail) | `GET` | ✅ Allow | ✅ Allow | ⛔ 403 | ⛔ 401 |
| `/api/v1/customers/{id}/` (Update) | `PATCH` | ✅ Allow | ⛔ 403 | ⛔ 403 | ⛔ 401 |
| `/api/v1/customers/{id}/services/` (List) | `GET` | ✅ Allow | ✅ Allow | ⛔ 403 | ⛔ 401 |
| `/api/v1/customers/{id}/services/` (Create) | `POST` | ✅ Allow | ✅ Allow | ⛔ 403 | ⛔ 401 |
| `/api/v1/services/` (Global List) | `GET` | ✅ Allow | ✅ Allow | ⛔ 403 | ⛔ 401 |
| `/api/v1/services/{id}/` (Detail) | `GET` | ✅ Allow | ✅ Allow | ⛔ 403 | ⛔ 401 |
| `/api/v1/services/{id}/status/` (Update) | `PATCH` | ✅ Allow | ✅ Allow | ⛔ 403 | ⛔ 401 |
| **Superuser** (`is_superuser=true`) | *All* | ✅ Allow | ✅ Allow | ✅ Allow | ⛔ 401 |

---

## 4. API Endpoints Specification

### 4.1 Authentication Endpoints

#### 1. Get CSRF Token
- **URL**: `GET /api/v1/auth/csrf/`
- **Auth Required**: No (Public)
- **Success Response** (`200 OK`):
  ```json
  {
    "detail": "CSRF cookie set.",
    "csrfToken": "t2L87XqY91b0kF7j8h3U..."
  }
  ```
- **Cookies Set**: `csrftoken` (SameSite: Lax)

#### 2. User Login
- **URL**: `POST /api/v1/auth/login/`
- **Auth Required**: No
- **CSRF Required**: Yes (`X-CSRFToken` header)
- **Request Body**:
  ```json
  {
    "username": "admin_user",
    "password": "SecretPassword123!"
  }
  ```
- **Success Response** (`200 OK`):
  ```json
  {
    "id": 1,
    "username": "admin_user",
    "email": "admin@cmp.com",
    "first_name": "Reza",
    "last_name": "Mousavi",
    "is_superuser": false,
    "is_staff": false,
    "is_active": true,
    "groups": ["Admin"],
    "roles": ["Admin"],
    "permissions": [
      "customers.add_customer",
      "customers.change_customer",
      "customers.view_customer",
      "services.add_service",
      "services.change_service",
      "services.view_service"
    ]
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{"username": ["Username cannot be blank."], "password": ["Password is required."]}`
  - `401 Unauthorized`: `{"detail": "Invalid username or password."}` or `{"detail": "User account is disabled."}`
  - `403 Forbidden`: `{"detail": "CSRF verification failed."}`

#### 3. User Logout
- **URL**: `POST /api/v1/auth/logout/`
- **Auth Required**: Yes (`SessionAuthentication` / `BasicAuthentication`)
- **CSRF Required**: Yes (`X-CSRFToken` header)
- **Request Body**: None
- **Success Response** (`200 OK`):
  ```json
  {
    "detail": "Successfully logged out."
  }
  ```
- **Error Response**:
  - `401 Unauthorized`: `{"detail": "Authentication credentials were not provided."}`

#### 4. Current User Profile
- **URL**: `GET /api/v1/auth/me/`
- **Auth Required**: Yes
- **Query Params**: None
- **Success Response** (`200 OK`): Same profile structure as login response.
- **Error Response**: `401 Unauthorized`

---

### 4.2 Customer Endpoints

#### 1. List Customers (Paginated, Searchable, Filterable)
- **URL**: `GET /api/v1/customers/`
- **Auth Required**: Yes (`Admin` or `Operator`)
- **Query Parameters**:
  | Param | Type | Description | Example |
  | :--- | :--- | :--- | :--- |
  | `page` | integer | Page number (default: 1) | `?page=2` |
  | `page_size` | integer | Results per page (default: 10, max: 100) | `?page_size=20` |
  | `search` | string | Full-text search across name, email, phone | `?search=Tehran` |
  | `first_name`| string | Substring filter on first name | `?first_name=Ali` |
  | `last_name` | string | Substring filter on last name | `?last_name=Rad` |
  | `email` | string | Substring filter on email | `?email=@gmail.com` |
  | `phone` | string | Substring filter on phone | `?phone=+98912` |
- **Success Response** (`200 OK`):
  ```json
  {
    "count": 45,
    "next": "http://localhost:8000/api/v1/customers/?page=2",
    "previous": null,
    "results": [
      {
        "id": 1,
        "first_name": "Kaveh",
        "last_name": "Ahangar",
        "full_name": "Kaveh Ahangar",
        "email": "kaveh@cmp.com",
        "phone": "+989123456789",
        "created_at": "2026-11-22T05:25:35.123456Z"
      }
    ]
  }
  ```

#### 2. Create Customer
- **URL**: `POST /api/v1/customers/`
- **Auth Required**: Yes (`Admin` only)
- **CSRF Required**: Yes (`X-CSRFToken` header)
- **Request Body**:
  ```json
  {
    "first_name": "Sina",
    "last_name": "Moradi",
    "email": "sina.moradi@example.com",
    "phone": "+989121112233"
  }
  ```
- **Success Response** (`201 Created`):
  ```json
  {
    "id": 2,
    "first_name": "Sina",
    "last_name": "Moradi",
    "full_name": "Sina Moradi",
    "email": "sina.moradi@example.com",
    "phone": "+989121112233",
    "created_at": "2026-11-22T06:10:00.123456Z"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Validation failure (duplicate email, blank name, invalid phone digits).
  - `403 Forbidden`: `{"detail": "You do not have permission to perform this action."}` (e.g. Operator role).

#### 3. Retrieve Customer Details
- **URL**: `GET /api/v1/customers/{customer_id}/`
- **Auth Required**: Yes (`Admin` or `Operator`)
- **Success Response** (`200 OK`): Single Customer object.
- **Error Response**: `404 Not Found` (`{"detail": "Customer not found."}`).

#### 4. Partially Update Customer
- **URL**: `PATCH /api/v1/customers/{customer_id}/`
- **Auth Required**: Yes (`Admin` only)
- **CSRF Required**: Yes (`X-CSRFToken` header)
- **Request Body** (Any subset of mutable fields):
  ```json
  {
    "phone": "+989120000000"
  }
  ```
- **Success Response** (`200 OK`): Updated Customer object.

---

### 4.3 Service Endpoints

#### 1. List Customer Services
- **URL**: `GET /api/v1/customers/{customer_id}/services/`
- **Auth Required**: Yes (`Admin` or `Operator`)
- **Query Parameters**:
  - `page`, `page_size`
  - `status`: `'active'` or `'suspended'`
  - `service_type`: `'vps'`, `'cloud_server'`, `'dedicated_server'`, `'cloud_storage'`
- **Success Response** (`200 OK`): Paginated results list of services belonging to the customer.

#### 2. Create Service for Customer
- **URL**: `POST /api/v1/customers/{customer_id}/services/`
- **Auth Required**: Yes (`Admin` or `Operator`)
- **CSRF Required**: Yes (`X-CSRFToken` header)
- **Request Body**:
  ```json
  {
    "name": "Production Database Server",
    "service_type": "vps"
  }
  ```
- **Success Response** (`201 Created`):
  ```json
  {
    "id": 10,
    "name": "Production Database Server",
    "service_type": "vps",
    "status": "active",
    "customer": 1,
    "created_at": "2026-11-22T06:15:00.123456Z"
  }
  ```

#### 3. Global Services List
- **URL**: `GET /api/v1/services/`
- **Auth Required**: Yes (`Admin` or `Operator`)
- **Query Parameters**:
  - `customer_id`: integer
  - `status`: `'active'` or `'suspended'`
  - `service_type`: `'vps'`, `'cloud_server'`, `'dedicated_server'`, `'cloud_storage'`
  - `page`, `page_size`
- **Success Response** (`200 OK`): Paginated results list across all services.

#### 4. Retrieve Standalone Service Details
- **URL**: `GET /api/v1/services/{service_id}/`
- **Auth Required**: Yes (`Admin` or `Operator`)
- **Success Response** (`200 OK`): Single Service object.

#### 5. Update Service Status
- **URL**: `PATCH /api/v1/services/{service_id}/status/`
- **Auth Required**: Yes (`Admin` or `Operator`)
- **CSRF Required**: Yes (`X-CSRFToken` header)
- **Request Body**:
  ```json
  {
    "status": "suspended"
  }
  ```
- **Allowed Statuses**: `"active"`, `"suspended"`
- **Success Response** (`200 OK`): Updated Service object.

---

## 5. Consistent Error Handling Schema

The API guarantees structured error responses across all endpoints:

### Form / Validation Error (`400 Bad Request`)
```json
{
  "email": ["Customer with this email already exists."],
  "phone": ["Phone number must contain at least 7 digits."]
}
```

### Authentication Error (`401 Unauthorized`)
```json
{
  "detail": "Authentication credentials were not provided."
}
```
*(Response header includes: `WWW-Authenticate: Basic realm="api"`)*

### Permission Denied (`403 Forbidden`)
```json
{
  "detail": "You do not have permission to perform this action."
}
```

### Resource Not Found (`404 Not Found`)
```json
{
  "detail": "Customer not found."
}
```

### Internal Server Error (`500 Internal Server Error`)
```json
{
  "detail": "An unexpected internal server error occurred. Please contact support."
}
```
*(Internal traces are securely written to server logs and never leaked to the client)*

---

## 6. Real-World `curl` Execution Examples

### Example 1: Full Login & Query Handshake
```bash
# 1. Fetch CSRF token and store cookie
curl -s -c cookies.txt -X GET http://localhost:8000/api/v1/auth/csrf/ > /dev/null

# Extract token
CSRF_TOKEN=$(grep csrftoken cookies.txt | awk '{print $7}')

# 2. Login as Admin
curl -s -b cookies.txt -c cookies.txt -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -H "X-CSRFToken: $CSRF_TOKEN" \
  -d '{"username": "admin", "password": "secure_password"}'

# 3. Read Updated Post-Login CSRF token
NEW_CSRF=$(grep csrftoken cookies.txt | awk '{print $7}')

# 4. Fetch /me/
curl -s -b cookies.txt -X GET http://localhost:8000/api/v1/auth/me/

# 5. Create Customer
curl -s -b cookies.txt -c cookies.txt -X POST http://localhost:8000/api/v1/customers/ \
  -H "Content-Type: application/json" \
  -H "X-CSRFToken: $NEW_CSRF" \
  -d '{"first_name": "Arash", "last_name": "Kamangir", "email": "arash@cmp.com", "phone": "+989127778899"}'

# 6. Query Customers with Search and Pagination
curl -s -b cookies.txt -X GET "http://localhost:8000/api/v1/customers/?search=Arash&page=1&page_size=10"
```

---

## 7. Next.js Integration Best Practices

1. **API Client Helper**:
   Create a centralized HTTP utility (e.g. `lib/api-client.ts`) in Next.js that wraps `fetch`:
   - Always sets `credentials: 'include'`.
   - Reads `csrftoken` from `document.cookie` and attaches `X-CSRFToken` to mutative methods (`POST`, `PATCH`, `DELETE`).
   - If a request returns `401`, redirects the user to the login route `/login`.
2. **Environment Variables**:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   ```
3. **CORS & Credentials**:
   Backend settings allow origin `http://localhost:3000` with `CORS_ALLOW_CREDENTIALS = True`. No proxying is strictly necessary during local development, but Next.js Rewrites can also be configured if same-domain routing is desired.
