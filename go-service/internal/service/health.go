package service

import (
	"context"
	"errors"
	"runtime"
	"time"

	"cloud-management-go/internal/model"
)

// DjangoClient defines the interface for interacting with the Django core service
type DjangoClient interface {
	GetServiceByID(ctx context.Context, serviceID int) (*model.ServiceDetail, error)
}

// HealthService manages runtime health and service status inspection
type HealthService struct {
	serviceName  string
	version      string
	startTime    time.Time
	djangoClient DjangoClient
}

// NewHealthService creates a new HealthService instance
func NewHealthService(serviceName, version string, djangoClient DjangoClient) *HealthService {
	return &HealthService{
		serviceName:  serviceName,
		version:      version,
		startTime:    time.Now(),
		djangoClient: djangoClient,
	}
}

// GetHealth returns the runtime health of the Go service, optionally looking up service details
func (s *HealthService) GetHealth(ctx context.Context, serviceID *int) (*model.HealthResponse, error) {
	uptime := time.Since(s.startTime).Truncate(time.Second).String()

	resp := &model.HealthResponse{
		Status:      "ok",
		ServiceName: s.serviceName,
		Version:     s.version,
		Uptime:      uptime,
		GoVersion:   runtime.Version(),
	}

	if serviceID == nil {
		return resp, nil
	}

	if s.djangoClient == nil {
		return nil, errors.New("django client is not configured")
	}

	serviceDetail, err := s.djangoClient.GetServiceByID(ctx, *serviceID)
	if err != nil {
		return nil, err
	}

	resp.ServiceDetail = serviceDetail
	return resp, nil
}
