from unittest.mock import patch

from django.test import TestCase

from apps.customers.models import Customer

from .models import SalesOrder, SalesOrderItem
from .serializers import SalesOrderSerializer


class SalesOrderSerializerTest(TestCase):

    def setUp(self):
        # Create a test customer.
        self.customer = Customer.objects.create(
            customer_code="TEST001",
            name="Test Customer"
        )

    def test_customer_exists(self):
        serializer = SalesOrderSerializer(
            data={
                "so_no": "TEST-SO-001",
                "customer_id": self.customer.id,
                "items": []
            }
        )

        self.assertTrue(serializer.is_valid())

    def test_customer_does_not_exist(self):
        serializer = SalesOrderSerializer(
            data={
                "so_no": "TEST-SO-002",
                "customer_id": 9999,
                "items": []
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn(
            "Customer does not exist",
            serializer.errors["customer_id"]
        )
    def test_inactive_customer(self):
        # Mark the test customer as inactive.
        self.customer.status = "INACTIVE"
        self.customer.save()

        serializer = SalesOrderSerializer(
            data={
                "so_no": "TEST-SO-010",
                "customer_id": self.customer.id,
                "items": []
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn(
            "Customer is not active",
            serializer.errors["customer_id"]
            )
    def test_valid_quantity(self):
        # Mock Employee 1 Product API.
        with patch(
            "apps.sales.serializers.get_product_from_employee1"
        ) as mock_product:

            mock_product.return_value = {
                
                "id": 101,
                "status": "ACTIVE",
                "price": 500.00
                }
                

            serializer = SalesOrderSerializer(
                data={
                    "so_no": "TEST-SO-003",
                    "customer_id": self.customer.id,
                    "items": [
                        {
                            "product_id": 101,
                            "ordered_qty": 5
                        }
                    ]
                }
            )

            self.assertTrue(serializer.is_valid())

    def test_invalid_quantity(self):
        # Mock Employee 1 Product API.
        with patch(
            "apps.sales.serializers.get_product_from_employee1"
        ) as mock_product:

            mock_product.return_value = {
                "id": 101,
                "status": "ACTIVE",
                "price": 500.00
                
            }

            serializer = SalesOrderSerializer(
                data={
                    "so_no": "TEST-SO-004",
                    "customer_id": self.customer.id,
                    "items": [
                        {
                            "product_id": 101,
                            "ordered_qty": 0
                        }
                    ]
                }
            )

            self.assertFalse(serializer.is_valid())

    def test_invalid_product_id(self):
        serializer = SalesOrderSerializer(
            data={
                "so_no": "TEST-SO-005",
                "customer_id": self.customer.id,
                "items": [
                    {
                        "product_id": 0,
                        "ordered_qty": 5
                    }
                ]
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn(
            "Product ID is invalid",
            serializer.errors["items"][0]["product_id"]
        )

    def test_product_not_found(self):
        # Mock Employee 1 Product API.
        with patch(
            "apps.sales.serializers.get_product_from_employee1"
        ) as mock_product:

            mock_product.return_value = None

            serializer = SalesOrderSerializer(
                data={
                    "so_no": "TEST-SO-006",
                    "customer_id": self.customer.id,
                    "items": [
                        {
                            "product_id": 101,
                            "ordered_qty": 5
                        }
                    ]
                }
            )

            self.assertFalse(serializer.is_valid())
            self.assertIn(
                "Product not found",
                serializer.errors["items"][0]["product_id"]
            )

    def test_inactive_product(self):
        # Mock Employee 1 Product API.
        with patch(
            "apps.sales.serializers.get_product_from_employee1"
        ) as mock_product:

            mock_product.return_value = {
                "id": 101,
                "status": "INACTIVE",
                "price": 500.00
            }

            serializer = SalesOrderSerializer(
                data={
                    "so_no": "TEST-SO-007",
                    "customer_id": self.customer.id,
                    "items": [
                        {
                            "product_id": 101,
                            "ordered_qty": 5
                        }
                    ]
                }
            )

            self.assertFalse(serializer.is_valid())
            self.assertIn(
                "Product is not active",
                serializer.errors["items"][0]["product_id"]
            )

    def test_sales_order_creation(self):
        # Mock Employee 1 Product API.
        with patch(
            "apps.sales.serializers.get_product_from_employee1"
        ) as mock_product:

            mock_product.return_value = {
                "id": 101,
                "status": "ACTIVE",
                "price": 500.00
            }

            serializer = SalesOrderSerializer(
                data={
                    "so_no": "TEST-SO-008",
                    "customer_id": self.customer.id,
                    "items": [
                        {
                            "product_id": 101,
                            "ordered_qty": 5
                        }
                    ]
                }
            )

            self.assertTrue(serializer.is_valid())

            order = serializer.save()

            self.assertEqual(order.so_no, "TEST-SO-008")
            self.assertEqual(order.customer_id, self.customer.id)
            self.assertEqual(order.items.count(), 1)

    def test_multiple_sales_order_items(self):
        # Mock Employee 1 Product API.
        with patch(
            "apps.sales.serializers.get_product_from_employee1"
        ) as mock_product:

            mock_product.return_value = {
                "id": 101,
                "status": "ACTIVE",
                "price": 500.00
            }

            serializer = SalesOrderSerializer(
                data={
                    "so_no": "TEST-SO-009",
                    "customer_id": self.customer.id,
                    "items": [
                        {
                            "product_id": 101,
                            "ordered_qty": 5
                        },
                        {
                            "product_id": 102,
                            "ordered_qty": 10
                        }
                    ]
                }
            )

            self.assertTrue(serializer.is_valid())

            order = serializer.save()

            self.assertEqual(order.items.count(), 2)
            self.assertEqual(
                SalesOrderItem.objects.filter(
                    sales_order=order
                ).count(),
                2
            )