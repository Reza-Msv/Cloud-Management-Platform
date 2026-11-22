# Core Backend Service (Django REST Framework)

## 1. Overview
The Core Backend is the central authority of the Cloud Management Platform (CMP). It is responsible for:
- Managing core domain business logic.
- Providing authenticated RESTful APIs for the Next.js frontend.
- Serving as the **sole owner** of the PostgreSQL database (managing migrations, schema integrity, and transactions).
- Exposing secure internal endpoints for auxiliary services (`go-service` and `php-service`).

## 2. Technology Stack
- **Language**: Python 3.14+
- **Framework**: Django 6.1+ & Django REST Framework (DRF) 3.18+
- **Database**: PostgreSQL 18 (Port 5432)
- **Database Driver**: `psycopg` (v3) binary adapter
- **Environment Management**: `python-dotenv`

## 3. Directory Layout (Architecture)
```text
backend/
├── .env                      # Real environment secrets (ignored by Git)
├── .env.example              # Environment variables template
├── .venv/                    # Dedicated Python virtual environment (ignored by Git)
├── apps/                     # Modular Django applications (customers, services, etc.)
├── config/                   # Django project configuration
│   ├── __init__.py
│   ├── asgi.py
│   ├── settings.py           # Configured with PostgreSQL and DRF
│   ├── urls.py
│   └── wsgi.py
├── manage.py                 # Django CLI entrypoint
├── requirements/             # Pinned dependency manifests
│   └── base.txt              # Direct production dependencies
├── scripts/                  # Management scripts
├── tests/                    # Integration and test suites
└── README.md                 # Service documentation
```

## 4. Database Ownership Rule
> **IMPORTANT**:
> No external microservice or frontend connects directly to PostgreSQL. All interactions with data must pass through Django's models, querysets, serializers, and permission layers to maintain data consistency and auditability.

## 5. Local Development Execution

### 5.1 Activate Environment & Configure Credentials
Ensure your PostgreSQL database password is set in `backend/.env`:
```env
DB_PASSWORD=your_actual_password
```

### 5.2 Database Migrations
Once the database connection is confirmed:
```bash
cd backend
source .venv/bin/activate
python manage.py migrate
```

### 5.3 Run Development Server
```bash
cd backend
source .venv/bin/activate
python manage.py runserver
```
The server will be accessible at: `http://127.0.0.1:8000/`

## 6. Authentication & Next.js Frontend Integration

Backend uses standard **Django Session Authentication** with Cookie-based persistence and CSRF protection.

### 6.1 Authentication Endpoints

| Method | Endpoint | Description | Auth Required | CSRF Enforced |
| :--- | :--- | :--- | :---: | :---: |
| `GET` | `/api/v1/auth/csrf/` | Set `csrftoken` cookie and return token in JSON | No | No |
| `POST` | `/api/v1/auth/login/` | Authenticate with username/password & set `sessionid` | No | Yes (header `X-CSRFToken`) |
| `POST` | `/api/v1/auth/logout/` | Invalidate current session and clear cookies | Yes | Yes (header `X-CSRFToken`) |
| `GET` | `/api/v1/auth/me/` | Get current user profile, groups, roles, permissions | Yes | No (safe GET) |

### 6.2 Authentication Flow for Next.js

1. **Step 1: Get CSRF Token**
   Before submitting login or any mutative requests, call:
   ```bash
   curl -i -c cookies.txt -X GET http://localhost:8000/api/v1/auth/csrf/
   ```
   Response headers will include `Set-Cookie: csrftoken=...; Path=/; SameSite=Lax` and response JSON:
   ```json
   {
     "detail": "CSRF cookie set.",
     "csrfToken": "YOUR_CSRF_TOKEN"
   }
   ```

2. **Step 2: Login**
   Send user credentials with cookies and the `X-CSRFToken` header:
   ```bash
   curl -i -b cookies.txt -c cookies.txt -X POST http://localhost:8000/api/v1/auth/login/ \
     -H "Content-Type: application/json" \
     -H "X-CSRFToken: YOUR_CSRF_TOKEN" \
     -d '{"username": "admin", "password": "secure_password"}'
   ```
   On success (`200 OK`), Django sets the `sessionid` HttpOnly cookie and returns the user profile:
   ```json
   {
     "id": 1,
     "username": "admin",
     "email": "admin@cmp.com",
     "first_name": "Reza",
     "last_name": "Mousavi",
     "is_superuser": true,
     "is_staff": true,
     "is_active": true,
     "groups": ["Admin"],
     "roles": ["Superuser", "Admin"],
     "permissions": ["customers.add_customer", "services.add_service", ...]
   }
   ```

3. **Step 3: Fetch Current User Profile**
   ```bash
   curl -i -b cookies.txt -X GET http://localhost:8000/api/v1/auth/me/
   ```

4. **Step 4: Execute Mutative API Requests (e.g. Create Customer)**
   When creating or updating resources with Session Authentication, Next.js must pass `credentials: 'include'` and header `X-CSRFToken`:
   ```bash
   curl -i -b cookies.txt -c cookies.txt -X POST http://localhost:8000/api/v1/customers/ \
     -H "Content-Type: application/json" \
     -H "X-CSRFToken: YOUR_CSRF_TOKEN" \
     -d '{"first_name": "Neda", "last_name": "Tehrani", "email": "neda@cmp.com", "phone": "+989123456789"}'
   ```

5. **Step 5: Logout**
   ```bash
   curl -i -b cookies.txt -c cookies.txt -X POST http://localhost:8000/api/v1/auth/logout/ \
     -H "X-CSRFToken: YOUR_CSRF_TOKEN"
   ```

### 6.3 CORS & Cookie Configuration

In `.env`:
```env
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
SESSION_COOKIE_SECURE=False   # Set True in Production (HTTPS)
CSRF_COOKIE_SECURE=False      # Set True in Production (HTTPS)
SESSION_COOKIE_SAMESITE=Lax
```

- **Development**:
  - `DEBUG=True`
  - `SESSION_COOKIE_SECURE=False`
  - Origin: `http://localhost:3000`
- **Production**:
  - `DEBUG=False`
  - `SESSION_COOKIE_SECURE=True` (Transmitted only over HTTPS)
  - `CSRF_COOKIE_SECURE=True`
  - `CORS_ALLOWED_ORIGINS` & `CSRF_TRUSTED_ORIGINS` strictly pinned to production domain(s)
  - `SESSION_COOKIE_HTTPONLY=True` (Mitigates XSS cookie theft)

