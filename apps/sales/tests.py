from unittest.mock import patch

from django.test import TestCase

from apps.customers.models import Customer

from .models import SalesOrder, SalesOrderItem
from .serializers import SalesOrderSerializer
from rest_framework.test import APIClient


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

class SalesOrder_APITest(TestCase):

    def setUp(self):
        self.client = APIClient()

        self.customer = Customer.objects.create(
            customer_code="SPRINT2-CUST",
            name="Sprint 2 Customer"
        )

        self.order = SalesOrder.objects.create(
            so_no="SPRINT2-SO-001",
            customer_id=self.customer.id,
            status="CONFIRMED"
        )

        self.item = SalesOrderItem.objects.create(
            sales_order=self.order,
            product_id=101,
            ordered_qty=5,
            unit_price=500,
            item_total=2500
        )

    def test_stock_availability_success(self):
     with patch(
        "apps.sales.views.get_stock_availability"
     ) as mock_stock:

        mock_stock.return_value = {
            "product_id": 101,
            "available_quantity": 20
        }

        response = self.client.post(
            f"/api/sales-orders/{self.order.id}/availability-check/"
        )

        self.assertEqual(response.status_code, 200)


    def test_stock_availability_insufficient(self):
        with patch(
        "apps.sales.views.get_stock_availability"
        ) as mock_stock:

            mock_stock.return_value = {
            "product_id": 101,
            "available_quantity": 2
        }

        response = self.client.post(
            f"/api/sales-orders/{self.order.id}/availability-check/"
        )

        self.assertEqual(response.status_code, 200)
    def test_stock_reservation_success(self):
        with patch(
            "apps.sales.views.get_stock_availability"
        ) as mock_stock, patch(
            "apps.sales.views.reserve_stock"
        ) as mock_reserve:

            mock_stock.return_value = {
                "product_id": 101,
                "available_quantity": 20
            }

            mock_reserve.return_value = {
                "success": True,
                "product_id": 101,
                "reserved_quantity": 5
            }

            response = self.client.post(
                f"/api/sales-orders/{self.order.id}/reserve/"
            )

            self.assertEqual(response.status_code, 200)

            self.item.refresh_from_db()
            self.order.refresh_from_db()

            self.assertEqual(self.item.reserved_qty, 5)
            self.assertEqual(self.order.status, "RESERVED")

    def test_stock_reservation_insufficient(self):
        with patch(
            "apps.sales.views.get_stock_availability"
        ) as mock_stock:

            mock_stock.return_value = {
                "product_id": 101,
                "available_quantity": 2
            }

            response = self.client.post(
                f"/api/sales-orders/{self.order.id}/reserve/"
            )

            self.assertEqual(response.status_code, 409)

    def test_release_reservation_success(self):
        self.order.status = "RESERVED"
        self.order.save()

        self.item.reserved_qty = 5
        self.item.save()

        with patch(
            "apps.sales.views.release_stock"
        ) as mock_release:

            mock_release.return_value = {
                "success": True,
                "product_id": 101,
                "released_quantity": 5
            }

            response = self.client.post(
                f"/api/sales-orders/{self.order.id}/release-reservation/"
            )

            self.assertEqual(response.status_code, 200)

            self.item.refresh_from_db()
            self.order.refresh_from_db()

            self.assertEqual(self.item.reserved_qty, 0)
            self.assertEqual(self.order.status, "CONFIRMED")

    def test_release_without_active_reservation(self):
        response = self.client.post(
            f"/api/sales-orders/{self.order.id}/release-reservation/"
        )

        self.assertEqual(response.status_code, 409)

    def test_valid_order_status_transition(self):
        response = self.client.patch(
            f"/api/sales-orders/{self.order.id}/status/",
            {"status": "RESERVED"},
            format="json"
        )

        self.assertEqual(response.status_code, 200)

        self.order.refresh_from_db()

        self.assertEqual(
            self.order.status,
            "RESERVED"
        )

    def test_invalid_order_status_transition(self):
        response = self.client.patch(
            f"/api/sales-orders/{self.order.id}/status/",
            {"status": "COMPLETED"},
            format="json"
        )

        self.assertEqual(response.status_code, 409)

    def test_reserved_order_cancellation_releases_reservation(self):
        self.order.status = "RESERVED"
        self.order.save()

        self.item.reserved_qty = 5
        self.item.save()

        with patch(
            "apps.sales.views.release_stock"
        ) as mock_release:

            mock_release.return_value = {
                "success": True,
                "product_id": 101,
                "released_quantity": 5
            }

            response = self.client.patch(
                f"/api/sales-orders/{self.order.id}/status/",
                {"status": "CANCELLED"},
                format="json"
            )

            self.assertEqual(response.status_code, 200)

            self.item.refresh_from_db()
            self.order.refresh_from_db()

            self.assertEqual(
                self.order.status,
                "CANCELLED"
            )

            self.assertEqual(
                self.item.reserved_qty,
                0
            )

            mock_release.assert_called_once_with(
                101,
                5
            )            