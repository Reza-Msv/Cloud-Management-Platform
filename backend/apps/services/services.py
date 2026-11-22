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
