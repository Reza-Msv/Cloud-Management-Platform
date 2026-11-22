from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(
        required=True,
        error_messages={'required': 'Username is required.', 'blank': 'Username cannot be blank.'},
    )
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        error_messages={'required': 'Password is required.', 'blank': 'Password cannot be blank.'},
    )

    def validate_username(self, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise serializers.ValidationError('Username cannot be blank.')
        return trimmed


class UserMeSerializer(serializers.ModelSerializer):
    groups = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    roles = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'is_superuser',
            'is_staff',
            'is_active',
            'groups',
            'roles',
            'permissions',
        ]
        read_only_fields = fields

    def get_groups(self, obj) -> list[str]:
        return list(obj.groups.values_list('name', flat=True))

    def get_roles(self, obj) -> list[str]:
        roles = []
        if obj.is_superuser:
            roles.append('Superuser')
        group_names = set(obj.groups.values_list('name', flat=True))
        if 'Admin' in group_names and 'Admin' not in roles:
            roles.append('Admin')
        if 'Operator' in group_names and 'Operator' not in roles:
            roles.append('Operator')
        return roles

    def get_permissions(self, obj) -> list[str]:
        # Returns all effective permissions including group and superuser perms
        return sorted(list(obj.get_all_permissions()))


class CSRFResponseSerializer(serializers.Serializer):
    detail = serializers.CharField(default='CSRF cookie set.')
    csrfToken = serializers.CharField()


class MessageResponseSerializer(serializers.Serializer):
    detail = serializers.CharField()
