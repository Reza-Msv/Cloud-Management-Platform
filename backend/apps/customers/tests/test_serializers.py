from django.test import TestCase
from rest_framework.exceptions import ValidationError

from apps.customers.models import Customer
from apps.customers.serializers import CustomerSerializer


class CustomerSerializerTest(TestCase):
    def setUp(self):
        self.valid_payload = {
            'first_name': 'Reza',
            'last_name': 'Mousavi',
            'email': 'reza.mousavi@example.com',
            'phone': '+989123456789',
        }

    def test_valid_serializer_data(self):
        """Serializer validates properly with clean valid input."""
        serializer = CustomerSerializer(data=self.valid_payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        customer = serializer.save()
        self.assertEqual(customer.first_name, 'Reza')
        self.assertEqual(customer.email, 'reza.mousavi@example.com')
        self.assertEqual(serializer.data['full_name'], 'Reza Mousavi')

    def test_invalid_email_format(self):
        """Serializer rejects invalid email format."""
        payload = self.valid_payload.copy()
        payload['email'] = 'not-an-email'
        serializer = CustomerSerializer(data=payload)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_duplicate_email_validation(self):
        """Serializer rejects email that already exists."""
        Customer.objects.create(**self.valid_payload)
        duplicate_payload = {
            'first_name': 'Ali',
            'last_name': 'Karimi',
            'email': 'reza.mousavi@example.com',  # Duplicate
            'phone': '+989999999999',
        }
        serializer = CustomerSerializer(data=duplicate_payload)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_read_only_fields_cannot_be_overridden(self):
        """Verify id, created_at, and full_name cannot be forced during create."""
        payload = self.valid_payload.copy()
        payload['id'] = 999
        payload['full_name'] = 'Hacked Name'
        payload['created_at'] = '2020-01-01T00:00:00Z'
        serializer = CustomerSerializer(data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        customer = serializer.save()
        self.assertNotEqual(customer.id, 999)
        self.assertEqual(serializer.data['full_name'], 'Reza Mousavi')

    def test_update_allows_own_email(self):
        """Serializer permits keeping the customer's own email during update."""
        customer = Customer.objects.create(**self.valid_payload)
        update_data = {'first_name': 'UpdatedName', 'email': customer.email}
        serializer = CustomerSerializer(instance=customer, data=update_data, partial=True)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        updated = serializer.save()
        self.assertEqual(updated.first_name, 'UpdatedName')
        self.assertEqual(updated.email, customer.email)

    def test_update_rejects_other_customer_email(self):
        """Serializer rejects changing email to another existing customer's email."""
        c1 = Customer.objects.create(**self.valid_payload)
        c2 = Customer.objects.create(
            first_name='Other', last_name='User', email='other@example.com', phone='+123'
        )
        serializer = CustomerSerializer(instance=c1, data={'email': c2.email}, partial=True)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)
