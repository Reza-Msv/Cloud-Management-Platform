from django.test import TestCase

from apps.customers.models import Customer
from apps.services.models import ServiceStatus, ServiceType
from apps.services.serializers import ServiceSerializer


class ServiceSerializerTest(TestCase):
    def setUp(self):
        self.customer = Customer.objects.create(
            first_name='Ali',
            last_name='Rezai',
            email='ali.rezai@example.com',
            phone='+989121111111',
        )
        self.valid_payload = {
            'name': 'Primary Web App Server',
            'service_type': ServiceType.VPS,
        }

    def test_valid_serializer_data(self):
        """Serializer validates properly with valid input."""
        serializer = ServiceSerializer(data=self.valid_payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data['name'], 'Primary Web App Server')
        self.assertEqual(serializer.validated_data['service_type'], ServiceType.VPS)

    def test_reject_invalid_service_type(self):
        """Serializer rejects unknown/invalid service_type."""
        payload = self.valid_payload.copy()
        payload['service_type'] = 'quantum_computer'
        serializer = ServiceSerializer(data=payload)
        self.assertFalse(serializer.is_valid())
        self.assertIn('service_type', serializer.errors)

    def test_reject_blank_or_whitespace_name(self):
        """Serializer rejects empty or whitespace-only name."""
        for invalid_name in ['', '   ', '\t\n']:
            payload = self.valid_payload.copy()
            payload['name'] = invalid_name
            serializer = ServiceSerializer(data=payload)
            self.assertFalse(serializer.is_valid(), f"Failed for '{invalid_name}'")
            self.assertIn('name', serializer.errors)

    def test_read_only_fields_cannot_be_injected(self):
        """Verify client cannot inject id, status, customer, or created_at."""
        other_customer = Customer.objects.create(
            first_name='Other', last_name='User', email='other@example.com', phone='123'
        )
        payload = self.valid_payload.copy()
        payload['id'] = 9999
        payload['status'] = ServiceStatus.SUSPENDED
        payload['customer'] = other_customer.id
        payload['created_at'] = '2020-01-01T00:00:00Z'

        serializer = ServiceSerializer(data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)

        # None of the read-only fields should appear in validated_data
        self.assertNotIn('id', serializer.validated_data)
        self.assertNotIn('status', serializer.validated_data)
        self.assertNotIn('customer', serializer.validated_data)
        self.assertNotIn('created_at', serializer.validated_data)
