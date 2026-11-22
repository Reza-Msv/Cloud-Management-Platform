from django.test import TestCase

from apps.customers.models import Customer
from apps.services.models import Service, ServiceStatus, ServiceType
from apps.services.selectors import get_customer_services
from apps.services.services import create_service


class ServiceServiceAndSelectorTest(TestCase):
    def setUp(self):
        self.customer = Customer.objects.create(
            first_name='Hassan',
            last_name='Moradi',
            email='hassan.moradi@example.com',
            phone='+989122222222',
        )

    def test_create_service_via_service_layer(self):
        """Service layer creates service with active status attached to customer."""
        service = create_service(
            customer=self.customer,
            name='Cloud PostgreSQL DB',
            service_type=ServiceType.CLOUD_SERVER,
        )
        self.assertIsNotNone(service.id)
        self.assertEqual(service.name, 'Cloud PostgreSQL DB')
        self.assertEqual(service.service_type, ServiceType.CLOUD_SERVER)
        self.assertEqual(service.status, ServiceStatus.ACTIVE)
        self.assertEqual(service.customer, self.customer)

    def test_selector_get_customer_services(self):
        """Selector retrieves only services of target customer in created_at desc order."""
        other_customer = Customer.objects.create(
            first_name='Other',
            last_name='Person',
            email='other.person@example.com',
            phone='456',
        )
        # Create services for target customer
        s1 = Service.objects.create(
            name='First Service',
            service_type=ServiceType.VPS,
            status=ServiceStatus.ACTIVE,
            customer=self.customer,
        )
        s2 = Service.objects.create(
            name='Second Service',
            service_type=ServiceType.CLOUD_STORAGE,
            status=ServiceStatus.ACTIVE,
            customer=self.customer,
        )
        # Create service for other customer
        Service.objects.create(
            name='Foreign Service',
            service_type=ServiceType.DEDICATED_SERVER,
            status=ServiceStatus.ACTIVE,
            customer=other_customer,
        )

        qs = get_customer_services(customer=self.customer)
        self.assertEqual(list(qs), [s2, s1])
        self.assertEqual(qs.count(), 2)

    def test_selector_empty_for_customer_without_services(self):
        """Selector returns empty queryset for customer with no services."""
        qs = get_customer_services(customer=self.customer)
        self.assertEqual(qs.count(), 0)
