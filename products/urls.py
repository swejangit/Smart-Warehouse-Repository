from django.urls import path

from .views import (CategoryListCreateView, ProductListCreateView, ProductDetailView, CategoryDetailView, ProductSearchView, )

urlpatterns = [
    path("categories/", CategoryListCreateView.as_view(), name = "category-list-create"),

    path("products/", ProductListCreateView.as_view(), name = "product-list - create"),

    path("products/search/", ProductSearchView.as_view(), name = "product-search"),

    path("products/<int:pk>/", ProductDetailView.as_view(), name = "product-detail"),
    
    path("products/<int:pk>/status/", ProductDetailView.as_view(), name = "product-status"),

    path("categories/<int:pk>/", CategoryDetailView.as_view(), name="category-detail"),

]




