from django.urls import path
from apps.customers.views import CustomerListCreateAPIView

app_name = 'customers'

urlpatterns = [
    path('', CustomerListCreateAPIView.as_view(), name='customer-list-create'),
]
