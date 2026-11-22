package config_test

import (
	"os"
	"testing"
	"time"

	"cloud-management-go/internal/config"
)

func TestConfigDefaults(t *testing.T) {
	os.Clearenv()

	cfg := config.Load()
	if cfg.HTTPPort != 8080 {
		t.Errorf("expected default HTTPPort 8080, got %d", cfg.HTTPPort)
	}
	if cfg.AppEnv != "development" {
		t.Errorf("expected default AppEnv 'development', got '%s'", cfg.AppEnv)
	}
	if cfg.AppVersion != "1.0.0" {
		t.Errorf("expected default AppVersion '1.0.0', got '%s'", cfg.AppVersion)
	}
	if cfg.DjangoAPIBaseURL != "http://localhost:8000/api/v1" {
		t.Errorf("expected default DjangoAPIBaseURL, got '%s'", cfg.DjangoAPIBaseURL)
	}
	if cfg.DjangoAPITimeout != 5*time.Second {
		t.Errorf("expected default timeout 5s, got %v", cfg.DjangoAPITimeout)
	}
}

func TestConfigCustomEnvironment(t *testing.T) {
	os.Setenv("HTTP_PORT", "9090")
	os.Setenv("APP_ENV", "production")
	os.Setenv("APP_VERSION", "2.1.0")
	os.Setenv("DJANGO_API_BASE_URL", "http://django:8000/api/v1/")
	os.Setenv("DJANGO_API_TIMEOUT", "10s")
	os.Setenv("DJANGO_AUTH_USERNAME", "test_user")
	os.Setenv("DJANGO_AUTH_PASSWORD", "secret123")
	defer os.Clearenv()

	cfg := config.Load()
	if cfg.HTTPPort != 9090 {
		t.Errorf("expected HTTPPort 9090, got %d", cfg.HTTPPort)
	}
	if cfg.AppEnv != "production" {
		t.Errorf("expected AppEnv 'production', got '%s'", cfg.AppEnv)
	}
	if cfg.AppVersion != "2.1.0" {
		t.Errorf("expected AppVersion '2.1.0', got '%s'", cfg.AppVersion)
	}
	if cfg.DjangoAPIBaseURL != "http://django:8000/api/v1/" {
		t.Errorf("expected custom DjangoAPIBaseURL, got '%s'", cfg.DjangoAPIBaseURL)
	}
	if cfg.DjangoAPITimeout != 10*time.Second {
		t.Errorf("expected timeout 10s, got %v", cfg.DjangoAPITimeout)
	}
	if cfg.DjangoAuthUsername != "test_user" {
		t.Errorf("expected username 'test_user', got '%s'", cfg.DjangoAuthUsername)
	}
	if cfg.DjangoAuthPassword != "secret123" {
		t.Errorf("expected password 'secret123', got '%s'", cfg.DjangoAuthPassword)
	}
}
