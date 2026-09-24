from django.db import models


class SalesOrder(models.Model):
    STATUS_CHOICES = [
        ("DRAFT", "Draft"),
        ("CONFIRMED", "Confirmed"),
        ("RESERVED", "Reserved"),
         ("PICKING", "Picking"),
        ("READY_FOR_DISPATCH", "Ready for Dispatch"),
        ("DISPATCHED", "Dispatched"),
         ("COMPLETED", "Completed"),
        ("CANCELLED", "Cancelled"),
    ]

    so_no = models.CharField(max_length=50, unique=True)
    # Customer IDs will be validated against the Customer data/API.
    customer_id = models.IntegerField()
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="DRAFT"
    )
    order_date = models.DateTimeField(auto_now_add=True)
    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
     )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class SalesOrderItem(models.Model):
    sales_order = models.ForeignKey(
        SalesOrder,
        on_delete=models.CASCADE,
        related_name="items"
    )
    #Product IDs are validated against Employee 1's Product API
    product_id = models.IntegerField()
    ordered_qty = models.PositiveIntegerField()
    unit_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )
    item_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )
    reserved_qty = models.PositiveIntegerField(default=0)
    dispatched_qty = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)