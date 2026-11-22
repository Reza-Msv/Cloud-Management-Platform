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


class Phase266ServiceValidationFilteringPaginationAPITest(APITestCase):
    """
    Tests for Phase 2.6.6 requirements on Services:
    - Input validation (service name cannot be blank, service_type choices, status choices)
    - Service filtering by status and service_type (both customer-scoped and global list)
    - Filtering by customer_id on the global service list endpoint
    - Pagination on customer-scoped and global service list endpoints
    """

    def setUp(self):
        self.roles = setup_roles_and_permissions()
        self.admin_user = User.objects.create_user(username='srv_admin', password='password123')
        self.admin_user.groups.add(self.roles[ROLE_ADMIN])
        self.client.force_authenticate(user=self.admin_user)

        self.customer = Customer.objects.create(
            first_name='Mani',
            last_name='Khosravi',
            email='mani.khosravi@example.com',
            phone='+989123456789',
        )
        self.customer_services_url = reverse('customers:customer-services', kwargs={'customer_id': self.customer.id})
        self.global_services_url = reverse('services:service-list')

    # =========================================================================
    # 1. Validation Tests
    # =========================================================================
    def test_service_validation_blank_name(self):
        """Service name cannot be empty or solely whitespace; returns 400 Bad Request."""
        for invalid_name in ['', '   ', '\t\n']:
            with self.subTest(name=invalid_name):
                response = self.client.post(
                    self.customer_services_url,
                    {'name': invalid_name, 'service_type': ServiceType.VPS},
                    format='json',
                )
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn('name', response.data)

    def test_service_validation_invalid_service_type(self):
        """Service type must strictly match configured choices; returns 400 Bad Request."""
        for bad_type in ['invalid_type', 'kubernetes', 'aws_ec2']:
            with self.subTest(service_type=bad_type):
                response = self.client.post(
                    self.customer_services_url,
                    {'name': 'Valid Name', 'service_type': bad_type},
                    format='json',
                )
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn('service_type', response.data)

    def test_service_validation_invalid_status_update(self):
        """Status update requires a valid status ('active' or 'suspended'); returns 400."""
        service = Service.objects.create(
            customer=self.customer,
            name='VM 1',
            service_type=ServiceType.VPS,
            status=ServiceStatus.ACTIVE,
        )
        status_url = reverse('services:service-status-update', kwargs={'service_id': service.id})

        for bad_status in ['stopped', 'deleted', 'terminated', '', '   ']:
            with self.subTest(status=bad_status):
                response = self.client.patch(status_url, {'status': bad_status}, format='json')
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn('status', response.data)

    # =========================================================================
    # 2. Filtering Tests
    # =========================================================================
    def test_customer_services_filter_by_status_and_type(self):
        """Customer-scoped services endpoint supports filtering by status and service_type."""
        s1 = Service.objects.create(customer=self.customer, name='Active VPS', service_type=ServiceType.VPS, status=ServiceStatus.ACTIVE)
        s2 = Service.objects.create(customer=self.customer, name='Suspended VPS', service_type=ServiceType.VPS, status=ServiceStatus.SUSPENDED)
        s3 = Service.objects.create(customer=self.customer, name='Active Storage', service_type=ServiceType.CLOUD_STORAGE, status=ServiceStatus.ACTIVE)

        # Filter by status='active' -> s1, s3
        res = self.client.get(f"{self.customer_services_url}?status=active")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['count'], 2)
        ids = [item['id'] for item in res.data['results']]
        self.assertIn(s1.id, ids)
        self.assertIn(s3.id, ids)

        # Filter by service_type='vps' -> s1, s2
        res = self.client.get(f"{self.customer_services_url}?service_type=vps")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['count'], 2)
        ids = [item['id'] for item in res.data['results']]
        self.assertIn(s1.id, ids)
        self.assertIn(s2.id, ids)

        # Filter by both status='suspended' AND service_type='vps' -> s2
        res = self.client.get(f"{self.customer_services_url}?status=suspended&service_type=vps")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['count'], 1)
        self.assertEqual(res.data['results'][0]['id'], s2.id)

    def test_global_service_list_filtering_and_pagination(self):
        """Global service list endpoint filters across customer_id, status, and service_type."""
        cust2 = Customer.objects.create(first_name='Second', last_name='Cust', email='second@cmp.com', phone='+989129999999')

        s1 = Service.objects.create(customer=self.customer, name='C1 Active VPS', service_type=ServiceType.VPS, status=ServiceStatus.ACTIVE)
        s2 = Service.objects.create(customer=cust2, name='C2 Active Storage', service_type=ServiceType.CLOUD_STORAGE, status=ServiceStatus.ACTIVE)
        s3 = Service.objects.create(customer=cust2, name='C2 Suspended VPS', service_type=ServiceType.VPS, status=ServiceStatus.SUSPENDED)

        # 1. Filter by customer_id
        res = self.client.get(f"{self.global_services_url}?customer_id={cust2.id}")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['count'], 2)
        ids = [x['id'] for x in res.data['results']]
        self.assertIn(s2.id, ids)
        self.assertIn(s3.id, ids)

        # 2. Invalid customer_id format returns 400
        res_bad = self.client.get(f"{self.global_services_url}?customer_id=not_an_int")
        self.assertEqual(res_bad.status_code, status.HTTP_400_BAD_REQUEST)

        # 3. Filter by status='active'
        res = self.client.get(f"{self.global_services_url}?status=active")
        self.assertEqual(res.data['count'], 2)
        ids = [x['id'] for x in res.data['results']]
        self.assertIn(s1.id, ids)
        self.assertIn(s2.id, ids)

        # 4. Filter by service_type='cloud_storage'
        res = self.client.get(f"{self.global_services_url}?service_type=cloud_storage")
        self.assertEqual(res.data['count'], 1)
        self.assertEqual(res.data['results'][0]['id'], s2.id)
