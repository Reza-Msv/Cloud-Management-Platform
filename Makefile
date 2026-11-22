# ==============================================================================
# Cloud Management Platform (CMP) - Unified Makefile
# ==============================================================================
# This Makefile provides shared shortcut commands for managing and developing
# the monorepo services across different phases of the project.
# ==============================================================================

.PHONY: help setup-env clean check-structure

help:
	@echo "=========================================================="
	@echo " Cloud Management Platform (CMP) - Available Commands"
	@echo "=========================================================="
	@echo "  make setup-env        - Copy all .env.example files to .env"
	@echo "  make check-structure  - Verify required directories exist"
	@echo "  make dev-backend      - Run Django backend locally (Phase 2)"
	@echo "  make dev-frontend     - Run Next.js frontend locally (Phase 3)"
	@echo "  make dev-go           - Run Go microservice locally (Phase 4)"
	@echo "  make dev-php          - Run PHP/Laravel service locally (Phase 5)"
	@echo "  make clean            - Clean temporary files, caches, and logs"
	@echo "=========================================================="

setup-env:
	@echo "Creating local .env files from templates..."
	@test -f .env || cp .env.example .env
	@test -f frontend/.env || cp frontend/.env.example frontend/.env
	@test -f backend/.env || cp backend/.env.example backend/.env
	@test -f go-service/.env || cp go-service/.env.example go-service/.env
	@test -f php-service/.env || cp php-service/.env.example php-service/.env
	@echo "Environment files generated successfully. Update credentials as needed."

check-structure:
	@echo "Verifying monorepo workspace directories..."
	@test -d frontend && echo "[OK] frontend/" || echo "[FAIL] frontend/ missing"
	@test -d backend && echo "[OK] backend/" || echo "[FAIL] backend/ missing"
	@test -d go-service && echo "[OK] go-service/" || echo "[FAIL] go-service/ missing"
	@test -d php-service && echo "[OK] php-service/" || echo "[FAIL] php-service/ missing"
	@test -d infrastructure && echo "[OK] infrastructure/" || echo "[FAIL] infrastructure/ missing"
	@test -d docs && echo "[OK] docs/" || echo "[FAIL] docs/ missing"
	@test -d scripts && echo "[OK] scripts/" || echo "[FAIL] scripts/ missing"

# Target placeholders for future development phases
dev-backend:
	@echo "[Notice] Core backend setup scheduled for Phase 2."

dev-frontend:
	@echo "[Notice] Frontend setup scheduled for Phase 3."

dev-go:
	@echo "[Notice] Go service setup scheduled for Phase 4."

dev-php:
	@echo "[Notice] PHP service setup scheduled for Phase 5."

clean:
	@echo "Cleaning temporary build and cache artifacts..."
	@find . -name "*.pyc" -delete
	@find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
	@find . -name ".DS_Store" -delete
	@echo "Cleanup completed."
