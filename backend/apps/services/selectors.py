from typing import Optional
from django.db.models import QuerySet
from apps.customers.models import Customer
from apps.services.models import Service


def get_customer_services(
    *,
    customer: Customer,
    status: Optional[str] = None,
    service_type: Optional[str] = None,
) -> QuerySet[Service]:
    """
    Returns all services belonging strictly to the specified customer,
    ordered by created_at descending, with optional status and service_type filtering.
    """
    qs = Service.objects.filter(customer=customer)
    if status:
        qs = qs.filter(status=status.strip().lower())
    if service_type:
        qs = qs.filter(service_type=service_type.strip().lower())
    return qs.order_by('-created_at')


def get_services_list(
    *,
    customer_id: Optional[int] = None,
    status: Optional[str] = None,
    service_type: Optional[str] = None,
) -> QuerySet[Service]:
    """
    Returns services with optional customer_id, status, and service_type filters.
    Includes select_related('customer') to eliminate N+1 queries.
    """
    qs = Service.objects.select_related('customer').all()
    if customer_id is not None:
        qs = qs.filter(customer_id=customer_id)
    if status:
        qs = qs.filter(status=status.strip().lower())
    if service_type:
        qs = qs.filter(service_type=service_type.strip().lower())
    return qs.order_by('-created_at')


def get_service_by_id(*, service_id: int) -> Optional[Service]:
    """
    Returns a service by primary key ID or None if not found.
    """
    try:
        return Service.objects.select_related('customer').get(id=service_id)
    except Service.DoesNotExist:
        return None
