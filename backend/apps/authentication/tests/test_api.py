from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import Client, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.common.permissions import (
    ROLE_ADMIN,
    ROLE_OPERATOR,
    setup_roles_and_permissions,
)

User = get_user_model()


class AuthenticationAPITest(APITestCase):
    """
    Comprehensive tests for Phase 2.6.7 Authentication & Frontend Integration Readiness:
    - GET /api/v1/auth/csrf/ sets CSRF cookie and returns JSON
    - POST /api/v1/auth/login/ with valid credentials creates session & sets sessionid cookie
    - POST /api/v1/auth/login/ with invalid credentials returns 401
    - POST /api/v1/auth/login/ with disabled/inactive user returns 401
    - POST /api/v1/auth/login/ validation (empty fields) returns 400
    - POST /api/v1/auth/logout/ invalidates session (requires auth, 401 for anonymous)
    - GET /api/v1/auth/me/ returns profile with groups, roles, and fine-grained permissions
    - GET /api/v1/auth/me/ returns 401 for anonymous
    - Role detection in /me/ for Admin, Operator, and Superuser
    - Session persistence across subsequent requests
    - CSRF Protection enforcement on mutative requests
    - CORS configuration and headers verification
    - Sensitive data protection (no passwords in response)
    """

    def setUp(self):
        self.roles = setup_roles_and_permissions()

        # Users
        self.admin_user = User.objects.create_user(
            username='admin_john',
            email='admin.john@cmp.com',
            password='SecretPassword123!',
            first_name='John',
            last_name='Admin',
        )
        self.admin_user.groups.add(self.roles[ROLE_ADMIN])

        self.operator_user = User.objects.create_user(
            username='op_jane',
            email='op.jane@cmp.com',
            password='SecretPassword123!',
            first_name='Jane',
            last_name='Operator',
        )
        self.operator_user.groups.add(self.roles[ROLE_OPERATOR])

        self.inactive_user = User.objects.create_user(
            username='disabled_user',
            email='disabled@cmp.com',
            password='SecretPassword123!',
            is_active=False,
        )

        self.superuser = User.objects.create_superuser(
            username='super_root',
            email='root@cmp.com',
            password='SecretPassword123!',
        )

        # URLs
        self.csrf_url = reverse('authentication:csrf')
        self.login_url = reverse('authentication:login')
        self.logout_url = reverse('authentication:logout')
        self.me_url = reverse('authentication:me')

    # =========================================================================
    # 1. CSRF Endpoint Tests
    # =========================================================================
    def test_get_csrf_cookie_and_token(self):
        """GET /api/v1/auth/csrf/ sets csrftoken cookie and returns csrfToken in JSON."""
        response = self.client.get(self.csrf_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('csrfToken', response.data)
        self.assertIn('detail', response.data)
        self.assertIn(settings.CSRF_COOKIE_NAME, response.cookies)
        self.assertTrue(len(response.data['csrfToken']) >= 32)
        self.assertTrue(len(response.cookies[settings.CSRF_COOKIE_NAME].value) >= 32)

    # =========================================================================
    # 2. Login Tests
    # =========================================================================
    def test_login_success(self):
        """POST /api/v1/auth/login/ with valid credentials authenticates user and sets session cookie."""
        payload = {
            'username': 'admin_john',
            'password': 'SecretPassword123!',
        }
        response = self.client.post(self.login_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(settings.SESSION_COOKIE_NAME, response.cookies)

        data = response.data
        self.assertEqual(data['username'], 'admin_john')
        self.assertEqual(data['email'], 'admin.john@cmp.com')
        self.assertIn('Admin', data['roles'])
        self.assertNotIn('password', data)

    def test_login_invalid_credentials(self):
        """POST /api/v1/auth/login/ with wrong password returns 401 Unauthorized."""
        payload = {
            'username': 'admin_john',
            'password': 'WrongPassword!',
        }
        response = self.client.post(self.login_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('detail', response.data)
        self.assertNotIn(settings.SESSION_COOKIE_NAME, response.cookies)

    def test_login_inactive_user(self):
        """POST /api/v1/auth/login/ with disabled account returns 401 Unauthorized."""
        payload = {
            'username': 'disabled_user',
            'password': 'SecretPassword123!',
        }
        response = self.client.post(self.login_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('detail', response.data)
        self.assertNotIn(settings.SESSION_COOKIE_NAME, response.cookies)

    def test_login_empty_payload(self):
        """POST /api/v1/auth/login/ with missing or empty fields returns 400 Bad Request."""
        response = self.client.post(self.login_url, {'username': '', 'password': ''}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data)
        self.assertIn('password', response.data)

    # =========================================================================
    # 3. Logout Tests
    # =========================================================================
    def test_logout_authenticated_user(self):
        """POST /api/v1/auth/logout/ clears the session for an authenticated user."""
        self.client.login(username='admin_john', password='SecretPassword123!')
        response = self.client.post(self.logout_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['detail'], 'Successfully logged out.')

        # Subsequent call to /me/ should fail with 401
        res_me = self.client.get(self.me_url)
        self.assertEqual(res_me.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_unauthenticated_user_rejected(self):
        """POST /api/v1/auth/logout/ returns 401 for anonymous user."""
        response = self.client.post(self.logout_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # =========================================================================
    # 4. User Profile (/api/v1/auth/me/) & Role Tests
    # =========================================================================
    def test_me_endpoint_anonymous_rejected(self):
        """GET /api/v1/auth/me/ returns 401 for unauthenticated user."""
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_endpoint_admin_profile(self):
        """GET /api/v1/auth/me/ returns comprehensive profile, Admin role, and permissions."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        self.assertEqual(data['id'], self.admin_user.id)
        self.assertEqual(data['username'], 'admin_john')
        self.assertEqual(data['email'], 'admin.john@cmp.com')
        self.assertEqual(data['first_name'], 'John')
        self.assertEqual(data['last_name'], 'Admin')
        self.assertFalse(data['is_superuser'])
        self.assertIn('Admin', data['groups'])
        self.assertIn('Admin', data['roles'])
        self.assertIn('customers.add_customer', data['permissions'])
        self.assertIn('customers.change_customer', data['permissions'])
        self.assertIn('services.add_service', data['permissions'])
        self.assertNotIn('password', data)

    def test_me_endpoint_operator_profile(self):
        """GET /api/v1/auth/me/ returns Operator role and Operator-specific permissions."""
        self.client.force_authenticate(user=self.operator_user)
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        self.assertEqual(data['username'], 'op_jane')
        self.assertIn('Operator', data['groups'])
        self.assertIn('Operator', data['roles'])
        self.assertNotIn('Admin', data['roles'])
        self.assertIn('customers.view_customer', data['permissions'])
        self.assertNotIn('customers.add_customer', data['permissions'])
        self.assertIn('services.add_service', data['permissions'])

    def test_me_endpoint_superuser_profile(self):
        """GET /api/v1/auth/me/ returns Superuser role and full permission access."""
        self.client.force_authenticate(user=self.superuser)
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        self.assertTrue(data['is_superuser'])
        self.assertIn('Superuser', data['roles'])

    # =========================================================================
    # 5. Session Persistence Test
    # =========================================================================
    def test_session_persistence_via_cookies(self):
        """Client logging in can access protected endpoints using the session cookie."""
        client = Client()
        # Login
        login_res = client.post(
            self.login_url,
            {'username': 'admin_john', 'password': 'SecretPassword123!'},
            content_type='application/json',
        )
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.assertIn(settings.SESSION_COOKIE_NAME, client.cookies)

        # Access /me/ without explicitly re-authenticating
        me_res = client.get(self.me_url)
        self.assertEqual(me_res.status_code, status.HTTP_200_OK)
        self.assertEqual(me_res.json()['username'], 'admin_john')

        # Access /api/v1/customers/ using session cookie
        cust_res = client.get(reverse('customers:customer-list-create'))
        self.assertEqual(cust_res.status_code, status.HTTP_200_OK)

    # =========================================================================
    # 6. CSRF Protection Enforcement Tests
    # =========================================================================
    def test_csrf_protection_enforced_for_session_authenticated_clients(self):
        """Mutative requests with session authentication without valid CSRF header are rejected."""
        csrf_client = Client(enforce_csrf_checks=True)

        # 1. Fetch CSRF Token
        csrf_res = csrf_client.get(self.csrf_url)
        self.assertEqual(csrf_res.status_code, status.HTTP_200_OK)
        csrf_token = csrf_res.json()['csrfToken']

        # 2. Login to establish authenticated session
        login_res = csrf_client.post(
            self.login_url,
            {'username': 'admin_john', 'password': 'SecretPassword123!'},
            content_type='application/json',
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.assertIn(settings.SESSION_COOKIE_NAME, csrf_client.cookies)

        # 3. Mutative customer creation without CSRF token fails with 403 Forbidden
        bad_post = csrf_client.post(
            reverse('customers:customer-list-create'),
            {'first_name': 'A', 'last_name': 'B', 'email': 'a@b.com', 'phone': '+989121111111'},
            content_type='application/json',
        )
        self.assertEqual(bad_post.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('CSRF', str(bad_post.content))

        # 4. Mutative customer creation WITH valid post-login CSRF token header succeeds (201 Created)
        post_login_csrf = csrf_client.cookies[settings.CSRF_COOKIE_NAME].value
        good_post = csrf_client.post(
            reverse('customers:customer-list-create'),
            {'first_name': 'A', 'last_name': 'B', 'email': 'a@b.com', 'phone': '+989121111111'},
            content_type='application/json',
            HTTP_X_CSRFTOKEN=post_login_csrf,
        )
        self.assertEqual(good_post.status_code, status.HTTP_201_CREATED)

    # =========================================================================
    # 7. CORS Configuration Tests
    # =========================================================================
    def test_cors_headers_allowed_origin(self):
        """Requests from allowed origin receive appropriate Access-Control-Allow-* headers."""
        response = self.client.get(self.csrf_url, HTTP_ORIGIN='http://localhost:3000')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.headers.get('Access-Control-Allow-Origin'), 'http://localhost:3000')
        self.assertEqual(response.headers.get('Access-Control-Allow-Credentials'), 'true')

    def test_cors_headers_disallowed_origin(self):
        """Requests from unapproved origins do not receive Access-Control-Allow-Origin header."""
        response = self.client.get(self.csrf_url, HTTP_ORIGIN='http://malicious-site.com')
        self.assertIsNone(response.headers.get('Access-Control-Allow-Origin'))
