from django.urls import path

from .views import (
    SalesOrderCreateView,
    SalesOrderDetailView,
    SalesOrderAvailabilityView,
    SalesOrderReserveView,
    SalesOrderStatusView,
    SalesOrderReleaseReservationView,
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
    path(
        "<int:order_id>/availability-check/",
        SalesOrderAvailabilityView.as_view(),
        name="sales-order-availability",
        ),
    path(
        "<int:order_id>/reserve/",
        SalesOrderReserveView.as_view(),
        name="sales-order-reserve",
        ), 
    path(
        "<int:order_id>/status/",
        SalesOrderStatusView.as_view(),
        name="sales-order-status",
        ),      
    path(
        "<int:order_id>/release-reservation/",
        SalesOrderReleaseReservationView.as_view(),
        name="sales-order-release-reservation",
        ),    
]