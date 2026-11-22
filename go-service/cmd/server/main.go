package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"cloud-management-go/internal/api/handlers"
	"cloud-management-go/internal/api/router"
	"cloud-management-go/internal/client/django"
	"cloud-management-go/internal/config"
	"cloud-management-go/internal/service"
)

func main() {
	cfg := config.Load()

	log.Printf("Starting cloud-management-go service (env=%s, version=%s)", cfg.AppEnv, cfg.AppVersion)

	// Initialize Django HTTP API client
	djangoClient := django.NewClient(
		cfg.DjangoAPIBaseURL,
		cfg.DjangoAPITimeout,
		cfg.DjangoAuthUsername,
		cfg.DjangoAuthPassword,
		nil,
	)

	// Initialize Core Services
	healthService := service.NewHealthService(
		"cloud-management-go",
		cfg.AppVersion,
		djangoClient,
	)

	// Initialize Handlers & Router
	healthHandler := handlers.NewHealthHandler(healthService)
	appRouter := router.NewRouter(healthHandler)

	// Configure HTTP Server
	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.HTTPPort),
		Handler:      appRouter,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Server run context for graceful shutdown
	serverCtx, serverStopCtx := context.WithCancel(context.Background())

	// Listen for syscall signals for process to interrupt/quit
	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGHUP, syscall.SIGINT, syscall.SIGTERM, syscall.SIGQUIT)
	go func() {
		<-sig

		// Shutdown signal with grace period of 30 seconds
		shutdownCtx, shutdownCancel := context.WithTimeout(serverCtx, 30*time.Second)
		defer shutdownCancel()

		go func() {
			<-shutdownCtx.Done()
			if shutdownCtx.Err() == context.DeadlineExceeded {
				log.Fatal("Graceful shutdown timed out.. forcing exit.")
			}
		}()

		log.Println("Shutting down server gracefully...")
		if err := server.Shutdown(shutdownCtx); err != nil {
			log.Fatalf("Server shutdown error: %v", err)
		}
		serverStopCtx()
	}()

	log.Printf("HTTP server listening on port %d", cfg.HTTPPort)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server ListenAndServe error: %v", err)
	}

	// Wait for server context to stop
	<-serverCtx.Done()
	log.Println("Server stopped cleanly")
}
