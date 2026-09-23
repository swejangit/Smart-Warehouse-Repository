from django.db.models import Q
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Customer
from .serializers import CustomerSerializer


class CustomerCreateView(APIView):

    def get(self, request):
        customers = Customer.objects.all()
        serializer = CustomerSerializer(customers, many=True)

        return Response(
            {
                "success": True,
                "data": serializer.data,
                "message": "Customers retrieved successfully",
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        serializer = CustomerSerializer(data=request.data)

        if serializer.is_valid():
            customer = serializer.save()

            return Response(
                {
                    "success": True,
                    "data": CustomerSerializer(customer).data,
                    "message": "Customer created successfully",
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


class CustomerDetailView(APIView):

    def get(self, request, customer_id):
        try:
            customer = Customer.objects.get(id=customer_id)
        except Customer.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "NOT_FOUND",
                        "message": "Customer not found",
                    },
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CustomerSerializer(customer)

        return Response(
            {
                "success": True,
                "data": serializer.data,
                "message": "Customer retrieved successfully",
            },
            status=status.HTTP_200_OK,
        )

    def put(self, request, customer_id):
        try:
            customer = Customer.objects.get(id=customer_id)
        except Customer.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "NOT_FOUND",
                        "message": "Customer not found",
                    },
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CustomerSerializer(customer, data=request.data)

        if serializer.is_valid():
            customer = serializer.save()

            return Response(
                {
                    "success": True,
                    "data": CustomerSerializer(customer).data,
                    "message": "Customer updated successfully",
                },
                status=status.HTTP_200_OK,
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

    def delete(self, request, customer_id):
        try:
            customer = Customer.objects.get(id=customer_id)
        except Customer.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "NOT_FOUND",
                        "message": "Customer not found",
                    },
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        customer.delete()

        return Response(
            {
                "success": True,
                "message": "Customer deleted successfully",
            },
            status=status.HTTP_200_OK,
        )
class CustomerSearchView(APIView):
    def get(self, request):
        query = request.query_params.get("q", "")

        customers = Customer.objects.filter(
            Q(customer_code__icontains=query)
            |
            Q(name__icontains=query)
            |
            Q(contact__icontains=query)
            |
            Q(email__icontains=query)
            )
        if not customers.exists():
            return Response(
            {
                "success": True,
                "data": [],
                "message": "No customers found",
            },
            status=status.HTTP_200_OK,
            )
        serializer = CustomerSerializer(customers, many=True)

        return Response(
            {
                "success": True,
                "data": serializer.data,
                "message": "Customers retrieved successfully",
            },
            status=status.HTTP_200_OK,
        )    