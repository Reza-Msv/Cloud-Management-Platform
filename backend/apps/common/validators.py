import re
from rest_framework import serializers

# Reasonable international phone number regex:
# Must start with optional + and country code, digits, spaces, hyphens, parentheses.
# Must contain between 7 and 20 digits total.
PHONE_DIGITS_MIN = 7
PHONE_DIGITS_MAX = 20
PHONE_ALLOWED_CHARS_REGEX = re.compile(r'^\+?[0-9\s\-\(\)\.]+$')


def validate_phone_number(value: str) -> str:
    """
    Validates phone number format and digit count without arbitrarily restricting
    valid international phone formats.
    """
    if not isinstance(value, str):
        raise serializers.ValidationError('Phone number must be a valid string.')

    trimmed = value.strip()
    if not trimmed:
        raise serializers.ValidationError('Phone number cannot be blank.')

    if not PHONE_ALLOWED_CHARS_REGEX.match(trimmed):
        raise serializers.ValidationError(
            'Phone number contains invalid characters. Only digits, +, -, spaces, periods, and parentheses are allowed.'
        )

    digits = re.sub(r'\D', '', trimmed)
    if len(digits) < PHONE_DIGITS_MIN:
        raise serializers.ValidationError(
            f'Phone number must contain at least {PHONE_DIGITS_MIN} digits.'
        )
    if len(digits) > PHONE_DIGITS_MAX:
        raise serializers.ValidationError(
            f'Phone number must not exceed {PHONE_DIGITS_MAX} digits.'
        )

    return trimmed
