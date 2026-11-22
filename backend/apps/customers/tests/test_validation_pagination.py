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


class Phase266CustomerValidationFilteringPaginationAPITest(APITestCase):
    """
    Tests for Phase 2.6.6 requirements on Customers:
    - Input validation (empty names, invalid emails, blank/short/long phone numbers)
    - PageNumber pagination (page_size default 10, custom page_size, max_page_size 100)
    - Response structure (count, next, previous, results)
    - Search across first_name, last_name, email, phone
    - Dedicated filters: first_name, last_name, email, phone
    """

    def setUp(self):
        self.roles = setup_roles_and_permissions()
        self.admin_user = User.objects.create_user(username='admin_test', password='password123')
        self.admin_user.groups.add(self.roles[ROLE_ADMIN])
        self.client.force_authenticate(user=self.admin_user)
        self.url = reverse('customers:customer-list-create')

    # =========================================================================
    # 1. Input Validation Tests
    # =========================================================================
    def test_customer_validation_empty_names(self):
        """Empty or whitespace-only first_name and last_name receive 400 Bad Request."""
        payload = {
            'first_name': '   ',
            'last_name': '   ',
            'email': 'valid@example.com',
            'phone': '+989123456789',
        }
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('first_name', response.data)
        self.assertIn('last_name', response.data)

    def test_customer_validation_invalid_email(self):
        """Malformed or blank emails receive 400 Bad Request."""
        for invalid_email in ['', '   ', 'not-an-email', 'missing_domain@']:
            with self.subTest(email=invalid_email):
                response = self.client.post(
                    self.url,
                    {
                        'first_name': 'Ali',
                        'last_name': 'Rezaei',
                        'email': invalid_email,
                        'phone': '+989123456789',
                    },
                    format='json',
                )
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn('email', response.data)

    def test_customer_validation_phone_formats(self):
        """Valid international phone numbers pass; invalid formats and lengths fail with 400."""
        # Valid numbers (various formats)
        valid_phones = [
            '+989123456789',
            '+1 (555) 234-5678',
            '0044 20 7946 0991',
            '+49-30-123456',
            '09123456789',
        ]
        for idx, phone in enumerate(valid_phones):
            with self.subTest(phone=phone):
                response = self.client.post(
                    self.url,
                    {
                        'first_name': f'Valid{idx}',
                        'last_name': 'User',
                        'email': f'valid_{idx}@example.com',
                        'phone': phone,
                    },
                    format='json',
                )
                self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Invalid numbers (letters, too short, too long)
        invalid_phones = [
            '123',  # too short (< 7 digits)
            'abc1234567',  # invalid letters
            '+98 1234 5678 9012 3456 7890 12',  # too long (> 20 digits)
            '',  # empty
            '   ',  # whitespace
        ]
        for phone in invalid_phones:
            with self.subTest(invalid_phone=phone):
                response = self.client.post(
                    self.url,
                    {
                        'first_name': 'Invalid',
                        'last_name': 'Phone',
                        'email': f'phone_fail_{abs(hash(phone))}@example.com',
                        'phone': phone,
                    },
                    format='json',
                )
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn('phone', response.data)

    # =========================================================================
    # 2. Pagination Tests
    # =========================================================================
    def test_customer_list_pagination_default_page_size(self):
        """Customer list defaults to 10 per page with count, next, previous, and results."""
        customers = [
            Customer(
                first_name=f'User{i:02d}',
                last_name='Batch',
                email=f'user{i:02d}@cmp.com',
                phone=f'+9891200000{i:02d}',
            )
            for i in range(25)
        ]
        Customer.objects.bulk_create(customers)

        # Page 1
        res_p1 = self.client.get(self.url)
        self.assertEqual(res_p1.status_code, status.HTTP_200_OK)
        self.assertEqual(res_p1.data['count'], 25)
        self.assertIsNotNone(res_p1.data['next'])
        self.assertIsNone(res_p1.data['previous'])
        self.assertEqual(len(res_p1.data['results']), 10)

        # Page 2
        res_p2 = self.client.get(f"{self.url}?page=2")
        self.assertEqual(res_p2.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(res_p2.data['next'])
        self.assertIsNotNone(res_p2.data['previous'])
        self.assertEqual(len(res_p2.data['results']), 10)

        # Page 3
        res_p3 = self.client.get(f"{self.url}?page=3")
        self.assertEqual(res_p3.status_code, status.HTTP_200_OK)
        self.assertIsNone(res_p3.data['next'])
        self.assertIsNotNone(res_p3.data['previous'])
        self.assertEqual(len(res_p3.data['results']), 5)

    def test_customer_list_pagination_custom_page_size(self):
        """Clients can request custom page_size, constrained up to 100 max."""
        customers = [
            Customer(
                first_name=f'Batch{i:02d}',
                last_name='Test',
                email=f'batch{i:02d}@cmp.com',
                phone=f'+9891211111{i:02d}',
            )
            for i in range(30)
        ]
        Customer.objects.bulk_create(customers)

        # Custom page_size = 15
        res = self.client.get(f"{self.url}?page_size=15")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data['results']), 15)
        self.assertEqual(res.data['count'], 30)

        # Exceeding max page_size (e.g. 500) will cap at 100
        res_max = self.client.get(f"{self.url}?page_size=500")
        self.assertEqual(res_max.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_max.data['results']), 30)

    # =========================================================================
    # 3. Filtering & Search Tests
    # =========================================================================
    def test_customer_list_search_and_filters(self):
        """Search across fields and specific filters isolate matching customer records."""
        c1 = Customer.objects.create(first_name='Kaveh', last_name='Ahangar', email='kaveh@isfahan.ir', phone='+989131111111')
        c2 = Customer.objects.create(first_name='Rostam', last_name='Zal', email='rostam@zabol.ir', phone='+989542222222')
        c3 = Customer.objects.create(first_name='Sohrab', last_name='Rostami', email='sohrab@turan.ir', phone='+989543333333')

        # 1. Global search by term matching first_name
        res = self.client.get(f"{self.url}?search=Kaveh")
        self.assertEqual(res.data['count'], 1)
        self.assertEqual(res.data['results'][0]['id'], c1.id)

        # 2. Global search matching email
        res = self.client.get(f"{self.url}?search=zabol")
        self.assertEqual(res.data['count'], 1)
        self.assertEqual(res.data['results'][0]['id'], c2.id)

        # 3. Global search matching phone substring
        res = self.client.get(f"{self.url}?search=954")
        self.assertEqual(res.data['count'], 2)

        # 4. Specific filter by first_name
        res = self.client.get(f"{self.url}?first_name=Sohrab")
        self.assertEqual(res.data['count'], 1)
        self.assertEqual(res.data['results'][0]['id'], c3.id)

        # 5. Specific filter by email
        res = self.client.get(f"{self.url}?email=isfahan.ir")
        self.assertEqual(res.data['count'], 1)
        self.assertEqual(res.data['results'][0]['id'], c1.id)

        # 6. Specific filter by phone
        res = self.client.get(f"{self.url}?phone=98913")
        self.assertEqual(res.data['count'], 1)
        self.assertEqual(res.data['results'][0]['id'], c1.id)
