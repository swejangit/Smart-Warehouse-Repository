MOCK_PRODUCTS = {
    103: {
        "id": 103,
        "name": "Product 1",
        "price": 100,
        "status": "ACTIVE"
    },
    101: {
        "id": 101,
        "name": "Product 101",
        "price": 250,
         "status": "ACTIVE"
    },
    102: {
        "id": 102,
        "name": "Product 102",
        "price": 500,
         "status": "ACTIVE"
    }
}


def get_mock_product(product_id):
    return MOCK_PRODUCTS.get(product_id)