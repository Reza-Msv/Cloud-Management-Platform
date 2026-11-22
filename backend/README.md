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
