"""
PostgreSQL Database Configuration for Django.

This configuration connects Django to the local PostgreSQL database using
parameters defined in `backend/.env`. In Phase 2, this configuration will be
integrated into `settings.py`.
"""

import os

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'cloud_management_db'),
        'USER': os.getenv('DB_USER', 'cloud_management_user'),
        'PASSWORD': os.getenv('DB_PASSWORD', 'cloud_management_user'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
        'CONN_MAX_AGE': int(os.getenv('DB_CONNECTION_MAX_AGE', 600)),
    }
}
