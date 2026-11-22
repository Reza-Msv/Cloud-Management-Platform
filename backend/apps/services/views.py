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
from apps.common.permissions import ServicePermission
from apps.customers.selectors import get_customer_by_id
from apps.services.selectors import (
    get_customer_services,
    get_service_by_id,
    get_services_list,
)
from apps.services.serializers import ServiceSerializer, ServiceStatusUpdateSerializer
from apps.services.services import create_service, update_service_status


class CustomerServiceListCreateAPIView(APIView):
    """
    POST /api/v1/customers/{customer_id}/services/ -> Create service for customer
    GET  /api/v1/customers/{customer_id}/services/ -> List all services of customer with pagination and filters
    Protected with BasicAuthentication & SessionAuthentication (IsAuthenticated + ServicePermission).
    """
    authentication_classes = [BasicAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated, ServicePermission]
    pagination_class = StandardResultsSetPagination

    def _get_customer(self, customer_id: int):
        customer = get_customer_by_id(customer_id=customer_id)
        if customer is None:
            raise NotFound({'detail': 'Customer not found.'})
        return customer

    @extend_schema(
        summary="List customer services",
        description="Retrieve services provisioned for a specific customer. Supports pagination, status filtering, and service_type filtering.",
        parameters=[
            OpenApiParameter(name='page', type=int, location=OpenApiParameter.QUERY, description='Page number within paginated results (default: 1).'),
            OpenApiParameter(name='page_size', type=int, location=OpenApiParameter.QUERY, description='Number of results per page (default: 10, max: 100).'),
            OpenApiParameter(name='status', type=str, location=OpenApiParameter.QUERY, description="Filter by operational status ('active', 'suspended')."),
            OpenApiParameter(name='service_type', type=str, location=OpenApiParameter.QUERY, description="Filter by service type ('vps', 'cloud_server', 'dedicated_server', 'cloud_storage')."),
        ],
        responses={
            status.HTTP_200_OK: ServiceSerializer(many=True),
            status.HTTP_401_UNAUTHORIZED: OpenApiResponse(description="Authentication credentials were not provided."),
            status.HTTP_403_FORBIDDEN: OpenApiResponse(description="Permission denied."),
            status.HTTP_404_NOT_FOUND: OpenApiResponse(description="Customer not found."),
        },
        tags=["Services"],
    )
    def get(self, request, customer_id: int):
        customer = self._get_customer(customer_id)
        srv_status = request.query_params.get('status')
        service_type = request.query_params.get('service_type')

        services = get_customer_services(
            customer=customer,
            status=srv_status,
            service_type=service_type,
        )

        paginator = self.pagination_class()
        paginated_services = paginator.paginate_queryset(services, request, view=self)
        if paginated_services is not None:
            serializer = ServiceSerializer(paginated_services, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = ServiceSerializer(services, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Create customer service",
        description="Provision a new service attached to the specified customer. Initial status defaults to active.",
        request=ServiceSerializer,
        responses={
            status.HTTP_201_CREATED: ServiceSerializer,
            status.HTTP_400_BAD_REQUEST: OpenApiResponse(description="Validation error (e.g. blank name or unsupported service_type)."),
            status.HTTP_401_UNAUTHORIZED: OpenApiResponse(description="Authentication credentials were not provided."),
            status.HTTP_403_FORBIDDEN: OpenApiResponse(description="Permission denied."),
            status.HTTP_404_NOT_FOUND: OpenApiResponse(description="Customer not found."),
        },
        tags=["Services"],
    )
    def post(self, request, customer_id: int):
        customer = self._get_customer(customer_id)
        serializer = ServiceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        service = create_service(
            customer=customer,
            name=serializer.validated_data['name'],
            service_type=serializer.validated_data['service_type'],
        )

        return Response(ServiceSerializer(service).data, status=status.HTTP_201_CREATED)


class ServiceListAPIView(APIView):
    """
    GET /api/v1/services/ -> Global paginated list of services with filtering by customer_id, status, and service_type.
    Protected with BasicAuthentication & SessionAuthentication (IsAuthenticated + ServicePermission).
    """
    authentication_classes = [BasicAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated, ServicePermission]
    pagination_class = StandardResultsSetPagination

    @extend_schema(
        summary="List all services",
        description="Retrieve a paginated list of all services across the platform. Supports filtering by customer_id, status, and service_type.",
        parameters=[
            OpenApiParameter(name='page', type=int, location=OpenApiParameter.QUERY, description='Page number within paginated results (default: 1).'),
            OpenApiParameter(name='page_size', type=int, location=OpenApiParameter.QUERY, description='Number of results per page (default: 10, max: 100).'),
            OpenApiParameter(name='customer_id', type=int, location=OpenApiParameter.QUERY, description='Filter by customer ID.'),
            OpenApiParameter(name='status', type=str, location=OpenApiParameter.QUERY, description="Filter by operational status ('active', 'suspended')."),
            OpenApiParameter(name='service_type', type=str, location=OpenApiParameter.QUERY, description="Filter by service type ('vps', 'cloud_server', 'dedicated_server', 'cloud_storage')."),
        ],
        responses={
            status.HTTP_200_OK: ServiceSerializer(many=True),
            status.HTTP_401_UNAUTHORIZED: OpenApiResponse(description="Authentication credentials were not provided."),
            status.HTTP_403_FORBIDDEN: OpenApiResponse(description="Permission denied."),
        },
        tags=["Services"],
    )
    def get(self, request):
        customer_id = request.query_params.get('customer_id')
        srv_status = request.query_params.get('status')
        service_type = request.query_params.get('service_type')

        parsed_customer_id = None
        if customer_id is not None:
            try:
                parsed_customer_id = int(customer_id)
            except ValueError:
                return Response(
                    {'customer_id': ['Must be a valid integer.']},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        services = get_services_list(
            customer_id=parsed_customer_id,
            status=srv_status,
            service_type=service_type,
        )

        paginator = self.pagination_class()
        paginated_services = paginator.paginate_queryset(services, request, view=self)
        if paginated_services is not None:
            serializer = ServiceSerializer(paginated_services, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = ServiceSerializer(services, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ServiceDetailAPIView(APIView):
    """
    GET /api/v1/services/{service_id}/ -> Retrieve service details by ID.
    Protected with SessionAuthentication & BasicAuthentication (IsAuthenticated + ServicePermission).
    """
    authentication_classes = [BasicAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated, ServicePermission]

    def _get_service(self, service_id: int):
        service = get_service_by_id(service_id=service_id)
        if service is None:
            raise NotFound({'detail': 'Service not found.'})
        return service

    @extend_schema(
        summary="Retrieve service details",
        description="Retrieve comprehensive details of a specific service by ID.",
        responses={
            status.HTTP_200_OK: ServiceSerializer,
            status.HTTP_401_UNAUTHORIZED: OpenApiResponse(description="Authentication credentials were not provided."),
            status.HTTP_403_FORBIDDEN: OpenApiResponse(description="Permission denied."),
            status.HTTP_404_NOT_FOUND: OpenApiResponse(description="Service not found."),
        },
        tags=["Services"],
    )
    def get(self, request, service_id: int):
        service = self._get_service(service_id)
        serializer = ServiceSerializer(service)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ServiceStatusUpdateAPIView(APIView):
    """
    PATCH /api/v1/services/{service_id}/status/ -> Update operational status of service.
    Protected with SessionAuthentication & BasicAuthentication (IsAuthenticated + ServicePermission).
    """
    authentication_classes = [BasicAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated, ServicePermission]

    def _get_service(self, service_id: int):
        service = get_service_by_id(service_id=service_id)
        if service is None:
            raise NotFound({'detail': 'Service not found.'})
        return service

    @extend_schema(
        summary="Update service status",
        description="Change operational status of an existing service. Allowed values: 'active', 'suspended'.",
        request=ServiceStatusUpdateSerializer,
        responses={
            status.HTTP_200_OK: ServiceSerializer,
            status.HTTP_400_BAD_REQUEST: OpenApiResponse(description="Invalid status value or empty payload."),
            status.HTTP_401_UNAUTHORIZED: OpenApiResponse(description="Authentication credentials were not provided."),
            status.HTTP_403_FORBIDDEN: OpenApiResponse(description="Permission denied."),
            status.HTTP_404_NOT_FOUND: OpenApiResponse(description="Service not found."),
        },
        examples=[
            OpenApiExample(
                "Suspend Service Request",
                value={"status": "suspended"},
                request_only=True,
            ),
            OpenApiExample(
                "Activate Service Request",
                value={"status": "active"},
                request_only=True,
            ),
            OpenApiExample(
                "Status Update Response",
                value={
                    "id": 1,
                    "name": "Production Web Worker",
                    "service_type": "vps",
                    "status": "suspended",
                    "customer": 1,
                    "created_at": "2026-11-22T05:34:07.123456Z",
                },
                response_only=True,
                status_codes=[str(status.HTTP_200_OK)],
            ),
        ],
        tags=["Services"],
    )
    def patch(self, request, service_id: int):
        service = self._get_service(service_id)
        serializer = ServiceStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        updated_service = update_service_status(
            service=service,
            status=serializer.validated_data['status'],
        )

        return Response(ServiceSerializer(updated_service).data, status=status.HTTP_200_OK)
