from django.urls import path

from .views import CustomerCreateView, CustomerDetailView, CustomerSearchView

urlpatterns = [
    path("", CustomerCreateView.as_view(), name="customer-create"),
    path("search/", CustomerSearchView.as_view(), name="customer-search"),
    path("<int:customer_id>/", CustomerDetailView.as_view(), name="customer-detail"),
]