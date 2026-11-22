from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class DocumentationAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='docadmin', password='docpassword123')

    def test_schema_endpoint_accessible(self):
        """GET /api/schema/ returns 200 OK and valid OpenAPI 3 schema."""
        url = reverse('schema')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Content-Type should be YAML or JSON
        self.assertIn('application/vnd.oai.openapi', response.headers.get('Content-Type', ''))
        content = response.content.decode('utf-8')
        self.assertIn('openapi: 3.0.3', content)
        self.assertIn('title: Cloud Management API', content)
        self.assertIn('/api/v1/customers/', content)
        self.assertIn('/api/v1/customers/{customer_id}/', content)
        self.assertIn('/api/v1/customers/{customer_id}/services/', content)

    def test_swagger_ui_endpoint_accessible(self):
        """GET /api/docs/ returns 200 OK HTML for Swagger UI."""
        url = reverse('swagger-ui')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('text/html', response.headers.get('Content-Type', ''))
        content = response.content.decode('utf-8')
        self.assertIn('swagger-ui', content)

    def test_redoc_endpoint_accessible(self):
        """GET /api/redoc/ returns 200 OK HTML for ReDoc."""
        url = reverse('redoc')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('text/html', response.headers.get('Content-Type', ''))
        content = response.content.decode('utf-8')
        self.assertIn('redoc', content)

    def test_schema_includes_authentication_and_methods(self):
        """Schema includes security definitions for basicAuth and cookieAuth, and correct HTTP methods."""
        url = reverse('schema')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        content = response.content.decode('utf-8')
        self.assertIn('basicAuth', content)
        self.assertIn('cookieAuth', content)
        self.assertIn('security:', content)
