from rest_framework import serializers

from purchasing_temp.models import (
    TemporaryPurchaseOrder,
    TemporaryPurchaseOrderItem,
)

from .models import (
    GRN,
    GRNItem,
    TemporaryProduct,
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

    def validate_product_id(self, value):

        try:
            product = TemporaryProduct.objects.get(id=value)

        except TemporaryProduct.DoesNotExist:
            raise serializers.ValidationError(
                "Product does not exist."
            )

        if product.status != "ACTIVE":
            raise serializers.ValidationError(
                "Product is not active."
            )

        return value


class GRNSerializer(serializers.ModelSerializer):

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

        read_only_fields = [
            "id",
            "created_at",
        ]

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

        if value is None:
            return value

        try:
            supplier = TemporarySupplier.objects.get(
                id=value
            )

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
        items = attrs.get("items", [])

        for item in items:

            product_id = item["product_id"]

            try:
                TemporaryPurchaseOrderItem.objects.get(
                    purchase_order_id=po_id,
                    product_id=product_id
                )

            except TemporaryPurchaseOrderItem.DoesNotExist:
                raise serializers.ValidationError({
                    "items": (
                        f"Product {product_id} does not belong "
                        f"to Purchase Order {po_id}."
                    )
                })

        return attrs

    def create(self, validated_data):

        items_data = validated_data.pop("items")

        grn = GRN.objects.create(
            **validated_data
        )

        for item_data in items_data:

            GRNItem.objects.create(
                grn_id=grn,
                **item_data
            )

        return grn