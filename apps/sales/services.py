# sales/services.py

from .mock_products import get_mock_product


def get_product_from_employee1(product_id):
    return get_mock_product(product_id)

















'''import requests


def get_product_from_employee1(product_id):
    url = f"http://employee1/api/products/{product_id}"

    try:
        response = requests.get(url, timeout=3)

    except requests.exceptions.Timeout:
        return None

    except requests.exceptions.RequestException:
        return None

    if response.status_code == 200:
        return response.json()

    return None'''