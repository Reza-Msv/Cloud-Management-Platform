package config

import (
	"bufio"
	"os"
	"strconv"
	"strings"
	"time"
)

// Config holds runtime configuration loaded from environment variables
type Config struct {
	HTTPPort           int
	AppEnv             string
	AppVersion         string
	DjangoAPIBaseURL   string
	DjangoAPITimeout   time.Duration
	DjangoAuthUsername string
	DjangoAuthPassword string
}

// loadDotEnv parses key=val pairs from a .env file only if the key is not already set in the OS environment.
// OS-provided environment variables strictly take precedence.
func loadDotEnv(filepath string) {
	file, err := os.Open(filepath)
	if err != nil {
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			key := strings.TrimSpace(parts[0])
			val := strings.TrimSpace(parts[1])
			// Strip surrounding quotes if present
			if len(val) >= 2 && ((val[0] == '"' && val[len(val)-1] == '"') || (val[0] == '\'' && val[len(val)-1] == '\'')) {
				val = val[1 : len(val)-1]
			}
			// Only set if not already defined in OS environment
			if _, exists := os.LookupEnv(key); !exists {
				_ = os.Setenv(key, val)
			}
		}
	}
}

// Load loads configuration from environment variables with sensible defaults
func Load() *Config {
	// Try loading from .env in current working directory or subdirectories
	loadDotEnv(".env")
	loadDotEnv("go-service/.env")

	port := 8080
	if portStr := os.Getenv("HTTP_PORT"); portStr != "" {
		if p, err := strconv.Atoi(portStr); err == nil && p > 0 {
			port = p
		}
	} else if portStr := os.Getenv("GO_PORT"); portStr != "" {
		if p, err := strconv.Atoi(portStr); err == nil && p > 0 {
			port = p
		}
	}

	env := os.Getenv("APP_ENV")
	if env == "" {
		env = os.Getenv("ENVIRONMENT")
	}
	if env == "" {
		env = "development"
	}

	version := os.Getenv("APP_VERSION")
	if version == "" {
		version = "1.0.0"
	}

	baseURL := os.Getenv("DJANGO_API_BASE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:8000/api/v1"
	}

	timeout := 5 * time.Second
	if timeoutStr := os.Getenv("DJANGO_API_TIMEOUT"); timeoutStr != "" {
		if d, err := time.ParseDuration(timeoutStr); err == nil && d > 0 {
			timeout = d
		}
	} else if timeoutSec := os.Getenv("DJANGO_API_TIMEOUT_SECONDS"); timeoutSec != "" {
		if s, err := strconv.Atoi(timeoutSec); err == nil && s > 0 {
			timeout = time.Duration(s) * time.Second
		}
	}

	username := os.Getenv("DJANGO_AUTH_USERNAME")
	password := os.Getenv("DJANGO_AUTH_PASSWORD")

	return &Config{
		HTTPPort:           port,
		AppEnv:             env,
		AppVersion:         version,
		DjangoAPIBaseURL:   baseURL,
		DjangoAPITimeout:   timeout,
		DjangoAuthUsername: username,
		DjangoAuthPassword: password,
	}
}
