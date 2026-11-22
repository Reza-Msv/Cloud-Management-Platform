from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.authentication import BasicAuthentication, SessionAuthentication
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authentication.serializers import (
    CSRFResponseSerializer,
    LoginSerializer,
    MessageResponseSerializer,
    UserMeSerializer,
)


class CSRFView(APIView):
    """
    GET /api/v1/auth/csrf/
    Ensures CSRF cookie is set and returns the token in JSON.
    Frontend Next.js should call this endpoint prior to mutative POST/PATCH/DELETE requests.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    @method_decorator(ensure_csrf_cookie)
    @extend_schema(
        summary="Get CSRF Token",
        description="Sets the csrftoken cookie and returns the token value in the response body.",
        responses={
            status.HTTP_200_OK: CSRFResponseSerializer,
        },
        tags=["Authentication"],
    )
    def get(self, request):
        csrf_token = get_token(request)
        return Response(
            {
                'detail': 'CSRF cookie set.',
                'csrfToken': csrf_token,
            },
            status=status.HTTP_200_OK,
        )


class LoginView(APIView):
    """
    POST /api/v1/auth/login/
    Authenticates user with username & password, starts a secure Django session, and sets sessionid cookie.
    Enforces standard CSRF protection for session authentication.
    """
    authentication_classes = [BasicAuthentication, SessionAuthentication]
    permission_classes = [AllowAny]

    @extend_schema(
        summary="User Login",
        description="Authenticate user with credentials. On success, creates a session and returns user profile.",
        request=LoginSerializer,
        responses={
            status.HTTP_200_OK: UserMeSerializer,
            status.HTTP_400_BAD_REQUEST: OpenApiResponse(description="Validation error or missing fields."),
            status.HTTP_401_UNAUTHORIZED: OpenApiResponse(description="Invalid credentials or inactive user."),
        },
        tags=["Authentication"],
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        username = serializer.validated_data['username']
        password = serializer.validated_data['password']

        user = authenticate(request=request, username=username, password=password)

        if user is None:
            return Response(
                {'detail': 'Invalid username or password.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return Response(
                {'detail': 'User account is disabled.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Login and establish session
        login(request, user)

        return Response(UserMeSerializer(user).data, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    POST /api/v1/auth/logout/
    Terminates the active session and flushes cookies. Only accessible to authenticated users.
    """
    authentication_classes = [BasicAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="User Logout",
        description="Terminate the current user session and invalidate cookies.",
        request=None,
        responses={
            status.HTTP_200_OK: MessageResponseSerializer,
            status.HTTP_401_UNAUTHORIZED: OpenApiResponse(description="Authentication credentials were not provided."),
        },
        tags=["Authentication"],
    )
    def post(self, request):
        logout(request)
        return Response(
            {'detail': 'Successfully logged out.'},
            status=status.HTTP_200_OK,
        )


class UserMeView(APIView):
    """
    GET /api/v1/auth/me/
    Retrieves current authenticated user profile, assigned groups, derived roles, and effective permissions.
    """
    authentication_classes = [BasicAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Current User Profile",
        description="Retrieve the profile, assigned groups, roles, and effective permissions of the currently authenticated user.",
        responses={
            status.HTTP_200_OK: UserMeSerializer,
            status.HTTP_401_UNAUTHORIZED: OpenApiResponse(description="Authentication credentials were not provided."),
        },
        tags=["Authentication"],
    )
    def get(self, request):
        serializer = UserMeSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)
