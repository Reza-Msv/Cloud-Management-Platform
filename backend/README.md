# Core Backend Service (Django REST Framework)

## 1. Overview
The Core Backend is the central authority of the Cloud Management Platform (CMP). It manages domain business logic, enforces Role-Based Access Control, provides OpenAPI 3 documented REST APIs, and acts as the **sole owner of the PostgreSQL database**.

---

## 2. Technology Stack & Key Dependencies
- **Language**: Python 3.12+
- **Framework**: Django 5.x & Django REST Framework (DRF)
- **Database Driver**: `psycopg` (v3)
- **Documentation**: `drf-spectacular` (OpenAPI 3 / Swagger)
- **Production Server**: Gunicorn

---

## 3. Directory Layout
```text
backend/
├── apps/
│   ├── authentication/   # Session auth, CSRF, login/logout, /me endpoint
│   ├── common/           # Error formatting, pagination, RBAC permissions
│   ├── customers/        # Customer organization models, serializers, views
│   └── services/         # Cloud service catalog, lifecycle, status updates
├── config/               # Settings, URLs, WSGI, ASGI
├── requirements/         # Dependencies (base.txt)
├── Dockerfile            # Container definition
├── entrypoint.sh         # Dynamic DB wait loop, migration runner, Gunicorn
└── README.md
```

---

## 4. Local Development Setup (Manual)

### Prerequisites:
- Python 3.12+
- PostgreSQL 16+ running locally on port `5432`

### Setup Steps:
```bash
# 1. Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements/base.txt

# 3. Configure environment
cp .env.example .env
# Edit .env with your local PostgreSQL credentials

# 4. Apply migrations
python manage.py migrate

# 5. Initialize RBAC roles and groups
python manage.py setup_roles

# 6. Start development server
python manage.py runserver localhost:8000
```

---

## 5. Automated Testing
Run the complete 122-test automated suite:
```bash
python manage.py test
```

For complete API contracts, database specifications, and security policies, refer to the central documentation in the [docs/](../docs/) directory:
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
- [docs/API.md](../docs/API.md)
- [docs/SECURITY.md](../docs/SECURITY.md)
