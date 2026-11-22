from drf_spectacular.utils import (
    OpenApiExample,
    OpenApiResponse,
    extend_schema,
)
from rest_framework import status
from rest_framework.authentication import BasicAuthentication, SessionAuthentication
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.customers.selectors import get_customer_by_id
from apps.services.selectors import get_customer_services
from apps.services.serializers import ServiceSerializer
from apps.services.services import create_service


class CustomerServiceListCreateAPIView(APIView):
    """
    POST /api/v1/customers/{customer_id}/services/ -> Create service for customer
    GET  /api/v1/customers/{customer_id}/services/ -> List all services of customer
    Protected with SessionAuthentication & BasicAuthentication (IsAuthenticated).
    """
    authentication_classes = [SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def _get_customer(self, customer_id: int):
        customer = get_customer_by_id(customer_id=customer_id)
        if customer is None:
            raise NotFound({'detail': 'Customer not found.'})
        return customer

    @extend_schema(
        summary="List customer services",
        description="Retrieve all services provisioned for a specific customer, ordered by created_at descending.",
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
        services = get_customer_services(customer=customer)
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
