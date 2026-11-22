from django.db import IntegrityError, transaction
from apps.customers.models import Customer


def create_customer(*, first_name: str, last_name: str, email: str, phone: str) -> Customer:
    """
    Creates and returns a new Customer.
    Atomic transaction ensures DB consistency and propagates IntegrityError if email conflict occurs.
    """
    normalized_email = email.lower().strip()
    with transaction.atomic():
        customer = Customer.objects.create(
            first_name=first_name.strip(),
            last_name=last_name.strip(),
            email=normalized_email,
            phone=phone.strip(),
        )
    return customer
