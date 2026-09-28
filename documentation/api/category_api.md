# Category API Documentation

## 1. Overview

The Category API manages product categories used by the Smart Warehouse Product Master module.

### Base URL

```text
http://127.0.0.1:8000/api
```

### Content Type

```text
Content-Type: application/json
```

---

# 2. Create Category

## Endpoint

```http
POST /categories/
```

## Purpose

Creates a new product category.

## Request Body

```json
{
    "name": "Electronics"
}
```

## Success Response

**HTTP 201 Created**

```json
{
    "success": true,
    "data": {
        "id": 1,
        "name": "Electronics"
    },
    "message": "Category created successfully"
}
```

## Validation Rules

- Category name is required.
- Category name cannot be blank.
- Category name must be unique.

## Duplicate Category

**HTTP 400 Bad Request**

```json
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Validation failed",
        "fields": {
            "name": [
                "category with this name already exists."
            ]
        }
    }
}
```

---

# 3. Get Categories

## Endpoint

```http
GET /categories/
```

## Purpose

Retrieves all available product categories.

## Success Response

**HTTP 200 OK**

```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "Electronics"
        },
        {
            "id": 2,
            "name": "Furniture"
        }
    ],
    "message": "Categories retrieved successfully"
}
```

---

# 4. Get Category by ID

## Endpoint

```http
GET /categories/{id}/
```

## Example

```http
GET /categories/1/
```

## Purpose

Retrieves a specific category using its ID.

## Success Response

**HTTP 200 OK**

```json
{
    "success": true,
    "data": {
        "id": 1,
        "name": "Electronics"
    },
    "message": "Category retrieved successfully"
}
```

## Category Not Found

**HTTP 404 Not Found**

```json
{
    "success": false,
    "error": {
        "code": "NOT_FOUND",
        "message": "Category not found"
    }
}
```

---

# 5. Update Category

## Endpoint

```http
PUT /categories/{id}/
```

## Example

```http
PUT /categories/1/
```

## Purpose

Updates an existing product category.

## Request Body

```json
{
    "name": "Electronic Products"
}
```

## Success Response

**HTTP 200 OK**

```json
{
    "success": true,
    "data": {
        "id": 1,
        "name": "Electronic Products"
    },
    "message": "Category updated successfully"
}
```

## Validation Rules

- Category name is required.
- Category name cannot be blank.
- Category name must be unique.
- Category ID must exist.

---

# 6. API Summary

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/categories/` | Create category |
| GET | `/categories/` | Retrieve all categories |
| GET | `/categories/{id}/` | Retrieve category by ID |
| PUT | `/categories/{id}/` | Update category |

---

# 7. HTTP Status Codes

| Status Code | Meaning |
|---|---|
| 200 | Successful retrieval or update |
| 201 | Category successfully created |
| 400 | Validation error |
| 404 | Category not found |

---

# 8. Validation and Error Handling

The Category API validates required fields and category-name uniqueness.

Errors follow the common API error structure:

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

The Category API has been tested for:

- Successful category creation
- Duplicate category
- Missing category name
- Blank category name
- Category retrieval
- Invalid category ID
- Category update
- Duplicate category during update