package handlers_test

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"cloud-management-go/internal/api/handlers"
	"cloud-management-go/internal/client/django"
	"cloud-management-go/internal/model"
)

type mockHealthService struct {
	getHealthFunc func(ctx context.Context, serviceID *int) (*model.HealthResponse, error)
}

func (m *mockHealthService) GetHealth(ctx context.Context, serviceID *int) (*model.HealthResponse, error) {
	return m.getHealthFunc(ctx, serviceID)
}

func TestHealthHandler_BasicHealth(t *testing.T) {
	mockSvc := &mockHealthService{
		getHealthFunc: func(ctx context.Context, serviceID *int) (*model.HealthResponse, error) {
			if serviceID != nil {
				t.Errorf("expected serviceID to be nil")
			}
			return &model.HealthResponse{
				Status:      "ok",
				ServiceName: "cloud-management-go",
				Version:     "1.0.0",
				Uptime:      "5m0s",
				GoVersion:   "go1.22",
			}, nil
		},
	}

	handler := handlers.NewHealthHandler(mockSvc)
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}

	var resp model.HealthResponse
	if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to parse json: %v", err)
	}

	if resp.Status != "ok" {
		t.Errorf("expected status 'ok', got '%s'", resp.Status)
	}
	if resp.ServiceName != "cloud-management-go" {
		t.Errorf("expected service name 'cloud-management-go', got '%s'", resp.ServiceName)
	}
	if resp.Version != "1.0.0" {
		t.Errorf("expected version '1.0.0', got '%s'", resp.Version)
	}
	if resp.ServiceDetail != nil {
		t.Errorf("expected nil ServiceDetail")
	}
}

func TestHealthHandler_WithValidServiceID(t *testing.T) {
	mockSvc := &mockHealthService{
		getHealthFunc: func(ctx context.Context, serviceID *int) (*model.HealthResponse, error) {
			if serviceID == nil || *serviceID != 12 {
				t.Fatalf("expected serviceID 12, got %v", serviceID)
			}
			return &model.HealthResponse{
				Status:      "ok",
				ServiceName: "cloud-management-go",
				Version:     "1.0.0",
				Uptime:      "5m0s",
				GoVersion:   "go1.22",
				ServiceDetail: &model.ServiceDetail{
					ID:          12,
					Name:        "Test VPS",
					ServiceType: "vps",
					Status:      model.StatusActive,
					Customer:    1,
					CreatedAt:   time.Now(),
				},
			}, nil
		},
	}

	handler := handlers.NewHealthHandler(mockSvc)
	req := httptest.NewRequest(http.MethodGet, "/health?service_id=12", nil)
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}

	var resp model.HealthResponse
	if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to parse json: %v", err)
	}

	if resp.ServiceDetail == nil || resp.ServiceDetail.ID != 12 {
		t.Errorf("expected service ID 12 in response")
	}
}

func TestHealthHandler_InvalidServiceID(t *testing.T) {
	handler := handlers.NewHealthHandler(&mockHealthService{})

	testCases := []string{
		"/health?service_id=abc",
		"/health?service_id=-5",
		"/health?service_id=0",
	}

	for _, tc := range testCases {
		req := httptest.NewRequest(http.MethodGet, tc, nil)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		if rr.Code != http.StatusBadRequest {
			t.Errorf("for path %s, expected 400 Bad Request, got %d", tc, rr.Code)
		}
		var errResp model.ErrorResponse
		_ = json.Unmarshal(rr.Body.Bytes(), &errResp)
		if errResp.Error != "invalid service_id" {
			t.Errorf("expected error 'invalid service_id', got '%s'", errResp.Error)
		}
	}
}

func TestHealthHandler_NotFound(t *testing.T) {
	mockSvc := &mockHealthService{
		getHealthFunc: func(ctx context.Context, serviceID *int) (*model.HealthResponse, error) {
			return nil, django.ErrServiceNotFound
		},
	}

	handler := handlers.NewHealthHandler(mockSvc)
	req := httptest.NewRequest(http.MethodGet, "/health?service_id=999", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected 404 Not Found, got %d", rr.Code)
	}
}

func TestHealthHandler_UpstreamAuthError(t *testing.T) {
	mockSvc := &mockHealthService{
		getHealthFunc: func(ctx context.Context, serviceID *int) (*model.HealthResponse, error) {
			return nil, django.ErrAuthFailed
		},
	}

	handler := handlers.NewHealthHandler(mockSvc)
	req := httptest.NewRequest(http.MethodGet, "/health?service_id=12", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadGateway {
		t.Fatalf("expected 502 Bad Gateway, got %d", rr.Code)
	}
}

func TestHealthHandler_UpstreamUnavailable(t *testing.T) {
	mockSvc := &mockHealthService{
		getHealthFunc: func(ctx context.Context, serviceID *int) (*model.HealthResponse, error) {
			return nil, django.ErrUnavailable
		},
	}

	handler := handlers.NewHealthHandler(mockSvc)
	req := httptest.NewRequest(http.MethodGet, "/health?service_id=12", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadGateway {
		t.Fatalf("expected 502 Bad Gateway, got %d", rr.Code)
	}
}

func TestHealthHandler_UpstreamTimeout(t *testing.T) {
	mockSvc := &mockHealthService{
		getHealthFunc: func(ctx context.Context, serviceID *int) (*model.HealthResponse, error) {
			return nil, context.DeadlineExceeded
		},
	}

	handler := handlers.NewHealthHandler(mockSvc)
	req := httptest.NewRequest(http.MethodGet, "/health?service_id=12", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusGatewayTimeout {
		t.Fatalf("expected 504 Gateway Timeout, got %d", rr.Code)
	}
}

func TestHealthHandler_MethodNotAllowed(t *testing.T) {
	handler := handlers.NewHealthHandler(&mockHealthService{})
	req := httptest.NewRequest(http.MethodPost, "/health", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405 Method Not Allowed, got %d", rr.Code)
	}
}

func TestHealthHandler_UnexpectedError(t *testing.T) {
	mockSvc := &mockHealthService{
		getHealthFunc: func(ctx context.Context, serviceID *int) (*model.HealthResponse, error) {
			return nil, errors.New("something catastrophic")
		},
	}

	handler := handlers.NewHealthHandler(mockSvc)
	req := httptest.NewRequest(http.MethodGet, "/health?service_id=12", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500 Internal Server Error, got %d", rr.Code)
	}
}
