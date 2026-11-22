from rest_framework import serializers

from apps.services.models import Service, ServiceStatus, ServiceType


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = [
            'id',
            'name',
            'service_type',
            'status',
            'customer',
            'created_at',
        ]
        read_only_fields = ['id', 'status', 'customer', 'created_at']

    def validate_name(self, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise serializers.ValidationError('Service name cannot be blank.')
        return trimmed

    def validate_service_type(self, value: str) -> str:
        if value not in ServiceType.values:
            raise serializers.ValidationError(
                f"Invalid service_type. Must be one of: {list(ServiceType.values)}"
            )
        return value


class ServiceStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=ServiceStatus.choices,
        required=True,
        error_messages={
            'required': 'Status field is required.',
            'invalid_choice': f"Invalid status. Must be one of: {list(ServiceStatus.values)}",
        },
    )

    def validate(self, attrs):
        if not attrs or 'status' not in attrs:
            raise serializers.ValidationError({'status': 'Status field is required and cannot be empty.'})
        return attrs
