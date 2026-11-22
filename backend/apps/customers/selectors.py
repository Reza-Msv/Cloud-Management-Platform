from typing import Optional
from django.db.models import Q, QuerySet
from apps.customers.models import Customer


def get_customers_list(
    *,
    search: Optional[str] = None,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    email: Optional[str] = None,
    phone: Optional[str] = None,
) -> QuerySet[Customer]:
    """
    Returns customers ordered by creation time descending, with support for
    multi-field search and specific field filtering.
    """
    qs = Customer.objects.all()

    if search:
        search_term = search.strip()
        qs = qs.filter(
            Q(first_name__icontains=search_term)
            | Q(last_name__icontains=search_term)
            | Q(email__icontains=search_term)
            | Q(phone__icontains=search_term)
        )

    if first_name:
        qs = qs.filter(first_name__icontains=first_name.strip())

    if last_name:
        qs = qs.filter(last_name__icontains=last_name.strip())

    if email:
        qs = qs.filter(email__icontains=email.strip())

    if phone:
        qs = qs.filter(phone__icontains=phone.strip())

    return qs.order_by('-created_at')


def get_customer_by_id(*, customer_id: int) -> Optional[Customer]:
    """
    Returns a customer by primary key ID or None if not found.
    """
    try:
        return Customer.objects.get(id=customer_id)
    except Customer.DoesNotExist:
        return None
