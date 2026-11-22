<?php

namespace App\Http\Controllers;

use App\Services\Django\DjangoApiClient;
use App\Services\Django\DjangoApiException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CustomerServiceController extends Controller
{
    protected DjangoApiClient $djangoApi;

    public function __construct(DjangoApiClient $djangoApi)
    {
        $this->djangoApi = $djangoApi;
    }

    /**
     * Show Customer Lookup page and results
     */
    public function index(Request $request)
    {
        $customerId = $request->query('customer_id');
        $customer = null;
        $services = [];
        $error = null;

        if ($customerId !== null && $customerId !== '') {
            $validated = filter_var($customerId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);

            if ($validated === false) {
                $error = 'Please enter a valid positive integer for Customer ID.';
            } else {
                try {
                    $customer = $this->djangoApi->getCustomer((int) $customerId);
                    $services = $this->djangoApi->getCustomerServices((int) $customerId);
                } catch (DjangoApiException $e) {
                    if ($e->getCode() === 404) {
                        $error = "Customer #{$customerId} was not found.";
                    } elseif ($e->getCode() === 502) {
                        $error = 'Authentication error with Django API. Please check service credentials.';
                    } elseif ($e->getCode() === 503) {
                        $error = 'Django Core API is temporarily unavailable or timed out.';
                    } else {
                        $error = 'An error occurred while communicating with the upstream API.';
                    }
                } catch (\Exception $e) {
                    Log::error('Unexpected error in CustomerServiceController@index', ['error' => $e->getMessage()]);
                    $error = 'An unexpected server error occurred.';
                }
            }
        }

        return view('customers.index', [
            'customerId' => $customerId,
            'customer' => $customer,
            'services' => $services,
            'error' => $error,
        ]);
    }

    /**
     * Change operational status of a service
     */
    public function updateStatus(Request $request, int $serviceId)
    {
        $request->validate([
            'status' => 'required|string|in:active,suspended',
            'customer_id' => 'required|integer|min:1',
        ]);

        $customerId = (int) $request->input('customer_id');
        $newStatus = (string) $request->input('status');

        try {
            // Verify service exists and belongs to the specified customer
            $service = $this->djangoApi->getService($serviceId);

            if (!isset($service['customer']) || (int) $service['customer'] !== $customerId) {
                return redirect()->route('customers.index', ['customer_id' => $customerId])
                    ->with('error', 'Security Violation: The requested service does not belong to this customer.');
            }

            // Dispatch status change to Django
            $updatedService = $this->djangoApi->updateServiceStatus($serviceId, $newStatus);

            return redirect()->route('customers.index', ['customer_id' => $customerId])
                ->with('success', "Service #{$serviceId} status successfully updated to '{$updatedService['status']}'.");
        } catch (DjangoApiException $e) {
            $msg = $e->getCode() === 404
                ? 'Service not found in upstream registry.'
                : ($e->getCode() === 400 ? $e->getMessage() : 'Failed to update service status via Django API.');

            return redirect()->route('customers.index', ['customer_id' => $customerId])
                ->with('error', $msg);
        } catch (\Exception $e) {
            Log::error('Unexpected error updating service status', ['service_id' => $serviceId, 'error' => $e->getMessage()]);
            return redirect()->route('customers.index', ['customer_id' => $customerId])
                ->with('error', 'An unexpected error occurred while updating the service.');
        }
    }
}
