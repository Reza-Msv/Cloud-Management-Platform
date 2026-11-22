from drf_spectacular.utils import (
    OpenApiExample,
    OpenApiParameter,
    OpenApiResponse,
    extend_schema,
)
from rest_framework import status
from rest_framework.authentication import BasicAuthentication, SessionAuthentication
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.pagination import StandardResultsSetPagination
from apps.common.permissions import CustomerPermission
from apps.customers.selectors import get_customer_by_id, get_customers_list
from apps.customers.serializers import CustomerSerializer


class CustomerListCreateAPIView(APIView):
    """
    GET  /api/v1/customers/ -> List all customers with pagination, search, and filtering.
    POST /api/v1/customers/ -> Create a new customer.
    Protected with BasicAuthentication & SessionAuthentication (IsAuthenticated + CustomerPermission).
    """
    authentication_classes = [BasicAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated, CustomerPermission]
    pagination_class = StandardResultsSetPagination

    @extend_schema(
        summary="List customers",
        description="Retrieve a paginated list of customers. Supports keyword search across all fields as well as specific field filters.",
        parameters=[
            OpenApiParameter(name='page', type=int, location=OpenApiParameter.QUERY, description='Page number within paginated results (default: 1).'),
            OpenApiParameter(name='page_size', type=int, location=OpenApiParameter.QUERY, description='Number of results per page (default: 10, max: 100).'),
            OpenApiParameter(name='search', type=str, location=OpenApiParameter.QUERY, description='Search across first_name, last_name, email, and phone.'),
            OpenApiParameter(name='first_name', type=str, location=OpenApiParameter.QUERY, description='Filter by first name (case-insensitive substring).'),
            OpenApiParameter(name='last_name', type=str, location=OpenApiParameter.QUERY, description='Filter by last name (case-insensitive substring).'),
            OpenApiParameter(name='email', type=str, location=OpenApiParameter.QUERY, description='Filter by email address (case-insensitive substring).'),
            OpenApiParameter(name='phone', type=str, location=OpenApiParameter.QUERY, description='Filter by phone number (substring).'),
        ],
        responses={
            status.HTTP_200_OK: CustomerSerializer(many=True),
            status.HTTP_401_UNAUTHORIZED: OpenApiResponse(description="Authentication credentials were not provided."),
            status.HTTP_403_FORBIDDEN: OpenApiResponse(description="Permission denied."),
        },
        tags=["Customers"],
    )
    def get(self, request):
        search = request.query_params.get('search')
        first_name = request.query_params.get('first_name')
        last_name = request.query_params.get('last_name')
        email = request.query_params.get('email')
        phone = request.query_params.get('phone')

        customers = get_customers_list(
            search=search,
            first_name=first_name,
            last_name=last_name,
            email=email,
            phone=phone,
        )

        paginator = self.pagination_class()
        paginated_customers = paginator.paginate_queryset(customers, request, view=self)
        if paginated_customers is not None:
            serializer = CustomerSerializer(paginated_customers, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = CustomerSerializer(customers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Create customer",
        description="Create a new customer profile. Email must be unique.",
        request=CustomerSerializer,
        responses={
            status.HTTP_201_CREATED: CustomerSerializer,
            status.HTTP_400_BAD_REQUEST: OpenApiResponse(description="Validation error (e.g. invalid email format, missing fields, or duplicate email)."),
            status.HTTP_401_UNAUTHORIZED: OpenApiResponse(description="Authentication credentials were not provided."),
            status.HTTP_403_FORBIDDEN: OpenApiResponse(description="Permission denied."),
        },
        examples=[
            OpenApiExample(
                "Valid Customer Request",
                value={
                    "first_name": "Reza",
                    "last_name": "Mousavi",
                    "email": "reza.mousavi@example.com",
                    "phone": "+989123456789",
                },
                request_only=True,
            ),
            OpenApiExample(
                "Successful Customer Response",
                value={
                    "id": 1,
                    "first_name": "Reza",
                    "last_name": "Mousavi",
                    "full_name": "Reza Mousavi",
                    "email": "reza.mousavi@example.com",
                    "phone": "+989123456789",
                    "created_at": "2026-11-22T05:25:35.123456Z",
                },
                response_only=True,
                status_codes=[str(status.HTTP_201_CREATED)],
            ),
        ],
        tags=["Customers"],
    )
    def post(self, request):
        serializer = CustomerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        customer = serializer.save()
        return Response(CustomerSerializer(customer).data, status=status.HTTP_201_CREATED)


class CustomerDetailAPIView(APIView):
    """
    GET   /api/v1/customers/{id}/ -> Retrieve a customer by ID.
    PATCH /api/v1/customers/{id}/ -> Partially update customer details.
    Protected with SessionAuthentication & BasicAuthentication (IsAuthenticated + CustomerPermission).
    """
    authentication_classes = [BasicAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated, CustomerPermission]

    def _get_customer(self, customer_id: int):
        customer = get_customer_by_id(customer_id=customer_id)
        if customer is None:
            raise NotFound({'detail': 'Customer not found.'})
        return customer

    @extend_schema(
        summary="Retrieve customer details",
        description="Retrieve comprehensive details of a specific customer by ID.",
        responses={
            status.HTTP_200_OK: CustomerSerializer,
            status.HTTP_401_UNAUTHORIZED: OpenApiResponse(description="Authentication credentials were not provided."),
            status.HTTP_403_FORBIDDEN: OpenApiResponse(description="Permission denied."),
            status.HTTP_404_NOT_FOUND: OpenApiResponse(description="Customer not found."),
        },
        tags=["Customers"],
    )
    def get(self, request, customer_id: int):
        customer = self._get_customer(customer_id)
        serializer = CustomerSerializer(customer)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Partially update customer",
        description="Update one or more attributes of an existing customer. Read-only fields (id, created_at, full_name) are ignored.",
        request=CustomerSerializer,
        responses={
            status.HTTP_200_OK: CustomerSerializer,
            status.HTTP_400_BAD_REQUEST: OpenApiResponse(description="Validation error (e.g. invalid email format or email taken by another customer)."),
            status.HTTP_401_UNAUTHORIZED: OpenApiResponse(description="Authentication credentials were not provided."),
            status.HTTP_403_FORBIDDEN: OpenApiResponse(description="Permission denied."),
            status.HTTP_404_NOT_FOUND: OpenApiResponse(description="Customer not found."),
        },
        examples=[
            OpenApiExample(
                "Partial Update Request",
                value={
                    "phone": "+989120000000",
                },
                request_only=True,
            ),
            OpenApiExample(
                "Updated Customer Response",
                value={
                    "id": 1,
                    "first_name": "Reza",
                    "last_name": "Mousavi",
                    "full_name": "Reza Mousavi",
                    "email": "reza.mousavi@example.com",
                    "phone": "+989120000000",
                    "created_at": "2026-11-22T05:25:35.123456Z",
                },
                response_only=True,
                status_codes=[str(status.HTTP_200_OK)],
            ),
        ],
        tags=["Customers"],
    )
    def patch(self, request, customer_id: int):
        customer = self._get_customer(customer_id)
        serializer = CustomerSerializer(customer, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_customer = serializer.save()
        return Response(CustomerSerializer(updated_customer).data, status=status.HTTP_200_OK)
