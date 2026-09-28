# Product API Documentation

## 1. Overview

The Product API manages product master data for the Smart Warehouse system.

### Base URL

```text
http://127.0.0.1:8000/api
```

### Content Type

```text
Content-Type: application/json
```

---

# 2. Create Product

## Endpoint

```http
POST /products/
```

## Purpose

Creates a new product in the Product Master.

## Request Body

```json
{
    "sku": "ELEC001",
    "name": "Wireless Mechanical Keyboard",
    "category": 1,
    "base_unit": "pcs",
    "reorder_level": 10,
    "active": true
}
```

## Success Response

**HTTP 201 Created**

```json
{
    "success": true,
    "data": {
        "id": 1,
        "sku": "ELEC001",
        "name": "Wireless Mechanical Keyboard",
        "category": 1,
        "base_unit": "pcs",
        "reorder_level": 10,
        "active": true
    },
    "message": "Product created successfully"
}
```

## Validation Rules

- SKU is required.
- SKU must be unique.
- Product name is required.
- Product name cannot be blank.
- Category is required.
- Category must reference an existing category.
- Base unit is required.
- Reorder level cannot be negative.
- Active represents the current product status.

---

# 3. Get Products

## Endpoint

```http
GET /products/
```

## Purpose

Retrieves all products.

## Success Response

**HTTP 200 OK**

```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "sku": "ELEC001",
            "name": "Wireless Mechanical Keyboard",
            "category": 1,
            "base_unit": "pcs",
            "reorder_level": 10,
            "active": true
        }
    ],
    "message": "Products retrieved successfully"
}
```

---

# 4. Get Product by ID

## Endpoint

```http
GET /products/{id}/
```

## Example

```http
GET /products/1/
```

## Purpose

Retrieves a specific product using its ID.

## Success Response

**HTTP 200 OK**

```json
{
    "success": true,
    "data": {
        "id": 1,
        "sku": "ELEC001",
        "name": "Wireless Mechanical Keyboard",
        "category": 1,
        "base_unit": "pcs",
        "reorder_level": 15,
        "active": true
    },
    "message": "Product retrieved successfully"
}
```

## Product Not Found

**HTTP 404 Not Found**

```json
{
    "success": false,
    "error": {
        "code": "NOT_FOUND",
        "message": "Product not found"
    }
}
```

---

# 5. Update Product

## Endpoint

```http
PUT /products/{id}/
```

## Example

```http
PUT /products/1/
```

## Purpose

Updates an existing product.

## Request Body

```json
{
    "sku": "ELEC001",
    "name": "Wireless Mechanical Keyboard",
    "category": 1,
    "base_unit": "pcs",
    "reorder_level": 15,
    "active": true
}
```

## Success Response

**HTTP 200 OK**

```json
{
    "success": true,
    "data": {
        "id": 1,
        "sku": "ELEC001",
        "name": "Wireless Mechanical Keyboard",
        "category": 1,
        "base_unit": "pcs",
        "reorder_level": 15,
        "active": true
    },
    "message": "Product updated successfully"
}
```

## Validation Rules

- Product ID must exist.
- SKU must remain unique.
- Required fields must be provided.
- Category must exist.
- Reorder level cannot be negative.

---

# 6. Product Status Management

## Endpoint

```http
PATCH /products/{id}/status/
```

## Purpose

Activates or deactivates a product.

## Deactivate Product

### Request

```json
{
    "active": false
}
```

### Success Response

**HTTP 200 OK**

```json
{
    "success": true,
    "data": {
        "id": 1,
        "sku": "ELEC001",
        "name": "Wireless Mechanical Keyboard",
        "category": 1,
        "base_unit": "pcs",
        "reorder_level": 15,
        "active": false
    },
    "message": "Product status updated successfully"
}
```

## Activate Product

### Request

```json
{
    "active": true
}
```

The same endpoint is used to activate the product.

## Validation

The `active` field must be a Boolean value.

---

# 7. Product Search

## Endpoint

```http
GET /products/search/
```

## Purpose

Searches and filters products using supported query parameters.

### Search by Name

```http
GET /products/search/?name=Keyboard
```

### Search by SKU

```http
GET /products/search/?sku=ELEC001
```

### Search by Category

```http
GET /products/search/?category=1
```

### Search by Active Status

```http
GET /products/search/?active=true
```

### Search Inactive Products

```http
GET /products/search/?active=false
```

## Success Response

**HTTP 200 OK**

```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "sku": "ELEC001",
            "name": "Wireless Mechanical Keyboard",
            "category": 1,
            "base_unit": "pcs",
            "reorder_level": 15,
            "active": true
        }
    ],
    "message": "Products retrieved successfully"
}
```

## Empty Search Result

If no product matches the search criteria:

```json
{
    "success": true,
    "data": [],
    "message": "Products retrieved successfully"
}
```

## Invalid Active Parameter

For example:

```http
GET /products/search/?active=yes
```

Response:

**HTTP 400 Bad Request**

```json
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Invalid search parameter",
        "fields": {
            "active": [
                "Use true or false."
            ]
        }
    }
}
```

---

# 8. API Summary

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/products/` | Create product |
| GET | `/products/` | Retrieve products |
| GET | `/products/{id}/` | Retrieve product by ID |
| PUT | `/products/{id}/` | Update product |
| PATCH | `/products/{id}/status/` | Activate/deactivate product |
| GET | `/products/search/` | Search products |

---

# 9. Product Validation

The Product API validates:

- Required SKU
- SKU uniqueness
- Required product name
- Non-blank product name
- Valid category
- Required category
- Required base unit
- Non-negative reorder level
- Product ID existence
- Product status value
- Search parameter validation

---

# 10. Error Handling

The API follows a common error structure:

```json
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Validation failed",
        "fields": {}
    }
}
```

Common HTTP status codes:

| Status Code | Meaning |
|---|---|
| 200 | Successful retrieval/update |
| 201 | Product successfully created |
| 400 | Validation error |
| 404 | Product not found |

---

# 11. Automated Test Coverage

Product APIs have been covered by automated pytest tests.

Current automated test coverage:

- Product creation
- Product retrieval
- Product update
- Product not found
- Duplicate SKU
- Invalid category
- Negative reorder level
- Missing SKU
- Blank product name
- Product activation
- Product deactivation
- Product status validation
- Product search by name
- Product search by SKU
- Product search by category
- Product search by active status
- Invalid search parameter
- Empty search result

All current Product tests are passing.