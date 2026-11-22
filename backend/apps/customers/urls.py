from django.urls import path
from apps.customers.views import CustomerDetailAPIView, CustomerListCreateAPIView
from apps.services.views import CustomerServiceListCreateAPIView

app_name = 'customers'

urlpatterns = [
    path('', CustomerListCreateAPIView.as_view(), name='customer-list-create'),
    path('<int:customer_id>/', CustomerDetailAPIView.as_view(), name='customer-detail'),
    path('<int:customer_id>/services/', CustomerServiceListCreateAPIView.as_view(), name='customer-services'),
]
