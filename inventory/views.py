from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import ValidationError
from .models import StockBalance, InventoryTransaction
from .serializers import InventoryTransactionSerializer,StockBalanceSerializer,AvailabilitySerializer
@api_view(['GET'])
def stock_balance(request, product_id=None, location_id=None):
    stock = StockBalance.objects.all()
    if product_id is not None:
        stock = stock.filter(product_id=product_id)
        if not stock.exists():
            return Response(status=status.HTTP_404_BAD_REQUEST)
    if location_id is not None:
        stock = stock.filter(location_id=location_id)
        if not stock.exists():
            return Response(
                {"error": "No stock found for this product."},
                status=status.HTTP_404_NOT_FOUND
            )
    serializer = StockBalanceSerializer(stock, many=True)
    return Response(serializer.data,status=status.HTTP_200_OK)

@api_view(['GET'])
def transaction_history(request, transaction_id=None):
        if transaction_id is not None:
            transaction = get_object_or_404(InventoryTransaction,transaction_id=transaction_id)
            serializer = InventoryTransactionSerializer(transaction)
            return Response(serializer.data,status=status.HTTP_200_OK)
        transactions = InventoryTransaction.objects.all()
        if not transactions.exists():
            return Response( {"error": "No transaction history found."}, status=status.HTTP_404_NOT_FOUND )
        serializer = InventoryTransactionSerializer(transactions, many=True)
        return Response(serializer.data,status=status.HTTP_200_OK)

@api_view(['GET'])
def availability(request, product_id):
    stock = StockBalance.objects.filter(product_id=product_id)
    if not stock.exists():
        return Response({"message": "Product stock not found."},status=status.HTTP_404_NOT_FOUND)

    total_available = sum(
        item.available_quantity
        for item in stock
    )

    return Response(
        {
            "product_id": product_id,
            "available_quantity": total_available
        },
        status=status.HTTP_200_OK
    )
