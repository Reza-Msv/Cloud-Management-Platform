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
        # Verify ordering: c2 was created after c1
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
