from django.test import TestCase
from rest_framework.test import APIClient

from .models import (
    GRN,
    TemporarySupplier,
)

from products.models import Category, Product

from purchasing_temp.models import (
    TemporaryPurchaseOrder,
    TemporaryPurchaseOrderItem,
)

class GRNTests(TestCase):

    def setUp(self):
        self.client = APIClient()

        self.category = Category.objects.create(
            name="Test Electronics"
        )

        self.active_product = Product.objects.create(
            sku="TEST-PROD-001",
            name="Test Laptop",
            category=self.category,
            base_unit="PCS",
            reorder_level=10,
            active=True,
        )

        self.inactive_product = Product.objects.create(
            sku="TEST-PROD-002",
            name="Inactive Product",
            category=self.category,
            base_unit="PCS",
            reorder_level=5,
            active=False,
        )

        self.active_supplier = TemporarySupplier.objects.create(
            supplier_code="TEST-SUP-001",
            supplier_name="Test Supplier",
            status="ACTIVE"
        )

        self.inactive_supplier = TemporarySupplier.objects.create(
            supplier_code="TEST-SUP-002",
            supplier_name="Inactive Supplier",
            status="INACTIVE"
        )
        self.other_active_supplier = TemporarySupplier.objects.create(
            supplier_code="TEST-SUP-003",
            supplier_name="Another Active Supplier",
            status="ACTIVE"
        )

        self.approved_po = TemporaryPurchaseOrder.objects.create(
            po_no="TEST-PO-001",
            supplier_id=self.active_supplier.id,
            status="APPROVED",
            order_date="2026-09-16"
        )

        TemporaryPurchaseOrderItem.objects.create(
            purchase_order_id=self.approved_po.id,
            product_id=self.active_product.id,
            ordered_qty=100
        )

        self.draft_po = TemporaryPurchaseOrder.objects.create(
            po_no="TEST-PO-002",
            supplier_id=102,
            status="DRAFT",
            order_date="2026-09-16"
        )
        self.unordered_product = Product.objects.create(
            sku="TEST-PROD-003",
            name="Product Not In PO",
            category=self.category,
            base_unit="PCS",
            reorder_level=5,
            active=True,
        )

    def test_create_grn_with_approved_po(self):
        data = {
            "grn_no": "TEST-GRN-001",
            "po_id": self.approved_po.id,
            "supplier_id": self.active_supplier.id,
            "warehouse_id": 1,
            "status": "DRAFT",
            "items": [
                {
                    "product_id": self.active_product.id,
                    "received_qty": 20,
                    "batch_id": 1,
                    "serial_id": None
                }
            ]
        }

        response = self.client.post(
            "/api/receiving/grns/",
            data,
            format="json"
        )

        self.assertEqual(response.status_code, 201)

        self.assertTrue(
            response.data["success"]
        )

        self.assertTrue(
            GRN.objects.filter(
                grn_no="TEST-GRN-001"
            ).exists()
        )

    def test_create_grn_with_duplicate_grn_number(self):
        data = {
            "grn_no": "TEST-GRN-DUPLICATE",
            "po_id": self.approved_po.id,
            "supplier_id": self.active_supplier.id,
            "warehouse_id": 1,
            "status": "DRAFT",
            "items": [
                {
                    "product_id": self.active_product.id,
                    "received_qty": 10,
                    "batch_id": 1,
                    "serial_id": None,
                }
            ],
        }

        first_response = self.client.post(
            "/api/receiving/grns/",
            data,
            format="json",
        )
        self.assertEqual(first_response.status_code, 201)

        second_response = self.client.post(
            "/api/receiving/grns/",
            data,
            format="json",
        )
        self.assertEqual(second_response.status_code, 400)
        self.assertIn(
            "GRN number already exists.",
            str(second_response.data),
        )

        self.assertEqual(
            GRN.objects.filter(
                grn_no="TEST-GRN-DUPLICATE"
            ).count(),
            1,
        )

    def test_create_grn_with_non_approved_po(self):
        data = {
            "grn_no": "TEST-GRN-002",
            "po_id": self.draft_po.id,
            "supplier_id": self.active_supplier.id,
            "warehouse_id": 1,
            "status": "DRAFT",
            "items": [
                {
                    "product_id": self.active_product.id,
                    "received_qty": 10,
                    "batch_id": 2,
                    "serial_id": None
                }
            ]
        }

        response = self.client.post(
            "/api/receiving/grns/",
            data,
            format="json"
        )

        self.assertEqual(response.status_code, 400)

        self.assertIn(
            "Purchase Order is not approved.",
            response.data["errors"]["po_id"]
        )

    def test_create_grn_with_invalid_po(self):
        data = {
            "grn_no": "TEST-GRN-003",
            "po_id": 9999,
            "supplier_id": self.active_supplier.id,
            "warehouse_id": 1,
            "status": "DRAFT",
            "items": [
                {
                    "product_id": self.active_product.id,
                    "received_qty": 15,
                    "batch_id": 3,
                    "serial_id": None
                }
            ]
        }

        response = self.client.post(
            "/api/receiving/grns/",
            data,
            format="json"
        )

        self.assertEqual(response.status_code, 400)

        self.assertIn(
            "Purchase Order does not exist.",
            response.data["errors"]["po_id"]
        )

    def test_get_all_grns(self):
        GRN.objects.create(
            grn_no="TEST-GRN-004",
            po_id=self.approved_po.id,
            warehouse_id=1,
            status="DRAFT"
        )

        response = self.client.get(
            "/api/receiving/grns/list/"
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["success"])
        self.assertGreaterEqual(
            len(response.data["data"]),
            1
        )

    def test_get_single_grn(self):
        grn = GRN.objects.create(
            grn_no="TEST-GRN-005",
            po_id=self.approved_po.id,
            warehouse_id=1,
            status="DRAFT"
        )

        response = self.client.get(
            f"/api/receiving/grns/{grn.id}/"
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["success"])

        self.assertEqual(
            response.data["data"]["grn_no"],
            "TEST-GRN-005"
        )

    def test_get_non_existing_grn(self):
        response = self.client.get(
            "/api/receiving/grns/9999/"
        )

        self.assertEqual(response.status_code, 404)
        self.assertFalse(response.data["success"])

        self.assertEqual(
            response.data["message"],
            "GRN not found"
        )

    def test_create_grn_with_invalid_product(self):
        data = {
            "grn_no": "TEST-GRN-PRODUCT-001",
            "po_id": self.approved_po.id,
            "supplier_id": 1,
            "warehouse_id": 1,
            "status": "DRAFT",
            "items": [
                {
                    "product_id": 9999,
                    "received_qty": 10,
                    "batch_id": 1,
                    "serial_id": None
                }
            ]
        }

        response = self.client.post(
            "/api/receiving/grns/",
            data,
            format="json"
        )

        self.assertEqual(response.status_code, 400)

        self.assertIn(
            "Product does not exist.",
            response.data["errors"]["items"][0]["product_id"]
        )

    def test_create_grn_with_inactive_product(self):
        data = {
            "grn_no": "TEST-GRN-PRODUCT-002",
            "po_id": self.approved_po.id,
            "supplier_id": self.active_supplier.id,
            "warehouse_id": 1,
            "status": "DRAFT",
            "items": [
                {
                    "product_id": self.inactive_product.id,
                    "received_qty": 10,
                    "batch_id": 1,
                    "serial_id": None
                }
            ]
        }

        response = self.client.post(
            "/api/receiving/grns/",
            data,
            format="json"
        )

        self.assertEqual(response.status_code, 400)

        self.assertIn(
            "Product is not active.",
            response.data["errors"]["items"][0]["product_id"]
        )

    def test_create_grn_with_invalid_supplier(self):
        data = {
            "grn_no": "TEST-GRN-SUPPLIER-001",
            "po_id": self.approved_po.id,
            "supplier_id": 9999,
            "warehouse_id": 1,
            "status": "DRAFT",
            "items": [
                {
                    "product_id": self.active_product.id,
                    "received_qty": 10,
                    "batch_id": 1,
                    "serial_id": None
                }
            ]
        }

        response = self.client.post(
            "/api/receiving/grns/",
            data,
            format="json"
        )

        self.assertEqual(response.status_code, 400)

        self.assertIn(
            "Supplier does not exist.",
            response.data["errors"]["supplier_id"]
        )

    def test_create_grn_with_inactive_supplier(self):
        data = {
            "grn_no": "TEST-GRN-SUPPLIER-002",
            "po_id": self.approved_po.id,
            "supplier_id": self.inactive_supplier.id,
            "warehouse_id": 1,
            "status": "DRAFT",
            "items": [
                {
                    "product_id": self.active_product.id,
                    "received_qty": 10,
                    "batch_id": 1,
                    "serial_id": None
                }
            ]
        }

        response = self.client.post(
            "/api/receiving/grns/",
            data,
            format="json"
        )

        self.assertEqual(response.status_code, 400)

        self.assertIn(
            "Supplier is not active.",
            response.data["errors"]["supplier_id"]
        )
    def test_create_grn_with_zero_received_quantity(self):
        data = {
            "grn_no": "TEST-GRN-ZERO-QTY",
            "po_id": self.approved_po.id,
            "supplier_id": self.active_supplier.id,
            "warehouse_id": 1,
            "status": "DRAFT",
            "items": [
                {
                    "product_id": self.active_product.id,
                    "received_qty": 0,
                    "batch_id": 1,
                    "serial_id": None,
                }
            ],
        }

        response = self.client.post(
            "/api/receiving/grns/",
            data,
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(
            GRN.objects.filter(
                grn_no="TEST-GRN-ZERO-QTY"
            ).exists()
        )

    def test_create_grn_with_negative_received_quantity(self):
        data = {
            "grn_no": "TEST-GRN-NEGATIVE-QTY",
            "po_id": self.approved_po.id,
            "supplier_id": self.active_supplier.id,
            "warehouse_id": 1,
            "status": "DRAFT",
            "items": [
                {
                    "product_id": self.active_product.id,
                    "received_qty": -5,
                    "batch_id": 1,
                    "serial_id": None,
                }
            ],
        }

        response = self.client.post(
            "/api/receiving/grns/",
            data,
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(
            GRN.objects.filter(
                grn_no="TEST-GRN-NEGATIVE-QTY"
            ).exists()
        )
    def test_create_grn_without_items(self):
        data = {
            "grn_no": "TEST-GRN-EMPTY-ITEMS",
            "po_id": self.approved_po.id,
            "supplier_id": self.active_supplier.id,
            "warehouse_id": 1,
            "status": "DRAFT",
            "items": [],
        }

        response = self.client.post(
            "/api/receiving/grns/",
            data,
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(
            GRN.objects.filter(
                grn_no="TEST-GRN-EMPTY-ITEMS"
            ).exists()
        )
    def test_create_grn_with_supplier_mismatch(self):
        data = {
            "grn_no": "TEST-GRN-SUPPLIER-MISMATCH",
            "po_id": self.approved_po.id,
            "supplier_id": self.other_active_supplier.id,
            "warehouse_id": 1,
            "status": "DRAFT",
            "items": [
                {
                    "product_id": self.active_product.id,
                    "received_qty": 5,
                    "batch_id": 1,
                    "serial_id": None,
                }
            ],
        }

        response = self.client.post(
            "/api/receiving/grns/",
            data,
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "Supplier does not match the Purchase Order.",
            response.data["errors"]["supplier_id"]
        )
        self.assertFalse(
            GRN.objects.filter(
                grn_no="TEST-GRN-SUPPLIER-MISMATCH"
            ).exists()
        )

    def test_create_grn_with_received_quantity_exceeding_ordered_quantity(self):
        data = {
            "grn_no": "TEST-GRN-OVER-RECEIVE",
            "po_id": self.approved_po.id,
            "supplier_id": self.active_supplier.id,
            "warehouse_id": 1,
            "status": "DRAFT",
            "items": [
                {
                    "product_id": self.active_product.id,
                    "received_qty": 120,
                    "batch_id": 1,
                    "serial_id": None,
                }
            ],
        }

        response = self.client.post(
            "/api/receiving/grns/",
            data,
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "exceeds the ordered quantity",
            str(response.data["errors"]["items"])
        )
        self.assertFalse(
            GRN.objects.filter(
                grn_no="TEST-GRN-OVER-RECEIVE"
            ).exists()
        )


    def test_cumulative_quantity_exceeding_po_is_rejected(self):
        # First GRN receives 60 out of 100 units.
        first_payload = {
            "grn_no": "TEST-GRN-CUM-001",
            "po_id": self.approved_po.id,
            "supplier_id": self.active_supplier.id,
            "warehouse_id": 1,
            "status": "DRAFT",
            "items": [
                {
                    "product_id": self.active_product.id,
                    "received_qty": 60,
                    "batch_id": 1,
                    "serial_id": None,
                }
            ],
        }

        first_response = self.client.post(
            "/api/receiving/grns/",
            first_payload,
            format="json",
        )
        self.assertEqual(first_response.status_code, 201)

        # Only 40 units remain, so requesting 41 must fail.
        second_payload = {
            "grn_no": "TEST-GRN-CUM-002",
            "po_id": self.approved_po.id,
            "supplier_id": self.active_supplier.id,
            "warehouse_id": 1,
            "status": "DRAFT",
            "items": [
                {
                    "product_id": self.active_product.id,
                    "received_qty": 41,
                    "batch_id": 1,
                    "serial_id": None,
                }
            ],
        }

        second_response = self.client.post(
            "/api/receiving/grns/",
            second_payload,
            format="json",
        )
        self.assertEqual(second_response.status_code, 400)

    def test_partial_receiving_across_multiple_grns_is_allowed(self):
        # First GRN receives 60 units.
        first_payload = {
            "grn_no": "TEST-GRN-PART-001",
            "po_id": self.approved_po.id,
            "supplier_id": self.active_supplier.id,
            "warehouse_id": 1,
            "status": "DRAFT",
            "items": [
                {
                    "product_id": self.active_product.id,
                    "received_qty": 60,
                    "batch_id": 1,
                    "serial_id": None,
                }
            ],
        }

        first_response = self.client.post(
            "/api/receiving/grns/",
            first_payload,
            format="json",
        )
        self.assertEqual(first_response.status_code, 201)

        # The remaining 40 units should be allowed.
        second_payload = {
            "grn_no": "TEST-GRN-PART-002",
            "po_id": self.approved_po.id,
            "supplier_id": self.active_supplier.id,
            "warehouse_id": 1,
            "status": "DRAFT",
            "items": [
                {
                    "product_id": self.active_product.id,
                    "received_qty": 40,
                    "batch_id": 1,
                    "serial_id": None,
                }
            ],
        }

        second_response = self.client.post(
            "/api/receiving/grns/",
            second_payload,
            format="json",
        )
        self.assertEqual(second_response.status_code, 201)
    def test_eligible_pos_returns_only_approved_orders(self):
        response = self.client.get(
            "/api/receiving/eligible-pos/"
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["success"])

        returned_po_ids = [
            po["id"]
            for po in response.data["data"]
        ]

        self.assertIn(
            self.approved_po.id,
            returned_po_ids,
        )

        self.assertNotIn(
            self.draft_po.id,
            returned_po_ids,
        )

    def test_create_grn_without_supplier_id(self):
        data = {
            "grn_no": "TEST-GRN-NO-SUPPLIER",
            "po_id": self.approved_po.id,
            "warehouse_id": 1,
            "status": "DRAFT",
            "items": [
                {
                    "product_id": self.active_product.id,
                    "received_qty": 10,
                    "batch_id": 1,
                    "serial_id": None,
                }
            ],
        }

        response = self.client.post(
            "/api/receiving/grns/",
            data,
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "supplier_id",
            response.data["errors"],
        )
        self.assertFalse(
            GRN.objects.filter(
                grn_no="TEST-GRN-NO-SUPPLIER"
            ).exists()
        )

    def test_duplicate_product_lines_exceeding_po_quantity_are_rejected(self):
        data = {
            "grn_no": "TEST-GRN-DUPLICATE-PRODUCT-LINES",
            "po_id": self.approved_po.id,
            "supplier_id": self.active_supplier.id,
            "warehouse_id": 1,
            "status": "DRAFT",
            "items": [
                {
                    "product_id": self.active_product.id,
                    "received_qty": 60,
                    "batch_id": 1,
                    "serial_id": None,
                },
                {
                    "product_id": self.active_product.id,
                    "received_qty": 50,
                    "batch_id": 2,
                    "serial_id": None,
                },
            ],
        }

        response = self.client.post(
            "/api/receiving/grns/",
            data,
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "exceeds the ordered quantity",
            str(response.data["errors"]["items"]),
        )
        self.assertFalse(
            GRN.objects.filter(
                grn_no="TEST-GRN-DUPLICATE-PRODUCT-LINES"
            ).exists()
        )

    def test_create_grn_with_product_not_in_po(self):
        data = {
            "grn_no": "TEST-GRN-PRODUCT-NOT-IN-PO",
            "po_id": self.approved_po.id,
            "supplier_id": self.active_supplier.id,
            "warehouse_id": 1,
            "status": "DRAFT",
            "items": [
                {
                    "product_id": self.unordered_product.id,
                    "received_qty": 10,
                    "batch_id": 1,
                    "serial_id": None,
                }
            ],
        }

        response = self.client.post(
            "/api/receiving/grns/",
            data,
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "does not belong to Purchase Order",
            str(response.data["errors"]["items"]),
        )
        self.assertFalse(
            GRN.objects.filter(
                grn_no="TEST-GRN-PRODUCT-NOT-IN-PO"
            ).exists()
        )
