package tests

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"cloud-management-go/internal/api/handlers"
	"cloud-management-go/internal/api/router"
	"cloud-management-go/internal/client/django"
	"cloud-management-go/internal/model"
	"cloud-management-go/internal/service"
)

func TestE2E_HealthEndpoint(t *testing.T) {
	// 1. Mock Django Backend Server
	djangoMock := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/api/v1/services/10/":
			user, pass, ok := r.BasicAuth()
			if !ok || user != "admin_user" || pass != "SecretPassword123!" {
				w.WriteHeader(http.StatusUnauthorized)
				_, _ = w.Write([]byte(`{"detail":"Authentication credentials were not provided."}`))
				return
			}
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{
				"id": 10,
				"name": "storage",
				"service_type": "cloud_storage",
				"status": "active",
				"customer": 28,
				"created_at": "2026-11-22T17:22:05.748940Z"
			}`))
		case "/api/v1/services/999/":
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			_, _ = w.Write([]byte(`{"detail":"Service not found."}`))
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer djangoMock.Close()

	// 2. Wire up the Go Service
	djangoClient := django.NewClient(
		djangoMock.URL+"/api/v1",
		2*time.Second,
		"admin_user",
		"SecretPassword123!",
		djangoMock.Client(),
	)
	healthSvc := service.NewHealthService("cloud-management-go", "1.0.0", djangoClient)
	healthHandler := handlers.NewHealthHandler(healthSvc)
	appRouter := router.NewRouter(healthHandler)

	goServer := httptest.NewServer(appRouter)
	defer goServer.Close()

	client := goServer.Client()

	// Scenario A: GET /health (Standard runtime health)
	t.Run("GET /health returns runtime information", func(t *testing.T) {
		resp, err := client.Get(goServer.URL + "/health")
		if err != nil {
			t.Fatalf("failed to call /health: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Errorf("expected status 200, got %d", resp.StatusCode)
		}

		var health model.HealthResponse
		if err := json.NewDecoder(resp.Body).Decode(&health); err != nil {
			t.Fatalf("failed to parse json response: %v", err)
		}

		if health.Status != "ok" || health.ServiceName != "cloud-management-go" {
			t.Errorf("unexpected health body: %+v", health)
		}
		if health.ServiceDetail != nil {
			t.Errorf("expected ServiceDetail to be nil")
		}
	})

	// Scenario B: GET /health?service_id=10 (Successful lookup)
	t.Run("GET /health?service_id=10 retrieves service detail", func(t *testing.T) {
		resp, err := client.Get(goServer.URL + "/health?service_id=10")
		if err != nil {
			t.Fatalf("failed to call /health?service_id=10: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Errorf("expected status 200, got %d", resp.StatusCode)
		}

		var health model.HealthResponse
		if err := json.NewDecoder(resp.Body).Decode(&health); err != nil {
			t.Fatalf("failed to parse json response: %v", err)
		}

		if health.ServiceDetail == nil {
			t.Fatalf("expected ServiceDetail to be present")
		}
		if health.ServiceDetail.ID != 10 || health.ServiceDetail.Name != "storage" {
			t.Errorf("unexpected ServiceDetail: %+v", health.ServiceDetail)
		}
	})

	// Scenario C: GET /health?service_id=999 (404 Not Found)
	t.Run("GET /health?service_id=999 returns 404 for unknown service", func(t *testing.T) {
		resp, err := client.Get(goServer.URL + "/health?service_id=999")
		if err != nil {
			t.Fatalf("failed to call /health?service_id=999: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusNotFound {
			t.Errorf("expected status 404, got %d", resp.StatusCode)
		}
	})

	// Scenario D: GET /health?service_id=invalid (400 Bad Request)
	t.Run("GET /health?service_id=invalid returns 400 Bad Request", func(t *testing.T) {
		resp, err := client.Get(goServer.URL + "/health?service_id=not-an-int")
		if err != nil {
			t.Fatalf("failed to call /health?service_id=invalid: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusBadRequest {
			t.Errorf("expected status 400, got %d", resp.StatusCode)
		}
	})
}
