# Cloud Management Platform — Release Notes v1.0.0

**Release Version:** `v1.0.0`  
**Release Date:** November 22, 2026  
**Status:** Stable Evaluator & Demo Release  

---

## 1. Release Executive Summary
The Cloud Management Platform (CMP) is a full-stack, multi-service Cloud Resource Management system structured as a clean Monorepo. This initial stable `v1.0.0` release delivers complete implementations of all core backend services, frontend dashboard capabilities, microservices, container infrastructure, automated test suites, and technical documentation.

---

## 2. Key Capabilities & Highlights

1. **Django Core Backend**:
   - Central authority and sole owner of the PostgreSQL database.
   - Comprehensive REST API endpoints for Customer organization management and Service lifecycle control.
   - Session-based authentication with double-submit CSRF cookie protection.
   - Fine-grained Role-Based Access Control (`Admin` vs `Operator`).
   - Interactive Swagger UI documentation at `/api/docs/`.
   - 122 automated unit and integration tests passing.

2. **Next.js SaaS Dashboard**:
   - Built on Next.js 16 (App Router) and React 19.
   - Complete internationalization (`en` and `fa`) featuring full RTL and LTR bidirectional layout switching.
   - Dynamic dark, light, and system theme switching without hydration mismatches.
   - Real-time System Health widget powered by Go microservice integration.

3. **Go Health & Status Inspector Microservice**:
   - High-performance, zero-dependency Go 1.22 runtime health reporter.
   - Status inspection endpoint (`GET /health?service_id=10`) querying Django REST APIs upstream.

4. **PHP / Laravel Customer Portal**:
   - Independent customer lookup and service status management portal.
   - Strict relationship integrity checks preventing cross-customer resource manipulation.

5. **Docker Infrastructure & Persistence**:
   - Complete multi-service orchestration via `docker-compose.yml`.
   - Named volume persistence (`cmp_postgres_data`) ensuring database state survives restarts.
   - Isolated bridge network (`cmp_network`) preventing unauthorized access to PostgreSQL.
   - Hardened non-root containers for all applications.

---

## 3. Evaluator Quickstart
```bash
# 1. Start all containers in detached mode
docker compose up -d

# 2. Check container health
docker compose ps

# 3. Access applications
# Frontend:   http://localhost:3000
# API Docs:   http://localhost:8000/api/docs/
# Go Health:  http://localhost:8080/health?service_id=10
# PHP Portal: http://localhost:8001/?customer_id=28
```

---

## 4. Known Considerations
- Demo login presets on the frontend login page (`admin_user` and `operator_user`) are strictly evaluation fixtures and should be disabled in production environments.
- The service record `id: 10` retains `service_type: kubernetes` as an evaluation fixture; Django REST serializers strictly enforce the 4 canonical types (`vps`, `cloud_server`, `dedicated_server`, `cloud_storage`) on all new mutations.
