package model

import "time"

// ServiceStatus represents the operational status of a service in Django
type ServiceStatus string

const (
	StatusActive    ServiceStatus = "active"
	StatusSuspended ServiceStatus = "suspended"
)

// ServiceDetail represents the service record retrieved from Django's /api/v1/services/{id}/ endpoint
type ServiceDetail struct {
	ID          int           `json:"id"`
	Name        string        `json:"name"`
	ServiceType string        `json:"service_type"`
	Status      ServiceStatus `json:"status"`
	Customer    int           `json:"customer"`
	CreatedAt   time.Time     `json:"created_at"`
}

// HealthResponse represents the response payload for GET /health
type HealthResponse struct {
	Status        string         `json:"status"`
	ServiceName   string         `json:"service"`
	Version       string         `json:"version"`
	Uptime        string         `json:"uptime"`
	GoVersion     string         `json:"go_version"`
	ServiceDetail *ServiceDetail `json:"service_detail,omitempty"`
}

// ErrorResponse represents standard structured error responses
type ErrorResponse struct {
	Error  string `json:"error"`
	Detail string `json:"detail,omitempty"`
}
