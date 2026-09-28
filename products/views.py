from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Category , Product
from .serializers import (CategorySerializer, ProductSerializer, ProductStatusSerializer, )

class CategoryListCreateView(APIView):

    def get(self,request):
        categories = Category.objects.all()
        serializer = CategorySerializer(categories,many = True)

        return Response({
            "success": True,
            "data": serializer.data,
            "message": "Categories retrieved successfully"
        }, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = CategorySerializer(data=request.data)

        if serializer.is_valid():
            category = serializer.save()

            return Response({
                "success": True,
                "data": CategorySerializer(category).data,
                "message": "Category created successfully"
            }, status=status.HTTP_201_CREATED)

        return Response({
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid category data",
                "fields": serializer.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)


class ProductListCreateView(APIView):

    def get(self , request):
        products = Product.objects.all()
        serializer = ProductSerializer(products , many = True)

        return Response({
            "success" : True,
            "data" : serializer.data,
            "message" : "Products retrieved successfully"
        }, status = status.HTTP_200_OK)

    def post(self, request):
        serializer = ProductSerializer(data=request.data)

        if serializer.is_valid():
            product = serializer.save()

            return Response({
                "success": True,
                "data": ProductSerializer(product).data,
                "message": "Product created successfully"
            }, status=status.HTTP_201_CREATED)

        return Response({
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid product data",
                "fields": serializer.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)


class ProductDetailView(APIView):

    def get(self, request, pk):
        try:
            product = Product.objects.get(pk = pk)
        except Product.DoesNotExist:
            return Response({
                "success": False,
                "error": {
                    "code": "NOT_FOUND",
                    "message": "Product not found"
                }
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = ProductSerializer(product)

        return Response({
            "success": True,
            "data": serializer.data,
            "message": "Product retrieved successfully"
        }, status=status.HTTP_200_OK)

    def put(self, request, pk):
        try:
            product = Product.objects.get(pk = pk)
        except Product.DoesNotExist:
            return Response({
                "success" : False,
                "error" : {
                    "code" : "NOT_FOUND",
                    "message" : "Product not found"
                }
            }, status = status.HTTP_404_NOT_FOUND)

        serializer = ProductSerializer(
            product,
            data = request.data
        )

        if serializer.is_valid():
            product = serializer.save()

            return Response({
                 "success" : True,
                "data" : ProductSerializer(product).data,
                "message" : "Product updated successfully"
            }, status = status.HTTP_200_OK)

        return Response({
            "success" : False,
            "error" : {
                "code" : "VALIDATION_ERROR",
                "message" : "Invalid product data",
                "fields" : serializer.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        try:
            product = Product.objects.get(pk = pk)
        except Product.DoesNotExist:
            return  Response({
                "success": False,
                "error": {
                    "code": "NOT_FOUND",
                    "message": "Product not found"
                }
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = ProductStatusSerializer(data=request.data)

        if serializer.is_valid():
            product.active = serializer.validated_data["active"]
            product.save(update_fields=["active"])

            return Response({
                "success": True,
                "data": ProductSerializer(product).data,
                "message": "Product status updated successfully"
            }, status=status.HTTP_200_OK)

        return Response({
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid product status data",
                "fields": serializer.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)


class CategoryDetailView(APIView):

    def get(self, request, pk):
        try:
            category = Category.objects.get(pk=pk)
        except Category.DoesNotExist:
            return Response({
                "success" : False,
                "error" : {
                    "code": "NOT_FOUND",
                    "message": "Category not found"
                }
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = CategorySerializer(category)

        return Response({
            "success" : True,
            "data" : serializer.data,
            "message" : "Category retrieved successfully"
        }, status=status.HTTP_200_OK)

    def put(self, request, pk):
        try:
            category = Category.objects.get(pk=pk)
        except Category.DoesNotExist:
            return Response({
                "success" : False,
                "error" : {
                    "code" : "NOT_FOUND",
                    "message" : "Category not found"
                }
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = CategorySerializer(
            category,
            data=request.data
        )

        if serializer.is_valid():
            category = serializer.save()

            return Response({
                "success" : True,
                "data" : CategorySerializer(category).data,
                "message" : "Category updated successfully"
            }, status=status.HTTP_200_OK)

        return Response({
            "success" : False,
            "error" : {
                "code" : "VALIDATION_ERROR",
                "message" : "Invalid category data",
                "fields" : serializer.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)


class ProductSearchView(APIView):

    def get(self, request):
        products = Product.objects.all()

        sku = request.query_params.get("sku")
        name = request.query_params.get("name")
        category = request.query_params.get("category")
        active = request.query_params.get("active")

        if sku:
            products = products.filter(sku__icontains = sku)
        
        if name:
            products = products.filter(name__icontains = name)

        if category:
            products = products.filter(category_id=category)

        if active is not None:
            if active.lower() == "true":
                products = products.filter(active=True)
            elif active.lower() == "false":
                products = products.filter(active=False)
            else:
                return Response({
                    "success": False,
                    "error": {
                        "code": "VALIDATION_ERROR",
                        "message": "Invalid search parameter",
                        "fields": {
                            "active": [
                                "Use true or false."
                            ]
                        }
                    }
                }, status=status.HTTP_400_BAD_REQUEST)

        serializer = ProductSerializer(products, many=True)

        return Response({
            "success": True,
            "data": serializer.data,
            "message": "Products retrieved successfully"
        }, status=status.HTTP_200_OK)








