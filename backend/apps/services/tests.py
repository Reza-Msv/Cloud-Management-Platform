from django.core.exceptions import ValidationError
from django.db import IntegrityError, models
from django.test import TestCase

from apps.customers.models import Customer
from apps.services.models import Service, ServiceStatus, ServiceType


class ServiceModelTest(TestCase):
    def setUp(self):
        self.customer = Customer.objects.create(
            first_name='John',
            last_name='Doe',
            email='john.doe@example.com',
            phone='+15551234567',
        )

    def test_create_service_success(self):
        """Verify successful creation of Service instance."""
        service = Service.objects.create(
            name='Primary Web Server',
            service_type=ServiceType.VPS,
            status=ServiceStatus.ACTIVE,
            customer=self.customer,
        )
        self.assertIsNotNone(service.id)
        self.assertEqual(service.name, 'Primary Web Server')
        self.assertEqual(service.service_type, ServiceType.VPS)
        self.assertEqual(service.status, ServiceStatus.ACTIVE)
        self.assertEqual(service.customer, self.customer)
        self.assertIsNotNone(service.created_at)

    def test_relationship_with_customer(self):
        """Verify 1:N relationship and related_name='services'."""
        service = Service.objects.create(
            name='Cloud DB',
            service_type=ServiceType.CLOUD_SERVER,
            status=ServiceStatus.ACTIVE,
            customer=self.customer,
        )
        self.assertEqual(service.customer, self.customer)
        self.assertIn(service, self.customer.services.all())
        self.assertEqual(self.customer.services.count(), 1)

    def test_multiple_services_for_customer(self):
        """Verify a single customer can own multiple services."""
        s1 = Service.objects.create(
            name='Production VM',
            service_type=ServiceType.VPS,
            status=ServiceStatus.ACTIVE,
            customer=self.customer,
        )
        s2 = Service.objects.create(
            name='Backup Storage',
            service_type=ServiceType.CLOUD_STORAGE,
            status=ServiceStatus.SUSPENDED,
            customer=self.customer,
        )
        services = self.customer.services.all()
        self.assertEqual(services.count(), 2)
        self.assertIn(s1, services)
        self.assertIn(s2, services)

    def test_supported_statuses(self):
        """Verify active and suspended statuses are accepted."""
        s_active = Service.objects.create(
            name='Active Service',
            service_type=ServiceType.VPS,
            status=ServiceStatus.ACTIVE,
            customer=self.customer,
        )
        s_suspended = Service.objects.create(
            name='Suspended Service',
            service_type=ServiceType.VPS,
            status=ServiceStatus.SUSPENDED,
            customer=self.customer,
        )
        self.assertEqual(s_active.status, 'active')
        self.assertEqual(s_suspended.status, 'suspended')

    def test_invalid_status_validation(self):
        """Verify full_clean rejects invalid status values."""
        invalid_service = Service(
            name='Invalid Status Service',
            service_type=ServiceType.VPS,
            status='invalid_status_value',
            customer=self.customer,
        )
        with self.assertRaises(ValidationError):
            invalid_service.full_clean()

    def test_database_check_constraint(self):
        """Verify database CheckConstraint raises IntegrityError on invalid status."""
        with self.assertRaises(IntegrityError):
            Service.objects.create(
                name='Violating Constraint Service',
                service_type=ServiceType.VPS,
                status='forbidden_status',
                customer=self.customer,
            )

    def test_protect_on_delete_customer(self):
        """Verify on_delete=models.PROTECT prevents deleting customer with active services."""
        Service.objects.create(
            name='Protected Service',
            service_type=ServiceType.VPS,
            status=ServiceStatus.ACTIVE,
            customer=self.customer,
        )
        with self.assertRaises(models.ProtectedError):
            self.customer.delete()

    def test_str_representation(self):
        """Verify __str__ format."""
        service = Service.objects.create(
            name='Edge Node',
            service_type=ServiceType.CLOUD_SERVER,
            status=ServiceStatus.ACTIVE,
            customer=self.customer,
        )
        expected_str = f"{service.name} ({service.get_service_type_display()}) - {self.customer.email}"
        self.assertEqual(str(service), expected_str)
