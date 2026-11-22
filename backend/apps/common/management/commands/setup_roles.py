from django.core.management.base import BaseCommand
from apps.common.permissions import setup_roles_and_permissions


class Command(BaseCommand):
    help = 'Initialize default Admin and Operator groups and standard permissions for Cloud Management Platform'

    def handle(self, *args, **options):
        groups = setup_roles_and_permissions()
        for role_name, group in groups.items():
            perm_count = group.permissions.count()
            self.stdout.write(
                self.style.SUCCESS(f"Successfully configured group '{role_name}' with {perm_count} permissions.")
            )
