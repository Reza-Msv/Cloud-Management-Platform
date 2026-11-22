from django.urls import path
from apps.services.views import CustomerServiceListCreateAPIView

app_name = 'services'

urlpatterns = [
    path('<int:customer_id>/services/', CustomerServiceListCreateAPIView.as_view(), name='customer-service-list-create'),
]
