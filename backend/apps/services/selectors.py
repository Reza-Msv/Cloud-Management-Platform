from typing import Optional
from django.db.models import QuerySet
from apps.customers.models import Customer
from apps.services.models import Service


def get_customer_services(*, customer: Customer) -> QuerySet[Service]:
    """
    Returns all services belonging strictly to the specified customer,
    ordered by created_at descending.
    """
    return Service.objects.filter(customer=customer).order_by('-created_at')


def get_service_by_id(*, service_id: int) -> Optional[Service]:
    """
    Returns a service by primary key ID or None if not found.
    """
    try:
        return Service.objects.select_related('customer').get(id=service_id)
    except Service.DoesNotExist:
        return None
