import pytest
from rest_framework.test import APIClient

from products.models import Category, Product

# Product Tests
@pytest.mark.django_db
def test_create_product():
    client = APIClient()

    category = Category.objects.create(name="Electronics")

    response = client.post(
        "/api/products/",
        {
            "sku": "TEST001",
            "name": "Test Keyboard",
            "category": category.id,
            "base_unit": "pcs",
            "reorder_level": 10,
            "active": True,
        },
        format="json"
    )

    assert response.status_code == 201
    assert response.data["success"] is True
    assert Product.objects.filter(sku="TEST001").exists()


@pytest.mark.django_db
def test_get_product():
    client = APIClient()

    category = Category.objects.create(name="Electronics")

    product = Product.objects.create(
        sku="TEST002",
        name="Test Mouse",
        category=category,
        base_unit="pcs",
        reorder_level=5,
        active=True,
    )

    response = client.get(f"/api/products/{product.id}/")

    assert response.status_code == 200
    assert response.data["success"] is True
    assert response.data["data"]["sku"] == "TEST002"


@pytest.mark.django_db
def test_get_product_not_found():
    client = APIClient()

    response = client.get("/api/products/9999/")

    assert response.status_code == 404
    assert response.data["success"] is False


@pytest.mark.django_db
def test_update_product():
    client = APIClient()

    category = Category.objects.create(name="Electronics")

    product = Product.objects.create(
        sku="TEST003",
        name="Old Keyboard",
        category=category,
        base_unit="pcs",
        reorder_level=10,
        active=True,
    )

    response = client.put(
        f"/api/products/{product.id}/",
        {
            "sku": "TEST003",
            "name": "Updated Keyboard",
            "category": category.id,
            "base_unit": "pcs",
            "reorder_level": 15,
            "active": True,
        },
        format="json"
    )

    assert response.status_code == 200
    assert response.data["success"] is True

    product.refresh_from_db()

    assert product.name == "Updated Keyboard"
    assert product.reorder_level == 15


@pytest.mark.django_db
def test_create_duplicate_sku():
    client = APIClient()

    category = Category.objects.create(name="Electronics")

    Product.objects.create(
        sku="DUP001",
        name="Existing Product",
        category=category,
        base_unit="pcs",
        reorder_level=10,
        active=True,
    )

    response = client.post(
        "/api/products/",
        {
            "sku": "DUP001",
            "name": "Another Product",
            "category": category.id,
            "base_unit": "pcs",
            "reorder_level": 5,
            "active": True,
        },
        format="json"
    )

    assert response.status_code == 400
    assert response.data["success"] is False


@pytest.mark.django_db
def test_create_product_invalid_category():
    client = APIClient()

    response = client.post(
        "/api/products/",
        {
            "sku": "INVALID001",
            "name": "Test Product",
            "category": 9999,
            "base_unit": "pcs",
            "reorder_level": 10,
            "active": True,
        },
        format="json"
    )

    assert response.status_code == 400
    assert response.data["success"] is False


@pytest.mark.django_db
def test_create_product_negative_reorder_level():
    client = APIClient()

    category = Category.objects.create(name="Electronics")

    response = client.post(
        "/api/products/",
        {
            "sku": "NEG001",
            "name": "Test Product",
            "category": category.id,
            "base_unit": "pcs",
            "reorder_level": -5,
            "active": True,
        },
        format="json"
    )

    assert response.status_code == 400
    assert response.data["success"] is False


@pytest.mark.django_db
def test_create_product_without_sku():
    client = APIClient()

    category = Category.objects.create(name="Electronics")

    response = client.post(
        "/api/products/",
        {
            "name": "Test Product",
            "category": category.id,
            "base_unit": "pcs",
            "reorder_level": 10,
            "active": True,
        },
        format="json"
    )

    assert response.status_code == 400
    assert response.data["success"] is False


@pytest.mark.django_db
def test_create_product_with_blank_name():
    client = APIClient()

    category = Category.objects.create(name="Electronics")

    response = client.post(
        "/api/products/",
        {
            "sku": "BLANK001",
            "name": "",
            "category": category.id,
            "base_unit": "pcs",
            "reorder_level": 10,
            "active": True,
        },
        format="json"
    )

    assert response.status_code == 400
    assert response.data["success"] is False

# Status Tests

@pytest.mark.django_db
def test_deactivate_product():
    client = APIClient()

    category = Category.objects.create(name="Electronics")

    product = Product.objects.create(
        sku="STATUS001",
        name="Status Test Product",
        category=category,
        base_unit="pcs",
        reorder_level=10,
        active=True,
    )

    response = client.patch(
        f"/api/products/{product.id}/status/",
        {"active": False},
        format="json"
    )

    assert response.status_code == 200
    assert response.data["success"] is True
    assert response.data["data"]["active"] is False

    product.refresh_from_db()

    assert product.active is False


@pytest.mark.django_db
def test_activate_product():
    client = APIClient()

    category = Category.objects.create(name="Electronics")

    product = Product.objects.create(
        sku="STATUS002",
        name="Status Test Product",
        category=category,
        base_unit="pcs",
        reorder_level=10,
        active=False,
    )

    response = client.patch(
        f"/api/products/{product.id}/status/",
        {"active": True},
        format="json"
    )

    assert response.status_code == 200
    assert response.data["success"] is True
    assert response.data["data"]["active"] is True

    product.refresh_from_db()

    assert product.active is True


@pytest.mark.django_db
def test_update_product_status_not_found():
    client = APIClient()

    response = client.patch(
        "/api/products/9999/status/",
        {"active": False},
        format="json"
    )

    assert response.status_code == 404
    assert response.data["success"] is False


@pytest.mark.django_db
def test_update_product_status_without_active():
    client = APIClient()

    category = Category.objects.create(name="Electronics")

    product = Product.objects.create(
        sku="STATUS003",
        name="Status Test Product",
        category=category,
        base_unit="pcs",
        reorder_level=10,
        active=True,
    )

    response = client.patch(
        f"/api/products/{product.id}/status/",
        {},
        format="json"
    )

    assert response.status_code == 400
    assert response.data["success"] is False

# Search Tests

@pytest.mark.django_db
def test_search_product_by_name():
    client = APIClient()

    category = Category.objects.create(name="Electronics")

    Product.objects.create(
        sku="SEARCH001",
        name="Wireless Keyboard",
        category=category,
        base_unit="pcs",
        reorder_level=10,
        active=True,
    )

    response = client.get(
        "/api/products/search/?name=Keyboard"
    )

    assert response.status_code == 200
    assert response.data["success"] is True
    assert len(response.data["data"]) == 1
    assert response.data["data"][0]["sku"] == "SEARCH001"


@pytest.mark.django_db
def test_search_product_by_sku():
    client = APIClient()

    category = Category.objects.create(name="Electronics")

    Product.objects.create(
        sku="SEARCH002",
        name="Wireless Mouse",
        category=category,
        base_unit="pcs",
        reorder_level=5,
        active=True,
    )

    response = client.get(
        "/api/products/search/?sku=SEARCH002"
    )

    assert response.status_code == 200
    assert response.data["success"] is True
    assert response.data["data"][0]["sku"] == "SEARCH002"


@pytest.mark.django_db
def test_search_product_by_category():
    client = APIClient()

    category = Category.objects.create(name="Electronics")

    Product.objects.create(
        sku="SEARCH003",
        name="Keyboard",
        category=category,
        base_unit="pcs",
        reorder_level=10,
        active=True,
    )

    response = client.get(
        f"/api/products/search/?category={category.id}"
    )

    assert response.status_code == 200
    assert response.data["success"] is True
    assert len(response.data["data"]) == 1
    assert response.data["data"][0]["sku"] == "SEARCH003"


@pytest.mark.django_db
def test_search_active_products():
    client = APIClient()

    category = Category.objects.create(name="Electronics")

    Product.objects.create(
        sku="SEARCH004",
        name="Active Product",
        category=category,
        base_unit="pcs",
        reorder_level=10,
        active=True,
    )

    response = client.get(
        "/api/products/search/?active=true"
    )

    assert response.status_code == 200
    assert response.data["success"] is True
    assert all(
        product["active"] is True
        for product in response.data["data"]
    )


@pytest.mark.django_db
def test_search_invalid_active_parameter():
    client = APIClient()

    response = client.get(
        "/api/products/search/?active=yes"
    )

    assert response.status_code == 400
    assert response.data["success"] is False


@pytest.mark.django_db  
def test_search_product_empty_result():
    client = APIClient()

    response = client.get(
        "/api/products/search/?name=DoesNotExist"
    )

    assert response.status_code == 200
    assert response.data["success"] is True
    assert response.data["data"] == []







