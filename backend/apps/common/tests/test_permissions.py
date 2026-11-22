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


class RoleBasedAccessControlAPITest(APITestCase):
    """
    Comprehensive RBAC validation tests covering Phase 2.6.5 permission matrix:
    - Admin: Full access to Customer & Service endpoints
    - Operator: Read-only for Customer (GET 200, POST/PATCH 403); Full access for Service (GET, POST, PATCH status)
    - Regular Authenticated User (No Role): Denied on all endpoints (403 Forbidden)
    - Anonymous User: Denied on all endpoints (401 Unauthorized)
    - Superuser: Unrestricted access to all endpoints
    """

    def setUp(self):
        self.roles = setup_roles_and_permissions()

        # Users
        self.admin_user = User.objects.create_user(username='admin_user', password='password123')
        self.admin_user.groups.add(self.roles[ROLE_ADMIN])

        self.operator_user = User.objects.create_user(username='operator_user', password='password123')
        self.operator_user.groups.add(self.roles[ROLE_OPERATOR])

        self.norole_user = User.objects.create_user(username='norole_user', password='password123')

        self.superuser = User.objects.create_superuser(username='super_user', email='super@example.com', password='password123')

        # Test Data
        self.customer = Customer.objects.create(
            first_name='Ali',
            last_name='Rad',
            email='ali.rad@example.com',
            phone='+989121111111',
        )
        self.service = Service.objects.create(
            customer=self.customer,
            name='Primary Database',
            service_type=ServiceType.VPS,
            status=ServiceStatus.ACTIVE,
        )

        # URLs
        self.customers_list_url = reverse('customers:customer-list-create')
        self.customer_detail_url = reverse('customers:customer-detail', kwargs={'customer_id': self.customer.id})
        self.customer_services_url = reverse('customers:customer-services', kwargs={'customer_id': self.customer.id})
        self.service_detail_url = reverse('services:service-detail', kwargs={'service_id': self.service.id})
        self.service_status_url = reverse('services:service-status-update', kwargs={'service_id': self.service.id})

    # =========================================================================
    # Anonymous Requests (Expect 401 Unauthorized)
    # =========================================================================
    def test_anonymous_user_denied_on_all_endpoints(self):
        """Unauthenticated requests must be rejected with 401 Unauthorized."""
        endpoints = [
            ('GET', self.customers_list_url, None),
            ('POST', self.customers_list_url, {'first_name': 'A', 'last_name': 'B', 'email': 'a@b.com', 'phone': '123'}),
            ('GET', self.customer_detail_url, None),
            ('PATCH', self.customer_detail_url, {'phone': '999'}),
            ('GET', self.customer_services_url, None),
            ('POST', self.customer_services_url, {'name': 'VM', 'service_type': ServiceType.VPS}),
            ('GET', self.service_detail_url, None),
            ('PATCH', self.service_status_url, {'status': ServiceStatus.SUSPENDED}),
        ]

        for method, url, data in endpoints:
            with self.subTest(method=method, url=url):
                if method == 'GET':
                    response = self.client.get(url)
                elif method == 'POST':
                    response = self.client.post(url, data, format='json')
                elif method == 'PATCH':
                    response = self.client.patch(url, data, format='json')
                self.assertEqual(
                    response.status_code,
                    status.HTTP_401_UNAUTHORIZED,
                    f"Anonymous {method} {url} should return 401, got {response.status_code}",
                )

    # =========================================================================
    # Authenticated User Without Role (Expect 403 Forbidden)
    # =========================================================================
    def test_authenticated_user_without_role_denied_on_all_endpoints(self):
        """Authenticated users without Admin or Operator group must be denied with 403 Forbidden."""
        self.client.force_authenticate(user=self.norole_user)
        endpoints = [
            ('GET', self.customers_list_url, None),
            ('POST', self.customers_list_url, {'first_name': 'A', 'last_name': 'B', 'email': 'a@b.com', 'phone': '123'}),
            ('GET', self.customer_detail_url, None),
            ('PATCH', self.customer_detail_url, {'phone': '999'}),
            ('GET', self.customer_services_url, None),
            ('POST', self.customer_services_url, {'name': 'VM', 'service_type': ServiceType.VPS}),
            ('GET', self.service_detail_url, None),
            ('PATCH', self.service_status_url, {'status': ServiceStatus.SUSPENDED}),
        ]

        for method, url, data in endpoints:
            with self.subTest(method=method, url=url):
                if method == 'GET':
                    response = self.client.get(url)
                elif method == 'POST':
                    response = self.client.post(url, data, format='json')
                elif method == 'PATCH':
                    response = self.client.patch(url, data, format='json')
                self.assertEqual(
                    response.status_code,
                    status.HTTP_403_FORBIDDEN,
                    f"NoRole user {method} {url} should return 403, got {response.status_code}",
                )

    # =========================================================================
    # Operator Role Permissions
    # =========================================================================
    def test_operator_can_view_customers(self):
        """Operator can list customers and view customer details (GET 200)."""
        self.client.force_authenticate(user=self.operator_user)

        res_list = self.client.get(self.customers_list_url)
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)

        res_detail = self.client.get(self.customer_detail_url)
        self.assertEqual(res_detail.status_code, status.HTTP_200_OK)
        self.assertEqual(res_detail.data['email'], self.customer.email)

    def test_operator_cannot_create_or_update_customer(self):
        """Operator is strictly forbidden from creating or updating customers (403 Forbidden)."""
        self.client.force_authenticate(user=self.operator_user)

        # POST /api/v1/customers/ -> 403
        post_payload = {
            'first_name': 'Sina',
            'last_name': 'Moradi',
            'email': 'sina.moradi@example.com',
            'phone': '+989122222222',
        }
        res_post = self.client.post(self.customers_list_url, post_payload, format='json')
        self.assertEqual(res_post.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(Customer.objects.filter(email='sina.moradi@example.com').exists())

        # PATCH /api/v1/customers/{id}/ -> 403
        patch_payload = {'phone': '+989129999999'}
        res_patch = self.client.patch(self.customer_detail_url, patch_payload, format='json')
        self.assertEqual(res_patch.status_code, status.HTTP_403_FORBIDDEN)
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.phone, '+989121111111')

    def test_operator_can_view_create_and_update_service(self):
        """Operator can view services, provision service for customer, and change service status."""
        self.client.force_authenticate(user=self.operator_user)

        # 1. GET /api/v1/customers/{id}/services/ -> 200
        res_list = self.client.get(self.customer_services_url)
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        # res_list.data is now paginated: {'count': 1, 'results': [...]}
        results = res_list.data.get('results', res_list.data)
        self.assertEqual(len(results), 1)

        # 2. POST /api/v1/customers/{id}/services/ -> 201
        res_create = self.client.post(
            self.customer_services_url,
            {'name': 'Operator Cloud VPS', 'service_type': ServiceType.VPS},
            format='json',
        )
        self.assertEqual(res_create.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_create.data['status'], ServiceStatus.ACTIVE)

        # 3. GET /api/v1/services/{id}/ -> 200
        res_detail = self.client.get(self.service_detail_url)
        self.assertEqual(res_detail.status_code, status.HTTP_200_OK)
        self.assertEqual(res_detail.data['id'], self.service.id)

        # 4. PATCH /api/v1/services/{id}/status/ -> 200
        res_status = self.client.patch(
            self.service_status_url,
            {'status': ServiceStatus.SUSPENDED},
            format='json',
        )
        self.assertEqual(res_status.status_code, status.HTTP_200_OK)
        self.service.refresh_from_db()
        self.assertEqual(self.service.status, ServiceStatus.SUSPENDED)

    # =========================================================================
    # Admin Role Permissions
    # =========================================================================
    def test_admin_has_full_access_to_customer_and_service(self):
        """Admin role can perform all Customer and Service operations."""
        self.client.force_authenticate(user=self.admin_user)

        # Customer List & Create
        res_list = self.client.get(self.customers_list_url)
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)

        res_create = self.client.post(
            self.customers_list_url,
            {
                'first_name': 'Sara',
                'last_name': 'Kaviani',
                'email': 'sara.kaviani@example.com',
                'phone': '+989128888888',
            },
            format='json',
        )
        self.assertEqual(res_create.status_code, status.HTTP_201_CREATED)
        new_cust_id = res_create.data['id']

        # Customer Detail & Update
        res_detail = self.client.get(self.customer_detail_url)
        self.assertEqual(res_detail.status_code, status.HTTP_200_OK)

        res_patch = self.client.patch(
            self.customer_detail_url,
            {'phone': '+989127777777'},
            format='json',
        )
        self.assertEqual(res_patch.status_code, status.HTTP_200_OK)
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.phone, '+989127777777')

        # Customer Service List & Create
        res_srv_list = self.client.get(self.customer_services_url)
        self.assertEqual(res_srv_list.status_code, status.HTTP_200_OK)

        res_srv_create = self.client.post(
            self.customer_services_url,
            {'name': 'Admin Object Storage', 'service_type': ServiceType.CLOUD_STORAGE},
            format='json',
        )
        self.assertEqual(res_srv_create.status_code, status.HTTP_201_CREATED)

        # Service Detail & Status Update
        res_srv_detail = self.client.get(self.service_detail_url)
        self.assertEqual(res_srv_detail.status_code, status.HTTP_200_OK)

        res_srv_status = self.client.patch(
            self.service_status_url,
            {'status': ServiceStatus.SUSPENDED},
            format='json',
        )
        self.assertEqual(res_srv_status.status_code, status.HTTP_200_OK)
        self.service.refresh_from_db()
        self.assertEqual(self.service.status, ServiceStatus.SUSPENDED)

    # =========================================================================
    # Superuser Access
    # =========================================================================
    def test_superuser_has_unrestricted_access(self):
        """Superuser can access all endpoints without explicit group membership."""
        self.client.force_authenticate(user=self.superuser)

        self.assertEqual(self.client.get(self.customers_list_url).status_code, status.HTTP_200_OK)
        self.assertEqual(
            self.client.post(
                self.customers_list_url,
                {'first_name': 'Super', 'last_name': 'Admin', 'email': 'super_admin@example.com', 'phone': '+989120000000'},
                format='json',
            ).status_code,
            status.HTTP_201_CREATED,
        )
        self.assertEqual(self.client.get(self.customer_detail_url).status_code, status.HTTP_200_OK)
        self.assertEqual(
            self.client.patch(self.customer_detail_url, {'phone': '+989121112233'}, format='json').status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(self.client.get(self.customer_services_url).status_code, status.HTTP_200_OK)
        self.assertEqual(
            self.client.post(
                self.customer_services_url,
                {'name': 'Super Service', 'service_type': ServiceType.VPS},
                format='json',
            ).status_code,
            status.HTTP_201_CREATED,
        )
        self.assertEqual(self.client.get(self.service_detail_url).status_code, status.HTTP_200_OK)
        self.assertEqual(
            self.client.patch(self.service_status_url, {'status': ServiceStatus.SUSPENDED}, format='json').status_code,
            status.HTTP_200_OK,
        )
