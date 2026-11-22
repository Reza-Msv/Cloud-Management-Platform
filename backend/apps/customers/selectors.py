from typing import Optional
from django.db.models import QuerySet
from apps.customers.models import Customer


def get_customers_list() -> QuerySet[Customer]:
    """
    Returns all customers ordered by creation time descending.
    """
    return Customer.objects.all().order_by('-created_at')


def get_customer_by_id(*, customer_id: int) -> Optional[Customer]:
    """
    Returns a customer by primary key ID or None if not found.
    """
    try:
        return Customer.objects.get(id=customer_id)
    except Customer.DoesNotExist:
        return None
