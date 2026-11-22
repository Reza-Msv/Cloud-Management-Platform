from django.db import IntegrityError
from rest_framework import serializers

from apps.customers.models import Customer
from apps.customers.services import create_customer


class CustomerSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Customer
        fields = [
            'id',
            'first_name',
            'last_name',
            'full_name',
            'email',
            'phone',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'full_name']

    def get_full_name(self, obj) -> str:
        return f"{obj.first_name} {obj.last_name}".strip()

    def validate_email(self, value):
        normalized_email = value.lower().strip()
        if Customer.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError('Customer with this email already exists.')
        return normalized_email

    def create(self, validated_data):
        try:
            return create_customer(**validated_data)
        except IntegrityError:
            raise serializers.ValidationError({'email': ['Customer with this email already exists.']})
