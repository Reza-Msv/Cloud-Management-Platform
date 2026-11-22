from django.db import transaction
from apps.customers.models import Customer
from apps.services.models import Service, ServiceStatus, ServiceType


def create_service(
    *,
    customer: Customer,
    name: str,
    service_type: str,
) -> Service:
    """
    Creates and returns a new Service attached to the specified customer.
    The default status is always 'active'.
    """
    with transaction.atomic():
        service = Service.objects.create(
            customer=customer,
            name=name.strip(),
            service_type=service_type,
            status=ServiceStatus.ACTIVE,
        )
    return service


def update_service_status(
    *,
    service: Service,
    status: str,
) -> Service:
    """
    Updates operational status of an existing Service instance and persists it.
    Uses an atomic block with select_for_update to avoid race conditions.
    """
    with transaction.atomic():
        locked_service = Service.objects.select_for_update().get(id=service.id)
        locked_service.status = status
        locked_service.save(update_fields=['status'])
    return locked_service
