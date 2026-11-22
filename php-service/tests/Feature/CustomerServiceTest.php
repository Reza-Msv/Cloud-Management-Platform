<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CustomerServiceTest extends TestCase
{
    /**
     * Test valid customer lookup returns customer and their services
     */
    public function test_valid_customer_lookup_displays_information()
    {
        Http::fake([
            '*/api/v1/customers/28/' => Http::response([
                'id' => 28,
                'first_name' => 'Alice',
                'last_name' => 'Smith',
                'email' => 'alice@example.com',
                'phone' => '+15551234567',
                'created_at' => '2026-11-20T10:00:00Z',
            ], 200),
            '*/api/v1/customers/28/services/' => Http::response([
                'count' => 1,
                'next' => null,
                'previous' => null,
                'results' => [
                    [
                        'id' => 10,
                        'name' => 'storage-bucket',
                        'service_type' => 'cloud_storage',
                        'status' => 'active',
                        'customer' => 28,
                        'created_at' => '2026-11-20T10:05:00Z',
                    ],
                ],
            ], 200),
        ]);

        $response = $this->get('/?customer_id=28');

        $response->assertStatus(200);
        $response->assertSee('Customer Profile: Alice Smith');
        $response->assertSee('alice@example.com');
        $response->assertSee('+15551234567');
        $response->assertSee('storage-bucket');
        $response->assertSee('cloud_storage');
        $response->assertSee('active');
    }

    /**
     * Test lookup with non-existent customer displays error
     */
    public function test_unknown_customer_displays_not_found()
    {
        Http::fake([
            '*/api/v1/customers/999/' => Http::response(['detail' => 'Customer not found.'], 404),
            '*/api/v1/customers/999/services/' => Http::response(['detail' => 'Customer not found.'], 404),
        ]);

        $response = $this->get('/?customer_id=999');

        $response->assertStatus(200);
        $response->assertSee('Customer #999 was not found.');
    }

    /**
     * Test invalid customer ID (e.g. string or negative)
     */
    public function test_invalid_customer_id_displays_validation_error()
    {
        $response = $this->get('/?customer_id=-5');

        $response->assertStatus(200);
        $response->assertSee('Please enter a valid positive integer for Customer ID.');
    }

    /**
     * Test empty services list
     */
    public function test_customer_with_no_services()
    {
        Http::fake([
            '*/api/v1/customers/30/' => Http::response([
                'id' => 30,
                'first_name' => 'Bob',
                'last_name' => 'Brown',
                'email' => 'bob@example.com',
                'phone' => '+15559876543',
                'created_at' => '2026-11-21T10:00:00Z',
            ], 200),
            '*/api/v1/customers/30/services/' => Http::response([
                'count' => 0,
                'next' => null,
                'previous' => null,
                'results' => [],
            ], 200),
        ]);

        $response = $this->get('/?customer_id=30');

        $response->assertStatus(200);
        $response->assertSee('No active or provisioned services found for Customer #30.');
    }

    /**
     * Test successful status update
     */
    public function test_valid_service_status_update()
    {
        Http::fake([
            '*/api/v1/services/10/' => Http::response([
                'id' => 10,
                'name' => 'storage-bucket',
                'service_type' => 'cloud_storage',
                'status' => 'active',
                'customer' => 28,
            ], 200),
            '*/api/v1/services/10/status/' => Http::response([
                'id' => 10,
                'name' => 'storage-bucket',
                'service_type' => 'cloud_storage',
                'status' => 'suspended',
                'customer' => 28,
            ], 200),
        ]);

        $response = $this->patch('/services/10/status', [
            'customer_id' => 28,
            'status' => 'suspended',
        ]);

        $response->assertRedirect('/?customer_id=28');
        $response->assertSessionHas('success', "Service #10 status successfully updated to 'suspended'.");
    }

    /**
     * Test status update fails if service does not belong to specified customer
     */
    public function test_service_not_belonging_to_customer_rejected()
    {
        Http::fake([
            '*/api/v1/services/10/' => Http::response([
                'id' => 10,
                'name' => 'storage-bucket',
                'service_type' => 'cloud_storage',
                'status' => 'active',
                'customer' => 99, // Owned by Customer 99, but requested under Customer 28
            ], 200),
        ]);

        $response = $this->patch('/services/10/status', [
            'customer_id' => 28,
            'status' => 'suspended',
        ]);

        $response->assertRedirect('/?customer_id=28');
        $response->assertSessionHas('error', 'Security Violation: The requested service does not belong to this customer.');
    }

    /**
     * Test invalid status parameter
     */
    public function test_invalid_status_value_fails_validation()
    {
        $response = $this->patch('/services/10/status', [
            'customer_id' => 28,
            'status' => 'deleted', // not in active,suspended
        ]);

        $response->assertSessionHasErrors(['status']);
    }

    /**
     * Test upstream Django unavailable/timeout
     */
    public function test_upstream_django_unavailable()
    {
        Http::fake([
            '*/api/v1/customers/28/' => Http::response(null, 503),
        ]);

        $response = $this->get('/?customer_id=28');

        $response->assertStatus(200);
        $response->assertSee('Django Core API is temporarily unavailable or timed out.');
    }

    /**
     * Test upstream Django authentication failure
     */
    public function test_upstream_django_auth_failure()
    {
        Http::fake([
            '*/api/v1/customers/28/' => Http::response(['detail' => 'Invalid credentials.'], 401),
        ]);

        $response = $this->get('/?customer_id=28');

        $response->assertStatus(200);
        $response->assertSee('Authentication error with Django API. Please check service credentials.');
    }
}
