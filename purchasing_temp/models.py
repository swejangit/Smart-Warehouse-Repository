from django.db import models


class TemporaryPurchaseOrder(models.Model):
    po_no = models.CharField(max_length=50, unique=True)
    supplier_id = models.IntegerField()
    status = models.CharField(max_length=30, default="APPROVED")
    order_date = models.DateField()

    class Meta:
        db_table = "temporary_purchase_orders"

    def __str__(self):
        return self.po_no

class TemporaryPurchaseOrderItem(models.Model):
    purchase_order = models.ForeignKey(
        TemporaryPurchaseOrder,
        on_delete=models.CASCADE,
        related_name="items",
        db_column="po_id"
    )
    product_id = models.IntegerField()
    ordered_qty = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    class Meta:
        db_table = "temporary_purchase_order_items"

    def __str__(self):
        return f"{self.purchase_order.po_no} - Product {self.product_id}"