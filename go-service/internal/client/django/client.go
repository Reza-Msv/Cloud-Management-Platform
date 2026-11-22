package django

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"cloud-management-go/internal/model"
)

// Common errors returned by the Django client
var (
	ErrServiceNotFound = errors.New("service not found")
	ErrAuthFailed      = errors.New("upstream authentication or authorization failed")
	ErrUpstreamError   = errors.New("upstream service error")
	ErrUnavailable     = errors.New("upstream service unavailable")
)

// HTTPClient interface for testability and mocking
type HTTPClient interface {
	Do(req *http.Request) (*http.Response, error)
}

// Client represents the HTTP client communicating with Django REST API
type Client struct {
	baseURL    string
	timeout    time.Duration
	username   string
	password   string
	httpClient HTTPClient
}

// NewClient initializes a new Django API client
func NewClient(baseURL string, timeout time.Duration, username, password string, httpClient HTTPClient) *Client {
	if httpClient == nil {
		httpClient = &http.Client{
			Timeout: timeout,
		}
	}
	cleanBaseURL := strings.TrimRight(baseURL, "/")
	return &Client{
		baseURL:    cleanBaseURL,
		timeout:    timeout,
		username:   username,
		password:   password,
		httpClient: httpClient,
	}
}

// GetServiceByID retrieves a service by ID from Django's /api/v1/services/{id}/ endpoint
func (c *Client) GetServiceByID(ctx context.Context, serviceID int) (*model.ServiceDetail, error) {
	url := fmt.Sprintf("%s/services/%d/", c.baseURL, serviceID)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Accept", "application/json")
	if c.username != "" {
		req.SetBasicAuth(c.username, c.password)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		if errors.Is(ctx.Err(), context.Canceled) || errors.Is(ctx.Err(), context.DeadlineExceeded) {
			return nil, ctx.Err()
		}
		return nil, fmt.Errorf("%w: %v", ErrUnavailable, err)
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	switch resp.StatusCode {
	case http.StatusOK:
		var service model.ServiceDetail
		if err := json.Unmarshal(bodyBytes, &service); err != nil {
			return nil, fmt.Errorf("failed to parse service json: %w", err)
		}
		return &service, nil

	case http.StatusNotFound:
		return nil, ErrServiceNotFound

	case http.StatusUnauthorized, http.StatusForbidden:
		return nil, ErrAuthFailed

	case http.StatusBadGateway, http.StatusServiceUnavailable, http.StatusGatewayTimeout:
		return nil, ErrUnavailable

	default:
		return nil, fmt.Errorf("%w: status %d", ErrUpstreamError, resp.StatusCode)
	}
}
