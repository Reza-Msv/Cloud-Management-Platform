from django.db import models


class ServiceStatus(models.TextChoices):
    ACTIVE = 'active', 'Active'
    SUSPENDED = 'suspended', 'Suspended'


class ServiceType(models.TextChoices):
    VPS = 'vps', 'Virtual Private Server (VPS)'
    CLOUD_SERVER = 'cloud_server', 'Cloud Server'
    DEDICATED_SERVER = 'dedicated_server', 'Dedicated Server'
    CLOUD_STORAGE = 'cloud_storage', 'Cloud Storage'


class Service(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=150)
    service_type = models.CharField(
        max_length=50,
        choices=ServiceType.choices,
        default=ServiceType.VPS,
    )
    status = models.CharField(
        max_length=20,
        choices=ServiceStatus.choices,
        default=ServiceStatus.ACTIVE,
    )
    customer = models.ForeignKey(
        'customers.Customer',
        on_delete=models.PROTECT,
        related_name='services',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Service'
        verbose_name_plural = 'Services'
        ordering = ['-created_at']
        constraints = [
            models.CheckConstraint(
                condition=models.Q(status__in=[ServiceStatus.ACTIVE, ServiceStatus.SUSPENDED]),
                name='service_status_valid_choices',
            ),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_service_type_display()}) - {self.customer.email}"
