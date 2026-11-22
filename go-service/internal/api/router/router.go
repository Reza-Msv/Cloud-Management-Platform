package router

import (
	"net/http"

	"cloud-management-go/internal/api/handlers"
)

// Router maps URL paths to HTTP handlers
type Router struct {
	mux           *http.ServeMux
	healthHandler *handlers.HealthHandler
}

// NewRouter constructs a new Router with standard library http.ServeMux
func NewRouter(healthHandler *handlers.HealthHandler) *Router {
	mux := http.NewServeMux()

	// Register /health and /health/
	mux.Handle("/health", healthHandler)
	mux.Handle("/health/", healthHandler)

	return &Router{
		mux:           mux,
		healthHandler: healthHandler,
	}
}

// ServeHTTP delegates to the internal ServeMux
func (r *Router) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	r.mux.ServeHTTP(w, req)
}
