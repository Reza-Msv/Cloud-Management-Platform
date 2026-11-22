from django.urls import path
from apps.services.views import (
    CustomerServiceListCreateAPIView,
    ServiceDetailAPIView,
    ServiceListAPIView,
    ServiceStatusUpdateAPIView,
)

app_name = 'services'

urlpatterns = [
    # Global service list endpoint: /api/v1/services/
    path('', ServiceListAPIView.as_view(), name='service-list'),
    # Standalone service endpoints: /api/v1/services/<service_id>/
    path('<int:service_id>/', ServiceDetailAPIView.as_view(), name='service-detail'),
    path('<int:service_id>/status/', ServiceStatusUpdateAPIView.as_view(), name='service-status-update'),
]
