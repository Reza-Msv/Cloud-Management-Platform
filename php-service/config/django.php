<?php

return [
    'base_url' => env('DJANGO_API_BASE_URL', 'http://localhost:8000/api/v1'),
    'timeout' => (int) env('DJANGO_API_TIMEOUT', 10),
    'auth_username' => env('DJANGO_AUTH_USERNAME', ''),
    'auth_password' => env('DJANGO_AUTH_PASSWORD', ''),
];
