from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.common.permissions import (
    ROLE_ADMIN,
    ROLE_OPERATOR,
    setup_roles_and_permissions,
)
from apps.customers.models import Customer
from apps.services.models import Service, ServiceStatus, ServiceType

User = get_user_model()


class Phase266ConsistentErrorHandlingAPITest(APITestCase):
    """
    Tests for Phase 2.6.6 Consistent Error Handling:
    - 400 Bad Request structure
    - 401 Unauthorized structure
    - 403 Forbidden structure
    - 404 Not Found structure
    - 500 Internal Server Error safe handling (no stack traces leaked)
    """

    def setUp(self):
        self.roles = setup_roles_and_permissions()
        self.admin_user = User.objects.create_user(username='err_admin', password='password123')
        self.admin_user.groups.add(self.roles[ROLE_ADMIN])

        self.operator_user = User.objects.create_user(username='err_operator', password='password123')
        self.operator_user.groups.add(self.roles[ROLE_OPERATOR])

        self.norole_user = User.objects.create_user(username='err_norole', password='password123')

        self.customer = Customer.objects.create(
            first_name='Ehsan',
            last_name='Naderi',
            email='ehsan.naderi@example.com',
            phone='+989123456789',
        )

    def test_400_bad_request_structure(self):
        """400 Bad Request returns structured field-keyed errors."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            reverse('customers:customer-list-create'),
            {'first_name': '', 'last_name': '', 'email': 'bad', 'phone': '123'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIsInstance(response.data, dict)
        self.assertIn('first_name', response.data)
        self.assertIn('last_name', response.data)
        self.assertIn('email', response.data)
        self.assertIn('phone', response.data)

    def test_401_unauthorized_structure(self):
        """401 Unauthorized returns standard error detail and WWW-Authenticate header."""
        response = self.client.get(reverse('customers:customer-list-create'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('detail', response.data)
        self.assertIn('WWW-Authenticate', response.headers)

    def test_403_forbidden_structure(self):
        """403 Forbidden returns standard detail without leaking sensitive data."""
        self.client.force_authenticate(user=self.norole_user)
        response = self.client.get(reverse('customers:customer-list-create'))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('detail', response.data)

    def test_404_not_found_structure(self):
        """404 Not Found returns consistent 'detail' error message for missing entities."""
        self.client.force_authenticate(user=self.admin_user)

        # 404 Customer
        res_cust = self.client.get(reverse('customers:customer-detail', kwargs={'customer_id': 999999}))
        self.assertEqual(res_cust.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('detail', res_cust.data)

        # 404 Customer Services
        res_srvs = self.client.get(reverse('customers:customer-services', kwargs={'customer_id': 999999}))
        self.assertEqual(res_srvs.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('detail', res_srvs.data)

        # 404 Standalone Service
        res_srv = self.client.get(reverse('services:service-detail', kwargs={'service_id': 999999}))
        self.assertEqual(res_srv.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('detail', res_srv.data)

    def test_500_internal_server_error_safe_response(self):
        """Unhandled exceptions return a safe 500 response without leaking internal tracebacks."""
        self.client.force_authenticate(user=self.admin_user)

        with patch('apps.customers.views.get_customers_list') as mocked_selector:
            mocked_selector.side_effect = RuntimeError("Database connection crashed unexpectedly!")

            response = self.client.get(reverse('customers:customer-list-create'))
            self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
            self.assertIn('detail', response.data)
            # Ensure the raw internal exception string or traceback is NOT exposed to the client
            self.assertNotIn('Database connection crashed', str(response.data))
            self.assertNotIn('Traceback', str(response.data))
