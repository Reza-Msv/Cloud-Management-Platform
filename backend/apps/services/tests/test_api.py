from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.customers.models import Customer
from apps.services.models import Service, ServiceStatus, ServiceType

User = get_user_model()


class CustomerServiceAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='serviceadmin', password='password123')
        self.customer = Customer.objects.create(
            first_name='Kaveh',
            last_name='Ahangar',
            email='kaveh@example.com',
            phone='+989123333333',
        )
        self.url = reverse('customers:customer-services', kwargs={'customer_id': self.customer.id})
        self.valid_payload = {
            'name': 'Production Worker VM',
            'service_type': ServiceType.VPS,
        }

    def _service_detail_url(self, service_id: int):
        return reverse('services:service-detail', kwargs={'service_id': service_id})

    def _service_status_url(self, service_id: int):
        return reverse('services:service-status-update', kwargs={'service_id': service_id})

    # ==========================
    # Customer Services Tests
    # ==========================
    def test_unauthenticated_requests_are_rejected(self):
        """Requests without authentication return 401 or 403."""
        response = self.client.get(self.url)
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

        response = self.client.post(self.url, self.valid_payload, format='json')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_post_service_success(self):
        """Authenticated user creates service for customer; returns 201 Created with initial active status."""
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        data = response.data
        self.assertIn('id', data)
        self.assertEqual(data['name'], 'Production Worker VM')
        self.assertEqual(data['service_type'], ServiceType.VPS)
        self.assertEqual(data['status'], ServiceStatus.ACTIVE)
        self.assertEqual(data['customer'], self.customer.id)
        self.assertIn('created_at', data)

        service = Service.objects.get(id=data['id'])
        self.assertEqual(service.customer, self.customer)
        self.assertEqual(service.status, ServiceStatus.ACTIVE)

    def test_get_customer_services_success(self):
        """GET returns 200 OK with list of services for the customer in created_at desc order."""
        s1 = Service.objects.create(
            customer=self.customer,
            name='First Service',
            service_type=ServiceType.VPS,
            status=ServiceStatus.ACTIVE,
        )
        s2 = Service.objects.create(
            customer=self.customer,
            name='Second Service',
            service_type=ServiceType.CLOUD_STORAGE,
            status=ServiceStatus.ACTIVE,
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['id'], s2.id)
        self.assertEqual(response.data[1]['id'], s1.id)
        self.assertEqual(response.data[0]['customer'], self.customer.id)

    def test_get_customer_services_empty_list(self):
        """GET returns 200 OK with empty list when customer has no services."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_post_service_for_nonexistent_customer(self):
        """POST returns 404 Not Found when customer_id does not exist."""
        nonexistent_url = reverse('customers:customer-services', kwargs={'customer_id': 999999})
        self.client.force_authenticate(user=self.user)
        response = self.client.post(nonexistent_url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_service_for_nonexistent_customer(self):
        """GET returns 404 Not Found when customer_id does not exist."""
        nonexistent_url = reverse('customers:customer-services', kwargs={'customer_id': 999999})
        self.client.force_authenticate(user=self.user)
        response = self.client.get(nonexistent_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_post_service_invalid_service_type(self):
        """POST returns 400 Bad Request when service_type is invalid."""
        self.client.force_authenticate(user=self.user)
        payload = {'name': 'Valid Name', 'service_type': 'unsupported_type'}
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('service_type', response.data)

    def test_post_service_invalid_blank_name(self):
        """POST returns 400 Bad Request when name is empty or only whitespace."""
        self.client.force_authenticate(user=self.user)
        for bad_name in ['', '   ']:
            payload = {'name': bad_name, 'service_type': ServiceType.VPS}
            response = self.client.post(self.url, payload, format='json')
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn('name', response.data)

    def test_post_client_cannot_override_customer_id(self):
        """Client cannot attach service to another customer via request body."""
        other_customer = Customer.objects.create(
            first_name='Malicious',
            last_name='Attacker',
            email='attacker@example.com',
            phone='000',
        )
        self.client.force_authenticate(user=self.user)
        payload = {
            'name': 'Tampered Service',
            'service_type': ServiceType.VPS,
            'customer': other_customer.id,
        }
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['customer'], self.customer.id)
        created_service = Service.objects.get(id=response.data['id'])
        self.assertEqual(created_service.customer, self.customer)
        self.assertNotEqual(created_service.customer, other_customer)

    def test_post_client_cannot_override_initial_status(self):
        """Client cannot force initial status to suspended; it must default to active."""
        self.client.force_authenticate(user=self.user)
        payload = {
            'name': 'Status Override Attempt',
            'service_type': ServiceType.VPS,
            'status': ServiceStatus.SUSPENDED,
        }
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], ServiceStatus.ACTIVE)
        created_service = Service.objects.get(id=response.data['id'])
        self.assertEqual(created_service.status, ServiceStatus.ACTIVE)

    # ==========================
    # Service Detail Tests
    # ==========================
    def test_get_service_detail_success(self):
        """GET /api/v1/services/{id}/ returns 200 OK with correct service attributes."""
        service = Service.objects.create(
            customer=self.customer,
            name='Detail Test VM',
            service_type=ServiceType.VPS,
            status=ServiceStatus.ACTIVE,
        )
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self._service_detail_url(service.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertEqual(data['id'], service.id)
        self.assertEqual(data['name'], 'Detail Test VM')
        self.assertEqual(data['service_type'], ServiceType.VPS)
        self.assertEqual(data['status'], ServiceStatus.ACTIVE)
        self.assertEqual(data['customer'], self.customer.id)

    def test_get_service_detail_not_found(self):
        """GET /api/v1/services/{id}/ returns 404 for non-existent service ID."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self._service_detail_url(999999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_service_detail_unauthenticated(self):
        """GET /api/v1/services/{id}/ without authentication returns 401 or 403."""
        service = Service.objects.create(
            customer=self.customer,
            name='Unauth Test',
            service_type=ServiceType.VPS,
            status=ServiceStatus.ACTIVE,
        )
        response = self.client.get(self._service_detail_url(service.id))
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    # ==========================
    # Service Status Update Tests
    # ==========================
    def test_patch_service_status_to_suspended_success(self):
        """PATCH /api/v1/services/{id}/status/ updates status from active to suspended."""
        service = Service.objects.create(
            customer=self.customer,
            name='Suspend Me',
            service_type=ServiceType.VPS,
            status=ServiceStatus.ACTIVE,
        )
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(
            self._service_status_url(service.id),
            {'status': ServiceStatus.SUSPENDED},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], ServiceStatus.SUSPENDED)
        service.refresh_from_db()
        self.assertEqual(service.status, ServiceStatus.SUSPENDED)
        # Ensure customer relation didn't change
        self.assertEqual(service.customer, self.customer)

    def test_patch_service_status_to_active_success(self):
        """PATCH /api/v1/services/{id}/status/ updates status from suspended to active."""
        service = Service.objects.create(
            customer=self.customer,
            name='Activate Me',
            service_type=ServiceType.VPS,
            status=ServiceStatus.SUSPENDED,
        )
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(
            self._service_status_url(service.id),
            {'status': ServiceStatus.ACTIVE},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], ServiceStatus.ACTIVE)
        service.refresh_from_db()
        self.assertEqual(service.status, ServiceStatus.ACTIVE)

    def test_patch_service_status_invalid_value(self):
        """PATCH returns 400 Bad Request when status value is invalid."""
        service = Service.objects.create(
            customer=self.customer,
            name='Bad Status Test',
            service_type=ServiceType.VPS,
            status=ServiceStatus.ACTIVE,
        )
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(
            self._service_status_url(service.id),
            {'status': 'deleted_or_unknown'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('status', response.data)

    def test_patch_service_status_empty_body(self):
        """PATCH returns 400 Bad Request when body is empty."""
        service = Service.objects.create(
            customer=self.customer,
            name='Empty Body Test',
            service_type=ServiceType.VPS,
            status=ServiceStatus.ACTIVE,
        )
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(
            self._service_status_url(service.id),
            {},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_service_status_does_not_modify_other_fields(self):
        """PATCH only changes status; other fields cannot be modified through this endpoint."""
        service = Service.objects.create(
            customer=self.customer,
            name='Protected Name',
            service_type=ServiceType.CLOUD_STORAGE,
            status=ServiceStatus.ACTIVE,
        )
        original_created_at = service.created_at
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(
            self._service_status_url(service.id),
            {
                'status': ServiceStatus.SUSPENDED,
                'name': 'Attempted New Name',
                'service_type': 'vps',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        service.refresh_from_db()
        self.assertEqual(service.status, ServiceStatus.SUSPENDED)
        self.assertEqual(service.name, 'Protected Name')
        self.assertEqual(service.service_type, ServiceType.CLOUD_STORAGE)
        self.assertEqual(service.customer, self.customer)
        self.assertEqual(service.created_at, original_created_at)

    def test_patch_service_status_not_found(self):
        """PATCH returns 404 Not Found for non-existent service ID."""
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(
            self._service_status_url(999999),
            {'status': ServiceStatus.SUSPENDED},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_service_status_unauthenticated(self):
        """PATCH without authentication returns 401 or 403."""
        service = Service.objects.create(
            customer=self.customer,
            name='Unauth Patch',
            service_type=ServiceType.VPS,
            status=ServiceStatus.ACTIVE,
        )
        response = self.client.patch(
            self._service_status_url(service.id),
            {'status': ServiceStatus.SUSPENDED},
            format='json',
        )
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
