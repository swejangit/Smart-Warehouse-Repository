import pytest
from rest_framework.test import APIClient

from products.models import Category


@pytest.mark.django_db
def test_create_category():
    client = APIClient()

    response = client.post(
        "/api/categories/",
        {"name": "Test Electronics"},
        format="json"
    )

    assert response.status_code == 201
    assert response.data["success"] is True
    assert Category.objects.filter(name="Test Electronics").exists()


@pytest.mark.django_db
def test_create_duplicate_category():
    client = APIClient()

    Category.objects.create(name="Electronics")

    response = client.post(
        "/api/categories/",
        {"name": "Electronics"},
        format="json"
    )

    assert response.status_code == 400
    assert response.data["success"] is False


@pytest.mark.django_db
def test_create_category_without_name():
    client = APIClient()

    response = client.post(
        "/api/categories/",
        {},
        format="json"
    )

    assert response.status_code == 400
    assert response.data["success"] is False


@pytest.mark.django_db
def test_create_category_with_blank_name():
    client = APIClient()

    response = client.post(
        "/api/categories/",
        {"name": ""},
        format="json"
    )

    assert response.status_code == 400
    assert response.data["success"] is False


@pytest.mark.django_db
def test_get_category():
    client = APIClient()

    category = Category.objects.create(name="Furniture")

    response = client.get(f"/api/categories/{category.id}/")

    assert response.status_code == 200
    assert response.data["success"] is True
    assert response.data["data"]["name"] == "Furniture"


@pytest.mark.django_db
def test_get_category_not_found():
    client = APIClient()

    response = client.get("/api/categories/9999/")

    assert response.status_code == 404
    assert response.data["success"] is False


@pytest.mark.django_db
def test_update_category():
    client = APIClient()

    category = Category.objects.create(name="Old Category")

    response = client.put(
        f"/api/categories/{category.id}/",
        {"name": "Updated Category"},
        format="json"
    )

    assert response.status_code == 200
    assert response.data["success"] is True

    category.refresh_from_db()

    assert category.name == "Updated Category"


@pytest.mark.django_db
def test_update_category_duplicate_name():
    client = APIClient()

    Category.objects.create(name="Electronics")
    category = Category.objects.create(name="Furniture")

    response = client.put(
        f"/api/categories/{category.id}/",
        {"name": "Electronics"},
        format="json"
    )

    assert response.status_code == 400
    assert response.data["success"] is False








