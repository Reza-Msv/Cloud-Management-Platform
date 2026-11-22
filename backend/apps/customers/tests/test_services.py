from django.db import IntegrityError
from django.test import TestCase

from apps.customers.models import Customer
from apps.customers.selectors import get_customers_list
from apps.customers.services import create_customer


class CustomerServiceAndSelectorTest(TestCase):
    def test_create_customer_via_service(self):
        """Service layer creates Customer correctly."""
        customer = create_customer(
            first_name='Sara',
            last_name='Rad',
            email='sara.rad@example.com',
            phone='+989111111111',
        )
        self.assertIsNotNone(customer.id)
        self.assertEqual(customer.first_name, 'Sara')
        self.assertEqual(customer.email, 'sara.rad@example.com')

    def test_service_duplicate_email_raises_integrity_error(self):
        """Service layer propagates IntegrityError on duplicate email."""
        create_customer(
            first_name='Sara',
            last_name='Rad',
            email='sara.rad@example.com',
            phone='+989111111111',
        )
        with self.assertRaises(IntegrityError):
            create_customer(
                first_name='Another',
                last_name='Sara',
                email='sara.rad@example.com',
                phone='+989222222222',
            )

    def test_selector_get_customers_list_ordering(self):
        """Selector returns customers ordered by created_at desc."""
        c1 = Customer.objects.create(
            first_name='A', last_name='A', email='a@example.com', phone='1'
        )
        c2 = Customer.objects.create(
            first_name='B', last_name='B', email='b@example.com', phone='2'
        )
        qs = get_customers_list()
        self.assertEqual(list(qs), [c2, c1])
