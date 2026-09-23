from rest_framework import serializers

from apps.customers.models import Customer

from .models import SalesOrder, SalesOrderItem
from .services import get_product_from_employee1


class SalesOrderItemSerializer(serializers.ModelSerializer):

    def validate_product_id(self, value):
        # Validate product with Employee 1's Product API.
        if value <= 0:
            raise serializers.ValidationError(
                "Product ID is invalid"
            )

        # Get product details from Employee 1.
        product = get_product_from_employee1(value)

        if product is None:
            raise serializers.ValidationError(
                "Product not found"
            )

        # Only ACTIVE products can be ordered.
        if product.get("status") != "ACTIVE":
            raise serializers.ValidationError(
                "Product is not active"
            )

        return value

    def validate_ordered_qty(self, value):
        # Quantity must be at least 1.
        if value < 1:
            raise serializers.ValidationError(
                "Quantity must be at least 1"
            )

        return value

    class Meta:
        model = SalesOrderItem
        fields = [
            "product_id",
            "ordered_qty",
            "unit_price",
            "item_total",
        ]
        read_only_fields = [
        "unit_price",
        "item_total",
    ]


class SalesOrderSerializer(serializers.ModelSerializer):

    # A Sales Order can contain multiple items.
    items = SalesOrderItemSerializer(many=True)
    order_date = serializers.DateTimeField(
        format="%d-%m-%Y %I:%M %p",
        read_only=True
        )

    created_at = serializers.DateTimeField(
        format="%d-%m-%Y %I:%M %p",
        read_only=True
        )

    updated_at = serializers.DateTimeField(
        format="%d-%m-%Y %I:%M %p",
        read_only=True
        )

    def validate_customer_id(self, value):
    # Check whether the customer exists.
        try:
            customer = Customer.objects.get(id=value)
        except Customer.DoesNotExist:
            raise serializers.ValidationError(
            "Customer does not exist"
            )

        # Only ACTIVE customers can create Sales Orders.
        if customer.status != "ACTIVE":
            raise serializers.ValidationError(
                "Customer is not active"
            )

        return value

    def create(self, validated_data):
        # Extract items before creating the order.
        items = validated_data.pop("items")

        total_amount = 0

        # Calculate each item total and the order total.
        for item in items:
            product = get_product_from_employee1(
                item["product_id"]
            )

            unit_price = product.get("price")
            item_total = unit_price * item["ordered_qty"]

            total_amount += item_total

        # Create the Sales Order with the calculated total.
        order = SalesOrder.objects.create(
            total_amount=total_amount,
            **validated_data
        )

        # Create each item and link it to the order.
        for item in items:
            product = get_product_from_employee1(
                item["product_id"]
            )

            unit_price = product.get("price")
            item_total = unit_price * item["ordered_qty"]

            SalesOrderItem.objects.create(
                sales_order=order,
                unit_price=unit_price,
                item_total=item_total,
                **item
            )

        return order

    class Meta:
        model = SalesOrder
        fields = [
            "id",
            "so_no",
            "customer_id",
            "status",
            "order_date",
            "total_amount",
            "items",
            "created_at",
            "updated_at",
        ]

        # These fields are controlled by the system upon creation.
        read_only_fields = [
            "id",
            "status",
            "order_date",
            "total_amount",
            "created_at",
            "updated_at",
        ]