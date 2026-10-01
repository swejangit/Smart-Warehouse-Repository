from rest_framework import serializers
from .models import Product, StockBalance,InventoryTransaction
from Warehouse.models import Warehouse,Location
from decimal import Decimal

def validate_quantity(quantity):
    if Decimal(str(quantity)) <= Decimal("0.00"):
        raise serializers.ValidationError("Quantity must be greater than zero.")
    return quantity

def validate_product(product_id):
    product = Product.objects.filter(Product_id=product_id).first()
    if not product:
        raise serializers.ValidationError(f"Product with ID {product_id} does not exist.")
    return product

def validate_warehouse(warehouse_id):
    warehouse = Warehouse.objects.filter(id=warehouse_id).first()
    if not warehouse:
        raise serializers.ValidationError(f"Warehouse with ID {warehouse_id} does not exist.")
    return warehouse

def validate_location_belongs_to_warehouse(warehouse_id, location_id):
    location = Location.objects.filter(id=location_id).first()
    if not location:
        raise serializers.ValidationError(f"Location with ID {location_id} does not exist.")

    if location.warehouse_id != warehouse_id:
        raise serializers.ValidationError(
            f"Location {location_id} does not belong to Warehouse {warehouse_id}."
        )
    return location


def validate_inventory(warehouse_id, product_id, location_id, quantity):
    validate_quantity(quantity)

    warehouse = validate_warehouse(warehouse_id)
    product = validate_product(product_id)
    location = validate_location_belongs_to_warehouse(
        warehouse_id,
        location_id
    )

    return warehouse, product, location

class StockBalanceSerializer(serializers.ModelSerializer):

    class Meta:
        model = StockBalance

        fields = [
            'stock_balance_id',
            'product',
            'warehouse',
            'location',
            'total_quantity',
            'reserved_quantity',
            'available_quantity',
            'updated_at',
        ]

        read_only_fields = [
            'stock_balance_id',
            'updated_at',
        ]

    

class InventoryTransactionSerializer(serializers.ModelSerializer):

    class Meta:
        model = InventoryTransaction

        fields = [
            'transaction_id',
            'product',
            'transaction_type',
            'quantity',
            'source_reference',
            'transaction_date',
        ]

        read_only_fields = [
            'transaction_id',
            'transaction_date',
        ]


class AvailabilitySerializer(serializers.ModelSerializer):

    class Meta:
        model = StockBalance

        fields = [
            'product',
            'available_quantity',
        ]



