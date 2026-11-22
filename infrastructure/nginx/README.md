# Nginx Gateway & Reverse Proxy Configuration

## 1. Overview
This directory contains the Nginx reverse proxy configuration designed to serve as the unified API and frontend gateway for the Cloud Management Platform in containerized environments.

## 2. Directory Layout
```text
infrastructure/nginx/
├── conf.d/                   # Virtual host configurations
│   └── default.conf          # Reverse proxy routing rules
├── nginx.conf                # Global Nginx server configuration
└── README.md                 # Documentation
```

## 3. Planned Routing Table (Phase 7)
- `/` -> `frontend:3000` (Next.js Application)
- `/api/v1/core/` -> `backend:8000/api/v1/` (Django REST Framework)
- `/api/v1/sync/` -> `go-service:8080/api/v1/` (Go Independent Service)
- `/api/v1/reports/` -> `php-service:8001/api/v1/` (PHP Laravel Service)
