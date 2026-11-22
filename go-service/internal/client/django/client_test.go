package django_test

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"cloud-management-go/internal/client/django"
	"cloud-management-go/internal/model"
)

type mockHTTPClient struct {
	doFunc func(req *http.Request) (*http.Response, error)
}

func (m *mockHTTPClient) Do(req *http.Request) (*http.Response, error) {
	return m.doFunc(req)
}

func TestGetServiceByID_Success(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			t.Errorf("expected GET, got %s", r.Method)
		}
		if r.URL.Path != "/services/10/" {
			t.Errorf("expected path /services/10/, got %s", r.URL.Path)
		}
		user, pass, ok := r.BasicAuth()
		if !ok || user != "admin" || pass != "secret" {
			t.Errorf("expected basic auth credentials admin:secret, got %s:%s (ok=%v)", user, pass, ok)
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{
			"id": 10,
			"name": "storage-volume",
			"service_type": "cloud_storage",
			"status": "active",
			"customer": 28,
			"created_at": "2026-11-22T17:22:05Z"
		}`))
	}))
	defer ts.Close()

	client := django.NewClient(ts.URL, 2*time.Second, "admin", "secret", ts.Client())
	svc, err := client.GetServiceByID(context.Background(), 10)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if svc.ID != 10 {
		t.Errorf("expected ID 10, got %d", svc.ID)
	}
	if svc.Name != "storage-volume" {
		t.Errorf("expected name 'storage-volume', got '%s'", svc.Name)
	}
	if svc.ServiceType != "cloud_storage" {
		t.Errorf("expected service_type 'cloud_storage', got '%s'", svc.ServiceType)
	}
	if svc.Status != model.StatusActive {
		t.Errorf("expected status 'active', got '%s'", svc.Status)
	}
	if svc.Customer != 28 {
		t.Errorf("expected customer 28, got %d", svc.Customer)
	}
}

func TestGetServiceByID_NotFound(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
		_, _ = w.Write([]byte(`{"detail": "Service not found."}`))
	}))
	defer ts.Close()

	client := django.NewClient(ts.URL, 2*time.Second, "", "", ts.Client())
	_, err := client.GetServiceByID(context.Background(), 999)
	if !errors.Is(err, django.ErrServiceNotFound) {
		t.Fatalf("expected ErrServiceNotFound, got %v", err)
	}
}

func TestGetServiceByID_AuthFailure(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
		_, _ = w.Write([]byte(`{"detail": "Invalid credentials."}`))
	}))
	defer ts.Close()

	client := django.NewClient(ts.URL, 2*time.Second, "bad", "creds", ts.Client())
	_, err := client.GetServiceByID(context.Background(), 10)
	if !errors.Is(err, django.ErrAuthFailed) {
		t.Fatalf("expected ErrAuthFailed, got %v", err)
	}
}

func TestGetServiceByID_Unavailable(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusServiceUnavailable)
	}))
	defer ts.Close()

	client := django.NewClient(ts.URL, 2*time.Second, "", "", ts.Client())
	_, err := client.GetServiceByID(context.Background(), 10)
	if !errors.Is(err, django.ErrUnavailable) {
		t.Fatalf("expected ErrUnavailable, got %v", err)
	}
}

func TestGetServiceByID_ContextTimeout(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(50 * time.Millisecond)
		w.WriteHeader(http.StatusOK)
	}))
	defer ts.Close()

	client := django.NewClient(ts.URL, 10*time.Millisecond, "", "", ts.Client())
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Millisecond)
	defer cancel()

	_, err := client.GetServiceByID(ctx, 10)
	if err == nil {
		t.Fatalf("expected context timeout error, got nil")
	}
}
