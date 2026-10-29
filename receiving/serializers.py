
from django.db.models import Sum
from rest_framework import serializers
from django.db import transaction

from products.models import Product
from purchasing_temp.models import (
    TemporaryPurchaseOrder,
    TemporaryPurchaseOrderItem,
)
from .models import (
    GRN,
    GRNItem,
    TemporarySupplier,
)


class EligiblePOSerializer(serializers.ModelSerializer):
    class Meta:
        model = TemporaryPurchaseOrder
        fields = [
            "id",
            "po_no",
            "supplier_id",
            "status",
            "order_date",
        ]


class GRNItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = GRNItem
        fields = [
            "id",
            "product_id",
            "received_qty",
            "batch_id",
            "serial_id",
        ]
        read_only_fields = ["id"]

    def validate_product_id(self, value):
        try:
            product = Product.objects.get(id=value)
        except Product.DoesNotExist:
            raise serializers.ValidationError(
                "Product does not exist."
            )

        if not product.active:
            raise serializers.ValidationError(
                "Product is not active."
            )

        return value

    def validate_received_qty(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Received quantity must be greater than zero."
            )

        return value


class GRNSerializer(serializers.ModelSerializer):
    grn_no = serializers.CharField(
        max_length=50,
        validators=[],
    )
    supplier_id = serializers.IntegerField(required=True)
    items = GRNItemSerializer(many=True)


    class Meta:
        model = GRN
        fields = [
            "id",
            "grn_no",
            "po_id",
            "warehouse_id",
            "supplier_id",
            "receiving_date",
            "status",
            "created_by",
            "created_at",
            "items",
        ]
        read_only_fields = ["id", "created_at"]

    def validate_grn_no(self, value):
        queryset = GRN.objects.filter(grn_no=value)

        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                "GRN number already exists."
            )

        return value

    def validate_po_id(self, value):
        try:
            po = TemporaryPurchaseOrder.objects.get(id=value)
        except TemporaryPurchaseOrder.DoesNotExist:
            raise serializers.ValidationError(
                "Purchase Order does not exist."
            )

        if po.status != "APPROVED":
            raise serializers.ValidationError(
                "Purchase Order is not approved."
            )

        return value

    def validate_supplier_id(self, value):

        try:
            supplier = TemporarySupplier.objects.get(id=value)
        except TemporarySupplier.DoesNotExist:
            raise serializers.ValidationError(
                "Supplier does not exist."
            )

        if supplier.status != "ACTIVE":
            raise serializers.ValidationError(
                "Supplier is not active."
            )

        return value

    def validate(self, attrs):
        po_id = attrs.get("po_id")
        supplier_id = attrs.get("supplier_id")
        items = attrs.get("items", [])

        if not items:
            raise serializers.ValidationError({
                "items": "At least one GRN item is required."
            })

        try:
            po = TemporaryPurchaseOrder.objects.get(id=po_id)
        except TemporaryPurchaseOrder.DoesNotExist:
            raise serializers.ValidationError({
                "po_id": "Purchase Order does not exist."
            })

        if supplier_id is not None and po.supplier_id != supplier_id:
            raise serializers.ValidationError({
                "supplier_id": (
                    "Supplier does not match the Purchase Order."
                )
            })

        # Aggregate requested quantities for duplicate product lines.
        requested_quantities = {}

        for item in items:
            product_id = item["product_id"]
            received_qty = item["received_qty"]

            requested_quantities[product_id] = (
                requested_quantities.get(product_id, 0)
                + received_qty
            )

        # Validate cumulative quantities against the PO product totals.
        for product_id, requested_qty in requested_quantities.items():
            po_quantity = (
                TemporaryPurchaseOrderItem.objects
                .filter(
                    purchase_order_id=po_id,
                    product_id=product_id,
                )
                .aggregate(total=Sum("ordered_qty"))["total"]
            )

            if po_quantity is None:
                raise serializers.ValidationError({
                    "items": (
                        f"Product {product_id} does not belong "
                        f"to Purchase Order {po_id}."
                    )
                })

            previously_received = (
                GRNItem.objects
                .filter(
                    grn_id__po_id=po_id,
                    product_id=product_id,
                )
                .aggregate(total=Sum("received_qty"))["total"]
            ) or 0

            remaining_qty = po_quantity - previously_received

            if requested_qty > remaining_qty:
                raise serializers.ValidationError({
                    "items": (
                        f"Product {product_id}: requested quantity "
                        f"{requested_qty} exceeds the ordered quantity "
                        f"{remaining_qty}."
                    )
                })

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items")

        grn = GRN.objects.create(**validated_data)

        for item_data in items_data:
            GRNItem.objects.create(
                grn_id=grn,
                **item_data,
            )

        return grn
