
from django.test import TestCase
from rest_framework.test import APIClient

from purchasing_temp.models import TemporaryPurchaseOrder
from .models import GRN, TemporaryProduct, TemporarySupplier


class GRNTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.active_product = TemporaryProduct.objects.create(
            product_code="TEST-PROD-001",
            product_name="Test Laptop",
            status="ACTIVE"
        )

        self.inactive_product = TemporaryProduct.objects.create(
            product_code="TEST-PROD-002",
            product_name="Inactive Product",
            status="INACTIVE"
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

        self.approved_po = TemporaryPurchaseOrder.objects.create(
            po_no="TEST-PO-001",
            supplier_id=101,
            status="APPROVED",
            order_date="2026-09-16"
        )

        self.draft_po = TemporaryPurchaseOrder.objects.create(
            po_no="TEST-PO-002",
            supplier_id=102,
            status="DRAFT",
            order_date="2026-09-16"
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
        self.assertTrue(response.data["success"])

        self.assertTrue(
            GRN.objects.filter(grn_no="TEST-GRN-001").exists()
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
        self.assertGreaterEqual(len(response.data["data"]), 1)

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