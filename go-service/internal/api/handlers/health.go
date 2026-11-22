package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"cloud-management-go/internal/client/django"
	"cloud-management-go/internal/model"
)

// HealthService defines the business logic contract for health check and service status inspection
type HealthService interface {
	GetHealth(ctx context.Context, serviceID *int) (*model.HealthResponse, error)
}

// HealthHandler handles incoming HTTP requests for GET /health
type HealthHandler struct {
	healthService HealthService
}

// NewHealthHandler creates a new HealthHandler instance
func NewHealthHandler(healthService HealthService) *HealthHandler {
	return &HealthHandler{
		healthService: healthService,
	}
}

// ServeHTTP handles GET /health and GET /health?service_id={id}
func (h *HealthHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, model.ErrorResponse{
			Error: "method not allowed",
		})
		return
	}

	var serviceID *int
	queryParam := strings.TrimSpace(r.URL.Query().Get("service_id"))
	if queryParam != "" {
		id, err := strconv.Atoi(queryParam)
		if err != nil || id <= 0 {
			writeJSON(w, http.StatusBadRequest, model.ErrorResponse{
				Error:  "invalid service_id",
				Detail: "service_id must be a positive integer",
			})
			return
		}
		serviceID = &id
	}

	resp, err := h.healthService.GetHealth(r.Context(), serviceID)
	if err != nil {
		handleError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, resp)
}

func handleError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, django.ErrServiceNotFound):
		writeJSON(w, http.StatusNotFound, model.ErrorResponse{
			Error:  "service not found",
			Detail: "the requested service does not exist",
		})

	case errors.Is(err, django.ErrAuthFailed):
		writeJSON(w, http.StatusBadGateway, model.ErrorResponse{
			Error:  "upstream authentication failure",
			Detail: "unable to authenticate with upstream service",
		})

	case errors.Is(err, django.ErrUnavailable):
		writeJSON(w, http.StatusBadGateway, model.ErrorResponse{
			Error:  "upstream service unavailable",
			Detail: "failed to communicate with upstream service",
		})

	case errors.Is(err, context.DeadlineExceeded):
		writeJSON(w, http.StatusGatewayTimeout, model.ErrorResponse{
			Error:  "upstream timeout",
			Detail: "upstream request timed out",
		})

	case errors.Is(err, context.Canceled):
		writeJSON(w, 499, model.ErrorResponse{
			Error:  "request canceled",
			Detail: "client canceled the request",
		})

	default:
		writeJSON(w, http.StatusInternalServerError, model.ErrorResponse{
			Error:  "internal server error",
			Detail: "an unexpected error occurred",
		})
	}
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}
