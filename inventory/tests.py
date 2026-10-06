from unittest.mock import patch

from django.test import TestCase
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIClient

from Warehouse.models import Location, Warehouse
from inventory.models import InventoryTransaction, Product, StockBalance
from inventory.service import (
    process_inventory_in,
    process_inventory_out,
    release_stock,
    reserve_stock,
    stock_in,
)


class StockCalculationTests(TestCase):

    def setUp(self):
        self.warehouse = Warehouse.objects.create(
            code="WH-TEST",
            name="Test Warehouse",
            city="Test City",
        )

        self.location = Location.objects.create(
            code="BIN-TEST",
            warehouse=self.warehouse,
        )

        self.product = Product.objects.create(
            Product_name="Test Product",
            sku="TEST-SKU",
        )

        self.stock_balance = StockBalance.objects.create(
            product=self.product,
            warehouse=self.warehouse,
            location=self.location,
            total_quantity=20,
            reserved_quantity=5,
            available_quantity=15,
        )

    def assert_stock_quantities(self, total, reserved, available):
        self.stock_balance.refresh_from_db()

        self.assertEqual(self.stock_balance.total_quantity,total)
        self.assertEqual(self.stock_balance.reserved_quantity,reserved)
        self.assertEqual( self.stock_balance.available_quantity,available)
    # 1. Stock IN - Success
    def test_stock_in_increases_total_and_available_quantity(self):
        stock_in(self.stock_balance, 7)

        self.assert_stock_quantities(
            total=27,
            reserved=5,
            available=22,
        )

    # 2. Reservation - Success
    def test_reserve_stock_successfully_updates_quantities(self):
        reserve_stock(self.stock_balance, 10)

        self.assert_stock_quantities(
            total=20,
            reserved=15,
            available=5,
        )

    # 3. Reservation - Insufficient Available Stock
    def test_reserve_stock_rejects_when_available_quantity_is_too_low(self):
        with self.assertRaises(ValueError):
            reserve_stock(self.stock_balance, 20)

    # 4. Release - Success
    def test_release_stock_returns_reserved_quantity_back_to_available(self):
        release_stock(self.stock_balance, 4)

        self.assert_stock_quantities(
            total=20,
            reserved=1,
            available=19,
        )

    # 5. Release - Insufficient Reserved Stock
    def test_release_stock_rejects_when_reserved_quantity_is_too_low(self):
        with self.assertRaises(ValueError):
            release_stock(self.stock_balance, 10)


class InventoryInTests(TestCase):

    def setUp(self):
        self.client = APIClient()

        self.warehouse = Warehouse.objects.create(
            code="WH-IN-01",
            name="Inventory In Warehouse",
            city="Nairobi",
        )

        self.location = Location.objects.create(
            code="BIN-IN-01",
            warehouse=self.warehouse,
        )

        self.product = Product.objects.create(
            Product_name="Inventory In Product",
            sku="INV-IN-001",
        )

    # 6. Inventory IN - Success
    def test_process_inventory_in_updates_stock_and_creates_transaction(self):
        grn_id = 5001

        items = [
            {
                "product_id": self.product.Product_id,
                "location_id": self.location.id,
                "received_quantity": 7,
            }
        ]

        with patch.dict(
            "inventory.service.DUMMY_GRNS",
            {
                grn_id: {
                    "warehouse_id": self.warehouse.id,
                    "items": [
                        {
                            "product_id": self.product.Product_id,
                            "grn_quantity": 15,
                        }
                    ],
                }
            },
            clear=True,
        ):
            result = process_inventory_in(
                grn_id,
                self.warehouse.id,
                items,
            )

        self.assertEqual(result["grnId"], grn_id)
        self.assertEqual(
            result["items"][0]["receivedQuantity"],
            7,
        )
        self.assertEqual(
            result["items"][0]["remainingQuantity"],
            8,
        )

        stock_balance = StockBalance.objects.get(
            product=self.product,
            warehouse=self.warehouse,
            location=self.location,
        )

        self.assertEqual(
            stock_balance.total_quantity,
            7,
        )
        self.assertEqual(
            stock_balance.available_quantity,
            7,
        )
        self.assertEqual(
            stock_balance.reserved_quantity,
            0,
        )

        transaction = InventoryTransaction.objects.get(
            product=self.product,
            source_reference=str(grn_id),
            transaction_type="IN",
        )

        self.assertEqual(
            transaction.quantity,
            7,
        )

    # 7. Inventory IN - Invalid GRN
    def test_process_inventory_in_rejects_unknown_grn(self):
        with self.assertRaises(ValidationError):
            process_inventory_in(
                99999,
                self.warehouse.id,
                [
                    {
                        "product_id": self.product.Product_id,
                        "location_id": self.location.id,
                        "received_quantity": 5,
                    }
                ],
            )

    # 8. Inventory IN API - Valid Payload
    def test_inventory_in_api_accepts_valid_payload(self):
        grn_id = 5002

        payload = {
            "grn_id": grn_id,
            "warehouse_id": self.warehouse.id,
            "items": [
                {
                    "product_id": self.product.Product_id,
                    "location_id": self.location.id,
                    "received_quantity": 4,
                }
            ],
        }

        with patch.dict(
            "inventory.service.DUMMY_GRNS",
            {
                grn_id: {
                    "warehouse_id": self.warehouse.id,
                    "items": [
                        {
                            "product_id": self.product.Product_id,
                            "grn_quantity": 10,
                        }
                    ],
                }
            },
            clear=True,
        ):
            response = self.client.post(
                "/api/inventory/in/",
                payload,
                format="json",
            )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["items"][0]["receivedQuantity"],
            4,
        )

        self.assertEqual(
            response.data["items"][0]["remainingQuantity"],
            6,
        )


class InventoryOutTests(TestCase):

    def setUp(self):
        self.warehouse = Warehouse.objects.create(
            code="WH-OUT-01",
            name="Stock Out Warehouse",
            city="Mombasa",
        )

        self.location = Location.objects.create(
            code="BIN-OUT-01",
            warehouse=self.warehouse,
        )

        self.product = Product.objects.create(
            Product_name="Outbound Product",
            sku="OUT-001",
        )

        self.stock_balance = StockBalance.objects.create(
            product=self.product,
            warehouse=self.warehouse,
            location=self.location,
            total_quantity=30,
            reserved_quantity=0,
            available_quantity=30,
        )

    # 9. Inventory OUT - Success
    def test_process_inventory_out_reduces_available_and_total_quantity(self):
        result = process_inventory_out(
            sales_order_id="SO-1001",
            warehouse_id=self.warehouse.id,
            items=[
                {
                    "product_id": self.product.Product_id,
                    "location_id": self.location.id,
                    "quantity": 8,
                }
            ],
        )

        self.assertEqual(
            result["salesOrderId"],
            "SO-1001",
        )

        self.assertEqual(
            result["items"][0]["quantity"],
            8,
        )

        self.stock_balance.refresh_from_db()

        self.assertEqual(
            self.stock_balance.total_quantity,
            22,
        )

        self.assertEqual(
            self.stock_balance.available_quantity,
            22,
        )

        self.assertTrue(
            InventoryTransaction.objects.filter(
                product=self.product,
                transaction_type="OUT",
                quantity=8,
                source_reference="SO-1001",
            ).exists()
        )

    # 10. Inventory OUT - Insufficient Stock
    def test_process_inventory_out_rejects_insufficient_available_stock(self):
        with self.assertRaises(ValidationError):
            process_inventory_out(
                sales_order_id="SO-1002",
                warehouse_id=self.warehouse.id,
                items=[
                    {
                        "product_id": self.product.Product_id,
                        "location_id": self.location.id,
                        "quantity": 40,
                    }
                ],
            )