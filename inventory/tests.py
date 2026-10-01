from django.test import TestCase

from Warehouse.models import Location, Warehouse
from inventory.models import Product, StockBalance
from inventory.service import release_stock, reserve_stock, stock_in


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

        self.assertEqual(self.stock_balance.total_quantity, total)
        self.assertEqual(self.stock_balance.reserved_quantity, reserved)
        self.assertEqual(self.stock_balance.available_quantity, available)

    def test_stock_in_increases_total_and_available_quantity(self):
        stock_in(self.stock_balance, 7)

        self.assert_stock_quantities(
            total=27,
            reserved=5,
            available=22,
        )

    def test_reserve_stock_increases_reserved_and_decreases_available(self):
        reserve_stock(self.stock_balance, 4)

        self.assert_stock_quantities(
            total=20,
            reserved=9,
            available=11,
        )
    def test_release_stock_decreases_reserved_and_increases_available(self):
        release_stock(self.stock_balance, 3)

        self.assert_stock_quantities(
        total=20,
        reserved=2,
        available=18,
    )


    def test_reserve_stock_rejects_insufficient_available_stock(self):
        with self.assertRaises(ValueError):
            reserve_stock(self.stock_balance, 20)


    def test_release_stock_rejects_insufficient_reserved_stock(self):
        with self.assertRaises(ValueError):
            release_stock(self.stock_balance, 10)
