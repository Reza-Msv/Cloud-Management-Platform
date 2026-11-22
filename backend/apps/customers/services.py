from typing import Any, Dict
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


def update_customer(*, customer: Customer, **fields: Any) -> Customer:
    """
    Updates specified fields on an existing Customer instance and saves it atomically.
    Propagates IntegrityError if updated email conflicts with another customer.
    """
    disallowed_fields = {'id', 'created_at'}
    update_fields = []

    for field, value in fields.items():
        if field in disallowed_fields:
            continue
        if hasattr(customer, field):
            if isinstance(value, str):
                if field == 'email':
                    value = value.lower().strip()
                else:
                    value = value.strip()
            setattr(customer, field, value)
            update_fields.append(field)

    if update_fields:
        with transaction.atomic():
            customer.save(update_fields=update_fields)

    return customer
