from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase

from apps.customers.models import Customer


class CustomerModelTest(TestCase):
    def setUp(self):
        self.valid_data = {
            'first_name': 'Reza',
            'last_name': 'Mousavi',
            'email': 'reza.mousavi@example.com',
            'phone': '+989123456789',
        }

    def test_create_customer_success(self):
        """Verify successful creation of Customer instance."""
        customer = Customer.objects.create(**self.valid_data)
        self.assertIsNotNone(customer.id)
        self.assertEqual(customer.first_name, 'Reza')
        self.assertEqual(customer.last_name, 'Mousavi')
        self.assertEqual(customer.email, 'reza.mousavi@example.com')
        self.assertEqual(customer.phone, '+989123456789')
        self.assertIsNotNone(customer.created_at)

    def test_email_uniqueness(self):
        """Verify duplicate email raises IntegrityError."""
        Customer.objects.create(**self.valid_data)
        with self.assertRaises(IntegrityError):
            Customer.objects.create(
                first_name='Ali',
                last_name='Ahmadi',
                email='reza.mousavi@example.com',  # Duplicate email
                phone='+989987654321',
            )

    def test_field_validations(self):
        """Verify full_clean detects invalid email format."""
        invalid_customer = Customer(
            first_name='Test',
            last_name='User',
            email='not-a-valid-email',
            phone='+123456789',
        )
        with self.assertRaises(ValidationError):
            invalid_customer.full_clean()

    def test_str_representation(self):
        """Verify __str__ format matches '<first_name> <last_name> (<email>)'."""
        customer = Customer.objects.create(**self.valid_data)
        expected_str = f"{customer.first_name} {customer.last_name} ({customer.email})"
        self.assertEqual(str(customer), expected_str)

    def test_ordering(self):
        """Verify default ordering is -created_at."""
        c1 = Customer.objects.create(
            first_name='First',
            last_name='Customer',
            email='first@example.com',
            phone='111',
        )
        c2 = Customer.objects.create(
            first_name='Second',
            last_name='Customer',
            email='second@example.com',
            phone='222',
        )
        customers = list(Customer.objects.all())
        self.assertEqual(customers[0].id, c2.id)
        self.assertEqual(customers[1].id, c1.id)
