from django.urls import path
from apps.authentication.views import CSRFView, LoginView, LogoutView, UserMeView

app_name = 'authentication'

urlpatterns = [
    path('csrf/', CSRFView.as_view(), name='csrf'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', UserMeView.as_view(), name='me'),
]
