from rest_framework import serializers
from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):

    created_at = serializers.DateTimeField(
        format="%d-%m-%Y %I:%M %p",
        read_only=True
    )

    updated_at = serializers.DateTimeField(
        format="%d-%m-%Y %I:%M %p",
        read_only=True
    )

    class Meta:
        model = Customer

        fields = [
            "id",
            "customer_code",
            "name",
            "contact",
            "billing_address",
            "shipping_address",
            "payment_terms",
            "credit_limit",
            "status",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]