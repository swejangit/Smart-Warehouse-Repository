from rest_framework import serializers
from .models import Category, Product

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id" , "name"]
        

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            "id",
            "sku",
            "name",
            "category",
            "base_unit",
            "reorder_level",
            "active",
        ]


class ProductStatusSerializer(serializers.Serializer):
    active = serializers.BooleanField()







