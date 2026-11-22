from django.db import IntegrityError
from django.test import TestCase

from apps.customers.models import Customer
from apps.customers.selectors import get_customer_by_id, get_customers_list
from apps.customers.services import create_customer, update_customer


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

    def test_update_customer_via_service(self):
        """Service layer updates Customer fields properly."""
        customer = Customer.objects.create(
            first_name='OldName',
            last_name='OldLast',
            email='old@example.com',
            phone='1234',
        )
        updated = update_customer(
            customer=customer,
            first_name='NewName',
            phone='5678',
            id=9999,  # disallowed field
        )
        self.assertEqual(updated.first_name, 'NewName')
        self.assertEqual(updated.phone, '5678')
        self.assertEqual(updated.email, 'old@example.com')
        self.assertNotEqual(updated.id, 9999)

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

    def test_selector_get_customer_by_id(self):
        """Selector returns Customer by ID when exists, None otherwise."""
        customer = Customer.objects.create(
            first_name='Test', last_name='User', email='test@example.com', phone='123'
        )
        found = get_customer_by_id(customer_id=customer.id)
        self.assertEqual(found, customer)

        not_found = get_customer_by_id(customer_id=999999)
        self.assertIsNone(not_found)
