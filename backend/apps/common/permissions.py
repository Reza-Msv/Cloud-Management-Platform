from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from rest_framework.permissions import BasePermission, SAFE_METHODS

from apps.customers.models import Customer
from apps.services.models import Service

# Role names
ROLE_ADMIN = 'Admin'
ROLE_OPERATOR = 'Operator'

# Group permissions mapping
ROLE_PERMISSIONS = {
    ROLE_ADMIN: [
        ('customers', 'customer', 'view_customer'),
        ('customers', 'customer', 'add_customer'),
        ('customers', 'customer', 'change_customer'),
        ('services', 'service', 'view_service'),
        ('services', 'service', 'add_service'),
        ('services', 'service', 'change_service'),
    ],
    ROLE_OPERATOR: [
        ('customers', 'customer', 'view_customer'),
        ('services', 'service', 'view_service'),
        ('services', 'service', 'add_service'),
        ('services', 'service', 'change_service'),
    ],
}


def setup_roles_and_permissions():
    """
    Idempotent helper to initialize or verify Admin and Operator groups
    with their respective Django model permissions.
    """
    groups = {}
    for role_name, perm_tuples in ROLE_PERMISSIONS.items():
        group, _ = Group.objects.get_or_create(name=role_name)
        permissions_to_add = []
        for app_label, model_name, codename in perm_tuples:
            perm = Permission.objects.filter(
                content_type__app_label=app_label,
                content_type__model=model_name,
                codename=codename,
            ).first()
            if perm:
                permissions_to_add.append(perm)
        group.permissions.set(permissions_to_add)
        groups[role_name] = group
    return groups


def user_in_group(user, group_name: str) -> bool:
    """Helper to check if user belongs to a specific group."""
    if not user or not user.is_authenticated:
        return False
    return user.groups.filter(name=group_name).exists()


class CustomerPermission(BasePermission):
    """
    Role-Based Access Control for Customer resources:
    - Superusers: Full access.
    - Read operations (GET, HEAD, OPTIONS): Admin or Operator (or permission 'customers.view_customer').
    - Write operations (POST, PATCH, PUT): Admin only (or permission 'customers.add_customer' / 'change_customer').
    - Unauthenticated users: Denied (handled by IsAuthenticated / returns 401).
    - Other authenticated users without role: Denied (returns 403).
    """

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if user.is_superuser:
            return True

        is_admin = user_in_group(user, ROLE_ADMIN)
        is_operator = user_in_group(user, ROLE_OPERATOR)

        # GET, HEAD, OPTIONS
        if request.method in SAFE_METHODS:
            return is_admin or is_operator or user.has_perm('customers.view_customer')

        # POST (Creation)
        if request.method == 'POST':
            return is_admin or user.has_perm('customers.add_customer')

        # PATCH, PUT (Update)
        if request.method in ('PATCH', 'PUT'):
            return is_admin or user.has_perm('customers.change_customer')

        return False


class ServicePermission(BasePermission):
    """
    Role-Based Access Control for Service resources:
    - Superusers: Full access.
    - Read operations (GET, HEAD, OPTIONS): Admin or Operator (or permission 'services.view_service').
    - Create operations (POST): Admin or Operator (or permission 'services.add_service').
    - Status Update operations (PATCH, PUT): Admin or Operator (or permission 'services.change_service').
    - Unauthenticated users: Denied (returns 401).
    - Other authenticated users without role: Denied (returns 403).
    """

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if user.is_superuser:
            return True

        is_admin = user_in_group(user, ROLE_ADMIN)
        is_operator = user_in_group(user, ROLE_OPERATOR)

        # Safe read operations
        if request.method in SAFE_METHODS:
            return is_admin or is_operator or user.has_perm('services.view_service')

        # Create operations
        if request.method == 'POST':
            return is_admin or is_operator or user.has_perm('services.add_service')

        # Update operations (e.g. status patch)
        if request.method in ('PATCH', 'PUT'):
            return is_admin or is_operator or user.has_perm('services.change_service')

        return False
