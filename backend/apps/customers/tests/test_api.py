from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.customers.models import Customer

User = get_user_model()


class CustomerAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testadmin', password='securepassword123')
        self.url = reverse('customers:customer-list-create')
        self.valid_payload = {
            'first_name': 'Neda',
            'last_name': 'Tehrani',
            'email': 'neda.tehrani@example.com',
            'phone': '+989351234567',
        }

    def _detail_url(self, customer_id: int):
        return reverse('customers:customer-detail', kwargs={'customer_id': customer_id})

    # ==========================
    # List & Create API Tests
    # ==========================
    def test_unauthenticated_request_is_rejected(self):
        """Request without authentication returns 401 or 403 Forbidden."""
        response = self.client.get(self.url)
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

        response = self.client.post(self.url, self.valid_payload, format='json')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_create_customer_success(self):
        """Authenticated user creates customer with 201 Created and correct JSON payload."""
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        data = response.data
        self.assertIn('id', data)
        self.assertEqual(data['first_name'], 'Neda')
        self.assertEqual(data['last_name'], 'Tehrani')
        self.assertEqual(data['full_name'], 'Neda Tehrani')
        self.assertEqual(data['email'], 'neda.tehrani@example.com')
        self.assertEqual(data['phone'], '+989351234567')
        self.assertIn('created_at', data)
        self.assertTrue(Customer.objects.filter(email='neda.tehrani@example.com').exists())

    def test_get_customers_list_success(self):
        """Authenticated user gets list of customers with 200 OK ordered by -created_at."""
        c1 = Customer.objects.create(first_name='One', last_name='A', email='one@example.com', phone='1')
        c2 = Customer.objects.create(first_name='Two', last_name='B', email='two@example.com', phone='2')

        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['id'], c2.id)
        self.assertEqual(response.data[1]['id'], c1.id)
        self.assertEqual(response.data[0]['full_name'], 'Two B')

    def test_create_customer_missing_fields(self):
        """Incomplete payload returns 400 Bad Request."""
        self.client.force_authenticate(user=self.user)
        incomplete_payload = {'first_name': 'Incomplete'}
        response = self.client.post(self.url, incomplete_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('last_name', response.data)
        self.assertIn('email', response.data)
        self.assertIn('phone', response.data)

    def test_create_customer_invalid_email(self):
        """Malformed email returns 400 Bad Request."""
        self.client.force_authenticate(user=self.user)
        payload = self.valid_payload.copy()
        payload['email'] = 'invalid-email-address'
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_create_customer_duplicate_email(self):
        """Attempting to create duplicate email returns 400 Bad Request."""
        Customer.objects.create(**self.valid_payload)
        self.client.force_authenticate(user=self.user)

        response = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    # ==========================
    # Customer Detail (GET) Tests
    # ==========================
    def test_get_customer_detail_success(self):
        """GET /api/v1/customers/{id}/ returns 200 OK with accurate customer details."""
        customer = Customer.objects.create(**self.valid_payload)
        self.client.force_authenticate(user=self.user)

        response = self.client.get(self._detail_url(customer.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertEqual(data['id'], customer.id)
        self.assertEqual(data['first_name'], 'Neda')
        self.assertEqual(data['last_name'], 'Tehrani')
        self.assertEqual(data['full_name'], 'Neda Tehrani')
        self.assertEqual(data['email'], 'neda.tehrani@example.com')
        self.assertEqual(data['phone'], '+989351234567')
        self.assertIn('created_at', data)

    def test_get_customer_detail_not_found(self):
        """GET /api/v1/customers/{id}/ returns 404 for non-existent ID."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self._detail_url(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_customer_detail_unauthenticated(self):
        """GET /api/v1/customers/{id}/ without authentication returns 401 or 403."""
        customer = Customer.objects.create(**self.valid_payload)
        response = self.client.get(self._detail_url(customer.id))
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    # ==========================
    # Customer Update (PATCH) Tests
    # ==========================
    def test_patch_customer_phone_success(self):
        """PATCH updates phone number successfully and preserves other fields."""
        customer = Customer.objects.create(**self.valid_payload)
        self.client.force_authenticate(user=self.user)

        patch_data = {'phone': '+989120000000'}
        response = self.client.patch(self._detail_url(customer.id), patch_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['phone'], '+989120000000')
        self.assertEqual(response.data['first_name'], 'Neda')
        self.assertEqual(response.data['last_name'], 'Tehrani')

        customer.refresh_from_db()
        self.assertEqual(customer.phone, '+989120000000')

    def test_patch_customer_name_success(self):
        """PATCH updates first_name and full_name correctly."""
        customer = Customer.objects.create(**self.valid_payload)
        self.client.force_authenticate(user=self.user)

        patch_data = {'first_name': 'Maryam'}
        response = self.client.patch(self._detail_url(customer.id), patch_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'Maryam')
        self.assertEqual(response.data['full_name'], 'Maryam Tehrani')

        customer.refresh_from_db()
        self.assertEqual(customer.first_name, 'Maryam')

    def test_patch_customer_email_to_new_valid_email(self):
        """PATCH updates email to a new valid email."""
        customer = Customer.objects.create(**self.valid_payload)
        self.client.force_authenticate(user=self.user)

        patch_data = {'email': 'new.neda@example.com'}
        response = self.client.patch(self._detail_url(customer.id), patch_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'new.neda@example.com')

        customer.refresh_from_db()
        self.assertEqual(customer.email, 'new.neda@example.com')

    def test_patch_customer_rejects_invalid_email(self):
        """PATCH rejects invalid email format with 400 Bad Request."""
        customer = Customer.objects.create(**self.valid_payload)
        self.client.force_authenticate(user=self.user)

        patch_data = {'email': 'bad-email-format'}
        response = self.client.patch(self._detail_url(customer.id), patch_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_patch_customer_rejects_email_belonging_to_another(self):
        """PATCH rejects updating email to an email owned by another customer."""
        Customer.objects.create(
            first_name='Existing', last_name='User', email='existing@example.com', phone='123'
        )
        target_customer = Customer.objects.create(**self.valid_payload)
        self.client.force_authenticate(user=self.user)

        patch_data = {'email': 'existing@example.com'}
        response = self.client.patch(self._detail_url(target_customer.id), patch_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_patch_customer_allows_own_email(self):
        """PATCH allows submitting the customer's own current email."""
        customer = Customer.objects.create(**self.valid_payload)
        self.client.force_authenticate(user=self.user)

        patch_data = {'first_name': 'Changed', 'email': customer.email}
        response = self.client.patch(self._detail_url(customer.id), patch_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'Changed')
        self.assertEqual(response.data['email'], customer.email)

    def test_patch_customer_ignores_read_only_fields(self):
        """PATCH does not modify id or created_at when included in payload."""
        customer = Customer.objects.create(**self.valid_payload)
        original_id = customer.id
        original_created_at = customer.created_at
        self.client.force_authenticate(user=self.user)

        patch_data = {
            'id': 7777,
            'created_at': '2019-01-01T12:00:00Z',
            'full_name': 'Forced Name',
            'phone': '+989000000000',
        }
        response = self.client.patch(self._detail_url(customer.id), patch_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], original_id)
        self.assertEqual(response.data['phone'], '+989000000000')

        customer.refresh_from_db()
        self.assertEqual(customer.id, original_id)
        self.assertEqual(customer.created_at, original_created_at)

    def test_patch_customer_partial_update_preserves_other_fields(self):
        """PATCH with only one field leaves other fields untouched."""
        customer = Customer.objects.create(**self.valid_payload)
        self.client.force_authenticate(user=self.user)

        response = self.client.patch(self._detail_url(customer.id), {'last_name': 'Shirazi'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        customer.refresh_from_db()
        self.assertEqual(customer.first_name, 'Neda')
        self.assertEqual(customer.last_name, 'Shirazi')
        self.assertEqual(customer.email, 'neda.tehrani@example.com')
        self.assertEqual(customer.phone, '+989351234567')

    def test_patch_customer_unauthenticated(self):
        """PATCH without authentication returns 401 or 403."""
        customer = Customer.objects.create(**self.valid_payload)
        response = self.client.patch(self._detail_url(customer.id), {'phone': '000'}, format='json')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_patch_customer_not_found(self):
        """PATCH on non-existent customer returns 404 Not Found."""
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(self._detail_url(99999), {'phone': '000'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
