from rest_framework import status
from rest_framework.authentication import BasicAuthentication, SessionAuthentication
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.customers.selectors import get_customer_by_id, get_customers_list
from apps.customers.serializers import CustomerSerializer


class CustomerListCreateAPIView(APIView):
    """
    GET  /api/v1/customers/ -> List all customers ordered by created_at desc.
    POST /api/v1/customers/ -> Create a new customer.
    Protected with SessionAuthentication & BasicAuthentication (IsAuthenticated).
    """
    authentication_classes = [SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        customers = get_customers_list()
        serializer = CustomerSerializer(customers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = CustomerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        customer = serializer.save()
        return Response(CustomerSerializer(customer).data, status=status.HTTP_201_CREATED)


class CustomerDetailAPIView(APIView):
    """
    GET   /api/v1/customers/{id}/ -> Retrieve a customer by ID.
    PATCH /api/v1/customers/{id}/ -> Partially update customer details.
    Protected with SessionAuthentication & BasicAuthentication (IsAuthenticated).
    """
    authentication_classes = [SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def _get_customer(self, customer_id: int):
        customer = get_customer_by_id(customer_id=customer_id)
        if customer is None:
            raise NotFound({'detail': 'Customer not found.'})
        return customer

    def get(self, request, customer_id: int):
        customer = self._get_customer(customer_id)
        serializer = CustomerSerializer(customer)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, customer_id: int):
        customer = self._get_customer(customer_id)
        serializer = CustomerSerializer(customer, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_customer = serializer.save()
        return Response(CustomerSerializer(updated_customer).data, status=status.HTTP_200_OK)
