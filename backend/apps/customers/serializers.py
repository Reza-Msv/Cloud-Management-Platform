from django.db import IntegrityError
from rest_framework import serializers

from apps.common.validators import validate_phone_number
from apps.customers.models import Customer
from apps.customers.services import create_customer, update_customer


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

    def validate_first_name(self, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise serializers.ValidationError('First name cannot be blank.')
        return trimmed

    def validate_last_name(self, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise serializers.ValidationError('Last name cannot be blank.')
        return trimmed

    def validate_phone(self, value: str) -> str:
        return validate_phone_number(value)

    def get_full_name(self, obj) -> str:
        return f"{obj.first_name} {obj.last_name}".strip()

    def validate_email(self, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise serializers.ValidationError('Email address cannot be blank.')
        normalized_email = trimmed.lower()
        qs = Customer.objects.filter(email__iexact=normalized_email)
        # In update operations, exclude current instance from duplicate check
        if self.instance is not None:
            qs = qs.exclude(id=self.instance.id)

        if qs.exists():
            raise serializers.ValidationError('Customer with this email already exists.')
        return normalized_email

    def create(self, validated_data):
        try:
            return create_customer(**validated_data)
        except IntegrityError:
            raise serializers.ValidationError({'email': ['Customer with this email already exists.']})

    def update(self, instance, validated_data):
        try:
            return update_customer(customer=instance, **validated_data)
        except IntegrityError:
            raise serializers.ValidationError({'email': ['Customer with this email already exists.']})
