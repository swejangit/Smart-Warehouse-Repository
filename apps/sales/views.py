from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import SalesOrderSerializer
from .models import SalesOrder
from .services import get_stock_availability, reserve_stock, release_stock

class SalesOrderCreateView(APIView):

    def get(self, request):
        orders = SalesOrder.objects.all()
        serializer = SalesOrderSerializer(orders, many=True)

        return Response(
            {
                "success": True,
                "data": serializer.data,
                "message": "Sales orders retrieved successfully",
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        serializer = SalesOrderSerializer(data=request.data)

        if serializer.is_valid():
            order = serializer.save()

            return Response(
                {
                    "success": True,
                    "data": SalesOrderSerializer(order).data,
                    "message": "Sales order created successfully",
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {
                "success": False,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Invalid input",
                    "fields": serializer.errors,
                },
            },
            status=status.HTTP_400_BAD_REQUEST,
        )  
class SalesOrderDetailView(APIView):

    def get(self, request, order_id):
        try:
            order = SalesOrder.objects.get(id=order_id)
        except SalesOrder.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "NOT_FOUND",
                        "message": "Sales order not found",
                    },
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = SalesOrderSerializer(order)

        return Response(
            {
                "success": True,
                "data": serializer.data,
                "message": "Sales order retrieved successfully",
            },
            status=status.HTTP_200_OK,
        )      


class SalesOrderAvailabilityView(APIView):

    def post(self, request, order_id):
        try:
            order = SalesOrder.objects.get(id=order_id)
        except SalesOrder.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "NOT_FOUND",
                        "message": "Sales order not found",
                    },
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        availability = []
        all_available = True

        for item in order.items.all():
            stock = get_stock_availability(item.product_id)

            if stock is None:
                all_available = False

                availability.append(
                    {
                        "product_id": item.product_id,
                        "ordered_qty": item.ordered_qty,
                        "available_qty": 0,
                        "status": "UNAVAILABLE",
                    }
                )

                continue

            available_qty = stock["available_quantity"]

            if available_qty < item.ordered_qty:
                all_available = False
                item_status = "INSUFFICIENT_STOCK"
            else:
                item_status = "AVAILABLE"

            availability.append(
                {
                    "product_id": item.product_id,
                    "ordered_qty": item.ordered_qty,
                    "available_qty": available_qty,
                    "status": item_status,
                }
            )

        return Response(
            {
                "success": True,
                "data": {
                    "order_id": order.id,
                    "available": all_available,
                    "items": availability,
                },
                "message": "Stock availability checked successfully",
            },
            status=status.HTTP_200_OK,
        )


class SalesOrderReserveView(APIView):

    def post(self, request, order_id):
        try:
            order = SalesOrder.objects.get(id=order_id)
        except SalesOrder.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "NOT_FOUND",
                        "message": "Sales order not found",
                    },
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check availability before reserving anything
        for item in order.items.all():
            stock = get_stock_availability(item.product_id)

            if stock is None:
                return Response(
                    {
                        "success": False,
                        "error": {
                            "code": "STOCK_UNAVAILABLE",
                            "message": f"Stock information unavailable for product {item.product_id}",
                        },
                    },
                    status=status.HTTP_409_CONFLICT,
                )

            if stock["available_quantity"] < item.ordered_qty:
                return Response(
                    {
                        "success": False,
                        "error": {
                            "code": "INSUFFICIENT_STOCK",
                            "message": f"Insufficient stock for product {item.product_id}",
                        },
                    },
                    status=status.HTTP_409_CONFLICT,
                )

        # Reserve each item
        reservations = []

        for item in order.items.all():
            result = reserve_stock(
                item.product_id,
                item.ordered_qty
            )

            if result is None or not result.get("success"):
                return Response(
                    {
                        "success": False,
                        "error": {
                            "code": "RESERVATION_FAILED",
                            "message": f"Reservation failed for product {item.product_id}",
                        },
                    },
                    status=status.HTTP_409_CONFLICT,
                )

            item.reserved_qty = item.ordered_qty
            item.save(update_fields=["reserved_qty", "updated_at"])

            reservations.append(
                {
                    "product_id": item.product_id,
                    "reserved_qty": item.reserved_qty,
                }
            )

        order.status = "RESERVED"
        order.save(update_fields=["status", "updated_at"])

        return Response(
            {
                "success": True,
                "data": {
                    "order_id": order.id,
                    "status": order.status,
                    "reservations": reservations,
                },
                "message": "Stock reserved successfully",
            },
            status=status.HTTP_200_OK,
        )    
ORDER_STATUS_TRANSITIONS = {
    "DRAFT": ["CONFIRMED"],
    "CONFIRMED": ["RESERVED", "CANCELLED"],
    "RESERVED": ["PICKING", "CANCELLED"],
    "PICKING": ["READY_FOR_DISPATCH"],
    "READY_FOR_DISPATCH": ["DISPATCHED"],
    "DISPATCHED": ["COMPLETED"],
    "COMPLETED": [],
    "CANCELLED": [],
}


class SalesOrderStatusView(APIView):

    def patch(self, request, order_id):
        try:
            order = SalesOrder.objects.get(id=order_id)
        except SalesOrder.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "NOT_FOUND",
                        "message": "Sales order not found",
                    },
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        new_status = request.data.get("status")

        if not new_status:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "INVALID_STATUS",
                        "message": "Status is required",
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Normalize status input
        if isinstance(new_status, str):
            new_status = new_status.strip().upper()

        valid_statuses = dict(SalesOrder.STATUS_CHOICES)

        if new_status not in valid_statuses:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "INVALID_STATUS",
                        "message": f"Invalid status: {new_status}",
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        allowed_statuses = ORDER_STATUS_TRANSITIONS.get(
            order.status,
            []
        )

        if new_status not in allowed_statuses:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "INVALID_STATUS_TRANSITION",
                        "message": (
                            f"Cannot change order status "
                            f"from {order.status} to {new_status}"
                        ),
                    },
                },
                status=status.HTTP_409_CONFLICT,
            )

        old_status = order.status

        # If a RESERVED order is being cancelled,
        # release all active reservations first.
        if old_status == "RESERVED" and new_status == "CANCELLED":

            for item in order.items.all():

                if item.reserved_qty <= 0:
                    continue

                result = release_stock(
                    item.product_id,
                    item.reserved_qty
                )

                if result is None or not result.get("success"):
                    return Response(
                        {
                            "success": False,
                            "error": {
                                "code": "RELEASE_FAILED",
                                "message": (
                                    f"Reservation release failed "
                                    f"for product {item.product_id}"
                                ),
                            },
                        },
                        status=status.HTTP_409_CONFLICT,
                    )

                # Clear reservation for this item
                item.reserved_qty = 0
                item.save(
                    update_fields=["reserved_qty", "updated_at"]
                )

        order.status = new_status
        order.save(
            update_fields=["status", "updated_at"]
        )

        return Response(
            {
                "success": True,
                "data": {
                    "order_id": order.id,
                    "previous_status": old_status,
                    "status": order.status,
                },
                "message": "Order status updated successfully",
            },
            status=status.HTTP_200_OK,
        )


class SalesOrderReleaseReservationView(APIView):

    def post(self, request, order_id):
        try:
            order = SalesOrder.objects.get(id=order_id)
        except SalesOrder.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "NOT_FOUND",
                        "message": "Sales order not found",
                    },
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check whether the order has active reservations
        reservations = []

        for item in order.items.all():

            if item.reserved_qty <= 0:
                continue

            result = release_stock(
                item.product_id,
                item.reserved_qty
            )

            if result is None or not result.get("success"):
                return Response(
                    {
                        "success": False,
                        "error": {
                            "code": "RELEASE_FAILED",
                            "message": (
                                f"Reservation release failed "
                                f"for product {item.product_id}"
                            ),
                        },
                    },
                    status=status.HTTP_409_CONFLICT,
                )

            reservations.append(
                {
                    "product_id": item.product_id,
                    "released_qty": item.reserved_qty,
                }
            )

            # Clear the reservation from the order item
            item.reserved_qty = 0
            item.save(
                update_fields=["reserved_qty", "updated_at"]
            )

        if not reservations:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "NO_ACTIVE_RESERVATION",
                        "message": "No active reservation found for this order",
                    },
                },
                status=status.HTTP_409_CONFLICT,
            )

        # If the order was RESERVED, move it back to CONFIRMED
        if order.status == "RESERVED":
            order.status = "CONFIRMED"
            order.save(
                update_fields=["status", "updated_at"]
            )

        return Response(
            {
                "success": True,
                "data": {
                    "order_id": order.id,
                    "status": order.status,
                    "released_reservations": reservations,
                },
                "message": "Stock reservation released successfully",
            },
            status=status.HTTP_200_OK,
        )