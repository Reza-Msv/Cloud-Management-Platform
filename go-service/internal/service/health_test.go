package service_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"cloud-management-go/internal/model"
	"cloud-management-go/internal/service"
)

type mockDjangoClient struct {
	getServiceByIDFunc func(ctx context.Context, serviceID int) (*model.ServiceDetail, error)
}

func (m *mockDjangoClient) GetServiceByID(ctx context.Context, serviceID int) (*model.ServiceDetail, error) {
	return m.getServiceByIDFunc(ctx, serviceID)
}

func TestHealthService_GetHealth_WithoutServiceID(t *testing.T) {
	svc := service.NewHealthService("cloud-management-go", "1.0.0", &mockDjangoClient{})
	resp, err := svc.GetHealth(context.Background(), nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if resp.Status != "ok" {
		t.Errorf("expected status 'ok', got '%s'", resp.Status)
	}
	if resp.ServiceName != "cloud-management-go" {
		t.Errorf("expected service 'cloud-management-go', got '%s'", resp.ServiceName)
	}
	if resp.Version != "1.0.0" {
		t.Errorf("expected version '1.0.0', got '%s'", resp.Version)
	}
	if resp.Uptime == "" {
		t.Errorf("expected non-empty uptime")
	}
	if resp.GoVersion == "" {
		t.Errorf("expected non-empty go_version")
	}
	if resp.ServiceDetail != nil {
		t.Errorf("expected ServiceDetail to be nil when serviceID is nil")
	}
}

func TestHealthService_GetHealth_WithServiceID(t *testing.T) {
	mockClient := &mockDjangoClient{
		getServiceByIDFunc: func(ctx context.Context, serviceID int) (*model.ServiceDetail, error) {
			if serviceID != 42 {
				t.Fatalf("expected serviceID 42, got %d", serviceID)
			}
			return &model.ServiceDetail{
				ID:          42,
				Name:        "production-cluster",
				ServiceType: "dedicated_server",
				Status:      model.StatusActive,
				Customer:    5,
				CreatedAt:   time.Now(),
			}, nil
		},
	}

	svc := service.NewHealthService("cloud-management-go", "1.0.0", mockClient)
	id := 42
	resp, err := svc.GetHealth(context.Background(), &id)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if resp.ServiceDetail == nil {
		t.Fatalf("expected ServiceDetail to be populated")
	}
	if resp.ServiceDetail.ID != 42 {
		t.Errorf("expected ID 42, got %d", resp.ServiceDetail.ID)
	}
	if resp.ServiceDetail.Name != "production-cluster" {
		t.Errorf("expected name 'production-cluster', got '%s'", resp.ServiceDetail.Name)
	}
}

func TestHealthService_GetHealth_ClientError(t *testing.T) {
	expectedErr := errors.New("upstream failure")
	mockClient := &mockDjangoClient{
		getServiceByIDFunc: func(ctx context.Context, serviceID int) (*model.ServiceDetail, error) {
			return nil, expectedErr
		},
	}

	svc := service.NewHealthService("cloud-management-go", "1.0.0", mockClient)
	id := 10
	_, err := svc.GetHealth(context.Background(), &id)
	if !errors.Is(err, expectedErr) {
		t.Fatalf("expected error '%v', got '%v'", expectedErr, err)
	}
}
