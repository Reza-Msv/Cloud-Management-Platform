from django.db.models import QuerySet
from apps.customers.models import Customer


def get_customers_list() -> QuerySet[Customer]:
    """
    Returns all customers ordered by creation time descending.
    """
    return Customer.objects.all().order_by('-created_at')
