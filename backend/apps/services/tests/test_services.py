from django.test import TestCase

from apps.customers.models import Customer
from apps.services.models import Service, ServiceStatus, ServiceType
from apps.services.selectors import get_customer_services, get_service_by_id
from apps.services.services import create_service, update_service_status


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

    def test_update_service_status_active_to_suspended(self):
        """Service layer updates status from active to suspended."""
        service = Service.objects.create(
            customer=self.customer,
            name='Test Service',
            service_type=ServiceType.VPS,
            status=ServiceStatus.ACTIVE,
        )
        updated = update_service_status(service=service, status=ServiceStatus.SUSPENDED)
        self.assertEqual(updated.status, ServiceStatus.SUSPENDED)
        service.refresh_from_db()
        self.assertEqual(service.status, ServiceStatus.SUSPENDED)

    def test_update_service_status_suspended_to_active(self):
        """Service layer updates status from suspended to active."""
        service = Service.objects.create(
            customer=self.customer,
            name='Test Service',
            service_type=ServiceType.VPS,
            status=ServiceStatus.SUSPENDED,
        )
        updated = update_service_status(service=service, status=ServiceStatus.ACTIVE)
        self.assertEqual(updated.status, ServiceStatus.ACTIVE)
        service.refresh_from_db()
        self.assertEqual(service.status, ServiceStatus.ACTIVE)

    def test_update_service_status_preserves_other_fields(self):
        """Service layer status update leaves other fields untouched."""
        service = Service.objects.create(
            customer=self.customer,
            name='Immutable Name',
            service_type=ServiceType.CLOUD_STORAGE,
            status=ServiceStatus.ACTIVE,
        )
        original_created_at = service.created_at
        updated = update_service_status(service=service, status=ServiceStatus.SUSPENDED)
        self.assertEqual(updated.name, 'Immutable Name')
        self.assertEqual(updated.service_type, ServiceType.CLOUD_STORAGE)
        self.assertEqual(updated.customer, self.customer)
        self.assertEqual(updated.created_at, original_created_at)

    def test_selector_get_customer_services(self):
        """Selector retrieves only services of target customer in created_at desc order."""
        other_customer = Customer.objects.create(
            first_name='Other',
            last_name='Person',
            email='other.person@example.com',
            phone='456',
        )
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

    def test_selector_get_service_by_id_exists(self):
        """Selector returns Service by ID when it exists."""
        service = Service.objects.create(
            customer=self.customer,
            name='Found Service',
            service_type=ServiceType.VPS,
            status=ServiceStatus.ACTIVE,
        )
        found = get_service_by_id(service_id=service.id)
        self.assertEqual(found, service)

    def test_selector_get_service_by_id_not_found(self):
        """Selector returns None when service does not exist."""
        found = get_service_by_id(service_id=999999)
        self.assertIsNone(found)
