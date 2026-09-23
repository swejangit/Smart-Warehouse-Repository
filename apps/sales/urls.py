from django.urls import path

from .views import (
    SalesOrderCreateView,
    SalesOrderDetailView,
)


urlpatterns = [
    path(
        "",
        SalesOrderCreateView.as_view(),
        name="sales-order-list-create",
    ),
    path(
        "<int:order_id>/",
        SalesOrderDetailView.as_view(),
        name="sales-order-detail",
    ),
]