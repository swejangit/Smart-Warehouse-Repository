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



MOCK_INVENTORY = {
    101: {
        "product_id": 101,
        "available_quantity": 25,
    },

    102: {
        "product_id": 102,
        "available_quantity": 10,
    },

    103: {
        "product_id": 103,
        "available_quantity": 50,
    },
}

def get_mock_product(product_id):
    return MOCK_PRODUCTS.get(product_id)

def get_mock_stock(product_id):
    return MOCK_INVENTORY.get(product_id)

def mock_reserve_stock(product_id, quantity):
    stock = MOCK_INVENTORY.get(product_id)

    if stock is None:
        return None

    if stock["available_quantity"] < quantity:
        return {
            "success": False,
            "message": "Insufficient stock"
        }

    stock["available_quantity"] -= quantity

    return {
        "success": True,
        "product_id": product_id,
        "reserved_quantity": quantity
    }