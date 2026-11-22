<?php

namespace App\Services\Django;

use Exception;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DjangoApiClient
{
    protected string $baseUrl;
    protected int $timeout;
    protected string $username;
    protected string $password;

    public function __construct(?string $baseUrl = null, ?int $timeout = null, ?string $username = null, ?string $password = null)
    {
        $this->baseUrl = rtrim($baseUrl ?? config('django.base_url', 'http://localhost:8000/api/v1'), '/');
        $this->timeout = $timeout ?? config('django.timeout', 10);
        $this->username = $username ?? config('django.auth_username', '');
        $this->password = $password ?? config('django.auth_password', '');
    }

    /**
     * Build an authenticated HTTP client instance
     */
    protected function client()
    {
        $request = Http::timeout($this->timeout)
            ->acceptJson()
            ->asJson();

        if (!empty($this->username)) {
            $request = $request->withBasicAuth($this->username, $this->password);
        }

        return $request;
    }

    /**
     * Retrieve Customer details by ID
     * GET /api/v1/customers/{id}/
     */
    public function getCustomer(int $id): array
    {
        $url = "{$this->baseUrl}/customers/{$id}/";

        try {
            $response = $this->client()->get($url);

            if ($response->status() === 404) {
                throw new DjangoApiException('Customer not found.', 404);
            }

            if ($response->status() === 401 || $response->status() === 403) {
                Log::warning('Django API authentication failed during customer lookup', ['customer_id' => $id]);
                throw new DjangoApiException('Upstream authentication failure.', 502);
            }

            if (!$response->successful()) {
                throw new DjangoApiException("Upstream error: {$response->status()}", $response->status());
            }

            return $response->json();
        } catch (ConnectionException $e) {
            Log::error('Django API connection error', ['url' => $url, 'error' => $e->getMessage()]);
            throw new DjangoApiException('Django API service is unavailable or timed out.', 503, $e);
        }
    }

    /**
     * Retrieve services provisioned for a customer
     * GET /api/v1/customers/{id}/services/
     */
    public function getCustomerServices(int $customerId): array
    {
        $url = "{$this->baseUrl}/customers/{$customerId}/services/";

        try {
            $response = $this->client()->get($url);

            if ($response->status() === 404) {
                throw new DjangoApiException('Customer not found.', 404);
            }

            if ($response->status() === 401 || $response->status() === 403) {
                Log::warning('Django API authentication failed during services lookup', ['customer_id' => $customerId]);
                throw new DjangoApiException('Upstream authentication failure.', 502);
            }

            if (!$response->successful()) {
                throw new DjangoApiException("Upstream error: {$response->status()}", $response->status());
            }

            $data = $response->json();
            // Handle paginated response structure if present
            if (isset($data['results']) && is_array($data['results'])) {
                return $data['results'];
            }

            return is_array($data) ? $data : [];
        } catch (ConnectionException $e) {
            Log::error('Django API connection error', ['url' => $url, 'error' => $e->getMessage()]);
            throw new DjangoApiException('Django API service is unavailable or timed out.', 503, $e);
        }
    }

    /**
     * Retrieve service details by ID
     * GET /api/v1/services/{id}/
     */
    public function getService(int $serviceId): array
    {
        $url = "{$this->baseUrl}/services/{$serviceId}/";

        try {
            $response = $this->client()->get($url);

            if ($response->status() === 404) {
                throw new DjangoApiException('Service not found.', 404);
            }

            if ($response->status() === 401 || $response->status() === 403) {
                throw new DjangoApiException('Upstream authentication failure.', 502);
            }

            if (!$response->successful()) {
                throw new DjangoApiException("Upstream error: {$response->status()}", $response->status());
            }

            return $response->json();
        } catch (ConnectionException $e) {
            Log::error('Django API connection error', ['url' => $url, 'error' => $e->getMessage()]);
            throw new DjangoApiException('Django API service is unavailable or timed out.', 503, $e);
        }
    }

    /**
     * Update operational status of a service
     * PATCH /api/v1/services/{id}/status/
     */
    public function updateServiceStatus(int $serviceId, string $status): array
    {
        $url = "{$this->baseUrl}/services/{$serviceId}/status/";

        try {
            $response = $this->client()->patch($url, [
                'status' => $status,
            ]);

            if ($response->status() === 404) {
                throw new DjangoApiException('Service not found.', 404);
            }

            if ($response->status() === 400) {
                $errorBody = $response->json();
                $message = is_array($errorBody) && isset($errorBody['status'])
                    ? (is_array($errorBody['status']) ? implode(' ', $errorBody['status']) : $errorBody['status'])
                    : 'Invalid status request.';
                throw new DjangoApiException($message, 400);
            }

            if ($response->status() === 401 || $response->status() === 403) {
                throw new DjangoApiException('Upstream authentication failure.', 502);
            }

            if (!$response->successful()) {
                throw new DjangoApiException("Upstream error: {$response->status()}", $response->status());
            }

            return $response->json();
        } catch (ConnectionException $e) {
            Log::error('Django API connection error', ['url' => $url, 'error' => $e->getMessage()]);
            throw new DjangoApiException('Django API service is unavailable or timed out.', 503, $e);
        }
    }
}
