from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import SalesOrderSerializer
from .models import SalesOrder


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