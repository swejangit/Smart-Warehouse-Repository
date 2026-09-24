# sales/services.py

from .mock_products import get_mock_product, get_mock_stock,mock_reserve_stock


#Mock Api from Emp-1
def get_product_from_employee1(product_id):
    return get_mock_product(product_id)

#MockApi from Emp-2
def get_stock_availability(product_id):
    return get_mock_stock(product_id)

# Mock API from Emp-2
def reserve_stock(product_id, quantity):
    return mock_reserve_stock(product_id, quantity)











# Employee 1 - Real API Integration


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


# Employee 2 - Real API Integration
'''
import requests


def get_stock_availability(product_id):
    url = f"http://employee2/api/inventory/{product_id}/availability"

    try:
        response = requests.get(url, timeout=5)

    except requests.exceptions.Timeout:
        return None

    except requests.exceptions.RequestException:
        return None

    if response.status_code == 200:
        return response.json()

    return None
'''


'''
import requests


def reserve_stock(product_id, quantity):
    url = f"http://employee2/api/inventory/{product_id}/reserve"

    try:
        response = requests.post(
            url,
            json={"quantity": quantity},
            timeout=5
        )

    except requests.exceptions.Timeout:
        return None

    except requests.exceptions.RequestException:
        return None

    if response.status_code == 200:
        return response.json()

    return None

'''