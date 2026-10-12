from django.db import models


class TemporaryProduct(models.Model):
    product_code = models.CharField(
        max_length=50,
        unique=True
    )

    product_name = models.CharField(
        max_length=200
    )

    status = models.CharField(
        max_length=30,
        default="ACTIVE"
    )

    class Meta:
        db_table = "temporary_products"

    def __str__(self):
        return self.product_code


class TemporarySupplier(models.Model):
    supplier_code = models.CharField(
        max_length=50,
        unique=True
    )

    supplier_name = models.CharField(
        max_length=200
    )

    status = models.CharField(
        max_length=30,
        default="ACTIVE"
    )

    class Meta:
        db_table = "temporary_suppliers"

    def __str__(self):
        return self.supplier_code


class GRN(models.Model):
    STATUS_CHOICES = [
        ("DRAFT", "Draft"),
        ("RECEIVED", "Received"),
    ]

    grn_no = models.CharField(
        max_length=50,
        unique=True
    )

    po_id = models.IntegerField()

    warehouse_id = models.IntegerField()

    supplier_id = models.IntegerField(
        null=True,
        blank=True
    )

    receiving_date = models.DateTimeField(
        null=True,
        blank=True
    )

    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default="DRAFT"
    )

    created_by = models.IntegerField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        db_table = "grns"

    def __str__(self):
        return self.grn_no


class GRNItem(models.Model):
    grn_id = models.ForeignKey(
        GRN,
        on_delete=models.CASCADE,
        db_column="grn_id",
        related_name="items"
    )

    product_id = models.IntegerField()

    received_qty = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    batch_id = models.IntegerField(
        null=True,
        blank=True
    )

    serial_id = models.IntegerField(
        null=True,
        blank=True
    )

    class Meta:
        db_table = "grn_items"

    def __str__(self):
        return (
            f"{self.grn_id.grn_no} - "
            f"Product {self.product_id}"
        )